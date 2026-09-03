export type PaidSeoPlan = "pro" | "agency";

export function isPaidSeoPlan(plan: string): plan is PaidSeoPlan {
  return plan === "pro" || plan === "agency";
}
