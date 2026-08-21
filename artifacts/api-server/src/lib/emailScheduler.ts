import cron from "node-cron";
import { db, pool, usersTable, auditsTable, recommendationProgressTable } from "@workspace/db";
import { sql, and, isNotNull, eq, gte, lte } from "drizzle-orm";
import { getUserPlan, getStoredPlan, trialEndFor } from "./planUtils";
import { EmailService } from "./emailService";
import { runDueMonitoredSites } from "./monitoring";
import { runDueSeoRankSnapshots } from "./seoTrackingScheduler";
import { logger } from "./logger";

// Cron-driven sends have no inbound HTTP request to derive a base URL from,
// so we use the configured FRONTEND_URL (preferred in prod) or fall back to
// the production domain.
const SCHEDULER_BASE_URL = (process.env.FRONTEND_URL || "https://aeoimprovement.com").replace(/\/$/, "");

async function withSchedulerLock(name: string, job: () => Promise<void>): Promise<void> {
  const client = await pool.connect();
  try {
    const result = await client.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_lock(hashtext($1)) AS acquired",
      [`aeo-email:${name}`],
    );
    if (!result.rows[0]?.acquired) {
      logger.info({ job: name }, "Email scheduler job already running on another instance");
      return;
    }
    try {
      await job();
    } finally {
      await client.query("SELECT pg_advisory_unlock(hashtext($1))", [`aeo-email:${name}`]);
    }
  } finally {
    client.release();
  }
}

function unsubUrl(token: string | null | undefined): string | undefined {
  return token ? `${SCHEDULER_BASE_URL}/api/auth/unsubscribe?token=${token}` : undefined;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function monthName(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getFirstName(user: { firstName?: string | null; email?: string | null }): string {
  return user.firstName || user.email?.split("@")[0] || "";
}

// ── Welcome series (runs daily at 9:00 AM UTC) ───────────────────────────────
async function runWelcomeSeries() {
  logger.info("Email scheduler: running welcome series check");

  // Only email users who have actually verified their address. Sending the
  // follow-up cadence to unverified accounts wastes Postmark quota and hurts
  // sender reputation.
  const users = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.emailOptOut, false),
        eq(usersTable.emailVerified, true),
        isNotNull(usersTable.email),
      ),
    );

  for (const user of users) {
    if (!user.email) continue;
    const firstName = getFirstName(user);

    if (
      user.welcomeEmailSentAt &&
      !user.welcomeD3SentAt &&
      new Date(user.welcomeEmailSentAt) <= daysAgo(3)
    ) {
      const ok = await EmailService.sendWelcomeD3(user.email, firstName, !!user.firstAuditAt, unsubUrl(user.unsubscribeToken));
      if (ok) {
        await db
          .update(usersTable)
          .set({ welcomeD3SentAt: new Date() })
          .where(eq(usersTable.id, user.id));
      }
    }

    if (
      user.welcomeEmailSentAt &&
      !user.welcomeD7SentAt &&
      new Date(user.welcomeEmailSentAt) <= daysAgo(7)
    ) {
      // The D7 email nudges free-month users toward Pro. Don't send it to
      // users already PAYING for Pro or Agency — at best it's noise, at worst
      // it makes us look like we don't know who our paying customers are.
      // Stored plan, not effective plan: during the free first month every
      // user's effective plan is the top tier, which would skip everyone.
      const plan = await getStoredPlan(user.id);
      if (plan !== "free") {
        // Mark it "sent" anyway so we don't keep re-checking this user every
        // day for the rest of time.
        await db
          .update(usersTable)
          .set({ welcomeD7SentAt: new Date() })
          .where(eq(usersTable.id, user.id));
        continue;
      }

      const ok = await EmailService.sendWelcomeD7(user.email, firstName, unsubUrl(user.unsubscribeToken));
      if (ok) {
        await db
          .update(usersTable)
          .set({ welcomeD7SentAt: new Date() })
          .where(eq(usersTable.id, user.id));
      }
    }
  }
}

// ── Free-first-month lifecycle (runs daily at 10:00 AM UTC) ─────────────────
// Two sends, each at most once per user (flag columns claimed atomically):
//   1. Reminder — all-access month ends in ≤3 days.
//   2. Ended — all-access month lapsed; you're on the free plan now.
// Only stored-free users qualify: someone who subscribed mid-month has
// nothing expiring. The "ended" send is bounded to trials that lapsed in
// the LAST 7 DAYS so legacy accounts (whose derived trial ended long ago)
// are never mass-mailed on the day this feature ships.
async function runTrialLifecycle() {
  logger.info("Email scheduler: running trial lifecycle check");

  const now = new Date();
  const users = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.emailOptOut, false),
        eq(usersTable.emailVerified, true),
        isNotNull(usersTable.email),
        eq(usersTable.plan, "free"),
      ),
    );

  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  for (const user of users) {
    if (!user.email) continue;
    const firstName = getFirstName(user);
    const end = trialEndFor(user);
    const msLeft = end.getTime() - now.getTime();

    // One-time launch announcement for accounts that got the promo grant
    // (see lib/promoGrant.ts). Only while the window is still open — a
    // stale flag after the window closed would announce something untrue.
    if (user.trialPromoGrantedAt && !user.trialPromoEmailSentAt && msLeft > 0) {
      const claim = await db
        .update(usersTable)
        .set({ trialPromoEmailSentAt: now })
        .where(and(eq(usersTable.id, user.id), sql`trial_promo_email_sent_at IS NULL`))
        .returning({ id: usersTable.id });
      if (claim.length !== 1) continue;
      const ok = await EmailService.sendFreeMonthPromo(user.email, firstName, end, unsubUrl(user.unsubscribeToken));
      if (!ok) {
        await db.update(usersTable).set({ trialPromoEmailSentAt: null }).where(eq(usersTable.id, user.id));
      }
      continue; // never stack the promo announcement with a reminder same-day
    }

    if (!user.trialReminderSentAt && msLeft > 0 && msLeft <= THREE_DAYS) {
      // Claim the flag BEFORE sending (UPDATE … WHERE still-null) so a
      // second scheduler instance or overlapping run can't double-send;
      // roll back on failure so tomorrow's run retries.
      const claim = await db
        .update(usersTable)
        .set({ trialReminderSentAt: now })
        .where(and(eq(usersTable.id, user.id), sql`trial_reminder_sent_at IS NULL`))
        .returning({ id: usersTable.id });
      if (claim.length !== 1) continue;
      const ok = await EmailService.sendTrialEndingSoon(user.email, firstName, end, unsubUrl(user.unsubscribeToken));
      if (!ok) {
        await db.update(usersTable).set({ trialReminderSentAt: null }).where(eq(usersTable.id, user.id));
      }
      continue; // never send reminder + ended on the same day
    }

    if (!user.trialEndedSentAt && msLeft <= 0 && msLeft > -SEVEN_DAYS) {
      const claim = await db
        .update(usersTable)
        .set({ trialEndedSentAt: now })
        .where(and(eq(usersTable.id, user.id), sql`trial_ended_sent_at IS NULL`))
        .returning({ id: usersTable.id });
      if (claim.length !== 1) continue;
      const ok = await EmailService.sendTrialEnded(user.email, firstName, unsubUrl(user.unsubscribeToken));
      if (!ok) {
        await db.update(usersTable).set({ trialEndedSentAt: null }).where(eq(usersTable.id, user.id));
      }
    }
  }
}

// ── Weekly digest for Pro / Agency (runs every Monday at 8:00 AM UTC) ────────
async function runWeeklyDigests() {
  logger.info("Email scheduler: running weekly digest");

  const oneWeekAgo = daysAgo(7);
  const users = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.emailOptOut, false), isNotNull(usersTable.email)));

  for (const user of users) {
    if (!user.email) continue;

    const plan = await getUserPlan(user.id);
    if (plan === "free") continue;

    const weekAudits = await db
      .select()
      .from(auditsTable)
      .where(
        and(
          eq(auditsTable.userId, user.id),
          gte(auditsTable.createdAt, oneWeekAgo)
        )
      )
      .orderBy(sql`${auditsTable.createdAt} DESC`)
      .limit(10);

    const latestAudit = weekAudits[0];
    const firstName = getFirstName(user);
    let nextAction: { title: string; detail: string } | undefined;
    if (latestAudit) {
      const domain = (() => { try { return new URL(latestAudit.url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; } })();
      const completed = domain ? await db.select({ recommendationId: recommendationProgressTable.recommendationId })
        .from(recommendationProgressTable)
        .where(and(eq(recommendationProgressTable.userId, user.id), eq(recommendationProgressTable.domain, domain))) : [];
      const done = new Set(completed.map((row) => row.recommendationId));
      const rec = ((latestAudit.recommendations as any[]) ?? []).find((item) =>
        item?.id && !done.has(item.id) && (item.priority === "critical" || item.priority === "high"),
      );
      if (rec) nextAction = { title: String(rec.title), detail: String(rec.detail) };
    }

    const ok = await EmailService.sendWeeklyDigest(
      user.email,
      {
        firstName,
        auditCount: weekAudits.length,
        latestAudit: latestAudit
          ? {
              url: latestAudit.url,
              geoScore: latestAudit.geoScore,
              quickWins: (latestAudit.quickWins as string[]) ?? [],
              nextAction,
              createdAt: latestAudit.createdAt,
            }
          : undefined,
      },
      unsubUrl(user.unsubscribeToken),
    );

    if (ok) {
      await db
        .update(usersTable)
        .set({ lastWeeklyReportAt: new Date() })
        .where(eq(usersTable.id, user.id));
    }
  }
}

// ── Monthly report for Agency (runs 1st of each month at 8:00 AM UTC) ────────
async function runMonthlyReports() {
  logger.info("Email scheduler: running monthly report");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const label = monthName(monthStart);

  const users = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.emailOptOut, false), isNotNull(usersTable.email)));

  for (const user of users) {
    if (!user.email) continue;

    const plan = await getUserPlan(user.id);
    if (plan !== "agency") continue;

    const monthAudits = await db
      .select()
      .from(auditsTable)
      .where(
        and(
          eq(auditsTable.userId, user.id),
          gte(auditsTable.createdAt, monthStart),
          lte(auditsTable.createdAt, monthEnd)
        )
      )
      .orderBy(sql`${auditsTable.geoScore} DESC`);

    if (monthAudits.length === 0) continue;

    const avgScore =
      monthAudits.reduce((s, a) => s + a.geoScore, 0) / monthAudits.length;
    const best = monthAudits[0];
    const allWins = monthAudits.flatMap((a) => (a.quickWins as string[]) ?? []);
    const uniqueWins = [...new Set(allWins)];

    const firstName = getFirstName(user);

    const ok = await EmailService.sendMonthlyReport(
      user.email,
      {
        firstName,
        month: label,
        totalAudits: monthAudits.length,
        avgScore,
        bestScore: best.geoScore,
        topUrl: best.url,
        quickWins: uniqueWins,
      },
      unsubUrl(user.unsubscribeToken),
    );

    if (ok) {
      await db
        .update(usersTable)
        .set({ lastMonthlyReportAt: new Date() })
        .where(eq(usersTable.id, user.id));
    }
  }
}

// ── Weekly AEO Insights for ALL users (Thursdays 9:00 AM UTC) ────────────────
// Free users get nothing weekly otherwise — this is the one recurring
// touchpoint that delivers educational value rather than asking for the
// upgrade. Paid users get it too: it's distinct content from their personal
// weekly digest, and it keeps engagement up between audits.
//
// Topic rotates by ISO week-of-year so a recipient sees a different topic
// each week and only repeats after the full library cycles (~6 weeks).
//
// Gated to users who are >= 8 days past account creation so the welcome
// series (D0/D3/D7) finishes before the recurring cadence kicks in —
// otherwise a Wednesday signup would receive their D3 and an Insights
// email on the same Thursday.
function isoWeekOfYear(d: Date): number {
  // Stable per-week index; uses UTC so cron timezone shifts don't reorder topics.
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstThursdayDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDayNum + 3);
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

async function runWeeklyInsights() {
  logger.info("Email scheduler: running weekly AEO insights");

  const eightDaysAgo = daysAgo(8);
  const users = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.emailOptOut, false),
        eq(usersTable.emailVerified, true),
        isNotNull(usersTable.email),
        lte(usersTable.createdAt, eightDaysAgo),
      ),
    );

  const weekIndex = isoWeekOfYear(new Date());
  let sent = 0;
  for (const user of users) {
    if (!user.email) continue;
    const firstName = getFirstName(user);
    const ok = await EmailService.sendWeeklyInsights(
      user.email,
      firstName,
      weekIndex,
      unsubUrl(user.unsubscribeToken),
    );
    if (ok) sent++;
  }
  logger.info({ sent, weekIndex, total: users.length }, "Weekly insights complete");
}

// ── Prompt-simulation follow-up (daily) ───────────────────────────────────────
async function runSimulationFollowUps() {
  logger.info("Email scheduler: running prompt-simulation follow-up");

  // Each eligible audit appears in one 24-hour window, so this sends one
  // reminder without adding another tracking column or a migration. It is
  // audit-specific: a different completed simulation does not suppress it.
  const result = await db.execute(sql`
    SELECT DISTINCT ON (a.user_id)
      a.id AS audit_id,
      a.url,
      u.email,
      u.first_name,
      u.unsubscribe_token
    FROM audits a
    INNER JOIN users u ON u.id = a.user_id
    WHERE a.user_id IS NOT NULL
      AND u.email_verified = true
      AND u.email_opt_out = false
      AND u.email IS NOT NULL
      AND a.created_at <= NOW() - INTERVAL '24 hours'
      AND a.created_at > NOW() - INTERVAL '48 hours'
      AND NOT EXISTS (
        SELECT 1
        FROM prompt_simulations ps
        WHERE ps.audit_id = a.id
          AND ps.user_id = a.user_id
          AND ps.status = 'complete'
      )
    ORDER BY a.user_id, a.created_at DESC
  `);

  let sent = 0;
  for (const row of result.rows as Array<{
    audit_id: number;
    url: string;
    email: string;
    first_name: string | null;
    unsubscribe_token: string | null;
  }>) {
    const ok = await EmailService.sendSimulationReminder(
      row.email,
      row.first_name || row.email.split("@")[0] || "",
      row.url,
      Number(row.audit_id),
      unsubUrl(row.unsubscribe_token),
    );
    if (ok) sent++;
  }
  logger.info({ sent, eligible: result.rows.length }, "Prompt-simulation follow-up complete");
}

// ── Start all schedules ───────────────────────────────────────────────────────
export function startEmailScheduler() {
  // Continuous monitoring sweep runs independently of email config — the
  // re-audits still happen (and feed the Projects trend view) even when
  // Postmark isn't set; only the alert emails are skipped in that case.
  // Daily at 07:00 UTC; per-site cadence is enforced via nextRunAt, so weekly
  // sites are only re-audited once their week is up.
  cron.schedule("0 7 * * *", () => {
    runDueMonitoredSites().catch((err) =>
      logger.error({ err }, "Monitored-sites sweep cron error")
    );
  });
  logger.info("Monitored-sites scheduler started (daily sweep, per-site cadence)");

  // Poll daily so queued provider tasks complete promptly. Each target remains
  // on a weekly cadence, and manual refreshes are separately capped.
  cron.schedule("0 6 * * *", () => {
    runDueSeoRankSnapshots().catch((err) => logger.error({ err }, "SEO rank snapshot cron error"));
  });
  logger.info("SEO rank tracking scheduler started (daily queue poll, weekly target cadence)");

  if (!process.env.POSTMARK_API_TOKEN) {
    logger.warn("POSTMARK_API_TOKEN not set — email scheduler disabled");
    return;
  }

  cron.schedule("0 9 * * *", () => {
    withSchedulerLock("welcome", runWelcomeSeries).catch((err) =>
      logger.error({ err }, "Welcome series cron error")
    );
  });

  // 10:00 UTC — an hour after the welcome series so a user whose D7 and
  // trial reminder happen to land on the same day gets them spaced out.
  cron.schedule("0 10 * * *", () => {
    withSchedulerLock("trial", runTrialLifecycle).catch((err) =>
      logger.error({ err }, "Trial lifecycle cron error")
    );
  });

  // Also run once shortly after boot so the one-time promo announcement
  // goes out the day the promo ships instead of waiting for the next
  // 10:00 UTC cron. Safe to run on every deploy: all sends in the job are
  // claim-first flagged, so repeat runs are no-ops.
  setTimeout(() => {
    withSchedulerLock("trial", runTrialLifecycle).catch((err) =>
      logger.error({ err }, "Trial lifecycle startup run error")
    );
  }, 60_000);

  // One day after an audit, remind users only when that audit has not yet
  // been simulated. The job's 24-hour eligibility window prevents repeats.
  cron.schedule("0 11 * * *", () => {
    withSchedulerLock("simulation-followup", runSimulationFollowUps).catch((err) =>
      logger.error({ err }, "Prompt-simulation follow-up cron error")
    );
  });

  cron.schedule("0 8 * * 1", () => {
    withSchedulerLock("weekly-digest", runWeeklyDigests).catch((err) =>
      logger.error({ err }, "Weekly digest cron error")
    );
  });

  cron.schedule("0 8 1 * *", () => {
    withSchedulerLock("monthly-report", runMonthlyReports).catch((err) =>
      logger.error({ err }, "Monthly report cron error")
    );
  });

  // Thursdays 9:00 AM UTC — far enough from the Monday digest to feel like
  // a separate touchpoint, mid-week so it lands during planning windows.
  cron.schedule("0 9 * * 4", () => {
    withSchedulerLock("weekly-insights", runWeeklyInsights).catch((err) =>
      logger.error({ err }, "Weekly insights cron error")
    );
  });

  logger.info("Email scheduler started (welcome series, trial lifecycle, weekly digest, monthly report, weekly insights)");
}
