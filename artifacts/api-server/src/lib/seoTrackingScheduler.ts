import { asc, eq, and, or, isNull, lte } from "drizzle-orm";
import { db, pool, seoKeywordTargetsTable, seoRankSnapshotsTable, seoRankTasksTable } from "@workspace/db";
import { collectQueuedWeeklyRank, isDataForSeoConfigured, submitWeeklyRankTask } from "./dataforseoRankTracker";
import { getStoredPlan, PLAN_LIMITS } from "./planUtils";
import { logger } from "./logger";
import { buildRankEligibilityQuery } from "./seoTrackingQueries";

const log = logger.child({ module: "seoTracking" });

/** Collect one bounded weekly snapshot per active paid target. Previous data is
 * never overwritten when the provider is unavailable. */
export async function runDueSeoRankSnapshots(maxPerSweep = 100): Promise<number> {
  if (!isDataForSeoConfigured()) {
    log.info("seo.weekly-snapshot.skipped-provider-not-configured");
    return 0;
  }
  const client = await pool.connect();
  try {
    const locked = await client.query<{ locked: boolean }>("SELECT pg_try_advisory_lock($1) AS locked", [1_947_026_072]);
    if (!locked.rows[0]?.locked) { log.info("seo.weekly-snapshot.skipped-lock-held"); return 0; }
    try {
      const queued = await db.select({ task: seoRankTasksTable, target: seoKeywordTargetsTable }).from(seoRankTasksTable)
        .innerJoin(seoKeywordTargetsTable, eq(seoRankTasksTable.targetId, seoKeywordTargetsTable.id))
        .where(and(eq(seoRankTasksTable.status, "queued"), or(isNull(seoRankTasksTable.checkedAt), lte(seoRankTasksTable.checkedAt, new Date(Date.now() - 15 * 60_000)))))
        .orderBy(asc(seoRankTasksTable.createdAt)).limit(maxPerSweep);
      let collected = 0; let failed = 0;
      for (const { task, target } of queued) {
        try {
          // A pending provider task is checked at most once per 15 minutes,
          // even when the external scheduler processes several tiny batches.
          await db.update(seoRankTasksTable).set({ checkedAt: new Date() }).where(eq(seoRankTasksTable.id, task.id));
          const result = await collectQueuedWeeklyRank(target, task.providerTaskId);
          if (!result) continue;
          await db.insert(seoRankSnapshotsTable).values({ targetId: target.id, ...result, providerStatus: "success", collectionMode: "weekly" });
          await db.update(seoRankTasksTable).set({ status: "complete", checkedAt: new Date() }).where(eq(seoRankTasksTable.id, task.id));
          collected++;
        } catch { await db.update(seoRankTasksTable).set({ status: "failed", checkedAt: new Date() }).where(eq(seoRankTasksTable.id, task.id)); failed++; }
      }
      const targets = await db.select().from(seoKeywordTargetsTable)
        .where(buildRankEligibilityQuery())
        .orderBy(asc(seoKeywordTargetsTable.updatedAt)).limit(maxPerSweep);
      for (const target of targets) {
        const plan = await getStoredPlan(target.userId);
        if (PLAN_LIMITS[plan].seoKeywordTargets === 0) {
          await db.update(seoKeywordTargetsTable).set({ active: false, updatedAt: new Date() }).where(eq(seoKeywordTargetsTable.id, target.id));
          continue;
        }
        try {
          const providerTaskId = await submitWeeklyRankTask(target);
          await db.insert(seoRankTasksTable).values({ targetId: target.id, providerTaskId });
          await db.update(seoKeywordTargetsTable).set({ updatedAt: new Date() }).where(eq(seoKeywordTargetsTable.id, target.id));
        } catch {
          // Mark a retry point without inventing a zero rank. The absence of a
          // new snapshot is what keeps the UI explicitly stale.
          await db.update(seoKeywordTargetsTable).set({ updatedAt: new Date() }).where(eq(seoKeywordTargetsTable.id, target.id));
          failed++;
        }
      }
      log.info({ collected, failed, due: targets.length, queued: queued.length }, "seo.weekly-snapshot.complete");
      return queued.length + targets.length;
    } finally { await client.query("SELECT pg_advisory_unlock($1)", [1_947_026_072]).catch(() => undefined); }
  } finally { client.release(); }
}
