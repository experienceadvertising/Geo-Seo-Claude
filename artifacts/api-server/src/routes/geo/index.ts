import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, auditsTable } from "@workspace/db";
import {
  AnalyzeUrlBody,
  ListAuditsQueryParams,
  GetAuditParams,
} from "@workspace/api-zod";
import { analyzeUrl } from "../../lib/geoAnalyzer";
import { generateAuditPdf } from "../../lib/pdfReport";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import simulateRouter from "./simulate";
import { requireAuth } from "../../middlewares/auth";
import { analyzeRateLimiter, readRateLimiter } from "../../middlewares/rateLimiters";
import { assertPublicUrl, SsrfError } from "../../lib/safeFetch";

const router: IRouter = Router();
router.use(simulateRouter);

router.post("/geo/analyze", requireAuth, analyzeRateLimiter, async (req, res): Promise<void> => {
  const parsed = AnalyzeUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { url } = parsed.data;

  try {
    await assertPublicUrl(url);
  } catch (err) {
    if (err instanceof SsrfError) {
      req.log.warn({ url, reason: err.message, userId: req.userId }, "Blocked URL");
    }
    res.status(400).json({ error: "URL must be a publicly reachable http(s) address." });
    return;
  }

  req.log.info({ url, userId: req.userId }, "Starting GEO analysis");

  try {
    const analysis = await analyzeUrl(url);

    let aiInsights: string | null = null;
    try {
      const brand = analysis.brandName || (() => {
        try { return new URL(url).hostname.replace(/^www\./, "").split(".")[0]; } catch { return "this site"; }
      })();
      const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();

      const topRecs = analysis.recommendations
        .filter((r) => r.priority === "critical" || r.priority === "high")
        .slice(0, 6)
        .map((r, i) => `${i + 1}. [${r.priority.toUpperCase()}] ${r.title} — ${r.detail}`)
        .join("\n");

      const headingsList = (analysis.topHeadings ?? []).slice(0, 8).map((h) => `  • ${h}`).join("\n") || "  (no headings detected)";

      const brandAuthLines = analysis.brandSignals
        .map((s) => `  • ${s.platform}: ${s.found ? `FOUND${s.detail ? ` (${s.detail})` : ""}` : "not found"}`)
        .join("\n");

      const presentSchemas = analysis.schemaTypes.filter((s) => s.present).map((s) => s.type);
      const missingImportantSchemas = ["Organization", "Article", "FAQPage", "BreadcrumbList", "Product"]
        .filter((t) => !presentSchemas.includes(t));

      const blockedCrawlers = analysis.crawlers.filter((c) => !c.allowed).map((c) => c.name);

      const wins: string[] = [];
      if (analysis.scores.citability >= 70) wins.push(`citability score is strong (${analysis.scores.citability}/100)`);
      if (analysis.scores.technicalSeo >= 80) wins.push("technical SEO foundation is solid");
      if (analysis.scores.structuredData >= 70) wins.push("structured data is in good shape");
      if (analysis.scores.brandAuthority >= 70) wins.push(`${brand} already has measurable brand authority signals`);
      if (analysis.crawlers.every((c) => c.allowed)) wins.push("all major AI crawlers are allowed");
      if (!analysis.requiresJavaScript) wins.push("content is server-rendered (AI crawlers can read it)");

      const prompt = `You are a senior Generative Engine Optimization (GEO) consultant writing a personalized briefing for ${brand} on the page at ${url}.

Your job: write 4-5 highly specific, actionable recommendations that reference ${brand} by name and reference the actual content, headings, or signals below. Avoid generic platitudes — every recommendation must be something the ${brand} team could implement on THIS page this week.

=== PAGE CONTEXT ===
Brand / company: ${brand}
URL: ${url}
Domain: ${hostname}
Page title: ${analysis.title || "(no title)"}
Meta description: ${analysis.description || "(no description)"}
Word count (rendered): ${analysis.wordCount} | Word count (raw HTML, what crawlers see): ${analysis.rawHtmlWordCount}${analysis.requiresJavaScript ? " — ⚠ JS-DEPENDENT, crawlers see almost nothing" : ""}

Top headings on the page:
${headingsList}

First ~1500 chars of visible content:
"""
${analysis.pageExcerpt || "(no content extracted)"}
"""

=== AI VISIBILITY SIGNALS ===
Overall GEO score: ${analysis.geoScore}/100
Citability ${analysis.scores.citability}/100 · Brand Authority ${analysis.scores.brandAuthority}/100 · Content Quality ${analysis.scores.contentQuality}/100 · Technical SEO ${analysis.scores.technicalSeo}/100 · Structured Data ${analysis.scores.structuredData}/100 · Platform Optimization ${analysis.scores.platformOptimization}/100

Brand authority footprint for "${brand}":
${brandAuthLines || "  (no signals checked)"}

Schema present: ${presentSchemas.join(", ") || "none"}
Schema missing (high-impact): ${missingImportantSchemas.join(", ") || "none"}
Blocked AI crawlers: ${blockedCrawlers.join(", ") || "none"}
Has llms.txt: ${analysis.hasLlmsTxt} · HTTPS: ${analysis.hasHttps} · Canonical: ${analysis.hasCanonical}

What's already working: ${wins.join("; ") || "limited bright spots — focus on fundamentals"}

=== TOP RULE-BASED FINDINGS (don't just repeat — build on these with company-specific advice) ===
${topRecs || "(no critical/high findings — focus on advanced GEO tactics)"}

=== INSTRUCTIONS ===
Write a briefing in this exact markdown structure:

**Executive summary**
2-3 sentences naming ${brand} explicitly, stating the single biggest opportunity for this specific page given what it appears to be about (infer from title, headings, content excerpt).

**Top recommendations**
4-5 numbered recommendations. Each must:
- Start with a bold one-line action ("**1. Add a comparison table of ${brand} vs. [likely competitors]**")
- Reference something concrete from the page (a heading you saw, the topic, the brand, the missing schema, the JS-rendering issue, etc.)
- Give 1-2 sentences of "how to do it on this page" — no generic theory
- End with the expected impact in plain language

**Quick wins this week**
3 bullets — fastest things ${brand} can ship in <1 day each.

Hard rules:
- Mention "${brand}" by name in at least 3 places
- Reference at least 2 specific headings or phrases from the actual page content above
- No filler ("In today's AI landscape..." etc.) — every sentence has a fact or instruction
- Total length 350-500 words
- NEVER recommend something that is already confirmed satisfied above (e.g. if Has llms.txt: true, do NOT suggest creating llms.txt; if no blocked crawlers, do NOT suggest unblocking them; if HTTPS is true, do NOT mention HTTPS)`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const block = message.content[0];
      if (block.type === "text") {
        aiInsights = block.text;
      }
    } catch (aiErr) {
      req.log.warn({ err: aiErr }, "AI insights generation failed, proceeding without");
    }

    const [audit] = await db.insert(auditsTable).values({
      userId: req.userId!,
      url: analysis.url,
      title: analysis.title,
      description: analysis.description,
      geoScore: analysis.geoScore,
      scores: analysis.scores,
      crawlers: analysis.crawlers,
      citabilityBlocks: analysis.citabilityBlocks,
      avgCitabilityScore: analysis.avgCitabilityScore,
      schemaTypes: analysis.schemaTypes,
      platforms: analysis.platforms,
      quickWins: analysis.quickWins,
      technicalIssues: analysis.technicalIssues,
      hasLlmsTxt: analysis.hasLlmsTxt,
      hasHttps: analysis.hasHttps,
      hasCanonical: analysis.hasCanonical,
      wordCount: analysis.wordCount,
      rawHtmlWordCount: analysis.rawHtmlWordCount,
      renderedWordCount: analysis.renderedWordCount,
      requiresJavaScript: analysis.requiresJavaScript,
      renderedSuccessfully: analysis.renderedSuccessfully,
      aiInsights,
      brandName: analysis.brandName,
      brandSignals: analysis.brandSignals,
      recommendations: analysis.recommendations,
    }).returning();

    res.json({
      ...analysis,
      id: audit.id,
      createdAt: audit.createdAt.toISOString(),
      aiInsights,
    });
  } catch (err) {
    req.log.error({ err }, "GEO analysis failed");
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

router.get("/geo/audits", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const parsed = ListAuditsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

  const audits = await db.select({
    id: auditsTable.id,
    url: auditsTable.url,
    geoScore: auditsTable.geoScore,
    createdAt: auditsTable.createdAt,
  }).from(auditsTable)
    .where(eq(auditsTable.userId, req.userId!))
    .orderBy(desc(auditsTable.createdAt))
    .limit(limit);

  res.json(audits.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  })));
});

router.get("/geo/audits/:id", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAuditParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [audit] = await db.select().from(auditsTable).where(
    and(eq(auditsTable.id, params.data.id), eq(auditsTable.userId, req.userId!))
  );
  if (!audit) {
    res.status(404).json({ error: "Audit not found" });
    return;
  }

  res.json({
    ...audit,
    createdAt: audit.createdAt.toISOString(),
  });
});

router.get("/geo/audits/:id/pdf", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAuditParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [audit] = await db.select().from(auditsTable).where(
    and(eq(auditsTable.id, params.data.id), eq(auditsTable.userId, req.userId!))
  );
  if (!audit) {
    res.status(404).json({ error: "Audit not found" });
    return;
  }

  const safeHost = (() => {
    try { return new URL(audit.url).hostname.replace(/[^a-z0-9.-]/gi, "_"); } catch { return "audit"; }
  })();

  try {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="geo-audit-${safeHost}-${audit.id}.pdf"`);
    res.on("error", (err) => req.log.error({ err, auditId: audit.id }, "PDF response stream error"));
    await generateAuditPdf(audit, res);
  } catch (err) {
    req.log.error({ err, auditId: audit.id }, "PDF generation failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF" });
    } else {
      res.destroy();
    }
  }
});

export default router;
