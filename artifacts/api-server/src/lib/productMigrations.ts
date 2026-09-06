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
  await db.execute(sql`ALTER TABLE recommendation_progress ADD COLUMN IF NOT EXISTS implementation_note TEXT`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS seo_keyword_targets (
      id SERIAL PRIMARY KEY, user_id TEXT NOT NULL, domain TEXT NOT NULL,
      keyword TEXT NOT NULL, location_code INTEGER NOT NULL DEFAULT 2840,
      location_name TEXT NOT NULL DEFAULT 'United States', language_code TEXT NOT NULL DEFAULT 'en',
      device TEXT NOT NULL DEFAULT 'desktop', target_url TEXT, active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS seo_keyword_targets_unique ON seo_keyword_targets (user_id, domain, keyword, location_code, language_code, device)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS seo_keyword_targets_user_domain_idx ON seo_keyword_targets (user_id, domain)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS seo_keyword_targets_active_idx ON seo_keyword_targets (active, updated_at)`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS seo_rank_snapshots (
      id SERIAL PRIMARY KEY, target_id INTEGER NOT NULL, position INTEGER, result_present BOOLEAN NOT NULL DEFAULT FALSE,
      result_url TEXT, provider_status TEXT NOT NULL, collected_at TIMESTAMP NOT NULL DEFAULT NOW(),
      collection_mode TEXT NOT NULL DEFAULT 'weekly'
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS seo_rank_snapshots_target_collected_idx ON seo_rank_snapshots (target_id, collected_at)`);
  await db.execute(sql`ALTER TABLE seo_rank_snapshots ADD COLUMN IF NOT EXISTS competitors JSONB`);
  await db.execute(sql`ALTER TABLE seo_keyword_targets ADD COLUMN IF NOT EXISTS insights JSONB`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS seo_insight_usage (
    user_id TEXT NOT NULL, target_id INTEGER NOT NULL, month TEXT NOT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(), PRIMARY KEY (user_id, target_id, month)
  )`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS seo_refresh_usage (
      id SERIAL PRIMARY KEY, user_id TEXT NOT NULL, target_id INTEGER NOT NULL, month TEXT NOT NULL,
      requested_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS seo_refresh_usage_user_month_idx ON seo_refresh_usage (user_id, month)`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS seo_rank_tasks (
      id SERIAL PRIMARY KEY, target_id INTEGER NOT NULL, provider_task_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued', created_at TIMESTAMP NOT NULL DEFAULT NOW(), checked_at TIMESTAMP
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS seo_rank_tasks_target_status_idx ON seo_rank_tasks (target_id, status)`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY, user_id TEXT NOT NULL, endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL, auth TEXT NOT NULL, last_error TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_uq ON push_subscriptions (endpoint)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions (user_id)`);
}
