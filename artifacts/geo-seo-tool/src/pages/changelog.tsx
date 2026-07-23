import { Link } from "wouter";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import { ArrowRight } from "lucide-react";
import { CHANGELOG } from "@/data/changelog";

const BADGE_COLORS: Record<string, string> = {
  New: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  Improvement: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Research: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  Performance: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  Fix: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const changelogJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AEO Improvement Changelog",
    description: "Product updates, new features, and methodology improvements to the AEO Improvement platform.",
    url: "https://aeoimprovement.com/changelog",
    numberOfItems: CHANGELOG.length,
    itemListElement: CHANGELOG.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.title,
      description: entry.summary,
    })),
  },
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Changelog", path: "/changelog" },
  ]),
];

export default function Changelog() {
  const latestIso = CHANGELOG[0]?.isoDate ?? "2026-07-22";

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
      <SEO
        title="Changelog — AEO Improvement | Product Updates & New Features"
        description="Every update to AEO Improvement: new features, methodology corrections, performance improvements, and research-backed scoring changes. See what's new."
        path="/changelog"
        ogType="article"
        publishedTime="2026-05-01T00:00:00Z"
        modifiedTime={`${latestIso}T00:00:00Z`}
        jsonLd={changelogJsonLd}
      />

      <div className="space-y-3 mb-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground">Changelog</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Changelog</h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          New features, methodology updates, and improvements — newest first.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border ml-[11px] hidden sm:block" />

        <div className="space-y-12">
          {CHANGELOG.map((entry, i) => {
            const Icon = entry.icon;
            const badgeClass = BADGE_COLORS[entry.badge] ?? BADGE_COLORS["New"];
            return (
              <div key={i} className="sm:pl-10 relative">
                <div className="absolute left-0 top-1 hidden sm:flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
                      {entry.badge}
                    </span>
                    <time className="text-sm text-muted-foreground" dateTime={entry.isoDate}>
                      {entry.date}
                    </time>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold tracking-tight mb-2">{entry.title}</h2>
                    <p className="text-muted-foreground leading-relaxed">{entry.summary}</p>
                  </div>

                  <ul className="space-y-2">
                    {entry.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {i < CHANGELOG.length - 1 && <div className="mt-12 border-t sm:hidden" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-16 rounded-xl border bg-card p-6 text-center space-y-3">
        <p className="font-semibold">Ready to see your AEO score?</p>
        <p className="text-sm text-muted-foreground">First month free — all features, no credit card.</p>
        <Link href="/sign-up">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
            Get started free <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
