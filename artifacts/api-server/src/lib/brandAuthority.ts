import { logger } from "./logger";

export type SignalState = "found" | "not_found" | "unavailable";

export interface BrandSignal {
  source: string;
  found: boolean;
  state: SignalState;
  detail: string | null;
}

export interface BrandAuthorityResult {
  brandName: string;
  score: number;
  signals: BrandSignal[];
}

const log = logger.child({ module: "brandAuthority" });

const COMPANY_SUFFIX_RE =
  /[\s,]+(?:inc\.?|llc\.?|ltd\.?|limited|corp\.?|corporation|company|co\.?|gmbh|ag|s\.?a\.?|s\.?l\.?|plc|pty\.?\s*ltd\.?|holdings?|group|technologies|tech)$/i;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Strip common corporate suffixes for entity matching ("Stripe, Inc." -> "Stripe"). */
function stripCorporateSuffix(s: string): string {
  let cur = s.trim();
  // Strip up to two suffixes (e.g. "Foo Holdings Inc.")
  for (let i = 0; i < 2; i++) {
    const next = cur.replace(COMPANY_SUFFIX_RE, "").trim().replace(/[,;:.]+$/, "");
    if (next === cur || next.length < 2) break;
    cur = next;
  }
  return cur;
}

/** Strip a trailing truncated word (e.g. "Shelving Inc. Mich" → "Shelving Inc.") */
function stripTrailingFragment(seg: string): string {
  const knownSuffixes = new Set(["inc", "llc", "ltd", "co", "corp", "group", "the", "and", "of"]);
  const words = seg.split(/\s+/);
  if (words.length < 2) return seg;
  const last = words[words.length - 1].replace(/[^a-zA-Z]/g, "").toLowerCase();
  // Suspect if last word is ≤4 chars, not a known suffix, and total title is already ≥60 chars
  if (last.length <= 4 && !knownSuffixes.has(last) && seg.length >= 12) {
    return words.slice(0, -1).join(" ").trim().replace(/[.,]+$/, "");
  }
  return seg;
}

function deriveBrandName(url: string, title: string | null): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const root = host.split(".")[0];
  const domainBrand = root.charAt(0).toUpperCase() + root.slice(1);

  if (!title) return domainBrand;

  const segments = title
    .split(/[|•\-—–·:»]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 50);

  const target = normalize(domainBrand);

  // Pass 1: exact/prefix match on normalized domain root
  for (const seg of segments) {
    const n = normalize(seg);
    if (n === target || n.startsWith(target) || target.startsWith(n)) {
      return stripTrailingFragment(seg);
    }
  }

  // Pass 2: domain abbreviation match — every char in domain appears in sequence in the segment
  // e.g. "nytimes" is a subsequence-abbreviation of "The New York Times" (thenewyorktimes)
  for (const seg of segments) {
    const n = normalize(seg);
    if (n.length < target.length) continue;
    let ti = 0;
    for (let si = 0; si < n.length && ti < target.length; si++) {
      if (n[si] === target[ti]) ti++;
    }
    if (ti === target.length) {
      return stripTrailingFragment(seg);
    }
  }

  // Pass 3: pick the shortest segment that looks like a proper name
  const properNameSegs = segments.filter(
    (s) => s.length >= 3 && s.length <= 40 && /^[A-Z]/.test(s) && !/^(Home|Welcome|Official)$/i.test(s)
  );
  if (properNameSegs.length > 0) {
    const shortest = properNameSegs.sort((a, b) => a.length - b.length)[0];
    return stripTrailingFragment(shortest);
  }

  return domainBrand;
}

interface CheckOpts {
  brand: string;
  domain: string;
  /** Additional org-name candidates from llms.txt / schema / title. */
  altNames?: string[];
}

const UA = "GEOSEOAnalyzer/1.0 (https://aeoimprovement.com; brand-authority-checker)";

/** Fetch JSON with timeout + structured logging. Returns null on failure.
 * Raw response body is logged at debug level (truncated) so false negatives can be traced. */
async function fetchJson<T>(
  url: string,
  source: string,
  timeoutMs = 8000
): Promise<{ data: T | null; raw: string | null; status: number; ok: boolean }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const raw = await res.text();
    // Log raw payload (truncated to 4KB) at debug level for trace.
    log.debug({ source, url, status: res.status, raw: raw.slice(0, 4096) }, "lookup.raw");
    if (!res.ok) {
      log.info({ source, url, status: res.status }, "lookup non-OK");
      return { data: null, raw, status: res.status, ok: false };
    }
    let data: T | null = null;
    try { data = JSON.parse(raw) as T; } catch (e) {
      log.warn({ source, url, parseErr: (e as Error).message }, "lookup.json parse failed");
      return { data: null, raw, status: res.status, ok: false };
    }
    return { data, raw, status: res.status, ok: true };
  } catch (err) {
    log.warn({ source, url, err: err instanceof Error ? err.message : String(err) }, "lookup failed");
    return { data: null, raw: null, status: 0, ok: false };
  }
}

interface WikiSummary {
  type?: string;
  extract?: string;
  title?: string;
  description?: string;
  content_urls?: { desktop?: { page?: string } };
  wikibase_item?: string;
}

/** Try a single Wikipedia summary lookup. */
async function wikipediaSummary(query: string): Promise<WikiSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}?redirect=true`;
  const { data, ok, status } = await fetchJson<WikiSummary>(url, "Wikipedia.summary");
  log.info({ q: query, status, type: data?.type, hasExtract: !!data?.extract, title: data?.title }, "wiki.summary");
  return ok ? data : null;
}

/** Wikipedia full-text search returning best-matching page titles. */
async function wikipediaSearch(query: string, limit = 5): Promise<string[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&srlimit=${limit}&format=json&origin=*`;
  const { data } = await fetchJson<{ query?: { search?: Array<{ title: string }> } }>(url, "Wikipedia.search");
  const titles = data?.query?.search?.map((s) => s.title) ?? [];
  log.info({ q: query, results: titles.length, titles }, "wiki.search");
  return titles;
}

/**
 * Given the title of a Wikipedia disambiguation page, fetch its outgoing links
 * and return them in priority order, biasing toward "<title> (company)" /
 * "<title> (software)" / company-flavored entries first. Used so we can resolve
 * ambiguous brand names (e.g. plain "Stripe", "Apple", "Square") to the right
 * article instead of giving up.
 */
async function wikipediaDisambigLinks(disambigTitle: string, brand: string): Promise<string[]> {
  // Use action=query&prop=links — returns the page's full wikilink set including
  // entries like "Stripe, Inc." that have no parenthetical suffix.
  const url =
    `https://en.wikipedia.org/w/api.php?action=query` +
    `&titles=${encodeURIComponent(disambigTitle)}` +
    `&prop=links&plnamespace=0&pllimit=max&format=json&origin=*`;
  const { data } = await fetchJson<{
    query?: { pages?: Record<string, { links?: Array<{ title: string }> }> };
  }>(url, "Wikipedia.disambig");
  const pages = Object.values(data?.query?.pages ?? {});
  const links = (pages[0]?.links ?? []).map((l) => l.title);

  const brandLow = brand.toLowerCase();
  const COMPANY_RE = /\((company|software|service|brand|payments|technology|platform|app|website|corporation|inc|ltd|llc)\)/i;
  const CORP_SUFFIX_RE = /,\s*(Inc|Ltd|LLC|GmbH|AG|S\.A\.|S\.p\.A\.|Co|Corp|Corporation|Holdings|Group|plc)\.?$/i;
  // Score each link: lower is better.
  const scored = links
    .map((title) => {
      const tLow = title.toLowerCase();
      const startsWithBrand = tLow === brandLow || tLow.startsWith(brandLow + " ") || tLow.startsWith(brandLow + ",");
      let score = 5;
      if (startsWithBrand && CORP_SUFFIX_RE.test(title)) score = 0;          // "Stripe, Inc."
      else if (startsWithBrand && COMPANY_RE.test(title)) score = 1;         // "Stripe (company)"
      else if (CORP_SUFFIX_RE.test(title)) score = 2;
      else if (startsWithBrand) score = 3;                                   // "Stripe, County Fermanagh" — risky but try
      else if (COMPANY_RE.test(title)) score = 4;
      return { title, score };
    })
    .filter((x) => x.score < 5)
    .sort((a, b) => a.score - b.score || a.title.length - b.title.length);
  const top = scored.slice(0, 5).map((x) => x.title);
  log.info({ disambig: disambigTitle, brand, total: links.length, top }, "wiki.disambig.links");
  return top;
}

/**
 * Patterns in the Wikipedia `description` field that indicate a clearly
 * non-tech entity: music releases, films, people, sports, etc.
 * Used to reject false-positive article matches like "Notion (EP)".
 * The domain check overrides this — if the domain literally appears in
 * the article text, it's always confident regardless of description.
 */
const NON_TECH_ENTITY_DESC_RE =
  /\b(album|ep|single|mixtape|song|soundtrack|film|movie|television|tv[\s-]series|tv[\s-]show|sitcom|miniseries|documentary|novel|book|comic\s+book|manga|anime|musician|singer|rapper|vocalist|band|actor|actress|athlete|politician|sportsperson|footballer|basketball\s+player|baseball\s+player|cricketer|painter|sculptor|visual\s+artist|poet|comedian|presenter|journalist|character|fictional)\b/i;

/** Confidence check — does this Wikipedia article actually describe the brand/domain? */
function isWikiArticleConfident(data: WikiSummary, brand: string, domain: string): boolean {
  if (!data.extract) return false;
  const haystack = `${data.title || ""} ${data.description || ""} ${data.extract}`.toLowerCase();
  const domainLow = domain.toLowerCase();

  // If the domain itself appears in the article text, that is definitive — always accept.
  if (haystack.includes(domainLow)) return true;

  // Reject articles whose description clearly marks them as a non-tech entity
  // (e.g. "2017 EP by Notion", "English rapper", "2009 film directed by…").
  // This is the primary fix for the "Notion (EP)" false-positive bug.
  if (data.description && NON_TECH_ENTITY_DESC_RE.test(data.description)) return false;

  const normBrand = normalize(stripCorporateSuffix(brand));
  const normTitle = normalize(stripCorporateSuffix(data.title || ""));
  return (
    haystack.includes(brand.toLowerCase()) ||
    haystack.includes(stripCorporateSuffix(brand).toLowerCase()) ||
    (!!normBrand && !!normTitle && (normTitle === normBrand || normTitle.startsWith(normBrand) || normBrand.startsWith(normTitle)))
  );
}

async function checkWikipedia({ brand, domain, altNames = [] }: CheckOpts): Promise<BrandSignal> {
  const cleanBrand = stripCorporateSuffix(brand);
  // Build prioritized candidate query list. Order matters — first confident hit wins.
  const candidates: string[] = [];
  const seen = new Set<string>();
  const push = (q: string | null | undefined) => {
    const v = (q || "").trim();
    if (!v) return;
    const k = v.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    candidates.push(v);
  };
  // Disambiguator-first variants greatly improve hit rate for ambiguous brand words
  // ("Stripe", "Apple", "Amazon", "Square" etc.).
  push(`${cleanBrand} (company)`);
  push(`${cleanBrand} (software)`);
  push(`${cleanBrand} (service)`);
  push(cleanBrand);
  push(brand);
  for (const alt of altNames) {
    const a = stripCorporateSuffix(alt);
    push(`${a} (company)`);
    push(a);
    push(alt);
  }

  let lastDetail = "No matching article";
  const disambigsToFollow: string[] = [];

  for (const q of candidates) {
    const data = await wikipediaSummary(q);
    if (!data) continue;
    if (data.type === "standard" && data.extract && isWikiArticleConfident(data, brand, domain)) {
      return {
        source: "Wikipedia",
        found: true,
        state: "found",
        detail: `Article: "${data.title}"`,
      };
    }
    if (data.type === "disambiguation") {
      lastDetail = `Disambiguation page for "${data.title}"`;
      if (data.title) disambigsToFollow.push(data.title);
    } else if (data.type === "standard" && data.extract) {
      lastDetail = `Article exists for "${data.title}" but does not match the brand`;
    }
  }

  // Disambiguation handling: follow the most relevant link from each disambig page.
  for (const dTitle of disambigsToFollow) {
    const candidateLinks = await wikipediaDisambigLinks(dTitle, brand);
    for (const linkTitle of candidateLinks) {
      const data = await wikipediaSummary(linkTitle);
      if (data && data.type === "standard" && data.extract && isWikiArticleConfident(data, brand, domain)) {
        return {
          source: "Wikipedia",
          found: true,
          state: "found",
          detail: `Article: "${data.title}" (resolved from disambiguation "${dTitle}")`,
        };
      }
    }
  }

  // Search-API fallback: pick the top hit that mentions domain or has a confident summary.
  const searchTerm = altNames[0] ? `${cleanBrand} ${altNames[0]}` : cleanBrand;
  const searchTitles = await wikipediaSearch(searchTerm, 5);
  for (const t of searchTitles.slice(0, 3)) {
    const data = await wikipediaSummary(t);
    if (data && data.type === "standard" && data.extract && isWikiArticleConfident(data, brand, domain)) {
      return {
        source: "Wikipedia",
        found: true,
        state: "found",
        detail: `Article: "${data.title}"`,
      };
    }
  }

  // Wikidata fallback — many companies have a QID even when EN Wikipedia article matching is weak.
  try {
    const wdUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      cleanBrand
    )}&language=en&type=item&limit=5&format=json&origin=*`;
    const { data } = await fetchJson<{
      search?: Array<{ id: string; label?: string; description?: string; concepturi?: string }>;
    }>(wdUrl, "Wikidata.search");
    const hits = data?.search ?? [];
    log.info({ q: cleanBrand, results: hits.length }, "wikidata.search");
    const match = hits.find((h) => {
      const desc = (h.description || "").toLowerCase();
      const label = (h.label || "").toLowerCase();
      const orgish = /(company|corporation|business|firm|enterprise|software|platform|service|brand|payment|technology)/.test(desc);
      return orgish && (label === cleanBrand.toLowerCase() || normalize(label) === normalize(cleanBrand));
    });
    if (match) {
      return {
        source: "Wikipedia",
        found: true,
        state: "found",
        detail: `Wikidata entity ${match.id}: ${match.label}${match.description ? ` — ${match.description}` : ""}`,
      };
    }
  } catch (err) {
    log.warn({ err: err instanceof Error ? err.message : String(err) }, "wikidata fallback failed");
  }

  return { source: "Wikipedia", found: false, state: "not_found", detail: lastDetail };
}

interface DDGResponse {
  Abstract?: string;
  AbstractSource?: string;
  AbstractURL?: string;
  Heading?: string;
  Definition?: string;
  DefinitionSource?: string;
  DefinitionURL?: string;
  Type?: string; // A=article, D=disambig, C=category, N=name, E=exclusive
  Entity?: string;
  Infobox?: { content?: Array<{ label?: string; value?: string }> };
  RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: Array<unknown> }>;
  Results?: Array<{ Text?: string; FirstURL?: string }>;
}

async function ddgQuery(query: string): Promise<DDGResponse | null> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&t=geo-seo-analyzer`;
  const { data, ok, status } = await fetchJson<DDGResponse>(url, "DuckDuckGo.ia");
  log.info(
    {
      q: query,
      status,
      type: data?.Type,
      hasAbstract: !!data?.Abstract,
      heading: data?.Heading,
      relatedCount: data?.RelatedTopics?.length ?? 0,
      abstractURL: data?.AbstractURL,
    },
    "ddg.ia"
  );
  return ok ? data : null;
}

function ddgConfident(data: DDGResponse, brand: string, domain: string): { ok: boolean; detail: string } | null {
  const cleanBrand = stripCorporateSuffix(brand);
  const dl = domain.toLowerCase();
  const bl = cleanBrand.toLowerCase();
  const headingMatches =
    !!data.Heading && (normalize(data.Heading) === normalize(cleanBrand) || normalize(data.Heading).includes(normalize(cleanBrand)));

  // 1. Strong: Abstract that references the domain or brand.
  if (data.Abstract) {
    const refsDomain =
      (data.AbstractURL && data.AbstractURL.toLowerCase().includes(dl)) ||
      data.Abstract.toLowerCase().includes(dl) ||
      data.Abstract.toLowerCase().includes(bl) ||
      headingMatches;
    if (refsDomain) {
      return { ok: true, detail: `Knowledge panel from ${data.AbstractSource || "web"}` };
    }
  }

  // 2. Definition fallback (DDG sometimes returns Wiktionary-style definitions for brand names).
  if (data.Definition) {
    const refs =
      (data.DefinitionURL && data.DefinitionURL.toLowerCase().includes(dl)) ||
      data.Definition.toLowerCase().includes(dl);
    if (refs || headingMatches) {
      return { ok: true, detail: `Definition from ${data.DefinitionSource || "DuckDuckGo"}` };
    }
  }

  // 3. RelatedTopics fallback — DDG often returns RelatedTopics[0].FirstURL pointing to the
  // canonical Wikipedia entry even when Abstract is empty (e.g. for "Stripe").
  const related = data.RelatedTopics ?? [];
  for (const rt of related.slice(0, 5)) {
    const url = rt.FirstURL || "";
    const text = rt.Text || "";
    if (!url && !text) continue;
    const refsDomain = url.toLowerCase().includes(dl) || text.toLowerCase().includes(dl);
    const looksLikeBrand =
      text.toLowerCase().startsWith(bl + " ") ||
      text.toLowerCase().startsWith(bl + ",") ||
      text.toLowerCase().startsWith(bl + ":") ||
      text.toLowerCase().startsWith(bl + " is ") ||
      text.toLowerCase().startsWith(bl + " was ");
    if (refsDomain && looksLikeBrand) {
      return { ok: true, detail: `Related entry: ${text.slice(0, 120)}` };
    }
  }

  // 4. Heading + Type=A (article) without abstract still indicates a knowledge entity.
  if (headingMatches && data.Type === "A") {
    return { ok: true, detail: `Knowledge entity: ${data.Heading}` };
  }

  return null;
}

async function checkDuckDuckGo({ brand, domain, altNames = [] }: CheckOpts): Promise<BrandSignal> {
  const cleanBrand = stripCorporateSuffix(brand);
  const queries: string[] = [];
  const seen = new Set<string>();
  const push = (q: string) => {
    const k = q.toLowerCase().trim();
    if (k && !seen.has(k)) {
      seen.add(k);
      queries.push(q);
    }
  };
  push(cleanBrand);
  push(`${cleanBrand} company`);
  for (const alt of altNames) push(stripCorporateSuffix(alt));
  push(brand);

  let unavailableHits = 0;
  let lastHeading = "";

  for (const q of queries) {
    const data = await ddgQuery(q);
    if (!data) {
      unavailableHits++;
      continue;
    }
    if (data.Heading) lastHeading = data.Heading;
    const verdict = ddgConfident(data, brand, domain);
    if (verdict?.ok) {
      return { source: "DuckDuckGo", found: true, state: "found", detail: verdict.detail };
    }
  }

  if (unavailableHits === queries.length) {
    return { source: "DuckDuckGo", found: false, state: "unavailable", detail: "DuckDuckGo API unreachable" };
  }
  return {
    source: "DuckDuckGo",
    found: false,
    state: "not_found",
    detail: lastHeading
      ? `Knowledge panel for "${lastHeading}" did not reference ${domain}`
      : "No knowledge panel matched the brand",
  };
}

interface GitHubUser {
  type?: string;
  followers?: number;
  login?: string;
  public_repos?: number;
  blog?: string | null;
  name?: string | null;
}

async function fetchGitHubSlug(slug: string): Promise<{ data: GitHubUser | null; status: number }> {
  const res = await fetch(`https://api.github.com/users/${slug}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": UA },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return { data: null, status: res.status };
  return { data: (await res.json()) as GitHubUser, status: res.status };
}

function blogLinksTo(blog: string | null | undefined, domain: string): boolean {
  if (!blog) return false;
  try {
    const h = new URL(blog.startsWith("http") ? blog : `https://${blog}`).hostname.replace(/^www\./, "");
    return h === domain || h.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

async function checkGitHub({ brand, domain }: CheckOpts): Promise<BrandSignal & { followers?: number }> {
  try {
    // Build a ranked list of slugs to try.
    // Priority: brand-derived → domain-root → domain-with-dashes (e.g. notion-so for notion.so).
    const slugFromBrand = brand.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const domainRoot = domain.split(".")[0].replace(/[^a-z0-9-]/g, "");
    const domainDashes = domain.replace(/\./g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+$/, "");
    const slugsToTry = [...new Set([slugFromBrand, domainRoot, domainDashes].filter(Boolean))];

    if (slugsToTry.length === 0) {
      return { source: "GitHub", found: false, state: "not_found", detail: "No valid slug" };
    }

    let lastStatus = 0;

    for (const slug of slugsToTry) {
      const { data, status } = await fetchGitHubSlug(slug);
      lastStatus = status;

      if (status === 404) continue;
      if (!data) {
        // Non-404 error (rate-limit, server error) — report unavailable
        return { source: "GitHub", found: false, state: "unavailable", detail: `GitHub API returned HTTP ${status}` };
      }

      const followers = data.followers || 0;
      const linkedToDomain = blogLinksTo(data.blog, domain);
      const highFollowers = followers >= 500;

      // Accept this account only if it has a strong signal tying it to the domain:
      // - blog/website field points to the domain, OR
      // - high follower count (≥500) — indicates a well-known org that is unlikely
      //   to be a false-positive even without an explicit domain link.
      // We deliberately drop the old "isOrgWithRepos" condition which matched any
      // Organization with ≥3 repos regardless of domain affiliation (caused the
      // "Notion" → wrong @notion org bug).
      if (!(linkedToDomain || highFollowers)) {
        log.info({ slug, login: data.login, followers, linkedToDomain }, "github.slug.rejected");
        continue;
      }

      return {
        source: "GitHub",
        found: true,
        state: "found",
        detail: `${data.type || "Account"} @${data.login} — ${followers} followers, ${data.public_repos || 0} repos${linkedToDomain ? ` (links to ${domain})` : ""}`,
        followers,
      };
    }

    // All slugs tried and none passed
    if (lastStatus === 404 || slugsToTry.every((s) => s === slugFromBrand)) {
      return { source: "GitHub", found: false, state: "not_found", detail: "No matching user/org" };
    }
    return { source: "GitHub", found: false, state: "not_found", detail: `No authoritative GitHub account found for ${domain}` };
  } catch {
    return { source: "GitHub", found: false, state: "unavailable", detail: "Request failed or timed out" };
  }
}

export async function analyzeBrandAuthority(
  url: string,
  title: string | null,
  hasOrgSchema: boolean,
  hasLlmsTxt: boolean,
  orgSchemaName?: string | null
): Promise<BrandAuthorityResult> {
  const brandName = deriveBrandName(url, title);
  const domain = new URL(url).hostname.replace(/^www\./, "");

  // Build alt-name list: organization name from schema, plus the longest title segment.
  const altNames: string[] = [];
  if (orgSchemaName) altNames.push(orgSchemaName);
  if (title) {
    const titleSegs = title
      .split(/[|•\-—–·:»]/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 3 && s.length <= 60);
    for (const seg of titleSegs) {
      if (normalize(seg) !== normalize(brandName)) altNames.push(seg);
    }
  }

  const opts: CheckOpts = { brand: brandName, domain, altNames };
  log.info({ url, brandName, domain, altNames }, "analyzeBrandAuthority.start");

  const [wiki, ddg, gh] = await Promise.all([
    checkWikipedia(opts),
    checkDuckDuckGo(opts),
    checkGitHub(opts),
  ]);

  log.info(
    {
      url,
      wiki: { state: wiki.state, detail: wiki.detail },
      ddg: { state: ddg.state, detail: ddg.detail },
      gh: { state: gh.state, detail: gh.detail },
    },
    "analyzeBrandAuthority.results"
  );

  let score = 10;
  if (wiki.state === "found") score += 35;
  if (ddg.state === "found") score += 20;
  if (gh.state === "found") {
    const followers = (gh as { followers?: number }).followers || 0;
    if (followers >= 1000) score += 20;
    else if (followers >= 100) score += 12;
    else score += 6;
  }
  if (hasOrgSchema) score += 10;
  if (hasLlmsTxt) score += 5;

  const unavailableCount = [wiki, ddg, gh].filter((s) => s.state === "unavailable").length;
  score += unavailableCount * 5;

  return {
    brandName,
    score: Math.min(100, score),
    signals: [
      wiki,
      ddg,
      { source: gh.source, found: gh.found, state: gh.state, detail: gh.detail },
      {
        source: "Organization Schema",
        found: hasOrgSchema,
        state: hasOrgSchema ? "found" : "not_found",
        detail: hasOrgSchema ? "Schema.org Organization markup detected" : "No Organization schema found",
      },
      {
        source: "llms.txt",
        found: hasLlmsTxt,
        state: hasLlmsTxt ? "found" : "not_found",
        detail: hasLlmsTxt ? "AI-friendly llms.txt manifest published" : "No llms.txt manifest found",
      },
    ],
  };
}
