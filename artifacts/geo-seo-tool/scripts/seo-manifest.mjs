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
  url: `${SITE}/about`,
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

function faqLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export const ROUTES = [
  // Home — uses the defaults from index.html. Listed here so the prerender
  // step can also normalize the homepage shell (e.g. og:type stays "website").
  {
    path: "/",
    title: "AEO Improvement | Guided SEO and AI Search Optimization",
    h1: "Improve how your brand appears in Google and AI search",
    description:
      "Audit your website for SEO, GEO, and AI search visibility. Find the next technical and content improvement, test buyer prompts, and track progress from one guided workspace.",
    ogType: "website",
    // Home keeps its rich JSON-LD graph in index.html itself; nothing to add.
    jsonLd: [],
  },

  {
    path: "/pricing",
    title:
      "Pricing — AEO Improvement | Free, Starter, Pro, Agency plans for AI search optimization",
    description:
      "Start with a 30-day full-access trial. Then use Free, Starter from $29/month, Pro for measurement and multi-engine visibility, or Agency for client work.",
    ogType: "website",
    jsonLd: [
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Pricing", path: "/pricing" },
      ]),
    ],
  },

  {
    path: "/about",
    title: "About — AEO Improvement, founded by Evan Weber",
    description:
      "AEO Improvement is an Answer Engine Optimization auditing platform built by Evan Weber to help marketing teams measure and improve how AI search engines like ChatGPT, Claude, Gemini, and Perplexity describe their brands.",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        url: `${SITE}/about`,
        name: "About — AEO Improvement, founded by Evan Weber",
        description:
          "AEO Improvement is an Answer Engine Optimization auditing platform built by Evan Weber.",
        mainEntity: { "@id": `${SITE}/#evan-weber` },
        publisher: PUBLISHER,
      },
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${SITE}/#evan-weber`,
        name: AUTHOR.name,
        jobTitle: AUTHOR.jobTitle,
        url: `${SITE}/about`,
        sameAs: AUTHOR.sameAs,
        worksFor: PUBLISHER,
        description:
          "Founder of AEO Improvement. Marketer focused on how brands get cited in AI-generated search answers.",
      },
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
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
    modifiedTime: "2026-07-22",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/methodology",
        title: "Methodology — How the AEO Improvement audit score works",
        description:
          "How AEO Improvement scores a URL: the six pillars, where each recommendation comes from, and exactly which claims we will and won't make.",
        datePublished: "2026-05-05",
        dateModified: "2026-07-22",
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
    modifiedTime: "2026-07-22",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/what-is-answer-engine-optimization",
        title: "What is Answer Engine Optimization (AEO)? The 2026 Guide",
        description:
          "Answer Engine Optimization (AEO) is the practice of making your website more likely to be cited by AI search engines like ChatGPT, Claude, Gemini, and Perplexity.",
        datePublished: "2026-05-05",
        dateModified: "2026-07-22",
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
    modifiedTime: "2026-07-22",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/how-to-rank-in-chatgpt",
        title:
          "How to Rank in ChatGPT: Get Your Site Cited in AI Answers (2026)",
        description:
          "A practical guide to getting your website cited by ChatGPT search.",
        datePublished: "2026-05-05",
        dateModified: "2026-07-22",
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
    modifiedTime: "2026-07-22",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/how-to-appear-in-ai-search",
        title:
          "How to Appear in AI Search Results: A Practical Guide for 2026",
        description:
          "Learn how to get your website cited by ChatGPT, Claude, Gemini, and Perplexity.",
        datePublished: "2026-05-05",
        dateModified: "2026-07-22",
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
    modifiedTime: "2026-07-22",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/best-aeo-tools",
        title:
          "Best AEO (Answer Engine Optimization) Tools in 2026: Honest Buyer's Guide",
        description:
          "Compare the best Answer Engine Optimization tools of 2026.",
        datePublished: "2026-05-03",
        dateModified: "2026-07-22",
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
    modifiedTime: "2026-07-22",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/best-geo-optimization-tools",
        title:
          "Best GEO (Generative Engine Optimization) Tools in 2026: Honest Buyer's Guide",
        description:
          "Compare the best Generative Engine Optimization tools of 2026.",
        datePublished: "2026-05-03",
        dateModified: "2026-07-22",
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
    path: "/changelog",
    title: "What's New — AEO Improvement Changelog",
    description:
      "New features, methodology corrections, and performance improvements — see every update to AEO Improvement, newest first.",
    ogType: "article",
    ogImage: "https://aeoimprovement.com/og-changelog.png",
    publishedTime: "2026-05-01",
    modifiedTime: "2026-07-22",
    authorName: AUTHOR.name,
    jsonLd: [
      articleLd({
        path: "/changelog",
        title: "What's New — AEO Improvement Changelog",
        description:
          "New features, methodology corrections, and performance improvements — see every update to AEO Improvement, newest first.",
        datePublished: "2026-05-01",
        dateModified: "2026-07-22",
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Changelog", path: "/changelog" },
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
  {
    path: "/free-aeo-audit-tool",
    title: "Free AEO Audit Tool for ChatGPT and AI Search | AEO Improvement",
    description: "Audit any URL across six AI citation-readiness dimensions, get prioritized evidence-backed fixes, and track each optimization to completion.",
    ogType: "website",
    modifiedTime: "2026-07-22",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Free AEO audit tool", path: "/free-aeo-audit-tool" }])],
  },
  {
    path: "/ai-visibility-checker",
    title: "AI Visibility Checker for ChatGPT, Claude, Gemini and Perplexity",
    description: "Check whether AI engines can crawl, understand, mention, and cite your site. Run real buyer prompts across four answer engines.",
    ogType: "website",
    modifiedTime: "2026-07-22",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "AI visibility checker", path: "/ai-visibility-checker" }])],
  },
  {
    path: "/chatgpt-citation-tracker",
    title: "ChatGPT Citation Tracker and Visibility Monitor | AEO Improvement",
    description: "Track whether ChatGPT mentions and cites your brand, measure competitor Share of Voice, and monitor citation-readiness changes.",
    ogType: "website",
    modifiedTime: "2026-07-22",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "ChatGPT citation tracker", path: "/chatgpt-citation-tracker" }])],
  },
  ...[
    ["/aeo-software", "AEO Software for SEO Teams | AEO Improvement", "AEO software for teams that need to audit AI search visibility, identify SEO and GEO gaps, simulate buyer prompts, and turn findings into practical fixes.", "AEO software that tells you what to fix next"],
    ["/ai-visibility-software", "AI Visibility Software for SEO and GEO | AEO Improvement", "Use AI visibility software to audit crawler access, test buyer prompts across major AI engines, identify citation gaps, and guide SEO and GEO improvements.", "Measure AI visibility, then improve the pages behind it"],
    ["/geo-software-for-agencies", "GEO Software for Agencies | SEO and AI Visibility Client Workflow", "GEO software for agencies managing SEO and AI search visibility: audit client sites, simulate buyer prompts, prioritize improvements, and monitor client progress.", "Give every client a practical SEO and GEO improvement plan"],
  ].map(([path, title, description, h1]) => ({
    path, title, description, h1, ogType: "website", modifiedTime: "2026-08-29",
    staticSections: path === "/geo-software-for-agencies"
      ? [
        { heading: "A repeatable client workflow", body: "Audit each client site, use buyer-style prompts to identify meaningful visibility gaps, document completed work, and monitor later movement. Agency accounts support up to 10 active client sites, 150 audits, and 40 simulations each month." },
        { heading: "SEO and GEO in the same client conversation", body: "Keep organic Search Console evidence and controlled rank tracking separate from AI visibility checks, then prioritize the work together. The result is a more useful client work queue, not a blended vanity score." },
      ]
      : [
        { heading: "SEO, GEO, and AI visibility in one workflow", body: "Start with the technical and content signals a team can control, then test a meaningful set of buyer questions. AEO Improvement is designed to turn the findings into a practical improvement queue instead of a visibility dashboard with no next step." },
        { heading: "Observed movement, not promises", body: "AI answers and search rankings change for many reasons. The product records what was completed and displays subsequent movement without claiming that any one recommendation caused a lift." },
      ],
    faqs: path === "/geo-software-for-agencies"
      ? [
        { question: "How many client sites can an agency manage?", answer: "The Agency plan supports up to 10 active client sites in Projects, plus 150 audits and 40 simulations per month." },
        { question: "Does the tool prove a recommendation caused a ranking lift?", answer: "No. It records completed improvement actions and shows later rank or Search Console movement as observed outcomes." },
      ]
      : [
        { question: "Can I start without a credit card?", answer: "Yes. New accounts receive a 30-day full-access trial with no card and no automatic charge." },
        { question: "Does AEO Improvement replace SEO software?", answer: "No. It connects SEO and AI-search work, with Search Console and controlled rank-tracking features available on paid plans." },
      ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "AEO Improvement",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: `${SITE}${path}`,
        description,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD", url: `${SITE}/sign-up` },
      },
      faqLd(path === "/geo-software-for-agencies"
        ? [
          { question: "How many client sites can an agency manage?", answer: "The Agency plan supports up to 10 active client sites in Projects, plus 150 audits and 40 simulations per month." },
          { question: "Does the tool prove a recommendation caused a ranking lift?", answer: "No. It records completed improvement actions and shows later rank or Search Console movement as observed outcomes." },
        ]
        : [
          { question: "Can I start without a credit card?", answer: "Yes. New accounts receive a 30-day full-access trial with no card and no automatic charge." },
          { question: "Does AEO Improvement replace SEO software?", answer: "No. It connects SEO and AI-search work, with Search Console and controlled rank-tracking features available on paid plans." },
        ]),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: h1, path }]),
    ],
  })),
  {
    path: "/ai-citation-readiness-benchmark",
    title: "2026 AI Citation Readiness Benchmark | AEO Improvement",
    description: "A living, anonymized benchmark of the technical and content gaps that keep websites out of ChatGPT and AI-generated answers.",
    ogType: "article",
    publishedTime: "2026-07-22",
    modifiedTime: "2026-07-22",
    authorName: AUTHOR.name,
    jsonLd: [articleLd({ path: "/ai-citation-readiness-benchmark", title: "2026 AI Citation Readiness Benchmark", description: "An anonymized benchmark of website readiness for AI citations.", datePublished: "2026-07-22", dateModified: "2026-07-22" })],
  },
  ...[
    ["/content-effort-for-seo-and-ai-search", "Content Effort for SEO and AI Search", "A practical framework for creating original, well-documented content that helps people, search engines, and AI systems understand your expertise."],
    ["/show-first-party-experience-seo", "How to Show First-Party Experience in SEO Content", "Ways to document real experience in SEO content without inventing proof."],
    ["/seo-content-quality-vs-filler", "SEO Content Quality vs. Filler Content", "How to identify filler and put useful SEO content first."],
    ["/create-content-ai-can-cite", "How to Create Content AI Systems Can Cite", "Practical steps for making website content clear, attributable, and easy for AI systems to interpret."],
    ["/content-audit-original-research-checklist", "Content Audit Checklist for Original Research and Evidence", "A practical checklist for documenting original research, evidence, and methodology in content."],
    ["/document-expertise-methodology", "How to Document Testing, Methodology, and Expertise on Your Website", "How to document your methodology and expertise so readers can evaluate your advice."],
  ].map(([path, title, description]) => ({
    path, title: `${title} | AEO Improvement`, description, ogType: "article", publishedTime: "2026-08-17", modifiedTime: "2026-08-17", authorName: AUTHOR.name,
    jsonLd: [articleLd({ path, title, description, datePublished: "2026-08-17", dateModified: "2026-08-17" }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Resources", path: "/content-effort-for-seo-and-ai-search" }, { name: title, path }])],
  })),
];


// ── Route-specific crawler-visible body content ──────────────────────────────
//
// prerender.mjs writes each route's staticSections + faqs into the static
// HTML body. Before this map existed, 25 of 28 routes shared ~75% identical
// boilerplate body text — the exact duplicate-content pattern the product
// tells its own users to avoid. Every route now carries a unique summary of
// what its hydrated page actually says. Keep these short, factual, and in
// sync with the React pages; never add quantitative competitor claims that
// are not sourced from the competitor's public site (see competitors.ts).
const STATIC_CONTENT = {
  "/": {
    sections: [
      { heading: "Audit, simulate, improve, and monitor", body: "AEO Improvement checks citability, brand authority, AI crawler access, technical SEO, schema markup, and per-platform readiness. Recommendations include their evidence source and remain in a domain-level checklist until you mark them complete." },
      { heading: "Who it is for", body: "Marketing and SEO teams that want a guided improvement queue for Google and AI search, and agencies that need a repeatable client workflow. Every new account starts with a 30-day full-access trial, no card required." },
    ],
    faqs: [
      { question: "What does AEO Improvement do?", answer: "It audits any URL for SEO, GEO, and AI search readiness, simulates real buyer prompts against ChatGPT, Claude, Gemini, and Perplexity, and turns the findings into a prioritized, evidence-backed improvement checklist." },
    ],
  },
  "/pricing": {
    sections: [
      { heading: "Plans", body: "Free includes 5 audits and 2 ChatGPT simulations per month. Starter is $29/month ($290/year) with 15 audits, 5 simulations, guided recommendations, and the Fix Generator. Pro is $79/month ($750/year) and adds all four AI engines, 25-prompt simulations, Search Console opportunities, rank tracking, monitoring, and competitor analysis. Agency is $249/month ($2,390/year) with everything in Pro for up to 10 active client sites." },
      { heading: "The first month is free on every account", body: "Every new account gets 30 days with all core product features unlocked and no credit card required. Nothing is charged automatically — when the month ends you choose Free, Starter, Pro, or Agency." },
    ],
    faqs: [
      { question: "Can I cancel anytime?", answer: "Yes. Starter, Pro, and Agency are month-to-month or annual; you can cancel at any time from the customer portal and your plan stays active until the end of the current billing period." },
      { question: "Do annual plans have a discount?", answer: "Yes: $290/year for Starter, $750/year for Pro, and $2,390/year for Agency, each below twelve months of the monthly price." },
    ],
  },
  "/about": {
    sections: [
      { heading: "What we do", body: "AEO Improvement is an Answer Engine Optimization auditing platform founded by Evan Weber. It measures how clearly a website can be found, understood, and cited by AI search engines, then guides the technical and content work that improves those signals." },
      { heading: "How we write about ourselves", body: "We apply the same standards we audit for: named authorship, documented methodology, and no invented statistics. Competitor facts on our comparison pages come from those companies' own public marketing sites, with an explicit hedge whenever something is not advertised." },
    ],
  },
  "/methodology": {
    sections: [
      { heading: "Six scored pillars", body: "Each audit scores AI crawler access, content citability, structured data, brand authority, technical foundation, and platform signals. Citation-path bots such as OAI-SearchBot are scored separately from training bots such as GPTBot, because they control different outcomes." },
      { heading: "Where recommendations come from", body: "Recommendations cite their evidence source: the Princeton/IIT Delhi GEO research (KDD 2024), later academic work, our internal audit benchmarks, and documented practitioner consensus. Freshness, answer-shaped content, FAQ schema, and named authorship rank high; llms.txt is treated as optional because it is not a demonstrated citation gate." },
      { heading: "Claims we will not make", body: "We do not claim any single change causes a citation or ranking lift, and we do not present AI answer movement as proof of causation. The product records completed work and shows observed movement alongside it." },
    ],
  },
  "/what-is-answer-engine-optimization": {
    sections: [
      { heading: "AEO vs SEO", body: "Answer Engine Optimization is the practice of making a website more likely to be cited in AI-generated answers from ChatGPT, Claude, Gemini, and Perplexity. It builds on SEO fundamentals — crawlability, clear structure, real expertise — and adds citation-specific work: answer-shaped content, entity clarity, and access for AI citation bots." },
      { heading: "The six dimensions of AEO", body: "AI crawler access, content citability, structured data, brand authority, technical foundation, and platform signals. Auditing all six shows which gap is actually holding a site back instead of guessing at rewrites." },
      { heading: "How to get started", body: "Run an audit of your most important page, fix crawler access first, then improve the clarity and self-containedness of your key answers. Test buyer-style prompts before and after so changes are grounded in observed AI responses." },
    ],
    faqs: [
      { question: "Is AEO the same as GEO?", answer: "They describe the same discipline. GEO (Generative Engine Optimization) comes from the Princeton/IIT Delhi research community; AEO is the practitioner term for optimizing content to be cited by answer engines." },
    ],
  },
  "/how-to-rank-in-chatgpt": {
    sections: [
      { heading: "How ChatGPT search works", body: "ChatGPT search discovers pages through OAI-SearchBot and fetches user-clicked pages with ChatGPT-User. GPTBot, by contrast, collects training data. Blocking GPTBot does not remove you from ChatGPT search results, but blocking OAI-SearchBot does — so robots.txt strategy should treat them separately." },
      { heading: "What determines whether ChatGPT cites you", body: "Server-visible content, clear entity signals, answer-shaped sections that stand alone, structured data that matches visible content, and third-party corroboration of your brand. Thin or JavaScript-only content is the most common blocker we see in audits." },
      { heading: "Fix order that works", body: "Verify crawler access first, then fix the highest-priority content gaps on the pages buyers actually ask about, then add schema, then build third-party citations. Measure your citation rate with repeated buyer-style prompts rather than one-off spot checks." },
    ],
  },
  "/how-to-appear-in-ai-search": {
    sections: [
      { heading: "The four engines that matter for most brands", body: "ChatGPT, Claude, Gemini, and Perplexity each crawl, retrieve, and cite differently. AI search answers favor sources that are crawlable by their citation bots, easy to interpret, and corroborated elsewhere — which is why the same site can be visible in one engine and absent from another." },
      { heading: "On-site and off-site work", body: "On-site: server-visible content, self-contained answers, accurate structured data, named authors, and explicit last-updated dates. Off-site: entity recognition built through consistent brand facts and third-party coverage that AI systems can cross-reference." },
      { heading: "How to measure AI search visibility", body: "Run a consistent set of buyer questions across engines, record mentions and citations, and re-test after each change. Present movement as observed outcomes — AI answers vary run to run, so trends matter more than single results." },
    ],
  },
  "/best-aeo-tools": {
    sections: [
      { heading: "What to look for in an AEO tool", body: "Coverage of the engines your buyers use, an audit that explains why a gap matters, prompt testing with real buyer questions, and output your team can implement. Dashboards that only report visibility leave the actual work undefined." },
      { heading: "The 2026 shortlist", body: "AEO Improvement fits self-serve marketers and SMBs with a guided audit-to-fix workflow across ChatGPT, Claude, Gemini, and Perplexity. AthenaHQ advertises broad engine coverage at self-serve pricing. Profound targets enterprise attribution buyers. Brandlight focuses on enterprise brand and narrative shaping. Otterly.AI centers on mention-rate and sentiment monitoring. Facts are drawn from each vendor's public site, with a \u201cnot advertised\u201d hedge where details are unpublished." },
    ],
    faqs: [
      { question: "Do I need a paid tool to start with AEO?", answer: "No. Start by auditing crawler access and your key pages' clarity. Tools accelerate the loop of auditing, testing prompts, and tracking work — AEO Improvement includes a free plan and a 30-day full-access trial." },
    ],
  },
  "/best-geo-optimization-tools": {
    sections: [
      { heading: "Where the term GEO comes from", body: "Generative Engine Optimization was coined in academic research from Princeton and IIT Delhi (KDD 2024), which measured how content changes affect inclusion in generative engine answers. Practitioners now use GEO and AEO interchangeably for the same discipline." },
      { heading: "How the 2026 GEO tools differ", body: "Self-serve platforms like AEO Improvement and AthenaHQ give marketers audits and prompt testing they can act on directly; enterprise platforms like Profound and Brandlight sell attribution and narrative programs through sales teams; Otterly.AI focuses on monitoring mentions and sentiment. Match the tool to who will do the implementation work." },
    ],
    faqs: [
      { question: "What should a GEO tool actually change?", answer: "Your website and your evidence trail: crawler access for citation bots, answer-shaped content, accurate structured data, and third-party corroboration. A GEO tool earns its keep when it turns visibility gaps into completed improvements." },
    ],
  },
  "/vs/otterly": {
    sections: [
      { heading: "Different centers of gravity", body: "Otterly.AI centers on monitoring — mention rate and sentiment for brand prompts across AI search. AEO Improvement centers on the improvement loop: a six-pillar audit, buyer-prompt simulations across ChatGPT, Claude, Gemini, and Perplexity, and fix output your team can ship. Otterly's pricing is not published on its public site." },
      { heading: "Choosing between them", body: "Teams that mainly need ongoing brand monitoring may prefer a monitoring-first product. Teams that want to know what to change on their site, and to track that work to completion, get more from an audit-first workflow." },
    ],
  },
  "/vs/athenahq": {
    sections: [
      { heading: "Coverage breadth vs guided depth", body: "AthenaHQ advertises self-serve pricing from $95/month and monitoring across seven engines. AEO Improvement covers the four engines most buyers use — ChatGPT, Claude, Gemini, Perplexity — and pairs visibility checks with a scored audit, evidence-backed recommendations, and a Fix Generator, from $29/month on Starter." },
      { heading: "Choosing between them", body: "If your priority is watching the widest set of engines, broad coverage matters. If your priority is improving the site behind the numbers, a guided audit-to-fix workflow is the differentiator." },
    ],
  },
  "/vs/profound": {
    sections: [
      { heading: "Enterprise attribution vs self-serve improvement", body: "Profound sells enterprise AI-search attribution through a contact-sales motion. AEO Improvement is self-serve: sign up, audit a URL, simulate buyer prompts across four engines, and work a prioritized fix queue — with plans from free to $249/month for agencies." },
      { heading: "Choosing between them", body: "Enterprise teams that need attribution reporting and procurement-grade contracts fit Profound's model. Marketers and agencies that want to start improving pages this week fit a self-serve audit platform." },
    ],
  },
  "/vs/brandlight": {
    sections: [
      { heading: "Narrative programs vs site improvement", body: "Brandlight focuses on enterprise brand narrative and bias shaping in AI answers, sold via contact sales. AEO Improvement focuses on the site itself: crawler access, citability, schema, technical SEO, and prompt-level visibility across ChatGPT, Claude, Gemini, and Perplexity." },
      { heading: "Choosing between them", body: "If you need an enterprise narrative program, evaluate Brandlight directly. If you want a measurable improvement workflow your own team runs, an audit-first self-serve tool is the better fit." },
    ],
  },
  "/changelog": {
    sections: [
      { heading: "What we log", body: "Every meaningful product change lands here newest first: new features, methodology corrections when the evidence changes, scoring adjustments, and performance work. Corrections are logged as corrections — we do not silently rewrite scores." },
      { heading: "Recent themes", body: "Recent releases added the Starter plan, guided SEO and GEO recommendations, optional Google rank tracking, Search Console opportunities, per-route static pages for AI crawlers, and refinements to prompt simulation depth and citation matching." },
    ],
  },
  "/contact": {
    sections: [
      { heading: "What to contact us about", body: "Audit questions, prompt simulations, billing and plan changes, partnership ideas, or corrections to anything we have published. Messages go straight to the team inbox and replies come from a person." },
    ],
  },
  "/free-aeo-audit-tool": {
    sections: [
      { heading: "What the free audit checks", body: "Enter a URL and get a 0–100 AEO score across six dimensions: AI crawler access, content citability, structured data, brand authority, technical foundation, and platform signals — with prioritized quick wins and the evidence behind each recommendation." },
      { heading: "What happens after the audit", body: "Recommendations move into a domain-level checklist you work through and mark complete. Re-audits show score movement over time, so improvement is tracked rather than guessed." },
    ],
    faqs: [
      { question: "Is the audit really free?", answer: "Yes. Every new account starts with a 30-day full-access trial with no credit card, and the Free plan continues with 5 audits per month afterward." },
    ],
  },
  "/ai-visibility-checker": {
    sections: [
      { heading: "Check whether AI engines can find, trust, and cite you", body: "The visibility check inspects crawler access for citation bots, how clearly your pages state their core facts, and whether AI engines mention or cite your brand when asked real buyer questions across ChatGPT, Claude, Gemini, and Perplexity." },
      { heading: "From visibility to action", body: "Every gap links to the underlying signal — a blocked bot, a missing schema type, an unclear entity — so the output is a work queue, not a score to stare at." },
    ],
  },
  "/chatgpt-citation-tracker": {
    sections: [
      { heading: "Track ChatGPT mentions and citations", body: "Run buyer-style prompts against ChatGPT, record whether your brand is mentioned or your site is cited, and compare competitor Share of Voice on the same prompts. Paid plans add scheduled monitoring so citation-readiness changes are caught early." },
      { heading: "Why citations move", body: "ChatGPT search citation behavior depends on OAI-SearchBot access, server-visible content, and corroborated brand facts. The tracker pairs each result with the audit signals behind it so you can work on causes, not just watch outcomes." },
    ],
  },
  "/ai-citation-readiness-benchmark": {
    sections: [
      { heading: "What the benchmark measures", body: "An anonymized aggregate of audits run through AEO Improvement: average readiness by dimension, the distribution of overall scores, and the technical and content gaps that most often keep sites out of AI answers." },
      { heading: "How to read it", body: "Use the benchmark to see which gaps are common — crawler blocks, thin answers, missing schema — and where your own audit stands relative to the distribution. Aggregates are anonymized and no individual site data is published." },
    ],
  },
  "/content-effort-for-seo-and-ai-search": {
    sections: [
      { heading: "What Content Effort means", body: "Content Effort is the visible evidence that real work went into a page: original observations, documented method, concrete examples, named authorship, and honest scope. Both search engines and AI systems reward pages that carry that evidence." },
      { heading: "The five visible signals", body: "First-party experience, original data or artifacts, methodological transparency, specific rather than generic claims, and maintenance over time. The guide walks through each signal with examples you can apply to existing pages." },
    ],
  },
  "/show-first-party-experience-seo": {
    sections: [
      { heading: "Use concrete artifacts", body: "Screenshots, measurements, before-and-after states, and process notes show experience without asserting it. One documented example outweighs paragraphs of unverifiable claims." },
      { heading: "State the scope honestly", body: "Say what you tested, for how long, and what you did not test. Honest scope makes the rest of the page more credible to readers and easier for AI systems to represent accurately." },
    ],
  },
  "/seo-content-quality-vs-filler": {
    sections: [
      { heading: "Lead with the answer", body: "Put the substantive answer in the first sentences of the section that promises it. Generic scene-setting before the answer is the most common filler pattern — and answer engines extract the section that answers, not the one that warms up." },
      { heading: "Cut filler, preserve context", body: "Filler is text that could introduce any article on the topic. Context is what a reader needs to apply your answer correctly. The guide shows how to tell them apart before deleting." },
    ],
  },
  "/create-content-ai-can-cite": {
    sections: [
      { heading: "Make the core fact explicit", body: "State the key claim in plain, self-contained language near the top of its section — who, what, and the qualifier that makes it true. AI systems cite passages that stand alone; implications spread across paragraphs get paraphrased or dropped." },
      { heading: "Show sources and limits", body: "Attribute data, link primary sources, and state where a claim stops applying. Attribution makes content safer to cite and harder to misrepresent." },
    ],
  },
  "/content-audit-original-research-checklist": {
    sections: [
      { heading: "The checklist", body: "For each substantive page: is there original data or observation, is the method described, are sources linked, is authorship named, is the date current, and does any claim exceed the evidence? Six checks that surface the pages worth strengthening first." },
      { heading: "Avoid overclaiming", body: "The fastest way to fail the audit is a claim your evidence does not support. Scale claims down to what was actually measured — precision reads as expertise; inflation reads as filler." },
    ],
  },
  "/document-expertise-methodology": {
    sections: [
      { heading: "Describe the method, not just the result", body: "Explain how you tested, what you compared, and over what period. Method descriptions are what let readers — and AI systems summarizing you — distinguish measured findings from opinion." },
      { heading: "Make authorship visible", body: "Named authors with real credentials and a linkable profile are a required signal in 2026: they give search and answer engines an entity to attribute expertise to, and give readers someone accountable for the advice." },
    ],
  },
};

for (const route of ROUTES) {
  const extra = STATIC_CONTENT[route.path];
  if (!extra) continue;
  route.staticSections = [...(route.staticSections ?? []), ...(extra.sections ?? [])];
  if (extra.faqs?.length) {
    route.faqs = [...(route.faqs ?? []), ...extra.faqs];
    // Surface the same Q&A as FAQPage JSON-LD unless the route already ships one.
    const hasFaqLd = (route.jsonLd ?? []).some((ld) => ld["@type"] === "FAQPage");
    if (!hasFaqLd) route.jsonLd = [...(route.jsonLd ?? []), faqLd(extra.faqs)];
  }
}

export const SITE_ORIGIN = SITE;
