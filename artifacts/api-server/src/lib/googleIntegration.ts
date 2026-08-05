import { eq } from "drizzle-orm";
import { db, googleConnectionsTable, type GoogleConnection } from "@workspace/db";
import { canonicalBaseUrl } from "./publicUrl";
import { logger } from "./logger";
import {
  buildPageUrlVariants,
  rankSearchOpportunities,
  type SearchConsoleQueryRow,
  type SearchOpportunity,
} from "./gscOpportunities";

const log = logger.child({ module: "googleIntegration" });

const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const SCOPES = [ANALYTICS_SCOPE, SEARCH_CONSOLE_SCOPE];

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const SEARCH_CONSOLE_API = "https://www.googleapis.com/webmasters/v3";

// GA4 `sessionSource` hostnames that represent referrals from AI answer engines.
export const AI_REFERRAL_SOURCES = [
  "chatgpt.com", "chat.openai.com", "openai.com",
  "perplexity.ai", "www.perplexity.ai",
  "gemini.google.com", "bard.google.com",
  "claude.ai",
  "copilot.microsoft.com",
  "you.com", "poe.com", "phind.com",
];

export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function hasSearchConsoleScope(scope: string | null | undefined): boolean {
  return (scope || "").split(/\s+/).includes(SEARCH_CONSOLE_SCOPE);
}

export function redirectUri(): string {
  return `${canonicalBaseUrl()}/api/integrations/google/callback`;
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",     // ask for a refresh token
    include_granted_scopes: "true",
    prompt: "consent",          // force refresh-token issuance on reconnect
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

async function postToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || data.error) {
    throw new Error(`Google token error: ${data.error || res.status} ${data.error_description || ""}`.trim());
  }
  return data;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  return postToken({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return postToken({
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
  });
}

/**
 * Return a currently-valid access token for the connection, refreshing (and
 * persisting the new token) when the stored one is within 60s of expiry.
 * Throws if the connection can't be refreshed (e.g. revoked) so callers can
 * surface a reconnect prompt.
 */
export async function getValidAccessToken(conn: GoogleConnection): Promise<string> {
  const stillValid = conn.expiresAt && conn.expiresAt.getTime() - Date.now() > 60_000;
  if (stillValid) return conn.accessToken;
  if (!conn.refreshToken) throw new Error("Google connection has no refresh token — reconnect required");

  const t = await refreshAccessToken(conn.refreshToken);
  const expiresAt = t.expires_in ? new Date(Date.now() + t.expires_in * 1000) : null;
  await db.update(googleConnectionsTable)
    .set({ accessToken: t.access_token, expiresAt, updatedAt: new Date() })
    .where(eq(googleConnectionsTable.id, conn.id));
  return t.access_token;
}

async function googleGet<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google API ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

async function googlePost<T>(url: string, accessToken: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const responseBody = await res.text();
    throw new Error(`Google API ${res.status}: ${responseBody.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export interface Ga4Property { property: string; displayName: string; account: string }

export interface SearchConsoleSite {
  siteUrl: string;
  permissionLevel: string;
}

export async function listSearchConsoleSites(accessToken: string): Promise<SearchConsoleSite[]> {
  const data = await googleGet<{ siteEntry?: SearchConsoleSite[] }>(
    `${SEARCH_CONSOLE_API}/sites`,
    accessToken,
  );
  return (data.siteEntry ?? [])
    .filter((site) => site.siteUrl && site.permissionLevel !== "siteUnverifiedUser")
    .sort((a, b) => a.siteUrl.localeCompare(b.siteUrl));
}

export interface SearchConsoleOpportunityReport {
  siteUrl: string;
  pageUrl: string;
  days: number;
  startDate: string;
  endDate: string;
  rowsReturned: number;
  opportunities: SearchOpportunity[];
}

function isoDateDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Load finalized Google web-search query data for one audited page and turn it
 * into seed-query opportunities for fan-out research.
 */
export async function fetchSearchConsoleOpportunities(
  accessToken: string,
  siteUrl: string,
  pageUrl: string,
  days = 90,
): Promise<SearchConsoleOpportunityReport> {
  const variants = buildPageUrlVariants(pageUrl);
  if (variants.length === 0) throw new Error("Invalid page URL");
  const safeDays = Math.min(180, Math.max(28, days));
  const endDate = isoDateDaysAgo(3);
  const startDate = isoDateDaysAgo(safeDays + 2);

  const responses = await Promise.all(variants.map(async (variant) => {
    const data = await googlePost<{
      rows?: Array<{
        keys?: string[];
        clicks?: number;
        impressions?: number;
        ctr?: number;
        position?: number;
      }>;
    }>(
      `${SEARCH_CONSOLE_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      accessToken,
      {
        startDate,
        endDate,
        dimensions: ["query", "page"],
        type: "web",
        aggregationType: "auto",
        dataState: "final",
        rowLimit: 5000,
        dimensionFilterGroups: [{
          groupType: "and",
          filters: [{ dimension: "page", operator: "equals", expression: variant }],
        }],
      },
    );
    return (data.rows ?? []).map((row): SearchConsoleQueryRow => ({
      query: row.keys?.[0] ?? "",
      page: row.keys?.[1] ?? variant,
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number(row.ctr ?? 0),
      position: Number(row.position ?? 0),
    }));
  }));

  const rows = responses.flat();
  log.debug({ siteUrl, pageUrl, days: safeDays, rows: rows.length }, "gsc.opportunities.fetched");
  return {
    siteUrl,
    pageUrl,
    days: safeDays,
    startDate,
    endDate,
    rowsReturned: rows.length,
    opportunities: rankSearchOpportunities(rows),
  };
}

/** List the GA4 properties the connected account can read, for selection. */
export async function listGa4Properties(accessToken: string): Promise<Ga4Property[]> {
  const data = await googleGet<{
    accountSummaries?: Array<{
      account?: string;
      displayName?: string;
      propertySummaries?: Array<{ property?: string; displayName?: string }>;
    }>;
  }>(`${ADMIN_API}/accountSummaries?pageSize=200`, accessToken);

  const out: Ga4Property[] = [];
  for (const acc of data.accountSummaries ?? []) {
    for (const ps of acc.propertySummaries ?? []) {
      if (ps.property) {
        out.push({ property: ps.property, displayName: ps.displayName || ps.property, account: acc.displayName || "" });
      }
    }
  }
  return out;
}

export interface AiReferralReport {
  series: Array<{ date: string; sessions: number }>;
  bySource: Array<{ source: string; sessions: number }>;
  totalSessions: number;
}

/**
 * Query GA4 for sessions referred from AI answer engines over the last `days`,
 * broken out by day (for a trend) and by source. Pure read; no writes.
 */
export async function fetchAiReferrals(accessToken: string, propertyId: string, days = 28): Promise<AiReferralReport> {
  const property = propertyId.startsWith("properties/") ? propertyId : `properties/${propertyId}`;
  const body = {
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "date" }, { name: "sessionSource" }],
    metrics: [{ name: "sessions" }],
    dimensionFilter: {
      filter: {
        fieldName: "sessionSource",
        inListFilter: { values: AI_REFERRAL_SOURCES, caseSensitive: false },
      },
    },
    limit: 10000,
  };

  const res = await fetch(`${DATA_API}/${property}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GA4 runReport ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }>;
  };

  const byDate = new Map<string, number>();
  const bySource = new Map<string, number>();
  let total = 0;
  for (const row of data.rows ?? []) {
    const rawDate = row.dimensionValues?.[0]?.value ?? "";          // "YYYYMMDD"
    const source = row.dimensionValues?.[1]?.value ?? "(other)";
    const sessions = Number(row.metricValues?.[0]?.value ?? 0) || 0;
    const iso = /^\d{8}$/.test(rawDate) ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}` : rawDate;
    byDate.set(iso, (byDate.get(iso) ?? 0) + sessions);
    bySource.set(source, (bySource.get(source) ?? 0) + sessions);
    total += sessions;
  }

  log.debug({ property, days, total }, "ga4.aiReferrals.fetched");
  return {
    series: [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, sessions]) => ({ date, sessions })),
    bySource: [...bySource.entries()].sort((a, b) => b[1] - a[1]).map(([source, sessions]) => ({ source, sessions })),
    totalSessions: total,
  };
}
