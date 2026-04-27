import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { customFetch } from "@workspace/api-client-react";

export type Plan = "free" | "pro" | "agency";

export interface PlanInfo {
  plan: Plan;
  isPro: boolean;
  isAgency: boolean;
  isFree: boolean;
  simulationPrompts: number;
  simulationEngines: string[];
}

const PLAN_LIMITS: Record<Plan, { simulationPrompts: number; simulationEngines: string[] }> = {
  free: { simulationPrompts: 3, simulationEngines: ["chatgpt"] },
  pro: { simulationPrompts: 25, simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"] },
  agency: { simulationPrompts: 25, simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"] },
};

export function usePlan(): PlanInfo & { isLoading: boolean } {
  const { user } = useUser();
  const { data, isLoading } = useQuery<{ plan: Plan }>({
    queryKey: ["me", "plan"],
    queryFn: () => customFetch<{ plan: Plan }>("/api/me"),
    enabled: !!user,
    staleTime: 60_000,
    retry: false,
  });

  const plan: Plan = data?.plan ?? "free";
  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    isPro: plan === "pro" || plan === "agency",
    isAgency: plan === "agency",
    isFree: plan === "free",
    isLoading,
    ...limits,
  };
}
