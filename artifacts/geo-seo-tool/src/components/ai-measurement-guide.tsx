import { useState } from "react";
import { AI_MEASUREMENT } from "@workspace/recommendations";
import { merchantPrompts } from "@/lib/merchant-prompts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AiMeasurementGuide({ onAdd, available = 0 }: { onAdd?: (prompts: string[]) => void; available?: number }) {
  const [category, setCategory] = useState("");
  const [observation, setObservation] = useState("");
  const [notice, setNotice] = useState("");
  const proposed = merchantPrompts(category, observation);
  return <section id="ai-measurement" className="rounded-xl border p-5 space-y-3 text-sm">
    <h2 className="text-lg font-semibold">Real performance data and prompt simulations answer different questions</h2>
    <p>{AI_MEASUREMENT.simulation}</p>
    <details>
      <summary className="cursor-pointer font-medium">Sell products? Use Merchant Center insights to inform your tests</summary>
      <div className="space-y-3 pt-3">
        <p>{AI_MEASUREMENT.merchant}</p>
        <p>{AI_MEASUREMENT.limits}</p>
        <p>{AI_MEASUREMENT.workflow}</p>
        <p className="text-muted-foreground">{AI_MEASUREMENT.integration}</p>
        <a className="underline" href={AI_MEASUREMENT.sourceUrl} target="_blank" rel="noreferrer">{AI_MEASUREMENT.sourceLabel}</a>
        <p className="text-xs text-muted-foreground">Official platform guidance. Reviewed {AI_MEASUREMENT.reviewedAt}. Check Google for current availability.</p>
        {onAdd && <div className="space-y-3 border-t pt-3">
          <h3 className="font-semibold">Draft questions from an observation</h3>
          <p>Enter a product category and one relevant term or attribute you saw. Do not paste customer conversations or personal data. These fields stay in this page until you add questions. Running them uses your normal simulation allowance.</p>
          <label className="block">Product category<Input maxLength={160} value={category} onChange={e => { setCategory(e.target.value); setNotice(""); }} placeholder="Example: walking shoes" /></label>
          <label className="block">Observed term or attribute<Input maxLength={160} value={observation} onChange={e => { setObservation(e.target.value); setNotice(""); }} placeholder="Example: arch support" /></label>
          {proposed.length > 0 && <><p className="font-medium">Synthetic suggestions, not verbatim shopper queries</p><ul className="list-disc pl-5 space-y-1">{proposed.map(prompt => <li key={prompt}>{prompt}</li>)}</ul></>}
          <Button type="button" disabled={!proposed.length || available <= 0} onClick={() => { onAdd(proposed); setNotice("Questions added within your plan limit. Review and edit the prompt list before running. Existing questions were preserved."); }}>Add suggested questions</Button>
          <p className="text-xs text-muted-foreground">{Math.max(0, available)} prompt slots available. Remove an existing question if the list is full. No provider call is made by this button.</p>
          <p role="status">{notice}</p>
        </div>}
      </div>
    </details>
  </section>;
}
