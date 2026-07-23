import { Link } from "wouter";
import { CheckCircle2, ArrowRight, Bot, Globe, Search, Shield, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import { AUTHOR_PERSON_LD, PRIMARY_AUTHOR, PUBLISHER_ORG } from "@/data/author";
import { GuideSources } from "@/components/guide-sources";

const PAGE_TITLE = "How to Appear in AI Search Results: A Practical Guide for 2026";
const PAGE_DESC =
  "Learn how to get your website cited by ChatGPT, Claude, Gemini, and Perplexity. This guide covers on-site, off-site, and technical optimizations that increase AI search visibility for brands and businesses.";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I get my website to show up in ChatGPT answers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Three things must be true simultaneously: OAI-SearchBot must be allowed in your robots.txt, your page content must be readable in HTML without JavaScript execution, and your brand must have sufficient entity recognition in the model's knowledge graph. Most sites that fail to appear in ChatGPT answers have a problem with one of the first two. Run a technical audit before assuming a content strategy problem.",
      },
    },
    {
      "@type": "Question",
      name: "Is AI search optimization the same for all engines?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Each engine has different retrieval logic, trust signals, and recency weighting. ChatGPT uses OAI-SearchBot and GPTBot. Claude uses ClaudeBot. Perplexity uses PerplexityBot. Google AI Overviews uses Google-Extended. A site optimized for one engine may perform very differently on another. Each crawler must be individually allowed in robots.txt, and the content signals that influence citation vary by engine.",
      },
    },
    {
      "@type": "Question",
      name: "Does having more content help AI search visibility?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "More content helps only if the technical foundation is already in place. Adding blog posts to a site where AI crawlers are blocked, or where content is JavaScript-rendered and invisible to bots, produces no citation lift. Fix access and extractability first. When content does matter, the priority is depth on specific topics, direct-answer structure, and original data or research that other sources cite — not volume.",
      },
    },
    {
      "@type": "Question",
      name: "How important is Wikipedia for AI search visibility?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Wikipedia is one of the highest-weight sources in AI model training data and is referenced by most major AI engines when forming entity associations. A Wikipedia article for your brand or key product significantly increases the likelihood that AI engines recognize and recommend you. If you do not meet Wikipedia's notability guidelines, focus on press coverage in major industry publications, which has a similar (if slower) effect on entity recognition.",
      },
    },
    {
      "@type": "Question",
      name: "How long does AI search optimization take to show results?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Technical fixes — unblocking crawlers, fixing robots.txt, adding schema — can produce measurable changes within days to weeks as AI crawlers re-index your pages. Entity recognition changes are slower because they depend on model training cycles and off-site signal accumulation. Most brands see measurable improvement in citation frequency within 60 to 90 days of a comprehensive implementation.",
      },
    },
  ],
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PAGE_TITLE,
  description: PAGE_DESC,
  datePublished: "2026-05-05",
  dateModified: "2026-05-05",
  author: AUTHOR_PERSON_LD,
  publisher: PUBLISHER_ORG,
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://aeoimprovement.com/how-to-appear-in-ai-search" },
};

const breadcrumb = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Guides", path: "/what-is-answer-engine-optimization" },
  { name: "How to appear in AI search", path: "/how-to-appear-in-ai-search" },
]);

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 items-start">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
      <span className="text-slate-700 text-sm leading-relaxed">{children}</span>
    </li>
  );
}

const ENGINES = [
  {
    name: "ChatGPT",
    org: "OpenAI",
    crawler: "OAI-SearchBot (live), GPTBot (training)",
    signal: "Entity recognition in training data + real-time retrieval",
    note: "Largest user base. Real-time search enabled by default for Plus/Pro.",
  },
  {
    name: "Claude",
    org: "Anthropic",
    crawler: "ClaudeBot",
    signal: "Web search with live retrieval",
    note: "Growing fast. Tends to cite fewer sources but with higher precision.",
  },
  {
    name: "Gemini",
    org: "Google",
    crawler: "Google-Extended",
    signal: "Integrated with Google Search index signals",
    note: "Shares infrastructure with Google AI Overviews. Googlebot compliance matters here.",
  },
  {
    name: "Perplexity",
    org: "Perplexity AI",
    crawler: "PerplexityBot",
    signal: "Heavy real-time retrieval, cites sources inline",
    note: "Very citation-forward — every response shows sources. High-value target for AEO.",
  },
];

export default function HowToAppearInAISearch() {
  return (
    <>
      <SEO
        title={PAGE_TITLE}
        description={PAGE_DESC}
        path="/how-to-appear-in-ai-search"
        ogType="article"
        publishedTime="2026-05-05"
        modifiedTime="2026-07-22"
        authorName={PRIMARY_AUTHOR.name}
        jsonLd={[articleJsonLd, faqJsonLd, breadcrumb]}
      />
      <div className="min-h-[calc(100vh-4rem)] py-10 px-4 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* Hero */}
          <header className="space-y-4">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" /> AI Search Visibility Guide · Updated July 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              How to appear in AI search results: a practical guide for 2026
            </h1>
            <p className="text-sm text-slate-500">
              By <a href={PRIMARY_AUTHOR.url} rel="author" className="text-emerald-700 hover:underline font-medium">{PRIMARY_AUTHOR.name}</a>, {PRIMARY_AUTHOR.jobTitle} · Updated July 22, 2026
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Getting cited by ChatGPT, Claude, Gemini, and Perplexity requires a different playbook than
              traditional SEO. This guide explains what each engine looks for, what the most common blockers
              are, and which changes produce the fastest results.
            </p>
          </header>

          {/* TL;DR */}
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="pt-6 pb-6 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Key takeaway</div>
              <p className="text-slate-800 leading-relaxed text-sm">
                Most brands that are not appearing in AI search results have a crawler access or rendering
                problem, not a content problem. Before investing in new content, verify that each AI engine's
                bot can access your site and read your content in HTML. Then build entity recognition off-site.
                Content strategy is the third lever, not the first.
              </p>
              <Link href="/sign-up">
                <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 mt-1">
                  Check my site's AI visibility free <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* The 4 engines */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900">The four AI engines that matter for most brands</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Each engine has different crawlers, different trust signals, and different citation behavior.
              A single-engine strategy is not a strategy — optimize for all four from the start.
            </p>
            <div className="space-y-3">
              {ENGINES.map(({ name, org, crawler, signal, note }) => (
                <Card key={name} className="border-slate-200">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 items-start">
                      <div className="min-w-[120px]">
                        <p className="font-bold text-sm text-slate-900">{name}</p>
                        <p className="text-xs text-slate-500">{org}</p>
                      </div>
                      <div className="flex-1 min-w-[200px] space-y-1">
                        <p className="text-xs text-slate-600"><strong>Crawler:</strong> {crawler}</p>
                        <p className="text-xs text-slate-600"><strong>Key signal:</strong> {signal}</p>
                        <p className="text-xs text-slate-500 italic">{note}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* How AI search differs */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">How AI search differs from traditional search</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Understanding the differences explains why SEO techniques alone are not sufficient.
            </p>
            <ul className="space-y-3">
              <Bullet>
                <strong>One answer, not ten links.</strong> AI engines synthesize a single response rather
                than returning a ranked list. Being cited in that response requires being selected over all
                competitors, not just appearing on the page.
              </Bullet>
              <Bullet>
                <strong>Entity-first selection.</strong> AI engines do not discover new brands — they select
                from brands they already recognize. Building entity recognition off-site is a prerequisite
                for appearing in answers, not a nice-to-have.
              </Bullet>
              <Bullet>
                <strong>Multiple crawler types.</strong> AI search involves a different set of bots than
                Googlebot. Each must be individually allowed and each obeys robots.txt independently.
              </Bullet>
              <Bullet>
                <strong>JavaScript is often invisible.</strong> Most AI crawlers do not execute JavaScript.
                Content visible to a user but rendered by JS is invisible to the crawler — and therefore
                uncitable.
              </Bullet>
              <Bullet>
                <strong>High citation volatility.</strong> Between 40% and 60% of cited sources change
                month-to-month across major AI platforms. Traditional search rankings shift gradually;
                AI citations shift quickly. Regular monitoring is essential.
              </Bullet>
            </ul>
          </section>

          {/* On-site optimizations */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900">On-site optimizations</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-600" /> robots.txt — the first thing to check
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Open your robots.txt and verify each of the following user-agents is allowed or not
                  explicitly blocked: OAI-SearchBot, GPTBot, ClaudeBot, PerplexityBot, Google-Extended.
                  A wildcard <code className="bg-slate-100 px-1 rounded text-xs">User-agent: *</code> Disallow
                  rule blocks all of them at once. Most site owners who add such a rule are not aware it
                  affects AI crawlers.
                </p>
                <div className="bg-slate-900 rounded-lg p-4 text-xs font-mono text-emerald-300 leading-relaxed">
                  <p className="text-slate-400"># Allow AI search crawlers explicitly</p>
                  <p>User-agent: OAI-SearchBot</p>
                  <p>Allow: /</p>
                  <p className="mt-2">User-agent: ClaudeBot</p>
                  <p>Allow: /</p>
                  <p className="mt-2">User-agent: PerplexityBot</p>
                  <p>Allow: /</p>
                  <p className="mt-2">User-agent: Google-Extended</p>
                  <p>Allow: /</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-sky-600" /> Server-side rendering
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Right-click your most important page and choose View Page Source. Search for a sentence
                  that a user would see in the main content. If it is not present in the raw HTML, your
                  page requires JavaScript to render — and AI crawlers will see an empty shell.
                  Server-side rendering or static site generation are required for the page to be citable.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-600" /> Structured data
                </h3>
                <ul className="space-y-2.5 mt-2">
                  <Bullet>
                    <strong>FAQPage schema</strong> maps directly to the question-and-answer format AI
                    uses. Add it to your highest-intent page first.
                  </Bullet>
                  <Bullet>
                    <strong>Organization schema</strong> with sameAs links (Wikipedia, LinkedIn,
                    Crunchbase, X) anchors your brand as a recognized entity across AI knowledge graphs.
                  </Bullet>
                  <Bullet>
                    <strong>Article schema</strong> with accurate dateModified signals freshness,
                    which influences citation for time-sensitive queries.
                  </Bullet>
                  <Bullet>
                    <strong>HowTo schema</strong> is effective for procedural guides and step-by-step content.
                  </Bullet>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" /> Content structure for direct-answer extraction
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  AI engines extract the paragraph that most directly resolves a query. For each major section
                  of your key pages, the opening paragraph should answer the section heading as a question
                  in 2 to 3 sentences. Setup paragraphs that build context before the answer are skipped
                  or excerpted in ways that lose meaning.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-teal-600" /> llms.txt
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  An llms.txt file is an optional plain-text content map. Major answer engines do not document it as a citation gate, so prioritize fresh server-visible content, sitemaps, and citation-path crawler access first.
                </p>
              </div>
            </div>
          </section>

          {/* Off-site optimizations */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Off-site optimizations: building entity recognition</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Entity recognition is the factor most often overlooked in AEO guides. On-site work matters,
              but if the AI engine's knowledge graph does not associate your brand with a problem space,
              its retrieval step will not reach you regardless of how well your content is structured.
            </p>
            <ul className="space-y-3">
              <Bullet>
                <strong>Wikipedia.</strong> AI model training data draws heavily from Wikipedia. A brand article
                that meets notability guidelines is one of the highest-leverage entity signals available.
                If your brand doesn't meet notability guidelines yet, focus on press first.
              </Bullet>
              <Bullet>
                <strong>Industry press coverage.</strong> Mentions in recognized trade publications create
                the same type of entity association as Wikipedia, more slowly. Aim for original research or
                data that publications want to cite — not press releases.
              </Bullet>
              <Bullet>
                <strong>Reddit presence.</strong> LLM training data draws significantly from Reddit.
                Your absence from the communities where your customers discuss their problems is not neutral
                — it creates a gap that competitors or critics fill. Consistent, helpful participation
                is the path in, not promotional posts.
              </Bullet>
              <Bullet>
                <strong>LinkedIn company page.</strong> Include in your Organization schema sameAs array.
                AI engines recognize LinkedIn company profiles as entity signals.
              </Bullet>
              <Bullet>
                <strong>Open your original data.</strong> Research or proprietary data behind a form wall
                earns nothing from AI discovery. AI cites whoever it can read. Publish a crawlable version
                alongside any gated asset.
              </Bullet>
            </ul>
          </section>

          {/* Warning box */}
          <Card className="border-amber-200 bg-amber-50/40">
            <CardContent className="pt-5 pb-5 flex gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Do the technical audit before adding content</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  The most common AEO mistake is investing in content strategy while the site has an
                  undiagnosed crawler access or rendering problem. A blocked bot, a JS-rendered page, or
                  missing schema negates every content improvement made while they exist. Diagnose first.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How to measure */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">How to measure AI search visibility</h2>
            <ul className="space-y-3">
              <Bullet>
                <strong>Manual prompt testing.</strong> Query each AI engine with the exact questions your
                customers ask. Log which brands appear, how often, and in what context. Do this monthly
                — not once.
              </Bullet>
              <Bullet>
                <strong>AEO audit score.</strong> A structured audit scores your technical readiness
                across crawler access, citability, schema, brand authority, and platform signals.
                Tracks what changes between audits.
              </Bullet>
              <Bullet>
                <strong>Referral analytics.</strong> Add ChatGPT, Claude, Perplexity, and Gemini as
                referral sources in your analytics setup. AI-referred sessions have high intent and
                convert significantly better than traditional search sessions at current volumes.
              </Bullet>
            </ul>
          </section>

          {/* FAQ */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
            <div className="space-y-4">
              {faqJsonLd.mainEntity.map((q) => (
                <div key={q.name} className="border-b border-slate-100 pb-4 last:border-0">
                  <h3 className="font-semibold text-slate-900 text-sm mb-2">{q.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{q.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Related guides</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/how-to-rank-in-chatgpt" className="text-emerald-600 hover:underline">How to rank in ChatGPT specifically</Link></li>
              <li><Link href="/what-is-answer-engine-optimization" className="text-emerald-600 hover:underline">What is Answer Engine Optimization (AEO)?</Link></li>
              <li><Link href="/best-aeo-tools" className="text-emerald-600 hover:underline">Best AEO tools in 2026</Link></li>
            </ul>
          </section>

          <GuideSources />

          {/* CTA */}
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/30">
            <CardContent className="pt-7 pb-7 text-center space-y-3">
              <h2 className="font-bold text-xl text-slate-900">Find out where you stand across all four AI engines</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Free AEO audit. Get your crawler access status, schema gaps, brand authority footprint,
                and a prioritized fix list. No credit card required.
              </p>
              <Link href="/sign-up">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 mt-2">
                  Audit my site, free <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}
