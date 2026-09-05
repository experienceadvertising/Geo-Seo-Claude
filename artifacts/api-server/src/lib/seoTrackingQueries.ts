import { sql } from "drizzle-orm";

/** Shared SQL policy: initial baseline next sweep, successful collection weekly,
 * failure retries daily. A pending provider task is never submitted twice. */
export function buildRankEligibilityQuery(now = new Date()) {
  const week = new Date(now.getTime() - 7 * 86400000);
  const day = new Date(now.getTime() - 86400000);
  return sql`seo_keyword_targets.active = true
    AND (seo_keyword_targets.updated_at = seo_keyword_targets.created_at OR seo_keyword_targets.updated_at <= ${day})
    AND NOT EXISTS (SELECT 1 FROM seo_rank_snapshots s WHERE s.target_id = seo_keyword_targets.id AND s.provider_status = 'success' AND s.collected_at >= ${week})
    AND NOT EXISTS (SELECT 1 FROM seo_rank_tasks t WHERE t.target_id = seo_keyword_targets.id AND (t.status = 'queued' OR t.created_at >= ${day}))`;
}

/**
 * Builds the latest-snapshot lookup for an existing set of keyword targets.
 * Returning null keeps the no-target case query-free.
 */
export function buildLatestRankSnapshotsQuery(targetIds: number[]) {
  if (targetIds.length === 0) return null;

  const ids = sql.join(targetIds.map((id) => sql`${id}`), sql`, `);
  return sql`
    SELECT DISTINCT ON (target_id) target_id, position, result_present, result_url, competitors, provider_status, collected_at
    FROM seo_rank_snapshots WHERE target_id IN (${ids}) ORDER BY target_id, collected_at DESC
  `;
}
export function buildLatestRankTasksQuery(targetIds: number[]) {
  if (!targetIds.length) return null;
  const ids = sql.join(targetIds.map((id) => sql`${id}`), sql`, `);
  return sql`SELECT DISTINCT ON (target_id) target_id, status, created_at, checked_at
    FROM seo_rank_tasks WHERE target_id IN (${ids}) ORDER BY target_id, created_at DESC, id DESC`;
}
