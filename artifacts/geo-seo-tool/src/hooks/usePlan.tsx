import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { customFetch } from "@workspace/api-client-react";

export type Plan = "free" | "pro" | "agency";

export interface UsageBucket {
  used: number;
  cap: number;
  remaining: number;
}

export interface MeResponse {
  userId: string;
  plan: Plan;
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
  isAgency: boolean;
  isFree: boolean;
  simulationPrompts: number;
  simulationEngines: string[];
  usage: {
    audits: UsageBucket;
    simulations: UsageBucket;
  };
}

// Conservative client-side fallbacks if /api/me hasn't loaded yet. Server is
// the source of truth — these only render before first fetch completes.
const FALLBACK_LIMITS: Record<Plan, { simulationPrompts: number; simulationEngines: string[]; monthlyAudits: number; monthlySimulations: number }> = {
  free: { simulationPrompts: 3, simulationEngines: ["chatgpt"], monthlyAudits: 5, monthlySimulations: 2 },
  pro: { simulationPrompts: 25, simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"], monthlyAudits: 100, monthlySimulations: 30 },
  agency: { simulationPrompts: 25, simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"], monthlyAudits: 500, monthlySimulations: 150 },
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

  const audits = data?.usage?.audits ?? { used: 0, cap: fb.monthlyAudits, remaining: fb.monthlyAudits };
  const simulations = data?.usage?.simulations ?? { used: 0, cap: fb.monthlySimulations, remaining: fb.monthlySimulations };

  return {
    plan,
    isPro: plan === "pro" || plan === "agency",
    isAgency: plan === "agency",
    isFree: plan === "free",
    isLoading,
    simulationPrompts,
    simulationEngines,
    usage: { audits, simulations },
  };
}
