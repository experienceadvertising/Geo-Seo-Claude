import { Link } from "wouter";
import { Sparkles } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";

/**
 * Header pill shown while the user's free all-access first month is running.
 * Complements UsageMeter: the meter renders only for effective-free users,
 * this renders only for trial users — never both at once.
 *
 * Turns amber in the final 5 days so the end date registers before the
 * trial-ending email lands.
 */
export function TrialBanner() {
  const { trialActive, trialEndsAt, storedPlan, isLoading } = usePlan();

  // Paying customers keep their features after the month — nothing to show.
  if (isLoading || !trialActive || storedPlan !== "free") return null;

  const endsAt = trialEndsAt ? new Date(trialEndsAt) : null;
  const daysLeft = endsAt
    ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86_400_000))
    : null;
  const endingSoon = daysLeft !== null && daysLeft <= 5;

  const tone = endingSoon
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <Link
      href="/upgrade?source=trial-banner"
      className={`hidden md:inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-90 ${tone}`}
      title="Every feature is unlocked free during your first month — click to see plans"
    >
      <Sparkles className="h-3 w-3" />
      <span className="font-semibold">Free month</span>
      <span className="text-[11px]">
        {daysLeft !== null
          ? endingSoon
            ? `· ${daysLeft} day${daysLeft === 1 ? "" : "s"} left — keep your features`
            : `· all features · ${daysLeft} days left`
          : "· all features unlocked"}
      </span>
    </Link>
  );
}
