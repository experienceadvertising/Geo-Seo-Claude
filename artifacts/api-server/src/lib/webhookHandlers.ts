import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getUncachableStripeClient, getStripeSync } from "./stripeClient";
import { EmailService } from "./emailService";
import { logger } from "./logger";
import { creditReferralIfEligible, applyPendingReferralRewards } from "../routes/referral";

function newUnsubToken(): string {
  return randomBytes(32).toString("hex");
}

async function updateDbPlan(userId: string, plan: "free" | "pro" | "agency") {
  try {
    await db
      .update(usersTable)
      .set({ plan })
      .where(eq(usersTable.id, userId));
  } catch (err) {
    logger.error({ err, userId, plan }, "Failed to update DB plan");
  }
}

async function getPlanFromPriceId(priceId: string): Promise<"pro" | "agency" | null> {
  try {
    const stripe = await getUncachableStripeClient();
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product as any;
    const planId = product?.metadata?.plan_id;
    if (planId === "agency") return "agency";
    if (planId === "pro") return "pro";
    return null;
  } catch {
    return null;
  }
}

// Resolve a Stripe customer id back to our local user row. Returns the
// minimal contact fields we need for outbound notification emails.
async function getUserFromCustomer(
  customerId: string,
): Promise<{ id: string; email: string | null; firstName: string | null; plan: string } | null> {
  try {
    const result = await db.execute(
      sql`SELECT id, email, first_name AS "firstName", plan FROM users WHERE stripe_customer_id = ${customerId} LIMIT 1`
    );
    const row = result.rows[0] as any;
    if (row) return { id: row.id, email: row.email ?? null, firstName: row.firstName ?? null, plan: row.plan ?? "free" };
  } catch { /* ignore */ }

  // Fall back to the userId stashed in the Stripe customer metadata.
  try {
    const stripe = await getUncachableStripeClient();
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    const userId = (customer as any).metadata?.userId;
    if (!userId) return null;
    const [row] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        plan: usersTable.plan,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    return row ?? null;
  } catch {
    return null;
  }
}

function planLabel(plan: string): string {
  if (plan === "agency") return "Agency";
  if (plan === "pro") return "Pro";
  return "paid";
}

// Atomic idempotency claim. Inserts the event id into processed_webhook_events
// — the row only "wins" the first time we see this event. Stripe legitimately
// retries webhook deliveries (and during outages can deliver out of order /
// multiple times), so without this guard we'd resend payment-failed and
// subscription-canceled emails — and re-apply plan transitions — on every
// retry.
async function claimEvent(eventId: string, eventType: string): Promise<boolean> {
  if (!eventId) return true; // unparseable event — let it through, can't dedupe
  try {
    const result = await db.execute(
      sql`INSERT INTO processed_webhook_events (event_id, event_type)
          VALUES (${eventId}, ${eventType})
          ON CONFLICT (event_id) DO NOTHING
          RETURNING event_id`
    );
    return result.rows.length > 0;
  } catch (err) {
    // Fail CLOSED. The side effects guarded by this dedupe are financial
    // (plan transitions, real Stripe balance credits for referrals). If the
    // dedupe table is unavailable we must NOT process without it — re-throw
    // so the webhook returns a non-2xx and Stripe redelivers (it retries for
    // ~3 days). Processing-anyway here risks double-applying those effects on
    // every routine Stripe retry.
    logger.error({ err, eventId }, "Webhook idempotency check failed — failing closed for retry");
    throw err;
  }
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "Payload must be a Buffer — ensure webhook route is registered BEFORE express.json()"
      );
    }

    // Signature verification is MANDATORY. stripe-replit-sync verifies the
    // signature internally and throws on mismatch. If we let an unverified
    // payload through, an attacker could POST a forged checkout.session.completed
    // and grant themselves the Agency plan, or a forged subscription.deleted
    // and downgrade a real customer. This must abort the request.
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Past this point the signature is valid — safe to parse.
    let event: any;
    try {
      event = JSON.parse(payload.toString());
    } catch { return; }

    const type: string = event?.type ?? "";
    const eventId: string = event?.id ?? "";
    const obj = event?.data?.object;

    // Idempotency — if we've already processed this event, skip side effects
    // (plan changes, emails). Stripe retries duplicates routinely.
    const isFirstDelivery = await claimEvent(eventId, type);
    if (!isFirstDelivery) {
      logger.info({ eventId, type }, "Webhook event already processed — skipping");
      return;
    }

    if (type === "checkout.session.completed") {
      const userId: string | null = obj?.client_reference_id || obj?.metadata?.userId;
      const priceId: string | null = obj?.metadata?.price_id;
      const customerId: string | null = obj?.customer;

      if (userId) {
        const plan = priceId ? await getPlanFromPriceId(priceId) : null;
        if (plan) await updateDbPlan(userId, plan);

        if (customerId) {
          // Insert path needs a token (NOT NULL); update path leaves the
          // existing token alone.
          await db
            .insert(usersTable)
            .values({
              id: userId,
              email: obj?.customer_details?.email ?? null,
              stripeCustomerId: customerId,
              plan: plan ?? "free",
              unsubscribeToken: newUnsubToken(),
            })
            .onConflictDoUpdate({
              target: usersTable.id,
              set: { stripeCustomerId: customerId, ...(plan ? { plan } : {}) },
            })
            .catch((e) => logger.error({ err: e?.message, userId }, "Failed to upsert user"));
        }

        // Credit the referrer $25 if this user was referred
        creditReferralIfEligible(userId).catch((err) =>
          logger.error({ err, userId }, "creditReferralIfEligible failed"),
        );

        // If this upgrading user was themselves a referrer with pending rewards
        // banked while they were on a free plan, apply those now that they have
        // a Stripe customer ID.
        if (customerId) {
          applyPendingReferralRewards(userId, customerId).catch((err) =>
            logger.error({ err, userId }, "applyPendingReferralRewards failed"),
          );
        }

        // Operational notification — fires once per checkout because the
        // outer claimEvent() guard prevents duplicate webhook deliveries
        // from re-triggering this block.
        if (plan) {
          const customerEmail =
            obj?.customer_details?.email ??
            (await (async () => {
              try {
                const [u] = await db
                  .select({ email: usersTable.email })
                  .from(usersTable)
                  .where(eq(usersTable.id, userId));
                return u?.email ?? null;
              } catch { return null; }
            })());
          const amountTotal = obj?.amount_total != null ? `$${(obj.amount_total / 100).toFixed(2)} ${(obj?.currency || "usd").toUpperCase()}` : "(unknown amount)";
          EmailService.sendAdminNotification(`[Upgrade] ${customerEmail || userId} → ${planLabel(plan)}`, [
            `User upgraded`,
            ``,
            `Email: ${customerEmail || "(not on session)"}`,
            `User ID: ${userId}`,
            `Plan: ${planLabel(plan)}`,
            `Amount: ${amountTotal}`,
            `Stripe customer: ${customerId || "(none)"}`,
            `Time: ${new Date().toISOString()}`,
          ]).catch((err) => logger.warn({ err, userId }, "Admin upgrade notification failed"));
        }
      }
    }

    if (type === "customer.subscription.updated") {
      const customerId: string = obj?.customer;
      const status: string = obj?.status;
      const priceId: string | null = obj?.items?.data?.[0]?.price?.id ?? null;
      const user = customerId ? await getUserFromCustomer(customerId) : null;

      if (user) {
        if (status === "active" || status === "trialing") {
          const plan = priceId ? await getPlanFromPriceId(priceId) : null;
          if (plan) {
            await updateDbPlan(user.id, plan);
            // Admin notification on tier change via the Stripe billing
            // portal (Pro→Agency upgrade, Agency→Pro downgrade). Skip when
            // the plan is unchanged — Stripe also fires `updated` for noisy
            // non-plan events like card-on-file changes, billing-cycle
            // anchor moves, and proration line items.
            if (plan !== user.plan) {
              const direction = planLabel(plan) > planLabel(user.plan) ? "Upgrade" : "Plan change";
              EmailService.sendAdminNotification(
                `[${direction}] ${user.email || user.id} ${planLabel(user.plan)} → ${planLabel(plan)}`,
                [
                  `User changed plan via Stripe billing portal`,
                  ``,
                  `Email: ${user.email || "(unknown)"}`,
                  `User ID: ${user.id}`,
                  `Previous plan: ${planLabel(user.plan)}`,
                  `New plan: ${planLabel(plan)}`,
                  `Stripe customer: ${customerId}`,
                  `Time: ${new Date().toISOString()}`,
                ],
              ).catch((err) => logger.warn({ err, userId: user.id }, "Admin plan-change notification failed"));
            }
          }
        } else if (status === "past_due") {
          // Don't downgrade yet — Stripe will retry the invoice for several
          // days under Smart Retries. Downgrading immediately on past_due
          // means a one-day card hiccup wipes out a paying customer's
          // access. The actual downgrade happens when Stripe gives up and
          // either fires customer.subscription.deleted or transitions the
          // sub to canceled/unpaid.
          logger.info({ userId: user.id, status }, "Subscription past_due — keeping plan during grace period");
        } else if (status === "canceled" || status === "unpaid") {
          await updateDbPlan(user.id, "free");
        }
      }
    }

    if (type === "customer.subscription.deleted") {
      const customerId: string = obj?.customer;
      const user = customerId ? await getUserFromCustomer(customerId) : null;
      if (user) {
        const previousPlan = user.plan;
        await updateDbPlan(user.id, "free");
        if (user.email && previousPlan !== "free") {
          EmailService.sendSubscriptionCanceled(user.email, user.firstName || "", planLabel(previousPlan)).catch(
            (err) => logger.error({ err, userId: user.id }, "Subscription-canceled email failed"),
          );
        }
        if (previousPlan !== "free") {
          const reason: string = obj?.cancellation_details?.reason || obj?.cancellation_details?.feedback || "(no reason given)";
          EmailService.sendAdminNotification(`[Cancel] ${user.email || user.id} (was ${planLabel(previousPlan)})`, [
            `User canceled subscription`,
            ``,
            `Email: ${user.email || "(unknown)"}`,
            `User ID: ${user.id}`,
            `Previous plan: ${planLabel(previousPlan)}`,
            `Reason: ${reason}`,
            `Stripe customer: ${customerId}`,
            `Time: ${new Date().toISOString()}`,
          ]).catch((err) => logger.warn({ err, userId: user.id }, "Admin cancel notification failed"));
        }
      }
    }

    if (type === "invoice.payment_failed") {
      const customerId: string = obj?.customer;
      const attemptCount: number = obj?.attempt_count ?? 1;
      const nextRetryUnix: number | null = obj?.next_payment_attempt ?? null;
      const nextRetryAt = nextRetryUnix ? new Date(nextRetryUnix * 1000) : null;
      const user = customerId ? await getUserFromCustomer(customerId) : null;
      if (user?.email) {
        EmailService.sendPaymentFailed(user.email, user.firstName || "", attemptCount, nextRetryAt).catch(
          (err) => logger.error({ err, userId: user.id }, "Payment-failed email failed"),
        );
      }
    }
  }
}
