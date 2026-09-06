import { getImplementationGuide } from "../../../../lib/recommendations/src/implementation";

export function ImplementationGuide({ id, open = false }: { id?: string; open?: boolean }) {
  const guide = getImplementationGuide(id);
  return <details open={open} className="mt-3 rounded-lg border p-3 text-sm">
    <summary className="cursor-pointer font-semibold">How to implement and verify</summary>
    <p className="mt-3"><strong>Who can help:</strong> {guide.owner}</p>
    <ol className="mt-3 list-decimal pl-5 space-y-2">{guide.steps.map(step => <li key={step}>{step}</li>)}</ol>
    <p className="mt-3"><strong>Example:</strong> {guide.example}</p>
    {guide.context && <p className="mt-3"><strong>When this applies:</strong> {guide.context}</p>}
    <p className="mt-3"><strong>Verify:</strong> {guide.verify}</p>
    <p className="mt-3 text-muted-foreground"><strong>Watch afterward:</strong> {guide.measure}</p>
    <p className="mt-3 text-muted-foreground">Implementation references: {guide.sources.map(source => <a key={source.url} className="underline mr-3" href={source.url} target="_blank" rel="noreferrer">{source.title} (reviewed {source.reviewed})</a>)}</p>
  </details>;
}
