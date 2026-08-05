import * as cheerio from "cheerio";

export interface SnippetRestrictionSignals {
  elementCount: number;
  wordCount: number;
}

/**
 * Measure section-level data-nosnippet restrictions. Unlike a page-level
 * nosnippet directive, this attribute only hides the marked content from
 * supported search previews and AI surfaces, so it should trigger a review
 * instead of a blanket eligibility failure.
 */
export function extractDataNoSnippetSignals($: cheerio.CheerioAPI): SnippetRestrictionSignals {
  let wordCount = 0;
  let elementCount = 0;
  $("[data-nosnippet]").each((_, el) => {
    if ($(el).parents("[data-nosnippet]").length > 0) return;
    elementCount++;
    wordCount += $(el).text().trim().split(/\s+/).filter(Boolean).length;
  });
  return { elementCount, wordCount };
}
