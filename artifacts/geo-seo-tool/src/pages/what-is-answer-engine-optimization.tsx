import { Link } from "wouter";
import { CheckCircle2, ArrowRight, BookOpen, BarChart3, Zap, Globe, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import { AUTHOR_PERSON_LD, PRIMARY_AUTHOR, PUBLISHER_ORG } from "@/data/author";
import { GuideSources } from "@/components/guide-sources";

const PAGE_TITLE = "What is Answer Engine Optimization (AEO)? The 2026 Guide";
const PAGE_DESC =
  "Answer Engine Optimization (AEO) is the practice of making your website more likely to be cited by AI search engines like ChatGPT, Claude, Gemini, and Perplexity. Learn how it differs from SEO and how to get started.";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Answer Engine Optimization (AEO)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Answer Engine Optimization (AEO) is the practice of making your website more likely to be cited and recommended by AI-powered answer engines such as ChatGPT, Claude, Gemini, and Perplexity. Where traditional SEO optimizes for ranking positions in a list of links, AEO optimizes for citation and recommendation in a direct AI-generated response.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between AEO and SEO?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SEO (Search Engine Optimization) is focused on appearing in ranked link lists in Google and Bing. AEO (Answer Engine Optimization) is focused on being cited within the AI-generated responses that increasingly replace those link lists. The technical overlap is significant — server-side rendering, page speed, and structured data matter for both — but AEO adds new dimensions: crawler access for AI-specific bots, entity recognition in AI knowledge graphs, content structured for direct-answer extraction, and off-site signals like community presence on Reddit and Wikipedia.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between AEO and GEO?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization) describe the same practice with different emphasis. AEO tends to focus on getting cited in direct AI answers. GEO is a term coined in a 2024 academic paper by Aggarwal et al. that emphasizes content modifications that increase visibility in generative AI outputs specifically. Most practitioners use the terms interchangeably. Both refer to optimizing for AI-driven search rather than traditional ranked results.",
      },
    },
    {
      "@type": "Question",
      name: "Which AI engines should I optimize for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The four engines that matter most for most brands in 2026 are ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), and Perplexity. Each has different retrieval logic, different trust signals, and different recency weighting. A single-engine strategy is not a strategy — the same content can be cited frequently in one engine and not at all in another.",
      },
    },
    {
      "@type": "Question",
      name: "How do I know if AEO is working?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The most direct measurement is prompt testing: search your key customer questions in each AI engine and track which brands appear and how often. More scalable measurement combines an AEO audit score (tracking technical readiness across multiple dimensions), referral analytics from AI platforms, and periodic mention-rate tracking. Note that AI citation sources rotate frequently — between 40% and 60% month-to-month — so a single test is not a reliable baseline.",
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
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://aeoimprovement.com/what-is-answer-engine-optimization" },
};

const breadcrumb = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Guides", path: "/what-is-answer-engine-optimization" },
  { name: "What is Answer Engine Optimization?", path: "/what-is-answer-engine-optimization" },
]);

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 items-start">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
      <span className="text-slate-700 text-sm leading-relaxed">{children}</span>
    </li>
  );
}

const AEO_DIMENSIONS = [
  {
    icon: <Globe className="h-5 w-5 text-emerald-600" />,
    title: "AI crawler access",
    body: "GPTBot, ClaudeBot, PerplexityBot, and Google-Extended each follow your robots.txt. Blocking any of them hides your site from that engine's citation pool entirely.",
  },
  {
    icon: <BookOpen className="h-5 w-5 text-sky-600" />,
    title: "Content citability",
    body: "AI engines extract the paragraph that most directly answers a query. Content structured with direct-answer openings, clear headings, and appropriate passage length is cited significantly more often.",
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-purple-600" />,
    title: "Structured data",
    body: "FAQPage, Organization, Article, and HowTo schema give engines explicit signals about your content and brand. FAQPage in particular maps directly to the question-and-answer format AI uses.",
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-amber-600" />,
    title: "Brand authority",
    body: "AI engines select from brands they already recognize. Presence on Wikipedia, industry press, Reddit, and LinkedIn builds the entity recognition that precedes citation.",
  },
  {
    icon: <Zap className="h-5 w-5 text-rose-600" />,
    title: "Technical foundation",
    body: "Server-side rendering, HTTPS, page speed, and canonical URLs are table stakes. AI crawlers, like Googlebot, cannot reliably execute JavaScript — content invisible in View Source is invisible to AI.",
  },
  {
    icon: <Globe className="h-5 w-5 text-teal-600" />,
    title: "Platform signals",
    body: "A clear sitemap and information hierarchy help search crawlers discover important pages. llms.txt can be an optional human-readable map, but it is not a demonstrated citation gate.",
  },
];

export default function WhatIsAEO() {
  return (
    <>
      <SEO
        title={PAGE_TITLE}
        description={PAGE_DESC}
        path="/what-is-answer-engine-optimization"
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
              <BookOpen className="h-3.5 w-3.5" /> AEO Explainer · Updated July 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              What is Answer Engine Optimization (AEO)?
            </h1>
            <p className="text-sm text-slate-500">
              By <a href={PRIMARY_AUTHOR.url} rel="author" className="text-emerald-700 hover:underline font-medium">{PRIMARY_AUTHOR.name}</a>, {PRIMARY_AUTHOR.jobTitle} · Updated July 22, 2026
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              AEO is the practice of making your website more likely to be cited and recommended
              when people ask AI engines questions in your space. Here is how it works, why it matters
              in 2026, and what it takes to get started.
            </p>
          </header>

          {/* Definition card */}
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="pt-6 pb-6 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Definition</div>
              <p className="text-slate-800 leading-relaxed text-sm">
                <strong>Answer Engine Optimization (AEO)</strong> is the practice of structuring your website,
                content, and off-site presence so that AI-powered answer engines — ChatGPT, Claude, Gemini,
                Perplexity, and others — cite you when they respond to queries related to your business.
                Where traditional SEO targets a ranked list of links, AEO targets the AI-generated response
                that increasingly replaces that list.
              </p>
            </CardContent>
          </Card>

          {/* Why it matters */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Why AEO matters in 2026</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              AI search is not replacing traditional search yet, but it is reshaping how discovery works
              at the top of the funnel. A few key data points shape the case:
            </p>
            <ul className="space-y-3">
              <Bullet>
                ChatGPT, Perplexity, Claude, and Google AI Overviews now handle queries that used to produce
                ten blue links. If you are not cited in those responses, you are not part of that conversation.
              </Bullet>
              <Bullet>
                Research from major publishers shows that visitors arriving from AI platforms convert to
                paid subscriptions and purchases at 4 to 5 times the rate of visitors from traditional search.
                The volume is lower, but the intent is higher.
              </Bullet>
              <Bullet>
                Between 40% and 60% of cited sources change month-to-month across major AI platforms.
                The category is still being won. Early optimization compounds.
              </Bullet>
              <Bullet>
                AI engines do not discover new brands — they select from brands they already recognize.
                The brands building entity signals now are establishing the baseline the model uses
                for the next several years.
              </Bullet>
            </ul>
          </section>

          {/* AEO vs SEO */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900">AEO vs SEO: what changes and what stays the same</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 pr-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Factor</th>
                    <th className="text-left py-2 pr-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Traditional SEO</th>
                    <th className="text-left py-2 text-xs uppercase tracking-wider text-emerald-600 font-semibold">AEO addition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["Goal", "Rank in a link list", "Be cited in an AI response"],
                    ["Crawlers", "Googlebot, Bingbot", "GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot, Google-Extended"],
                    ["Content structure", "Keywords, headings, internal links", "Direct-answer paragraphs, FAQPage schema, passage-length tuning"],
                    ["Off-site signals", "Backlinks", "Entity recognition: Wikipedia, Reddit, LinkedIn, press mentions"],
                    ["Measurement", "Rankings, impressions, CTR", "Prompt testing, citation frequency, AEO audit score"],
                    ["Stability", "Rankings shift gradually", "Citation sources rotate 40-60% month-to-month — track regularly"],
                  ].map(([factor, seo, aeo]) => (
                    <tr key={factor}>
                      <td className="py-2.5 pr-4 font-medium text-slate-700 text-xs">{factor}</td>
                      <td className="py-2.5 pr-4 text-slate-500 text-xs">{seo}</td>
                      <td className="py-2.5 text-slate-700 text-xs">{aeo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* The 6 dimensions */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900">The six dimensions of AEO</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              A good AEO audit scores your site across six independent dimensions. Any one of them
              can be the reason you are not appearing, even if the other five are strong.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {AEO_DIMENSIONS.map(({ icon, title, body }) => (
                <Card key={title} className="border-slate-200">
                  <CardContent className="pt-5 pb-5 space-y-2">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="font-semibold text-sm">{title}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* How to get started */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">How to get started with AEO</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The fastest path to baseline AEO visibility is to eliminate the blockers first, then
              build the positive signals. Most sites have at least one of the following issues
              that prevents them from being cited at all:
            </p>
            <ul className="space-y-2.5">
              <Bullet>At least one AI crawler is blocked in robots.txt — usually by a wildcard rule targeting all bots.</Bullet>
              <Bullet>Key page content is rendered by JavaScript and invisible to crawlers in View Source.</Bullet>
              <Bullet>No FAQPage, Organization, or Article schema exists on any page.</Bullet>
              <Bullet>The brand has no presence on Wikipedia, LinkedIn, or any authoritative industry publication.</Bullet>
            </ul>
            <p className="text-sm text-slate-600 leading-relaxed">
              Run a structured audit to find your specific gaps before writing new content. Adding content
              to a site with crawler access problems or no entity recognition produces very little citation lift.
            </p>
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
              <li><Link href="/how-to-rank-in-chatgpt" className="text-emerald-600 hover:underline">How to rank in ChatGPT</Link></li>
              <li><Link href="/how-to-appear-in-ai-search" className="text-emerald-600 hover:underline">How to appear in AI search results across all major engines</Link></li>
              <li><Link href="/best-aeo-tools" className="text-emerald-600 hover:underline">Best AEO tools in 2026</Link></li>
              <li><Link href="/methodology" className="text-emerald-600 hover:underline">AEO Improvement methodology</Link></li>
            </ul>
          </section>

          <GuideSources />

          {/* CTA */}
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/30">
            <CardContent className="pt-7 pb-7 text-center space-y-3">
              <h2 className="font-bold text-xl text-slate-900">Get your AEO score in 60 seconds</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Free audit. Enter your URL and get a 6-dimension AEO score, your crawler access status,
                schema gaps, and a prioritized fix list. No credit card required.
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
