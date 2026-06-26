import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { and, eq, desc, gte, sql } from "drizzle-orm";
import { db, usersTable, crawlerHitsTable } from "@workspace/db";
import { requireAuth } from "../../middlewares/auth";
import { readRateLimiter } from "../../middlewares/rateLimiters";
import { getUserPlan, planAtLeast } from "../../lib/planUtils";
import { KNOWN_AI_CRAWLERS } from "../../lib/crawlerDetect";

const router: IRouter = Router();

function baseUrl(): string {
  return (process.env.FRONTEND_URL || "https://aeoimprovement.com").replace(/\/$/, "");
}

function buildSnippet(token: string): { pixelUrl: string; snippet: string } {
  const pixelUrl = `${baseUrl()}/api/crawler-pixel/${token}.gif`;
  const snippet = `<img src="${pixelUrl}" alt="" width="1" height="1" style="position:absolute;left:-9999px" loading="eager" referrerpolicy="no-referrer-when-downgrade" />`;
  return { pixelUrl, snippet };
}

/** Get (lazily creating) the caller's crawler-tracking token. */
async function ensureToken(userId: string): Promise<string> {
  const [u] = await db.select({ token: usersTable.crawlerToken }).from(usersTable).where(eq(usersTable.id, userId));
  if (u?.token) return u.token;
  const token = randomBytes(16).toString("hex");
  await db.update(usersTable).set({ crawlerToken: token }).where(eq(usersTable.id, userId));
  return token;
}

// Crawler Activity dashboard data: the embed snippet + aggregated AI-bot hits.
router.get("/geo/crawler-activity", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const plan = await getUserPlan(req.userId!);
  if (!planAtLeast(plan, "pro")) {
    res.status(403).json({ error: "AI crawler tracking is a Pro feature.", upgradeRequired: true, plan });
    return;
  }

  const userId = req.userId!;
  const token = await ensureToken(userId);
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [byCrawler, daily, recent, totalRow] = await Promise.all([
    db.select({
      crawler: crawlerHitsTable.crawler,
      count: sql<number>`count(*)::int`,
      lastSeen: sql<string>`max(${crawlerHitsTable.createdAt})`,
    }).from(crawlerHitsTable).where(eq(crawlerHitsTable.userId, userId)).groupBy(crawlerHitsTable.crawler),

    db.select({
      day: sql<string>`to_char(date_trunc('day', ${crawlerHitsTable.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    }).from(crawlerHitsTable)
      .where(and(eq(crawlerHitsTable.userId, userId), gte(crawlerHitsTable.createdAt, since)))
      .groupBy(sql`date_trunc('day', ${crawlerHitsTable.createdAt})`)
      .orderBy(sql`date_trunc('day', ${crawlerHitsTable.createdAt})`),

    db.select({
      crawler: crawlerHitsTable.crawler,
      path: crawlerHitsTable.path,
      createdAt: crawlerHitsTable.createdAt,
    }).from(crawlerHitsTable).where(eq(crawlerHitsTable.userId, userId)).orderBy(desc(crawlerHitsTable.createdAt)).limit(25),

    db.select({ count: sql<number>`count(*)::int` }).from(crawlerHitsTable).where(eq(crawlerHitsTable.userId, userId)),
  ]);

  res.json({
    token,
    ...buildSnippet(token),
    knownCrawlers: KNOWN_AI_CRAWLERS,
    total: totalRow[0]?.count ?? 0,
    byCrawler: byCrawler.sort((a, b) => b.count - a.count),
    daily,
    recent: recent.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  });
});

// Rotate the token (invalidates the old pixel — user must re-embed).
router.post("/geo/crawler-activity/reset", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const plan = await getUserPlan(req.userId!);
  if (!planAtLeast(plan, "pro")) {
    res.status(403).json({ error: "AI crawler tracking is a Pro feature.", upgradeRequired: true });
    return;
  }
  const token = randomBytes(16).toString("hex");
  await db.update(usersTable).set({ crawlerToken: token }).where(eq(usersTable.id, req.userId!));
  res.json({ token, ...buildSnippet(token) });
});

export default router;
