import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { db, auditsTable } from "@workspace/db";
import { requireAuth } from "../../middlewares/auth";
import { requireAdmin, isAdminRequest } from "../../middlewares/admin";
import { readRateLimiter } from "../../middlewares/rateLimiters";

const router: IRouter = Router();

router.get("/admin/me", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  res.json({ isAdmin: await isAdminRequest(req) });
});

router.get("/admin/users", requireAuth, requireAdmin, readRateLimiter, async (req, res): Promise<void> => {
  const limitParam = Number(req.query.limit);
  const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 200 ? limitParam : 100;

  // Aggregate audit stats per user_id
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

  // List Clerk users
  const userList = await clerkClient.users.getUserList({
    limit,
    orderBy: "-created_at",
  });

  const users = userList.data.map((u) => {
    const stats = statsByUser.get(u.id);
    const primaryEmail = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
      || u.emailAddresses[0];
    return {
      id: u.id,
      email: primaryEmail?.emailAddress ?? null,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      imageUrl: u.imageUrl ?? null,
      createdAt: new Date(u.createdAt).toISOString(),
      lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : null,
      auditCount: stats?.auditCount ?? 0,
      lastAudit: stats?.lastAudit ? new Date(stats.lastAudit).toISOString() : null,
      avgScore: stats?.avgScore ? Math.round(stats.avgScore) : null,
    };
  });

  // Totals
  const [totalsRow] = await db
    .select({
      totalAudits: sql<number>`count(*)::int`,
      audits24h: sql<number>`count(*) filter (where ${auditsTable.createdAt} > now() - interval '24 hours')::int`,
      audits7d: sql<number>`count(*) filter (where ${auditsTable.createdAt} > now() - interval '7 days')::int`,
    })
    .from(auditsTable);

  res.json({
    totalUsers: userList.totalCount,
    totalAudits: totalsRow?.totalAudits ?? 0,
    audits24h: totalsRow?.audits24h ?? 0,
    audits7d: totalsRow?.audits7d ?? 0,
    users,
  });
});

export default router;
