import PDFDocument from "pdfkit";
import type { Writable } from "node:stream";

interface AuditRow {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  geoScore: number;
  scores: unknown;
  crawlers: unknown;
  citabilityBlocks: unknown;
  avgCitabilityScore: number;
  schemaTypes: unknown;
  platforms: unknown;
  quickWins: unknown;
  technicalIssues: unknown;
  hasLlmsTxt: boolean;
  hasHttps: boolean;
  hasCanonical: boolean;
  wordCount: number;
  aiInsights: string | null;
  brandName: string | null;
  brandSignals: unknown;
  recommendations?: unknown;
  createdAt: Date;
}

interface Scores {
  citability: number;
  brandAuthority: number;
  contentQuality: number;
  technicalSeo: number;
  structuredData: number;
  platformOptimization: number;
}

interface Crawler { name: string; allowed: boolean; type: string }
interface Schema { type: string; present: boolean }
interface Platform { platform: string; score: number; status: string; recommendations: string[] }
interface CitBlock { heading: string | null; wordCount: number; score: number; grade: string; preview: string }
interface BrandSignal { source: string; found: boolean; detail: string | null; state?: string }

type RecSourceType = "research" | "internal_benchmark" | "practitioner_consensus";
interface RecSource {
  type: RecSourceType;
  url: string | null;
  citation: string;
  verified: boolean;
  lastVerifiedAt: string | null;
  notes?: string;
}
interface ExpectedLift {
  kind: "percent" | "multiplier" | "positions";
  value: number;
  range?: [number, number];
}
interface GeoRec {
  id: string;
  title: string;
  detail: string;
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  impact: string;
  /** Present only on v1 audits (audits generated after source-tracking shipped). */
  source?: RecSource;
  /** Explicitly null when no defensible precise number exists for this rec. Absent on legacy. */
  expectedLift?: ExpectedLift | null;
}

const COLORS = {
  primary: "#0d9488",
  ink: "#0f172a",
  muted: "#64748b",
  good: "#16a34a",
  warn: "#d97706",
  bad: "#dc2626",
  border: "#e2e8f0",
};

function scoreColor(score: number): string {
  if (score >= 80) return COLORS.good;
  if (score >= 60) return COLORS.warn;
  return COLORS.bad;
}

function sectionHeader(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.8);
  doc.fillColor(COLORS.ink).fontSize(14).font("Helvetica-Bold").text(text);
  doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
    .strokeColor(COLORS.border).lineWidth(1).stroke();
  doc.moveDown(0.5);
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function asObj<T>(v: unknown, fallback: T): T {
  return v && typeof v === "object" ? (v as T) : fallback;
}

/** Lowercase only the hostname; keep path/query/scheme casing. */
function displayUrl(u: string): string {
  try { const p = new URL(u); p.hostname = p.hostname.toLowerCase(); return p.toString(); }
  catch { return u.replace(/^(https?:\/\/)([^/]+)/i, (_, s, h) => s + h.toLowerCase()); }
}

export function generateAuditPdf(audit: AuditRow, stream: Writable): Promise<void> {
  return new Promise<void>((resolve, reject) => {
  const displayedUrl = displayUrl(audit.url);
  const doc = new PDFDocument({ size: "LETTER", margin: 50, bufferPages: true, info: {
    Title: `GEO Audit – ${displayedUrl}`,
    Author: "GEO SEO Analyzer",
  }});
  doc.on("error", reject);
  stream.on("error", reject);
  stream.on("finish", () => resolve());
  stream.on("close", () => resolve());
  doc.pipe(stream);
  try {

  // Header
  doc.fillColor(COLORS.primary).fontSize(10).font("Helvetica-Bold").text("GEO SEO ANALYZER", { characterSpacing: 2 });
  doc.moveDown(0.2);
  doc.fillColor(COLORS.ink).fontSize(22).font("Helvetica-Bold").text("Generative Engine Optimization Audit");
  doc.moveDown(0.3);
  doc.fillColor(COLORS.muted).fontSize(10).font("Helvetica")
    .text(`URL: ${displayedUrl}`)
    .text(`Audited: ${audit.createdAt.toUTCString()}`)
    .text(`Audit ID: #${audit.id}${audit.brandName ? `   ·   Brand: ${audit.brandName}` : ""}`);

  // Hero score
  doc.moveDown(1);
  const heroY = doc.y;
  const scoreColorHex = scoreColor(audit.geoScore);
  doc.roundedRect(50, heroY, 130, 110, 8).fillAndStroke(scoreColorHex, scoreColorHex);
  doc.fillColor("white").fontSize(48).font("Helvetica-Bold").text(String(Math.round(audit.geoScore)), 50, heroY + 22, { width: 130, align: "center" });
  doc.fontSize(10).font("Helvetica").text("/ 100", 50, heroY + 78, { width: 130, align: "center" });

  // Scores breakdown beside hero
  const scores = asObj<Scores>(audit.scores, {
    citability: 0, brandAuthority: 0, contentQuality: 0,
    technicalSeo: 0, structuredData: 0, platformOptimization: 0,
  });
  const items: Array<[string, number, number]> = [
    ["Citability", scores.citability, 25],
    ["Brand Authority", scores.brandAuthority, 20],
    ["Content Quality", scores.contentQuality, 20],
    ["Technical SEO", scores.technicalSeo, 15],
    ["Structured Data", scores.structuredData, 10],
    ["Platform Opt.", scores.platformOptimization, 10],
  ];
  let by = heroY + 4;
  const bx = 200;
  const bw = doc.page.width - bx - 50;
  for (const [name, score, weight] of items) {
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(9).text(name, bx, by, { width: bw - 60, continued: true });
    doc.fillColor(COLORS.muted).font("Helvetica").text(`  (${weight}%)`, { continued: false });
    doc.fillColor(scoreColor(score)).font("Helvetica-Bold").fontSize(10).text(`${Math.round(score)}/100`, bx + bw - 50, by, { width: 50, align: "right" });
    // bar
    const barY = by + 14;
    doc.roundedRect(bx, barY, bw, 4, 2).fillColor(COLORS.border).fill();
    doc.roundedRect(bx, barY, bw * (score / 100), 4, 2).fillColor(scoreColor(score)).fill();
    by += 24;
  }
  doc.y = Math.max(heroY + 120, by + 10);

  // Page meta
  if (audit.title) {
    doc.moveDown(0.5);
    doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica-Bold").text("PAGE TITLE");
    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(10).text(audit.title);
  }
  if (audit.description) {
    doc.moveDown(0.3);
    doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica-Bold").text("META DESCRIPTION");
    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(10).text(audit.description);
  }

  // Tech facts row
  doc.moveDown(0.5);
  const facts = [
    ["HTTPS", audit.hasHttps ? "Yes" : "No", audit.hasHttps],
    ["Canonical Tag", audit.hasCanonical ? "Yes" : "No", audit.hasCanonical],
    ["llms.txt", audit.hasLlmsTxt ? "Yes" : "No", audit.hasLlmsTxt],
    ["Word Count", String(audit.wordCount), audit.wordCount > 300],
    ["Avg Citability", String(audit.avgCitabilityScore), audit.avgCitabilityScore >= 50],
  ];
  const factW = (doc.page.width - 100) / facts.length;
  const factY = doc.y;
  facts.forEach(([label, value, ok], i) => {
    const x = 50 + i * factW;
    doc.roundedRect(x + 4, factY, factW - 8, 40, 6).fillColor("#f8fafc").fill();
    doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica-Bold").text(String(label).toUpperCase(), x + 4, factY + 7, { width: factW - 8, align: "center", characterSpacing: 1 });
    doc.fillColor(ok ? COLORS.good : COLORS.bad).fontSize(13).font("Helvetica-Bold").text(String(value), x + 4, factY + 20, { width: factW - 8, align: "center" });
  });
  doc.y = factY + 50;

  // AI Crawlers
  sectionHeader(doc, "AI Crawler Access");
  const crawlers = asArray<Crawler>(audit.crawlers);
  doc.fontSize(10).font("Helvetica");
  for (const c of crawlers) {
    const y = doc.y;
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").text(String(c.name ?? "Crawler"), 60, y, { continued: true });
    doc.fillColor(COLORS.muted).font("Helvetica").text(`  ${c.type}`, { continued: false });
    doc.fillColor(c.allowed ? COLORS.good : COLORS.bad).font("Helvetica-Bold").fontSize(9)
      .text(c.allowed ? "ALLOWED" : "BLOCKED", 50, y, { width: doc.page.width - 100, align: "right" });
    doc.fontSize(10);
    doc.moveDown(0.2);
  }

  // Brand authority
  const signals = asArray<BrandSignal>(audit.brandSignals);
  if (signals.length > 0) {
    sectionHeader(doc, `Brand Authority Signals${audit.brandName ? ` — ${audit.brandName}` : ""}`);
    for (const s of signals) {
      const y = doc.y;
      const state = s.state ?? (s.found ? "found" : "not_found");
      const label = state === "found" ? "FOUND" : state === "unavailable" ? "N/A" : "NONE";
      const color = state === "found" ? COLORS.good : state === "unavailable" ? COLORS.warn : COLORS.muted;
      doc.fillColor(color).fontSize(10).font("Helvetica-Bold").text(label, 50, y, { width: 60 });
      doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(10).text(String(s.source ?? ""), 115, y, { width: 130, continued: false });
      doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text(s.detail || "—", 245, y, { width: doc.page.width - 295 });
      doc.moveDown(0.4);
    }
  }

  // GEO Recommendations — each labeled with its source. For research +
  // internal_benchmark recs we render the citation inline (academic-paper
  // style); for practitioner_consensus we show a short [industry consensus]
  // tag inline and aggregate citations into a numbered footnotes section at
  // the end of the recommendations block, to keep visual noise low.
  const recs = asArray<GeoRec>(audit.recommendations);
  if (recs.length > 0) {
    if (doc.y > doc.page.height - 250) doc.addPage();
    sectionHeader(doc, "Prioritized GEO Recommendations");
    doc.fontSize(8).fillColor(COLORS.muted).font("Helvetica-Oblique")
      .text("Each recommendation is labeled with its source — peer-reviewed research, internal benchmark, or practitioner consensus. Apply top items first.");

    // Detect v1 schema (any rec carries a `source` field). Same .some() check
    // the API uses to compute recommendationsSchemaVersion. Mirrored on the
    // web client so the user sees one consistent legacy notice across formats.
    const isV1 = recs.some((r) => r && typeof r === "object" && r.source != null);
    if (!isV1) {
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor(COLORS.warn).font("Helvetica-Oblique")
        .text("This audit was generated before our source-tracking system was added. Re-scan to see updated provenance metadata.");
    }
    doc.moveDown(0.4);

    // Collect practitioner_consensus citations as we render — emit numbered
    // footnotes after the rec list. Map citation→footnote index so the same
    // citation isn't repeated.
    const footnoteIndexByCitation = new Map<string, number>();
    const footnotes: Array<{ n: number; citation: string; url: string | null }> = [];

    for (const r of recs.slice(0, 12)) {
      if (doc.y > doc.page.height - 110) doc.addPage();
      const y = doc.y;
      const pColor = r.priority === "critical" ? COLORS.bad
        : r.priority === "high" ? COLORS.warn
        : r.priority === "medium" ? COLORS.primary
        : COLORS.muted;
      doc.roundedRect(50, y, 58, 14, 3).fillAndStroke(pColor, pColor);
      doc.fillColor("white").fontSize(8).font("Helvetica-Bold")
        .text(String(r.priority ?? "").toUpperCase(), 50, y + 3, { width: 58, align: "center" });

      // Title is always rendered cleanly in bold — NO source suffix mixed in.
      // Source attribution is a separate muted/italic 8pt line below, so the
      // visual hierarchy makes practitioner_consensus clearly lighter than
      // the bold title (architect fix: previously the [industry consensus]
      // tag inherited the bold title font, defeating the lightness intent).
      doc.fillColor(COLORS.ink).fontSize(11).font("Helvetica-Bold")
        .text(String(r.title ?? ""), 116, y, { width: doc.page.width - 166 });

      doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica-Oblique")
        .text(`${String(r.category ?? "")} · ${String(r.impact ?? "")}`, 116, doc.y, { width: doc.page.width - 166 });
      doc.fillColor(COLORS.ink).fontSize(9).font("Helvetica")
        .text(String(r.detail ?? ""), 116, doc.y + 2, { width: doc.page.width - 166, lineGap: 1 });

      // Source-attribution line. Always muted, oblique, 8pt — lighter than
      // both the bold title and the regular-weight detail body.
      const src = r.source;
      if (src) {
        if (src.type === "practitioner_consensus") {
          // Reuse footnote index if this citation has already been numbered,
          // so the same source isn't repeated in the footnotes block.
          let n = footnoteIndexByCitation.get(src.citation) ?? null;
          if (n === null) {
            n = footnotes.length + 1;
            footnoteIndexByCitation.set(src.citation, n);
            footnotes.push({ n, citation: src.citation, url: src.url });
          }
          doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica-Oblique")
            .text(`[industry consensus ${n}]`, 116, doc.y + 2, { width: doc.page.width - 166 });
        } else {
          // research (verified or pending) and internal_benchmark — render
          // the citation inline. Pending-verification gets an explicit flag.
          const flag = src.type === "research" && !src.verified
            ? " · pending verification"
            : "";
          const verifiedTag = src.verified && src.lastVerifiedAt
            ? `  ✓ verified ${src.lastVerifiedAt}`
            : "";
          doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica-Oblique")
            .text(`Source${flag}: ${src.citation}${verifiedTag}`, 116, doc.y + 2, { width: doc.page.width - 166 });
        }
      }
      doc.moveDown(0.5);
    }

    // Numbered practitioner_consensus footnotes.
    if (footnotes.length > 0) {
      if (doc.y > doc.page.height - 100) doc.addPage();
      doc.moveDown(0.3);
      doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica-Bold").text("INDUSTRY-CONSENSUS CITATIONS", 50, doc.y, { characterSpacing: 1 });
      doc.moveDown(0.2);
      for (const fn of footnotes) {
        doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica")
          .text(`${fn.n}. ${fn.citation}${fn.url ? ` — ${fn.url}` : ""}`, 50, doc.y, { width: doc.page.width - 100, lineGap: 1 });
      }
    }
  }

  // Quick wins
  const quickWins = asArray<string>(audit.quickWins);
  if (quickWins?.length) {
    if (doc.y > doc.page.height - 200) doc.addPage();
    sectionHeader(doc, "Quick Wins");
    doc.fontSize(10).font("Helvetica").fillColor(COLORS.ink);
    quickWins.forEach((w, i) => {
      doc.fillColor(COLORS.primary).font("Helvetica-Bold").text(`${i + 1}.`, 50, doc.y, { width: 18, continued: true });
      doc.fillColor(COLORS.ink).font("Helvetica").text(` ${w}`);
      doc.moveDown(0.2);
    });
  }

  // Technical issues
  const issues = asArray<string>(audit.technicalIssues);
  if (issues?.length) {
    if (doc.y > doc.page.height - 200) doc.addPage();
    sectionHeader(doc, "Technical Issues");
    doc.fontSize(10).font("Helvetica");
    issues.forEach((iss) => {
      doc.fillColor(COLORS.bad).font("Helvetica-Bold").text("•", 50, doc.y, { width: 14, continued: true });
      doc.fillColor(COLORS.ink).font("Helvetica").text(` ${iss}`);
      doc.moveDown(0.2);
    });
  }

  // Platforms
  const platforms = asArray<Platform>(audit.platforms);
  if (platforms?.length) {
    if (doc.y > doc.page.height - 250) doc.addPage();
    sectionHeader(doc, "Platform Optimization");
    for (const p of platforms) {
      const y = doc.y;
      const score = Number.isFinite(p.score) ? p.score : 0;
      doc.fillColor(COLORS.ink).fontSize(11).font("Helvetica-Bold").text(String(p.platform ?? "Platform"), 50, y, { continued: true });
      doc.fillColor(scoreColor(score)).text(`   ${Math.round(score)}/100`, { continued: true });
      doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica").text(`   ${p.status ?? ""}`);
      doc.moveDown(0.2);
      asArray<string>(p.recommendations).forEach((rec) => {
        doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica").text(`  · ${String(rec)}`, 60);
      });
      doc.moveDown(0.4);
    }
  }

  // Schemas
  const schemas = asArray<Schema>(audit.schemaTypes);
  if (schemas?.length) {
    if (doc.y > doc.page.height - 150) doc.addPage();
    sectionHeader(doc, "Structured Data");
    doc.fontSize(10).font("Helvetica");
    const present = schemas.filter((s) => s.present).map((s) => s.type);
    const missing = schemas.filter((s) => !s.present).map((s) => s.type);
    doc.fillColor(COLORS.good).font("Helvetica-Bold").text("Detected: ", { continued: true });
    doc.fillColor(COLORS.ink).font("Helvetica").text(present.length ? present.join(", ") : "None");
    doc.moveDown(0.2);
    doc.fillColor(COLORS.muted).font("Helvetica-Bold").text("Missing: ", { continued: true });
    doc.fillColor(COLORS.ink).font("Helvetica").text(missing.length ? missing.join(", ") : "None");
  }

  // Citability blocks
  const blocks = asArray<CitBlock>(audit.citabilityBlocks);
  if (blocks?.length) {
    if (doc.y > doc.page.height - 200) doc.addPage();
    sectionHeader(doc, "Top Citability Passages");
    doc.fontSize(9).font("Helvetica");
    blocks.slice(0, 6).forEach((b) => {
      const y = doc.y;
      doc.fillColor(scoreColor(b.score)).font("Helvetica-Bold").fontSize(11).text(b.grade, 50, y, { width: 18 });
      doc.fillColor(COLORS.ink).fontSize(9).font("Helvetica-Bold").text(b.heading || "Untitled section", 70, y, { width: doc.page.width - 170, continued: false });
      doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica").text(`${b.wordCount} words · score ${b.score}`, doc.page.width - 150, y, { width: 100, align: "right" });
      doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica").text(b.preview, 70);
      doc.moveDown(0.4);
    });
  }

  // AI Insights
  if (audit.aiInsights) {
    if (doc.y > doc.page.height - 200) doc.addPage();
    sectionHeader(doc, "AI-Generated Insights");
    doc.fillColor(COLORS.ink).fontSize(10).font("Helvetica").text(audit.aiInsights, { lineGap: 2 });
  }

  // Footer on all pages
  const pages = doc.bufferedPageRange ? doc.bufferedPageRange() : { start: 0, count: 1 };
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica")
      .text(`GEO SEO Analyzer · Audit #${audit.id} · Page ${i + 1}`, 50, doc.page.height - 35, { width: doc.page.width - 100, align: "center" });
  }

  doc.end();
  } catch (err) {
    reject(err);
  }
  });
}
