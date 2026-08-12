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

// Crawler tracking-pixel ingest. Public + unauthenticated and hit by bots, so
// keyed by IP and set generously (real crawlers fetch infrequently per IP);
// the cap exists only to bound abuse of the public endpoint.
export const crawlerPixelRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: ipKey,
  // Never 429 a bot with JSON — just stop logging; the handler still returns
  // the gif. We achieve that by not throwing: skip counting successful gifs is
  // unnecessary, but we keep the response an image via the handler regardless.
  message: "",
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
