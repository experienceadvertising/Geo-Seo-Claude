import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { readRateLimiter } from "../middlewares/rateLimiters";
import { validVapidConfiguration } from "../lib/pushPayload";

const router: IRouter = Router();
const endpointPattern = /^https:\/\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]{20,2048}$/;
const keyPattern = /^[A-Za-z0-9_-]{16,256}$/;

router.get("/notifications/status", requireAuth, readRateLimiter, async (req, res) => {
  const configured = validVapidConfiguration(process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY, process.env.VAPID_SUBJECT);
  const [subscription] = await db.select({ id: pushSubscriptionsTable.id }).from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userId, req.userId!)).limit(1);
  res.json({ configured, subscribed: Boolean(subscription), publicKey: configured ? process.env.VAPID_PUBLIC_KEY : null });
});

router.post("/notifications/subscription", requireAuth, readRateLimiter, async (req, res) => {
  if (!validVapidConfiguration(process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY, process.env.VAPID_SUBJECT)) {
    res.status(503).json({ error: "Browser notifications are not configured yet" }); return;
  }
  const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint.trim() : "";
  const p256dh = typeof req.body?.keys?.p256dh === "string" ? req.body.keys.p256dh.trim() : "";
  const auth = typeof req.body?.keys?.auth === "string" ? req.body.keys.auth.trim() : "";
  if (!endpointPattern.test(endpoint) || !keyPattern.test(p256dh) || !keyPattern.test(auth)) {
    res.status(400).json({ error: "Invalid push subscription" }); return;
  }
  const updated = await db.update(pushSubscriptionsTable).set({ p256dh, auth, lastError: null, updatedAt: new Date() })
    .where(and(eq(pushSubscriptionsTable.userId, req.userId!), eq(pushSubscriptionsTable.endpoint, endpoint))).returning({ id: pushSubscriptionsTable.id });
  if (!updated.length) {
    const inserted = await db.insert(pushSubscriptionsTable).values({ userId: req.userId!, endpoint, p256dh, auth })
      .onConflictDoNothing({ target: pushSubscriptionsTable.endpoint }).returning({ id: pushSubscriptionsTable.id });
    if (!inserted.length) { res.status(409).json({ error: "This browser subscription belongs to another account" }); return; }
  }
  res.json({ ok: true, subscribed: true });
});

router.delete("/notifications/subscription", requireAuth, readRateLimiter, async (req, res) => {
  const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint.trim() : "";
  if (!endpointPattern.test(endpoint)) { res.status(400).json({ error: "Invalid push subscription" }); return; }
  await db.delete(pushSubscriptionsTable).where(and(eq(pushSubscriptionsTable.userId, req.userId!), eq(pushSubscriptionsTable.endpoint, endpoint)));
  res.json({ ok: true, subscribed: false });
});

export default router;
