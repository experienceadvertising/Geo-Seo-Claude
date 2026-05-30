import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  firstName: text("first_name"),
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  verificationExpires: timestamp("verification_expires"),
  resetToken: text("reset_token"),
  resetExpires: timestamp("reset_expires"),
  plan: text("plan").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Email series tracking
  welcomeEmailSentAt: timestamp("welcome_email_sent_at"),
  welcomeD3SentAt: timestamp("welcome_d3_sent_at"),
  welcomeD7SentAt: timestamp("welcome_d7_sent_at"),

  // Report tracking
  lastWeeklyReportAt: timestamp("last_weekly_report_at"),
  lastMonthlyReportAt: timestamp("last_monthly_report_at"),

  // Preferences
  emailOptOut: boolean("email_opt_out").default(false).notNull(),

  // Per-user random token used in the unsubscribe link of every outbound
  // email. We never put the user id (or anything else identifying) in the
  // URL — just an opaque secret that maps back to one row.
  // NOT NULL + UNIQUE enforced at the DB level via raw migration; declared
  // here as required so any new code path inserting a user must supply one.
  unsubscribeToken: text("unsubscribe_token").notNull(),

  // Referral program
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),

  // First-audit milestone — set when the user completes their very first
  // audit. Drives the "you ran your first audit, here's how to go deeper"
  // celebratory email and prevents resending it.
  firstAuditAt: timestamp("first_audit_at"),

  // "What you didn't see" upsell email throttle. Fires after free-user
  // audits to show what their report would look like with all 4 engines
  // + the Fix Generator output for their actual #1 issue. Throttled to
  // at most once per 7 days so a power-user free account doesn't get
  // spammed on every audit. Set to NOW() at send time, checked as
  // `whatYouMissedSentAt < now() - 7d || IS NULL` before the next send.
  whatYouMissedSentAt: timestamp("what_you_missed_sent_at"),
}, (table) => ({
  // Login and every "find user by email" path filter on email; the
  // verify-email and reset-password flows look rows up by their token.
  // Without these, each is a full table scan that worsens as users grow.
  emailIdx: index("users_email_idx").on(table.email),
  verificationTokenIdx: index("users_verification_token_idx").on(table.verificationToken),
  resetTokenIdx: index("users_reset_token_idx").on(table.resetToken),
}));

export type User = typeof usersTable.$inferSelect;
