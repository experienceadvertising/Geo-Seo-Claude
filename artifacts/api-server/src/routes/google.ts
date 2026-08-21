import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db, googleConnectionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { readRateLimiter } from "../middlewares/rateLimiters";
import { getStoredPlan, getUserPlan, planAtLeast } from "../lib/planUtils";
import { canonicalBaseUrl } from "../lib/publicUrl";
import {
  isGoogleConfigured, getAuthUrl, exchangeCode, getValidAccessToken,
  listGa4Properties, fetchAiReferrals, hasSearchConsoleScope,
  listSearchConsoleSites, fetchSearchConsoleOpportunities,
  fetchSearchConsolePagePerformance,
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

async function requirePaidSubscription(userId: string): Promise<boolean> {
  return planAtLeast(await getStoredPlan(userId), "pro");
}

// Connection state for the Integrations UI.
router.get(`${PREFIX}/status`, requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const conn = await getConnection(req.userId!);
  res.json({
    configured: isGoogleConfigured(),
    connected: !!conn,
    searchConsoleGranted: !!conn && hasSearchConsoleScope(conn.scope),
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
    res.status(403).json({ error: "Connecting Google Analytics and Search Console is a Pro feature.", upgradeRequired: true });
    return;
  }
  const state = randomBytes(16).toString("hex");
  const requestedReturnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "";
  const returnTo = requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//") && requestedReturnTo.length <= 500
    ? requestedReturnTo
    : "/projects";
  req.session.googleOAuthState = state;
  req.session.googleOAuthReturnTo = returnTo;
  req.session.save(() => res.redirect(getAuthUrl(state)));
});

// OAuth redirect target — exchange the code, store tokens, bounce back to the app.
router.get(`${PREFIX}/callback`, requireAuth, async (req, res): Promise<void> => {
  const base = canonicalBaseUrl();
  const returnTo = req.session.googleOAuthReturnTo || "/projects";
  delete req.session.googleOAuthReturnTo;
  const separator = returnTo.includes("?") ? "&" : "?";
  const finish = (status: string) => res.redirect(`${base}${returnTo}${separator}google=${status}`);

  try {
    if (req.query.error) return finish("denied");
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const expected = req.session.googleOAuthState;
    delete req.session.googleOAuthState;
    if (!code || !state || !expected || state !== expected) return finish("invalid");

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

    return finish("connected");
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback failed");
    return finish("error");
  }
});

// List GA4 properties the connected account can read (for the property picker).
router.get(`${PREFIX}/properties`, requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  if (!(await requirePaidSubscription(req.userId!))) {
    res.status(403).json({ error: "Google Analytics AI-referral reporting requires a paid plan.", upgradeRequired: true });
    return;
  }
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
  if (!(await requirePaidSubscription(req.userId!))) {
    res.status(403).json({ error: "Google Analytics AI-referral reporting requires a paid plan.", upgradeRequired: true });
    return;
  }
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
  if (!(await requirePaidSubscription(req.userId!))) {
    res.status(403).json({ error: "Google Analytics AI-referral reporting requires a paid plan.", upgradeRequired: true });
    return;
  }
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

router.get(`${PREFIX}/search-console/sites`, requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  if (!(await requirePro(req.userId!))) {
    res.status(403).json({ error: "Search Console opportunities are a Pro feature.", upgradeRequired: true });
    return;
  }
  const conn = await getConnection(req.userId!);
  if (!conn) {
    res.status(404).json({ error: "Google account not connected" });
    return;
  }
  if (!hasSearchConsoleScope(conn.scope)) {
    res.status(409).json({ error: "Reconnect Google to grant read-only Search Console access.", needsReconnect: true });
    return;
  }
  try {
    const token = await getValidAccessToken(conn);
    const sites = await listSearchConsoleSites(token);
    res.json({ sites });
  } catch (err) {
    req.log.error({ err }, "Search Console site list failed");
    res.status(502).json({ error: "Couldn't load your Search Console properties. Try reconnecting Google." });
  }
});

router.get(`${PREFIX}/search-console/opportunities`, requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  if (!(await requirePro(req.userId!))) {
    res.status(403).json({ error: "Search Console opportunities are a Pro feature.", upgradeRequired: true });
    return;
  }
  const siteUrl = typeof req.query.siteUrl === "string" ? req.query.siteUrl.trim().slice(0, 500) : "";
  const pageUrl = typeof req.query.pageUrl === "string" ? req.query.pageUrl.trim().slice(0, 2000) : "";
  const days = Math.min(180, Math.max(28, parseInt(String(req.query.days ?? "90"), 10) || 90));
  let parsedPage: URL;
  try {
    parsedPage = new URL(pageUrl);
    if (!/^https?:$/.test(parsedPage.protocol)) throw new Error("invalid protocol");
  } catch {
    res.status(400).json({ error: "A valid http(s) pageUrl is required." });
    return;
  }
  if (!siteUrl) {
    res.status(400).json({ error: "siteUrl is required." });
    return;
  }

  const conn = await getConnection(req.userId!);
  if (!conn) {
    res.status(404).json({ error: "Google account not connected" });
    return;
  }
  if (!hasSearchConsoleScope(conn.scope)) {
    res.status(409).json({ error: "Reconnect Google to grant read-only Search Console access.", needsReconnect: true });
    return;
  }
  try {
    const token = await getValidAccessToken(conn);
    const sites = await listSearchConsoleSites(token);
    if (!sites.some((site) => site.siteUrl === siteUrl)) {
      res.status(403).json({ error: "That Search Console property is not available to this Google account." });
      return;
    }
    const report = await fetchSearchConsoleOpportunities(token, siteUrl, parsedPage.toString(), days);
    res.json(report);
  } catch (err) {
    req.log.error({ err, siteUrl, pageUrl: parsedPage.toString() }, "Search Console opportunity fetch failed");
    res.status(502).json({ error: "Couldn't load Search Console query data. Try reconnecting Google." });
  }
});

router.get(`${PREFIX}/search-console/performance`, requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  if (!(await requirePro(req.userId!))) { res.status(403).json({ error: "Search Console performance is a Pro feature.", upgradeRequired: true }); return; }
  const siteUrl = typeof req.query.siteUrl === "string" ? req.query.siteUrl.trim().slice(0, 500) : "";
  const pageUrl = typeof req.query.pageUrl === "string" ? req.query.pageUrl.trim().slice(0, 2000) : "";
  try { const parsed = new URL(pageUrl); if (!/^https?:$/.test(parsed.protocol) || !siteUrl) throw new Error("invalid"); } catch { res.status(400).json({ error: "Valid siteUrl and pageUrl required." }); return; }
  const conn = await getConnection(req.userId!);
  if (!conn) { res.status(404).json({ error: "Google account not connected" }); return; }
  if (!hasSearchConsoleScope(conn.scope)) { res.status(409).json({ error: "Reconnect Google to grant read-only Search Console access.", needsReconnect: true }); return; }
  try {
    const token = await getValidAccessToken(conn);
    const sites = await listSearchConsoleSites(token);
    if (!sites.some((site) => site.siteUrl === siteUrl)) { res.status(403).json({ error: "That Search Console property is not available to this Google account." }); return; }
    const [performance, queryReport] = await Promise.all([
      fetchSearchConsolePagePerformance(token, siteUrl, pageUrl),
      fetchSearchConsoleOpportunities(token, siteUrl, pageUrl, 90),
    ]);
    res.json({ ...performance, opportunities: queryReport.opportunities, rowsReturned: queryReport.rowsReturned });
  } catch (err) {
    req.log.error({ err }, "Search Console performance fetch failed");
    res.status(502).json({ error: "Couldn't load Search Console performance. Try reconnecting Google." });
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
