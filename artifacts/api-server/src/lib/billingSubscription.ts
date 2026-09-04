import type Stripe from "stripe";
import { isBlockingSubscriptionStatus } from "./billingPolicy.ts";

export async function getBillingSubscription(
  stripe: Pick<Stripe, "subscriptions">,
  customerId: string,
) {
  // Expanding the product on a list exceeds Stripe's four-level limit.
  // Select the subscription first, then expand on the individual resource.
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });
  const subscription = subscriptions.data.find((sub) => isBlockingSubscriptionStatus(sub.status));
  if (!subscription) return null;
  return stripe.subscriptions.retrieve(subscription.id, {
    expand: ["items.data.price.product"],
  });
}
