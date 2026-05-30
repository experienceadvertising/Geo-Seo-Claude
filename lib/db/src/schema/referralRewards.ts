import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const referralRewardsTable = pgTable("referral_rewards", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id").notNull(),
  referredUserId: text("referred_user_id").notNull(),
  status: text("status").notNull().default("pending"),
  amountCents: integer("amount_cents").notNull().default(2500),
  stripeBalanceTxId: text("stripe_balance_tx_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
}, (table) => ({
  referrerIdx: index("referral_rewards_referrer_idx").on(table.referrerId),
  referredUserIdx: index("referral_rewards_referred_user_idx").on(table.referredUserId),
}));

export type ReferralReward = typeof referralRewardsTable.$inferSelect;
