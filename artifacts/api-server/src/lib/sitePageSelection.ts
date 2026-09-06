const SKIP_PATH = /\/(?:privacy|terms|legal|login|sign-in|sign-up|account|cart|checkout|tag|tags|author|authors|feed|wp-json)(?:\/|$)/i;
const FILE_PATH = /\.(?:avif|css|csv|docx?|gif|ico|jpe?g|js|json|mp3|mp4|pdf|png|svg|webp|xlsx?|xml)$/i;

export function pagePriority(rawUrl: string): number {
  let path = "";
  try { path = new URL(rawUrl).pathname.toLowerCase().replace(/\/+$/, "") || "/"; } catch { return -1; }
  if (path === "/") return 100;
  if (/\/(?:about|about-us|company)$/.test(path)) return 94;
  if (/\/(?:pricing|plans)$/.test(path)) return 92;
  if (/\/(?:products?|services?|solutions?)(?:\/|$)/.test(path)) return 88;
  if (/\/(?:case-stud(?:y|ies)|customers?|success-stories|research)(?:\/|$)/.test(path)) return 80;
  if (/\/(?:features?|how-it-works|platform)(?:\/|$)/.test(path)) return 76;
  if (/\/(?:guides?|resources?|blog|articles?)(?:\/|$)/.test(path)) return 58;
  return 45 - Math.min(20, path.split("/").filter(Boolean).length * 4);
}

export function selectImportantPages(urls: string[], siteUrl: string, limit: number): string[] {
  const site = new URL(siteUrl);
  const host = site.hostname.toLowerCase().replace(/^www\./, "");
  const normalized = new Map<string, string>();
  for (const raw of [siteUrl, ...urls]) {
    try {
      const parsed = new URL(raw, site);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue;
      if (parsed.hostname.toLowerCase().replace(/^www\./, "") !== host) continue;
      parsed.hash = "";
      parsed.search = "";
      parsed.hostname = site.hostname.toLowerCase();
      parsed.protocol = site.protocol;
      parsed.pathname = parsed.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
      if (SKIP_PATH.test(parsed.pathname) || FILE_PATH.test(parsed.pathname)) continue;
      const key = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
      if (!normalized.has(key)) normalized.set(key, parsed.toString());
    } catch { /* Ignore malformed URLs found in sitemaps or page markup. */ }
  }
  return [...normalized.values()]
    .sort((a, b) => pagePriority(b) - pagePriority(a) || a.localeCompare(b))
    .slice(0, Math.max(1, limit));
}
