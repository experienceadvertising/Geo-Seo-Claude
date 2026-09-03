import React from "react";
import { Link, useLocation } from "wouter";
import { Search, Loader2, ArrowRight, BarChart3, TrendingUp, TrendingDown, Minus, Zap, Shield, Lock, Sparkles, CheckCircle2, BookOpen, Lightbulb, ExternalLink, Globe, FileCode, Building2, Bot, Activity, LineChart, Radar, Bell, Megaphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api-error";
import { hasMonitoringAccess } from "@/lib/planDisplay";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGetAuditQueryKey, useAnalyzeUrl, useGetAudit, useListAudits } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ScoreBadge } from "@/components/score-badge";
import { usePlan } from "@/hooks/usePlan";
import { AuthoritySignalsCard } from "@/components/authority-signals-card";
import { ReferralCard } from "@/components/referral-card";
import { CHANGELOG } from "@/data/changelog";
import { trackEvent, trackGoogleAdsConversion } from "@/lib/analytics";
import { SEO } from "@/components/seo";

function MarketStats() {
  const items = [
    {
      icon: TrendingUp,
      accent: "from-emerald-500 to-teal-500",
      label: "Where buyers are going",
      title: "Your buyers skip Google. They ask AI.",
      body: "ChatGPT, Claude, Perplexity, and Google AI Overviews increasingly answer questions that once started with a list of links. Make it easy for them to understand, retrieve, and cite your site.",
    },
    {
      icon: Zap,
      accent: "from-teal-500 to-cyan-500",
      label: "Why it pays to be cited",
      title: "AI-referred visitors already trust you when they arrive.",
      body: "A visitor who clicks a citation has already seen your brand in the answer. Connect GA4 to measure whether that traffic is helping your own business.",
    },
    {
      icon: BarChart3,
      accent: "from-cyan-500 to-emerald-500",
      label: "Why tracking matters",
      title: "Citation status changes every month. Most brands find out too late.",
      body: "AI answers and cited sources can change as content and retrieval systems change. Scheduled re-audits help you spot meaningful shifts before they become a blind spot.",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map(({ icon: Icon, accent, label, title, body }) => (
        <div
          key={title}
          className="relative rounded-2xl border border-border bg-card p-6 overflow-hidden group hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
        >
          <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${accent} opacity-60`} />
          <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md mb-4`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
          <h3 className="text-lg font-bold leading-snug mb-3">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
        </div>
      ))}
    </section>
  );
}

function ChatGPTIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="41" height="41" rx="10" fill="#10a37f"/>
      <path d="M30.09 17.38a7.37 7.37 0 0 0-.63-6.05 7.46 7.46 0 0 0-8.03-3.58 7.37 7.37 0 0 0-5.55-2.48 7.46 7.46 0 0 0-7.1 5.16 7.37 7.37 0 0 0-4.93 3.57 7.46 7.46 0 0 0 .92 8.74 7.37 7.37 0 0 0 .63 6.06 7.46 7.46 0 0 0 8.03 3.57 7.37 7.37 0 0 0 5.55 2.48 7.46 7.46 0 0 0 7.1-5.17 7.37 7.37 0 0 0 4.93-3.57 7.46 7.46 0 0 0-.92-8.73zm-11.08 15.52a5.53 5.53 0 0 1-3.55-1.29l.18-.1 5.9-3.4a.97.97 0 0 0 .49-.85v-8.32l2.49 1.44a.09.09 0 0 1 .05.07v6.88a5.56 5.56 0 0 1-5.56 5.57zm-11.94-5.1a5.53 5.53 0 0 1-.66-3.73l.17.1 5.9 3.41a.97.97 0 0 0 .98 0l7.2-4.16v2.87a.09.09 0 0 1-.04.08l-5.96 3.44a5.56 5.56 0 0 1-7.59-2.01zm-1.55-12.88a5.53 5.53 0 0 1 2.9-2.43v7.02a.97.97 0 0 0 .49.84l7.17 4.14-2.5 1.44a.09.09 0 0 1-.09 0L8.1 21.9a5.56 5.56 0 0 1-.58-6.98zm20.44 4.78-7.2-4.16 2.5-1.44a.09.09 0 0 1 .09 0l5.4 3.12a5.55 5.55 0 0 1-.86 10.01v-7.02a.97.97 0 0 0-.49-.84l.56.33zm2.48-3.76-.17-.1-5.9-3.4a.97.97 0 0 0-.98 0l-7.2 4.15v-2.87a.09.09 0 0 1 .04-.07l5.96-3.44a5.55 5.55 0 0 1 8.25 5.73zm-15.6 5.13-2.5-1.44a.09.09 0 0 1-.04-.08v-6.88a5.55 5.55 0 0 1 9.1-4.26l-.17.1-5.9 3.4a.97.97 0 0 0-.49.85v8.31zm1.36-2.93 3.2-1.85 3.2 1.85v3.68l-3.2 1.85-3.2-1.85v-3.68z" fill="white"/>
    </svg>
  );
}

function ClaudeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="41" height="41" rx="10" fill="#d97757"/>
      <path d="M25.8 9h-3.26l-7.36 12.7 3.63 6.3L25.8 9zM29.52 9h-3.26l-7.6 13.12 2.13 3.68.63-1.1L29.52 9zM15.48 28l1.63-2.82-1.63-2.82L12.22 28h3.26zM18.74 28h3.26l1.63-2.82-3.26-5.64-3.26 5.64L18.74 28z" fill="white"/>
    </svg>
  );
}

function GeminiIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="41" height="41" rx="10" fill="url(#gemini-grad)"/>
      <defs>
        <linearGradient id="gemini-grad" x1="0" y1="0" x2="41" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285f4"/>
          <stop offset="1" stopColor="#9c27b0"/>
        </linearGradient>
      </defs>
      <path d="M20.5 7C20.5 7 17 15.5 12 18C17 20.5 20.5 29 20.5 29C20.5 29 24 20.5 29 18C24 15.5 20.5 7 20.5 7Z" fill="white"/>
    </svg>
  );
}

function PerplexityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="41" height="41" rx="10" fill="#1c1c2e"/>
      <path d="M20.5 9L28 16H23V22L28 28H23V32H18V28H13L18 22V16H13L20.5 9Z" fill="white"/>
      <rect x="17" y="20" width="7" height="2" rx="1" fill="#20b8cd"/>
    </svg>
  );
}

const ENGINE_RESPONSES = [
  {
    name: "ChatGPT",
    Icon: ChatGPTIcon,
    borderColor: "border-emerald-500/25",
    citeBg: "bg-emerald-50 dark:bg-emerald-950/50",
    citeText: "text-emerald-700 dark:text-emerald-400",
    snippet: "AEO Improvement provides a structured audit of how each AI engine perceives your site, with specific fixes you can ship the same day.",
  },
  {
    name: "Claude",
    Icon: ClaudeIcon,
    borderColor: "border-orange-400/25",
    citeBg: "bg-orange-50 dark:bg-orange-950/50",
    citeText: "text-orange-700 dark:text-orange-400",
    snippet: "For teams serious about AI search visibility, aeoimprovement.com delivers multi-engine citation simulation and a score you can track over time.",
  },
  {
    name: "Gemini",
    Icon: GeminiIcon,
    borderColor: "border-blue-400/25",
    citeBg: "bg-blue-50 dark:bg-blue-950/50",
    citeText: "text-blue-700 dark:text-blue-400",
    snippet: "AEO Improvement audits your site across all four major AI engines and identifies exactly why you are not being cited in AI answers.",
  },
  {
    name: "Perplexity",
    Icon: PerplexityIcon,
    borderColor: "border-cyan-400/25",
    citeBg: "bg-cyan-50 dark:bg-cyan-950/50",
    citeText: "text-cyan-700 dark:text-cyan-400",
    snippet: "The AEO score from aeoimprovement.com quantifies citation likelihood across 6 dimensions including schema, authority, and crawler access.",
  },
];

function HeroVisual() {
  return (
    <div className="relative w-full max-w-xl mx-auto lg:mx-0">
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-emerald-500/20 via-teal-400/10 to-cyan-400/20 blur-3xl rounded-full" />

      <div className="relative rounded-2xl border border-border bg-card shadow-2xl shadow-emerald-500/10 overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/60 border-b border-border">
          <div className="flex gap-1.5 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 bg-background/70 rounded-md px-3 py-1 text-xs text-muted-foreground font-mono truncate min-w-0">
            aeoimprovement.com
          </div>
        </div>

        {/* Search query bar */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5 bg-muted/50 rounded-xl border border-border/60 px-3.5 py-2.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground/80 font-medium truncate">
              best AEO optimization tool for AI search
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 px-0.5">Illustrative multi-engine result</p>
        </div>

        {/* Response cards */}
        <div className="px-4 pb-4 space-y-2.5">
          {ENGINE_RESPONSES.map(({ name, Icon, borderColor, citeBg, citeText, snippet }) => (
            <div
              key={name}
              className={`rounded-xl border ${borderColor} bg-card/70 p-3 space-y-2`}
            >
              <div className="flex items-center gap-2">
                <Icon />
                <span className="text-xs font-semibold">{name}</span>
                <span className="ml-auto flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Example citation
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{snippet}</p>
              <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 ${citeBg}`}>
                <Globe className={`h-2.5 w-2.5 ${citeText} flex-shrink-0`} />
                <span className={`text-[10px] font-mono font-medium ${citeText}`}>aeoimprovement.com</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating score badge */}
      <div className="hidden md:flex absolute -bottom-4 -left-6 items-center gap-3 bg-card border shadow-xl rounded-2xl px-4 py-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
          92
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">AEO Score</span>
          <span className="text-sm font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Excellent
          </span>
        </div>
      </div>
    </div>
  );
}

function SignedOutLanding() {
  const [, setLocation] = useLocation();
  const [auditUrl, setAuditUrl] = React.useState("");
  const [auditUrlError, setAuditUrlError] = React.useState("");

  function startFreeAudit(event: React.FormEvent) {
    event.preventDefault();
    const enteredUrl = auditUrl.trim();
    if (!enteredUrl) {
      setAuditUrlError("Enter your website URL to start a free audit.");
      return;
    }
    const normalized = /^https?:\/\//i.test(enteredUrl) ? enteredUrl : `https://${enteredUrl}`;
    try {
      const parsed = new URL(normalized);
      if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname.includes(".")) throw new Error("Invalid URL");
      localStorage.setItem("pendingAuditUrl", parsed.toString());
      setLocation("/sign-up");
    } catch {
      setAuditUrlError("Enter a publicly reachable website, such as example.com.");
    }
  }

  return (
    <div className="flex-1 w-full">
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-emerald-950/40 dark:via-background dark:to-cyan-950/30" />

        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 backdrop-blur-sm">
                <Sparkles className="h-3 w-3" /> Built on 2026 expert research
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                Improve how your brand appears in Google and AI search.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-[560px]">
                One guided workflow for SEO and GEO. Find the technical, content, and visibility gaps
                holding you back, then get the next practical improvement to make for Google and AI search.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-foreground/80 max-w-md">
                {[
                  "Find SEO and AI-search visibility gaps",
                  "Confirm AI bots actually crawl your pages",
                  "Get alerted the moment your score drops",
                  "Auto-generated JSON-LD and robots.txt fixes",
                  "Connect Google data when you are ready to measure",
                  "30-day guided trial, no card",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <form onSubmit={startFreeAudit} className="w-full max-w-md space-y-2 mt-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    aria-label="Website URL to audit"
                    className="h-12 bg-background"
                    placeholder="yourwebsite.com"
                    value={auditUrl}
                    onChange={(event) => { setAuditUrl(event.target.value); setAuditUrlError(""); }}
                  />
                  <Button type="submit" size="lg" className="h-12 px-6 font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 whitespace-nowrap">
                    Audit my site <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                {auditUrlError && <p className="text-xs text-destructive" role="alert">{auditUrlError}</p>}
              </form>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="h-12 px-8 font-semibold border-emerald-500/30 hover:bg-emerald-500/10">
                    Sign in
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> 30-day guided trial. No credit card or automatic charge.
                </p>
                <Link href="/pricing" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                  See all plans &amp; pricing →
                </Link>
              </div>
            </div>
            <HeroVisual />
          </div>
        </div>
      </section>

      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-16">
        <MarketStats />

        <section className="space-y-8">
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">What you get</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">One workflow for SEO improvements and GEO visibility</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Audit the site, test the questions buyers ask, improve the pages that matter, and measure progress without juggling disconnected tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Bot,
                gradient: "from-violet-500 to-purple-600",
                badge: null,
                title: "Test the AI questions your buyers ask",
                body: "Run the exact questions your buyers type into ChatGPT, Claude, Gemini, and Perplexity. See whether you get cited, what your competitors share looks like, and what AI actually says about your brand. Fan-out mode tests 6 topic clusters at once.",
              },
              {
                icon: BarChart3,
                gradient: "from-emerald-500 to-teal-600",
                badge: null,
                title: "See the SEO and GEO issues worth fixing first",
                body: "Technical SEO, content effort, crawler access, citability, schema, brand facts, and platform signals are assessed together. Each gap becomes a specific, evidence-backed action, not a generic score.",
              },
              {
                icon: Zap,
                gradient: "from-amber-500 to-orange-500",
                badge: null,
                title: "Get the exact code to fix it. Copy, paste, ship.",
                body: "Instead of figuring out what to write, AEO Improvement auto-drafts your JSON-LD schema blocks, citation-bot robots.txt entries, and optional llms.txt based on your actual audit gaps. No guesswork. No dev backlog. Ready to deploy in minutes.",
              },
              {
                icon: Activity,
                gradient: "from-blue-500 to-cyan-500",
                badge: "New",
                title: "Confirm AI bots actually read your pages",
                body: "Allowing bots in robots.txt does not mean they visit. Embed one tracking line and see exactly when GPTBot, ClaudeBot, PerplexityBot, and Google-Extended crawl your pages, which paths they hit, and how often. Know your content is being indexed, not just allowed.",
              },
              {
                icon: Bell,
                gradient: "from-rose-500 to-pink-500",
                badge: "New",
                title: "Never get blindsided by a citation drop",
                body: "Add any domain and we re-audit on your schedule. The moment your AEO score drops or your crawler access changes, you get an alert — not weeks later when it shows up in traffic, but while you can still act on it.",
              },
              {
                icon: LineChart,
                gradient: "from-teal-500 to-emerald-500",
                badge: "New",
                title: "Measure SEO and AI-search progress",
                body: "On Pro, connect Search Console and GA4, track selected Google rankings, compare AI visibility with competitors, and keep a record of the improvements you completed. Movement is observed, never presented as proof of causation.",
              },
            ].map(({ icon: Icon, gradient, badge, title, body }) => (
              <div
                key={title}
                className="group relative rounded-2xl border border-border bg-card p-6 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-emerald-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-start justify-between mb-5">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {badge && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From invisible to cited in four steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                gradient: "from-violet-500 to-purple-600",
                title: "Audit",
                body: "Paste any URL. In 60 seconds, see your score across 6 dimensions with every gap ranked by the impact fixing it will have on your citation rate.",
              },
              {
                step: "02",
                gradient: "from-amber-500 to-orange-500",
                title: "Simulate",
                body: "Run the exact queries your buyers type. See whether ChatGPT, Claude, Gemini, and Perplexity cite you, what your competitors share looks like, and what AI says about your brand.",
              },
              {
                step: "03",
                gradient: "from-emerald-500 to-teal-600",
                title: "Fix",
                body: "Get specific changes ranked by research-proven impact, with ready-to-copy code for technical fixes and clear guidance for content ones. Strategies built on 2026 expert research, not guesses.",
              },
              {
                step: "04",
                gradient: "from-rose-500 to-pink-500",
                title: "Monitor",
                body: "Set automatic re-audits and get instant alerts on score drops. Connect Google Analytics to measure whether your improvements are driving real AI-referred traffic.",
              },
            ].map(({ step, gradient, title, body }) => (
              <div key={step} className="relative rounded-2xl border border-border bg-card p-6">
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white text-xs font-bold mb-4 shadow-md`}>
                  {step}
                </div>
                <h3 className="text-base font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 px-8 md:px-14 py-10 md:py-14">
          <div className="absolute top-6 left-8 text-emerald-500/20 select-none" aria-hidden>
            <svg width="64" height="48" viewBox="0 0 64 48" fill="currentColor"><path d="M0 48V29.333C0 12.8 10.667 3.2 32 0l4.267 6.4C24.533 8.533 18.133 13.867 16 22.4H28.8V48H0zm35.2 0V29.333C35.2 12.8 45.867 3.2 67.2 0L71.467 6.4C59.733 8.533 53.333 13.867 51.2 22.4H64V48H35.2z"/></svg>
          </div>
          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            <p className="text-xl md:text-2xl font-semibold leading-snug text-foreground">
              "Twenty years in digital marketing and I have never seen a category move this fast. AEO Improvement is the only tool that shows you exactly where your site stands with ChatGPT, Claude, Gemini, and Perplexity, diagnoses why you are not being cited, and hands you a prioritized fix list you can act on the same day. Every agency and in-house team needs this right now."
            </p>
            <div className="flex flex-col items-center gap-1">
              <span className="font-bold text-sm text-foreground">Evan Weber</span>
              <span className="text-xs text-muted-foreground">Digital Marketing Expert, Experience Advertising</span>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-gray-900" />
          <div aria-hidden className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-500/20 blur-[80px]" />
            <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-teal-500/15 blur-[60px]" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />
          </div>
          <div className="relative px-8 md:px-16 py-14 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> 30-day guided trial, no credit card
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                Find out whether AI engines cite you. Then fix what is stopping them.
              </h2>
              <p className="text-emerald-100/70 text-base">
                Full AEO score, crawler audit, and research-backed recommendations. Free for your first month.
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <Link href="/sign-up">
                <Button size="lg" className="h-13 px-8 font-semibold text-base bg-white text-emerald-900 hover:bg-emerald-50 shadow-xl shadow-black/20">
                  Audit my site, free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="ghost" className="h-13 px-8 font-semibold text-base text-white border border-white/20 hover:bg-white/10">
                  See pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const ANALYSIS_STEPS = [
  "Fetching page",
  "Analyzing content",
  "Checking crawlers",
  "Computing scores",
  "Generating insights",
];

function AnalysisProgress({ stage }: { stage?: number }) {
  const [elapsedStage, setElapsedStage] = React.useState(0);

  React.useEffect(() => {
    if (typeof stage === "number") return;
    const durations = [3000, 6000, 5000, 6000, 8000];
    let idx = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    function advance() {
      idx++;
      if (idx < ANALYSIS_STEPS.length - 1) {
        setElapsedStage(idx);
        timers.push(setTimeout(advance, durations[idx]));
      } else {
        setElapsedStage(ANALYSIS_STEPS.length - 1);
      }
    }
    timers.push(setTimeout(advance, durations[0]));
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  const step = typeof stage === "number"
    ? Math.max(0, Math.min(stage, ANALYSIS_STEPS.length - 1))
    : elapsedStage;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="flex flex-col items-center gap-3 w-full max-w-sm">
        {ANALYSIS_STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={label} className={`flex items-center gap-3 text-sm transition-all ${done ? "text-primary" : active ? "text-foreground font-semibold" : "text-muted-foreground/40"}`}>
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : active ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-current shrink-0" />
              )}
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// "Your AEO Journey" surface — the first thing a returning user sees on the
// dashboard once they have ≥1 audit. It does three jobs:
//   (1) Reflects current state: latest score + delta vs the prior audit on
//       the same domain, so the dashboard *itself* tells a progression
//       story instead of being just a launcher form.
//   (2) Renders a tiny inline sparkline of the last 5 audits — gives a felt
//       sense of trajectory without requiring users to open results pages.
//   (3) For free users, embeds a compact "What Pro unlocks for YOUR site"
//       row showing three locked previews tied to their actual data — much
//       higher-conversion than abstract feature lists on /pricing.
// Canonicalize a stored audit URL for *display* only (does not mutate history):
// lowercase the host, drop the protocol, a leading "www.", and a trailing slash
// so "https://Stripe.com/" and "stripe.com" render as the same "stripe.com".
function canonicalDisplayUrl(raw: string): string {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/\/$/, "");
    return host + (path && path !== "/" ? path : "");
  } catch {
    return raw.trim().toLowerCase();
  }
}

function AeoJourneyCard({ audits }: { audits: Array<{ id: number; url: string; geoScore: number; createdAt: string }> }) {
  const { isFree } = usePlan();
  // Audits are returned newest-first by /api/geo/audits.
  const latest = audits[0];
  // Find the most recent prior audit on the SAME hostname so the delta is
  // a meaningful "this site moved X" — not "your last audit on a totally
  // different site scored Y". Falls back to chronological prior if hostname
  // parse fails.
  const latestHost = (() => { try { return new URL(latest.url).hostname; } catch { return null; } })();
  const prior = audits.slice(1).find((a) => {
    if (!latestHost) return false;
    try { return new URL(a.url).hostname === latestHost; } catch { return false; }
  }) ?? audits[1];

  // /api/geo/audits returns geoScore as the DB-stored real value, which is
  // already on a 0-100 scale (the analyzer does Math.round of the weighted
  // sub-scores before insert). Display directly — no *100.
  const currScore = Math.round(latest.geoScore);
  const priorScore = prior ? Math.round(prior.geoScore) : null;
  const delta = priorScore != null ? currScore - priorScore : null;

  // Sparkline: last 5 audits, oldest → newest, on this hostname if there
  // are enough; otherwise the global recency window. Plain inline SVG —
  // no chart library dependency for a 5-point trendline.
  const sparkAudits = (() => {
    if (latestHost) {
      const sameHost = audits.filter((a) => {
        try { return new URL(a.url).hostname === latestHost; } catch { return false; }
      });
      if (sameHost.length >= 2) return sameHost.slice(0, 5).reverse();
    }
    return audits.slice(0, 5).reverse();
  })();
  const sparkValues = sparkAudits.map((a) => Math.round(a.geoScore));
  const sparkMin = Math.min(...sparkValues, 0);
  const sparkMax = Math.max(...sparkValues, 100);
  const sparkRange = sparkMax - sparkMin || 1;
  const sparkPath = sparkValues.length >= 2
    ? sparkValues.map((v, i) => {
        const x = (i / (sparkValues.length - 1)) * 100;
        const y = 30 - ((v - sparkMin) / sparkRange) * 28;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(" ")
    : null;

  const DeltaIcon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta == null || delta === 0
    ? "text-muted-foreground"
    : delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400";

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-600" /> Your AEO journey
        </CardTitle>
        <CardDescription className="text-xs">
          {latestHost ? `Tracking ${latestHost}` : "Latest audit"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-bold tabular-nums">{currScore}<span className="text-base text-muted-foreground font-normal">/100</span></div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Current AEO score</div>
            </div>
            {delta != null && (
              <div className={`flex items-center gap-1 text-sm font-semibold ${deltaColor}`}>
                <DeltaIcon className="h-4 w-4" />
                {delta > 0 ? `+${delta}` : delta}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  vs prior {priorScore != null ? `(${priorScore})` : ""}
                </span>
              </div>
            )}
          </div>
          {sparkPath && (
            <svg viewBox="0 0 100 30" className="h-10 w-32 overflow-visible" preserveAspectRatio="none" aria-hidden="true">
              <path d={sparkPath} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {sparkValues.map((v, i) => {
                const x = (i / (sparkValues.length - 1)) * 100;
                const y = 30 - ((v - sparkMin) / sparkRange) * 28;
                return <circle key={i} cx={x} cy={y} r="1.5" className="fill-emerald-500" vectorEffect="non-scaling-stroke" />;
              })}
            </svg>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/results/${latest.id}`}>
            <Button size="sm" variant="outline" className="border-emerald-500/30 hover:bg-emerald-500/10">
              Open latest audit <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href={`/simulate/${latest.id}`}>
            <Button size="sm" variant="outline" className="border-violet-500/30 hover:bg-violet-500/10 text-violet-700 dark:text-violet-400">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Simulate AI responses
            </Button>
          </Link>
        </div>

        {/* Free-only: compact "what Pro unlocks for YOUR site" preview row.
            Three locked-state tiles tied to features the user has already
            seen referenced (multi-engine simulation, Fix Generator,
            competitor citation gaps). Each tile communicates the value
            specifically — not as an abstract feature list. */}
        {isFree && (
          <div className="pt-4 border-t border-emerald-500/10">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Pro unlocks for {latestHost || "this site"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Link href="/pricing">
                <div className="rounded-lg border border-dashed border-muted-foreground/20 p-3 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors cursor-pointer h-full">
                  <div className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-emerald-600" /> All 4 engines
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug">Gemini answers 40% of Google searches with AI now. Find out if it names you.</div>
                </div>
              </Link>
              <Link href="/pricing">
                <div className="rounded-lg border border-dashed border-muted-foreground/20 p-3 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors cursor-pointer h-full">
                  <div className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-emerald-600" /> Fix Generator
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug">Auto-draft JSON-LD and citation-bot robots.txt rules. Copy and ship.</div>
                </div>
              </Link>
              <Link href="/pricing">
                <div className="rounded-lg border border-dashed border-muted-foreground/20 p-3 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors cursor-pointer h-full">
                  <div className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-emerald-600" /> Competitor gaps
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug">Find which rivals AI engines cite instead of you, and why.</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Curated set of practitioner AEO/GEO tips. Each one is a qualitative,
// widely-accepted strategy — NO invented numbers, NO fabricated stats. The
// library is intentionally small (one tip per day-of-year rotation) so each
// surface is sharp and re-reading is fine. If you add or reorder entries,
// the rotation index is stable per-day, so users see the same tip across
// page-loads on the same UTC day.
const AEO_TIPS: Array<{ icon: string; title: string; body: string }> = [
  {
    icon: "🤖",
    title: "Verify AI crawlers can reach you",
    body: "GPTBot, ClaudeBot, PerplexityBot, and Google-Extended each obey robots.txt. A single overly-broad Disallow can hide your whole site from AI search. View your robots.txt and explicitly Allow these user-agents on the paths that matter.",
  },
  {
    icon: "📄",
    title: "Keep llms.txt optional",
    body: "Crawler-log evidence shows llms.txt is rarely requested and no major answer engine treats it as a citation gate. Spend effort on fresh, server-visible content, citation-path bot access, and clear entity schema first.",
  },
  {
    icon: "❓",
    title: "Add FAQPage JSON-LD to high-intent pages",
    body: "AI answer engines lift FAQ markup directly into responses. Pick your top product or pricing page, write 5–8 questions in your customers' actual phrasing, and wrap them in FAQPage schema. The format is dead simple and the leverage is large.",
  },
  {
    icon: "📝",
    title: "Lead with the answer, not the build-up",
    body: "AI engines extract paragraphs that resolve a question in 2–3 sentences. Audit your top pages: does the first paragraph after each H2 directly answer the heading? If it sets up context first, rewrite it to lead with the answer.",
  },
  {
    icon: "🏷️",
    title: "Disambiguate your brand entity",
    body: "If your brand name is a common word (or shares a name with anything else), AI engines may confuse you with someone else. Add Organization JSON-LD with sameAs links to your Wikipedia, LinkedIn, Crunchbase, and X profiles to anchor the entity.",
  },
  {
    icon: "📌",
    title: "Make your brand facts easy to repeat",
    body: "On your homepage, About page, and key product pages, plainly state who you are, what you do, who you help, the problem you solve, and your specialty. A useful starting point: “[Brand] is a [category] for [customer], helping them [solve problem] through [differentiator].” Keep the facts consistent across the pages and profiles you control.",
  },
  {
    icon: "⚡",
    title: "Make sure your content survives without JS",
    body: "Most AI crawlers do not execute JavaScript reliably. Right-click → View Source on your top page. If the body is mostly empty divs, your content is invisible to AI. Server-side render or pre-render at least the first viewport's content.",
  },
  {
    icon: "🔗",
    title: "Earn citations from sources LLMs already trust",
    body: "AI engines weight sources their training data already knows. A mention on Wikipedia, a respected industry trade publication, or a well-cited research paper does more for AI visibility than ten link-farm backlinks ever will.",
  },
  {
    icon: "📰",
    title: "Keep your About page boring and factual",
    body: "AI engines pull company facts from About pages: founders, founding year, HQ location, headcount range, what you do. Make them findable in plain text on a single page, not buried in a video or an interactive timeline.",
  },
  {
    icon: "🎯",
    title: "Optimize for attribution, not just traffic",
    body: "If an AI overview quotes your data without naming your brand, you've been mined, not cited. Use clear entity markup, FAQPage schema, and quotable summaries so LLMs attribute the insight to you rather than summarizing it anonymously.",
  },
  {
    icon: "🔓",
    title: "Don't gate the research AI needs to cite you",
    body: "A white paper behind a form wall earns nothing from AI discovery. If you have original data or research, publish a crawlable version. AI credits whoever it can read, not whoever wrote the original.",
  },
  {
    icon: "🤝",
    title: "Treat robots.txt as a strategic decision",
    body: "OAI-SearchBot powers real-time ChatGPT citations. GPTBot feeds model training data. They are different bots with different consequences. Most sites have never made a deliberate choice about which to allow. Make one.",
  },
  {
    icon: "💬",
    title: "Build presence where LLMs were trained",
    body: "LLMs are trained heavily on Reddit, Wikipedia, and YouTube. Your absence from those platforms is not neutral. It creates a gap that competitors or critics will fill. Earned presence in these communities shapes what AI says about you before any crawler visits your site.",
  },
];

// Curated external resources. ONLY include stable, authoritative URLs from
// publishers we'd be comfortable being seen alongside. No paid blogs, no
// affiliate links, no rotating "best of" lists. If a URL ever 404s, swap
// it for a stable doc-root from the same publisher rather than a workaround.
const TRUSTED_RESOURCES: Array<{ source: string; title: string; description: string; url: string }> = [
  {
    source: "Google Search Central",
    title: "AI features & your website",
    description: "Google's official guidance on how AI Overviews surface and cite content. The canonical reference.",
    url: "https://developers.google.com/search/docs/appearance/ai-features",
  },
  {
    source: "OpenAI",
    title: "Search & GPTBot crawler docs",
    description: "How ChatGPT search retrieves and cites pages, plus the GPTBot user-agent spec for your robots.txt.",
    url: "https://platform.openai.com/docs/bots",
  },
  {
    source: "Anthropic",
    title: "ClaudeBot & web search",
    description: "Anthropic's docs on how Claude reaches the open web and which user-agents to allow.",
    url: "https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/web-search-tool",
  },
  {
    source: "Schema.org",
    title: "Full vocabulary reference",
    description: "Authoritative source for every schema type AI engines parse — FAQPage, Organization, Product, HowTo, and more.",
    url: "https://schema.org/docs/schemas.html",
  },
  {
    source: "Search Engine Land",
    title: "AI visibility starts before search ends with citations",
    description: "How entity signals, community presence, and original data determine who AI systems cite — and why adding more content is rarely the first fix.",
    url: "https://searchengineland.com/ai-visibility-starts-before-search-ends-with-citations-476308",
  },
  {
    source: "Aleyda Solis",
    title: "LearningSEO — AI search resources",
    description: "Curated, vendor-neutral reading list maintained by one of SEO's most respected practitioners.",
    url: "https://www.learningseo.io/",
  },
];

// Quick wins users can do RIGHT NOW without running an audit. Drives
// engagement on the empty-state dashboard and gives returning users
// a checklist they can come back to between re-audits. All actions are
// concrete and verifiable on the user's own site.
const QUICK_WINS: string[] = [
  "Open your robots.txt and confirm it doesn't block GPTBot, ClaudeBot, PerplexityBot, or Google-Extended.",
  "View Source on your homepage. Your value prop and key claims should appear in the raw HTML, not after a JS render.",
  "Add FAQPage JSON-LD to your single highest-traffic page first. Validate with Google's Rich Results Test.",
  "Treat llms.txt as an optional content map after citation-critical work is complete.",
  "Add Organization schema with sameAs links to your Wikipedia, LinkedIn, Crunchbase, and X profiles.",
  "Check whether your best original data or research is behind a form or paywall. AI credits whoever it can read, not whoever wrote it. Publish a crawlable version.",
  "Search your brand name on Reddit and Wikipedia right now. LLM training data draws heavily from both. A gap there is a gap in how AI describes you.",
];

// Companion learning surface to the journey card. The dashboard, even for
// users with audit history, is too utilitarian on its own — this section
// gives them something to read, do, and click into between audits, and
// gives empty-state users an actual reason to return tomorrow.
function DashboardLearningHub() {
  // Stable per-UTC-day rotation. Index doesn't shift across page-loads on
  // the same day, so users aren't disoriented by the tip changing under them.
  const todayTip = React.useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 1)) / 86_400_000);
    return AEO_TIPS[dayOfYear % AEO_TIPS.length];
  }, []);

  return (
    <div className="space-y-6">
      {/* Daily tip — single, focused, scannable. The icon + title alone
          should communicate the actionable takeaway in <2 seconds. */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
            Today's AEO play
          </div>
          <CardTitle className="text-lg flex items-center gap-2 mt-1">
            <span aria-hidden="true">{todayTip.icon}</span>
            <span>{todayTip.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{todayTip.body}</p>
        </CardContent>
      </Card>

      {/* Trusted resources — externally credible and stable. We deliberately
          surface SOURCE first, then title, so users recognise the publisher
          (Google, OpenAI, Anthropic) before deciding to click. */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            From the source
          </h2>
          <p className="text-xs text-muted-foreground hidden sm:block">High-authority AEO references</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TRUSTED_RESOURCES.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg border bg-card p-4 hover:border-emerald-500/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                    {r.source}
                  </div>
                  <div className="text-sm font-medium mt-0.5 truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">{r.description}</div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600 flex-shrink-0 mt-0.5" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Authority signals — off-site moves that AI engines weight heavily
          (Linkby paid placements, HARO, podcasts, Wikipedia, Reddit, YouTube).
          Lives in the hub because these are evergreen recommendations,
          not audit-derived. */}
      <AuthoritySignalsCard />

      {/* Quick wins checklist — concrete, ungated by an audit. Every item
          is something a competent operator can do today on their own site. */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Quick wins (no audit required)
          </CardTitle>
          <CardDescription className="text-xs">
            {QUICK_WINS.length} things you can ship today that move every AEO score we measure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {QUICK_WINS.map((win, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {i + 1}
                </div>
                <span className="text-muted-foreground leading-relaxed">{win}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

const WHATS_NEW_COUNT = 3;

function WhatsNewCard() {
  const recent = CHANGELOG.slice(0, WHATS_NEW_COUNT);
  const BADGE_COLORS: Record<string, string> = {
    New: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    Improvement: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    Research: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    Performance: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    Fix: "bg-red-500/10 text-red-700 dark:text-red-400",
  };
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-emerald-600" />
            What's new
          </CardTitle>
          <Link href="/changelog" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            See all updates <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recent.map((entry, i) => {
          const Icon = entry.icon;
          const badgeClass = BADGE_COLORS[entry.badge] ?? BADGE_COLORS["New"];
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
                    {entry.badge}
                  </span>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                <p className="text-sm font-medium leading-snug">{entry.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{entry.summary}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SignedInDashboard() {
  const pendingAuditUrl = React.useRef(localStorage.getItem("pendingAuditUrl") || "");
  const autoAuditStarted = React.useRef(false);
  const [url, setUrl] = React.useState(() => pendingAuditUrl.current);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const firstName = user?.firstName;

  const { data: audits, isLoading: auditsLoading, isError: auditsError, refetch: refetchAudits } = useListAudits();
  const analyzeUrl = useAnalyzeUrl();
  const queryClient = useQueryClient();
  const { storedPlan, trialActive, isLoading: planLoading } = usePlan();
  const hasPaidPlan = storedPlan === "pro" || storedPlan === "agency";
  const canUseMonitoring = hasMonitoringAccess(storedPlan, trialActive);
  const latestAudit = audits?.[0];
  const latestDomain = (() => {
    if (!latestAudit?.url) return null;
    try {
      return new URL(/^https?:\/\//i.test(latestAudit.url) ? latestAudit.url : `https://${latestAudit.url}`).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();

  const googleStatus = useQuery<{
    configured: boolean;
    connected: boolean;
    searchConsoleGranted: boolean;
    propertyId: string | null;
  }>({
    queryKey: ["google", "status"],
    queryFn: () => customFetch("/api/integrations/google/status"),
    enabled: hasPaidPlan,
    retry: false,
  });

  const monitoredSites = useQuery<{ sites: Array<{ id: number; active: boolean }> }>({
    queryKey: ["geo", "monitored-sites"],
    queryFn: () => customFetch("/api/geo/monitored-sites"),
    enabled: canUseMonitoring,
    retry: false,
  });

  const seoKeywords = useQuery<{ targets: Array<{ id: number; active: boolean }>; providerConfigured: boolean }>({
    queryKey: ["seo-keywords", latestDomain],
    queryFn: () => customFetch(`/api/seo/keywords?domain=${encodeURIComponent(latestDomain!)}`),
    enabled: hasPaidPlan && Boolean(latestDomain),
    retry: false,
  });
  const { data: latestAuditDetails } = useGetAudit(latestAudit?.id ?? 0, {
    query: {
      queryKey: getGetAuditQueryKey(latestAudit?.id ?? 0),
      enabled: Boolean(latestAudit?.id),
      staleTime: 60_000,
      retry: false,
    },
  });
  const recommendationProgress = useQuery<{ completed: Array<{ recommendationId: string }> }>({
    queryKey: ["recommendation-progress", latestDomain],
    queryFn: () => customFetch(`/api/geo/recommendation-progress?domain=${encodeURIComponent(latestDomain!)}`),
    enabled: Boolean(latestDomain && latestAuditDetails?.recommendations?.length),
    staleTime: 30_000,
    retry: false,
  });


  // Post-checkout success handling. Stripe redirects successful upgrades to
  // `/?checkout=success` so users land on their dashboard (where they can
  // immediately use what they just paid for) instead of back on /pricing.
  // We invalidate the plan/me/subscription queries so the new entitlement
  // shows up without a manual refresh, fire a confirmation toast, then strip
  // the query param so a refresh doesn't re-trigger the toast.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;
    const refreshBillingState = () => {
      queryClient.invalidateQueries({ queryKey: ["me", "plan"] });
      queryClient.invalidateQueries({ queryKey: ["stripe", "subscription"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    };
    refreshBillingState();
    const refreshTimers = [1500, 4000, 8000].map((delay) => window.setTimeout(refreshBillingState, delay));
    toast({
      title: "Payment received",
      description: "Stripe is confirming your subscription. Your upgraded plan will appear shortly.",
    });
    setLocation("/", { replace: true });
    return () => refreshTimers.forEach((timer) => window.clearTimeout(timer));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function runAudit(rawUrl: string, source: "dashboard_manual" | "post_signup_landing") {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;
    let normalized = trimmed;
    if (!/^https?:\/\//.test(normalized)) normalized = "https://" + normalized;
    try {
      const parsed = new URL(normalized);
      if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname.includes(".")) throw new Error("Invalid URL");
      normalized = parsed.toString();
    } catch {
      toast({
        title: "Enter a valid website URL",
        description: "Use a publicly reachable address, such as https://example.com.",
        variant: "destructive",
      });
      return;
    }
    trackEvent("audit_started", { source });
    analyzeUrl.mutate({ data: { url: normalized } }, {
      onSuccess: (data: any) => {
        trackEvent("audit_completed", { source });
        if (!localStorage.getItem("aeo.activationConverted")) {
          localStorage.setItem("aeo.activationConverted", "true");
          trackGoogleAdsConversion("activation");
        }
        setLocation(`/results/${data.id}`);
      },
      onError: (err: unknown) => {
        toast({
          title: "Audit failed",
          description: apiErrorMessage(err, "Could not analyze this URL. Check it's accessible and try again."),
          variant: "destructive",
        });
      },
    });
  }

  React.useEffect(() => {
    if (!pendingAuditUrl.current || autoAuditStarted.current) return;
    autoAuditStarted.current = true;
    localStorage.removeItem("pendingAuditUrl");
    runAudit(pendingAuditUrl.current, "post_signup_landing");
  }, []); // A saved landing-page audit should run once after authentication.

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runAudit(url, "dashboard_manual");
  }

  const greeting = firstName ? `Welcome back, ${firstName}` : "Welcome back";
  const hasAudit = Boolean(latestAudit);
  const googleConnected = Boolean(
    googleStatus.data?.connected && googleStatus.data?.searchConsoleGranted && googleStatus.data?.propertyId,
  );
  const monitoringActive = Boolean(monitoredSites.data?.sites?.some((site) => site.active));
  const rankTrackingActive = Boolean(seoKeywords.data?.targets?.some((target) => target.active));
  const confirmedSteps = [hasAudit, googleConnected, rankTrackingActive, monitoringActive];
  const confirmedCount = confirmedSteps.filter(Boolean).length;
  const completedRecommendationIds = new Set((recommendationProgress.data?.completed ?? []).map((item) => item.recommendationId));
  const nextRecommendation = latestAuditDetails?.recommendations?.find((item) => item.id && !completedRecommendationIds.has(item.id));
  const activeKeywordCount = seoKeywords.data?.targets?.filter((target) => target.active).length ?? 0;
  const activeSiteCount = monitoredSites.data?.sites?.filter((site) => site.active).length ?? 0;
  const programStateLoading = planLoading
    || auditsLoading
    || (hasPaidPlan && (googleStatus.isLoading || (Boolean(latestDomain) && seoKeywords.isLoading)))
    || (canUseMonitoring && monitoredSites.isLoading);
  const setupComplete = !planLoading && hasPaidPlan && confirmedCount === 4;

  const StepIcon = ({ complete, number }: { complete: boolean; number: number }) => complete ? (
    <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" />
  ) : (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-600">
      {number}
    </span>
  );

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14 space-y-10">
      {programStateLoading ? (
        <Card className="overflow-hidden border-emerald-500/20" aria-label="Loading your SEO and GEO program">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardContent className="space-y-4 py-8">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          </CardContent>
        </Card>
      ) : setupComplete ? (
        <Card className="overflow-hidden border-emerald-500/30 shadow-lg shadow-emerald-500/5">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardHeader className="pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">This week's plan</p>
            <CardTitle className="text-2xl md:text-3xl">Make one improvement, then measure it</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">Your SEO and GEO tracking is active. Focus on the next unfinished recommendation, then use the same audit and keyword views to see what changes over time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Recommended next task</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{nextRecommendation?.title ?? "Re-scan your site and choose the next opportunity"}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{nextRecommendation?.detail ?? "You have completed the current action list. Run a fresh audit after your latest site changes to build the next plan."}</p>
              <Link href={nextRecommendation ? `/results/${latestAudit!.id}#recommendations` : `/results/${latestAudit!.id}`}>
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">{nextRecommendation ? "Open this task" : "Re-scan and review"}<ArrowRight className="ml-1.5 h-4 w-4" /></Button>
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link href={`/results/${latestAudit!.id}`} className="rounded-lg border bg-white p-3 hover:border-emerald-300 hover:bg-emerald-50/30">
                <p className="text-xs text-muted-foreground">Latest audit</p>
                <p className="mt-1 font-semibold">{Math.round(latestAudit!.geoScore)}/100</p>
                <p className="mt-1 text-xs font-medium text-emerald-700">Review action plan</p>
              </Link>
              <Link href={`/results/${latestAudit!.id}#seo-opportunities`} className="rounded-lg border bg-white p-3 hover:border-emerald-300 hover:bg-emerald-50/30">
                <p className="text-xs text-muted-foreground">Rank tracking</p>
                <p className="mt-1 font-semibold">{activeKeywordCount} active keyword{activeKeywordCount === 1 ? "" : "s"}</p>
                <p className="mt-1 text-xs font-medium text-emerald-700">View SEO movement</p>
              </Link>
              <Link href="/projects" className="rounded-lg border bg-white p-3 hover:border-emerald-300 hover:bg-emerald-50/30">
                <p className="text-xs text-muted-foreground">Monitoring</p>
                <p className="mt-1 font-semibold">{activeSiteCount} active site{activeSiteCount === 1 ? "" : "s"}</p>
                <p className="mt-1 text-xs font-medium text-emerald-700">Check measurement</p>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Link href={`/simulate/${latestAudit!.id}`}><Button size="sm" variant="outline"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Test AI visibility</Button></Link>
              <Link href="/recommended-tools"><Button size="sm" variant="ghost">Browse recommended tools</Button></Link>
            </div>
          </CardContent>
        </Card>
      ) : (
      <Card className="overflow-hidden border-emerald-500/30 shadow-lg shadow-emerald-500/5">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardHeader className="space-y-4 pb-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Program setup</p>
            <CardTitle className="text-2xl md:text-3xl">{hasAudit ? "Keep your SEO + GEO program moving" : `${greeting}. Activate your SEO + GEO program.`}</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">
              {hasAudit
                ? "Your baseline is ready. Complete the next steps so we can measure performance, watch for changes, and keep your action plan current."
                : "Start with your website. We will build the baseline, identify the most valuable improvements, and guide you through measurement and ongoing monitoring."}
            </CardDescription>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{confirmedCount} of 4 setup steps complete</span>
              <span>{Math.round((confirmedCount / 4) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${(confirmedCount / 4) * 100}%` }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={`rounded-xl border p-4 ${hasAudit ? "border-emerald-200 bg-emerald-50/60" : "border-emerald-500/40 bg-emerald-50"}`}>
            <div className="flex items-start gap-3">
              <StepIcon complete={hasAudit} number={1} />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="font-semibold">Create your SEO + GEO baseline</p>
                  <p className="text-sm text-muted-foreground">Audit the site you want to improve. This unlocks your prioritized action plan and AI visibility tests.</p>
                </div>
                {!hasAudit ? (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        aria-label="Website URL to audit"
                        className="h-11 pl-10 text-base"
                        placeholder="https://yourwebsite.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={analyzeUrl.isPending}
                      />
                    </div>
                    <Button type="submit" size="lg" disabled={analyzeUrl.isPending || !url.trim()} className="h-11 bg-emerald-600 px-6 hover:bg-emerald-700">
                      {analyzeUrl.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Run my baseline <ArrowRight className="ml-1 h-4 w-4" /></>}
                    </Button>
                  </form>
                ) : (
                  <Link href={`/results/${latestAudit!.id}`}>
                    <Button size="sm" variant="outline">Open my action plan <ArrowRight className="ml-1 h-4 w-4" /></Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-4 ${googleConnected ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200"}`}>
            <div className="flex items-start gap-3">
              <StepIcon complete={googleConnected} number={2} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Connect Google measurement</p>
                <p className="text-sm text-muted-foreground">Add Search Console and GA4 so recommendations use real queries, clicks, rankings, and AI referral traffic.</p>
                <div className="mt-3">
                  {googleConnected ? (
                    <p className="text-xs font-semibold text-emerald-700">Search Console and GA4 are connected</p>
                  ) : hasPaidPlan ? (
                    <Link href="/projects"><Button size="sm" variant="outline">Connect Google</Button></Link>
                  ) : (
                    <Link href="/upgrade?source=program-setup"><Button size="sm" variant="outline"><Lock className="mr-1.5 h-3.5 w-3.5" />Activate with a paid plan</Button></Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-4 ${rankTrackingActive ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200"}`}>
            <div className="flex items-start gap-3">
              <StepIcon complete={rankTrackingActive} number={3} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Track the searches that matter</p>
                <p className="text-sm text-muted-foreground">Choose your priority keywords, location, device, and landing page. Weekly DataForSEO snapshots show movement from your baseline.</p>
                <div className="mt-3">
                  {rankTrackingActive ? (
                    <p className="text-xs font-semibold text-emerald-700">Keyword rank tracking is active</p>
                  ) : hasPaidPlan && hasAudit ? (
                    <Link href={`/results/${latestAudit!.id}`}><Button size="sm" variant="outline">Choose tracked keywords</Button></Link>
                  ) : hasPaidPlan ? (
                    <p className="text-xs font-medium text-slate-500">Run your baseline audit first</p>
                  ) : (
                    <Link href="/upgrade?source=rank-tracking-setup"><Button size="sm" variant="outline"><Lock className="mr-1.5 h-3.5 w-3.5" />Upgrade for SEO rank tracking</Button></Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-4 ${monitoringActive ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200"}`}>
            <div className="flex items-start gap-3">
              <StepIcon complete={monitoringActive} number={4} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Turn on ongoing monitoring</p>
                <p className="text-sm text-muted-foreground">Choose the site and weekly cadence. We will preserve the baseline and surface meaningful SEO or GEO changes.</p>
                <div className="mt-3">
                  {monitoringActive ? (
                    <p className="text-xs font-semibold text-emerald-700">Weekly monitoring is active</p>
                  ) : canUseMonitoring ? (
                    <Link href="/projects"><Button size="sm" variant="outline">Set up monitoring</Button></Link>
                  ) : (
                    <p className="text-xs font-medium text-slate-500">Available after upgrade</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!hasPaidPlan && (
            <div className="rounded-xl bg-slate-950 p-4 text-white sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="font-semibold">{trialActive ? "Keep your monitoring and activate connected SEO tracking" : "Unlock the complete SEO growth system"}</p>
                <p className="mt-1 text-sm text-slate-300">
                  {trialActive
                    ? "Your trial includes monitoring now. Pro keeps it active and adds Search Console, GA4, and DataForSEO rank tracking."
                    : "Pro adds Search Console insights, GA4 reporting, DataForSEO rank tracking, and scheduled monitoring."}
                </p>
              </div>
              <Link href="/upgrade?source=program-setup-summary">
                <Button size="sm" className="mt-3 shrink-0 bg-emerald-500 text-slate-950 hover:bg-emerald-400 sm:mt-0">Compare paid plans</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {analyzeUrl.isPending && <AnalysisProgress />}

      {!analyzeUrl.isPending && audits && audits.length > 0 && (
        <AeoJourneyCard audits={audits} />
      )}

      {!analyzeUrl.isPending && (auditsLoading || auditsError || (audits && audits.length > 0)) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent audits</h2>
          {auditsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : auditsError ? (
            <Card className="border-destructive/40">
              <CardContent className="py-8 text-center space-y-3">
                <p className="text-muted-foreground">We couldn't load your recent audits. They're still saved.</p>
                <Button variant="outline" size="sm" onClick={() => refetchAudits()}>Retry</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {(audits ?? []).map((audit: any) => (
                <Link key={audit.id} href={`/results/${audit.id}`}>
                  <Card className="cursor-pointer hover:border-emerald-500/30 hover:shadow-md transition-all">
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate">{canonicalDisplayUrl(audit.url)}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(audit.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <ScoreBadge score={Math.round(audit.geoScore)} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { isSignedIn } = useAuth();

  return <>
    <SEO
      title="AEO Improvement | Guided SEO and AI Search Optimization"
      description="Audit your website for SEO, GEO, and AI search visibility. Find the next technical and content improvement, test buyer prompts, and track progress from one guided workspace."
      path="/"
    />
    {isSignedIn ? <SignedInDashboard /> : <SignedOutLanding />}
  </>;
}
