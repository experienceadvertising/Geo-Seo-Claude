import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Link } from "wouter";

type TaskPage = { id: number; url: string; next?: { id: string; title: string; detail: string } };
export function SiteTaskQueue({ site }: { site: string }) {
  const plan = useQuery({ queryKey: ["site-plan", site], queryFn: () => customFetch<{ pages: TaskPage[] }>(`/api/geo/site-plan?url=${encodeURIComponent(site)}`), enabled: Boolean(site) });
  const tasks = plan.data?.pages.filter(page => page.next).slice(0, 3) || [];
  return <section className="space-y-3 rounded-xl border border-emerald-200 p-5" aria-label="Your next three improvements">
    <h2 className="text-xl font-bold">Start with one useful improvement</h2>
    <p className="text-sm text-muted-foreground">Your next three improvements across saved pages on this site. The same queue appears in your dashboard, Site scan and Action plan. Open a task, apply the change on your website, then record it as complete.</p>
    {plan.isLoading ? <p role="status">Finding your next tasks...</p> : plan.isError ? <p role="alert">We could not load your tasks. <button className="underline" onClick={() => plan.refetch()}>Try again</button></p> : tasks.length ? <ol className="space-y-3">{tasks.map(page => <li key={page.id} className="rounded-lg border p-4 space-y-2">
      <p className="text-xs break-all">{page.url}</p><h3 className="font-semibold">{page.next!.title}</h3><p className="text-sm">{page.next!.detail}</p>
      <Link className="inline-block font-semibold text-primary underline" href={`/actions/${page.id}?task=${encodeURIComponent(page.next!.id)}#recommendations`}>Open steps and suggested edit</Link>
    </li>)}</ol> : <p>No unfinished tasks were found in the saved page plans. Scan a page or review your recorded changes.</p>}
    <p className="text-xs text-muted-foreground">After publishing, rescan the changed page. Track search performance over time. Movement is an observation, not proof that a specific edit caused it.</p>
  </section>;
}
