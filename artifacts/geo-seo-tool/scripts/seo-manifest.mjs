// Build-time SEO manifest — one entry per public, indexable route.
//
// This is the source of truth for crawlers that don't execute JavaScript
// (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Bytespider, CCBot, etc.).
// `scripts/prerender.mjs` reads this manifest after `vite build` and writes
// `dist/public/<route>/index.html` for each entry, with the route-specific
// title, meta tags, canonical, OpenGraph block, and JSON-LD baked into the
// HTML shell that the React app then hydrates over.
//
// The runtime <SEO /> component is still in charge for users. This file only
// drives the static HTML written to disk for non-JS crawlers.

const SITE = "https://aeoimprovement.com";

const PUBLISHER = {
  "@type": "Organization",
  name: "AEO Improvement",
  logo: { "@type": "ImageObject", url: `${SITE}/favicon.svg` },
};

const AUTHOR = {
  "@type": "Person",
  "@id": `${SITE}/#evan-weber`,
  name: "Evan Weber",
  jobTitle: "Founder, AEO Improvement",
  url: "https://www.linkedin.com/in/worldsgreatestmarketer/",
  sameAs: ["https://www.linkedin.com/in/worldsgreatestmarketer/"],
};

function articleLd({ path, title, description, datePublished, dateModified }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished,
    dateModified,
    author: AUTHOR,
    publisher: PUBLISHER,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}${path}` },
  };
}

function breadcrumbLd(crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE}${c.path}`,
    })),
  };
}

export const ROUTES = [
  // Home — uses the defaults from index.html. Listed here so the prerender
  // step can also normalize the homepage shell (e.g. og:type stays "website").
  {
    path: "/",
    title:
      "AEO Improvement — Audit your visibility in ChatGPT, Claude, Perplexity & Gemini",
    description:
      "Free Answer Engine Optimization (AEO) audit. Score your website's citability across ChatGPT, Claude, Perplexity, and Google AI Overviews. Get personalized recommendations with transparent sources to win AI-driven discovery.",
    ogType: "website",
    // Home keeps its rich JSON-LD graph in index.html itself; nothing to add.
    jsonLd: [],
  },

  {
    path: "/pricing",
    title:
      "Pricing — AEO Improvement | Free, Pro, Agency plans for AI search optimization",
    description:
      "Free AEO audits forever. Pro from $49/mo unlocks ChatGPT, Claude, Gemini, and Perplexity coverage plus the Fix Generator. Agency plan for multi-client teams. Transparent pricing, no demo required.",
    ogType: "website",
    jsonLd: [
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Pricing", path: "/pricing" },
      ]),
    ],
  },

  {
    path: "/methodology",
    title: "Methodology — How the AEO Improvement audit score works",
    description:
      "How AEO Improvement scores a URL: the six pillars, where each recommendation comes from (Princeton/IIT Delhi GEO research, internal benchmarks, practitioner consensus), and exactly which claims we will and won't make.",
    ogType: "article",
    publishedTime: "2026-05-05",
    modifiedTime: "2026-05-05",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/methodology",
        title: "Methodology — How the AEO Improvement audit score works",
        description:
          "How AEO Improvement scores a URL: the six pillars, where each recommendation comes from, and exactly which claims we will and won't make.",
        datePublished: "2026-05-05",
        dateModified: "2026-05-05",
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Methodology", path: "/methodology" },
      ]),
    ],
  },

  {
    path: "/what-is-answer-engine-optimization",
    title: "What is Answer Engine Optimization (AEO)? The 2026 Guide",
    description:
      "Answer Engine Optimization (AEO) is the practice of making your website more likely to be cited by AI search engines like ChatGPT, Claude, Gemini, and Perplexity. Learn how it differs from SEO and how to get started.",
    ogType: "article",
    publishedTime: "2026-05-05",
    modifiedTime: "2026-05-05",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/what-is-answer-engine-optimization",
        title: "What is Answer Engine Optimization (AEO)? The 2026 Guide",
        description:
          "Answer Engine Optimization (AEO) is the practice of making your website more likely to be cited by AI search engines like ChatGPT, Claude, Gemini, and Perplexity.",
        datePublished: "2026-05-05",
        dateModified: "2026-05-05",
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Guides", path: "/what-is-answer-engine-optimization" },
        {
          name: "What is Answer Engine Optimization?",
          path: "/what-is-answer-engine-optimization",
        },
      ]),
    ],
  },

  {
    path: "/how-to-rank-in-chatgpt",
    title:
      "How to Rank in ChatGPT: Get Your Site Cited in AI Answers (2026)",
    description:
      "A practical guide to getting your website cited by ChatGPT search. Covers GPTBot access, entity recognition, structured data, robots.txt strategy, and how to audit your current ChatGPT visibility.",
    ogType: "article",
    publishedTime: "2026-05-05",
    modifiedTime: "2026-05-05",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/how-to-rank-in-chatgpt",
        title:
          "How to Rank in ChatGPT: Get Your Site Cited in AI Answers (2026)",
        description:
          "A practical guide to getting your website cited by ChatGPT search.",
        datePublished: "2026-05-05",
        dateModified: "2026-05-05",
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Guides", path: "/what-is-answer-engine-optimization" },
        { name: "How to rank in ChatGPT", path: "/how-to-rank-in-chatgpt" },
      ]),
    ],
  },

  {
    path: "/how-to-appear-in-ai-search",
    title: "How to Appear in AI Search Results: A Practical Guide for 2026",
    description:
      "Learn how to get your website cited by ChatGPT, Claude, Gemini, and Perplexity. This guide covers on-site, off-site, and technical optimizations that increase AI search visibility for brands and businesses.",
    ogType: "article",
    publishedTime: "2026-05-05",
    modifiedTime: "2026-05-05",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/how-to-appear-in-ai-search",
        title:
          "How to Appear in AI Search Results: A Practical Guide for 2026",
        description:
          "Learn how to get your website cited by ChatGPT, Claude, Gemini, and Perplexity.",
        datePublished: "2026-05-05",
        dateModified: "2026-05-05",
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Guides", path: "/what-is-answer-engine-optimization" },
        {
          name: "How to appear in AI search",
          path: "/how-to-appear-in-ai-search",
        },
      ]),
    ],
  },

  {
    path: "/best-aeo-tools",
    title:
      "Best AEO (Answer Engine Optimization) Tools in 2026: Honest Buyer's Guide",
    description:
      "Compare the best Answer Engine Optimization tools of 2026. Pricing, features, AI engines covered, and which AEO platform fits self-serve marketers, agencies, and enterprise teams.",
    ogType: "article",
    publishedTime: "2026-05-03",
    modifiedTime: "2026-05-05",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/best-aeo-tools",
        title:
          "Best AEO (Answer Engine Optimization) Tools in 2026: Honest Buyer's Guide",
        description:
          "Compare the best Answer Engine Optimization tools of 2026.",
        datePublished: "2026-05-03",
        dateModified: "2026-05-05",
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Comparisons", path: "/best-aeo-tools" },
        { name: "Best AEO tools", path: "/best-aeo-tools" },
      ]),
    ],
  },

  {
    path: "/best-geo-optimization-tools",
    title:
      "Best GEO (Generative Engine Optimization) Tools in 2026: Honest Buyer's Guide",
    description:
      "Compare the best Generative Engine Optimization tools of 2026. Pricing, features, AI engines covered, and which GEO platform fits self-serve marketers, agencies, and enterprise teams.",
    ogType: "article",
    publishedTime: "2026-05-03",
    modifiedTime: "2026-05-05",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/best-geo-optimization-tools",
        title:
          "Best GEO (Generative Engine Optimization) Tools in 2026: Honest Buyer's Guide",
        description:
          "Compare the best Generative Engine Optimization tools of 2026.",
        datePublished: "2026-05-03",
        dateModified: "2026-05-05",
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Comparisons", path: "/best-aeo-tools" },
        { name: "Best GEO tools", path: "/best-geo-optimization-tools" },
      ]),
    ],
  },

  {
    path: "/vs/otterly",
    title: "AEO Improvement vs Otterly.AI — Compare AI search tools (2026)",
    description:
      "Side-by-side comparison of AEO Improvement and Otterly.AI: pricing, AI engine coverage, sentiment analysis, fix generation, and which buyer profile each one fits best.",
    ogType: "article",
    jsonLd: [
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Comparisons", path: "/best-aeo-tools" },
        { name: "vs Otterly", path: "/vs/otterly" },
      ]),
    ],
  },
  {
    path: "/vs/athenahq",
    title: "AEO Improvement vs AthenaHQ — Compare AI search tools (2026)",
    description:
      "Side-by-side comparison of AEO Improvement and AthenaHQ: pricing, AI engine coverage, breadth of monitored engines, and which buyer profile each one fits best.",
    ogType: "article",
    jsonLd: [
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Comparisons", path: "/best-aeo-tools" },
        { name: "vs AthenaHQ", path: "/vs/athenahq" },
      ]),
    ],
  },
  {
    path: "/vs/profound",
    title: "AEO Improvement vs Profound — Compare AI search tools (2026)",
    description:
      "Side-by-side comparison of AEO Improvement and Profound: pricing, AI engine coverage, attribution analytics, and which buyer profile each one fits best.",
    ogType: "article",
    jsonLd: [
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Comparisons", path: "/best-aeo-tools" },
        { name: "vs Profound", path: "/vs/profound" },
      ]),
    ],
  },
  {
    path: "/vs/brandlight",
    title:
      "AEO Improvement vs Brandlight — Compare AI search tools (2026)",
    description:
      "Side-by-side comparison of AEO Improvement and Brandlight: pricing, AI engine coverage, narrative-shaping features, and which buyer profile each one fits best.",
    ogType: "article",
    jsonLd: [
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Comparisons", path: "/best-aeo-tools" },
        { name: "vs Brandlight", path: "/vs/brandlight" },
      ]),
    ],
  },

  {
    path: "/contact",
    title: "Contact — AEO Improvement",
    description:
      "Get in touch with the AEO Improvement team about audits, simulations, billing, or partnerships.",
    ogType: "website",
    jsonLd: [],
  },
];

export const SITE_ORIGIN = SITE;
