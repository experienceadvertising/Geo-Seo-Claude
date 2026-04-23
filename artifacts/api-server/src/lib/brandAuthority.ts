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

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
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
    if (n.length < target.length) continue; // segment must be longer than abbreviation
    let ti = 0;
    for (let si = 0; si < n.length && ti < target.length; si++) {
      if (n[si] === target[ti]) ti++;
    }
    if (ti === target.length) {
      return stripTrailingFragment(seg);
    }
  }

  // Pass 3: pick the shortest segment that looks like a proper name (has at least one uppercase start)
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
}

async function checkWikipedia({ brand, domain }: CheckOpts): Promise<BrandSignal> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(brand)}`,
      {
        headers: { "User-Agent": "GEOSEOAnalyzer/1.0 (educational tool)" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (res.status === 404) {
      return { source: "Wikipedia", found: false, state: "not_found", detail: "No matching article" };
    }
    if (!res.ok) {
      return { source: "Wikipedia", found: false, state: "unavailable", detail: `Wikipedia API returned HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      type?: string;
      extract?: string;
      title?: string;
      content_urls?: { desktop?: { page?: string } };
    };
    if (data.type !== "standard" || !data.extract) {
      return { source: "Wikipedia", found: false, state: "not_found", detail: "Disambiguation or no article" };
    }
    // Confidence check: extract should mention the domain or normalized brand.
    const haystack = `${data.title || ""} ${data.extract}`.toLowerCase();
    const confident =
      haystack.includes(domain.toLowerCase()) ||
      haystack.includes(brand.toLowerCase());
    if (!confident) {
      return {
        source: "Wikipedia",
        found: false,
        state: "not_found",
        detail: `Article exists for "${data.title}" but does not match the brand`,
      };
    }
    return {
      source: "Wikipedia",
      found: true,
      state: "found",
      detail: `Article: "${data.title}"`,
    };
  } catch {
    return { source: "Wikipedia", found: false, state: "unavailable", detail: "Request failed or timed out" };
  }
}

async function checkDuckDuckGo({ brand, domain }: CheckOpts): Promise<BrandSignal> {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(brand)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) {
      return { source: "DuckDuckGo", found: false, state: "unavailable", detail: `DuckDuckGo API returned HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      Abstract?: string;
      AbstractSource?: string;
      AbstractURL?: string;
      Heading?: string;
    };
    if (!data.Abstract) {
      return { source: "DuckDuckGo", found: false, state: "not_found", detail: "No knowledge panel" };
    }
    // Confidence: the abstract URL or text should reference the domain.
    const refsDomain =
      (data.AbstractURL && data.AbstractURL.toLowerCase().includes(domain.toLowerCase())) ||
      (data.Abstract.toLowerCase().includes(domain.toLowerCase())) ||
      (data.Heading && normalize(data.Heading) === normalize(brand));
    if (!refsDomain) {
      return {
        source: "DuckDuckGo",
        found: false,
        state: "not_found",
        detail: `Found "${data.Heading}" but does not reference ${domain}`,
      };
    }
    return {
      source: "DuckDuckGo",
      found: true,
      state: "found",
      detail: `Knowledge panel from ${data.AbstractSource || "web"}`,
    };
  } catch {
    return { source: "DuckDuckGo", found: false, state: "unavailable", detail: "Request failed or timed out" };
  }
}

async function checkGitHub({ brand, domain }: CheckOpts): Promise<BrandSignal & { followers?: number }> {
  try {
    const slug = brand.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!slug) return { source: "GitHub", found: false, state: "not_found", detail: "No valid slug" };
    const res = await fetch(`https://api.github.com/users/${slug}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "GEOSEOAnalyzer/1.0",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) {
      return { source: "GitHub", found: false, state: "not_found", detail: "No matching user/org" };
    }
    if (!res.ok) {
      return { source: "GitHub", found: false, state: "unavailable", detail: `GitHub API returned HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      type?: string;
      followers?: number;
      login?: string;
      public_repos?: number;
      blog?: string | null;
      name?: string | null;
    };
    const followers = data.followers || 0;
    // Confidence: prefer Organization with linked website matching the domain, OR
    // accept high-follower (>=500) accounts as authoritative.
    const blogHost = (() => {
      try {
        return data.blog ? new URL(data.blog.startsWith("http") ? data.blog : `https://${data.blog}`).hostname.replace(/^www\./, "") : "";
      } catch {
        return "";
      }
    })();
    const linkedToDomain = blogHost && (blogHost === domain || blogHost.endsWith(`.${domain}`));
    const isOrgWithRepos = data.type === "Organization" && (data.public_repos || 0) >= 3;
    const highFollowers = followers >= 500;

    if (!(linkedToDomain || isOrgWithRepos || highFollowers)) {
      return {
        source: "GitHub",
        found: false,
        state: "not_found",
        detail: `Account @${data.login} exists but does not appear authoritative for ${domain}`,
      };
    }
    return {
      source: "GitHub",
      found: true,
      state: "found",
      detail: `${data.type || "Account"} @${data.login} — ${followers} followers, ${data.public_repos || 0} repos${linkedToDomain ? ` (links to ${domain})` : ""}`,
      followers,
    };
  } catch {
    return { source: "GitHub", found: false, state: "unavailable", detail: "Request failed or timed out" };
  }
}

export async function analyzeBrandAuthority(
  url: string,
  title: string | null,
  hasOrgSchema: boolean,
  hasLlmsTxt: boolean
): Promise<BrandAuthorityResult> {
  const brandName = deriveBrandName(url, title);
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const opts: CheckOpts = { brand: brandName, domain };

  const [wiki, ddg, gh] = await Promise.all([
    checkWikipedia(opts),
    checkDuckDuckGo(opts),
    checkGitHub(opts),
  ]);

  // Score only on confirmed positives. Unavailable signals don't penalize.
  let score = 10; // baseline
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

  // Boost baseline if any external lookup was unavailable, so transient outages don't
  // unfairly drag the score down.
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
