import cron from "node-cron";
import { db, usersTable, auditsTable } from "@workspace/db";
import { sql, and, isNotNull, eq, gte, lte } from "drizzle-orm";
import { getUserPlan } from "./planUtils";
import { EmailService } from "./emailService";
import { logger } from "./logger";

// Cron-driven sends have no inbound HTTP request to derive a base URL from,
// so we use the configured FRONTEND_URL (preferred in prod) or fall back to
// the production domain.
const SCHEDULER_BASE_URL = (process.env.FRONTEND_URL || "https://aeoimprovement.com").replace(/\/$/, "");

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
      new Date(user.createdAt) <= daysAgo(3)
    ) {
      const ok = await EmailService.sendWelcomeD3(user.email, firstName, unsubUrl(user.unsubscribeToken));
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
      new Date(user.createdAt) <= daysAgo(7)
    ) {
      // The D7 email pitches Pro. Don't send it to users already on Pro or
      // Agency — at best it's noise, at worst it makes us look like we don't
      // know who our paying customers are.
      const plan = await getUserPlan(user.id);
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
      monthAudits.reduce((s, a) => s + a.geoScore * 100, 0) / monthAudits.length;
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
        bestScore: best.geoScore * 100,
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

// ── Start all schedules ───────────────────────────────────────────────────────
export function startEmailScheduler() {
  if (!process.env.POSTMARK_API_TOKEN) {
    logger.warn("POSTMARK_API_TOKEN not set — email scheduler disabled");
    return;
  }

  cron.schedule("0 9 * * *", () => {
    runWelcomeSeries().catch((err) =>
      logger.error({ err }, "Welcome series cron error")
    );
  });

  cron.schedule("0 8 * * 1", () => {
    runWeeklyDigests().catch((err) =>
      logger.error({ err }, "Weekly digest cron error")
    );
  });

  cron.schedule("0 8 1 * *", () => {
    runMonthlyReports().catch((err) =>
      logger.error({ err }, "Monthly report cron error")
    );
  });

  // Thursdays 9:00 AM UTC — far enough from the Monday digest to feel like
  // a separate touchpoint, mid-week so it lands during planning windows.
  cron.schedule("0 9 * * 4", () => {
    runWeeklyInsights().catch((err) =>
      logger.error({ err }, "Weekly insights cron error")
    );
  });

  logger.info("Email scheduler started (welcome series, weekly digest, monthly report, weekly insights)");
}
