import { csvCell } from "@/lib/worksheet-csv";
import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowDownToLine, ArrowRight, Check, RotateCcw } from "lucide-react";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import articleData from "@/data/ai-search-visibility-measurement.json";

const SITE = "https://aeoimprovement.com";
const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: articleData.title,
  description: articleData.description,
  datePublished: articleData.published,
  dateModified: articleData.published,
  author: { "@type": "Organization", name: "AEO Improvement" },
  publisher: { "@type": "Organization", name: "AEO Improvement", url: SITE },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}${articleData.path}` },
};

const breadcrumb = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Guides", path: "/what-is-answer-engine-optimization" },
  { name: articleData.title, path: articleData.path },
]);

type WorksheetValues = Record<string, string>;

function renderParagraph(paragraph: string) {
  const anchorPattern = /<a href="([^"]+)">([^<]+)<\/a>/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(paragraph)) !== null) {
    if (match.index > lastIndex) nodes.push(paragraph.slice(lastIndex, match.index));
    nodes.push(
      <Link key={`${match[1]}-${match.index}`} href={match[1]} className="font-medium text-teal-800 underline decoration-teal-300 underline-offset-4 hover:decoration-teal-700">
        {match[2]}
      </Link>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < paragraph.length) nodes.push(paragraph.slice(lastIndex));
  return nodes.length ? nodes : paragraph;
}



export default function AiSearchVisibilityMeasurement() {
  const [values, setValues] = useState<WorksheetValues>({});
  const [downloaded, setDownloaded] = useState(false);

  const setValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDownloaded(false);
  };

  const handleDownload = () => {
    const rows: string[][] = [["Group", "Field", "Source", "Baseline", "Comparison", "Value"]];
    articleData.worksheet.setupFields.forEach((field) => {
      rows.push(["Setup", field.label, "", "", "", values[`setup.${field.name}`] ?? ""]);
    });
    articleData.worksheet.signals.forEach((signal) => {
      signal.fields.forEach((field) => {
        rows.push([
          signal.title,
          field.label,
          signal.source,
          values[`${signal.id}.${field.key}.baseline`] ?? "",
          values[`${signal.id}.${field.key}.comparison`] ?? "",
          "",
        ]);
      });
    });
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ai-search-visibility-worksheet.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  };

  const handleReset = () => {
    setValues({});
    setDownloaded(false);
  };

  return (
    <>
      <SEO
        title={articleData.seoTitle}
        description={articleData.description}
        path={articleData.path}
        ogType="article"
        publishedTime={articleData.published}
        modifiedTime={articleData.published}
        authorName={articleData.byline}
        jsonLd={[articleJsonLd, breadcrumb]}
      />
      <main className="min-h-[100dvh] bg-[#f3f6f5] text-slate-800">
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
          <header className="mx-auto max-w-4xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-800">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              AEO Improvement · Measurement guide
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-[#102a3a] sm:text-5xl md:text-6xl">
              {articleData.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">{articleData.intro}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 pt-4 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{articleData.byline}</span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span>Sources reviewed {articleData.reviewed}</span>
              <time dateTime={articleData.published}>
                {new Date(`${articleData.published}T12:00:00Z`).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </time>
            </div>
          </header>

          <div className="mx-auto mt-10 max-w-7xl rounded-2xl border border-[#d9e5e1] bg-[#eaf2ef] p-5 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-800">A practical measurement map</p>
                <h2 className="mt-3 max-w-lg text-2xl font-bold tracking-tight text-[#102a3a] sm:text-3xl">
                  Four records. Four different questions.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{articleData.illustration.caption}</p>
              </div>
              <figure className="min-w-0">
                <svg
                  viewBox="0 0 740 290"
                  role="img"
                  aria-label={articleData.illustration.alt}
                  className="h-auto w-full"
                >
                  <rect x="1" y="1" width="738" height="288" rx="16" fill="#f8fbfa" stroke="#d5e3de" />
                  <rect x="24" y="20" width="692" height="34" rx="8" fill="#e7efec" />
                  <text x="42" y="42" fill="#49625f" fontSize="12" fontFamily="sans-serif" fontWeight="700" letterSpacing="1.1">SHARED CONTEXT</text>
                  <text x="205" y="42" fill="#183c45" fontSize="13" fontFamily="sans-serif" fontWeight="600">Page URL  ·  Date range  ·  Filters</text>
                  {[
                    { y: 73, n: "01", title: "Indexing", note: "Eligibility status", accent: "#587f8a" },
                    { y: 121, n: "02", title: "AI reporting", note: "Impressions / citations", accent: "#168576" },
                    { y: 169, n: "03", title: "Referral visits", note: "Sessions", accent: "#4b8c6c" },
                    { y: 217, n: "04", title: "Business outcomes", note: "Defined events", accent: "#a07946" },
                  ].map((lane) => (
                    <g key={lane.n}>
                      <rect x="24" y={lane.y} width="692" height="38" rx="9" fill="#ffffff" stroke="#e0e9e5" />
                      <rect x="24" y={lane.y} width="5" height="38" rx="2.5" fill={lane.accent} />
                      <text x="44" y={lane.y + 24} fill={lane.accent} fontSize="11" fontFamily="sans-serif" fontWeight="700">{lane.n}</text>
                      <text x="82" y={lane.y + 24} fill="#173344" fontSize="14" fontFamily="sans-serif" fontWeight="700">{lane.title}</text>
                      <path d={`M 285 ${lane.y + 19} H 376`} stroke="#b6c8c1" strokeWidth="1.5" strokeDasharray="4 5" />
                      <circle cx="392" cy={lane.y + 19} r="4" fill={lane.accent} />
                      <text x="411" y={lane.y + 24} fill="#5e716d" fontSize="12" fontFamily="sans-serif">{lane.note}</text>
                    </g>
                  ))}
                  <text x="24" y="278" fill="#526763" fontSize="11" fontFamily="sans-serif">Keep the reported units and meanings separate.</text>
                </svg>
                <figcaption className="sr-only">{articleData.illustration.caption}</figcaption>
              </figure>
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-7xl gap-12 lg:grid-cols-[220px_minmax(0,760px)] lg:justify-between">
            <aside className="space-y-8 lg:sticky lg:top-8 lg:self-start">
              <nav aria-label="Contents" className="rounded-xl border border-slate-200 bg-[#f8faf9] p-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">On this page</h2>
                <ol className="mt-4 space-y-2.5">
                  {articleData.contents.map((item, index) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        data-testid={`link-contents-${item.id}`}
                        className={`block text-sm leading-5 hover:text-teal-800 ${index === 0 ? "font-semibold text-slate-800" : "text-slate-600"}`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <aside className="border-l-2 border-emerald-600 pl-4">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-teal-800">Keep the units separate</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{articleData.takeaways[4]}</p>
              </aside>
            </aside>

            <article className="min-w-0">
              <section aria-labelledby="key-takeaways" className="rounded-2xl border border-[#d8e5df] bg-[#eaf2ed] p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-800">Field notes</p>
                <h2 id="key-takeaways" className="mt-2 text-2xl font-bold tracking-tight text-[#102a3a]">Key takeaways</h2>
                <ul className="mt-5 space-y-3">
                  {articleData.takeaways.map((takeaway) => (
                    <li key={takeaway} className="flex gap-3 text-sm leading-6 text-slate-700">
                      <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="mt-12 space-y-12">
                {articleData.sections.filter((section) => section.id !== "next-action" && section.id !== "interpretation-limits").map((section, index) => (
                  <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-8">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">Measurement note {String(index + 1).padStart(2, "0")}</p>
                    <h2 id={`${section.id}-heading`} className="mt-2 text-2xl font-bold leading-tight tracking-[-0.025em] text-[#102a3a] sm:text-3xl">
                      {section.heading}
                    </h2>
                    <div className="mt-5 space-y-4 text-base leading-7 text-slate-700">
                      {section.paragraphs.map((paragraph) => <p key={paragraph}>{renderParagraph(paragraph)}</p>)}
                    </div>
                    {section.bullets && (
                      <ul className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-[#f8faf9] p-5 sm:p-6">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 text-sm leading-6 text-slate-700">
                            <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.sourceIds.length > 0 && (
                      <p className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-5 text-slate-500">
                        <span className="font-semibold text-slate-600">Sources:</span>
                        {section.sourceIds.map((sourceId, sourceIndex) => {
                          const source = articleData.sources.find((item) => item.id === sourceId);
                          if (!source) return null;
                          return (
                            <span key={source.id}>
                              {sourceIndex > 0 ? <span aria-hidden="true"> · </span> : null}
                              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-teal-800 underline decoration-teal-300 underline-offset-2 hover:decoration-teal-800">
                                {source.label}
                              </a>
                            </span>
                          );
                        })}
                      </p>
                    )}
                  </section>
                ))}
              </div>

              <section id="worksheet" aria-labelledby="worksheet-heading" className="mt-14 scroll-mt-8 border-t border-slate-200 pt-10">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">Reusable worksheet</p>
                <h2 id="worksheet-heading" className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[#102a3a]">{articleData.contents.find((item) => item.id === "worksheet")?.label}</h2>
                <p className="mt-4 text-base leading-7 text-slate-700">{articleData.worksheet.intro}</p>

                <div className="mt-7 rounded-xl border border-slate-200 bg-[#f8faf9] p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-[#102a3a]">Comparison setup</h3>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {articleData.worksheet.setupFields.map((field) => (
                      <label key={field.name} className={`block ${field.name === "changes_notes" ? "sm:col-span-2" : ""}`}>
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}</span>
                        <textarea
                          rows={field.name === "changes_notes" ? 3 : 2}
                          value={values[`setup.${field.name}`] ?? ""}
                          onChange={(event) => setValue(`setup.${field.name}`, event.target.value)}
                          placeholder={field.placeholder}
                          data-testid={`input-worksheet-${field.name}`}
                          className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-5 text-slate-800 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {articleData.worksheet.signals.map((signal) => (
                    <fieldset key={signal.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                      <legend className="sr-only">{signal.title}</legend>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-[#102a3a]">{signal.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{signal.description}</p>
                        </div>
                        <span className="rounded-full bg-[#edf4f1] px-3 py-1 text-xs font-semibold leading-5 text-teal-900">{signal.source}</span>
                      </div>
                      <div className="mt-5 space-y-5">
                        {signal.fields.map((field) => (
                          <div key={field.key} className="border-t border-slate-100 pt-4">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <label htmlFor={`${signal.id}-${field.key}-baseline`} className="text-sm font-semibold leading-5 text-slate-700">{field.label}</label>
                              {"unit" in field && field.unit && <span className="text-xs font-medium text-slate-500">{field.unit}</span>}
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              {[
                                { period: "baseline", label: articleData.worksheet.periodLabels.baseline },
                                { period: "comparison", label: articleData.worksheet.periodLabels.comparison },
                              ].map(({ period, label }) => {
                                const key = `${signal.id}.${field.key}.${period}`;
                                const inputId = `${signal.id}-${field.key}-${period}`;
                                return (
                                  <div key={period}>
                                    <label htmlFor={inputId} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
                                    <textarea
                                      id={inputId}
                                      rows={2}
                                      value={values[key] ?? ""}
                                      onChange={(event) => setValue(key, event.target.value)}
                                      placeholder={field.placeholder}
                                      data-testid={`input-worksheet-${signal.id}-${field.key}-${period}`}
                                      className="w-full resize-y rounded-lg border border-slate-300 bg-[#fbfcfb] px-3 py-2.5 text-sm leading-5 text-slate-800 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-5 border-l-2 border-amber-500 pl-3 text-sm leading-6 text-slate-600">{signal.guardrail}</p>
                    </fieldset>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleDownload}
                    data-testid="button-download-worksheet"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
                  >
                    <ArrowDownToLine aria-hidden="true" className="h-4 w-4" />
                    {articleData.worksheet.downloadLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    data-testid="button-reset-worksheet"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
                  >
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />
                    {articleData.worksheet.resetLabel}
                  </button>
                  {downloaded && <p role="status" className="text-sm font-medium text-emerald-800">Worksheet CSV downloaded.</p>}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">The worksheet stays in this browser tab. Values are not saved or sent anywhere.</p>
              </section>

              <section id="worked-example" aria-labelledby="example-heading" className="mt-14 scroll-mt-8">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">Example</p>
                <h2 id="example-heading" className="mt-2 text-2xl font-bold tracking-tight text-[#102a3a] sm:text-3xl">{articleData.workedExample.heading}</h2>
                <p className="mt-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-950">{articleData.workedExample.notice}</p>
                <p className="mt-4 text-base leading-7 text-slate-700">{articleData.workedExample.intro}</p>
                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                      <thead className="bg-[#eaf2ef] text-xs uppercase tracking-wide text-slate-600">
                        <tr>
                          <th scope="col" className="px-4 py-3 font-bold">Metric</th>
                          <th scope="col" className="px-4 py-3 font-bold">Baseline</th>
                          <th scope="col" className="px-4 py-3 font-bold">Comparison</th>
                          <th scope="col" className="px-4 py-3 font-bold">Change</th>
                          <th scope="col" className="px-4 py-3 font-bold">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {articleData.workedExample.rows.map((row) => (
                          <tr key={row.metric} className="align-top">
                            <th scope="row" className="px-4 py-3 font-semibold text-slate-800">{row.metric}</th>
                            <td className="px-4 py-3 text-slate-700">{row.baseline}</td>
                            <td className="px-4 py-3 text-slate-700">{row.comparison}</td>
                            <td className="px-4 py-3 font-medium text-slate-700">{row.change}</td>
                            <td className="px-4 py-3 leading-6 text-slate-600">{row.interpretation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="mt-5 border-l-2 border-teal-700 pl-4 text-sm leading-7 text-slate-700">{articleData.workedExample.closing}</p>
              </section>

              {articleData.sections.filter((section) => section.id === "interpretation-limits").map((section) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="mt-14 scroll-mt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">Interpretation</p>
                  <h2 id={`${section.id}-heading`} className="mt-2 text-2xl font-bold tracking-tight text-[#102a3a] sm:text-3xl">{section.heading}</h2>
                  <div className="mt-5 space-y-4 text-base leading-7 text-slate-700">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{renderParagraph(paragraph)}</p>)}
                  </div>
                  {section.bullets && (
                    <ul className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-[#f8faf9] p-5 sm:p-6">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3 text-sm leading-6 text-slate-700">
                          <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.sourceIds.length > 0 && (
                    <p className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-5 text-slate-500">
                      <span className="font-semibold text-slate-600">Sources:</span>
                      {section.sourceIds.map((sourceId, sourceIndex) => {
                        const source = articleData.sources.find((item) => item.id === sourceId);
                        if (!source) return null;
                        return (
                          <span key={source.id}>
                            {sourceIndex > 0 ? <span aria-hidden="true"> · </span> : null}
                            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-teal-800 underline decoration-teal-300 underline-offset-2 hover:decoration-teal-800">
                              {source.label}
                            </a>
                          </span>
                        );
                      })}
                    </p>
                  )}
                </section>
              ))}

              {articleData.sections.filter((section) => section.id === "next-action").map((section) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="mt-14 scroll-mt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">From evidence to action</p>
                  <h2 id={`${section.id}-heading`} className="mt-2 text-2xl font-bold tracking-tight text-[#102a3a] sm:text-3xl">{section.heading}</h2>
                  <div className="mt-5 space-y-4 text-base leading-7 text-slate-700">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{renderParagraph(paragraph)}</p>)}
                  </div>
                  {"relatedLinks" in section && Array.isArray(section.relatedLinks) && section.relatedLinks.length > 0 && (
                    <ul className="mt-5 space-y-3">
                      {section.relatedLinks.map((item) => (
                        <li key={item.href} className="rounded-lg border border-slate-200 bg-[#f8faf9] p-4">
                          <p className="text-sm leading-6 text-slate-600">{item.context}</p>
                          <Link href={item.href} className="mt-1 inline-flex min-h-10 items-center gap-2 font-semibold text-teal-800 underline decoration-teal-300 underline-offset-4 hover:decoration-teal-800">
                            {item.label}
                            <ArrowRight aria-hidden="true" className="h-4 w-4" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              <section aria-labelledby="sources-heading" className="mt-14 border-t border-slate-200 pt-9">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">Direct references</p>
                <h2 id="sources-heading" className="mt-2 text-2xl font-bold tracking-tight text-[#102a3a]">Sources</h2>
                <ul className="mt-5 space-y-3">
                  {articleData.sources.map((source) => (
                    <li key={source.id} className="text-sm leading-6">
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-800 underline decoration-teal-300 underline-offset-4 hover:decoration-teal-800">
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              <nav aria-label="Related guides" className="mt-12 rounded-xl border border-slate-200 bg-[#f8faf9] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">Related reading</p>
                <ul className="mt-4 space-y-3">
                  {articleData.related.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} data-testid={`link-related-${item.href.split("/").pop()}`} className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-teal-800">
                        <span>{item.label}</span>
                        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <aside className="mt-10 overflow-hidden rounded-2xl border border-[#c8ddd4] bg-[#e7f1ec] p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-800">A practical next step</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#102a3a]">{articleData.callToAction.heading}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-700">{articleData.callToAction.body}</p>
                <Link href={articleData.callToAction.href} data-testid="link-contextual-audit" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2">
                  {articleData.callToAction.label}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </aside>
            </article>
          </div>
        </div>
      </main>
    </>
  );
}
