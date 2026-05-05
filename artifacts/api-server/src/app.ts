import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./lib/webhookHandlers";
import { createSessionMiddleware } from "./middlewares/session";

const app: Express = express();

app.set("trust proxy", 1);

// ── Raw-body webhook routes (must be BEFORE express.json()) ──────────────────
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }
    const sig = Array.isArray(signature) ? signature[0] : signature;
    try {
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: "Webhook processing failed" });
    }
  }
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS allowlist. Reflecting any Origin (`origin: true`) with credentials is
// risky — an attacker page on evil.com can't read responses (browser blocks
// without an allow header), but it also makes us a useful proxy for CSRF
// reconnaissance. Restrict to hosts we actually serve. Cookie sameSite=lax
// is the primary CSRF defence; this is defence-in-depth.
const PRODUCTION_HOST = "aeoimprovement.com";
function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>([
    `https://${PRODUCTION_HOST}`,
    `https://www.${PRODUCTION_HOST}`,
  ]);
  if (process.env.FRONTEND_URL) {
    try { origins.add(new URL(process.env.FRONTEND_URL).origin); } catch { /* ignore */ }
  }
  for (const d of (process.env.REPLIT_DOMAINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
    origins.add(`https://${d}`);
  }
  if (process.env.REPLIT_DEV_DOMAIN) origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
  // Local dev — Vite default ports.
  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:5173");
    origins.add("http://127.0.0.1:5173");
  }
  return origins;
}
const ALLOWED_ORIGINS = buildAllowedOrigins();
app.use(cors({
  credentials: true,
  origin(origin, cb) {
    // Same-origin requests (no Origin header) and curl/server-to-server hits
    // bypass the cross-origin path entirely; always allow them.
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    return cb(null, false);
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(createSessionMiddleware());

app.use("/api", router);

export default app;
