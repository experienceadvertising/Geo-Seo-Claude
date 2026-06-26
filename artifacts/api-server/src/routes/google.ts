import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db, googleConnectionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { readRateLimiter } from "../middlewares/rateLimiters";
import { getUserPlan, planAtLeast } from "../lib/planUtils";
import { canonicalBaseUrl } from "../lib/publicUrl";
import {
  isGoogleConfigured, getAuthUrl, exchangeCode, getValidAccessToken,
  listGa4Properties, fetchAiReferrals,
} from "../lib/googleIntegration";

const router: IRouter = Router();

const PREFIX = "/integrations/google";

async function getConnection(userId: string) {
  const [conn] = await db.select().from(googleConnectionsTable).where(eq(googleConnectionsTable.userId, userId));
  return conn ?? null;
}

async function requirePro(userId: string): Promise<boolean> {
  return planAtLeast(await getUserPlan(userId), "pro");
}

// Connection state for the Integrations UI.
router.get(`${PREFIX}/status`, requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const conn = await getConnection(req.userId!);
  res.json({
    configured: isGoogleConfigured(),
    connected: !!conn,
    propertyId: conn?.ga4PropertyId ?? null,
    propertyName: conn?.ga4PropertyName ?? null,
  });
});

// Kick off OAuth — redirect the browser to Google's consent screen.
router.get(`${PREFIX}/connect`, requireAuth, async (req, res): Promise<void> => {
  if (!isGoogleConfigured()) {
    res.status(503).json({ error: "Google integration is not configured on this server." });
    return;
  }
  if (!(await requirePro(req.userId!))) {
    res.status(403).json({ error: "Connecting Google Analytics is a Pro feature.", upgradeRequired: true });
    return;
  }
  const state = randomBytes(16).toString("hex");
  req.session.googleOAuthState = state;
  req.session.save(() => res.redirect(getAuthUrl(state)));
});

// OAuth redirect target — exchange the code, store tokens, bounce back to the app.
router.get(`${PREFIX}/callback`, requireAuth, async (req, res): Promise<void> => {
  const base = canonicalBaseUrl();
  const fail = (status: string) => res.redirect(`${base}/projects?google=${status}`);

  try {
    if (req.query.error) return fail("denied");
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const expected = req.session.googleOAuthState;
    delete req.session.googleOAuthState;
    if (!code || !state || !expected || state !== expected) return fail("invalid");

    const tokens = await exchangeCode(code);
    const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;

    await db.insert(googleConnectionsTable).values({
      userId: req.userId!,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt,
      scope: tokens.scope ?? null,
    }).onConflictDoUpdate({
      target: googleConnectionsTable.userId,
      set: {
        accessToken: tokens.access_token,
        // Google only returns a refresh token on first consent; keep the
        // existing one if this reconnect didn't include a fresh one.
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        expiresAt,
        scope: tokens.scope ?? null,
        updatedAt: new Date(),
      },
    });

    return fail("connected");
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback failed");
    return fail("error");
  }
});

// List GA4 properties the connected account can read (for the property picker).
router.get(`${PREFIX}/properties`, requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const conn = await getConnection(req.userId!);
  if (!conn) {
    res.status(404).json({ error: "Google account not connected" });
    return;
  }
  try {
    const token = await getValidAccessToken(conn);
    const properties = await listGa4Properties(token);
    res.json({ properties });
  } catch (err) {
    req.log.error({ err }, "GA4 property list failed");
    res.status(502).json({ error: "Couldn't load your GA4 properties. Try reconnecting Google." });
  }
});

// Select which GA4 property to report on.
router.post(`${PREFIX}/property`, requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const propertyId = typeof req.body?.propertyId === "string" ? req.body.propertyId.trim().slice(0, 64) : "";
  const propertyName = typeof req.body?.propertyName === "string" ? req.body.propertyName.trim().slice(0, 200) : null;
  if (!propertyId) {
    res.status(400).json({ error: "propertyId is required" });
    return;
  }
  const [updated] = await db.update(googleConnectionsTable)
    .set({ ga4PropertyId: propertyId, ga4PropertyName: propertyName, updatedAt: new Date() })
    .where(eq(googleConnectionsTable.userId, req.userId!))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Google account not connected" });
    return;
  }
  res.json({ ok: true, propertyId, propertyName });
});

// AI-referral traffic from GA4 for the selected property.
router.get(`${PREFIX}/ai-referrals`, requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const conn = await getConnection(req.userId!);
  if (!conn) {
    res.status(404).json({ error: "Google account not connected" });
    return;
  }
  if (!conn.ga4PropertyId) {
    res.status(400).json({ error: "Select a GA4 property first", needsProperty: true });
    return;
  }
  const days = Math.min(90, Math.max(7, parseInt(String(req.query.days ?? "28"), 10) || 28));
  try {
    const token = await getValidAccessToken(conn);
    const report = await fetchAiReferrals(token, conn.ga4PropertyId, days);
    res.json({ property: conn.ga4PropertyName || conn.ga4PropertyId, days, ...report });
  } catch (err) {
    req.log.error({ err }, "GA4 AI-referrals fetch failed");
    res.status(502).json({ error: "Couldn't load GA4 data. Try reconnecting Google." });
  }
});

// Disconnect — drop the stored tokens (best-effort revoke at Google).
router.post(`${PREFIX}/disconnect`, requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const conn = await getConnection(req.userId!);
  if (conn) {
    const token = conn.refreshToken || conn.accessToken;
    if (token) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST", signal: AbortSignal.timeout(8000) })
        .catch(() => { /* best-effort */ });
    }
    await db.delete(googleConnectionsTable).where(eq(googleConnectionsTable.userId, req.userId!));
  }
  res.json({ ok: true });
});

export default router;
