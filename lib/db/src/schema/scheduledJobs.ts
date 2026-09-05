import { sql } from "drizzle-orm";
import { bigserial, check, index, pgTable, primaryKey, text, timestamp, unique } from "drizzle-orm/pg-core";

/** Operational job metadata only. No queries, page content or secret values. */
export const scheduledJobItemsTable = pgTable("scheduled_job_items", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  job: text("job").notNull(),
  slot: text("slot").notNull(),
  subjectId: text("subject_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, table => [
  unique("scheduled_job_items_job_slot_subject_id_key").on(table.job, table.slot, table.subjectId),
  check("scheduled_job_items_status_check", sql`${table.status} IN ('pending','running','completed','failed')`),
  index("scheduled_job_items_pending").on(table.status, table.id),
]);

/** Standalone worker ledger, unused while SCHEDULER_MODE is cloudflare. */
export const scheduledJobRunsTable = pgTable("scheduled_job_runs", {
  job: text("job").notNull(),
  slot: text("slot").notNull(),
  status: text("status").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, table => [
  primaryKey({ columns: [table.job, table.slot] }),
  check("scheduled_job_runs_status_check", sql`${table.status} IN ('running','completed','failed')`),
]);
