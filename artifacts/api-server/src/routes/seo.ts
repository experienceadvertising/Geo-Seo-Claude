import { Router, type IRouter } from "express";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db, seoKeywordTargetsTable, seoRankSnapshotsTable, seoRefreshUsageTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { readRateLimiter } from "../middlewares/rateLimiters";
import { currentYearMonth } from "../lib/usageLimits";
import { getStoredPlan, PLAN_LIMITS } from "../lib/planUtils";
import { collectGoogleRank, dataForSeoRequest, DataForSeoError, isDataForSeoConfigured } from "../lib/dataforseoRankTracker";
import { insightLimit, keywordKey, parseKeywordInsight, selectInsightTargets } from "../lib/seoKeywordInsights";
import { buildLatestRankSnapshotsQuery, buildLatestRankTasksQuery } from "../lib/seoTrackingQueries";
import { isPaidSeoPlan } from "../lib/seoAccess";

const router: IRouter = Router();

class SeoLimitError extends Error {}

function domainFrom(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try { return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return null; }
}
function keywordFrom(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().replace(/\s+/g, " ");
  return value.length >= 2 && value.length <= 250 ? value : null;
}
async function paidPlan(userId: string, res: any) {
  const plan = await getStoredPlan(userId);
  if (!isPaidSeoPlan(plan)) {
    res.status(403).json({ error: "SEO performance and rank tracking are paid features.", upgradeRequired: true });
    return null;
  }
  return plan;
}

router.get("/seo/overview", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const plan = await paidPlan(req.userId!, res); if (!plan) return;
  const domain = domainFrom(req.query.domain); if (!domain) { res.status(400).json({ error: "Valid domain required." }); return; }
  const [active] = await db.select({ total: count() }).from(seoKeywordTargetsTable).where(and(eq(seoKeywordTargetsTable.userId, req.userId!), eq(seoKeywordTargetsTable.domain, domain), eq(seoKeywordTargetsTable.active, true)));
  const month = currentYearMonth();
  const insightUsage = await db.execute(sql`SELECT count(*) AS total FROM seo_insight_usage WHERE user_id = ${req.userId!} AND month = ${month}`);
  const [refreshes] = await db.select({ total: count() }).from(seoRefreshUsageTable).where(and(eq(seoRefreshUsageTable.userId, req.userId!), eq(seoRefreshUsageTable.month, month)));
  res.json({ domain, plan, providerConfigured: isDataForSeoConfigured(), limits: { activeKeywords: PLAN_LIMITS[plan].seoKeywordTargets, manualRefreshes: PLAN_LIMITS[plan].manualRankRefreshes, keywordInsights: insightLimit(plan) }, usage: { activeKeywords: Number(active?.total || 0), manualRefreshes: Number(refreshes?.total || 0), keywordInsights: Number(insightUsage.rows[0]?.total || 0) } });
});

/** Explicit batch action only. Reserve account-wide units before any provider
 * request. Failed/uncertain calls keep their reservations so retries cannot
 * create unbounded spend. No scheduled jobs or GETs purchase enrichment. */
router.post("/seo/insights/refresh", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const plan = await paidPlan(req.userId!, res); if (!plan) return;
  const domain = domainFrom(req.body?.domain);
  if (!domain) { res.status(400).json({ error: "Valid domain required." }); return; }
  if (!isDataForSeoConfigured()) { res.status(503).json({ error: "Keyword insights are not connected yet. Saved data is preserved." }); return; }
  const month = currentYearMonth();
  const reserved = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`seo-insights:${req.userId!}:${month}`}))`);
    const used = await tx.execute(sql`SELECT target_id FROM seo_insight_usage WHERE user_id = ${req.userId!} AND month = ${month}`);
    const usedIds = new Set(used.rows.map(row => Number(row.target_id)));
    const targets = await tx.select().from(seoKeywordTargetsTable).where(and(eq(seoKeywordTargetsTable.userId, req.userId!), eq(seoKeywordTargetsTable.domain, domain), eq(seoKeywordTargetsTable.active, true))).orderBy(seoKeywordTargetsTable.id);
    const selected = selectInsightTargets(targets, usedIds, plan);
    for (const target of selected) await tx.execute(sql`INSERT INTO seo_insight_usage (user_id, target_id, month) VALUES (${req.userId!}, ${target.id}, ${month})`);
    return selected;
  });
  if (!reserved.length) { res.json({ updated: 0, failed: 0, message: "No eligible lookups: results may still be cached, or this month's account allowance has been used." }); return; }
  const groups = new Map<string, typeof reserved>();
  for (const target of reserved) {
    const key = `${target.locationCode}:${target.languageCode}`;
    groups.set(key, [...(groups.get(key) ?? []), target]);
  }
  let updated = 0; let failed = 0;
  // At most four location/language batches, all within the request timeout.
  await Promise.all([...groups.values()].map(async (targets) => {
    try {
      const payload = await dataForSeoRequest("/dataforseo_labs/google/keyword_overview/live", [{
        keywords: [...new Set(targets.map(target => keywordKey(target.keyword)))],
        location_code: targets[0].locationCode, language_code: targets[0].languageCode,
        include_serp_info: false, include_clickstream_data: false,
      }]);
      const task = payload?.tasks?.[0];
      if (task?.status_code !== 20000 || !Array.isArray(task.result?.[0]?.items)) throw new Error("Unusable keyword response");
      const items = new Map<string, any>(task.result[0].items.filter((item: any) => typeof item?.keyword === "string").map((item: any) => [keywordKey(item.keyword), item]));
      for (const target of targets) {
        const item = items.get(keywordKey(target.keyword));
        if (!item) { failed++; continue; }
        const insights = parseKeywordInsight(item);
        if (insights.searchVolume === null && insights.intent === null && !insights.monthlySearches.some((row: any) => row.volume !== null)) { failed++; continue; }
        await db.update(seoKeywordTargetsTable).set({ insights }).where(and(eq(seoKeywordTargetsTable.id, target.id), eq(seoKeywordTargetsTable.userId, req.userId!)));
        updated++;
      }
    } catch { failed += targets.length; }
  }));
  req.log.info({ updated, failed, requested: reserved.length }, "seo.keyword-insights.complete");
  res.json({ updated, failed, message: failed ? "Some insights were unavailable. Previous data is preserved. Attempted lookups count toward this month's allowance; those targets can be tried again next month." : "Keyword insights updated. Results are cached for 30 days." });
});

router.get("/seo/keywords", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const plan = await paidPlan(req.userId!, res); if (!plan) return;
  const domain = domainFrom(req.query.domain); if (!domain) { res.status(400).json({ error: "Valid domain required." }); return; }
  const targets = await db.select().from(seoKeywordTargetsTable).where(and(eq(seoKeywordTargetsTable.userId, req.userId!), eq(seoKeywordTargetsTable.domain, domain))).orderBy(desc(seoKeywordTargetsTable.updatedAt));
  const targetIds = targets.map((t) => t.id);
  const latestSnapshotsQuery = buildLatestRankSnapshotsQuery(targetIds);
  const snapshots = latestSnapshotsQuery ? await db.execute(latestSnapshotsQuery) : { rows: [] as any[] };
  const latest = new Map((snapshots.rows as any[]).map((row) => [Number(row.target_id), row]));
  const tasksQuery = buildLatestRankTasksQuery(targetIds);
  const tasks = tasksQuery ? await db.execute(tasksQuery) : { rows: [] as any[] };
  const latestTasks = new Map((tasks.rows as any[]).map((row) => [Number(row.target_id), row]));
  res.json({
    targets: targets.map((target) => ({ ...target, latest: latest.get(target.id) ?? null, collection: latestTasks.get(target.id) ?? null })),
    limits: { activeKeywords: PLAN_LIMITS[plan].seoKeywordTargets },
    providerConfigured: isDataForSeoConfigured(),
  });
});

router.post("/seo/keywords", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const plan = await paidPlan(req.userId!, res); if (!plan) return;
  const domain = domainFrom(req.body?.domain); const keyword = keywordFrom(req.body?.keyword);
  if (!domain || !keyword) { res.status(400).json({ error: "Valid domain and keyword required." }); return; }
  const locationCode = Number.isInteger(req.body?.locationCode) && req.body.locationCode > 0 ? req.body.locationCode : 2840;
  const locationName = typeof req.body?.locationName === "string" ? req.body.locationName.trim().slice(0, 120) || "United States" : "United States";
  const languageCode = typeof req.body?.languageCode === "string" && /^[a-z]{2,5}$/i.test(req.body.languageCode) ? req.body.languageCode.toLowerCase() : "en";
  const device = req.body?.device === "mobile" ? "mobile" : "desktop";
  const targetUrl = typeof req.body?.targetUrl === "string" && /^https?:\/\//i.test(req.body.targetUrl) ? req.body.targetUrl.slice(0, 2000) : null;
  try {
    const created = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`seo-target:${req.userId!}:${domain}`}))`);
      const [active] = await tx.select({ total: count() }).from(seoKeywordTargetsTable).where(and(eq(seoKeywordTargetsTable.userId, req.userId!), eq(seoKeywordTargetsTable.domain, domain), eq(seoKeywordTargetsTable.active, true)));
      if (Number(active?.total || 0) >= PLAN_LIMITS[plan].seoKeywordTargets) throw new SeoLimitError();
      const [row] = await tx.insert(seoKeywordTargetsTable).values({ userId: req.userId!, domain, keyword, locationCode, locationName, languageCode, device, targetUrl }).returning();
      return row;
    });
    res.status(201).json({ target: created });
  } catch (err: any) {
    if (err instanceof SeoLimitError) { res.status(429).json({ error: `Your ${plan === "agency" ? "Agency" : "Pro"} plan includes ${PLAN_LIMITS[plan].seoKeywordTargets} active keyword targets.`, limitReached: true }); return; }
    if (err?.code === "23505") { res.status(409).json({ error: "That keyword, location, language, and device combination is already tracked." }); return; }
    throw err;
  }
});

router.patch("/seo/keywords/:id", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const plan = await paidPlan(req.userId!, res); if (!plan) return;
  const id = Number(req.params.id); if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid target." }); return; }
  const active = req.body?.active === true || req.body?.active === false ? req.body.active : undefined;
  if (active === undefined) { res.status(400).json({ error: "Only active status can be changed here." }); return; }
  const [target] = await db.select().from(seoKeywordTargetsTable).where(and(eq(seoKeywordTargetsTable.id, id), eq(seoKeywordTargetsTable.userId, req.userId!)));
  if (!target) { res.status(404).json({ error: "Keyword target not found." }); return; }
  try {
    const updated = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`seo-target:${req.userId!}:${target.domain}`}))`);
      if (active && !target.active) {
        const [used] = await tx.select({ total: count() }).from(seoKeywordTargetsTable).where(and(eq(seoKeywordTargetsTable.userId, req.userId!), eq(seoKeywordTargetsTable.domain, target.domain), eq(seoKeywordTargetsTable.active, true)));
        if (Number(used?.total || 0) >= PLAN_LIMITS[plan].seoKeywordTargets) throw new SeoLimitError();
      }
      const [row] = await tx.update(seoKeywordTargetsTable).set({ active, updatedAt: new Date() }).where(eq(seoKeywordTargetsTable.id, id)).returning();
      return row;
    });
    res.json({ target: updated });
  } catch (err) {
    if (err instanceof SeoLimitError) { res.status(429).json({ error: "Active keyword target limit reached.", limitReached: true }); return; }
    throw err;
  }
});

router.get("/seo/keywords/:id/history", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const plan = await paidPlan(req.userId!, res); if (!plan) return;
  const id = Number(req.params.id); if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid target." }); return; }
  const [target] = await db.select().from(seoKeywordTargetsTable).where(and(eq(seoKeywordTargetsTable.id, id), eq(seoKeywordTargetsTable.userId, req.userId!)));
  if (!target) { res.status(404).json({ error: "Keyword target not found." }); return; }
  const snapshots = await db.select().from(seoRankSnapshotsTable).where(eq(seoRankSnapshotsTable.targetId, id)).orderBy(desc(seoRankSnapshotsTable.collectedAt)).limit(104);
  res.json({ target, snapshots: snapshots.reverse() });
});

router.post("/seo/keywords/:id/refresh", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const plan = await paidPlan(req.userId!, res); if (!plan) return;
  const id = Number(req.params.id); if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid target." }); return; }
  const [target] = await db.select().from(seoKeywordTargetsTable).where(and(eq(seoKeywordTargetsTable.id, id), eq(seoKeywordTargetsTable.userId, req.userId!), eq(seoKeywordTargetsTable.active, true)));
  if (!target) { res.status(404).json({ error: "Active keyword target not found." }); return; }
  if (!isDataForSeoConfigured()) { res.status(503).json({ error: "Rank tracking will be available after the provider is configured.", providerNotConfigured: true, staleDataPreserved: true }); return; }
  const month = currentYearMonth();
  let usageId: number;
  try {
    usageId = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`seo-refresh:${req.userId!}:${month}`}))`);
      const [used] = await tx.select({ total: count() }).from(seoRefreshUsageTable).where(and(eq(seoRefreshUsageTable.userId, req.userId!), eq(seoRefreshUsageTable.month, month)));
      if (Number(used?.total || 0) >= PLAN_LIMITS[plan].manualRankRefreshes) throw new SeoLimitError();
      const [reservation] = await tx.insert(seoRefreshUsageTable).values({ userId: req.userId!, targetId: target.id, month }).returning({ id: seoRefreshUsageTable.id });
      return reservation.id;
    });
  } catch (err) {
    if (err instanceof SeoLimitError) { res.status(429).json({ error: "Monthly manual refresh limit reached. Weekly snapshots continue automatically.", limitReached: true }); return; }
    throw err;
  }
  let result;
  try {
    result = await collectGoogleRank(target);
  } catch (err) {
    await db.delete(seoRefreshUsageTable).where(eq(seoRefreshUsageTable.id, usageId));
    const message = err instanceof DataForSeoError ? err.message : "Rank provider could not collect this result. Your previous snapshots are preserved.";
    const status = err instanceof DataForSeoError ? err.status : 502;
    // No keyword, URL, account, or provider body is logged here.
    req.log.warn({ targetId: id, status }, "seo.rank-refresh.failed");
    res.status(status).json({ error: message, staleDataPreserved: true });
    return;
  }
  const [snapshot] = await db.insert(seoRankSnapshotsTable).values({ targetId: target.id, ...result, providerStatus: "success", collectionMode: "manual" }).returning();
  const [used] = await db.select({ total: count() }).from(seoRefreshUsageTable).where(and(eq(seoRefreshUsageTable.userId, req.userId!), eq(seoRefreshUsageTable.month, month)));
  res.json({ snapshot, remaining: Math.max(0, PLAN_LIMITS[plan].manualRankRefreshes - Number(used?.total || 0)) });
});

export default router;
