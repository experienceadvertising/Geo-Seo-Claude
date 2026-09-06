/** Counts collected observations separately from actual numeric rankings. */
export function summarizeRankProgress(activeCount: number, rows: Array<{ position?: number | null; collected_at: string | Date }>, now = Date.now()) {
  return {
    activeKeywords: activeCount,
    rankedKeywords: rows.length,
    pendingKeywords: Math.max(0, activeCount - rows.length),
    foundKeywords: rows.filter((row) => typeof row.position === "number" && row.position > 0).length,
    staleKeywords: rows.filter((row) => now - new Date(row.collected_at).getTime() > 8 * 86400000).length,
  };
}

/** Compare successful numeric observations only. Absence is not position zero. */
export function summarizeRankMovement(rows: Array<{ target_id: number; position: number | null; collected_at: string | Date }>, now = Date.now()) {
  const groups = new Map<number, typeof rows>();
  for (const row of rows) groups.set(row.target_id, [...(groups.get(row.target_id) ?? []), row]);
  const result = { improved: 0, declined: 0, unchanged: 0, comparable: 0 };
  for (const group of groups.values()) {
    const [latest, prior] = [...group].sort((a, b) => +new Date(b.collected_at) - +new Date(a.collected_at));
    if (latest && prior && (!Number.isFinite(latest.position) || !Number.isFinite(prior.position) || +new Date(latest.collected_at) <= +new Date(prior.collected_at))) continue;
    if (!prior || !latest || now - +new Date(latest.collected_at) > 7 * 86400000 || +new Date(latest.collected_at) > now || !Number.isFinite(+new Date(latest.collected_at)) || !Number.isFinite(+new Date(prior.collected_at)) || latest.position == null || prior.position == null || latest.position < 1 || prior.position < 1) continue;
    result.comparable++;
    if (latest.position < prior.position) result.improved++;
    else if (latest.position > prior.position) result.declined++;
    else result.unchanged++;
  }
  return result;
}
