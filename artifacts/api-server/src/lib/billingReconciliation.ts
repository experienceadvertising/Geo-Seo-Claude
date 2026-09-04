import type Stripe from "stripe";
import { stripeStorage } from "./stripeStorage.ts";
import { isBlockingSubscriptionStatus } from "./billingPolicy.ts";
import {
  selectStripeCustomerCandidate,
  type StripeCustomerCandidate,
} from "./billingCustomerSelection.ts";

export async function reconcileStripeCustomerForUser(options: {
  stripe: Stripe;
  userId: string;
  email: string | null | undefined;
  requireBlockingSubscription: boolean;
}): Promise<string | null> {
  const { stripe, userId, email, requireBlockingSubscription } = options;
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const customers = await stripe.customers.list({ email: normalizedEmail, limit: 100 });
  const liveCustomers = customers.data.filter((customer) => !customer.deleted);
  const candidates = await Promise.all(
    liveCustomers.map(async (customer) => {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 100,
      });
      return {
        id: customer.id,
        metadataUserId: customer.metadata?.userId || null,
        hasBlockingSubscription: subscriptions.data.some((subscription) =>
          isBlockingSubscriptionStatus(subscription.status),
        ),
      } satisfies StripeCustomerCandidate;
    }),
  );

  const customerId = selectStripeCustomerCandidate(
    candidates,
    userId,
    requireBlockingSubscription,
  );
  if (!customerId) return null;

  const customer = liveCustomers.find((candidate) => candidate.id === customerId);
  await stripeStorage.upsertUser(userId, normalizedEmail, customerId);
  if (customer && customer.metadata?.userId !== userId) {
    await stripe.customers.update(customerId, {
      metadata: { ...customer.metadata, userId },
    });
  }
  return customerId;
}
