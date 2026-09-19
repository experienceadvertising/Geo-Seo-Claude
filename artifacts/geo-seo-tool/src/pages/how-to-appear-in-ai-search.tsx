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
  "Check access, answer real buyer questions, add verifiable details, and measure AI search visibility without citation promises.";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I get my website to show up in ChatGPT answers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Make the page publicly accessible, check OAI-SearchBot access for ChatGPT search, and answer a question people actually ask. Clear, useful content can improve eligibility, but no change guarantees that ChatGPT will cite your page.",
      },
    },
    {
      "@type": "Question",
      name: "Is AI search optimization the same for all engines?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Search providers use different systems and crawler controls. Google AI Overviews and AI Mode rely on Google Search eligibility and Googlebot access. ChatGPT search uses OAI-SearchBot. Claude has separate search and user retrieval bots. Check each provider's current documentation before editing robots.txt.",
      },
    },
    {
      "@type": "Question",
      name: "Does having more content help AI search visibility?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "More pages alone are not a strategy. Start with pages that answer real customer questions. Improve access, clarity, original detail, and the next step for the reader before publishing another page on the same topic.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a Wikipedia page or special AI schema?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Do not create a Wikipedia page unless the topic independently meets Wikipedia's rules. Google says there is no special schema or AI text file required for its AI search features. Accurate structured data can still help Search understand content when it matches the visible page.",
      },
    },
    {
      "@type": "Question",
      name: "How long does AI search optimization take to show results?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There is no reliable timeline. Crawl and indexing can take time, and an eligible page may never be selected for a particular answer. Track search queries, qualified visits, conversions, and repeated AI answer samples instead of expecting a result within a fixed number of days.",
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
  dateModified: "2026-09-19",
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
    crawler: "OAI-SearchBot (search), GPTBot (training)",
    signal: "Search retrieval and accessible page content",
    note: "Keep search and training crawler policies separate.",
  },
  {
    name: "Claude",
    org: "Anthropic",
    crawler: "Claude-SearchBot, Claude-User (search and retrieval)",
    signal: "Web search and user-initiated retrieval",
    note: "ClaudeBot is a separate model-development crawler.",
  },
  {
    name: "Gemini",
    org: "Google",
    crawler: "Googlebot (Google Search and AI features)",
    signal: "Search indexing and snippet eligibility",
    note: "Google-Extended controls certain Gemini uses outside Google Search.",
  },
  {
    name: "Perplexity",
    org: "Perplexity AI",
    crawler: "PerplexityBot",
    signal: "Search retrieval",
    note: "Check current Perplexity guidance before changing access rules.",
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
        modifiedTime="2026-09-19"
        authorName={PRIMARY_AUTHOR.name}
        jsonLd={[articleJsonLd, faqJsonLd, breadcrumb]}
      />
      <div className="min-h-[calc(100vh-4rem)] py-10 px-4 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* Hero */}
          <header className="space-y-4">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" /> AI Search Visibility Guide · Updated September 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              How to appear in AI search results: a practical guide for 2026
            </h1>
            <p className="text-sm text-slate-500">
              By <a href={PRIMARY_AUTHOR.url} rel="author" className="text-emerald-700 hover:underline font-medium">{PRIMARY_AUTHOR.name}</a>, {PRIMARY_AUTHOR.jobTitle} · Updated September 19, 2026
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Start with the same job your customer has: find a reliable answer and decide what to do next.
              Make that answer accessible, clear, and supported by facts. Then measure whether search and
              AI systems send useful visitors.
            </p>
          </header>

          {/* TL;DR */}
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="pt-6 pb-6 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Key takeaway</div>
              <p className="text-slate-800 leading-relaxed text-sm">
                Check crawl and indexing eligibility, confirm the main answer is visible, and read the page
                as a buyer would. Fix an access problem if you find one. If the page is accessible, focus on
                whether it answers the question and gives the reader a useful next step.
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
              Check the providers your customers actually use and keep their crawler rules separate.
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
              Traditional search foundations still matter, especially crawl access, useful content, and clear links.
            </p>
            <ul className="space-y-3">
              <Bullet>
                <strong>Answers can show several links.</strong> The sources displayed vary by question and
                provider. A useful, eligible page can still be omitted from a particular answer.
              </Bullet>
              <Bullet>
                <strong>Specific brand facts help readers.</strong> Explain who you serve, what you offer,
                and where your claims come from. Independent mentions can provide context, but no fixed
                number of mentions is a prerequisite for being cited.
              </Bullet>
              <Bullet>
                <strong>Crawler roles differ.</strong> Search, user retrieval, and model training bots can
                have separate controls. Google AI Overviews and AI Mode use Google Search eligibility.
              </Bullet>
              <Bullet>
                <strong>Rendered content needs checking.</strong> Google can render JavaScript. For any
                provider, test whether the important answer and links are accessible before assuming a
                client-rendered page is invisible.
              </Bullet>
              <Bullet>
                <strong>Answers can vary.</strong> Record the prompt, provider, date, locale, and cited URL
                when testing. A single response is a sample, not a stable citation rate.
              </Bullet>
            </ul>
          </section>

          {/* On-site optimizations */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900">On-site optimizations</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-600" /> robots.txt: the first thing to check
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Start with the search crawlers relevant to your customers: Googlebot for Google's AI
                  search features, OAI-SearchBot for ChatGPT search, Claude-SearchBot and Claude-User for
                  Claude, and PerplexityBot for Perplexity. Check each provider's current documentation,
                  then inspect robots.txt and any CDN restrictions. GPTBot and ClaudeBot serve separate
                  model-development purposes. Google-Extended controls some Gemini uses outside Search.
                </p>
                <div className="bg-slate-900 rounded-lg p-4 text-xs font-mono text-emerald-300 leading-relaxed">
                  <p className="text-slate-400"># Example only: review each provider's current policy</p>
                  <p>User-agent: Googlebot</p>
                  <p>Allow: /</p>
                  <p className="mt-2">User-agent: OAI-SearchBot</p>
                  <p>Allow: /</p>
                  <p className="mt-2">User-agent: Claude-SearchBot</p>
                  <p>Allow: /</p>
                  <p className="mt-2">User-agent: Claude-User</p>
                  <p>Allow: /</p>
                  <p className="mt-2">User-agent: PerplexityBot</p>
                  <p>Allow: /</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-sky-600" /> Server-side rendering
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Check the initial HTML and the rendered page for the main answer and useful links. If
                  content is missing from the initial HTML, use Search Console's URL Inspection tool to
                  see what Google rendered. Google can render JavaScript, so a missing sentence in raw
                  HTML alone does not prove a page is invisible or require a framework change.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-600" /> Structured data
                </h3>
                <ul className="space-y-2.5 mt-2">
                  <Bullet>
                    <strong>FAQPage schema</strong> should only describe visible questions and answers
                    when the page meets the provider's feature policies. It is not an AI citation requirement.
                  </Bullet>
                  <Bullet>
                    <strong>Organization schema</strong> can identify genuine company details and profiles.
                    Include only profiles the company actually owns or represents.
                  </Bullet>
                  <Bullet>
                    <strong>Article schema</strong> should use a truthful publication and update date.
                    Changing a date alone is not evidence that the content is current.
                  </Bullet>
                  <Bullet>
                    <strong>HowTo schema</strong> is optional and should match visible steps. Check current
                    rich-result support before adding markup for a display feature.
                  </Bullet>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" /> Content structure for direct-answer extraction
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Put a clear answer near the relevant heading, then add the detail needed to make it useful.
                  Descriptive headings, concise summaries, and verifiable facts help readers. There is no
                  required number of sentences or ideal answer length for AI search.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-teal-600" /> llms.txt
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  An llms.txt file is an optional content map. Google says no special AI text file is
                  required for its AI search features. Prioritize useful pages, search eligibility,
                  and accurate internal links first.
                </p>
              </div>
            </div>
          </section>

          {/* Off-site optimizations */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Make your brand easy to verify</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Give readers clear information about the company, its products, limitations, and contact
              options. Keep facts consistent across the pages and profiles you control. Independent
              coverage can add context, but it does not guarantee inclusion in an AI answer.
            </p>
            <ul className="space-y-3">
              <Bullet>
                <strong>Wikipedia.</strong> Do not create a brand article as an optimization tactic.
                Independent notability and Wikipedia's own rules determine whether an article belongs there.
              </Bullet>
              <Bullet>
                <strong>Industry coverage.</strong> Share original, checkable information that relevant
                publications may find useful. A mention or link is evidence of coverage, not proof that
                an AI provider will recommend the brand.
              </Bullet>
              <Bullet>
                <strong>Community participation.</strong> Answer real questions where your customers
                gather, when you can contribute firsthand knowledge. Avoid promotional posts that add
                nothing to the discussion.
              </Bullet>
              <Bullet>
                <strong>Company profiles.</strong> Keep real profiles accurate and link them when they
                help people verify your company. A sameAs link is a factual identifier, not a ranking promise.
              </Bullet>
              <Bullet>
                <strong>Original data.</strong> If you want research to be discoverable, publish an
                accessible summary with methods and limits. A gated report can still serve customers,
                but the public page should stand on its own.
              </Bullet>
            </ul>
          </section>

          {/* Warning box */}
          <Card className="border-amber-200 bg-amber-50/40">
            <CardContent className="pt-5 pb-5 flex gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Check the page before adding content</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A blocked crawler, incorrect canonical, or missing main content can limit discovery.
                  Check those issues first, then improve the answer and next step for the visitor. Missing
                  schema by itself does not erase the value of useful page content.
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
                customers ask. Log the provider, prompt, date, locale, cited URL, and context. Repeat
                the sample to see whether the answer is stable.
              </Bullet>
              <Bullet>
                <strong>AEO audit score.</strong> A structured audit scores your technical readiness
                across crawler access, content clarity, schema, and brand facts. Treat the score as a
                readiness summary, not a citation probability. Compare what changes between audits.
              </Bullet>
              <Bullet>
                <strong>Referral analytics.</strong> Add ChatGPT, Claude, Perplexity, and Gemini as
                referral sources in your analytics setup. Compare qualified actions and conversions
                using your own data. Google AI feature traffic is included in overall Web search reporting
                in Search Console, so do not label every Google organic visit as AI traffic.
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
                Review crawler access, page content, schema, brand facts, and a prioritized fix list.
                Start with one useful improvement. No credit card required.
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
