import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
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
});

export type User = typeof usersTable.$inferSelect;
