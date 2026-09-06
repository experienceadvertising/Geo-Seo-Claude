import * as cheerio from "cheerio";
import { safeFetch } from "./safeFetch";
import { selectImportantPages } from "./sitePageSelection";

function decodeXml(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function xmlLocations(xml: string): string[] {
  return [...xml.matchAll(/<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
}

function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex(?:\s|>)/i.test(xml);
}

export async function discoverImportantPages(siteUrl: string, limit: number): Promise<{ pages: string[]; source: "sitemap" | "homepage" }> {
  const site = new URL(siteUrl);
  const origin = `${site.protocol}//${site.host}`;
  const sitemapCandidates = new Set<string>([`${origin}/sitemap.xml`]);
  try {
    const robots = await safeFetch(`${origin}/robots.txt`, { timeoutMs: 8_000, maxBytes: 512_000 });
    if (robots.ok) {
      const text = await robots.text();
      for (const match of text.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)) sitemapCandidates.add(match[1]);
    }
  } catch { /* The default sitemap remains available as a fallback. */ }

  const pageUrls: string[] = [];
  for (const sitemapUrl of [...sitemapCandidates].slice(0, 3)) {
    try {
      const response = await safeFetch(sitemapUrl, { timeoutMs: 10_000, maxBytes: 2_000_000 });
      if (!response.ok) continue;
      const xml = await response.text();
      const locations = xmlLocations(xml);
      if (isSitemapIndex(xml)) {
        for (const child of locations.slice(0, 3)) {
          try {
            const childResponse = await safeFetch(child, { timeoutMs: 10_000, maxBytes: 2_000_000 });
            if (childResponse.ok) pageUrls.push(...xmlLocations(await childResponse.text()));
          } catch { /* Continue with the other child sitemaps. */ }
        }
      } else {
        pageUrls.push(...locations);
      }
    } catch { /* Continue to the homepage fallback. */ }
  }
  if (pageUrls.length) return { pages: selectImportantPages(pageUrls, siteUrl, limit), source: "sitemap" };

  const homepage = await safeFetch(origin, { timeoutMs: 12_000, maxBytes: 3_000_000 });
  if (!homepage.ok) return { pages: selectImportantPages([], siteUrl, limit), source: "homepage" };
  const $ = cheerio.load(await homepage.text());
  const links = $("a[href]").map((_index, element) => $(element).attr("href") || "").get();
  return { pages: selectImportantPages(links, siteUrl, limit), source: "homepage" };
}
