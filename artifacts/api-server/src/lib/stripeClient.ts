import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  // PREFER the Replit-managed Stripe integration when available.
  // The integration is bound per-environment (dev → sandbox, prod → live AEO
  // Optimization account). Reaching for it first keeps the app self-healing
  // even if stale STRIPE_* env-vars from a previous Stripe account get
  // chain-mirrored into the workspace or deployment.
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (hostname && xReplitToken) {
    const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
    const targetEnvironment = isProduction ? "production" : "development";

    const url = new URL(`https://${hostname}/api/v2/connection`);
    url.searchParams.set("include_secrets", "true");
    url.searchParams.set("connector_names", "stripe");
    url.searchParams.set("environment", targetEnvironment);

    const resp = await fetch(url.toString(), {
      headers: { Accept: "application/json", "X-Replit-Token": xReplitToken },
      signal: AbortSignal.timeout(10_000),
    });

    if (resp.ok) {
      const data = await resp.json();
      const settings = data.items?.[0]?.settings;
      if (settings?.secret && settings?.publishable) {
        return { publishableKey: settings.publishable, secretKey: settings.secret };
      }
    }
    // Fall through to env-var path if connector lookup fails or returns
    // incomplete settings — useful when running outside Replit.
  }

  // Fallback: explicit env-var override (for self-hosted / non-Replit deploys
  // where the integration isn't reachable).
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY) {
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
    };
  }

  throw new Error("Stripe not configured: connect the Stripe integration, or set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.");
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any });
}

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

let stripeSync: StripeSync | null = null;

export async function getStripeSync(): Promise<StripeSync> {
  if (!stripeSync) {
    const { secretKey } = await getCredentials();
    stripeSync = new StripeSync({
      poolConfig: { connectionString: process.env.DATABASE_URL!, max: 2 },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
