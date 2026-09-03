import type Stripe from "stripe";

const EXCLUDED_WEBHOOK_EVENTS = new Set<Stripe.WebhookEndpointCreateParams.EnabledEvent>([
  // Stripe sends upcoming invoice previews without a durable invoice id.
  // stripe-replit-sync tries to retrieve that preview as a stored invoice and
  // returns 400. The app does not use this event, so do not subscribe to it.
  "invoice.upcoming",
]);

export function billingWebhookEvents(
  supportedEvents: Stripe.WebhookEndpointCreateParams.EnabledEvent[],
): Stripe.WebhookEndpointCreateParams.EnabledEvent[] {
  return supportedEvents.filter((event) => !EXCLUDED_WEBHOOK_EVENTS.has(event));
}
