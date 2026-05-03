import React from "react";
import { BookOpen, BarChart3, Users, BadgeCheck, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RecommendationSource } from "@workspace/api-client-react";

/**
 * Renders a source-attribution badge for a single recommendation. Four visual
 * states, each distinguishable at-a-glance (not just on hover):
 *
 *   - research + verified           → solid emerald, BookOpen + checkmark
 *   - internal_benchmark + verified → solid blue,    BarChart3 + checkmark
 *   - research + unverified         → outlined amber,BookOpen + alert ("pending verification")
 *   - practitioner_consensus        → muted gray,    Users (no checkmark)
 *
 * The tooltip surfaces the full citation, verification date, link to the
 * source, and any editorial notes.
 *
 * The wrapping <TooltipProvider> is expected to live higher in the tree
 * (results.tsx already wraps in TooltipProvider).
 */
export function SourceBadge({ source }: { source: RecommendationSource }) {
  // `notes` is intentionally NOT destructured / rendered. The notes field
  // in recommendations.json is internal editorial provenance — it explains
  // *why* a per-method number was removed (and quotes the removed number for
  // audit-trail purposes). Surfacing those notes in a user-facing tooltip
  // would re-leak the very numbers Phase 2 deleted (Option A: cite KDD 2024
  // qualitatively only, no per-method figures). Keep notes server-side.
  const { type, verified, citation, url, lastVerifiedAt } = source;

  let label: string;
  let Icon: React.ComponentType<{ className?: string }>;
  let className: string;
  let weight: "strong" | "muted";

  if (type === "research" && verified) {
    label = "Research";
    Icon = BookOpen;
    className = "bg-emerald-600 text-white border-emerald-600";
    weight = "strong";
  } else if (type === "internal_benchmark" && verified) {
    label = "Benchmark";
    Icon = BarChart3;
    className = "bg-sky-600 text-white border-sky-600";
    weight = "strong";
  } else if (type === "research" && !verified) {
    label = "Research · pending verification";
    Icon = BookOpen;
    className = "bg-transparent text-amber-700 border border-dashed border-amber-500";
    weight = "muted";
  } else {
    // practitioner_consensus (verified or not — practitioner consensus is
    // never "verified against a source" by definition)
    label = "Industry consensus";
    Icon = Users;
    className = "bg-slate-100 text-slate-600 border border-slate-200";
    weight = "muted";
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide cursor-help ${className}`}
          aria-label={`Source: ${label}`}
        >
          <Icon className="h-3 w-3" />
          <span>{label}</span>
          {weight === "strong" && <BadgeCheck className="h-3 w-3" aria-hidden />}
          {type === "research" && !verified && <AlertCircle className="h-3 w-3" aria-hidden />}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm space-y-1.5">
        <div className="text-xs font-semibold">{citation}</div>
        {url && (
          <div className="text-[11px]">
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {url}
            </a>
          </div>
        )}
        {verified && lastVerifiedAt && (
          <div className="text-[10px] text-muted-foreground">
            Verified against source on {lastVerifiedAt}
          </div>
        )}
        {!verified && type === "research" && (
          <div className="text-[10px] text-amber-700">
            Citation present; not yet re-verified by an editor.
          </div>
        )}
        {type === "practitioner_consensus" && (
          <div className="text-[10px] text-muted-foreground">
            Widely-applied industry practice. Not a published research finding.
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
