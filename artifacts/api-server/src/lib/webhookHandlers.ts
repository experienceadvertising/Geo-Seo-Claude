import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getUncachableStripeClient, getStripeSync } from "./stripeClient";

async function updateDbPlan(userId: string, plan: "free" | "pro" | "agency") {
  try {
    await db
      .update(usersTable)
      .set({ plan })
      .where(eq(usersTable.id, userId));
  } catch (err) {
    console.error(`Failed to update DB plan for user ${userId}:`, err);
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

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  try {
    const result = await db.execute(
      sql`SELECT id FROM users WHERE stripe_customer_id = ${customerId}`
    );
    if (result.rows[0]) return (result.rows[0] as any).id;
  } catch { /* ignore */ }

  try {
    const stripe = await getUncachableStripeClient();
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return (customer as any).metadata?.userId ?? null;
  } catch {
    return null;
  }
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "Payload must be a Buffer — ensure webhook route is registered BEFORE express.json()"
      );
    }

    // Let stripe-replit-sync handle the sync (best-effort)
    try {
      const sync = await getStripeSync();
      await sync.processWebhook(payload, signature);
    } catch (err) {
      console.warn("StripeSync.processWebhook error (non-fatal):", (err as any)?.message);
    }

    let event: any;
    try {
      event = JSON.parse(payload.toString());
    } catch { return; }

    const type: string = event?.type ?? "";
    const obj = event?.data?.object;

    if (type === "checkout.session.completed") {
      const userId: string | null = obj?.client_reference_id || obj?.metadata?.userId;
      const priceId: string | null = obj?.metadata?.price_id;
      const customerId: string | null = obj?.customer;

      if (userId) {
        const plan = priceId ? await getPlanFromPriceId(priceId) : null;
        if (plan) await updateDbPlan(userId, plan);

        if (customerId) {
          await db
            .insert(usersTable)
            .values({ id: userId, email: obj?.customer_details?.email ?? null, stripeCustomerId: customerId, plan: plan ?? "free" })
            .onConflictDoUpdate({
              target: usersTable.id,
              set: { stripeCustomerId: customerId, ...(plan ? { plan } : {}) },
            })
            .catch((e) => console.error("Failed to upsert user:", e.message));
        }
      }
    }

    if (type === "customer.subscription.updated") {
      const customerId: string = obj?.customer;
      const status: string = obj?.status;
      const priceId: string | null = obj?.items?.data?.[0]?.price?.id ?? null;
      const userId = customerId ? await getUserIdFromCustomer(customerId) : null;

      if (userId) {
        if (status === "active" || status === "trialing") {
          const plan = priceId ? await getPlanFromPriceId(priceId) : null;
          if (plan) await updateDbPlan(userId, plan);
        } else if (["canceled", "unpaid", "past_due"].includes(status)) {
          await updateDbPlan(userId, "free");
        }
      }
    }

    if (type === "customer.subscription.deleted") {
      const customerId: string = obj?.customer;
      const userId = customerId ? await getUserIdFromCustomer(customerId) : null;
      if (userId) await updateDbPlan(userId, "free");
    }
  }
}
