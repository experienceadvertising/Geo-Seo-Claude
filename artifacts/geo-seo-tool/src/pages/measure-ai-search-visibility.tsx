import ReactMarkdown from "react-markdown";
import { Link } from "wouter";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import article from "@/data/measure-ai-search-visibility.md?raw";

const path = "/how-to-measure-ai-search-visibility";
const title = "How to Measure Visibility in AI Search Without Guessing";
const description = "Measure AI search visibility with Search Console, Bing Webmaster Tools, referral traffic, and a repeatable question set without treating citations as sales.";

export default function MeasureAISearchVisibility() {
  return <main className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
    <SEO title={`${title} | AEO Improvement`} description={description} path={path} ogType="article" publishedTime="2026-09-29" modifiedTime="2026-09-29" authorName="Evan Weber" jsonLd={[
      { "@context": "https://schema.org", "@type": "Article", headline: title, description, author: { "@type": "Person", name: "Evan Weber", url: "https://aeoimprovement.com/about" }, publisher: { "@type": "Organization", name: "AEO Improvement" }, datePublished: "2026-09-29", dateModified: "2026-09-29", mainEntityOfPage: `https://aeoimprovement.com${path}` },
      breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Resources", path: "/content-effort-for-seo-and-ai-search" }, { name: title, path }]),
    ]} />
    <p className="text-sm font-medium text-emerald-700">AEO Improvement guide</p>
    <h1 className="mt-2 text-4xl font-bold tracking-tight">{title}</h1>
    <p className="mt-4 text-sm text-muted-foreground">Published September 29, 2026 · By Evan Weber</p>
    <article className="prose prose-slate mt-8 max-w-none leading-7 prose-headings:scroll-mt-24 prose-a:text-emerald-700 prose-table:block prose-table:overflow-x-auto">
      <ReactMarkdown>{article}</ReactMarkdown>
    </article>
    <section className="mt-10 rounded-lg border border-emerald-200 bg-emerald-50/50 p-6">
      <h2 className="text-xl font-semibold">Put the measurement plan to work</h2>
      <p className="mt-2">Choose one important page, run an audit, and compare its visibility and business actions over time.</p>
      <Link href="/free-aeo-audit-tool" className="mt-4 inline-block font-medium text-emerald-700 underline">Run a free AEO audit</Link>
    </section>
    <p className="mt-8 text-sm">Related: <Link href="/how-to-appear-in-ai-search" className="text-emerald-700 underline">How to appear in AI search</Link> · <Link href="/content-effort-for-seo-and-ai-search" className="text-emerald-700 underline">Content effort for SEO and AI search</Link></p>
  </main>;
}
