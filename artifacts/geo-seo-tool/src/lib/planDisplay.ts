type DisplayPlan = "free" | "starter" | "pro" | "agency";

export function hasMonitoringAccess(storedPlan: DisplayPlan, trialActive: boolean): boolean {
  return trialActive || storedPlan === "pro" || storedPlan === "agency";
}

export function monitoringAccessLabel(options: {
  sitesUsed: number;
  limit: number;
  storedPlan: DisplayPlan;
  trialActive: boolean;
}): string {
  const { sitesUsed, limit, storedPlan, trialActive } = options;

  if (trialActive && storedPlan === "free") {
    return `${sitesUsed}/${limit} monitoring slots used during your guided trial.`;
  }

  return `${sitesUsed}/${limit} sites used on your ${storedPlan} plan.`;
}
