const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/**
 * Read a same-origin `?next=` return path from the current URL.
 *
 * Only router-relative paths are accepted: values must start with a single
 * "/" and may not be protocol-relative ("//evil.com"), contain backslashes
 * (which some URL parsers treat as path separators), or CR/LF. Anything else
 * falls back to "/", which closes the open-redirect hole a naive read would
 * leave open.
 */
export function getNextPath(fallback = "/"): string {
  if (typeof window === "undefined") return fallback;
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || /[\r\n]/.test(raw)) {
    return fallback;
  }
  // Strip BASE prefix if present so wouter receives a router-relative path.
  if (BASE && raw.startsWith(BASE + "/")) return raw.slice(BASE.length) || fallback;
  return raw;
}

/** `?next=` query suffix to carry the current return path onto another auth
 * page (sign-up → sign-in), or "" when there is none. */
export function nextQuerySuffix(): string {
  const next = getNextPath("");
  return next ? `?next=${encodeURIComponent(next)}` : "";
}
