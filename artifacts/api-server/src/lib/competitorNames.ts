// Words and labels that AI answers commonly bold for structure, not because
// they name a company. Keeping this list explicit prevents headings such as
// "Goal" or "Primary KPI" from appearing as competitors.
const GENERIC_BRAND_WORDS = new Set([
  "top", "best", "tier", "agency", "agencies", "platform", "platforms", "metrics",
  "channels", "channel", "pricing", "marketing", "digital", "media", "paid",
  "ecommerce", "brand", "brands", "google", "meta", "facebook", "instagram",
  "tiktok", "youtube", "linkedin", "twitter", "seo", "sem", "ppc", "ads", "ad",
  "the", "and", "for", "with", "your", "company", "services", "solutions",
  "goal", "goals", "kpi", "primary", "constraint", "constraints", "budget", "scope",
  "testing", "test", "sprint", "ongoing", "management", "minimum", "offer", "funnel",
  "cross-channel", "share", "voice", "time", "performance", "max", "pmax", "team",
  "teams", "tracking", "reporting", "analytics", "attribution", "creative", "strategy",
  "campaign", "campaigns", "account", "accounts", "results", "outcomes", "workflow",
]);

export function looksLikeCompetitorBrand(name: string): boolean {
  const cleaned = name.replace(/[*_#]/g, "").replace(/^\s*\d+[.)]\s*/, "").trim();
  if (cleaned.length < 2 || cleaned.length > 40) return false;
  if (/[&+/:()[\]{}]/.test(cleaned)) return false;
  if (/[?:]$/.test(cleaned)) return false;
  if (!/^[A-Z0-9]/.test(cleaned)) return false;
  const words = cleaned.split(/\s+/);
  if (words.length > 5) return false;
  const generic = words.filter((word) => GENERIC_BRAND_WORDS.has(word.toLowerCase())).length;
  if (generic >= Math.ceil(words.length / 2)) return false;
  return true;
}

export function extractCompetitorBrandsFromText(text: string, brandName: string): string[] {
  const ownBrand = brandName.trim().toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  const boldSegment = /\*\*([^*\n]{2,60})\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = boldSegment.exec(text)) !== null) {
    const candidate = match[1].replace(/[.,;:!?)\]]+$/, "").trim();
    if (!looksLikeCompetitorBrand(candidate)) continue;
    const normalized = candidate.toLowerCase();
    if (normalized === ownBrand || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(candidate);
    if (out.length >= 10) break;
  }
  return out;
}
