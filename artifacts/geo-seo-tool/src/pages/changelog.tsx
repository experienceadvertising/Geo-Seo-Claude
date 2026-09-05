import { Link } from "wouter";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import { CHANGELOG } from "@/data/changelog";
import releases from "@/data/releases.json";

const url = "https://aeoimprovement.com/changelog";
const schema = {
  "@context": "https://schema.org", "@type": "CollectionPage",
  name: releases.heading, description: releases.description, url,
  dateModified: CHANGELOG[0].isoDate,
  mainEntity: {
    "@type": "ItemList", numberOfItems: CHANGELOG.length,
    itemListElement: CHANGELOG.map((entry, i) => ({
      "@type": "ListItem", position: i + 1, name: entry.title,
      description: entry.summary, url: url + "#" + entry.slug,
    })),
  },
};

export default function Changelog() {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
      <SEO title={releases.title} description={releases.description} path="/changelog"
        ogType="website" ogImage="https://aeoimprovement.com/og-changelog.png"
        jsonLd={[schema, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "What's new", path: "/changelog" }])]} />
      <header className="mb-10 space-y-4">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">Home</Link>
        <p className="text-sm font-medium text-emerald-700">Product updates: SEO + GEO</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{releases.heading}</h1>
        <p className="text-lg text-muted-foreground">{releases.description}</p>
        <p className="text-sm text-muted-foreground">Latest release: <time dateTime={CHANGELOG[0].isoDate}>{CHANGELOG[0].date}</time></p>
        <nav aria-label="Browse updates" className="flex flex-wrap gap-4 text-sm">
          <a href="#latest-releases" className="text-emerald-700 underline">Recent releases</a>
          <a href="#release-archive" className="text-emerald-700 underline">Earlier releases</a>
          <Link href="/pricing" className="text-emerald-700 underline">Current plans and limits</Link>
        </nav>
      </header>
      {[false, true].map(archive => (
        <section key={String(archive)} id={archive ? "release-archive" : "latest-releases"} className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-semibold mb-4">{archive ? "Earlier releases" : "Recent releases"}</h2>
          {archive && <p className="text-sm text-muted-foreground mb-6">{releases.archiveNote}</p>}
          <div className="space-y-6">
            {CHANGELOG.filter(entry => entry.archive === archive).map(entry => (
              <article id={entry.slug} key={entry.slug} className="rounded-xl border bg-card p-5 sm:p-7 scroll-mt-24 space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 font-medium">{archive ? "Historical release" : entry.badge}</span>
                  <time dateTime={entry.isoDate} className="text-muted-foreground">{entry.date}</time>
                </div>
                <h3 className="text-xl font-semibold">{entry.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{entry.summary}</p>
                <p className="text-sm"><strong>Who it helps:</strong> {entry.audience}</p>
                {entry.items.length > 0 && <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">{entry.items.map(item => <li key={item}>{item}</li>)}</ul>}
                <nav aria-label={"Next steps for " + entry.title} className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
                  {entry.links.map(link => <Link key={link.href} href={link.href} className="font-medium text-emerald-700 underline underline-offset-4">{link.label}</Link>)}
                  <a href={"#" + entry.slug} aria-label={"Link to " + entry.title} className="text-muted-foreground underline">Link to update</a>
                </nav>
              </article>
            ))}
          </div>
        </section>
      ))}
      <aside className="rounded-xl border bg-muted/30 p-6 space-y-3">
        <h2 className="text-xl font-semibold">Put the next improvement into practice</h2>
        <p className="text-muted-foreground">Start with a website audit and a guided action plan. Pro and Agency add ongoing keyword tracking and connected SEO reporting. Check current plans for availability and limits.</p>
        <div className="flex flex-wrap gap-5">
          <Link href="/sign-up" className="font-medium text-emerald-700 underline">Start your guided trial</Link>
          <Link href="/methodology" className="font-medium text-emerald-700 underline">Read our methodology</Link>
        </div>
      </aside>
    </div>
  );
}
