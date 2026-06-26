import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// One row per detected AI-crawler fetch of a page carrying the user's tracking
// pixel. We deliberately log ONLY requests whose User-Agent matches a known AI
// bot — never human visitors — so this table holds no personal browsing data
// and needs no consent banner. No IP is stored.
export const crawlerHitsTable = pgTable("crawler_hits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  // Friendly crawler name (e.g. "GPTBot", "ClaudeBot", "PerplexityBot").
  crawler: text("crawler").notNull(),
  // Raw User-Agent (truncated) for transparency / debugging.
  userAgent: text("user_agent"),
  // Page the pixel was embedded on, derived from the Referer header.
  path: text("path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // The dashboard aggregates a user's hits by crawler over a recent window.
  userCreatedIdx: index("crawler_hits_user_created_idx").on(table.userId, table.createdAt),
}));

export const insertCrawlerHitSchema = createInsertSchema(crawlerHitsTable).omit({ id: true, createdAt: true });
export type InsertCrawlerHit = z.infer<typeof insertCrawlerHitSchema>;
export type CrawlerHit = typeof crawlerHitsTable.$inferSelect;
