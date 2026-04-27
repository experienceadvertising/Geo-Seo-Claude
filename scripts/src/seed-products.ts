import Stripe from "stripe";

async function getStripeClient(): Promise<Stripe> {
  // Direct env var — used when seeding live account
  if (process.env.STRIPE_SECRET_KEY) {
    console.log("Using STRIPE_SECRET_KEY from environment");
    return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" as any });
  }

  // Fallback: Replit-managed sandbox
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
  const secretKey = data.items?.[0]?.settings?.secret;
  if (!secretKey) throw new Error("Stripe secret key not found in integration.");
  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any });
}

async function createProducts() {
  const stripe = await getStripeClient();
  console.log("Creating AEO Improvement plans in Stripe...");

  const plans = [
    {
      name: "Pro Plan",
      description: "25 prompts, all 4 AI engines (ChatGPT, Claude, Gemini, Perplexity), sentiment analysis, Fix Generator, competitor tracking, 1-year trend history.",
      plan_id: "pro",
      monthly: 7900,
      yearly: 75000,
    },
    {
      name: "Agency Plan",
      description: "Everything in Pro, plus 2-year history, Agency branding, and priority support for teams managing multiple client sites.",
      plan_id: "agency",
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
      console.log(`  ↳ ${plan.name} already exists (${product.id})`);
      // Ensure metadata is set
      if (!product.metadata?.plan_id) {
        product = await stripe.products.update(product.id, {
          metadata: { plan_id: plan.plan_id },
        });
        console.log(`  ✓ Updated metadata for ${plan.name}`);
      }
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { plan_id: plan.plan_id },
      });
      console.log(`  ✓ Created product: ${plan.name} (${product.id})`);
    }

    const existingPrices = await stripe.prices.list({ product: product.id, active: true });
    const hasMonthly = existingPrices.data.some(p => p.recurring?.interval === "month");
    const hasYearly = existingPrices.data.some(p => p.recurring?.interval === "year");

    if (!hasMonthly) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthly,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { plan_id: plan.plan_id, billing: "monthly" },
      });
      console.log(`  ✓ Created monthly price: $${plan.monthly / 100}/mo (${price.id})`);
    } else {
      console.log(`  ↳ Monthly price already exists`);
    }

    if (!hasYearly) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearly,
        currency: "usd",
        recurring: { interval: "year" },
        metadata: { plan_id: plan.plan_id, billing: "yearly" },
      });
      console.log(`  ✓ Created yearly price: $${plan.yearly / 100}/yr (${price.id})`);
    } else {
      console.log(`  ↳ Yearly price already exists`);
    }
  }

  console.log("\n✅ Done!");
}

createProducts().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
