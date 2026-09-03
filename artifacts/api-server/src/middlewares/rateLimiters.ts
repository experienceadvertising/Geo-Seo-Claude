import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

const userKey = (req: Request) =>
  req.userId || ipKeyGenerator(req.ip || "anon") || "anon";

export const analyzeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: { error: "Rate limit exceeded. You can run 20 analyses per hour." },
});

export const simulateRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: { error: "Rate limit exceeded. You can run 10 prompt simulations per hour." },
});

export const readRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
});

// ── Auth limiters (IP-based; auth endpoints are unauthenticated) ─────────────
const ipKey = (req: Request) => ipKeyGenerator(req.ip || "anon") || "anon";

// Client errors are intentionally unauthenticated so we can capture failures
// that happen before sign-in. Keep the allowance small enough to prevent this
// endpoint from being used as a log-ingestion sink.
export const telemetryRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { error: "Too many telemetry reports" },
});

const TRANSPARENT_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

// Crawler tracking-pixel ingest. Public + unauthenticated and hit by bots, so
// keyed by IP and set generously (real crawlers fetch infrequently per IP);
// the cap exists only to bound abuse of the public endpoint.
export const crawlerPixelRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: ipKey,
  // Never 429 a bot: express-rate-limit short-circuits before the route, so
  // over the cap we answer with the same 1x1 gif ourselves and simply don't
  // log the hit. A crawler must never see an error from a beacon.
  handler: (_req, res) => {
    res.set({
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Content-Length": String(TRANSPARENT_GIF.length),
    });
    res.status(200).end(TRANSPARENT_GIF);
  },
});

// Login: prevent credential-stuffing / brute-force.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  skipSuccessfulRequests: true,
  message: { error: "Too many sign-in attempts. Please try again in 15 minutes." },
});

// Register: prevent spam account creation.
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { error: "Too many sign-up attempts. Please try again in an hour." },
});

// Forgot/reset/resend-verification: prevent email-bombing.
export const passwordEmailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { error: "Too many requests. Please try again in an hour." },
});

// Unsubscribe / resubscribe / unsubscribe-info: stop bots from brute-forcing
// the 256-bit token space. Real users hit these endpoints at most a handful
// of times after clicking a link from email.
export const unsubscribeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { error: "Too many requests. Please try again later." },
});
