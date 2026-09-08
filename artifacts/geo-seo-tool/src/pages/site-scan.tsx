import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Link } from "wouter";
import { SiteCoveragePanel } from "@/components/site-coverage-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/seo";

type Page = { id: number; url: string; title: string | null; description: string | null; geoScore: number; createdAt: string; schemaTypes: unknown; wordCount: number; previousScore: number | null; completedCount: number; next?: { id: string; title: string; detail: string }; rankings: { keyword: string; location: string; device: string; position: number | null; collectedAt: string | null; stale: boolean; resultUrl: string | null }[] };
type Plan = { paid: boolean; pages: Page[]; pageLimit: number; competitorPages: Page[] };

export default function SiteScan() {
  const initial = new URLSearchParams(window.location.search).get("url") || "";
  const [input, setInput] = useState(initial);
  const [site, setSite] = useState(initial);
  const [error, setError] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [comparisonId, setComparisonId] = useState("");
  const plan = useQuery({ queryKey: ["site-plan", site], queryFn: () => customFetch<Plan>(`/api/geo/site-plan?url=${encodeURIComponent(site)}`), enabled: Boolean(site) });
  const scanCompetitor = useMutation({
    mutationFn: () => customFetch<{ id: number }>("/api/geo/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: competitor, siteScan: true }) }),
    onSuccess: async data => { await plan.refetch(); setComparisonId(String(data.id)); },
  });
  const reference = plan.data?.competitorPages.find(p => String(p.id) === comparisonId);
  return <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
    <SEO title="Site scan | AEO Improvement" description="Choose important pages, review site-specific improvements and follow progress." path="/site-scan" index={false} />
    <h1 className="text-3xl font-bold">Find your site's next improvements</h1>
    <p className="text-muted-foreground">Start with your homepage, then choose the pages that explain your offers, experience and expertise. Your saved findings stay available while you expand coverage.</p>
    <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); try { const u = new URL(input.includes("://") ? input : `https://${input}`); if (!/^https?:$/.test(u.protocol) || u.username || u.password) throw new Error(); setSite(u.toString()); setComparisonId(""); setError(""); } catch { setError("Enter a public website URL."); } }}>
      <Input aria-label="Your website URL" value={input} onChange={e => setInput(e.target.value)} placeholder="https://yourcompany.com" className="max-w-lg" required />
      <Button>Choose this site</Button>
    </form>
    {error && <p role="alert">{error}</p>}
    {plan.isLoading && <p role="status">Loading saved page findings...</p>}
    {plan.isError && <p role="alert">Could not load this site plan. <button className="underline" onClick={() => plan.refetch()}>Try again</button></p>}
    {plan.data && <>
      <SiteCoveragePanel key={site} siteUrl={site} history={plan.data.pages} allowRescan={plan.data.paid} />
      {!plan.data.paid && <p className="text-sm">Start with the included page discovery and your existing audit allowance. <Link href="/upgrade" className="underline">Upgrade for rescanning here, ranking context and competitor comparisons.</Link></p>}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Your next three page improvements</h2>
        <p className="text-sm text-muted-foreground">Based on saved scans, not a full-site crawl. Blocking issues come first. Fresh tracked rankings in positions 4–20 help order otherwise similar opportunities. Ranking movement does not prove causation.</p>
        {plan.data.pages.filter(p => p.next).slice(0, 3).map(p => <article key={p.id} className="rounded-xl border p-4 space-y-2">
          <p className="text-xs break-all">{p.url} · Scanned {new Date(p.createdAt).toLocaleDateString()}</p>
          <h3 className="font-semibold">{p.next!.title}</h3><p className="text-sm">{p.next!.detail}</p>
          {p.rankings.map((r, i) => <p key={i} className="text-sm">{r.keyword}: {r.position === null ? "No recorded position" : `#${r.position}`} · {r.location}, {r.device} · {r.collectedAt ? new Date(r.collectedAt).toLocaleDateString() : "Awaiting collection"}{r.stale ? " (stale or unavailable, not used for priority)" : ""}{r.resultUrl && <span className="block break-all">Ranking URL: {r.resultUrl}</span>}</p>)}
          <Link className="inline-block font-semibold text-primary underline" href={`/actions/${p.id}?task=${encodeURIComponent(p.next!.id)}#recommendations`}>Open steps and suggested edit</Link>
        </article>)}
        {!plan.data.pages.length && <p>No saved scans for this site yet. Choose pages above to build your plan.</p>}
      </section>
      <section className="space-y-3"><h2 className="text-xl font-bold">Page progress</h2>
        <p className="text-sm">Showing up to {plan.data.pageLimit} recently audited pages from your latest 500 audits. Complete tasks in the action plan, then rescan the same URL. Scores measure audit signals, not rankings.</p>
        {plan.data.pages.map(p => <div key={p.id} className="rounded-lg border p-3 flex flex-wrap justify-between gap-2"><span className="break-all">{p.url}<span className="block text-sm">Readiness {Math.round(p.geoScore)}{p.previousScore !== null ? `, previously ${Math.round(p.previousScore)}` : ", first saved baseline"} · {p.completedCount} recorded tasks</span></span><span className="flex gap-3"><Link className="underline" href={`/actions/${p.id}`}>Actions</Link><Link className="underline" href={`/seo/${p.id}`}>SEO trends</Link></span></div>)}
      </section>
      {plan.data.paid && <section className="space-y-3 rounded-xl border p-4"><h2 className="text-xl font-bold">Learn from a competitor page</h2>
        <p className="text-sm">Choose a genuinely comparable service or article page. Scan only public content you may access. Each scan uses one audit. We compare saved signals, not copy their writing or infer why they rank.</p>
        <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); scanCompetitor.mutate(); }}><Input type="url" required aria-label="Competitor page URL" placeholder="https://competitor.com/relevant-page" value={competitor} onChange={e => setCompetitor(e.target.value)} /><Button disabled={scanCompetitor.isPending}>{scanCompetitor.isPending ? "Scanning..." : "Scan competitor page (1 audit)"}</Button></form>
        {scanCompetitor.isError && <p role="alert">{scanCompetitor.error.message}</p>}
        <label className="block text-sm">Compare a saved competitor page<select className="block w-full rounded border p-2" value={comparisonId} onChange={e => setComparisonId(e.target.value)}><option value="">Choose a page</option>{plan.data.competitorPages.map(p => <option key={p.id} value={p.id}>{p.url} · {new Date(p.createdAt).toLocaleDateString()}</option>)}</select></label>
        {reference && <div className="space-y-2"><p className="text-sm break-all">Reference: {reference.url}. Scanned {new Date(reference.createdAt).toLocaleDateString()}.</p>{plan.data.pages.map(p => <div key={p.id} className="border-t pt-2 text-sm"><p className="font-semibold break-all">For {p.url}</p><p>Page titles: your page uses “{p.title || "No title detected"}”; the reference uses “{reference.title || "No title detected"}”. Check whether your title clearly answers the same buyer intent, using your own wording.</p>{!p.description && reference.description && <p>The reference has a description and yours did not. Write an accurate summary of your own offer, then recheck your page.</p>}<p>Visible words: yours {p.wordCount}, reference {reference.wordCount}. More words are not automatically better. Look for genuinely useful evidence or explanations your audience needs, not a word-count target.</p><Link className="underline" href={`/actions/${p.id}`}>Review your page's detected gaps and record changes</Link></div>)}</div>}
      </section>}
    </>}
  </div>;
}
