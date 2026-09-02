import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./lib/stripeClient";
import { startEmailScheduler } from "./lib/emailScheduler";
import { runFreeMonthPromoGrant } from "./lib/promoGrant";
import { runProductMigrations } from "./lib/productMigrations";
import { isProduction as isProd } from "./lib/env";

async function initStripe() {
  const isProduction = isProd();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set — skipping Stripe initialization");
    return;
  }
  try {
    logger.info("Initializing Stripe schema...");
    await runMigrations({ databaseUrl });
    logger.info("Stripe schema ready");
  } catch (err) {
    // Schema migrations failing is fatal — without the stripe.* tables no
    // checkout / webhook flow can work. Surface loudly so deploys don't
    // silently come up with a broken Stripe layer.
    logger.error({ err }, "Stripe schema migration failed");
    throw err;
  }

  try {
    const stripeSync = await getStripeSync();
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    const frontendUrl = process.env.FRONTEND_URL;
    const webhookBaseUrl = domain
      ? `https://${domain}`
      : frontendUrl ? new URL(frontendUrl).origin : null;
    if (webhookBaseUrl) {
      const webhookUrl = `${webhookBaseUrl}/api/stripe/webhook`;
      await stripeSync.findOrCreateManagedWebhook(webhookUrl);
      logger.info({ webhookUrl }, "Stripe webhook configured");
    } else if (isProduction) {
      throw new Error("A production hostname is required to configure the Stripe webhook");
    } else {
      logger.warn("REPLIT_DOMAINS not set — skipping webhook auto-creation");
    }

    // Backfill in background — don't block server start
    stripeSync.syncBackfill()
      .then(() => logger.info("Stripe backfill complete"))
      .catch((err) => logger.warn({ err }, "Stripe backfill error (non-fatal)"));
  } catch (err) {
    if (isProduction) {
      logger.error({ err }, "Stripe webhook setup failed in production");
      throw err;
    }
    logger.warn({ err }, "Stripe webhook/sync setup skipped in development");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  await initStripe();
  await runProductMigrations();
  // Non-fatal: the claim row releases on failure, so the next boot retries
  // (e.g. when the drizzle push for the new columns hasn't run yet).
  await runFreeMonthPromoGrant().catch((err) =>
    logger.error({ err }, "Free-month promo grant failed — will retry next boot"),
  );
  startEmailScheduler();
  const server = app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });

  // Graceful shutdown: stop accepting new connections, let in-flight requests
  // finish, then exit. Autoscale deploys send SIGTERM before recycling a
  // container; without this, in-flight audits are cut off mid-response.
  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutting down");
    const forceExit = setTimeout(() => {
      logger.warn("Forced exit after shutdown timeout");
      process.exit(1);
    }, 10_000);
    forceExit.unref();
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

// Log (rather than silently drop) rejections that escape every handler, so
// they show up in monitoring instead of only as a process crash.
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
