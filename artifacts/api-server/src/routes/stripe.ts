import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { getUncachableStripeClient, getStripePublishableKey } from "../lib/stripeClient";
import { stripeStorage } from "../lib/stripeStorage";
// Billing surfaces key off the PAID plan, not the free-first-month
// entitlement bump — a trial user must still see upgrade CTAs.
import { getStoredPlan } from "../lib/planUtils";
import { safeBaseUrl } from "../lib/publicUrl";
import { logger } from "../lib/logger";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { isBlockingSubscriptionStatus, paidPlanFromProduct, validateCheckoutPrice } from "../lib/billingPolicy";

const router: IRouter = Router();

function getBaseUrl(req: any): string {
  return safeBaseUrl(req);
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
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, type: "recurring", limit: 100 }),
    ]);

    const map = new Map<string, any>();
    for (const product of productsResp.data) {
      if (product.metadata?.plan_id !== "starter" && product.metadata?.plan_id !== "pro" && product.metadata?.plan_id !== "agency") continue;
      map.set(product.id, {
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata ?? {},
        prices: [],
      });
    }
    for (const price of pricesResp.data.sort((a, b) => b.created - a.created)) {
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
    logger.error({ err: err?.message }, "Failed to list Stripe products");
    res.status(500).json({ error: "Failed to list products" });
  }
});

router.get("/stripe/subscription", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;
    const user = await stripeStorage.getUser(userId);
    if (!user?.stripeCustomerId) {
      const plan = await getStoredPlan(userId);
      res.json({ subscription: null, plan, canManageBilling: false });
      return;
    }
    const stripe = await getUncachableStripeClient();
    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      limit: 100,
      expand: ["data.items.data.price.product"],
    });
    const subscription = subs.data.find((sub) => isBlockingSubscriptionStatus(sub.status)) ?? null;
    const plan = await getStoredPlan(userId);
    const price = subscription?.items.data[0]?.price;
    res.json({
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
        plan: price ? paidPlanFromProduct(price.product) : null,
      } : null,
      plan,
      canManageBilling: true,
    });
  } catch (err: any) {
    logger.error({ err: err?.message, userId: req.userId }, "Failed to get subscription");
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

router.post("/stripe/checkout", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;
    const body = (req.body ?? {}) as { priceId?: unknown; plan?: unknown };
    const priceId = typeof body.priceId === "string" ? body.priceId : "";
    const plan = typeof body.plan === "string" ? body.plan : undefined;

    if (!priceId) {
      res.status(400).json({ error: "priceId required" });
      return;
    }

    const stripe = await getUncachableStripeClient();

    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const validation = validateCheckoutPrice(price, plan);
    if (!validation.ok) {
      res.status(400).json({ error: validation.reason });
      return;
    }

    let user = await stripeStorage.getUser(userId);
    let customerId = user?.stripeCustomerId ?? null;

    if (!customerId) {
      // Get email from DB
      const [dbUser] = await db
        .select({ email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, userId));
      const email = dbUser?.email ?? undefined;
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      }, { idempotencyKey: `aeo-customer-${userId}` });
      customerId = customer.id;
      await stripeStorage.upsertUser(userId, email ?? null, customerId);
    }

    const openSessions = await stripe.checkout.sessions.list({
      customer: customerId,
      status: "open",
      limit: 100,
    });
    const reusableSession = openSessions.data.find((session) => session.metadata?.price_id === priceId && session.url);
    if (reusableSession?.url) {
      res.json({ url: reusableSession.url });
      return;
    }
    await Promise.all(
      openSessions.data
        .filter((session) => session.mode === "subscription")
        .map((session) => stripe.checkout.sessions.expire(session.id)),
    );

    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
    });
    if (existingSubscriptions.data.some((subscription) => isBlockingSubscriptionStatus(subscription.status))) {
      res.status(409).json({
        error: "You already have a subscription. Use Manage Billing to change your plan.",
        code: "subscription_exists",
        manageBilling: true,
      });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      client_reference_id: userId,
      metadata: { userId, price_id: priceId, plan: validation.plan },
      subscription_data: { metadata: { userId, plan: validation.plan } },
      // Land successful upgrades on the dashboard, NOT back on /pricing —
      // returning a paying user to the pricing page after they just paid is
      // jarring (it implies the purchase didn't take). Home renders a
      // success toast, invalidates the plan query so new entitlements show
      // immediately, then strips the query param. Cancel stays on /pricing
      // because the user is mid-comparison and likely wants to pick a
      // different tier.
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/pricing?checkout=cancel`,
    });
    // No idempotency key on purpose: a fixed `${userId}-${priceId}` key made
    // Stripe replay the ORIGINAL response for 24h, handing users a session
    // we had since expired (switched plans) or already completed (cancelled
    // and re-subscribed). The open-session reuse above is the real dedupe.

    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err: err?.message, userId: req.userId }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to create checkout session" });
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
    logger.error({ err: err?.message, userId: req.userId }, "Failed to create billing portal session");
    res.status(500).json({ error: "Failed to create billing portal session" });
  }
});

export default router;
