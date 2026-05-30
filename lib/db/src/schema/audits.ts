import { pgTable, serial, text, real, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditsTable = pgTable("audits", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  geoScore: real("geo_score").notNull(),
  scores: jsonb("scores").notNull(),
  crawlers: jsonb("crawlers").notNull(),
  citabilityBlocks: jsonb("citability_blocks").notNull(),
  avgCitabilityScore: real("avg_citability_score").notNull(),
  schemaTypes: jsonb("schema_types").notNull(),
  platforms: jsonb("platforms").notNull(),
  quickWins: jsonb("quick_wins").notNull(),
  technicalIssues: jsonb("technical_issues").notNull(),
  hasLlmsTxt: jsonb("has_llms_txt").notNull().$type<boolean>(),
  hasHttps: jsonb("has_https").notNull().$type<boolean>(),
  hasCanonical: jsonb("has_canonical").notNull().$type<boolean>(),
  wordCount: integer("word_count").notNull(),
  rawHtmlWordCount: integer("raw_html_word_count"),
  renderedWordCount: integer("rendered_word_count"),
  requiresJavaScript: jsonb("requires_javascript").$type<boolean>(),
  renderedSuccessfully: jsonb("rendered_successfully").$type<boolean>(),
  aiInsights: text("ai_insights"),
  brandName: text("brand_name"),
  brandSignals: jsonb("brand_signals"),
  recommendations: jsonb("recommendations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // The dashboard lists a user's audits newest-first and the history/score-
  // changed paths filter by user then scan recent rows; a composite
  // (user_id, created_at) index serves both without a full table scan.
  userCreatedIdx: index("audits_user_created_idx").on(table.userId, table.createdAt),
}));

export const insertAuditSchema = createInsertSchema(auditsTable).omit({ id: true, createdAt: true });
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof auditsTable.$inferSelect;
