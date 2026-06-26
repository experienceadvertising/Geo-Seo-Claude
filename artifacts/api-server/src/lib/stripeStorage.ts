import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

export class StripeStorage {
  async getUser(userId: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    return user ?? null;
  }

  async upsertUser(userId: string, email: string | null, stripeCustomerId?: string) {
    // unsubscribe_token is NOT NULL — supply one on the INSERT branch. The
    // ON CONFLICT update path does NOT touch it, so existing users keep
    // their original token (any rotation here would invalidate previously
    // mailed unsubscribe links).
    const [user] = await db
      .insert(usersTable)
      .values({
        id: clerkUserId,
        email,
        stripeCustomerId: stripeCustomerId ?? null,
        unsubscribeToken: randomBytes(32).toString("hex"),
      })
      .onConflictDoUpdate({
        target: usersTable.id,
        set: {
          email: sql`EXCLUDED.email`,
          stripeCustomerId: stripeCustomerId ? stripeCustomerId : sql`users.stripe_customer_id`,
        },
      })
      .returning();
    return user;
  }

  async listProductsWithPrices() {
    const result = await db.execute(sql`
      WITH paginated_products AS (
        SELECT id, name, description, metadata, active
        FROM stripe.products
        WHERE active = true
        ORDER BY id
      )
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.active as product_active,
        p.metadata as product_metadata,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active as price_active,
        pr.metadata as price_metadata
      FROM paginated_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY pr.unit_amount
    `);
    return result.rows;
  }

  async getActiveSubscriptionForCustomer(stripeCustomerId: string) {
    const result = await db.execute(sql`
      SELECT id, status, current_period_end, items, metadata
      FROM stripe.subscriptions
      WHERE customer = ${stripeCustomerId}
        AND status IN ('active', 'trialing')
      LIMIT 1
    `);
    return (result.rows[0] as any) ?? null;
  }
}

export const stripeStorage = new StripeStorage();
