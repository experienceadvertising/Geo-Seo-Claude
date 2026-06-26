import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, crawlerHitsTable } from "@workspace/db";
import { crawlerPixelRateLimiter } from "../middlewares/rateLimiters";
import { detectAiCrawler } from "../lib/crawlerDetect";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const log = logger.child({ module: "crawlerPixel" });

// 1x1 transparent GIF.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

// Dedup window: collapse repeated fetches of the same crawler against the same
// token within this window into a single logged hit. In-memory + best-effort —
// it only bounds write volume, not correctness.
const THROTTLE_MS = 60_000;
const recentHits = new Map<string, number>();

router.get("/crawler-pixel/:token", crawlerPixelRateLimiter, (req, res): void => {
  // Always return the pixel immediately; logging happens after and never
  // affects the response (a crawler must never see an error from a beacon).
  res.set({
    "Content-Type": "image/gif",
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "Content-Length": String(PIXEL.length),
  });
  res.status(200).end(PIXEL);

  void (async () => {
    try {
      const token = String(req.params.token || "").replace(/\.gif$/i, "").trim();
      if (token.length < 8) return;

      const ua = req.get("user-agent") || "";
      const crawler = detectAiCrawler(ua);
      if (!crawler) return; // We log AI bots only — never human visitors.

      const key = `${token}:${crawler}`;
      const now = Date.now();
      const last = recentHits.get(key);
      if (last && now - last < THROTTLE_MS) return;
      // Bound the dedup map so a long-lived process can't leak memory.
      if (recentHits.size > 50_000) recentHits.clear();
      recentHits.set(key, now);

      const [u] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.crawlerToken, token));
      if (!u) return;

      let path: string | null = null;
      const ref = req.get("referer") || "";
      if (ref) {
        try { path = new URL(ref).pathname.slice(0, 512); } catch { /* ignore */ }
      }

      await db.insert(crawlerHitsTable).values({
        userId: u.id,
        crawler,
        userAgent: ua.slice(0, 256),
        path,
      });
      log.debug({ userId: u.id, crawler, path }, "crawler.hit.logged");
    } catch (err) {
      log.warn({ err: err instanceof Error ? err.message : String(err) }, "crawler.hit.log failed");
    }
  })();
});

export default router;
