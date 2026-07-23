import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { BarChart3, Download, Loader2 } from "lucide-react";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";

interface BenchmarkData { sampleSize: number; averages: Record<string, number>; distribution: Array<{ label: string; count: number }> }

const LABELS: Record<string, string> = { overall: "Overall AEO", citability: "Citability", brandAuthority: "Brand authority", aiCrawlerAccess: "AI crawler access", technicalSeo: "Technical SEO", structuredData: "Schema markup", platformOptimization: "Platform readiness" };

export default function Benchmark() {
  const { data, isLoading } = useQuery<BenchmarkData>({ queryKey: ["public-benchmark"], queryFn: () => customFetch("/api/geo/public/benchmark"), staleTime: 60 * 60 * 1000 });
  function downloadSnapshot() {
    if (!data) return;
    const rows = [
      ["metric", "value"],
      ["sample_size", data.sampleSize],
      ...Object.entries(data.averages),
      ...data.distribution.map((item) => [`distribution:${item.label}`, item.count]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = "aeo-citation-readiness-benchmark-2026-07.csv";
    link.click();
    URL.revokeObjectURL(href);
  }
  return (
    <article className="flex-1 bg-white text-slate-900">
      <SEO title="2026 AI Citation Readiness Benchmark | AEO Improvement" description="An anonymized benchmark of website readiness for citations in ChatGPT and AI search, calculated from AEO Improvement audits." path="/ai-citation-readiness-benchmark" />
      <header className="border-b bg-slate-950 text-white"><div className="mx-auto max-w-4xl px-5 py-16"><p className="text-emerald-300 text-sm font-semibold">Original, anonymized audit data</p><h1 className="mt-3 text-4xl md:text-5xl font-bold">2026 AI Citation Readiness Benchmark</h1><p className="mt-5 text-slate-300 text-lg max-w-2xl">A living view of the technical and content gaps that keep websites out of AI-generated answers.</p><p className="mt-4 text-sm text-slate-400">Updated July 22, 2026. Scores are aggregated; URLs, brands, and users are never published.</p></div></header>
      <div className="mx-auto max-w-4xl px-5 py-12 space-y-12">
        {isLoading ? <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Calculating benchmark...</div> : data && data.sampleSize > 0 ? <>
          <section><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-600" /><h2 className="text-2xl font-bold">Average readiness scores</h2></div><p className="mt-2 text-sm text-slate-600">Based on {data.sampleSize.toLocaleString()} completed audits. Legacy audits without the current crawler dimension are excluded from that dimension only.</p></div><Button variant="outline" className="self-start gap-2" onClick={downloadSnapshot}><Download className="h-4 w-4" />Download CSV</Button></div><div className="mt-6 space-y-4">{Object.entries(data.averages).map(([key, value]) => <div key={key}><div className="flex justify-between text-sm mb-1"><span>{LABELS[key] ?? key}</span><strong>{Math.round(value)}/100</strong></div><div className="h-3 bg-slate-100 rounded overflow-hidden"><div className="h-full bg-emerald-600" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>)}</div></section>
          <section><h2 className="text-2xl font-bold">Overall score distribution</h2><div className="mt-5 grid sm:grid-cols-3 gap-4">{data.distribution.map((item) => <div key={item.label} className="border p-5 rounded-md"><div className="text-3xl font-bold">{item.count.toLocaleString()}</div><div className="mt-1 text-sm text-slate-600">{item.label}</div></div>)}</div></section>
        </> : <p className="text-slate-600">Benchmark collection is underway. Aggregate results will appear after the first qualifying audits are available.</p>}
        <section className="border-t pt-8"><h2 className="text-2xl font-bold">Methodology</h2><p className="mt-3 text-slate-600 leading-relaxed">The benchmark uses completed URL audits and reports arithmetic means for the current scoring dimensions. It contains no inferred traffic, ranking, or conversion data. Scores indicate citation readiness, not guaranteed inclusion in any AI answer.</p><p className="mt-3 text-sm text-slate-500">Dataset version 2026.07. The public endpoint is cached and exposes aggregate counts only.</p></section>
      </div>
    </article>
  );
}
