# Billing and upgrade operations

## Source of truth

- Stripe product metadata must use `plan_id=pro` or `plan_id=agency`.
- Checkout accepts only active recurring USD prices whose product metadata matches the requested plan.
- Existing customers change plans through the Stripe billing portal. They must not start a second Checkout subscription.
- Stripe's current subscription state is the entitlement source of truth. Webhook retries must remain enabled until the local plan update succeeds.

## Current plan prices

- Pro: $79 monthly or $750 annually.
- Agency: $249 monthly or $2,390 annually.

The pricing page, structured data, lifecycle email copy, `llms.txt`, comparison data, and product seed script must stay aligned with these amounts.

## Google Analytics rollout constraint

The Google OAuth app is currently limited to 100 authorized users. GA4 AI-referral reporting is available to paying Pro and Agency customers, but the OAuth limit is an operational rollout ceiling rather than a plan quota.

Before promoting GA4 access broadly:

1. Confirm the remaining OAuth user capacity.
2. Complete the required Google verification or raise the authorization limit.
3. Avoid promising unlimited GA4 onboarding while the 100-user ceiling remains.

Search Console remains available from Pro upward. GA4 property selection and AI-referral reports require an active paid Pro or Agency plan. Trial access alone does not unlock GA4, which helps preserve the limited OAuth capacity for customers.

## Live Stripe follow-up

The live Stripe product descriptions should be checked after this code is released. The repository seed script now uses the evidence-backed feature descriptions and current prices, but this change does not alter the live Stripe account by itself.
