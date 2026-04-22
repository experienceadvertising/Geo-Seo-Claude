import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const promptSimulationsTable = pgTable("prompt_simulations", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  auditId: integer("audit_id"),
  domain: text("domain").notNull(),
  brandName: text("brand_name"),
  prompts: jsonb("prompts").notNull(),
  results: jsonb("results").notNull(),
  summary: jsonb("summary").notNull(),
  status: text("status").notNull().default("complete"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPromptSimulationSchema = createInsertSchema(promptSimulationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPromptSimulation = z.infer<typeof insertPromptSimulationSchema>;
export type PromptSimulation = typeof promptSimulationsTable.$inferSelect;
