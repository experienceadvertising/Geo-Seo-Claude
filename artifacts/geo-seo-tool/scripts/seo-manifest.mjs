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

import { releases, changelogSchema } from "./changelog-content.mjs";
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
    h1: "Turn SEO and AI-search insights into your next improvement.",
    description:
      "Audit your website for SEO, GEO, and AI search visibility. Find the next technical and content improvement, test buyer prompts, and track progress from one guided workspace.",
    ogType: "website",
    staticSections: [
      { heading: "Less guesswork. One useful improvement at a time.", body: "AEO Improvement brings SEO audits, GEO recommendations, AI prompt testing, and keyword tracking into one guided workspace for brands and agencies. Your dashboard highlights the next action and records the changes you make. Start with one page, improve it, then check your progress." },
      { heading: "Build a stronger search foundation", body: "Find technical SEO issues, unclear brand facts, missing evidence, and content that is hard to understand or cite. Each recommendation tells you what to change and why. You apply the improvements to your own website." },
      { heading: "Measure progress on Pro and Agency", body: "Track selected Google keywords weekly by location and device. Connect Search Console for search performance and GA4 for traffic context. Compare observed results with completed actions. Rankings and AI citations are not guaranteed." },
    ],
    // Home keeps its rich JSON-LD graph in index.html itself; nothing to add.
    jsonLd: [],
  },

  {
    path: "/pricing",
    title:
      "Pricing | SEO and GEO Plans | AEO Improvement",
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
    title: releases.title,
    h1: releases.heading,
    description: releases.description,
    ogType: "website",
    ogImage: "https://aeoimprovement.com/og-changelog.png",
    publishedTime: "2026-05-01",
    modifiedTime: releases.entries[0].isoDate,
    authorName: AUTHOR.name,
    jsonLd: [
      changelogSchema,
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
    path: "/privacy",
    title: "Privacy Policy | AEO Improvement",
    h1: "Privacy Policy",
    description: "How AEO Improvement collects, uses, stores, shares, and deletes account, audit, analytics, and Google integration data. Updated September 4, 2026.",
    ogType: "website",
    modifiedTime: "2026-09-04",
    legal: true,
    staticSections: [
      { heading: "Information we collect", body: "We collect account information, website URLs and product inputs you provide, billing status supplied by Stripe, product diagnostics, and consented analytics identifiers. If you choose to connect Google, we also receive OAuth connection details and the read-only Analytics or Search Console data you ask the product to retrieve." },
      { heading: "Google permissions", body: "Connecting Google is optional. AEO Improvement requests analytics.readonly to list accessible GA4 properties and read reporting data, and webmasters.readonly to list verified Search Console properties and read search-performance data. These permissions cannot edit your Google properties." },
      { heading: "How we use Google data", body: "We read GA4 property identifiers and names, report dates, session sources, and session counts to show traffic referred by AI assistants and answer engines. We read Search Console property URLs, search queries, page URLs, clicks, impressions, click-through rate, and average position to show SEO opportunities and observed performance inside your account." },
      { heading: "Google data processors and protection", body: "Hosting and database providers process connection and reporting information to operate the integration. If you choose a Search Console query for prompt generation, that query and page context are sent to the AI service used for that feature, not your Google connection tokens. Google data is not shared with advertising networks or data brokers. Google reporting requests use HTTPS. Connected-data requests require a signed-in account and are restricted to that account's connection. No security measure guarantees absolute protection." },
      { heading: "Saved product records", body: "Disconnecting stops future access through the saved connection; it does not automatically delete audits, prompts, or other saved product records. Contact evan@aeoimprovement.com to request deletion. We retain product records as needed to provide the service and meet legal obligations; we do not promise immediate removal from backups or legally retained records." },
      { heading: "Storage and access", body: "OAuth access and refresh tokens are stored in AEO Improvement's server-side database and are not exposed to the browser. They are used only to maintain the connection and request reporting data you ask the product to display. Access is limited to the systems and service providers needed to operate and secure the integration." },
      { heading: "Sharing and prohibited uses", body: "We do not sell Google user data, use it for advertising, use it to train general-purpose AI models, or transfer it to unrelated third parties. We may disclose information when required by law or when necessary to protect users, the public, or the service." },
      { heading: "Retention, disconnection, and deletion", body: "Connection tokens are retained while the Google integration remains connected. Disconnecting Google in AEO Improvement deletes the saved connection and its tokens and triggers a best-effort request to revoke the token with Google. You can also revoke access in your Google Account. To request account and associated data deletion, email hello@aeoimprovement.com." },
      { heading: "Google API policy", body: "AEO Improvement's use and transfer of information received from Google APIs follows the Google API Services User Data Policy, including its Limited Use requirements." },
      { heading: "Other uses and choices", body: "We use information to provide audits, simulations, recommendations, monitoring, billing, support, and account communications; protect the service; and comply with legal obligations. You can choose essential-only cookies, disconnect third-party integrations, use marketing-email unsubscribe links, and contact hello@aeoimprovement.com with privacy questions." },
    ],
    jsonLd: [],
  },
  {
    path: "/google-data-use",
    title: "Google Data Use | AEO Improvement",
    h1: "Google Data Use",
    description: "How AEO Improvement accesses, uses, stores, and deletes Google Analytics and Search Console data. Updated September 4, 2026.",
    ogType: "website",
    modifiedTime: "2026-09-04",
    legal: true,
    staticSections: [
      { heading: "Permissions", body: "AEO Improvement requests analytics.readonly for GA4 property and reporting access and webmasters.readonly for verified Search Console property and performance access. Both permissions are read-only." },
      { heading: "Product use", body: "The product reads GA4 property identifiers, names, report dates, session sources and session counts for AI-referral reporting. It reads Search Console properties, page URLs, queries, clicks, impressions, CTR and average position for SEO opportunities and observed changes. Selecting a Search Console query for prompt generation sends that query and page context to the feature's AI service, not the connection tokens." },
      { heading: "Storage and access", body: "Connection tokens are stored in AEO Improvement's server-side database, are not exposed to the browser, and are used only to maintain the connection and retrieve requested reporting data." },
      { heading: "Disconnection and deletion", body: "Disconnecting Google deletes the saved connection and tokens and triggers a best-effort revocation request. Users may also revoke access in their Google Account or email hello@aeoimprovement.com to request account and associated integration-data deletion." },
      { heading: "Limited Use", body: "AEO Improvement does not sell Google user data, use it for advertising, or use it to train general-purpose AI models. Its use and transfer of Google API information follows the Google API Services User Data Policy, including Limited Use requirements." },
    ],
    jsonLd: [],
  },
  {
    path: "/free-aeo-audit-tool",
    title: "Free AEO Audit Tool for ChatGPT and AI Search | AEO Improvement",
    description: "Check your page for technical, content, and brand clarity gaps. Get prioritized, source-backed recommendations and track improvements to completion.",
    h1: "Find the gaps in your site's AI-search readiness",
    ogType: "website",
    modifiedTime: "2026-07-22",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Free AEO audit tool", path: "/free-aeo-audit-tool" }])],
  },
  {
    path: "/ai-visibility-checker",
    title: "AI Visibility Checker for ChatGPT, Claude, Gemini and Perplexity",
    description: "Assess AI-search readiness and test selected buyer questions across supported models. Review brand mentions and available citations in sampled responses.",
    ogType: "website",
    modifiedTime: "2026-07-22",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "AI visibility checker", path: "/ai-visibility-checker" }])],
  },
  {
    path: "/chatgpt-citation-tracker",
    title: "ChatGPT Citation Tracker and Visibility Monitor | AEO Improvement",
    description: "Test buyer questions and compare brand mentions and available citations across saved AI responses. Results vary by prompt, model, and retrieval context.",
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

export const SITE_ORIGIN = SITE;
