import React, { useState } from "react";
import { Check, Copy, FilePenLine } from "lucide-react";
import { siteRewriteSuggestion } from "@/lib/action-plan";
import { Button } from "@/components/ui/button";

type Props = {
  recommendation: {
    id?: string;
    category: "answerability" | "authority" | "structure" | "depth" | "freshness" | "technical" | "entity";
  };
  audit: {
    url: string;
    title?: string | null;
    description?: string | null;
    brandName?: string | null;
  };
};

export function SiteRewrite({ recommendation, audit }: Props) {
  const suggestion = siteRewriteSuggestion(recommendation, audit);
  const [copied, setCopied] = useState(false);
  if (!suggestion) return null;

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(suggestion.draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="mt-4 rounded-lg border border-blue-200 bg-blue-50/60 p-4" aria-label="Suggested site-specific rewrite">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-800">
            <FilePenLine className="h-4 w-4" /> Suggested site-specific rewrite
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">{suggestion.label}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0 bg-white" onClick={copyDraft}>
          {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy draft"}
        </Button>
      </div>
      <div className="mt-3 whitespace-pre-wrap rounded-md border bg-white p-3 text-sm leading-relaxed text-slate-900">{suggestion.draft}</div>
      {suggestion.groundedIn.length > 0 && (
        <p className="mt-2 text-xs text-blue-900">Grounded in this audit's {suggestion.groundedIn.join(", ")}.</p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{suggestion.reviewNote}</p>
    </section>
  );
}
