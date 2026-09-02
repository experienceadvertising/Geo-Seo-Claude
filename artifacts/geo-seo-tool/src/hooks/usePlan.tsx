import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { customFetch } from "@workspace/api-client-react";

export type Plan = "free" | "starter" | "pro" | "agency";

export interface UsageBucket {
  used: number;
  cap: number;
  remaining: number;
}

export interface MeResponse {
  userId: string;
  /** Effective plan — what the user is entitled to right now. During the
   * free all-access first month this is the top tier even though they pay
   * nothing; core product feature gates should key off this. Connected paid
   * integrations may still use storedPlan. */
  plan: Plan;
  /** What the user actually pays for. Billing CTAs key off this. */
  storedPlan?: Plan;
  trial?: { active: boolean; endsAt?: string };
  usage?: {
    yearMonth: string;
    audits: UsageBucket;
    simulations: UsageBucket;
  };
  limits?: {
    simulationPrompts: number;
    simulationEngines: string[];
    fixGenerator: boolean;
    sentimentAnalysis: boolean;
  };
}

export interface PlanInfo {
  plan: Plan;
  isPro: boolean;
  isStarter: boolean;
  isAgency: boolean;
  isFree: boolean;
  /** The paid plan (free/pro/agency) ignoring the free-first-month bump. */
  storedPlan: Plan;
  /** True while the user's free all-access first month is running. */
  trialActive: boolean;
  /** ISO date the free month ends; undefined when trialActive is false. */
  trialEndsAt?: string;
  simulationPrompts: number;
  simulationEngines: string[];
  /** Feature flags from the server's PLAN_LIMITS (Starter includes the Fix
   * Generator, so never derive these from `isPro`). */
  fixGenerator: boolean;
  sentimentAnalysis: boolean;
  usage: {
    audits: UsageBucket;
    simulations: UsageBucket;
  };
}

// Conservative client-side fallbacks if /api/me hasn't loaded yet. Server is
// the source of truth — these only render before first fetch completes.
// Keep in sync with PLAN_LIMITS in artifacts/api-server/src/lib/planUtils.ts.
const FALLBACK_LIMITS: Record<Plan, { simulationPrompts: number; simulationEngines: string[]; monthlyAudits: number; monthlySimulations: number; fixGenerator: boolean; sentimentAnalysis: boolean }> = {
  free: { simulationPrompts: 3, simulationEngines: ["chatgpt"], monthlyAudits: 5, monthlySimulations: 2, fixGenerator: false, sentimentAnalysis: false },
  starter: { simulationPrompts: 3, simulationEngines: ["chatgpt"], monthlyAudits: 15, monthlySimulations: 5, fixGenerator: true, sentimentAnalysis: false },
  pro: { simulationPrompts: 25, simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"], monthlyAudits: 100, monthlySimulations: 30, fixGenerator: true, sentimentAnalysis: true },
  agency: { simulationPrompts: 10, simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"], monthlyAudits: 150, monthlySimulations: 40, fixGenerator: true, sentimentAnalysis: true },
};

export function usePlan(): PlanInfo & { isLoading: boolean } {
  const { isSignedIn } = useAuth();
  const { data, isLoading } = useQuery<MeResponse>({
    queryKey: ["me", "plan"],
    queryFn: () => customFetch<MeResponse>("/api/me"),
    enabled: isSignedIn,
    staleTime: 30_000,
    retry: false,
  });

  const plan: Plan = data?.plan ?? "free";
  const fb = FALLBACK_LIMITS[plan];
  const simulationPrompts = data?.limits?.simulationPrompts ?? fb.simulationPrompts;
  const simulationEngines = data?.limits?.simulationEngines ?? fb.simulationEngines;
  const fixGenerator = data?.limits?.fixGenerator ?? fb.fixGenerator;
  const sentimentAnalysis = data?.limits?.sentimentAnalysis ?? fb.sentimentAnalysis;

  const audits = data?.usage?.audits ?? { used: 0, cap: fb.monthlyAudits, remaining: fb.monthlyAudits };
  const simulations = data?.usage?.simulations ?? { used: 0, cap: fb.monthlySimulations, remaining: fb.monthlySimulations };

  const trialActive = data?.trial?.active ?? false;

  return {
    plan,
    isPro: plan === "pro" || plan === "agency",
    isStarter: plan === "starter",
    isAgency: plan === "agency",
    isFree: plan === "free",
    storedPlan: data?.storedPlan ?? plan,
    trialActive,
    trialEndsAt: trialActive ? data?.trial?.endsAt : undefined,
    isLoading,
    simulationPrompts,
    simulationEngines,
    fixGenerator,
    sentimentAnalysis,
    usage: { audits, simulations },
  };
}
