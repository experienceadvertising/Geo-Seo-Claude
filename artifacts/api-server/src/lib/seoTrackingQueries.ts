import { sql } from "drizzle-orm";

/**
 * Builds the latest-snapshot lookup for an existing set of keyword targets.
 * Returning null keeps the no-target case query-free.
 */
export function buildLatestRankSnapshotsQuery(targetIds: number[]) {
  if (targetIds.length === 0) return null;

  const ids = sql.join(targetIds.map((id) => sql`${id}`), sql`, `);
  return sql`
    SELECT DISTINCT ON (target_id) target_id, position, result_present, result_url, provider_status, collected_at
    FROM seo_rank_snapshots WHERE target_id IN (${ids}) ORDER BY target_id, collected_at DESC
  `;
}