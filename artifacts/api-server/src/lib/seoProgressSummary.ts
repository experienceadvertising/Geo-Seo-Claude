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
