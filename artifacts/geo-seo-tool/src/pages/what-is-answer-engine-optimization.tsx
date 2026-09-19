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
        text: "SEO helps people find useful pages in search results. AEO applies the same foundations to AI answers: accessible pages, clear answers, accurate facts, and measurement of actual mentions or citations. Google says its AI search features have no extra technical requirements beyond Search eligibility.",
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
        text: "Start with the AI services your customers use. AEO Improvement supports sampled buyer-question tests in ChatGPT, Claude, Gemini, and Perplexity. Answers can vary by prompt, model, and retrieval context.",
      },
    },
    {
      "@type": "Question",
      name: "How do I know if AEO is working?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Test real customer questions in the AI services that matter to your buyers. Record the prompt, provider, date, mentions, and citations. Compare repeated samples with search query data, qualified visits, and conversions. A readiness score is useful for tracking page changes, not proof of AI visibility.",
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
    body: "Crawler roles differ. Googlebot controls Google Search access for AI Overviews and AI Mode. OAI-SearchBot serves ChatGPT search. Claude has separate search and user retrieval bots. Check current provider rules before changing robots.txt.",
  },
  {
    icon: <BookOpen className="h-5 w-5 text-sky-600" />,
    title: "Content citability",
    body: "Clear answers, useful headings, and enough context help readers understand a page. No passage length or structure guarantees selection in an AI answer.",
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-purple-600" />,
    title: "Structured data",
    body: "Accurate structured data can describe visible content and real company facts. Google does not require special schema for AI Overviews or AI Mode.",
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-amber-600" />,
    title: "Brand authority",
    body: "Clear company facts and relevant independent coverage help people assess a brand. No particular profile, publication, or encyclopedia entry is required for an AI citation.",
  },
  {
    icon: <Zap className="h-5 w-5 text-rose-600" />,
    title: "Technical foundation",
    body: "Check HTTPS, canonical URLs, and the rendered content. Google can render JavaScript, so test what its crawler sees before prescribing server-side rendering.",
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
        modifiedTime="2026-09-19"
        authorName={PRIMARY_AUTHOR.name}
        jsonLd={[articleJsonLd, faqJsonLd, breadcrumb]}
      />
      <div className="min-h-[calc(100vh-4rem)] py-10 px-4 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* Hero */}
          <header className="space-y-4">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> AEO Explainer · Updated September 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              What is Answer Engine Optimization (AEO)?
            </h1>
            <p className="text-sm text-slate-500">
              By <a href={PRIMARY_AUTHOR.url} rel="author" className="text-emerald-700 hover:underline font-medium">{PRIMARY_AUTHOR.name}</a>, {PRIMARY_AUTHOR.jobTitle} · Updated September 19, 2026
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              AEO is the work of making useful pages easy for AI search systems to find and
              understand, then checking whether your brand appears in relevant answers. The
              work starts with good SEO and a real customer question.
            </p>
          </header>

          {/* Definition card */}
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="pt-6 pb-6 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Definition</div>
              <p className="text-slate-800 leading-relaxed text-sm">
                <strong>Answer Engine Optimization (AEO)</strong> applies search fundamentals to
                AI answers. Make pages accessible, answer relevant questions clearly, support claims
                with accurate information, and measure mentions, citations, and useful visits.
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
              <Bullet>AI answers are another way buyers discover and compare businesses. A clear, useful page can support both traditional search and AI-assisted discovery.</Bullet>
              <Bullet>Use your own analytics to see whether AI-referred visitors take valuable actions. Conversion rates vary by audience, source, and tracking setup.</Bullet>
              <Bullet>Answers and source links can change. Repeated checks are more useful than treating one response as a stable ranking.</Bullet>
              <Bullet>Make your brand facts easy to verify and your best pages easy to use. Relevant independent coverage can add context, but no single mention guarantees a recommendation.</Bullet>
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
                    ["Crawlers", "Googlebot, Bingbot", "Googlebot for Google AI search features; separate search and retrieval bots for other providers"],
                    ["Content structure", "Useful answers, headings, internal links", "Clear answers to buyer questions with enough context"],
                    ["Off-site context", "Relevant links and mentions", "Accurate profiles and independent coverage"],
                    ["Measurement", "Queries, visits, conversions", "Repeated prompt samples, cited URLs, useful visits"],
                    ["Stability", "Search positions can change", "AI answers and citations can vary by prompt and date"],
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
              AEO Improvement summarizes page-readiness checks across six dimensions. These
              are diagnostic signals, not a formula that predicts whether an AI answer will cite you.
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
              Check access and the visitor's task before making a new page. Look for these
              issues on a page that matters to your business:
            </p>
            <ul className="space-y-2.5">
              <Bullet>A relevant search crawler is blocked by robots.txt or the CDN.</Bullet>
              <Bullet>The main answer or links are missing from the rendered page a crawler receives.</Bullet>
              <Bullet>Important company facts or structured data do not match the visible page.</Bullet>
              <Bullet>The site lacks clear company facts or a practical way to verify and contact the business.</Bullet>
            </ul>
            <p className="text-sm text-slate-600 leading-relaxed">
              Run an audit to find the specific gaps, then improve the page for the customer.
              Recheck access and sample buyer questions after the change.
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
              <h2 className="font-bold text-xl text-slate-900">Get a clear AEO starting point</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Start a no-card trial. Enter your URL to review page readiness, crawler access,
                schema findings, and a prioritized fix list.
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
