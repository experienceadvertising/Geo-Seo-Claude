import { Link, useLocation, useParams } from "wouter";
import { useGetAudit, useListAudits, getGetAuditQueryKey, getListAuditsQueryKey } from "@workspace/api-client-react";
import { usePlan } from "@/hooks/usePlan";
import { SEO } from "@/components/seo";
import { SeoPerformancePanel } from "@/components/seo-performance-panel";
import { SeoTrackingPanel } from "@/components/seo-tracking-panel";
import Results from "./results";

export default function WorkspaceSection({ section }: { section: "seo" | "actions" | "ai-visibility" }) {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { storedPlan } = usePlan();
  const { data: audits, isLoading, isError } = useListAudits({ limit: 100 }, { query: { queryKey: getListAuditsQueryKey({ limit: 100 }), retry: false } });
  const selectedId = id ? Number(id) : audits?.[0]?.id ?? 0;
  const detail = useGetAudit(selectedId, { query: { queryKey: getGetAuditQueryKey(selectedId), enabled: Number.isInteger(selectedId) && selectedId > 0, retry: false } });
  const audit = detail.data;
  const title = section === "seo" ? "SEO performance" : section === "actions" ? "Action plan" : "AI visibility (AEO/GEO)";
  let domain = "";
  try { domain = new URL(audit?.url ?? "").hostname.replace(/^www\./, ""); } catch { /* incomplete audit */ }
  const paid = storedPlan === "pro" || storedPlan === "agency";
  return <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
    <SEO title={`${title} | AEO Improvement`} description="Your guided SEO and AI-search workspace." path={`/${section}`} index={false} />
    <h1 className="text-3xl font-bold">{title}</h1>
    {isLoading ? <p role="status">Loading your audited pages...</p> : isError ? <p role="alert">Your audited pages could not load. Reload to try again.</p> : !audits?.length && !id ? <div><h2 className="text-xl font-semibold">Start with your first audit</h2><p className="my-2">Audit a page so we can connect your improvements, SEO results, and AI visibility to the same site.</p><Link href="/" className="text-primary underline">Run my first audit</Link></div> : <>
      <label className="block text-sm font-medium">Working on this audited page
        <select aria-label="Choose audited page" value={selectedId} onChange={event => navigate(`/${section}/${event.target.value}`)} className="mt-2 block w-full rounded-md border bg-background p-3">
          {audit && !audits?.some(item => item.id === audit.id) && <option value={audit.id}>{audit.url}</option>}
          {audits?.map(item => <option key={item.id} value={item.id}>{item.url} · {new Date(item.createdAt).toLocaleDateString()}</option>)}
        </select>
      </label>
      {detail.isLoading ? <p role="status">Loading this page...</p> : detail.isError || !audit ? <p role="alert">This audit is unavailable. Choose another page or return to your dashboard.</p> : <>
        <nav aria-label="Page workspace" className="flex flex-wrap gap-4 text-sm text-primary">
          <Link href={`/actions/${audit.id}`} className="underline">Action plan</Link><Link href={`/seo/${audit.id}`} className="underline">SEO performance</Link><Link href={`/ai-visibility/${audit.id}`} className="underline">AI visibility</Link><Link href={`/results/${audit.id}`} className="underline">Full audit</Link>
        </nav>
        {section === "actions" ? <Results key={audit.id} auditId={audit.id} view="actions" /> : section === "seo" ? <>
          <p className="text-muted-foreground">Track Google rankings, review Search Console traffic, and choose your next SEO improvement. These measurements are separate from AI citations.</p>
          {paid && domain ? <><SeoPerformancePanel key={`performance-${audit.id}`} pageUrl={audit.url} /><SeoTrackingPanel key={`tracking-${audit.id}`} domain={domain} pageUrl={audit.url} /></> : <div className="rounded-lg border p-5"><h2 className="text-lg font-semibold">Unlock connected SEO performance</h2><p className="my-2">Your audit includes SEO recommendations. Pro and Agency add keyword tracking, demand and intent insights, and connected Search Console analysis, within plan limits.</p><Link href="/upgrade?source=seo-workspace" className="text-primary underline">Compare paid plans</Link></div>}
          <Link href="/projects" className="inline-block text-primary underline">Manage sites and Google connections</Link>
        </> : <div className="space-y-4 rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Test how AI answers buyer questions</h2><p>Use a consistent set of prompts to review brand mentions, citations, and competing recommendations. An audit measures readiness; a prompt test records what the selected AI service returned at that time.</p>
          <Link href={`/simulate/${audit.id}`} className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground">Open prompt simulator and saved results</Link>
          <p className="text-sm text-muted-foreground">Start with three focused buyer questions. Review the results, improve one relevant page, and repeat the same prompts later. Individual answers can vary and do not prove a change caused a visibility gain. Plan limits apply.</p>
          <h3 className="text-lg font-semibold">Turn the results into one useful change</h3>
          <p><strong>On your site:</strong> Choose the page that should answer a relevant buyer question. Check its technical audit findings, then add a clear answer, a substantiated example, and a helpful internal link if those are missing.</p>
          <p><strong>Off your site:</strong> Check that a company profile you control agrees with your home and about pages. If it does, consider a useful expert contribution to a relevant industry publication or podcast. Avoid paid ranking links, fabricated reviews, and promotional spam. This is an optional strategy, not a detected gap.</p>
          <p><strong>Next visit:</strong> Record the recommendation you completed and what changed. Review SEO performance as data accumulates. Repeat the same prompts after meaningful changes and time for discovery, not just to chase a higher score.</p>
          <div className="flex flex-wrap gap-4 text-sm text-primary"><Link href={`/actions/${audit.id}`} className="underline">Choose and record an action</Link><Link href="/recommended-tools#authority-tools-heading" className="underline">Explore off-site resources</Link><Link href={`/seo/${audit.id}`} className="underline">Review SEO progress</Link></div>
        </div>}
      </>}
    </>}
  </div>;
}
