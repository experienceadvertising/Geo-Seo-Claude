import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  CheckCircle2,
  Zap,
  Building2,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Loader2,
  ArrowRight,
  Bot,
  FileCode2,
  BarChart3,
  Eye,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { useStripeProducts, useStripeSubscription, useCheckout, useCustomerPortal } from "@/hooks/useStripe";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";

/**
 * Conversion-focused upgrade landing page. The destination for every
 * upsell CTA in the lifecycle emails (approaching-limit, what-you-missed,
 * limit-reached, weekly-insights). Distinct from /pricing which is a
 * generic three-tier comparison — this page is "you, specifically, are
 * about to benefit from Pro" with live usage data and source-aware copy.
 *
 * Source-aware via ?source= query param. Each source rewrites the hero
 * to acknowledge WHY the user clicked through, dramatically lifting
 * intent vs a generic pricing page.
 */

type Source =
  | "approaching-audits"
  | "approaching-simulations"
  | "limit-reached-audits"
  | "limit-reached-simulations"
  | "what-you-missed"
  | "weekly-insights"
  | "first-audit"
  | "score-changed"
  | "welcome-d7"
  | "trial-banner"
  | "trial-ending"
  | "trial-ended"
  | null;

interface HeroContent {
  badge: string;
  badgeTone: "amber" | "rose" | "emerald" | "indigo";
  headline: string;
  subhead: string;
  showUsage: boolean;
}

function buildHero(
  source: Source,
  isFree: boolean,
  trial?: { active: boolean; endsAt?: string },
): HeroContent {
  // For paid users landing here from a stale email link, soften everything
  // and just thank them for being a customer.
  if (!isFree) {
    return {
      badge: "You're already on a paid plan",
      badgeTone: "emerald",
      headline: "Thanks for being a subscriber",
      subhead: "Manage your billing or change plan from the pricing page.",
      showUsage: false,
    };
  }

  // Mid-trial: they already have every core product feature, so "upgrade to unlock" copy
  // would read as if we don't know that. The pitch is continuity instead.
  if (trial?.active) {
    const endDate = trial.endsAt
      ? new Date(trial.endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })
      : null;
    const daysLeft = trial.endsAt
      ? Math.max(0, Math.ceil((new Date(trial.endsAt).getTime() - Date.now()) / 86_400_000))
      : null;
    if (source === "trial-ending" || (daysLeft !== null && daysLeft <= 5)) {
      return {
        badge: endDate ? `Guided trial ends ${endDate}` : "Guided trial ending soon",
        badgeTone: "amber",
        headline: "Choose how you want to keep improving",
        subhead:
          "Starter keeps guided SEO and GEO improvements plus the Fix Generator. Pro keeps the full multi-engine, Google-data, and monitoring workflow.",
        showUsage: false,
      };
    }
    return {
      badge: endDate ? `30-day guided trial · until ${endDate}` : "30-day guided trial",
      badgeTone: "emerald",
      headline: "Build your baseline, then activate connected SEO tracking",
      subhead:
        "Use the audit, all four AI engines, the Fix Generator, and competitor analysis during your trial. Pro activates Search Console, GA4, DataForSEO rankings, and scheduled monitoring. Nothing is charged automatically.",
      showUsage: false,
    };
  }

  switch (source) {
    case "trial-ended":
      return {
        badge: "Your free month has ended",
        badgeTone: "rose",
        headline: "Get everything back in one click",
        subhead:
          "Last month you had all 4 AI engines, the Fix Generator, monitoring, and competitor tracking. Pro turns it all back on — your history and settings are exactly where you left them.",
        showUsage: true,
      };
    case "approaching-audits":
      return {
        badge: "1 audit left this month",
        badgeTone: "amber",
        headline: "Don't pause your AEO work over a counter",
        subhead:
          "You've nearly used your free monthly audits. Pro lifts the cap so you can keep iterating while results are still fresh in your head.",
        showUsage: true,
      };
    case "approaching-simulations":
      return {
        badge: "1 simulation left this month",
        badgeTone: "amber",
        headline: "Run prompt simulations against every engine",
        subhead:
          "Free covers ChatGPT only with 3 prompts. Pro runs 25 prompts across all 4 engines so you actually see where you're cited.",
        showUsage: true,
      };
    case "limit-reached-audits":
      return {
        badge: "Monthly audit cap reached",
        badgeTone: "rose",
        headline: "Keep auditing today. Quota refills next month.",
        subhead:
          "You hit your free monthly audit cap. Upgrade to Pro to lift it to 100 audits/mo and unlock everything below.",
        showUsage: true,
      };
    case "limit-reached-simulations":
      return {
        badge: "Monthly simulation cap reached",
        badgeTone: "rose",
        headline: "Keep simulating today. Quota refills next month.",
        subhead:
          "You hit your free monthly simulation cap. Upgrade to Pro for 30 simulations/mo across all 4 AI engines.",
        showUsage: true,
      };
    case "what-you-missed":
      return {
        badge: "Your audit, on Pro",
        badgeTone: "indigo",
        headline: "See your site through every AI engine",
        subhead:
          "You ran an audit against ChatGPT. Here's what the same audit returns when you also see Claude, Gemini, and Perplexity, plus the Fix Generator output for your site.",
        showUsage: false,
      };
    case "weekly-insights":
      return {
        badge: "From your weekly insights",
        badgeTone: "indigo",
        headline: "Turn this week's insight into action",
        subhead:
          "Pro unlocks the full toolkit: all 4 engines, deployable JSON-LD and citation-bot robots.txt fixes, and competitor citation tracking.",
        showUsage: false,
      };
    case "first-audit":
      return {
        badge: "You ran your first audit",
        badgeTone: "emerald",
        headline: "Ready to go deeper?",
        subhead:
          "Your free audit shows you a score and recommendations. Pro shows you whether you're cited across all four major AI engines, plus auto-drafts the fixes.",
        showUsage: false,
      };
    case "score-changed":
      return {
        badge: "Your score moved",
        badgeTone: "indigo",
        headline: "Track every change across every engine",
        subhead:
          "You're already iterating on your AEO. Pro multiplies your visibility: 4 engines instead of 1, and a year of trend history instead of 30 days.",
        showUsage: false,
      };
    default:
      return {
        badge: "Upgrade to Pro",
        badgeTone: "emerald",
        headline: "Rank in AI answers, not just search",
        subhead:
          "Unlock all 4 AI engines, the Fix Generator, and competitor citation tracking. Cancel anytime.",
        showUsage: true,
      };
  }
}

interface BenefitRow {
  icon: React.ReactNode;
  title: string;
  free: string;
  starter: string;
  pro: string;
}

const BENEFITS: BenefitRow[] = [
  {
    icon: <Bot className="h-5 w-5 text-emerald-600" />,
    title: "AI engines tested",
    free: "ChatGPT only",
    starter: "ChatGPT only",
    pro: "ChatGPT + Claude + Gemini + Perplexity",
  },
  {
    icon: <Target className="h-5 w-5 text-emerald-600" />,
    title: "Prompts per simulation",
    free: "3 prompts",
    starter: "3 prompts",
    pro: "25 prompts",
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
    title: "Monthly audits",
    free: "5 / month",
    starter: "15 / month",
    pro: "100 / month",
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-emerald-600" />,
    title: "Monthly simulations",
    free: "2 / month",
    starter: "5 / month",
    pro: "30 / month",
  },
  {
    icon: <FileCode2 className="h-5 w-5 text-emerald-600" />,
    title: "Fix Generator",
    free: "—",
    starter: "Auto-drafts JSON-LD and crawler fixes",
    pro: "Auto-drafts JSON-LD and crawler fixes",
  },
  {
    icon: <Eye className="h-5 w-5 text-emerald-600" />,
    title: "Competitor citation tracking",
    free: "—",
    starter: "—",
    pro: "Side-by-side citation gap table",
  },
  {
    icon: <Sparkles className="h-5 w-5 text-emerald-600" />,
    title: "Sentiment & tone analysis",
    free: "—",
    starter: "—",
    pro: "Per-engine sentiment scoring",
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-emerald-600" />,
    title: "Audit history retained",
    free: "30 days",
    starter: "90 days",
    pro: "1 year",
  },
];

function formatPrice(unitAmount: number): string {
  return `$${(unitAmount / 100).toLocaleString("en-US")}`;
}

function getQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

const TONE_CLASSES: Record<HeroContent["badgeTone"], string> = {
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  rose: "bg-rose-100 text-rose-800 border-rose-200",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const SOURCE_ICON: Record<HeroContent["badgeTone"], React.ReactNode> = {
  amber: <AlertTriangle className="h-3.5 w-3.5" />,
  rose: <AlertTriangle className="h-3.5 w-3.5" />,
  emerald: <Sparkles className="h-3.5 w-3.5" />,
  indigo: <Sparkles className="h-3.5 w-3.5" />,
};

export default function UpgradePage() {
  const [, setLocation] = useLocation();
  const { isSignedIn, isLoaded } = useAuth();
  // storedPlan, not the effective plan: during the free core-feature first
  // month the effective plan is "agency", which would render the
  // "thanks for being a subscriber" hero to users who pay nothing.
  const { storedPlan, trialActive, trialEndsAt, usage, isLoading: planLoading } = usePlan();
  const isFree = storedPlan === "free";
  const { data: productsData, isLoading: productsLoading } = useStripeProducts();
  const { data: subData, isLoading: subscriptionLoading } = useStripeSubscription();
  const checkout = useCheckout();
  const portal = useCustomerPortal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const source = (getQueryParam("source") as Source) || null;
  const hero = useMemo(
    () => buildHero(source, isFree, { active: trialActive, endsAt: trialEndsAt }),
    [source, isFree, trialActive, trialEndsAt],
  );

  // Stripe redirect-back handling — same pattern as /pricing so users
  // landing here after checkout get a confirmation toast.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      queryClient.invalidateQueries({ queryKey: ["me", "plan"] });
      toast({
        title: "Payment received",
        description: "Stripe is confirming your subscription. Your upgraded plan will appear shortly.",
      });
      setLocation("/upgrade", { replace: true });
    } else if (params.get("checkout") === "cancel") {
      toast({
        title: "Checkout cancelled",
        description: "No charges were made. Feel free to try again.",
        variant: "destructive",
      });
      setLocation("/upgrade", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const products = productsData?.data ?? [];

  function getPriceForPlan(planId: string): { priceId: string; unitAmount: number } | null {
    const product = products.find((p) => p.metadata?.plan_id === planId);
    const monthlyPrice = product?.prices.find((pr) => pr.recurring?.interval === "month");
    if (!monthlyPrice) return null;
    return { priceId: monthlyPrice.id, unitAmount: monthlyPrice.unitAmount };
  }

  function handleUpgrade(planId: "starter" | "pro" | "agency") {
    if (!isSignedIn) {
      const next = `/upgrade${window.location.search}`;
      setLocation(`/sign-up?next=${encodeURIComponent(next)}`);
      return;
    }
    if (storedPlan !== "free" || subData?.canManageBilling) {
      portal.mutate();
      return;
    }
    const price = getPriceForPlan(planId);
    if (!price) {
      toast({
        title: "Pricing not available",
        description: "Our products are still syncing. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }
    checkout.mutate({ priceId: price.priceId, plan: planId });
  }

  const starterPrice = getPriceForPlan("starter");
  const proPrice = getPriceForPlan("pro");
  const agencyPrice = getPriceForPlan("agency");

  // Loading shell — show skeleton instead of hero flash so source-aware
  // copy doesn't briefly render with the wrong plan context.
  if (!isLoaded || planLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-14 px-4">
        <Helmet>
          <title>Upgrade — AEO Improvement</title>
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const auditsPct = usage.audits.cap > 0 ? Math.min(100, Math.round((usage.audits.used / usage.audits.cap) * 100)) : 0;
  const simsPct = usage.simulations.cap > 0 ? Math.min(100, Math.round((usage.simulations.used / usage.simulations.cap) * 100)) : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 bg-gradient-to-b from-slate-50/60 to-white">
      <Helmet>
        <title>Upgrade — AEO Improvement</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <Badge className={`${TONE_CLASSES[hero.badgeTone]} border px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5`}>
            {SOURCE_ICON[hero.badgeTone]}
            {hero.badge}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            {hero.headline}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {hero.subhead}
          </p>
        </div>

        {/* Live usage — only for free users on usage-driven sources */}
        {isFree && hero.showUsage && (
          <Card className="border-slate-200 bg-white">
            <CardContent className="pt-6 pb-6 space-y-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Your usage this month
              </div>
              <div className="space-y-4">
                <UsageBar label="Audits" used={usage.audits.used} cap={usage.audits.cap} pct={auditsPct} />
                <UsageBar label="Prompt simulations" used={usage.simulations.used} cap={usage.simulations.cap} pct={simsPct} />
              </div>
              <div className="text-xs text-slate-500 pt-1">
                Quotas refill on the 1st of every month. Upgrading to Pro lifts both caps immediately — no waiting.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Starter CTA card — lowest-friction path after a free trial */}
        <Card className="border-2 border-sky-400 shadow-lg shadow-sky-500/10 overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3 text-white text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Best for one site ready to improve
          </div>
          <CardContent className="pt-6 pb-6 space-y-5">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Starter</h2>
                <p className="text-sm text-slate-600 mt-1">Guided SEO and GEO improvements, implementation-ready fixes, and room to build momentum.</p>
              </div>
              <div className="flex items-end gap-1">
                {productsLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <>
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                      {starterPrice ? formatPrice(starterPrice.unitAmount) : "$29"}
                    </span>
                    <span className="text-slate-500 text-sm mb-1">/mo</span>
                  </>
                )}
              </div>
            </div>

            <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-sky-600 shrink-0" />15 audits and 5 ChatGPT simulations each month</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-sky-600 shrink-0" />Fix Generator for schema and crawler rules</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-sky-600 shrink-0" />Guided technical SEO and Content Effort actions</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-sky-600 shrink-0" />90-day audit history</li>
            </ul>

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-sky-600 to-cyan-600 hover:opacity-90 text-white border-0 text-base font-semibold py-6"
              onClick={() => handleUpgrade("starter")}
              disabled={checkout.isPending || portal.isPending || subscriptionLoading}
            >
              {checkout.isPending || portal.isPending || subscriptionLoading ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Opening billing…</>
              ) : (
                <>{storedPlan === "free" ? "Choose Starter" : "Manage plan"} <ArrowRight className="h-5 w-5 ml-2" /></>
              )}
            </Button>
            <div className="text-center text-xs text-slate-500">Cancel anytime · No setup fees · Secure checkout via Stripe</div>
          </CardContent>
        </Card>

        {/* Pro CTA card — for measurement and multi-engine visibility */}
        <Card className="border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-white text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" /> Full measurement and multi-engine visibility
          </div>
          <CardContent className="pt-6 pb-6 space-y-5">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Pro</h2>
                <p className="text-sm text-slate-600 mt-1">For marketers and SEO professionals who need Google data, rank tracking, monitoring, and all four AI engines.</p>
              </div>
              <div className="flex items-end gap-1">
                {productsLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <>
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                      {proPrice ? formatPrice(proPrice.unitAmount) : "$79"}
                    </span>
                    <span className="text-slate-500 text-sm mb-1">/mo</span>
                  </>
                )}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white border-0 text-base font-semibold py-6"
              onClick={() => handleUpgrade("pro")}
              disabled={checkout.isPending || portal.isPending || subscriptionLoading}
            >
              {checkout.isPending || portal.isPending || subscriptionLoading ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Opening billing…</>
              ) : (
                <>{storedPlan === "free" ? "Upgrade to Pro" : "Manage plan"} <ArrowRight className="h-5 w-5 ml-2" /></>
              )}
            </Button>

            <div className="text-center text-xs text-slate-500">
              Cancel anytime · No setup fees · Secure checkout via Stripe
            </div>
          </CardContent>
        </Card>

        {/* Benefits comparison — clear plan boundaries after a full-access trial */}
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-6 pb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-5">
              Choose the level that fits your workflow
            </div>
            <div className="hidden md:grid grid-cols-12 gap-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <div className="col-span-4">Feature</div>
              <div className="col-span-2">Free</div>
              <div className="col-span-3">Starter</div>
              <div className="col-span-3">Pro</div>
            </div>
            <div className="divide-y divide-slate-100">
              {BENEFITS.map((b) => (
                <div key={b.title} className="grid grid-cols-1 md:grid-cols-12 gap-3 py-3.5 items-center">
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      {b.icon}
                    </div>
                    <div className="font-medium text-slate-900 text-sm">{b.title}</div>
                  </div>
                  <div className="md:col-span-2 text-sm text-slate-500 md:pl-2">
                    <span className="md:hidden text-xs uppercase tracking-wider text-slate-400 mr-1.5">Free:</span>
                    {b.free}
                  </div>
                  <div className="md:col-span-3 text-sm text-sky-700 font-medium md:pl-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                    <span><span className="md:hidden text-xs uppercase tracking-wider text-slate-400 mr-1.5">Starter:</span>{b.starter}</span>
                  </div>
                  <div className="md:col-span-3 text-sm text-emerald-700 font-medium md:pl-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span><span className="md:hidden text-xs uppercase tracking-wider text-slate-400 mr-1.5">Pro:</span>{b.pro}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agency tier — secondary, smaller card so we don't dilute Pro CTA */}
        <Card className="border-slate-200 bg-slate-50/40">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Agency</h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    150 audits / 40 simulations per month, up to 10 active client sites, two daily monitoring slots, and 2-year history
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5">
                    {agencyPrice ? formatPrice(agencyPrice.unitAmount) : "$249"}/mo · for teams managing multiple client sites
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={() => handleUpgrade("agency")}
                disabled={checkout.isPending || portal.isPending || subscriptionLoading}
              >
                {checkout.isPending || portal.isPending || subscriptionLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Opening billing…</>
                ) : (
                  <>{storedPlan === "free" ? "Upgrade to Agency" : "Manage plan"} <ExternalLink className="h-3.5 w-3.5 ml-1.5" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer / escape hatches */}
        <div className="text-center text-sm text-slate-500 space-y-1.5 pt-2">
          <p>
            Want the full side-by-side?{" "}
            <Link href="/pricing" className="text-emerald-600 hover:underline font-medium">
              See the full pricing page
            </Link>
          </p>
          <p>
            Questions?{" "}
            <a href="mailto:hello@aeoimprovement.com" className="text-emerald-600 hover:underline">
              hello@aeoimprovement.com
            </a>
          </p>
          <p className="text-xs text-slate-400 pt-2">
            Plan: <span className="capitalize font-medium text-slate-600">{storedPlan}</span>
            {trialActive && <span className="text-emerald-600"> · 30-day guided trial active</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, used, cap, pct }: { label: string; used: number; cap: number; pct: number }) {
  // Custom bar instead of <Progress /> so we can color the FILL by usage tone
  // (the shadcn Progress primitive doesn't expose the indicator className).
  const tone =
    pct >= 100 ? "bg-rose-500"
    : pct >= 80 ? "bg-amber-500"
    : "bg-emerald-500";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          <strong className="text-slate-900">{used}</strong> of {cap} used · {Math.max(0, cap - used)} remaining
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${tone}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${used} of ${cap} used`}
        />
      </div>
    </div>
  );
}
