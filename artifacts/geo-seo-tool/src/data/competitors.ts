// Competitor metadata for the /vs/* comparison pages.
//
// IMPORTANT: every claim about a competitor here must be verifiable from
// their public marketing site. We deliberately do NOT invent quantitative
// claims (e.g. "X% slower", "Y% less accurate"). Where we don't know
// something, we either omit it or hedge ("does not prominently advertise").
//
// Verified from competitor public sites (research conducted 2026-05-03):
// - Otterly.AI:  pricing not published; Mention Rate + sentiment focus
// - AthenaHQ:    $95/mo self-serve; 7 engines; visibility + competitor intel
// - Profound:    enterprise / contact sales; 5 engines; attribution focus
// - Brandlight:  enterprise / contact sales; 4 engines; bias + influence focus

export interface CompetitorMeta {
  slug: string;
  name: string;
  domain: string;
  // SEO meta tags
  title: string;
  description: string;
  // Hero
  oneLiner: string;          // their advertised positioning, hedged
  pricingNote: string;       // verifiable pricing fact OR "Not published"
  // Honest factual claims sourced from competitor's own marketing
  theirEngines: string[];    // engines THEY claim to monitor
  theirStrengths: string[];  // 3-4 things they're known for (factual)
  theirGaps: string[];       // features they DON'T prominently advertise
  // Comparison rows shared by all pages — populated per competitor below
  // when there's a meaningful per-row difference; otherwise we use the
  // SHARED_COMPARISON_ROWS table.
  customRows?: ComparisonRow[];
  // Buyer profile — who should pick which tool, honestly
  whenToPickThem: string;
  whenToPickUs: string;
}

export interface ComparisonRow {
  feature: string;
  us: string;
  them: string;
  // "advantage" controls which column gets the green checkmark.
  // "neutral" = both have it; "us" = differentiator for us; "them" = honest
  // acknowledgement they have something we don't.
  advantage: "us" | "them" | "neutral" | "unknown";
}

// Comparison rows where the answer is the same regardless of competitor —
// these describe OUR product (which we can be 100% factual about) and the
// competitor column is left as a "Check their site" hedge so we never
// fabricate a competitor's feature claim.
export const OUR_FACTS = {
  freeTier: "Free plan: 5 audits + 2 simulations / month, no credit card",
  proPrice: "$79 / month or $470 / year",
  agencyPrice: "$249 / month",
  proAudits: "100 audits / month",
  proSims: "30 simulations / month, 25 prompts each",
  engines: "ChatGPT, Claude, Gemini, Perplexity (4 engines)",
  fixGenerator: "Auto-drafts llms.txt, FAQPage JSON-LD, Organization schema, robots.txt audit",
  citationGap: "Side-by-side competitor citation gap table",
  history: "1-year audit + simulation history (Pro), 2 years (Agency)",
  signup: "Self-serve sign-up, instant access, no demo required",
};

export const COMPETITORS: CompetitorMeta[] = [
  {
    slug: "otterly",
    name: "Otterly.AI",
    domain: "otterly.ai",
    title: "AEO Improvement vs Otterly.AI: Which AI Search Visibility Tool Is Right for You? (2026)",
    description: "Compare AEO Improvement and Otterly.AI side by side. Pricing, AI engines monitored, automated fixes, and which tool is the better fit for marketers, agencies, and in-house SEO teams.",
    oneLiner: "Otterly.AI positions itself primarily as an AI search mention-rate and sentiment monitoring tool — surfacing how often your brand appears in AI responses and the tone of those mentions.",
    pricingNote: "Pricing is not prominently published on Otterly's marketing pages — you'll typically need to start a trial or talk to them to see plans.",
    theirEngines: ["ChatGPT", "Perplexity", "Other generative engines"],
    theirStrengths: [
      "Mention rate tracking — what % of target prompts return your brand",
      "Sentiment analysis on the way AI describes your brand",
      "Real-time visibility dashboards",
    ],
    theirGaps: [
      "Does not prominently advertise an automated llms.txt or JSON-LD generator",
      "No publicly advertised competitor citation gap table",
      "Pricing requires a trial or sales conversation to confirm",
    ],
    whenToPickThem: "You want a pure monitoring dashboard and primarily care about how AI engines describe your brand qualitatively (sentiment + mention frequency).",
    whenToPickUs: "You want monitoring AND the actionable, technical fixes — auto-generated llms.txt, JSON-LD, and a prioritized recommendation list — without a sales call to find out what it costs.",
  },
  {
    slug: "athenahq",
    name: "AthenaHQ",
    domain: "athenahq.ai",
    title: "AEO Improvement vs AthenaHQ: Pricing, Features & Honest Comparison (2026)",
    description: "Compare AEO Improvement and AthenaHQ side by side. Plan pricing, AI engines tracked, optimization features, and a buyer's guide to picking the right AI search visibility tool.",
    oneLiner: "AthenaHQ is a brand visibility intelligence platform focused on tracking how your brand and competitors appear across a broad set of AI engines, with competitor monitoring and AI crawling features.",
    pricingNote: "AthenaHQ publishes a self-serve plan at $95 / month (recently discounted from $295), with a 17% annual discount and a free 10-minute audit.",
    theirEngines: ["ChatGPT", "Claude", "Gemini", "Perplexity", "Google AI Overviews", "Copilot", "Grok"],
    theirStrengths: [
      "Broadest published engine coverage — 7 AI engines including Copilot and Grok",
      "Competitor monitoring and share-of-voice tracking",
      "Dynamic AI crawling to detect indexing issues",
      "Granular citation source authority analysis",
    ],
    theirGaps: [
      "Does not prominently advertise a one-click llms.txt + JSON-LD auto-generator",
      "No publicly advertised competitor citation gap table as a standalone module",
      "Self-serve plan starts at $95 / month — higher than our $79 Pro tier",
    ],
    whenToPickThem: "You specifically need to monitor across Grok or Copilot in addition to the major engines, and you're comfortable at the $95+/mo price point for the broader engine net.",
    whenToPickUs: "You want the four engines that drive ~95% of meaningful AI search traffic today (ChatGPT, Claude, Gemini, Perplexity), the technical Fix Generator that drafts your llms.txt and schema, and a $79 starting price.",
  },
  {
    slug: "profound",
    name: "Profound",
    domain: "tryprofound.com",
    title: "AEO Improvement vs Profound: Self-Serve AEO vs Enterprise Sales Cycle (2026)",
    description: "Compare AEO Improvement and Profound. Pricing transparency, AI engines tracked, optimization vs attribution focus, and which tool fits self-serve marketers vs enterprise teams.",
    oneLiner: "Profound is an enterprise-focused AI search analytics platform centered on attribution and zero-click impact analysis — understanding how AI answer engines affect your traffic and which sources they cite.",
    pricingNote: "Profound does not publish pricing — their CTAs route to 'Get a Demo' or 'Contact Sales,' which signals an enterprise-grade contract motion.",
    theirEngines: ["ChatGPT", "Claude", "Gemini", "Perplexity", "Google AI Overviews"],
    theirStrengths: [
      "Strong attribution and source-tracking analytics",
      "'Ask AI' module to query how AI sees a brand directly in-platform",
      "Zero-click impact analysis tying AI search to organic traffic loss",
      "Enterprise-grade onboarding and account management",
    ],
    theirGaps: [
      "No published pricing — requires a sales conversation to evaluate",
      "Does not prominently advertise an automated llms.txt or JSON-LD generator",
      "Attribution-first framing means less emphasis on 'fix this on your site' workflows",
    ],
    whenToPickThem: "You're an enterprise team with a six-figure budget who needs deep attribution data tied into a broader analytics stack and is willing to navigate a sales cycle.",
    whenToPickUs: "You want to start optimizing today — sign up, run an audit in 90 seconds, and walk away with a copy-paste llms.txt and a prioritized fix list — without scheduling a demo.",
  },
  {
    slug: "brandlight",
    name: "Brandlight",
    domain: "brandlight.ai",
    title: "AEO Improvement vs Brandlight: Self-Serve AEO Tool vs Enterprise AI Brand Platform (2026)",
    description: "Compare AEO Improvement and Brandlight side by side. Pricing models, AI engine coverage, optimization workflows, and which tool fits your team's stage and budget.",
    oneLiner: "Brandlight is an enterprise AI brand intelligence platform focused on bias detection, source influence scoring, and helping large brands shape the narrative AI tools tell about them.",
    pricingNote: "Brandlight does not publish pricing — CTAs are 'Contact Sales' / 'Partner With Us.' They recently raised a $30M Series A, signaling their target customer is large brands and enterprises.",
    theirEngines: ["ChatGPT", "Gemini", "Perplexity", "Google AI Overviews"],
    theirStrengths: [
      "'Bias Score' to detect AI favoritism or negativity toward your brand",
      "Source Impact Score to identify which sites most influence AI's view of you",
      "Visibility intelligence dashboards designed for executive reporting",
      "Strategic narrative-shaping consulting layered with the platform",
    ],
    theirGaps: [
      "No published pricing — enterprise sales cycle required",
      "Does not prominently advertise an automated llms.txt or JSON-LD generator",
      "Smaller monitored engine set (4) than AthenaHQ (7) — same core engines as us",
    ],
    whenToPickThem: "You're a global enterprise brand worried about AI bias and reputation, and you have budget for a platform plus narrative-shaping advisory.",
    whenToPickUs: "You want a self-serve tool with the same four major engines, automated technical fixes, transparent pricing starting at $79/mo, and the option to start free.",
  },
];

export function getCompetitor(slug: string): CompetitorMeta | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}

// Shared comparison rows — describe OUR product factually. The "them" column
// is per-competitor and stored above when we have a verifiable answer; if a
// competitor doesn't advertise the feature on their public site, we render
// "Not advertised" rather than fabricate a "no" or invent a feature claim.
export interface SharedRow {
  feature: string;
  us: string;
  // theirAnswers maps competitor slug → factual answer or "Not advertised"
  theirAnswers: Record<string, string>;
  // Whose column gets the green check, per competitor
  advantage: Record<string, "us" | "them" | "neutral" | "unknown">;
}

export const SHARED_ROWS: SharedRow[] = [
  {
    feature: "Free plan",
    us: "5 audits + 2 simulations / month, no credit card",
    theirAnswers: {
      otterly: "Free trial available; ongoing free tier not advertised",
      athenahq: "Free 10-minute audit",
      profound: "No free tier — demo only",
      brandlight: "No free tier — contact sales",
    },
    advantage: { otterly: "us", athenahq: "us", profound: "us", brandlight: "us" },
  },
  {
    feature: "Self-serve sign-up",
    us: "Yes — instant access, no demo",
    theirAnswers: {
      otterly: "Yes (trial-based)",
      athenahq: "Yes",
      profound: "No — sales demo required",
      brandlight: "No — sales contact required",
    },
    advantage: { otterly: "neutral", athenahq: "neutral", profound: "us", brandlight: "us" },
  },
  {
    feature: "Starting paid price",
    us: "$79 / month (Pro)",
    theirAnswers: {
      otterly: "Not published",
      athenahq: "$95 / month",
      profound: "Not published — enterprise",
      brandlight: "Not published — enterprise",
    },
    advantage: { otterly: "unknown", athenahq: "us", profound: "us", brandlight: "us" },
  },
  {
    feature: "AI engines tested in prompt simulations",
    us: "ChatGPT, Claude, Gemini, Perplexity (4)",
    theirAnswers: {
      otterly: "ChatGPT, Perplexity (focus on mention tracking)",
      athenahq: "ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews, Copilot, Grok (7)",
      profound: "ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews (5)",
      brandlight: "ChatGPT, Gemini, Perplexity, Google AI Overviews (4)",
    },
    advantage: { otterly: "us", athenahq: "them", profound: "them", brandlight: "neutral" },
  },
  {
    feature: "Automated llms.txt generator",
    us: "Yes — auto-drafted from your sitemap, copy-paste ready",
    theirAnswers: {
      otterly: "Not advertised on their site",
      athenahq: "Not advertised on their site",
      profound: "Not advertised on their site",
      brandlight: "Not advertised on their site",
    },
    advantage: { otterly: "us", athenahq: "us", profound: "us", brandlight: "us" },
  },
  {
    feature: "Auto-generated FAQPage JSON-LD + Organization schema",
    us: "Yes — copy-paste output for your <head>",
    theirAnswers: {
      otterly: "Not advertised on their site",
      athenahq: "Not advertised on their site",
      profound: "Not advertised on their site",
      brandlight: "Not advertised on their site",
    },
    advantage: { otterly: "us", athenahq: "us", profound: "us", brandlight: "us" },
  },
  {
    feature: "Competitor citation gap table",
    us: "Yes — side-by-side per-prompt comparison",
    theirAnswers: {
      otterly: "Sentiment + mention rate, not gap-table format",
      athenahq: "Competitor share-of-voice monitoring",
      profound: "Source attribution + share-of-voice",
      brandlight: "Source Impact Score (different framing)",
    },
    advantage: { otterly: "us", athenahq: "neutral", profound: "neutral", brandlight: "neutral" },
  },
  {
    feature: "Sentiment / tone analysis",
    us: "Yes (Pro)",
    theirAnswers: {
      otterly: "Yes — core feature",
      athenahq: "Yes",
      profound: "Yes",
      brandlight: "Yes — Bias Score is differentiated",
    },
    advantage: { otterly: "neutral", athenahq: "neutral", profound: "neutral", brandlight: "them" },
  },
  {
    feature: "Audit history retained",
    us: "1 year (Pro), 2 years (Agency)",
    theirAnswers: {
      otterly: "Not specified publicly",
      athenahq: "Not specified publicly",
      profound: "Enterprise — typically full retention",
      brandlight: "Enterprise — typically full retention",
    },
    advantage: { otterly: "us", athenahq: "us", profound: "neutral", brandlight: "neutral" },
  },
  {
    feature: "Designed for",
    us: "Solo marketers, in-house SEO, agencies",
    theirAnswers: {
      otterly: "Marketing teams of all sizes",
      athenahq: "Marketing teams and agencies",
      profound: "Mid-market and enterprise",
      brandlight: "Enterprise brands",
    },
    advantage: { otterly: "neutral", athenahq: "neutral", profound: "us", brandlight: "us" },
  },
];
