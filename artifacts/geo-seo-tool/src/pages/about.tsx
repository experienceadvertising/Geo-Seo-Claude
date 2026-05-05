import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Linkedin, Sparkles, BookOpen, Wrench, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import { PRIMARY_AUTHOR, PUBLISHER_ORG } from "@/data/author";

const PAGE_TITLE = "About — AEO Improvement, founded by Evan Weber";
const PAGE_DESC =
  "AEO Improvement is an Answer Engine Optimization auditing platform built by Evan Weber to help marketing teams measure and improve how AI search engines like ChatGPT, Claude, Gemini, and Perplexity describe their brands.";

const SITE = "https://aeoimprovement.com";

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE}/#evan-weber`,
  name: PRIMARY_AUTHOR.name,
  jobTitle: PRIMARY_AUTHOR.jobTitle,
  url: `${SITE}/about`,
  sameAs: PRIMARY_AUTHOR.sameAs,
  worksFor: PUBLISHER_ORG,
  description:
    "Founder of AEO Improvement. Marketer focused on how brands get cited in AI-generated search answers.",
};

const aboutPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: `${SITE}/about`,
  name: PAGE_TITLE,
  description: PAGE_DESC,
  mainEntity: { "@id": `${SITE}/#evan-weber` },
  publisher: PUBLISHER_ORG,
};

const breadcrumb = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
]);

export default function About() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 bg-gradient-to-b from-slate-50/60 to-white">
      <SEO
        title={PAGE_TITLE}
        description={PAGE_DESC}
        path="/about"
        jsonLd={[personJsonLd, aboutPageJsonLd, breadcrumb]}
      />
      <div className="max-w-3xl mx-auto space-y-12">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <header className="space-y-4">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> About
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            About AEO Improvement
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            We help marketing teams measure and improve how AI search engines —
            ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews —
            describe and cite their brands.
          </p>
        </header>

        <Card className="border-slate-200">
          <CardContent className="pt-6 pb-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white items-center justify-center shrink-0 font-bold text-lg shadow-md">
                EW
              </div>
              <div className="space-y-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {PRIMARY_AUTHOR.name}
                  </h2>
                  <p className="text-sm text-slate-500">{PRIMARY_AUTHOR.jobTitle}</p>
                </div>
                <p className="text-slate-700 leading-relaxed text-sm">
                  Evan founded AEO Improvement to bring the same rigor brands
                  apply to traditional SEO into the new world of generative
                  search. He has spent his career on the marketer side of the
                  table — working on how brands get found, talked about, and
                  trusted — and built this product because the existing tools
                  for AI search visibility either felt like spreadsheets in a
                  trench coat or required a six-figure enterprise contract.
                </p>
                <p className="text-slate-700 leading-relaxed text-sm">
                  AEO Improvement is the tool he wishes had existed when he was
                  trying to answer one specific question for the first time:
                  "When my customers ask ChatGPT about us, what does it actually
                  say?" — and what he could change to make that answer better.
                </p>
                <a
                  href={PRIMARY_AUTHOR.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
                >
                  <Linkedin className="h-4 w-4" /> Connect on LinkedIn
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">What we do</h2>
          <p className="text-slate-700 leading-relaxed">
            AEO Improvement scores any URL across six dimensions of AI search
            readiness — citability, AI crawler access, brand authority, schema
            markup, technical SEO, and live prompt simulation — and ships
            ready-to-paste fixes (llms.txt, JSON-LD, robots.txt) that move the
            score, not just dashboards that report it.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            {[
              {
                icon: <BarChart3 className="h-5 w-5 text-emerald-600" />,
                title: "Score every URL",
                body: "A single 0–100 AEO score from six weighted pillars, with the gap to a healthy score broken out by dimension.",
              },
              {
                icon: <Wrench className="h-5 w-5 text-emerald-600" />,
                title: "Ship the fixes",
                body: "Generate the actual files — llms.txt, FAQ schema, robots.txt — instead of leaving a list of things engineering will get to in six weeks.",
              },
              {
                icon: <BookOpen className="h-5 w-5 text-emerald-600" />,
                title: "Cite our sources",
                body: "Each recommendation is tagged research-backed, industry consensus, or internal benchmark. We don't oversell what the literature actually proves.",
              },
            ].map(({ icon, title, body }) => (
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

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">How we write about ourselves</h2>
          <p className="text-slate-700 leading-relaxed text-sm">
            A few standing rules we apply to our own marketing copy and to every
            recommendation we ship in the product:
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>
              <strong>No invented numbers.</strong> If we cite a percent
              improvement, it traces to a specific paper or to our own audit
              corpus. If we don't have either, we say so.
            </li>
            <li>
              <strong>Honest competitor framing.</strong> Our buyer's guides
              recommend competitors when they're a better fit — Brandlight for
              enterprise narrative shaping, Profound for attribution, AthenaHQ
              for engine breadth. We'd rather lose a customer to the right tool
              than win one and have them churn.
            </li>
            <li>
              <strong>The research isn't as clean as the marketing.</strong>{" "}
              Most "AI lifts your traffic by X%" claims you'll see in this
              category aren't supported by the academic GEO literature. The{" "}
              <Link href="/methodology" className="text-emerald-700 hover:underline">
                methodology page
              </Link>{" "}
              walks through what the Princeton/IIT Delhi 2024 paper actually
              found and which of our recommendations it does — and doesn't —
              support.
            </li>
          </ul>
        </section>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/30">
          <CardContent className="pt-7 pb-7 text-center space-y-3">
            <h2 className="font-bold text-xl text-slate-900">See what AI says about your brand</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Run a free audit. You'll get your AEO score, your crawler access
              status, and a prioritized fix list in under 90 seconds.
            </p>
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 mt-2">
                Audit my site, free <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <section className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            More
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/methodology" className="text-emerald-700 hover:underline">
                Methodology — how we score
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-emerald-700 hover:underline">
                Contact us
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-emerald-700 hover:underline">
                Pricing
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
