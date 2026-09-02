import { db, auditsTable } from "@workspace/db";
import { analyzeUrl, type AnalysisResult } from "./geoAnalyzer";

export interface StoredAudit {
  id: number;
  geoScore: number;
  analysis: AnalysisResult;
}

/**
 * Run a full GEO audit for `url` and persist it for `userId`, returning the
 * stored row id + score. This is the shared path used by scheduled re-audits
 * (the monitored-sites scheduler) so they produce exactly the same audit
 * artifact a manual run does.
 *
 * Scheduled runs intentionally skip the LLM "AI insights" generation that the
 * interactive /geo/analyze route does — it adds a per-run model cost and isn't
 * needed for trend tracking. The rule-based recommendations are still stored.
 */
export async function runAndStoreAudit(userId: string, url: string): Promise<StoredAudit> {
  const analysis = await analyzeUrl(url);

  const [audit] = await db.insert(auditsTable).values({
    userId,
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
    hasNoSnippet: analysis.hasNoSnippet,
    wordCount: analysis.wordCount,
    rawHtmlWordCount: analysis.rawHtmlWordCount,
    renderedWordCount: analysis.renderedWordCount,
    requiresJavaScript: analysis.requiresJavaScript,
    renderedSuccessfully: analysis.renderedSuccessfully,
    aiInsights: null,
    brandName: analysis.brandName,
    brandSignals: analysis.brandSignals,
    recommendations: analysis.recommendations,
  }).returning();

  return { id: audit.id, geoScore: analysis.geoScore, analysis };
}
