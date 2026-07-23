import { Zap, FlaskConical, Shield, Sparkles, Bell, BarChart3, Wrench, LucideIcon } from "lucide-react";

export interface ChangelogEntry {
  date: string;
  isoDate: string;
  badge: "New" | "Improvement" | "Research" | "Performance" | "Fix";
  icon: LucideIcon;
  title: string;
  summary: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "July 22, 2026",
    isoDate: "2026-07-22",
    badge: "Improvement",
    icon: Wrench,
    title: "Smarter audit results & recommendation tracking",
    summary: "The results page was rebuilt for a clearer audit journey, and you can now mark individual recommendations as done — the tool tracks your progress per domain.",
    items: [
      "Redesigned results page with a clearer per-dimension breakdown and action priority ordering",
      "Recommendation progress tracking — mark fixes as complete; your checklist persists across sessions",
      "Entity confidence scoring: the tool now quantifies how strongly the web recognizes your brand as a distinct entity",
      "nosnippet meta tag detection added to the technical audit (a nosnippet tag silently blocks AI engines from quoting your page)",
      "New /ai-citation-readiness-benchmark page for comparing your score against category benchmarks",
    ],
  },
  {
    date: "July 14, 2026",
    isoDate: "2026-07-14",
    badge: "Research",
    icon: FlaskConical,
    title: "Methodology corrected against 2026 evidence",
    summary: "An evidence review found three things the industry had widely wrong. The scoring and recommendations are now updated to reflect what actually moves citation rates in 2026.",
    items: [
      "Bot classification corrected: the tool now tracks 12 distinct AI bots tagged as search, fetch, or training. Citation warnings only fire for bots that gate whether you appear in answers — blocking training crawlers is a legitimate choice we no longer flag as an error",
      "llms.txt rescored honestly: crawler-log studies show ~97% of llms.txt files receive zero AI-bot requests and no major engine has committed to reading it. It's now a small optional bonus instead of a +10 score boost and headline quick win",
      "Freshness elevated to first-order factor: the majority of ChatGPT citations go to pages with a visible, recent 'last updated' date. Adding a visible date to your top pages is now the first recommended action for new users",
      "Freed quick-win slot now points to recommendations with demonstrated citation impact",
    ],
  },
  {
    date: "July 12, 2026",
    isoDate: "2026-07-12",
    badge: "Performance",
    icon: Zap,
    title: "Audits are ~3× faster",
    summary: "Two structural bottlenecks were causing 25–40 second audit times on analytics-heavy sites. Both are fixed.",
    items: [
      "Page rendering now waits for domcontentloaded (capped at 15s) with a short networkidle settle (capped at 5s) — previously analytics beacons on most popular sites burned the full 25s timeout on every run",
      "Raw page fetch, browser render, robots.txt, and llms.txt checks now run concurrently instead of sequentially",
      "AI insights switched to a faster model — the briefing is a templated format that doesn't require the larger model",
      "Typical audits now complete in under 15 seconds; worst-case dropped from ~40s to ~20s",
    ],
  },
  {
    date: "July 2026",
    isoDate: "2026-07-01",
    badge: "New",
    icon: Sparkles,
    title: "First month free — all features, no card",
    summary: "Every new account now gets a full 30-day all-access window from the moment their email is verified. Every existing account received the same as a retroactive grant.",
    items: [
      "All four AI engines (ChatGPT, Claude, Gemini, Perplexity) unlocked from day one",
      "Fix Generator, Projects monitoring, AI crawler hit tracking, and competitor Share of Voice included",
      "No credit card required to start",
      "Automated trial lifecycle emails: reminder at ≤3 days remaining, summary of what you unlocked after the trial lapses",
      "Existing accounts were automatically granted a fresh 30-day window",
    ],
  },
  {
    date: "June 2026",
    isoDate: "2026-06-15",
    badge: "New",
    icon: Shield,
    title: "Real AI crawler hit tracking",
    summary: "Go beyond robots.txt checks — see exactly when and how often AI bots actually crawl your pages.",
    items: [
      "Embed one tracking snippet and get timestamped logs of GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, and other AI crawler visits",
      "See paths crawled, crawl frequency, and whether key pages are being reached",
      "Crawler hit data appears in the audit results alongside your robots.txt analysis",
      "Confirms your site is being indexed, not just permitted",
    ],
  },
  {
    date: "June 2026",
    isoDate: "2026-06-01",
    badge: "New",
    icon: Bell,
    title: "Projects — continuous monitoring & alerts",
    summary: "Add any domain to a Project and get alerted the moment your AEO score drops or crawler access changes.",
    items: [
      "Scheduled re-audits on your cadence — daily, weekly, or monthly",
      "Score-drop and crawler-block alerts delivered by email",
      "Trend history so you can see score movement over time",
      "Agency plan supports multiple client domains in a single workspace",
    ],
  },
  {
    date: "May 2026",
    isoDate: "2026-05-15",
    badge: "New",
    icon: BarChart3,
    title: "Prompt simulation with Share of Voice",
    summary: "Run the exact queries your buyers type across all four major AI engines at once. See citations, sentiment, and how often competitors appear in the same answers.",
    items: [
      "Live simulation across ChatGPT, Claude, Gemini, and Perplexity simultaneously",
      "Per-engine citation rate and brand sentiment (positive / neutral / negative)",
      "Competitor Share of Voice — see who else appears in the same answer sets",
      "Fan-out mode: covers six topical clusters in one run and scores your Topical Breadth",
      "Google Analytics integration (Agency plan): correlate AI-referred traffic with simulation results",
    ],
  },
  {
    date: "May 2026",
    isoDate: "2026-05-01",
    badge: "New",
    icon: Zap,
    title: "Fix Generator",
    summary: "Auto-draft the files and schema blocks that move AEO scores fastest. Copy and ship same-day.",
    items: [
      "FAQPage JSON-LD generated from your actual page content — the highest-ROI structured data format for AI citations",
      "Organization schema with sameAs links pre-filled for your LinkedIn, Crunchbase, and Wikipedia profiles",
      "robots.txt snippet with correct Allow rules for citation-path AI bots (not just training bots)",
      "llms.txt starter file scoped to your most important pages",
      "Available on Pro and Agency plans",
    ],
  },
];
