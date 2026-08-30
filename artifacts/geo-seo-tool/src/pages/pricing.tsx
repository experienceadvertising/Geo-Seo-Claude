import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Zap, Building2, Star, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlan } from "@/hooks/usePlan";
import { useStripeProducts, useStripeSubscription, useCheckout, useCustomerPortal } from "@/hooks/useStripe";
import { useToast } from "@/hooks/use-toast";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import { trackEvent } from "@/lib/analytics";

const PRICING_TITLE = "Pricing | AEO Improvement SEO and GEO platform";
const PRICING_DESC =
  "A guided SEO and GEO platform. Start free, then choose Starter from $29/month for more audits and implementation help, or Pro for Search Console, rank tracking, multi-engine simulations, and monitoring.";

const pricingProductJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "AEO Improvement",
  description:
    "Guided SEO and GEO platform that audits technical health, content quality, AI visibility, and practical improvements across Google and AI search.",
  brand: { "@type": "Organization", name: "AEO Improvement" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "2390",
    offerCount: "7",
    offers: [
      {
        "@type": "Offer",
        name: "Starter (monthly)",
        price: "29",
        priceCurrency: "USD",
        url: "https://aeoimprovement.com/pricing",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "29", priceCurrency: "USD", billingDuration: "P1M" },
      },
      {
        "@type": "Offer",
        name: "Starter (annual)",
        price: "290",
        priceCurrency: "USD",
        url: "https://aeoimprovement.com/pricing",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "290", priceCurrency: "USD", billingDuration: "P1Y" },
      },
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        url: "https://aeoimprovement.com/sign-up",
        category: "Free",
      },
      {
        "@type": "Offer",
        name: "Pro (monthly)",
        price: "79",
        priceCurrency: "USD",
        url: "https://aeoimprovement.com/pricing",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "79",
          priceCurrency: "USD",
          billingDuration: "P1M",
        },
      },
      {
        "@type": "Offer",
        name: "Pro (annual)",
        price: "750",
        priceCurrency: "USD",
        url: "https://aeoimprovement.com/pricing",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "750",
          priceCurrency: "USD",
          billingDuration: "P1Y",
        },
      },
      {
        "@type": "Offer",
        name: "Agency (monthly)",
        price: "249",
        priceCurrency: "USD",
        url: "https://aeoimprovement.com/pricing",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "249",
          priceCurrency: "USD",
          billingDuration: "P1M",
        },
      },
      {
        "@type": "Offer",
        name: "Agency (annual)",
        price: "2390",
        priceCurrency: "USD",
        url: "https://aeoimprovement.com/pricing",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "2390",
          priceCurrency: "USD",
          billingDuration: "P1Y",
        },
      },
    ],
  },
};

const pricingFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is there a free plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every new account gets its first month free with all core audit features unlocked, including all four AI engines, the Fix Generator, monitoring, and competitor tracking, with no credit card required. Connected Google Analytics reporting is reserved for paid plans. After the first month, the Free plan includes 5 audits per month, 2 prompt simulations per month, ChatGPT engine coverage, the basic AEO score, and 30-day audit history.",
      },
    },
    {
      "@type": "Question",
      name: "What is included in Starter?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Starter is $29/month or $290/year for one site, 15 audits monthly, 5 ChatGPT simulations monthly, guided SEO and GEO recommendations, the Fix Generator, and 90-day history. Pro adds Search Console, AI-referral reporting, Google rank tracking, all four simulated AI engines, monitoring, competitor analysis, and higher limits.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Starter, Pro, and Agency are month-to-month or annual; you can cancel at any time from the customer portal and your plan stays active until the end of the current billing period.",
      },
    },
    {
      "@type": "Question",
      name: "Do annual plans have a discount?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Annual plans save compared with monthly billing: $290/year for Starter, $750/year for Pro, and $2,390/year for Agency.",
      },
    },
  ],
};

const pricingBreadcrumb = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Pricing", path: "/pricing" },
]);

const PLAN_FEATURES = {
  free: [
    "First month: all core audit features unlocked",
    "Then 5 audits / month",
    "2 simulations / month",
    "3 prompts per audit",
    "ChatGPT engine only",
    "Basic 6-dimension AEO score",
    "AI crawler access audit",
    "30-day audit history",
  ],
  starter: [
    "One site with 15 audits / month",
    "5 ChatGPT simulations / month",
    "3 prompts per simulation",
    "Guided SEO + GEO recommendations",
    "Content Effort and technical SEO guidance",
    "Fix Generator for schema and crawler rules",
    "90-day audit history",
    "Upgrade to Pro for Google data, rank tracking and monitoring",
  ],
  pro: [
    "100 audits / month",
    "30 simulations / month",
    "25 prompts per audit",
    "ChatGPT, Claude, Gemini & Perplexity",
    "Fan-out mode + Topical Breadth score",
    "Google Search Console query opportunities",
    "Google Analytics AI-referral integration",
    "Sentiment & tone analysis",
    "Fix Generator (JSON-LD, robots.txt, optional llms.txt)",
    "Competitor citation gap + Share of Voice",
    "Projects — continuous monitoring & alerts",
    "AI crawler pixel request tracking",
    "1-year visibility trend history",
    "Priority email support",
  ],
  agency: [
    "150 audits / month",
    "40 simulations / month",
    "10 prompts per simulation",
    "Up to 10 active client sites in Projects",
    "2 daily monitoring slots, weekly monitoring for the rest",
    "One connected GA4 property per workspace for now",
    "Everything in Pro + 2-year visibility trend history",
    "Priority email support",
  ],
};

function formatPrice(unitAmount: number): string {
  return `$${(unitAmount / 100).toLocaleString("en-US")}`;
}

interface PlanCardProps {
  planId: "free" | "starter" | "pro" | "agency";
  name: string;
  price: string;
  annualMonthlyEquiv?: string;
  priceLoading?: boolean;
  period?: string;
  description: string;
  features: string[];
  isCurrentPlan: boolean;
  isHighlighted: boolean;
  onUpgrade?: () => void;
  upgradeLoading?: boolean;
  isSignedIn: boolean;
  badgeLabel?: string;
  savingsBadge?: string;
  actionLabel?: string;
}

function PlanCard({
  planId,
  name,
  price,
  annualMonthlyEquiv,
  priceLoading,
  period,
  description,
  features,
  isCurrentPlan,
  isHighlighted,
  onUpgrade,
  upgradeLoading,
  isSignedIn,
  badgeLabel,
  savingsBadge,
  actionLabel,
}: PlanCardProps) {
  const gradients: Record<string, string> = {
    free: "from-slate-500 to-slate-600",
    starter: "from-sky-500 to-cyan-500",
    pro: "from-emerald-500 to-teal-500",
    agency: "from-purple-500 to-indigo-500",
  };
  const icons: Record<string, React.ReactNode> = {
    free: <Star className="h-5 w-5 text-white" />,
    starter: <Zap className="h-5 w-5 text-white" />,
    pro: <Zap className="h-5 w-5 text-white" />,
    agency: <Building2 className="h-5 w-5 text-white" />,
  };

  return (
    <Card
      className={`relative flex flex-col transition-all duration-200 ${
        isHighlighted
          ? "border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 scale-[1.02]"
          : "border border-slate-200 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 px-4 py-1 text-xs font-semibold shadow-sm">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4 pt-7">
        <div className="flex items-center gap-3 mb-3">
          <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradients[planId]} flex items-center justify-center shadow-md`}>
            {icons[planId]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg leading-none">{name}</h3>
              {badgeLabel && (
                <Badge variant="outline" className="text-xs font-medium border-emerald-500/40 text-emerald-600">
                  {badgeLabel}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex items-end gap-2 flex-wrap">
          {priceLoading ? (
            <Skeleton className="h-10 w-20" />
          ) : (
            <span className="text-4xl font-extrabold tracking-tight">{price}</span>
          )}
          {period && !priceLoading && (
            <div className="mb-1 flex flex-col items-start gap-0.5">
              <span className="text-muted-foreground text-sm leading-none">{period}</span>
              {annualMonthlyEquiv && (
                <span className="text-[11px] text-muted-foreground leading-none">{annualMonthlyEquiv}</span>
              )}
            </div>
          )}
          {savingsBadge && !priceLoading && (
            <Badge className="mb-1 bg-emerald-100 text-emerald-700 border-0 text-xs font-semibold">
              {savingsBadge}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 pt-0 pb-6 gap-5">
        <ul className="space-y-2.5 flex-1">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-slate-700">{feature}</span>
            </li>
          ))}
        </ul>

        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : planId === "free" ? (
          isSignedIn ? (
            <Button variant="outline" className="w-full" disabled>
              Always Free
            </Button>
          ) : (
            <Link href="/sign-up">
              <Button variant="outline" className="w-full">
                Start free, core audit features for 1 month
              </Button>
            </Link>
          )
        ) : !isSignedIn ? (
          <Link href="/sign-up">
            <Button className={`w-full bg-gradient-to-r ${gradients[planId]} hover:opacity-90 text-white border-0`}>
              Get Started
            </Button>
          </Link>
        ) : (
          <Button
            className={`w-full bg-gradient-to-r ${gradients[planId]} hover:opacity-90 text-white border-0`}
            onClick={onUpgrade}
            disabled={upgradeLoading}
          >
            {upgradeLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirecting…</>
            ) : (
              <>{actionLabel || `Upgrade to ${name}`} <ExternalLink className="h-3.5 w-3.5 ml-1.5" /></>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

type BillingInterval = "month" | "year";

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const [billing, setBilling] = useState<BillingInterval>("month");
  const { isSignedIn } = useAuth();
  // storedPlan, not effective plan: during the free all-access first month
  // the effective plan is "agency", which would mark the Agency card as
  // "Current Plan" and hide every checkout button from trial users.
  const { storedPlan: currentPlan, trialActive, trialEndsAt } = usePlan();
  const { data: productsData } = useStripeProducts();
  const { data: subData } = useStripeSubscription();
  const checkout = useCheckout();
  const portal = useCustomerPortal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      queryClient.invalidateQueries({ queryKey: ["me", "plan"] });
      toast({
        title: "Payment received",
        description: "Stripe is confirming your subscription. Your upgraded plan will appear shortly.",
      });
      setLocation("/pricing", { replace: true });
    } else if (params.get("checkout") === "cancel") {
      toast({
        title: "Checkout cancelled",
        description: "No charges were made. Feel free to try again.",
        variant: "destructive",
      });
      setLocation("/pricing", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const products = productsData?.data ?? [];

  function getPriceForPlan(
    planId: string,
    interval: BillingInterval,
  ): { priceId: string; unitAmount: number } | null {
    const product = products.find((p) => p.metadata?.plan_id === planId);
    const price = product?.prices.find((pr) => pr.recurring?.interval === interval);
    if (!price) return null;
    return { priceId: price.id, unitAmount: price.unitAmount };
  }

  function handleUpgrade(planId: "starter" | "pro" | "agency") {
    if (currentPlan !== "free" || subData?.canManageBilling) {
      trackEvent("billing_portal_opened", { current_plan: currentPlan });
      portal.mutate();
      return;
    }
    const price = getPriceForPlan(planId, billing);
    if (!price) {
      toast({
        title: "Pricing not available",
        description: "Our products are still syncing. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }
    trackEvent("checkout_started", { plan: planId, billing_interval: billing });
    checkout.mutate({ priceId: price.priceId, plan: planId });
  }

  const starterMonthly = getPriceForPlan("starter", "month");
  const starterAnnual = getPriceForPlan("starter", "year");
  const proMonthly = getPriceForPlan("pro", "month");
  const proAnnual = getPriceForPlan("pro", "year");
  const agencyMonthly = getPriceForPlan("agency", "month");
  const agencyAnnual = getPriceForPlan("agency", "year");
  const canManageBilling = !!subData?.canManageBilling;

  // Build display values for each plan based on current billing toggle
  function buildPlanDisplay(
    planId: "starter" | "pro" | "agency",
    monthlyData: { priceId: string; unitAmount: number } | null,
    annualData: { priceId: string; unitAmount: number } | null,
    fallbackMonthly: number,
    fallbackAnnual: number,
  ) {
    if (billing === "year") {
      const annualTotal = annualData?.unitAmount ?? fallbackAnnual;
      const monthlyEquiv = Math.round(annualTotal / 12);
      const monthlyPrice = monthlyData?.unitAmount ?? fallbackMonthly;
      const savingsPct = Math.round((1 - monthlyEquiv / monthlyPrice) * 100);
      return {
        price: formatPrice(annualTotal),
        period: "/yr",
        annualMonthlyEquiv: `${formatPrice(monthlyEquiv)}/mo`,
        savingsBadge: `Save ${savingsPct}%`,
      };
    }
    return {
      price: monthlyData ? formatPrice(monthlyData.unitAmount) : formatPrice(fallbackMonthly),
      period: "/mo",
      annualMonthlyEquiv: undefined,
      savingsBadge: undefined,
    };
  }

  const starterDisplay = buildPlanDisplay("starter", starterMonthly, starterAnnual, 2900, 29000);
  const proDisplay = buildPlanDisplay("pro", proMonthly, proAnnual, 7900, 75000);
  const agencyDisplay = buildPlanDisplay("agency", agencyMonthly, agencyAnnual, 24900, 239000);

  const plans = [
    {
      planId: "free" as const,
      name: "Free",
      price: "$0",
      period: "/mo",
      description: "First month: all core audit features unlocked. No card needed.",
      features: PLAN_FEATURES.free,
      isHighlighted: false,
    },
    {
      planId: "starter" as const,
      name: "Starter",
      ...starterDisplay,
      priceLoading: false,
      description: "For one site ready to improve SEO and GEO",
      features: PLAN_FEATURES.starter,
      isHighlighted: false,
    },
    {
      planId: "pro" as const,
      name: "Pro",
      ...proDisplay,
      // Render the price immediately from the static fallback (which matches the
      // live Stripe price); live data replaces it seamlessly with no skeleton flash.
      priceLoading: false,
      description: "For marketers who want more than a score",
      features: PLAN_FEATURES.pro,
      isHighlighted: true,
    },
    {
      planId: "agency" as const,
      name: "Agency",
      ...agencyDisplay,
      priceLoading: false,
      description: "For agencies managing a focused portfolio of client sites",
      features: PLAN_FEATURES.agency,
      isHighlighted: false,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-14 px-4">
      <SEO
        title={PRICING_TITLE}
        description={PRICING_DESC}
        path="/pricing"
        jsonLd={[pricingProductJsonLd, pricingFaqJsonLd, pricingBreadcrumb]}
      />
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <Badge className="bg-emerald-100 text-emerald-700 border-0 px-3 py-1 text-xs font-medium">
            Plans &amp; Pricing
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Improve how your brand shows up in Google and AI search</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Your first month is completely free with all core audit features unlocked and no credit card.
            After that, stay free for basic audits, start at $29/month for guided SEO and GEO improvements,
            or upgrade to Pro for ongoing measurement, Google data, and multi-engine visibility.
          </p>

          {/* Billing interval toggle */}
          <div className="flex items-center justify-center gap-3 pt-2" role="group" aria-label="Billing interval">
            <button
              type="button"
              onClick={() => setBilling("month")}
              aria-pressed={billing === "month"}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                billing === "month"
                  ? "bg-slate-900 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("year")}
              aria-pressed={billing === "year"}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                billing === "year"
                  ? "bg-slate-900 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-1.5 py-0.5 font-semibold">
                Save ~20%
              </Badge>
            </button>
          </div>
        </div>

        {isSignedIn && currentPlan === "free" && trialActive && (
          <Alert className="border-emerald-200 bg-emerald-50 max-w-lg mx-auto">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              You're in your <strong>free core-feature month</strong>. All audit,
              simulation, monitoring, and recommendation features are already unlocked
              {trialEndsAt
                ? ` until ${new Date(trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                : ""}
              . Subscribe below to keep them after it ends.
            </AlertDescription>
          </Alert>
        )}

        {isSignedIn && currentPlan !== "free" && (
          <Alert className="border-emerald-200 bg-emerald-50 max-w-lg mx-auto">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800 flex items-center justify-between">
              <span>
                You're on the <strong className="capitalize">{currentPlan}</strong> plan.
              </span>
              {canManageBilling && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4 border-emerald-400 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => portal.mutate()}
                  disabled={portal.isPending}
                >
                  {portal.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Manage Billing
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch pt-4">
          {plans.map((p) => (
            <PlanCard
              key={p.planId}
              {...p}
              isCurrentPlan={!!isSignedIn && currentPlan === p.planId}
              isSignedIn={!!isSignedIn}
              onUpgrade={() => handleUpgrade(p.planId as "starter" | "pro" | "agency")}
              upgradeLoading={checkout.isPending || portal.isPending}
              actionLabel={currentPlan !== "free" ? "Manage plan" : undefined}
              badgeLabel={!!isSignedIn && currentPlan === p.planId ? "Current" : undefined}
            />
          ))}
        </div>

        <div className="text-center space-y-2 text-sm text-muted-foreground">
          <p>
            Monthly plans cancel anytime.{" "}
            Annual plans billed as a single payment — no mid-year cancellation refunds.
          </p>
          <p>
            Questions?{" "}
            <a href="mailto:hello@aeoimprovement.com" className="text-emerald-600 hover:underline">
              hello@aeoimprovement.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
