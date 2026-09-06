import { pgTable, serial, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  endpointUnique: uniqueIndex("push_subscriptions_endpoint_uq").on(table.endpoint),
  userIdx: index("push_subscriptions_user_idx").on(table.userId),
}));

export type PushSubscriptionRecord = typeof pushSubscriptionsTable.$inferSelect;
