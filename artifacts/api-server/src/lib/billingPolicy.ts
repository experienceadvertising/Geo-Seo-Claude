import type Stripe from "stripe";

export type PaidPlan = "pro" | "agency";

const PAID_PLAN_RANK: Record<PaidPlan, number> = { pro: 1, agency: 2 };

export const ENTITLING_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

export const BLOCKING_SUBSCRIPTION_STATUSES = new Set([
  ...ENTITLING_SUBSCRIPTION_STATUSES,
  "incomplete",
  "paused",
  "unpaid",
]);

export function paidPlanFromProduct(
  product: Stripe.Price["product"],
): PaidPlan | null {
  if (!product || typeof product === "string" || "deleted" in product)
    return null;
  const plan = product.metadata?.plan_id;
  return plan === "pro" || plan === "agency" ? plan : null;
}

export function validateCheckoutPrice(
  price: Pick<Stripe.Price, "active" | "currency" | "recurring" | "product">,
  requestedPlan: unknown,
): { ok: true; plan: PaidPlan } | { ok: false; reason: string } {
  if (requestedPlan !== "pro" && requestedPlan !== "agency") {
    return { ok: false, reason: "A valid paid plan is required." };
  }
  if (!price.active)
    return { ok: false, reason: "That price is no longer active." };
  if (!price.recurring)
    return { ok: false, reason: "That price is not a recurring subscription." };
  if (price.currency.toLowerCase() !== "usd")
    return { ok: false, reason: "That price uses an unsupported currency." };

  const productPlan = paidPlanFromProduct(price.product);
  if (!productPlan)
    return { ok: false, reason: "That price is not part of an approved plan." };
  if (productPlan !== requestedPlan)
    return {
      ok: false,
      reason: "The selected price does not match the requested plan.",
    };
  return { ok: true, plan: productPlan };
}

export function isBlockingSubscriptionStatus(status: string): boolean {
  return BLOCKING_SUBSCRIPTION_STATUSES.has(status);
}

export function isEntitlingSubscriptionStatus(status: string): boolean {
  return ENTITLING_SUBSCRIPTION_STATUSES.has(status);
}

export function highestPaidPlan(
  plans: Array<PaidPlan | null>,
): PaidPlan | null {
  return plans.reduce<PaidPlan | null>((highest, plan) => {
    if (!plan) return highest;
    if (!highest || PAID_PLAN_RANK[plan] > PAID_PLAN_RANK[highest]) return plan;
    return highest;
  }, null);
}

export function planChangeDirection(
  previousPlan: string,
  nextPlan: PaidPlan,
): "Upgrade" | "Downgrade" | "Plan change" {
  if (previousPlan !== "pro" && previousPlan !== "agency") return "Upgrade";
  if (PAID_PLAN_RANK[nextPlan] > PAID_PLAN_RANK[previousPlan]) return "Upgrade";
  if (PAID_PLAN_RANK[nextPlan] < PAID_PLAN_RANK[previousPlan])
    return "Downgrade";
  return "Plan change";
}
