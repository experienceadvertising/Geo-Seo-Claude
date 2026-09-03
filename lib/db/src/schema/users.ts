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

  // AI-crawler hit-logging: an opaque per-user token embedded in the tracking
  // pixel (<img src=".../api/crawler-pixel/{token}.gif">). When an AI bot
  // fetches a page carrying the pixel we log the visit against this user.
  // Generated lazily the first time the user opens the Crawler Activity view.
  crawlerToken: text("crawler_token").unique(),

  // Free all-access first month. Every new account gets every feature
  // (Agency-level entitlements) until this timestamp; set to signup + 30
  // days when the email is verified. NULL means "not activated yet" for
  // unverified accounts and "derive from createdAt + 30 days" for verified
  // accounts that predate the column,
  // without a backfill. Effective-plan resolution lives in
  // api-server/src/lib/planUtils.ts.
  trialEndsAt: timestamp("trial_ends_at"),
  // Trial lifecycle email flags — set at send time so the daily scheduler
  // job sends each at most once per user (same pattern as the welcome series).
  trialReminderSentAt: timestamp("trial_reminder_sent_at"),
  trialEndedSentAt: timestamp("trial_ended_sent_at"),

  // Free-month launch promo. When the free-first-month feature shipped, a
  // one-time startup job (api-server lib/promoGrant.ts) granted every
  // EXISTING account a fresh 30-day all-access month and stamped this
  // column. It marks who is eligible for the one-off announcement email
  // (sent-once via trial_promo_email_sent_at); accounts created after
  // launch stay NULL — their welcome email already covers the free month.
  trialPromoGrantedAt: timestamp("trial_promo_granted_at"),
  trialPromoEmailSentAt: timestamp("trial_promo_email_sent_at"),

  // First-audit milestone — set when the user completes their very first
  // audit. Drives the "you ran your first audit, here's how to go deeper"
  // celebratory email and prevents resending it.
  firstAuditAt: timestamp("first_audit_at"),

  // URL entered on a public landing page before account creation. Keeping it
  // on the account makes the first audit survive email verification in a new
  // tab, browser, or device. It is cleared only after the audit succeeds.
  pendingAuditUrl: text("pending_audit_url"),

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
