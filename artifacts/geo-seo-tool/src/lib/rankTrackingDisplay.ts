export type LatestRankSnapshot = {
  position: number | null;
  result_present: boolean;
} | null | undefined;

export function latestRankDisplay(latest: LatestRankSnapshot): string {
  if (!latest) return "No rank snapshot yet";
  if (typeof latest.position === "number") return `Position ${latest.position}`;
  if (latest.result_present === false) return "No matching result yet";
  return "Rank unavailable";
}