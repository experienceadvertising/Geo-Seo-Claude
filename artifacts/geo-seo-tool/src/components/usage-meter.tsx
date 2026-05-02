import { Link } from "wouter";
import { Zap } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";

/**
 * Compact usage meter shown in the app header for free users. Becomes
 * visually urgent as they approach the cap so the upgrade decision is
 * informed, not surprising.
 *
 * Hidden entirely for paid plans (they have generous caps and don't need
 * a constant reminder of usage).
 */
export function UsageMeter() {
  const { plan, usage, isLoading } = usePlan();

  if (isLoading || plan !== "free") return null;

  const auditsPct = usage.audits.cap > 0 ? Math.min(100, Math.round((usage.audits.used / usage.audits.cap) * 100)) : 0;
  const simsPct = usage.simulations.cap > 0 ? Math.min(100, Math.round((usage.simulations.used / usage.simulations.cap) * 100)) : 0;
  const maxPct = Math.max(auditsPct, simsPct);

  // Only show once user has used something OR is past 60% of either cap —
  // we don't want to nag brand-new users with a "0/5 used" meter.
  if (usage.audits.used === 0 && usage.simulations.used === 0) return null;

  const tone =
    maxPct >= 100 ? { fg: "text-rose-700", bg: "bg-rose-50", bar: "bg-rose-500", border: "border-rose-200" }
    : maxPct >= 80 ? { fg: "text-amber-700", bg: "bg-amber-50", bar: "bg-amber-500", border: "border-amber-200" }
    : { fg: "text-slate-600", bg: "bg-slate-50", bar: "bg-emerald-500", border: "border-slate-200" };

  return (
    <Link
      href="/pricing"
      className={`hidden md:inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-90 ${tone.bg} ${tone.fg} ${tone.border}`}
      title="Click to upgrade and unlock higher monthly limits"
    >
      <span className="flex items-center gap-1">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Audits</span>
        <span className="font-semibold">{usage.audits.used}/{usage.audits.cap}</span>
      </span>
      <span className="text-slate-300">·</span>
      <span className="flex items-center gap-1">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Sims</span>
        <span className="font-semibold">{usage.simulations.used}/{usage.simulations.cap}</span>
      </span>
      {maxPct >= 80 && (
        <span className="ml-1 inline-flex items-center gap-1 font-semibold">
          <Zap className="h-3 w-3" /> Upgrade
        </span>
      )}
    </Link>
  );
}
