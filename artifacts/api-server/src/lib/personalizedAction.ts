import { OFFSITE_ACTIONS } from "@workspace/recommendations";
export { selectPersonalizedAction } from "@workspace/recommendations";

export function nextOffsiteAction(completed: ReadonlySet<string>) {
  return OFFSITE_ACTIONS.find(action => !completed.has(action.id));
}

export function sameSite(url: string, domain: string) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, "") === domain.toLowerCase().replace(/^www\./, ""); } catch { return false; }
}
