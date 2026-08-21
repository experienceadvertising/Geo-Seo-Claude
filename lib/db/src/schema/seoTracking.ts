import { boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/** A paid user's deliberate keyword/location/device tracking target. */
export const seoKeywordTargetsTable = pgTable("seo_keyword_targets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  domain: text("domain").notNull(),
  keyword: text("keyword").notNull(),
  locationCode: integer("location_code").notNull().default(2840),
  locationName: text("location_name").notNull().default("United States"),
  languageCode: text("language_code").notNull().default("en"),
  device: text("device").notNull().default("desktop"),
  targetUrl: text("target_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueTarget: uniqueIndex("seo_keyword_targets_unique")
    .on(table.userId, table.domain, table.keyword, table.locationCode, table.languageCode, table.device),
  userDomainIdx: index("seo_keyword_targets_user_domain_idx").on(table.userId, table.domain),
  activeIdx: index("seo_keyword_targets_active_idx").on(table.active, table.updatedAt),
}));

/** Immutable provider collection history. Null position means no matching result. */
export const seoRankSnapshotsTable = pgTable("seo_rank_snapshots", {
  id: serial("id").primaryKey(),
  targetId: integer("target_id").notNull(),
  position: integer("position"),
  resultPresent: boolean("result_present").notNull().default(false),
  resultUrl: text("result_url"),
  providerStatus: text("provider_status").notNull(),
  collectedAt: timestamp("collected_at").notNull().defaultNow(),
  collectionMode: text("collection_mode").notNull().default("weekly"),
}, (table) => ({
  targetCollectedIdx: index("seo_rank_snapshots_target_collected_idx").on(table.targetId, table.collectedAt),
}));

/** Records capped manual requests without logging the searched keyword in telemetry. */
export const seoRefreshUsageTable = pgTable("seo_refresh_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  targetId: integer("target_id").notNull(),
  month: text("month").notNull(),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
}, (table) => ({
  userMonthIdx: index("seo_refresh_usage_user_month_idx").on(table.userId, table.month),
}));

/** Async standard-mode jobs used for weekly collection. */
export const seoRankTasksTable = pgTable("seo_rank_tasks", {
  id: serial("id").primaryKey(),
  targetId: integer("target_id").notNull(),
  providerTaskId: text("provider_task_id").notNull(),
  status: text("status").notNull().default("queued"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  checkedAt: timestamp("checked_at"),
}, (table) => ({ targetStatusIdx: index("seo_rank_tasks_target_status_idx").on(table.targetId, table.status) }));

export type SeoKeywordTarget = typeof seoKeywordTargetsTable.$inferSelect;
export type SeoRankSnapshot = typeof seoRankSnapshotsTable.$inferSelect;
