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
