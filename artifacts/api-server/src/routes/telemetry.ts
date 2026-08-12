import { Router, type IRouter } from "express";
import { telemetryRateLimiter } from "../middlewares/rateLimiters";

const router: IRouter = Router();
const VALID_KINDS = new Set(["render_error", "window_error", "unhandled_rejection"]);

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/https?:\/\/[^\s]+/gi, "[url]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/(?:bearer\s+|token[=:]\s*)[^\s,;]+/gi, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Receives a deliberately small, privacy-safe client error envelope. */
router.post("/telemetry/client-error", telemetryRateLimiter, (req, res): void => {
  const kind = typeof req.body?.kind === "string" ? req.body.kind : "";
  const message = cleanText(req.body?.message, 300);
  const route = cleanText(req.body?.route, 200);

  if (!VALID_KINDS.has(kind) || !message || !route.startsWith("/")) {
    res.status(400).json({ error: "Invalid client error report" });
    return;
  }

  // Replit Monitoring can surface these structured error logs. We exclude
  // stack traces, query strings, audit contents, OAuth data, and user input.
  req.log.error({ source: "client", kind, message, route }, "Client application error");
  res.status(204).end();
});

export default router;
