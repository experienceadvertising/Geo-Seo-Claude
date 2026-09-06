import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, FilePenLine, RotateCcw, WandSparkles } from "lucide-react";
import { siteRewriteSuggestion } from "@/lib/action-plan";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

type Props = {
  recommendation: {
    id?: string;
    title?: string;
    detail?: string;
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
  const { user } = useAuth();
  const suggestion = siteRewriteSuggestion(recommendation, audit);
  const [copied, setCopied] = useState(false);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const storageKey = `aeo-rewrite:${user?.id ?? "unconfirmed"}:${audit.url}:${recommendation.id ?? recommendation.category}`;
  const [facts, setFacts] = useState({ audience: "", problem: "", differentiator: "", proof: "" });
  const [draft, setDraft] = useState("");

  const personalizedDraft = useMemo(() => {
    if (!suggestion) return "";
    const brand = audit.brandName?.trim() || audit.title?.split(/[|\-]/)[0]?.trim() || "This company";
    const supplied = Object.values(facts).some((value) => value.trim());
    if (!supplied) return suggestion.draft;
    const audience = facts.audience.trim() || "[specific customer]";
    const problem = facts.problem.trim() || "[specific problem]";
    const differentiator = facts.differentiator.trim() || "[verified approach or capability]";
    const proof = facts.proof.trim();
    if (["brand-facts", "direct-answer-block", "content-effort-helpfulness", "brand-mention-early"].includes(recommendation.id ?? "")) {
      return `${brand} helps ${audience} ${problem} through ${differentiator}.${proof ? ` Evidence: ${proof}.` : ""}`;
    }
    return `${suggestion.draft}\n\nAudience to address: ${audience}\nProblem to solve: ${problem}\nVerified differentiator: ${differentiator}${proof ? `\nEvidence to include: ${proof}` : ""}`;
  }, [audit.brandName, audit.title, facts, recommendation.id, suggestion]);

  useEffect(() => {
    if (!suggestion) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      if (saved?.facts) setFacts(saved.facts);
      setDraft(typeof saved?.draft === "string" ? saved.draft : suggestion.draft);
    } catch {
      setDraft(suggestion.draft);
    }
  }, [storageKey, suggestion?.draft]);

  useEffect(() => {
    if (!suggestion || !draft) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ facts, draft, savedAt: new Date().toISOString() }));
    } catch { /* Private browsing or storage policy can block persistence. */ }
  }, [draft, facts, storageKey, suggestion]);

  if (!suggestion) return null;

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft || personalizedDraft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="mt-4 rounded-lg border border-blue-200 bg-blue-50/60 p-4" aria-label="Content rewrite workbench">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-800">
            <FilePenLine className="h-4 w-4" /> Content rewrite workbench
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">{suggestion.label}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0 bg-white" onClick={copyDraft}>
          {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy draft"}
        </Button>
      </div>
      <textarea
        aria-label={`Editable rewrite for ${recommendation.title || suggestion.label}`}
        className="mt-3 min-h-40 w-full rounded-md border bg-white p-3 text-sm leading-relaxed text-slate-900"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="bg-white" onClick={() => setShowWorkbench((value) => !value)} aria-expanded={showWorkbench}>
          <WandSparkles className="mr-1.5 h-3.5 w-3.5" /> {showWorkbench ? "Hide brand facts" : "Personalize with brand facts"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setFacts({ audience: "", problem: "", differentiator: "", proof: "" }); setDraft(suggestion.draft); }}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset draft
        </Button>
      </div>
      {showWorkbench && (
        <div className="mt-3 grid gap-3 rounded-md border border-blue-200 bg-white p-3 sm:grid-cols-2">
          {([
            ["audience", "Who is this page for?", "Example: marketing leaders at ecommerce brands"],
            ["problem", "What outcome or problem matters?", "Example: reduce wasted paid media spend"],
            ["differentiator", "What can you verify is different?", "Example: senior-led audits using first-party account data"],
            ["proof", "What proof can you publish?", "Example: named case study, method, test, or source"],
          ] as const).map(([key, label, placeholder]) => (
            <label key={key} className="text-xs font-medium text-slate-700">
              {label}
              <input className="mt-1 h-10 w-full rounded-md border px-3 text-sm" value={facts[key]} placeholder={placeholder} onChange={(event) => setFacts((current) => ({ ...current, [key]: event.target.value }))} />
            </label>
          ))}
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={() => setDraft(personalizedDraft)}>Build personalized draft</Button>
            <p className="text-xs text-muted-foreground">Your draft stays in this browser until you copy or replace it.</p>
          </div>
        </div>
      )}
      {suggestion.groundedIn.length > 0 && (
        <p className="mt-2 text-xs text-blue-900">Grounded in this audit's {suggestion.groundedIn.join(", ")}.</p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{suggestion.reviewNote} The app will not invent customer details or proof.</p>
    </section>
  );
}
