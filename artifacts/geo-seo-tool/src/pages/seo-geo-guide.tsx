import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO, breadcrumbJsonLd } from "@/components/seo";

type Guide = { title: string; description: string; eyebrow: string; heading: string; intro: string; sections: Array<{ title: string; body: string }> };

const guides: Record<string, Guide> = {
  "/seo-and-geo": {
    title: "SEO and GEO: One Practical Growth Workflow",
    description: "A practical guide to improving organic search performance and AI visibility without treating them as the same metric.",
    eyebrow: "SEO + GEO guide",
    heading: "Improve search performance and AI visibility with one practical workflow",
    intro: "SEO and generative engine optimization overlap, but they answer different questions. SEO helps you earn and measure organic visibility. GEO helps you make your content easier for AI systems to understand, cite, and recommend. Strong teams use evidence from both before deciding what to ship.",
    sections: [
      { title: "1. Make the page eligible", body: "Start with the fundamentals: crawlable HTML, a useful canonical URL, sensible robots and snippet directives, and content that does not disappear when JavaScript is unavailable. AI access should match the policy your marketing and technical teams actually intend to enforce, including at the CDN or firewall." },
      { title: "2. Improve the page that already has a foothold", body: "Search Console can show which queries and pages already earn impressions. Strengthen the existing page before creating a thin page for every variation. Add the direct answer, supporting questions, specific claims, internal links, and evidence that match the searcher’s intent." },
      { title: "3. Show the work behind your claims", body: "Useful content is curated and concrete. Bring forward first-party observations, methodology, screenshots, examples, constraints, and a real point of view when they are true. Do not add invented proof or filler just to make a page longer." },
      { title: "4. Make brand facts consistent", body: "State who you are, what you do, who you help, the problem you solve, and why you are differentiated in clear language across the surfaces you control. Then support those facts with authentic reviews, relevant mentions, and useful third-party coverage over time." },
      { title: "5. Measure outcomes without claiming causation", body: "Track Search Console clicks, impressions, CTR, and average position separately from controlled keyword snapshots and AI visibility checks. Use trend lines and completed actions to learn what changed. A movement after a change is an observation, not proof that one recommendation caused it." },
    ],
  },
  "/seo-geo-tool": {
    title: "SEO and GEO Tool for Organic Search and AI Visibility",
    description: "Audit technical SEO, content effort, AI eligibility, citation readiness, and next actions in one evidence-led workflow.",
    eyebrow: "SEO + GEO tool",
    heading: "A practical SEO and GEO tool for teams that need clear next actions",
    intro: "AEO Improvement helps marketing teams and agencies turn organic-search and AI-visibility evidence into a prioritized action queue. It does not promise rankings or citations. It gives you a clearer way to decide what to improve, then measure what happens next.",
    sections: [
      { title: "Keep the signals distinct", body: "See technical SEO readiness, Content Effort readiness, Search Console performance, controlled keyword tracking, and AI visibility separately. That prevents one attractive score from hiding the work that actually needs attention." },
      { title: "Turn findings into a sequence", body: "Start with blockers such as inaccessible content or restrictive snippet directives. Then improve the pages and queries that already show demand. Use prompt simulation only after the audit to see how buyer questions are answered today." },
      { title: "Built for in-house teams and agencies", body: "Use the same workflow across brands while retaining client-level boundaries, source labels, completed actions, and observed performance history." },
    ],
  },
  "/geo-audit-tool": {
    title: "GEO Audit Tool for AI Search Visibility",
    description: "Audit whether a page is eligible for AI search, understandable to answer engines, and supported by evidence worth citing.",
    eyebrow: "GEO audit tool",
    heading: "Audit the signals that make a page easier for AI systems to use",
    intro: "A GEO audit is not a prediction engine. It checks visible technical and content signals that can affect whether an AI system can access, interpret, and support an answer with your page.",
    sections: [
      { title: "Find access and interpretation gaps", body: "Review crawler access, rendering, robots and snippet controls, canonicalization, schema, answer structure, entity clarity, and visible evidence. Fix access issues before polishing the prose." },
      { title: "Use buyer questions as a reality check", body: "After the audit, simulate a small number of focused buyer questions. Look at whether the brand is mentioned, which sources are cited, and what competing answers make clearer. Treat a single response as a snapshot, not a verdict." },
      { title: "Document the improvement", body: "Mark implementation work complete, keep notes, re-audit, and compare later signals. This creates an accountable record for the team or client without inventing causal claims." },
    ],
  },
  "/ai-seo-tool": {
    title: "AI SEO Tool for Content, Citations, and Brand Clarity",
    description: "Use SEO fundamentals and AI-specific readiness checks to improve content quality, citation readiness, and brand clarity.",
    eyebrow: "AI SEO tool",
    heading: "Use AI SEO as better SEO with a few important extra checks",
    intro: "Most AI visibility work begins with good SEO: accessible pages, useful content, clear intent, and credible evidence. AI search adds practical checks around crawler policy, JavaScript rendering, citation-ready answers, and consistent brand facts.",
    sections: [
      { title: "Do not chase unproven shortcuts", body: "Focus on content that solves the visitor’s problem, can be crawled, and clearly explains where its claims come from. Files and tags can be useful in the right setting, but they are not a replacement for accessible, useful pages." },
      { title: "Create evidence that is hard to replace", body: "Original data, genuine experience, methodology, screenshots, interviews, examples, and informed tradeoffs can help readers understand why a page deserves attention. Use them when they are true and relevant." },
      { title: "Make the next action obvious", body: "A useful audit should tell a team whether to repair an existing page, improve its evidence, align it to intent, add a supporting page, or protect an already-performing term." },
    ],
  },
};

export default function SeoGeoGuide() {
  const [location] = useLocation();
  const path = location in guides ? location : "/seo-and-geo";
  const guide = guides[path];
  const article = { "@context": "https://schema.org", "@type": "Article", headline: guide.heading, description: guide.description, author: { "@type": "Person", name: "Evan Weber" }, datePublished: "2026-08-30", dateModified: "2026-08-30", mainEntityOfPage: `https://aeoimprovement.com${path}` };
  return <main className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
    <SEO title={`${guide.title} | AEO Improvement`} description={guide.description} path={path} ogType="article" publishedTime="2026-08-30" modifiedTime="2026-08-30" authorName="Evan Weber" jsonLd={[article, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Resources", path: "/seo-and-geo" }, { name: guide.title, path }])]} />
    <p className="text-sm font-medium text-emerald-700">{guide.eyebrow}</p><h1 className="mt-2 text-4xl font-bold tracking-tight">{guide.heading}</h1><p className="mt-4 text-lg text-muted-foreground">{guide.intro}</p><p className="mt-4 text-sm text-muted-foreground">Updated August 30, 2026 · By Evan Weber, AEO Improvement</p>
    <div className="mt-10 space-y-5">{guide.sections.map((section) => <Card key={section.title}><CardHeader><CardTitle>{section.title}</CardTitle></CardHeader><CardContent className="leading-7 text-muted-foreground">{section.body}</CardContent></Card>)}</div>
    <Card className="mt-8 border-emerald-200 bg-emerald-50/50"><CardContent className="p-6"><h2 className="font-semibold">Start with the page and the evidence you already have</h2><p className="mt-2 text-sm text-muted-foreground">Run an audit, identify the biggest blocker, implement one concrete change, then measure the next search and AI-visibility signals without treating correlation as proof.</p><Link href="/free-aeo-audit-tool" className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline">Run a free audit</Link></CardContent></Card>
    <p className="mt-8 text-sm text-muted-foreground">Expert-guidance credit: <a className="text-emerald-700 hover:underline" href="https://signal.zyppy.com/p/seo-strategies-for-ai-search" target="_blank" rel="noreferrer">Cyrus Shepard and Zyppy Signal</a>. This guide is AEO Improvement's original interpretation of public practitioner guidance, not primary research.</p>
  </main>;
}
