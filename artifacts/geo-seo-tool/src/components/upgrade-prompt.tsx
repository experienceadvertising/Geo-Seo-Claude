import React from "react";
import { Sparkles, Lock, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { type Plan } from "@/hooks/usePlan";
import { useStripeProducts } from "@/hooks/useStripe";

interface UpgradePromptProps {
  feature: string;
  description: string;
  requiredPlan?: Plan;
  compact?: boolean;
  className?: string;
}

const PLAN_COLORS: Record<Plan, string> = {
  free: "bg-slate-100 text-slate-700",
  starter: "bg-sky-100 text-sky-800",
  pro: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
  agency: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white",
};

// Fallbacks shown only while products are loading from /api/stripe/products.
// Real prices are pulled live so a Stripe price change reflects in the UI
// without redeploying.
const FALLBACK_PRICES: Record<Plan, string> = {
  free: "Free",
  starter: "$29/mo",
  pro: "$79/mo",
  agency: "$249/mo",
};

function usePlanPriceLabel(plan: Plan): string {
  const { data } = useStripeProducts();
  if (plan === "free") return "Free";
  const product = data?.data.find((p) => p.metadata?.plan_id === plan);
  const monthly = product?.prices.find((pr) => pr.recurring?.interval === "month");
  if (!monthly) return FALLBACK_PRICES[plan];
  return `$${(monthly.unitAmount / 100).toLocaleString("en-US")}/mo`;
}

export function UpgradePrompt({
  feature,
  description,
  requiredPlan = "pro",
  compact = false,
  className = "",
}: UpgradePromptProps) {
  const [, setLocation] = useLocation();
  const priceLabel = usePlanPriceLabel(requiredPlan);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 text-sm cursor-pointer hover:bg-primary/10 transition-colors ${className}`}
        onClick={() => setLocation("/pricing")}
      >
        <Lock className="h-4 w-4 text-primary shrink-0" />
        <span className="text-muted-foreground flex-1">{description}</span>
        <Badge className={`text-xs shrink-0 ${PLAN_COLORS[requiredPlan]}`}>
          {requiredPlan === "starter" ? "Starter" : requiredPlan === "pro" ? "Pro" : "Agency"} · {priceLabel}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 via-emerald-500/5 to-teal-500/5 ${className}`}>
      <CardContent className="p-6 flex flex-col items-center text-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h3 className="font-bold text-base">{feature}</h3>
            <Badge className={`text-xs ${PLAN_COLORS[requiredPlan]}`}>
              {requiredPlan === "starter" ? "Starter" : requiredPlan === "pro" ? "Pro" : "Agency"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 gap-2"
            onClick={() => setLocation("/pricing")}
          >
            <Zap className="h-4 w-4" /> Upgrade to {requiredPlan === "starter" ? "Starter" : requiredPlan === "pro" ? "Pro" : "Agency"} for {priceLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlanBadge({ plan }: { plan: Plan }) {
  if (plan === "free") return null;
  return (
    <Badge className={`text-xs font-semibold ${PLAN_COLORS[plan]}`}>
      {plan === "agency" ? "Agency" : plan === "pro" ? "Pro" : "Starter"}
    </Badge>
  );
}
