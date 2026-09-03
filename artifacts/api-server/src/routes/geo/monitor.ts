import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, monitoredSitesTable } from "@workspace/db";
import { requireAuth } from "../../middlewares/auth";
import { readRateLimiter, analyzeRateLimiter } from "../../middlewares/rateLimiters";
import { getUserPlan, PLAN_LIMITS } from "../../lib/planUtils";
import { nextRunFrom, runMonitoredSite } from "../../lib/monitoring";
import { consumeQuota, refundQuota, currentYearMonth } from "../../lib/usageLimits";

const router: IRouter = Router();

const VALID_FREQUENCIES = ["daily", "weekly"] as const;
type Frequency = (typeof VALID_FREQUENCIES)[number];

function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

// List the caller's monitored sites (Projects view), newest first.
router.get("/geo/monitored-sites", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const plan = await getUserPlan(req.userId!);
  const rows = await db
    .select()
    .from(monitoredSitesTable)
    .where(eq(monitoredSitesTable.userId, req.userId!))
    .orderBy(desc(monitoredSitesTable.createdAt));
  res.json({
    sites: rows.map((s) => ({ ...s, createdAt: s.createdAt.toISOString(), lastRunAt: s.lastRunAt?.toISOString() ?? null, nextRunAt: s.nextRunAt?.toISOString() ?? null })),
    limit: PLAN_LIMITS[plan].monitoredSites,
    dailyLimit: PLAN_LIMITS[plan].dailyMonitoredSites,
    plan,
  });
});

// Add a site to continuous monitoring (Pro/Agency only, capped per plan).
router.post("/geo/monitored-sites", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const url = typeof body.url === "string" ? normalizeUrl(body.url) : null;
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 80) || null : null;
  const frequency: Frequency = VALID_FREQUENCIES.includes(body.frequency) ? body.frequency : "weekly";

  if (!url) {
    res.status(400).json({ error: "A valid site URL is required" });
    return;
  }

  const plan = await getUserPlan(req.userId!);
  const cap = PLAN_LIMITS[plan].monitoredSites;
  if (cap === 0) {
    res.status(403).json({ error: "Continuous monitoring is a Pro feature. Upgrade to track sites automatically.", upgradeRequired: true, plan });
    return;
  }

  const existing = await db
    .select({ id: monitoredSitesTable.id, url: monitoredSitesTable.url, frequency: monitoredSitesTable.frequency })
    .from(monitoredSitesTable)
    .where(eq(monitoredSitesTable.userId, req.userId!));
  if (existing.length >= cap) {
    res.status(403).json({ error: `Your ${plan} plan can monitor up to ${cap} sites. Remove one or upgrade to add more.`, upgradeRequired: plan !== "agency", plan, limit: cap });
    return;
  }
  if (existing.some((e) => e.url === url)) {
    res.status(409).json({ error: "That site is already being monitored." });
    return;
  }
  if (frequency === "daily") {
    const dailyUsed = existing.filter((site) => site.frequency === "daily").length;
    const dailyLimit = PLAN_LIMITS[plan].dailyMonitoredSites;
    if (dailyUsed >= dailyLimit) {
      res.status(403).json({
        error: `Your ${plan} plan includes up to ${dailyLimit} daily monitored site${dailyLimit === 1 ? "" : "s"}. Add this site weekly or change another site's cadence.`,
        plan,
        limit: dailyLimit,
      });
      return;
    }
  }

  // Schedule the first run shortly (next sweep) by leaving nextRunAt in the past.
  const [created] = await db.insert(monitoredSitesTable).values({
    userId: req.userId!,
    url,
    label,
    frequency,
    active: true,
    nextRunAt: new Date(0),
  }).returning();

  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString(), lastRunAt: null, nextRunAt: created.nextRunAt?.toISOString() ?? null });
});

// Update label / cadence / active state.
router.patch("/geo/monitored-sites/:id", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = req.body ?? {};
  const updates: Partial<{ label: string | null; frequency: Frequency; active: boolean; nextRunAt: Date }> = {};
  if (typeof body.label === "string") updates.label = body.label.trim().slice(0, 80) || null;
  if (VALID_FREQUENCIES.includes(body.frequency)) {
    const plan = await getUserPlan(req.userId!);
    if (body.frequency === "daily") {
      const dailySites = await db
        .select({ id: monitoredSitesTable.id })
        .from(monitoredSitesTable)
        .where(and(eq(monitoredSitesTable.userId, req.userId!), eq(monitoredSitesTable.frequency, "daily")));
      const alreadyDaily = dailySites.some((site) => site.id === id);
      const dailyLimit = PLAN_LIMITS[plan].dailyMonitoredSites;
      if (!alreadyDaily && dailySites.length >= dailyLimit) {
        res.status(403).json({
          error: `Your ${plan} plan includes up to ${dailyLimit} daily monitored site${dailyLimit === 1 ? "" : "s"}. Change another site's cadence first.`,
          plan,
          limit: dailyLimit,
        });
        return;
      }
    }
    updates.frequency = body.frequency;
    updates.nextRunAt = nextRunFrom(body.frequency);
  }
  if (typeof body.active === "boolean") updates.active = body.active;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [updated] = await db
    .update(monitoredSitesTable)
    .set(updates)
    .where(and(eq(monitoredSitesTable.id, id), eq(monitoredSitesTable.userId, req.userId!)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Monitored site not found" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), lastRunAt: updated.lastRunAt?.toISOString() ?? null, nextRunAt: updated.nextRunAt?.toISOString() ?? null });
});

// Stop monitoring a site.
router.delete("/geo/monitored-sites/:id", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [deleted] = await db
    .delete(monitoredSitesTable)
    .where(and(eq(monitoredSitesTable.id, id), eq(monitoredSitesTable.userId, req.userId!)))
    .returning({ id: monitoredSitesTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Monitored site not found" });
    return;
  }
  res.json({ ok: true });
});

// Run a monitored site's audit immediately (uses the audit rate limiter since
// it triggers a full crawl + render). Reuses the same path as the scheduler.
router.post("/geo/monitored-sites/:id/run", requireAuth, analyzeRateLimiter, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [site] = await db
    .select()
    .from(monitoredSitesTable)
    .where(and(eq(monitoredSitesTable.id, id), eq(monitoredSitesTable.userId, req.userId!)));
  if (!site) {
    res.status(404).json({ error: "Monitored site not found" });
    return;
  }
  // Manual runs are user-initiated full audits — they count against the
  // monthly audit quota exactly like /geo/analyze. (Scheduled runs are
  // deliberately exempt; only this on-demand path was unmetered.)
  const plan = await getUserPlan(req.userId!);
  const ym = currentYearMonth();
  const quota = await consumeQuota(req.userId!, plan, "audits", ym);
  if (!quota.allowed) {
    res.status(429).json({
      error: `You've used all ${quota.cap} audits for this month. Upgrade for more.`,
      upgradeRequired: true,
      usage: { used: quota.used, cap: quota.cap },
    });
    return;
  }
  try {
    const result = await runMonitoredSite(site);
    if (!result) {
      await refundQuota(req.userId!, "audits", ym).catch(() => undefined);
      res.status(403).json({ error: "Continuous monitoring is not available on your current plan.", upgradeRequired: true });
      return;
    }
    res.json(result);
  } catch (err) {
    refundQuota(req.userId!, "audits", ym).catch((refundErr) =>
      req.log.error({ err: refundErr, userId: req.userId }, "Quota refund failed"),
    );
    req.log.error({ err, siteId: id }, "Manual monitored-site run failed");
    res.status(500).json({ error: "Audit failed. Please try again." });
  }
});

export default router;
