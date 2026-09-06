import { and, eq, lte, or, isNull, asc } from "drizzle-orm";
import { db, pool, monitoredSitesTable, recommendationProgressTable, usersTable, type MonitoredSite } from "@workspace/db";
import { runAndStoreAudit } from "./auditRunner";
import { getUserPlan, PLAN_LIMITS } from "./planUtils";
import { EmailService } from "./emailService";
import { logger } from "./logger";
import { PushService } from "./pushService";
import { selectPersonalizedAction } from "./personalizedAction";
import { materialMonitoringPush } from "./pushPayload";

const log = logger.child({ module: "monitoring" });

// A GEO score move of >= this many points is "material" — worth an alert email.
// Matches the threshold used for manual re-audits so the two paths feel the same.
export const SCORE_ALERT_THRESHOLD = 5;

const FREQUENCY_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

/** Next scheduled run for a cadence, measured from `from` (default now). */
export function nextRunFrom(frequency: string, from: Date = new Date()): Date {
  const ms = FREQUENCY_MS[frequency] ?? FREQUENCY_MS.weekly;
  return new Date(from.getTime() + ms);
}

export interface MonitoredRunResult {
  auditId: number;
  score: number;
  prevScore: number | null;
  delta: number | null;
  emailed: boolean;
}

/**
 * Re-audit a single monitored site, persist the result, advance its schedule,
 * and email the owner a score-change alert when the GEO score moved materially.
 * Shared by the daily scheduler and the "Run now" route so both behave the same.
 *
 * If the owner is no longer on a paid plan the site is deactivated instead of
 * audited (a downgraded user should not keep consuming scheduled audits).
 */
export async function runMonitoredSite(site: MonitoredSite): Promise<MonitoredRunResult | null> {
  const plan = await getUserPlan(site.userId);
  if (PLAN_LIMITS[plan].monitoredSites === 0) {
    await db.update(monitoredSitesTable)
      .set({ active: false })
      .where(eq(monitoredSitesTable.id, site.id));
    log.info({ siteId: site.id, userId: site.userId, plan }, "monitor.deactivated (plan no longer eligible)");
    return null;
  }

  const prevScore = site.lastScore;
  const stored = await runAndStoreAudit(site.userId, site.url);
  const curr = Math.round(stored.geoScore);

  // Advance the schedule and record the latest result.
  await db.update(monitoredSitesTable)
    .set({
      lastAuditId: stored.id,
      lastScore: stored.geoScore,
      lastRunAt: new Date(),
      nextRunAt: nextRunFrom(site.frequency),
    })
    .where(eq(monitoredSitesTable.id, site.id));

  let emailed = false;
  const delta = prevScore === null ? null : curr - Math.round(prevScore);

  if (delta !== null && Math.abs(delta) >= SCORE_ALERT_THRESHOLD) {
    try {
      const [u] = await db
        .select({
          email: usersTable.email,
          firstName: usersTable.firstName,
          unsubscribeToken: usersTable.unsubscribeToken,
          emailOptOut: usersTable.emailOptOut,
        })
        .from(usersTable)
        .where(eq(usersTable.id, site.userId));
      if (u?.email && !u.emailOptOut) {
        const topRec = (stored.analysis.recommendations ?? [])
          .filter((r) => r.priority === "critical" || r.priority === "high")[0];
        const topRecommendationText = topRec ? `${topRec.title}: ${topRec.detail}` : null;
        const baseUrl = process.env.FRONTEND_URL || "https://aeoimprovement.com";
        const unsubscribeUrl = `${baseUrl}/api/auth/unsubscribe?token=${u.unsubscribeToken}`;
        await EmailService.sendScoreChanged(
          u.email, u.firstName || "", site.url, prevScore as number, curr, topRecommendationText, String(stored.id), unsubscribeUrl,
        );
        emailed = true;
      }
    } catch (err) {
      log.error({ err, siteId: site.id }, "monitor.score-changed email failed");
    }

    try {
      const domain = new URL(site.url).hostname.toLowerCase().replace(/^www\./, "");
      const completedRows = await db.select({ id: recommendationProgressTable.recommendationId })
        .from(recommendationProgressTable)
        .where(and(eq(recommendationProgressTable.userId, site.userId), eq(recommendationProgressTable.domain, domain)));
      const next = selectPersonalizedAction(stored.analysis.recommendations ?? [], new Set(completedRows.map(row => row.id)));
      await PushService.sendToUser(site.userId, materialMonitoringPush(stored.id, next));
    } catch (err) {
      log.warn({ err, siteId: site.id }, "monitor.score-changed browser notification failed");
    }
  }

  log.info({ siteId: site.id, url: site.url, prevScore, curr, delta, emailed }, "monitor.run.complete");
  return { auditId: stored.id, score: curr, prevScore, delta, emailed };
}

/**
 * Scheduler sweep: re-audit every active monitored site that is due (nextRunAt
 * in the past, or never set). Runs sequentially with a per-sweep cap so a large
 * fleet can't stampede the audit pipeline; remaining due sites are picked up on
 * the next sweep. Each site is isolated — one failure never aborts the sweep.
 */
export async function runDueMonitoredSites(maxPerSweep = 50): Promise<void> {
  // Replit autoscale can run several API instances. A session-level advisory
  // lock ensures only one instance performs a sweep at a time.
  const lockClient = await pool.connect();
  const lockKey = 1_947_026_071;
  const lock = await lockClient.query<{ locked: boolean }>("SELECT pg_try_advisory_lock($1) AS locked", [lockKey]);
  if (!lock.rows[0]?.locked) {
    lockClient.release();
    log.info("monitor.sweep.skipped (another instance holds the lock)");
    return;
  }
  try {
  const now = new Date();
  const due = await db
    .select()
    .from(monitoredSitesTable)
    .where(and(
      eq(monitoredSitesTable.active, true),
      or(isNull(monitoredSitesTable.nextRunAt), lte(monitoredSitesTable.nextRunAt, now)),
    ))
    .orderBy(asc(monitoredSitesTable.nextRunAt))
    .limit(maxPerSweep);

  if (due.length === 0) return;
  log.info({ count: due.length }, "monitor.sweep.start");

  let ok = 0, failed = 0;
  for (const site of due) {
    try {
      await runMonitoredSite(site);
      ok++;
    } catch (err) {
      failed++;
      log.error({ err, siteId: site.id }, "monitor.run.failed");
      // Still advance the schedule so a permanently-failing site doesn't get
      // retried every single sweep.
      await db.update(monitoredSitesTable)
        .set({ lastRunAt: now, nextRunAt: nextRunFrom(site.frequency, now) })
        .where(eq(monitoredSitesTable.id, site.id))
        .catch(() => { /* best-effort */ });
    }
  }
  log.info({ ok, failed }, "monitor.sweep.complete");
  } finally {
    await lockClient.query("SELECT pg_advisory_unlock($1)", [lockKey]).catch(() => undefined);
    lockClient.release();
  }
}
