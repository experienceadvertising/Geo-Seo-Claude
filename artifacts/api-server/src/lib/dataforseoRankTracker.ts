import type { SeoKeywordTarget } from "@workspace/db";

const API_ROOT = "https://api.dataforseo.com/v3";

function cleanSecret(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/^(?:['\"])(.*)(?:['\"])$/, "$1").trim();
  return trimmed || null;
}

function credentials(): { login: string; password: string } | null {
  const login = cleanSecret(process.env.DATAFORSEO_LOGIN) ?? cleanSecret(process.env.DATAFORSEO_API_LOGIN);
  const password = cleanSecret(process.env.DATAFORSEO_PASSWORD) ?? cleanSecret(process.env.DATAFORSEO_API_PASSWORD);
  return login && password ? { login, password } : null;
}

export function isDataForSeoConfigured(): boolean {
  return credentials() !== null;
}

export class DataForSeoError extends Error {
  constructor(message: string, public readonly status = 502) { super(message); }
}

export interface RankCollection {
  position: number | null;
  resultPresent: boolean;
  resultUrl: string | null;
}

async function dataForSeoRequest(path: string, body?: unknown): Promise<any> {
  const auth = credentials();
  if (!auth) throw new DataForSeoError("Rank tracking is not configured yet. Please try again later.", 503);
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, { method: body ? "POST" : "GET", headers: { ...(body ? { "Content-Type": "application/json" } : {}), Authorization: `Basic ${Buffer.from(`${auth.login}:${auth.password}`).toString("base64")}` }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30_000) });
  } catch { throw new DataForSeoError("Rank provider is temporarily unavailable. Your previous snapshots are preserved.", 503); }
  let payload: any; try { payload = await response.json(); } catch { payload = null; }
  // Per-task status codes: 20000 ok, 20100 created, 40601 handed to the
  // engine, 40602 still in queue. The last three are NOT failures — a weekly
  // task_get simply hasn't finished yet — so only generic 4xxxx codes throw
  // here; callers interpret the "not ready" codes themselves.
  const taskStatus = Number(payload?.tasks?.[0]?.status_code);
  const PENDING_TASK_STATUSES = new Set([20100, 40601, 40602]);
  const taskFailed = taskStatus >= 40000 && !PENDING_TASK_STATUSES.has(taskStatus);
  if (!response.ok || taskFailed) {
    throw new DataForSeoError(response.status === 401 || response.status === 403 ? "Rank tracking credentials need attention. Your previous snapshots are preserved." : "Rank provider could not collect this result. Your previous snapshots are preserved.", response.status === 401 || response.status === 403 ? 503 : 502);
  }
  return payload;
}

function desiredHost(target: SeoKeywordTarget): string {
  try { return new URL(target.targetUrl || `https://${target.domain}`).hostname.replace(/^www\./, ""); }
  catch { return target.domain.replace(/^www\./, ""); }
}

/**
 * Uses DataForSEO's live endpoint for a user-requested refresh. Weekly work
 * deliberately reuses the same bounded collector until task-post polling is
 * enabled. The request is always server-side, and neither credentials nor
 * provider response bodies are sent to the browser or telemetry.
 */
export async function collectGoogleRank(target: SeoKeywordTarget): Promise<RankCollection> {
  const payload = await dataForSeoRequest("/serp/google/organic/live/advanced", [{
        keyword: target.keyword,
        location_code: target.locationCode,
        language_code: target.languageCode,
        device: target.device,
        depth: 100,
      }]);
  const task = payload?.tasks?.[0];
  if (task?.status_code !== 20000) throw new DataForSeoError("Rank provider could not collect this result. Your previous snapshots are preserved.");
  const items = task?.result?.[0]?.items;
  if (!Array.isArray(items)) throw new DataForSeoError("Rank provider returned no usable result. Your previous snapshots are preserved.");
  const host = desiredHost(target);
  const match = items.find((item: any) => {
    if (item?.type !== "organic" || typeof item?.url !== "string") return false;
    try { return new URL(item.url).hostname.replace(/^www\./, "") === host; } catch { return false; }
  });
  if (!match) return { position: null, resultPresent: false, resultUrl: null };
  const position = Number(match.rank_absolute ?? match.rank_group);
  return { position: Number.isFinite(position) && position > 0 ? position : null, resultPresent: true, resultUrl: match.url };
}

export async function submitWeeklyRankTask(target: SeoKeywordTarget): Promise<string> {
  const payload = await dataForSeoRequest("/serp/google/organic/task_post", [{ keyword: target.keyword, location_code: target.locationCode, language_code: target.languageCode, device: target.device, depth: 100 }]);
  const id = payload?.tasks?.[0]?.id;
  if (typeof id !== "string") throw new DataForSeoError("Rank provider could not queue this weekly snapshot.");
  return id;
}

export async function collectQueuedWeeklyRank(target: SeoKeywordTarget, providerTaskId: string): Promise<RankCollection | null> {
  const payload = await dataForSeoRequest(`/serp/google/organic/task_get/advanced/${encodeURIComponent(providerTaskId)}`);
  const task = payload?.tasks?.[0];
  if (task?.status_code === 40602 || task?.status_code === 40601 || task?.status_code === 20100) return null;
  if (task?.status_code !== 20000) throw new DataForSeoError("Rank provider could not finish this weekly snapshot.");
  const items = task?.result?.[0]?.items;
  if (!Array.isArray(items)) return { position: null, resultPresent: false, resultUrl: null };
  const host = desiredHost(target); const match = items.find((item: any) => { try { return item?.type === "organic" && new URL(item.url).hostname.replace(/^www\./, "") === host; } catch { return false; } });
  const position = Number(match?.rank_absolute ?? match?.rank_group);
  return match ? { position: Number.isFinite(position) ? position : null, resultPresent: true, resultUrl: match.url } : { position: null, resultPresent: false, resultUrl: null };
}
