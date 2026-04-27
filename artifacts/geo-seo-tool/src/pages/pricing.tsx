import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser, SignInButton } from "@clerk/react";
import { CheckCircle2, Zap, Building2, Star, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePlan } from "@/hooks/usePlan";
import { useStripeProducts, useStripeSubscription, useCheckout, useCustomerPortal } from "@/hooks/useStripe";
import { useToast } from "@/hooks/use-toast";

const PLAN_FEATURES = {
  free: [
    "3 prompts per audit",
    "ChatGPT engine only",
    "Basic AEO score",
    "1 competitor keyword",
    "30-day audit history",
  ],
  pro: [
    "25 prompts per audit",
    "ChatGPT, Claude, Gemini & Perplexity",
    "Sentiment & tone analysis",
    "Fix Generator (llms.txt, JSON-LD, robots.txt)",
    "Competitor citation gap table",
    "1-year visibility trend history",
    "Priority email support",
  ],
  agency: [
    "Everything in Pro",
    "2-year visibility trend history",
    "Agency-branded reports",
    "Multiple client site management",
    "Dedicated account manager",
    "Priority support & onboarding",
  ],
};

function formatPrice(unitAmount: number): string {
  return `$${(unitAmount / 100).toLocaleString("en-US")}`;
}

interface PlanCardProps {
  planId: "free" | "pro" | "agency";
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  isCurrentPlan: boolean;
  isHighlighted: boolean;
  onUpgrade?: () => void;
  upgradeLoading?: boolean;
  isSignedIn: boolean;
  badgeLabel?: string;
}

function PlanCard({
  planId,
  name,
  price,
  period,
  description,
  features,
  isCurrentPlan,
  isHighlighted,
  onUpgrade,
  upgradeLoading,
  isSignedIn,
  badgeLabel,
}: PlanCardProps) {
  const gradients: Record<string, string> = {
    free: "from-slate-500 to-slate-600",
    pro: "from-emerald-500 to-teal-500",
    agency: "from-purple-500 to-indigo-500",
  };
  const icons: Record<string, React.ReactNode> = {
    free: <Star className="h-5 w-5 text-white" />,
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

        <div className="flex items-end gap-1">
          <span className="text-4xl font-extrabold tracking-tight">{price}</span>
          {period && <span className="text-muted-foreground text-sm mb-1">{period}</span>}
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
          <Button variant="outline" className="w-full" disabled>
            Always Free
          </Button>
        ) : !isSignedIn ? (
          <SignInButton mode="modal">
            <Button className={`w-full bg-gradient-to-r ${gradients[planId]} hover:opacity-90 text-white border-0`}>
              Get Started
            </Button>
          </SignInButton>
        ) : (
          <Button
            className={`w-full bg-gradient-to-r ${gradients[planId]} hover:opacity-90 text-white border-0`}
            onClick={onUpgrade}
            disabled={upgradeLoading}
          >
            {upgradeLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirecting…</>
            ) : (
              <>Upgrade to {name} <ExternalLink className="h-3.5 w-3.5 ml-1.5" /></>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const { isSignedIn } = useUser();
  const { plan: currentPlan } = usePlan();
  const { data: productsData, isLoading: productsLoading } = useStripeProducts();
  const { data: subData } = useStripeSubscription();
  const checkout = useCheckout();
  const portal = useCustomerPortal();
  const { toast } = useToast();

  // Handle return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast({
        title: "Subscription activated!",
        description: "Your plan has been upgraded. It may take a moment to reflect.",
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

  function getPriceForPlan(planId: string): { priceId: string; unitAmount: number } | null {
    const product = products.find((p) => p.metadata?.plan_id === planId);
    const monthlyPrice = product?.prices.find((pr) => pr.recurring?.interval === "month");
    if (!monthlyPrice) return null;
    return { priceId: monthlyPrice.id, unitAmount: monthlyPrice.unitAmount };
  }

  function handleUpgrade(planId: "pro" | "agency") {
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

  const proPrice = getPriceForPlan("pro");
  const agencyPrice = getPriceForPlan("agency");
  const hasSubscription = !!subData?.subscription;

  const plans = [
    {
      planId: "free" as const,
      name: "Free",
      price: "$0",
      period: "/mo",
      description: "Try AEO auditing, no credit card needed",
      features: PLAN_FEATURES.free,
      isHighlighted: false,
    },
    {
      planId: "pro" as const,
      name: "Pro",
      price: productsLoading ? "—" : proPrice ? formatPrice(proPrice.unitAmount) : "$79",
      period: "/mo",
      description: "For marketers & SEO professionals",
      features: PLAN_FEATURES.pro,
      isHighlighted: true,
    },
    {
      planId: "agency" as const,
      name: "Agency",
      price: productsLoading ? "—" : agencyPrice ? formatPrice(agencyPrice.unitAmount) : "$249",
      period: "/mo",
      description: "For agencies managing multiple clients",
      features: PLAN_FEATURES.agency,
      isHighlighted: false,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-14 px-4">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-3">
          <Badge className="bg-emerald-100 text-emerald-700 border-0 px-3 py-1 text-xs font-medium">
            Plans &amp; Pricing
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Rank in AI answers, not just search
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start for free. Upgrade when you're ready to unlock all AI engines,
            automated fixes, and competitor intelligence.
          </p>
        </div>

        {/* Current plan alert */}
        {isSignedIn && currentPlan !== "free" && (
          <Alert className="border-emerald-200 bg-emerald-50 max-w-lg mx-auto">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800 flex items-center justify-between">
              <span>
                You're on the <strong className="capitalize">{currentPlan}</strong> plan.
              </span>
              {hasSubscription && (
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

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-4">
          {plans.map((p) => (
            <PlanCard
              key={p.planId}
              {...p}
              isCurrentPlan={currentPlan === p.planId}
              isSignedIn={!!isSignedIn}
              onUpgrade={() => handleUpgrade(p.planId as "pro" | "agency")}
              upgradeLoading={
                checkout.isPending && checkout.variables?.plan === p.planId
              }
              badgeLabel={currentPlan === p.planId ? "Current" : undefined}
            />
          ))}
        </div>

        {/* Footer notes */}
        <div className="text-center space-y-2 text-sm text-muted-foreground">
          <p>All plans billed monthly. Cancel anytime from your billing portal.</p>
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
