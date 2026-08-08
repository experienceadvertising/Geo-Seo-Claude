import { Link } from "wouter";
import { Sparkles } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";

/**
 * Header pill shown while the user's free core-feature month is running.
 * The usage meter renders only for effective-free users, while this pill
 * renders only for trial users.
 *
 * The pill turns amber in the final five days so the end date is clear.
 */
export function TrialBanner() {
  const { trialActive, trialEndsAt, storedPlan, isLoading } = usePlan();

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
      title="Core audit features are unlocked during your free first month. Click to see plans."
    >
      <Sparkles className="h-3 w-3" />
      <span className="font-semibold">Free core-feature month</span>
      <span className="text-[11px]">
        {daysLeft !== null
          ? endingSoon
            ? `· ${daysLeft} day${daysLeft === 1 ? "" : "s"} left, keep your core features`
            : `· core audit features · ${daysLeft} days left`
          : "· core audit features unlocked"}
      </span>
    </Link>
  );
}
