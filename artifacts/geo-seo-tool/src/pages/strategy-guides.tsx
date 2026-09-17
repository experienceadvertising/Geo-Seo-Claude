import { Link, useLocation } from "wouter";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import guides from "@/data/strategy-guides.json";

const SITE = "https://aeoimprovement.com";
const relatedTitles = new Map<string, string>([
  ...guides.map((guide): [string, string] => [guide.path, guide.title]),
  ["/content-effort-for-seo-and-ai-search", "Content Effort for SEO and AI Search"],
  ["/show-first-party-experience-seo", "How to Show First-Party Experience"],
  ["/methodology", "How our recommendations are researched"],
]);

export default function StrategyGuides() {
  const [location] = useLocation();
  const guide = guides.find((item) => item.path === location) ?? guides[0];
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.published,
    dateModified: guide.published,
    author: { "@type": "Organization", name: "AEO Improvement" },
    publisher: { "@type": "Organization", name: "AEO Improvement", url: SITE },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}${guide.path}` },
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 text-slate-800 md:py-16">
      <SEO
        title={`${guide.title} | AEO Improvement`}
        description={guide.description}
        path={guide.path}
        ogType="article"
        publishedTime={guide.published}
        modifiedTime={guide.published}
        authorName="AEO Improvement"
        jsonLd={[article, breadcrumbJsonLd([
          { name: "Home", path: "/" },
          ...(guide.path === "/seo-geo-priorities-2026" ? [] : [{ name: "SEO and GEO priorities", path: "/seo-geo-priorities-2026" }]),
          { name: guide.title, path: guide.path },
        ])]}
      />
      <p className="text-sm font-semibold text-emerald-700">SEO + GEO field guide</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">{guide.title}</h1>
      <p className="mt-5 text-lg leading-8 text-slate-600">{guide.intro}</p>
      <p className="mt-4 text-sm text-slate-500">Published September 17, 2026 · By the AEO Improvement editorial team</p>

      <div className="mt-10 space-y-10">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{section.heading}</h2>
            <div className="mt-4 space-y-4 leading-8 text-slate-700">
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
      </div>

      <aside className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-xl font-semibold text-slate-950">Put this to work on one page</h2>
        <p className="mt-2 leading-7 text-slate-700">Run a baseline audit, choose one relevant SEO or GEO action, and record what you changed. AEO Improvement can guide the review, but you decide what to publish on your site.</p>
        <Link href="/free-aeo-audit-tool" className="mt-4 inline-block font-semibold text-emerald-800 underline underline-offset-4">Start a free website audit</Link>
      </aside>

      <section className="mt-12 border-t pt-8" aria-labelledby="guide-sources">
        <h2 id="guide-sources" className="text-xl font-semibold text-slate-950">Sources and credit</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Our examples and workflow are original to AEO Improvement. We credit the public research and official guidance that informed them. Expert surveys and correlations are not confirmed ranking factors or promises of results.</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
          {guide.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="text-emerald-700 underline underline-offset-2">{source.label}</a></li>)}
        </ul>
      </section>

      <nav className="mt-10 border-t pt-8" aria-label="Related guides">
        <h2 className="text-xl font-semibold text-slate-950">Keep going</h2>
        <ul className="mt-4 space-y-2">
          {guide.related.map((path) => <li key={path}><Link href={path} className="text-emerald-700 underline underline-offset-2">{relatedTitles.get(path) ?? path}</Link></li>)}
        </ul>
      </nav>
    </main>
  );
}
