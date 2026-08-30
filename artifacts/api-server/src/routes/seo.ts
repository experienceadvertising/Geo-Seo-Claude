import { Router, type IRouter } from "express";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db, seoKeywordTargetsTable, seoRankSnapshotsTable, seoRefreshUsageTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { readRateLimiter } from "../middlewares/rateLimiters";
import { currentYearMonth } from "../lib/usageLimits";
import { getUserPlan, PLAN_LIMITS, planAtLeast } from "../lib/planUtils";
import { collectGoogleRank, DataForSeoError, isDataForSeoConfigured } from "../lib/dataforseoRankTracker";
import { buildLatestRankSnapshotsQuery } from "../lib/seoTrackingQueries";

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
  const plan = await getUserPlan(userId);
  if (!planAtLeast(plan, "pro")) {
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
  const [refreshes] = await db.select({ total: count() }).from(seoRefreshUsageTable).where(and(eq(seoRefreshUsageTable.userId, req.userId!), eq(seoRefreshUsageTable.month, month)));
  res.json({ domain, plan, providerConfigured: isDataForSeoConfigured(), limits: { activeKeywords: PLAN_LIMITS[plan].seoKeywordTargets, manualRefreshes: PLAN_LIMITS[plan].manualRankRefreshes }, usage: { activeKeywords: Number(active?.total || 0), manualRefreshes: Number(refreshes?.total || 0) } });
});

router.get("/seo/keywords", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const plan = await paidPlan(req.userId!, res); if (!plan) return;
  const domain = domainFrom(req.query.domain); if (!domain) { res.status(400).json({ error: "Valid domain required." }); return; }
  const targets = await db.select().from(seoKeywordTargetsTable).where(and(eq(seoKeywordTargetsTable.userId, req.userId!), eq(seoKeywordTargetsTable.domain, domain))).orderBy(desc(seoKeywordTargetsTable.updatedAt));
  const targetIds = targets.map((t) => t.id);
  const latestSnapshotsQuery = buildLatestRankSnapshotsQuery(targetIds);
  const snapshots = latestSnapshotsQuery ? await db.execute(latestSnapshotsQuery) : { rows: [] as any[] };
  const latest = new Map((snapshots.rows as any[]).map((row) => [Number(row.target_id), row]));
  res.json({
    targets: targets.map((target) => ({ ...target, latest: latest.get(target.id) ?? null })),
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
