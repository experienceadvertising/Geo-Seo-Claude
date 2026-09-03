export type StoredPlan = "free" | "starter" | "pro" | "agency";
export type PaidPlan = Exclude<StoredPlan, "free">;

const PLAN_NAMES: Record<PaidPlan, string> = {
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

export function paidPlanActionLabel(
  storedPlan: StoredPlan,
  targetPlan: PaidPlan,
  canManageBilling: boolean,
): string {
  if (storedPlan === targetPlan) return "Current plan";
  if (storedPlan !== "free") {
    return canManageBilling
      ? `Switch to ${PLAN_NAMES[targetPlan]} in billing`
      : "Contact support to change plan";
  }
  return targetPlan === "starter" ? "Choose Starter" : `Upgrade to ${PLAN_NAMES[targetPlan]}`;
}

export function paidPlanActionDisabled(
  storedPlan: StoredPlan,
  targetPlan: PaidPlan,
  canManageBilling: boolean,
): boolean {
  return storedPlan === targetPlan || (storedPlan !== "free" && !canManageBilling);
}
