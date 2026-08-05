import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

/** Small app-owned migrations for product tables not managed by Stripe. */
export async function runProductMigrations(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS processed_webhook_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      processed_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`ALTER TABLE processed_webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP NOT NULL DEFAULT NOW()`);
  await db.execute(sql`DELETE FROM processed_webhook_events WHERE processed_at < NOW() - INTERVAL '30 days'`);
  await db.execute(sql`ALTER TABLE audits ADD COLUMN IF NOT EXISTS has_no_snippet JSONB`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS recommendation_progress (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      recommendation_id TEXT NOT NULL,
      completed_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS recommendation_progress_user_domain_rec_uq
    ON recommendation_progress (user_id, domain, recommendation_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS recommendation_progress_user_domain_idx
    ON recommendation_progress (user_id, domain)
  `);
}
