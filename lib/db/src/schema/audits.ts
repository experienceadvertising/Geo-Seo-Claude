import { pgTable, serial, text, real, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditsTable = pgTable("audits", {
  id: serial("id").primaryKey(),
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
  aiInsights: text("ai_insights"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditSchema = createInsertSchema(auditsTable).omit({ id: true, createdAt: true });
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof auditsTable.$inferSelect;
