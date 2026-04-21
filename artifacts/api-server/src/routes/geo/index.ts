import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
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

const router: IRouter = Router();
router.use(simulateRouter);

router.post("/geo/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { url } = parsed.data;

  try {
    new URL(url);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  req.log.info({ url }, "Starting GEO analysis");

  try {
    const analysis = await analyzeUrl(url);

    // Generate AI insights using Claude
    let aiInsights: string | null = null;
    try {
      const prompt = `You are a GEO (Generative Engine Optimization) expert. Analyze this website audit and provide 3-4 specific, actionable insights:

URL: ${url}
Overall GEO Score: ${analysis.geoScore}/100

Scores:
- Citability: ${analysis.scores.citability}/100
- Brand Authority: ${analysis.scores.brandAuthority}/100
- Content Quality: ${analysis.scores.contentQuality}/100
- Technical SEO: ${analysis.scores.technicalSeo}/100
- Structured Data: ${analysis.scores.structuredData}/100
- Platform Optimization: ${analysis.scores.platformOptimization}/100

Key findings:
- Word count (rendered, what users see): ${analysis.wordCount}
- Word count (raw HTML, what AI crawlers see): ${analysis.rawHtmlWordCount}${analysis.requiresJavaScript ? "  ⚠ CRITICAL: Page requires JavaScript. AI crawlers without JS see almost nothing." : ""}
- HTTPS: ${analysis.hasHttps}
- Has llms.txt: ${analysis.hasLlmsTxt}
- Has canonical tags: ${analysis.hasCanonical}
- AI crawlers allowed: ${analysis.crawlers.filter(c => c.allowed).length}/${analysis.crawlers.length}
- Schema types present: ${analysis.schemaTypes.filter(s => s.present).map(s => s.type).join(", ") || "None"}
- Avg citability score: ${analysis.avgCitabilityScore}/100

Provide 3-4 specific, prioritized recommendations to improve this site's visibility in AI search engines like ChatGPT, Claude, and Perplexity. Be concrete and direct. Keep total response under 200 words.`;

      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      const block = message.content[0];
      if (block.type === "text") {
        aiInsights = block.text;
      }
    } catch (aiErr) {
      req.log.warn({ err: aiErr }, "AI insights generation failed, proceeding without");
    }

    // Store in DB
    const [audit] = await db.insert(auditsTable).values({
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

router.get("/geo/audits", async (req, res): Promise<void> => {
  const parsed = ListAuditsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

  const audits = await db.select({
    id: auditsTable.id,
    url: auditsTable.url,
    geoScore: auditsTable.geoScore,
    createdAt: auditsTable.createdAt,
  }).from(auditsTable)
    .orderBy(desc(auditsTable.createdAt))
    .limit(limit);

  res.json(audits.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  })));
});

router.get("/geo/audits/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAuditParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [audit] = await db.select().from(auditsTable).where(eq(auditsTable.id, params.data.id));
  if (!audit) {
    res.status(404).json({ error: "Audit not found" });
    return;
  }

  res.json({
    ...audit,
    createdAt: audit.createdAt.toISOString(),
  });
});

router.get("/geo/audits/:id/pdf", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAuditParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [audit] = await db.select().from(auditsTable).where(eq(auditsTable.id, params.data.id));
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
