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
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.yearMonth] }),
  }),
);

export type MonthlyUsage = typeof monthlyUsageTable.$inferSelect;
