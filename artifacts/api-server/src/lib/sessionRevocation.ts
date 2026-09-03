import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Invalidate every server-side session for a user (optionally keeping the
 * caller's own). Sessions live in connect-pg-simple's `sessions` table as
 * JSON, so we match on the `userId` we store at login.
 *
 * Called after a password reset/change: the canonical "my account was
 * compromised" recovery must log the attacker out too, otherwise their
 * 30-day cookie stays valid.
 *
 * Best-effort — a failure here must not fail the password change itself.
 */
export async function revokeUserSessions(userId: string, exceptSid?: string): Promise<void> {
  try {
    if (exceptSid) {
      await pool.query(
        `DELETE FROM sessions WHERE sess->>'userId' = $1 AND sid <> $2`,
        [userId, exceptSid],
      );
    } else {
      await pool.query(`DELETE FROM sessions WHERE sess->>'userId' = $1`, [userId]);
    }
  } catch (err) {
    logger.error({ err, userId }, "Failed to revoke user sessions");
  }
}
