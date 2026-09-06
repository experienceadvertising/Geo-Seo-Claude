import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OFFSITE_ACTIONS } from "../../../../lib/recommendations/src/offsite";
import { customFetch } from "@workspace/api-client-react";

export function OffsiteWork({ domain }: { domain: string }) {
  const cache = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const key = ["recommendation-progress", domain];
  const progress = useQuery<{ completed: Array<{ recommendationId: string; completedAt: string; implementationNote?: string | null }> }>({ queryKey: key, queryFn: () => customFetch(`/api/geo/recommendation-progress?domain=${encodeURIComponent(domain)}`), retry: false });
  const save = useMutation({ mutationFn: (action: { recommendationId: string; completed: boolean; implementationNote?: string }) => customFetch("/api/geo/recommendation-progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain, ...action }) }), onSuccess: () => cache.invalidateQueries({ queryKey: key }) });
  return <section id="offsite-work" className="space-y-4 rounded-lg border p-5">
    <h2 className="text-xl font-semibold">Off-site work for {domain}</h2>
    <p className="text-sm text-muted-foreground">Optional strategies, not detected defects or score factors. Records apply across this site's audited pages. Completion is self-reported. No outreach is sent by this tool.</p>
    {progress.isLoading ? <p role="status">Loading recorded work...</p> : progress.isError ? <p role="alert">We could not load your work. Reload before making changes.</p> : OFFSITE_ACTIONS.map(action => {
      const recorded = progress.data?.completed.find(item => item.recommendationId === action.id);
      return <div key={action.id} className="space-y-2 border-t pt-4">
        <h3 className="font-semibold">{action.title}</h3><p className="text-sm">{action.steps}</p><p className="text-sm text-muted-foreground">Check: {action.verify}</p>
        <label className="block text-sm">Outcome, public URL, or implementation note
          <textarea aria-label={`Note for ${action.title}`} maxLength={1000} className="mt-1 block w-full rounded border bg-background p-2" value={notes[action.id] ?? recorded?.implementationNote ?? ""} onChange={event => setNotes(current => ({ ...current, [action.id]: event.target.value }))} />
        </label>
        {recorded && <p className="text-sm">Recorded {new Date(recorded.completedAt).toLocaleDateString()}. This is not independent verification of coverage or results.</p>}
        <button className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50" disabled={save.isPending} onClick={() => save.mutate({ recommendationId: action.id, completed: true, implementationNote: notes[action.id] ?? recorded?.implementationNote ?? "" })}>{recorded ? "Save updated outcome" : "Record completed step"}</button>
        {recorded && <button className="ml-3 text-sm underline" disabled={save.isPending} onClick={() => save.mutate({ recommendationId: action.id, completed: false })}>Reopen step</button>}
      </div>;
    })}
    {save.isError && <p role="alert">Your change was not saved. Please try again.</p>}
    {save.isSuccess && <p role="status">Work record updated.</p>}
  </section>;
}
