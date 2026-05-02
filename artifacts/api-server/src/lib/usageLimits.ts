import { db, monthlyUsageTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import type { Plan } from "./planUtils";
import { PLAN_LIMITS } from "./planUtils";

export type UsageKind = "audits" | "simulations";

export function currentYearMonth(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export interface UsageRow {
  yearMonth: string;
  audits: number;
  simulations: number;
  limitReachedAuditsAt: Date | null;
  limitReachedSimulationsAt: Date | null;
}

export async function getMonthlyUsage(userId: string): Promise<UsageRow> {
  const ym = currentYearMonth();
  const [row] = await db
    .select()
    .from(monthlyUsageTable)
    .where(and(eq(monthlyUsageTable.userId, userId), eq(monthlyUsageTable.yearMonth, ym)));
  return {
    yearMonth: ym,
    audits: row?.auditsCount ?? 0,
    simulations: row?.simulationsCount ?? 0,
    limitReachedAuditsAt: row?.limitReachedAuditsAt ?? null,
    limitReachedSimulationsAt: row?.limitReachedSimulationsAt ?? null,
  };
}

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  cap: number;
  remaining: number;
  /** True iff this denial is the FIRST denial of the month for this kind.
   * The caller uses this to decide whether to fire the limit-reached email
   * (so we send it exactly once per month per kind, not on every retry). */
  firstDenial: boolean;
}

/**
 * Atomically RESERVE one unit of quota for `kind`, OR record a first-denial
 * if the user is at cap. Single-statement INSERT...ON CONFLICT guarantees
 * concurrent requests cannot both pass at `cap-1` (which would happen with
 * a separate read+increment).
 *
 * Caller must pass the same `ym` they want billed against, captured ONCE
 * at the start of the request — preventing UTC-midnight drift between
 * the consume and any later refund.
 *
 * Returns `allowed: true` only if the slot was successfully reserved.
 * If the action then fails, call `refundQuota(userId, kind, ym)` to
 * release the reservation.
 */
export async function consumeQuota(
  userId: string,
  plan: Plan,
  kind: UsageKind,
  ym: string,
): Promise<QuotaCheck> {
  const limits = PLAN_LIMITS[plan];
  const cap = kind === "audits" ? limits.monthlyAudits : limits.monthlySimulations;
  const col = kind === "audits" ? sql`audits_count` : sql`simulations_count`;
  const flagCol =
    kind === "audits"
      ? sql`limit_reached_audits_at`
      : sql`limit_reached_simulations_at`;
  const auditsInit = kind === "audits" ? 1 : 0;
  const simsInit = kind === "simulations" ? 1 : 0;

  // Step 1: try to atomically reserve a slot. Either INSERT a fresh row
  // with count=1, OR increment an existing row IF it's still under cap.
  // The WHERE on the UPDATE branch is what makes this race-safe — Postgres
  // applies it after locking the conflicting row, so two concurrent
  // requests at cap-1 can't both increment past cap.
  const reserve = await db.execute(sql`
    INSERT INTO monthly_usage (user_id, year_month, audits_count, simulations_count)
    VALUES (${userId}, ${ym}, ${auditsInit}, ${simsInit})
    ON CONFLICT (user_id, year_month) DO UPDATE
      SET ${col} = monthly_usage.${col} + 1, updated_at = NOW()
      WHERE monthly_usage.${col} < ${cap}
    RETURNING ${col} AS new_count
  `);

  if (reserve.rows.length > 0) {
    const newCount = Number((reserve.rows[0] as { new_count: number }).new_count);
    return {
      allowed: true,
      used: newCount - 1, // pre-consume value, useful for "you just used 4/5"
      cap,
      remaining: Math.max(0, cap - newCount),
      firstDenial: false,
    };
  }

  // Step 2: reservation failed → user is at cap. Atomically claim the
  // "first denial of the month for this kind" flag so we email them once.
  const deny = await db.execute(sql`
    INSERT INTO monthly_usage (user_id, year_month, audits_count, simulations_count, ${flagCol})
    VALUES (${userId}, ${ym}, 0, 0, NOW())
    ON CONFLICT (user_id, year_month) DO UPDATE
      SET ${flagCol} = NOW(), updated_at = NOW()
      WHERE monthly_usage.${flagCol} IS NULL
    RETURNING ${flagCol} AS flag
  `);

  return {
    allowed: false,
    used: cap,
    cap,
    remaining: 0,
    firstDenial: deny.rows.length > 0,
  };
}

/**
 * Release a previously-reserved quota slot. Call when the action that
 * consumed quota failed (e.g. LLM error) so we don't penalize the user
 * for a failure on our side. GREATEST(0, ...) prevents underflow if a
 * refund races with a counter reset.
 */
export async function refundQuota(
  userId: string,
  kind: UsageKind,
  ym: string,
): Promise<void> {
  const col = kind === "audits" ? sql`audits_count` : sql`simulations_count`;
  await db.execute(sql`
    UPDATE monthly_usage
    SET ${col} = GREATEST(0, monthly_usage.${col} - 1), updated_at = NOW()
    WHERE user_id = ${userId} AND year_month = ${ym}
  `);
}
