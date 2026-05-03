import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const monthlyUsageTable = pgTable(
  "monthly_usage",
  {
    userId: text("user_id").notNull(),
    yearMonth: text("year_month").notNull(),
    auditsCount: integer("audits_count").notNull().default(0),
    simulationsCount: integer("simulations_count").notNull().default(0),
    limitReachedAuditsAt: timestamp("limit_reached_audits_at"),
    limitReachedSimulationsAt: timestamp("limit_reached_simulations_at"),
    // Approaching-limit dedup: timestamp set the first time we email the
    // user that they're one use away from their cap (typically at cap-1).
    // Per-month + per-kind, so a single user gets at most one approaching
    // email per kind per month — and only if they don't go on to actually
    // hit the cap (where the existing limit-reached email takes over).
    approachingAuditsAt: timestamp("approaching_audits_at"),
    approachingSimulationsAt: timestamp("approaching_simulations_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.yearMonth] }),
  }),
);

export type MonthlyUsage = typeof monthlyUsageTable.$inferSelect;
