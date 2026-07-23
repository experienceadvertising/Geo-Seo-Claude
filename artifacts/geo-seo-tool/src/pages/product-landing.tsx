import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Bot, CheckCircle2, Search } from "lucide-react";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

type Variant = "audit" | "visibility" | "citations";

const COPY: Record<Variant, { path: string; title: string; h1: string; intro: string }> = {
  audit: {
    path: "/free-aeo-audit-tool",
    title: "Free AEO Audit Tool for ChatGPT and AI Search | AEO Improvement",
    h1: "Free AEO audit tool for ChatGPT and AI search",
    intro: "Audit any URL across six citation-readiness dimensions, then work through a prioritized optimization journey with evidence attached to every recommendation.",
  },
  visibility: {
    path: "/ai-visibility-checker",
    title: "AI Visibility Checker for ChatGPT, Claude, Gemini and Perplexity",
    h1: "See whether AI engines can find, trust, and cite your site",
    intro: "Check crawler access and citation readiness, then simulate the buyer questions that matter across ChatGPT, Claude, Gemini, and Perplexity.",
  },
  citations: {
    path: "/chatgpt-citation-tracker",
    title: "ChatGPT Citation Tracker and Visibility Monitor | AEO Improvement",
    h1: "Track whether ChatGPT cites your brand or your competitors",
    intro: "Run real prompts, measure mentions and source links, monitor score changes, and turn every gap into a concrete task your team can complete.",
  },
};

export default function ProductLanding({ variant }: { variant: Variant }) {
  const copy = COPY[variant];
  const [url, setUrl] = useState("");
  const [, navigate] = useLocation();
  const { isSignedIn } = useAuth();

  function start(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    localStorage.setItem("pendingAuditUrl", url.trim());
    navigate(isSignedIn ? "/" : "/sign-up");
  }

  return (
    <div className="flex-1 bg-white text-slate-900">
      <SEO title={copy.title} description={copy.intro} path={copy.path} />
      <section className="border-b bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-5 py-16 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-300"><Bot className="h-4 w-4" />AEO Improvement</div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">{copy.h1}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">{copy.intro}</p>
            <form onSubmit={start} className="mt-8 flex max-w-2xl flex-col sm:flex-row gap-2">
              <label htmlFor={`audit-url-${variant}`} className="sr-only">Website URL</label>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id={`audit-url-${variant}`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourwebsite.com" className="h-12 pl-10 bg-white text-slate-950" />
              </div>
              <Button type="submit" size="lg" className="h-12 bg-emerald-600 hover:bg-emerald-700">Run free audit <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </form>
            <p className="mt-3 text-xs text-slate-400">First month all features unlocked. No credit card.</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-12 grid md:grid-cols-3 gap-8">
        {[
          ["Measure", "Score citability, brand authority, crawler access, schema, technical SEO, and platform readiness."],
          ["Prove", "Run buyer prompts across four engines and compare your Share of Voice with competitors."],
          ["Improve", "Mark recommendations complete, re-scan, and let the tool guide the next highest-impact action."],
        ].map(([title, body]) => <div key={title}><CheckCircle2 className="h-5 w-5 text-emerald-600 mb-3" /><h2 className="font-semibold text-lg">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p></div>)}
      </section>
    </div>
  );
}
