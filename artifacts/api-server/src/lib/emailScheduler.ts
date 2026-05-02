import cron from "node-cron";
import { db, usersTable, auditsTable } from "@workspace/db";
import { sql, and, isNotNull, eq, gte, lte } from "drizzle-orm";
import { getUserPlan } from "./planUtils";
import { EmailService } from "./emailService";
import { logger } from "./logger";

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
      const ok = await EmailService.sendWelcomeD3(user.email, firstName);
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
      const ok = await EmailService.sendWelcomeD7(user.email, firstName);
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

    const ok = await EmailService.sendWeeklyDigest(user.email, {
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
    });

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

    const ok = await EmailService.sendMonthlyReport(user.email, {
      firstName,
      month: label,
      totalAudits: monthAudits.length,
      avgScore,
      bestScore: best.geoScore * 100,
      topUrl: best.url,
      quickWins: uniqueWins,
    });

    if (ok) {
      await db
        .update(usersTable)
        .set({ lastMonthlyReportAt: new Date() })
        .where(eq(usersTable.id, user.id));
    }
  }
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

  logger.info("Email scheduler started (welcome series, weekly digest, monthly report)");
}
