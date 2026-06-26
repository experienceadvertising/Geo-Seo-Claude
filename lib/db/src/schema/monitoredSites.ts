import { pgTable, serial, text, real, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// A site a Pro/Agency user has asked us to track continuously. The scheduler
// re-audits each active row on its cadence, stores a fresh audit, and emails a
// score-change alert when the GEO score moves materially. This is what turns
// the product from an on-demand checker into a continuous tracker.
export const monitoredSitesTable = pgTable("monitored_sites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  // Optional human label (e.g. a client name) for the Projects view.
  label: text("label"),
  active: boolean("active").default(true).notNull(),
  // "daily" | "weekly" — re-audit cadence. Weekly is the default.
  frequency: text("frequency").default("weekly").notNull(),
  // Last completed scheduled run, for the Projects view + delta detection.
  lastAuditId: integer("last_audit_id"),
  lastScore: real("last_score"),
  lastRunAt: timestamp("last_run_at"),
  // When the scheduler should next pick this row up. Null → run on next sweep.
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("monitored_sites_user_idx").on(table.userId),
  // The scheduler scans active rows whose nextRunAt is due; index both.
  dueIdx: index("monitored_sites_due_idx").on(table.active, table.nextRunAt),
}));

export const insertMonitoredSiteSchema = createInsertSchema(monitoredSitesTable).omit({ id: true, createdAt: true });
export type InsertMonitoredSite = z.infer<typeof insertMonitoredSiteSchema>;
export type MonitoredSite = typeof monitoredSitesTable.$inferSelect;
