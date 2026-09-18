import { Router, type IRouter } from "express";
import { sql, desc, eq } from "drizzle-orm";
import { db, auditsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../../middlewares/auth";
import { requireAdmin, isAdminRequest } from "../../middlewares/admin";
import { readRateLimiter } from "../../middlewares/rateLimiters";
import { CAMPAIGN_ID, runNewsletter } from "../../../scripts/strategy-newsletter.mjs";

const router: IRouter = Router();

router.get("/admin/me", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  res.json({ isAdmin: await isAdminRequest(req) });
});

router.get("/admin/strategy-newsletter", requireAuth, requireAdmin, readRateLimiter, async (_req, res): Promise<void> => {
  try {
    const [audience, delivery] = await Promise.all([runNewsletter("--dry-run"), runNewsletter("--status")]);
    res.json({ audience, delivery });
  } catch {
    res.status(503).json({ error: "Campaign status is temporarily unavailable." });
  }
});

router.post("/admin/strategy-newsletter/test", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const postalAddress = req.body?.postalAddress;
  if (typeof postalAddress !== "string" || postalAddress.length < 10 ||
      postalAddress.length > 180 || /[\r\n]/.test(postalAddress)) {
    res.status(400).json({ error: "Provide a valid postal address for the email footer." });
    return;
  }
  try {
    const [user] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, req.userId!));
    if (!user?.email) {
      res.status(400).json({ error: "This admin account has no eligible email address." });
      return;
    }
    const result = await runNewsletter("--test-to", { testTo: user.email, postalAddress: postalAddress.trim() });
    res.json(result);
  } catch {
    res.status(503).json({ error: "Test send was not confirmed. Check Postmark before retrying." });
  }
});

router.post("/admin/strategy-newsletter/send-batch", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const campaignId = req.body?.campaignId;
  const postalAddress = req.body?.postalAddress;
  if (campaignId !== CAMPAIGN_ID || typeof postalAddress !== "string" ||
      postalAddress.length < 10 || postalAddress.length > 180 || /[\r\n]/.test(postalAddress)) {
    res.status(400).json({ error: "Confirm this campaign and provide a valid postal address." });
    return;
  }
  try {
    const result = await runNewsletter("--send", { limit: 5, postalAddress: postalAddress.trim() });
    res.json(result);
  } catch {
    res.status(503).json({ error: "Campaign batch stopped. Check the delivery ledger and Postmark before retrying." });
  }
});

router.get("/admin/users", requireAuth, requireAdmin, readRateLimiter, async (req, res): Promise<void> => {
  const limitParam = Number(req.query.limit);
  const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 200 ? limitParam : 100;

  const auditStats = await db
    .select({
      userId: auditsTable.userId,
      auditCount: sql<number>`count(*)::int`,
      lastAudit: sql<Date | null>`max(${auditsTable.createdAt})`,
      avgScore: sql<number>`avg(${auditsTable.geoScore})::float`,
    })
    .from(auditsTable)
    .groupBy(auditsTable.userId);

  const statsByUser = new Map<string, { auditCount: number; lastAudit: Date | null; avgScore: number }>();
  for (const row of auditStats) {
    if (row.userId) statsByUser.set(row.userId, {
      auditCount: row.auditCount,
      lastAudit: row.lastAudit,
      avgScore: row.avgScore,
    });
  }

  const dbUsers = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit);

  const users = dbUsers.map((u) => {
    const stats = statsByUser.get(u.id);
    return {
      id: u.id,
      email: u.email ?? null,
      firstName: u.firstName ?? null,
      lastName: null,
      imageUrl: null,
      createdAt: u.createdAt.toISOString(),
      lastSignInAt: null,
      plan: u.plan,
      auditCount: stats?.auditCount ?? 0,
      lastAudit: stats?.lastAudit ? new Date(stats.lastAudit).toISOString() : null,
      avgScore: stats?.avgScore ? Math.round(stats.avgScore) : null,
    };
  });

  const [userCountRow] = await db.select({ total: sql<number>`count(*)::int` }).from(usersTable);

  const [totalsRow] = await db
    .select({
      totalAudits: sql<number>`count(*)::int`,
      audits24h: sql<number>`count(*) filter (where ${auditsTable.createdAt} > now() - interval '24 hours')::int`,
      audits7d: sql<number>`count(*) filter (where ${auditsTable.createdAt} > now() - interval '7 days')::int`,
    })
    .from(auditsTable);

  res.json({
    totalUsers: userCountRow?.total ?? dbUsers.length,
    totalAudits: totalsRow?.totalAudits ?? 0,
    audits24h: totalsRow?.audits24h ?? 0,
    audits7d: totalsRow?.audits7d ?? 0,
    users,
  });
});

export default router;
