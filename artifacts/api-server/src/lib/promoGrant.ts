import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";
import { TRIAL_LENGTH_DAYS } from "./planUtils";

/**
 * One-time launch promo for the free all-access first month: every account
 * that exists when this ships gets a fresh 30-day window, not just new
 * signups — so long-standing users experience the full product too and can
 * be emailed about it (the announcement send lives in emailScheduler and
 * keys off trial_promo_granted_at).
 *
 * Runs at server start. The job_id claim row makes it exactly-once across
 * boots and concurrent replicas — WITHOUT it, every deploy would re-extend
 * every user's trial by another 30 days, i.e. nobody would ever convert.
 * Bump the JOB_ID date suffix if you ever want to run a promo like this
 * again.
 */
const JOB_ID = "free-month-promo-2026-07";

export async function runFreeMonthPromoGrant(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS one_time_jobs (
      job_id TEXT PRIMARY KEY,
      ran_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  const claim = await db.execute(sql`
    INSERT INTO one_time_jobs (job_id) VALUES (${JOB_ID})
    ON CONFLICT (job_id) DO NOTHING
    RETURNING job_id
  `);
  if (claim.rows.length === 0) return; // already ran on a previous boot

  try {
    // Everyone whose current window (explicit or derived from created_at)
    // ends before "a full month from now" gets extended to exactly that.
    // Paid users are included — the promo bumps their entitlements to the
    // top tier for the month without touching what they pay.
    // Reminder/ended flags are re-armed so the T-3-days and end-of-month
    // emails fire for this promo window even if a prior window used them.
    const res = await db.execute(sql`
      UPDATE users
      SET trial_ends_at = NOW() + make_interval(days => ${TRIAL_LENGTH_DAYS}),
          trial_promo_granted_at = NOW(),
          trial_reminder_sent_at = NULL,
          trial_ended_sent_at = NULL
      WHERE COALESCE(trial_ends_at, created_at + make_interval(days => ${TRIAL_LENGTH_DAYS}))
            < NOW() + make_interval(days => ${TRIAL_LENGTH_DAYS})
      RETURNING id
    `);
    logger.info({ granted: res.rows.length }, "Free-month promo: granted 30-day all-access window to existing users");
  } catch (err) {
    // Release the claim so the next boot retries — most likely cause is the
    // schema push (new columns) not having run yet on this deploy.
    await db
      .execute(sql`DELETE FROM one_time_jobs WHERE job_id = ${JOB_ID}`)
      .catch(() => { /* claim release is best-effort */ });
    throw err;
  }
}
