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
