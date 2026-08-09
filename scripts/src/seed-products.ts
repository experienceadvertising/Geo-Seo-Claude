import Stripe from "stripe";

type ReplitStripeConnectionResponse = {
  items?: Array<{
    settings?: {
      secret?: string;
    };
  }>;
};

function getReplitStripeSecret(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const { items } = data as ReplitStripeConnectionResponse;
  return items?.[0]?.settings?.secret;
}

async function getStripeClient(): Promise<Stripe> {
  if (process.env.STRIPE_SECRET_KEY) {
    console.log("Using STRIPE_SECRET_KEY from environment");
    return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" as any });
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error("No Stripe credentials found. Set STRIPE_SECRET_KEY or connect the Stripe integration.");
  }

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", "development");

  const resp = await fetch(url.toString(), {
    headers: { Accept: "application/json", "X-Replit-Token": xReplitToken },
  });
  const data = await resp.json();
  const secretKey = getReplitStripeSecret(data);
  if (!secretKey) throw new Error("Stripe secret key not found in integration.");
  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any });
}

async function upsertPrice(
  stripe: Stripe,
  productId: string,
  interval: "month" | "year",
  targetAmount: number,
  planId: string,
): Promise<void> {
  const existing = await stripe.prices.list({ product: productId, active: true });
  const current = existing.data.find(p => p.recurring?.interval === interval);

  if (current) {
    if (current.unit_amount === targetAmount) {
      console.log(`  ↳ ${interval}ly price already correct ($${targetAmount / 100})`);
      return;
    }
    // Stripe prices are immutable — archive the old one, create a new one.
    await stripe.prices.update(current.id, { active: false });
    console.log(`  ✗ Archived old ${interval}ly price $${(current.unit_amount ?? 0) / 100} (${current.id})`);
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: targetAmount,
    currency: "usd",
    recurring: { interval },
    metadata: { plan_id: planId, billing: interval === "month" ? "monthly" : "yearly" },
  });
  console.log(`  ✓ Created ${interval}ly price: $${targetAmount / 100} (${price.id})`);
}

async function createProducts() {
  const stripe = await getStripeClient();
  console.log("Syncing AEO Improvement plans in Stripe...\n");

  const plans = [
    {
      name: "Pro Plan",
      description: "100 audits/month, 30 simulations/month, all 4 AI engines (ChatGPT, Claude, Gemini, Perplexity), GA4 AI-referral reporting, Fix Generator, competitor tracking, and 1-year trend history.",
      plan_id: "pro",
      // $79/mo, $750/yr (about 20% off, $62.50/mo)
      monthly: 7900,
      yearly: 75000,
    },
    {
      name: "Agency Plan",
      description: "150 audits/month, 40 simulations/month, everything in Pro plus up to 10 active client sites, two daily monitoring slots, one GA4 property per workspace while connection capacity is limited, 2-year trend history, and priority support.",
      plan_id: "agency",
      // $249/mo, $2,390/yr (about 20% off, $199.17/mo)
      monthly: 24900,
      yearly: 239000,
    },
  ];

  for (const plan of plans) {
    const existing = await stripe.products.search({
      query: `name:'${plan.name}' AND active:'true'`,
    });

    let product: Stripe.Product;
    if (existing.data.length > 0) {
      product = existing.data[0];
      console.log(`${plan.name} (${product.id})`);
      if (product.metadata?.plan_id !== plan.plan_id || product.description !== plan.description) {
        product = await stripe.products.update(product.id, {
          description: plan.description,
          metadata: { plan_id: plan.plan_id },
        });
      }
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { plan_id: plan.plan_id },
      });
      console.log(`  ✓ Created product: ${plan.name} (${product.id})`);
    }

    await upsertPrice(stripe, product.id, "month", plan.monthly, plan.plan_id);
    await upsertPrice(stripe, product.id, "year", plan.yearly, plan.plan_id);
    console.log();
  }

  console.log("✅ Done!");
}

createProducts().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
