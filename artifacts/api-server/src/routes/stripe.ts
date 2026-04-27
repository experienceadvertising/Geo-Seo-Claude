import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { getUncachableStripeClient, getStripePublishableKey } from "../lib/stripeClient";
import { stripeStorage } from "../lib/stripeStorage";
import { getUserPlan } from "../lib/planUtils";
import { clerkClient } from "@clerk/express";

const router: IRouter = Router();

function getBaseUrl(req: any): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  return domain ? `https://${domain}` : `${req.protocol}://${req.get("host")}`;
}

router.get("/stripe/config", async (_req, res): Promise<void> => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err: any) {
    res.status(500).json({ error: "Stripe not configured" });
  }
});

router.get("/stripe/products", async (_req, res): Promise<void> => {
  try {
    const stripe = await getUncachableStripeClient();
    const [productsResp, pricesResp] = await Promise.all([
      stripe.products.list({ active: true, limit: 20 }),
      stripe.prices.list({ active: true, limit: 40 }),
    ]);

    const map = new Map<string, any>();
    for (const product of productsResp.data) {
      map.set(product.id, {
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata ?? {},
        prices: [],
      });
    }
    for (const price of pricesResp.data) {
      const entry = map.get(price.product as string);
      if (entry) {
        entry.prices.push({
          id: price.id,
          unitAmount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
          metadata: price.metadata ?? {},
        });
      }
    }

    res.json({ data: Array.from(map.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to list products" });
  }
});

router.get("/stripe/subscription", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;
    const user = await stripeStorage.getUser(userId);
    if (!user?.stripeCustomerId) {
      const plan = await getUserPlan(userId);
      res.json({ subscription: null, plan });
      return;
    }
    const stripe = await getUncachableStripeClient();
    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
    });
    const subscription = subs.data[0] ?? null;
    const plan = await getUserPlan(userId);
    res.json({ subscription, plan });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to get subscription" });
  }
});

router.post("/stripe/checkout", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;
    const { priceId, plan } = req.body as { priceId: string; plan?: string };

    if (!priceId) {
      res.status(400).json({ error: "priceId required" });
      return;
    }

    const stripe = await getUncachableStripeClient();

    let user = await stripeStorage.getUser(userId);
    let customerId = user?.stripeCustomerId ?? null;

    if (!customerId) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? undefined;
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });
      customerId = customer.id;
      await stripeStorage.upsertUser(userId, email ?? null, customerId);
    }

    const baseUrl = getBaseUrl(req);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      client_reference_id: userId,
      metadata: { userId, price_id: priceId, plan: plan ?? "" },
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/pricing?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to create checkout session" });
  }
});

router.post("/stripe/portal", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;
    const user = await stripeStorage.getUser(userId);

    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: "No billing account found. Please subscribe first." });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = getBaseUrl(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to create billing portal session" });
  }
});

export default router;
