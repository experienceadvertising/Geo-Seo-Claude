import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// A user's connected Google account (OAuth) used to read GA4 traffic — chiefly
// AI-referral sessions (chatgpt.com, perplexity.ai, …) so visibility can be
// tied to real visits. One connection per user. Tokens are stored to allow
// background refresh; the refresh token is long-lived until revoked.
export const googleConnectionsTable = pgTable("google_connections", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"),
  // The GA4 property the user selected to report on, e.g. "properties/123456".
  ga4PropertyId: text("ga4_property_id"),
  ga4PropertyName: text("ga4_property_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGoogleConnectionSchema = createInsertSchema(googleConnectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGoogleConnection = z.infer<typeof insertGoogleConnectionSchema>;
export type GoogleConnection = typeof googleConnectionsTable.$inferSelect;
