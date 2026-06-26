import Stripe from "stripe";

async function run() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not set");
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" as any });
  const WEBHOOK_URL = "https://aeoimprovement.com/api/stripe/webhook";
  const EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.source.expiring",
  ];

  const existing = await stripe.webhookEndpoints.list({ limit: 20 });
  const existingHook = existing.data.find(w => w.url === WEBHOOK_URL);

  if (existingHook) {
    const missing = EVENTS.filter(e => !existingHook.enabled_events.includes(e));
    if (missing.length === 0) {
      console.log("✅ Webhook already up to date:");
      console.log("  ID:     " + existingHook.id);
      console.log("  Events: " + existingHook.enabled_events.join(", "));
    } else {
      const updated = await stripe.webhookEndpoints.update(existingHook.id, {
        enabled_events: EVENTS,
      });
      console.log("✅ Webhook updated with new events:");
      console.log("  ID:     " + updated.id);
      console.log("  Events: " + updated.enabled_events.join(", "));
      console.log("\nNOTE: Stripe does not re-expose the signing secret after creation.");
      console.log("Your existing STRIPE_WEBHOOK_SECRET is still valid.");
    }
  } else {
    const hook = await stripe.webhookEndpoints.create({ url: WEBHOOK_URL, enabled_events: EVENTS });
    console.log("✅ Webhook registered successfully!");
    console.log("  ID:     " + hook.id);
    console.log("  Secret: " + hook.secret);
    console.log("\nSave the secret above as STRIPE_WEBHOOK_SECRET in your environment.");
  }
}

run().catch(e => { console.error("Error:", e.message); process.exit(1); });
