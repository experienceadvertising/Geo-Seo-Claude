import type { Request } from "express";

// Resolve a user-facing base URL for links we hand to Stripe (checkout
// success/cancel, billing-portal return) and embed in referral links.
//
// The `Host` / `X-Forwarded-Host` headers are attacker-controllable (we run
// behind `trust proxy`), so deriving an externally-visible URL from them
// blindly is an open-redirect / phishing vector — a user could be bounced to
// an attacker host after a successful payment. We therefore only trust a
// request host that appears in an explicit allow-list; otherwise we fall back
// to the configured production URL.

const PRODUCTION_HOST = "aeoimprovement.com";

function buildAllowedHosts(): Set<string> {
  const hosts = new Set<string>([PRODUCTION_HOST, `www.${PRODUCTION_HOST}`]);
  if (process.env.FRONTEND_URL) {
    try { hosts.add(new URL(process.env.FRONTEND_URL).host); } catch { /* ignore */ }
  }
  for (const d of (process.env.REPLIT_DOMAINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
    hosts.add(d);
  }
  if (process.env.REPLIT_DEV_DOMAIN) hosts.add(process.env.REPLIT_DEV_DOMAIN);
  return hosts;
}

const ALLOWED_HOSTS = buildAllowedHosts();
const PRODUCTION_BASE_URL = `https://${PRODUCTION_HOST}`;

export function canonicalBaseUrl(): string {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, "");
  return PRODUCTION_BASE_URL;
}

export function safeBaseUrl(req: Request): string {
  // Explicit env override always wins (single source of truth in prod).
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, "");

  // Prefer the Replit-injected deployment domain when present.
  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (replitDomain) return `https://${replitDomain}`;

  // Otherwise consider the request host — but ONLY if it's allow-listed.
  const xfHost = (req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim();
  if (xfHost && ALLOWED_HOSTS.has(xfHost)) {
    const proto = (req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim();
    return `${proto}://${xfHost}`;
  }

  return PRODUCTION_BASE_URL;
}
