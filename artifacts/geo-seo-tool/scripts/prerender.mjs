// Postbuild prerender step.
//
// Vite produces a single dist/public/index.html. Without this step every
// route serves identical HTML to non-JS crawlers (GPTBot, ClaudeBot,
// PerplexityBot, OAI-SearchBot, Bytespider, CCBot, etc.) — they see the
// homepage's title/meta/canonical/JSON-LD on /pricing, /vs/profound, every
// guide. That folds them into the homepage from a search-engine standpoint
// and is the single largest LLM-discoverability bug a Vite SPA ships with.
//
// This script reads the built index.html shell and, for each entry in
// scripts/seo-manifest.mjs, writes dist/public/<route> with the
// route-specific <title>, meta description, canonical, OpenGraph, Twitter
// Card, and JSON-LD blocks substituted in. The body still loads the React
// SPA bundle, so users get full client-side interactivity once JS executes.
//
// Replit static hosting matches an extensionless file before its SPA fallback,
// so /pricing → dist/public/pricing. Local Vite preview has a matching
// middleware rule so the same public HTML is served in both environments.

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { brotliCompress, gzip, constants as zlibConstants } from "node:zlib";
import { ROUTES, SITE_ORIGIN } from "./seo-manifest.mjs";
import { bootHead, bootStatus } from "./boot-shell.mjs";
import { releases, renderReleaseNotes } from "./changelog-content.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist", "public");
const SHELL_PATH = join(DIST, "index.html");
const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

async function writeCompressedAssets(dir) {
  let count = 0;
  for (const entry of await readdir(dir)) {
    const file = join(dir, entry);
    const info = await stat(file);
    if (info.isDirectory()) {
      count += await writeCompressedAssets(file);
      continue;
    }
    if (info.size < 1024 || !/\.(?:js|css|html|svg|json|xml|txt)$/i.test(entry)) continue;
    const source = await readFile(file);
    const [gz, br] = await Promise.all([
      gzipAsync(source, { level: 9 }),
      brotliAsync(source, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 } }),
    ]);
    await Promise.all([writeFile(`${file}.gz`, gz), writeFile(`${file}.br`, br)]);
    count++;
  }
  return count;
}

function escapeHtmlAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// JSON-LD must not contain a literal "</script" — the browser parser will
// terminate the script tag early. Escape the slash.
function safeJson(obj) {
  return JSON.stringify(obj).replace(/<\/script/gi, "<\\/script");
}

function buildHeadInjection(route) {
  const canonical = `${SITE_ORIGIN}${route.path === "/" ? "/" : route.path}`;
  const ogImage = route.ogImage ?? `${SITE_ORIGIN}/opengraph.jpg`;
  const ogType = route.ogType ?? "website";

  const lines = [
    `<title data-shell>${escapeHtmlText(route.title)}</title>`,
    `<meta data-shell name="description" content="${escapeHtmlAttr(route.description)}" />`,
    `<link data-shell rel="canonical" href="${escapeHtmlAttr(canonical)}" />`,
    `<meta data-shell property="og:type" content="${ogType}" />`,
    `<meta data-shell property="og:url" content="${escapeHtmlAttr(canonical)}" />`,
    `<meta data-shell property="og:title" content="${escapeHtmlAttr(route.title)}" />`,
    `<meta data-shell property="og:description" content="${escapeHtmlAttr(route.description)}" />`,
    `<meta data-shell property="og:image" content="${ogImage}" />`,
    `<meta data-shell property="og:image:width" content="1280" />`,
    `<meta data-shell property="og:image:height" content="720" />`,
    `<meta data-shell property="og:site_name" content="AEO Improvement" />`,
    `<meta data-shell property="og:locale" content="en_US" />`,
    `<meta data-shell name="twitter:card" content="summary_large_image" />`,
    `<meta data-shell name="twitter:title" content="${escapeHtmlAttr(route.title)}" />`,
    `<meta data-shell name="twitter:description" content="${escapeHtmlAttr(route.description)}" />`,
    `<meta data-shell name="twitter:image" content="${ogImage}" />`,
  ];

  if (ogType === "article") {
    if (route.publishedTime) {
      lines.push(
        `<meta data-shell property="article:published_time" content="${escapeHtmlAttr(route.publishedTime)}" />`,
      );
    }
    if (route.modifiedTime) {
      lines.push(
        `<meta data-shell property="article:modified_time" content="${escapeHtmlAttr(route.modifiedTime)}" />`,
      );
    }
    if (route.authorName) {
      lines.push(
        `<meta data-shell property="article:author" content="${escapeHtmlAttr(route.authorName)}" />`,
      );
    }
  }

  for (const ld of route.jsonLd ?? []) {
    lines.push(
      `<script type="application/ld+json">${safeJson(ld)}</script>`,
    );
  }

  return lines.join("\n    ");
}

function buildStaticContent(route) {
  if (route.path === "/changelog") {
    return `<main data-static-route="/changelog" style="max-width:900px;margin:auto;padding:48px 24px;font-family:system-ui,sans-serif;line-height:1.65"><h1>${escapeHtmlText(releases.heading)}</h1><p>${escapeHtmlText(releases.description)}</p><p>Latest release: ${releases.entries[0].isoDate}</p><p>${escapeHtmlText(releases.archiveNote)}</p>${renderReleaseNotes()}<p><a href="/sign-up">Start your guided trial</a> · <a href="/pricing">Compare current plans</a></p></main>`;
  }
  const title = escapeHtmlText(route.title);
  const heading = escapeHtmlText(route.h1 || route.title);
  const description = escapeHtmlText(route.description);
  const sections = (route.staticSections || []).map(({ heading: sectionHeading, body }) => (
    `<section style="margin-top:32px"><h2>${escapeHtmlText(sectionHeading)}</h2><p>${escapeHtmlText(body)}</p></section>`
  )).join("\n    ");
  const faqs = (route.faqs || []).map(({ question, answer }) => (
    `<section style="margin-top:20px"><h3>${escapeHtmlText(question)}</h3><p>${escapeHtmlText(answer)}</p></section>`
  )).join("\n    ");
  if (route.legal) {
    return `<main data-static-route="${escapeHtmlAttr(route.path)}" style="max-width:800px;margin:0 auto;padding:48px 24px;font-family:system-ui,sans-serif;line-height:1.65;color:#0f172a">
      <p style="font-size:14px;font-weight:700;color:#047857">AEO Improvement</p>
      <h1 style="font-size:clamp(32px,6vw,48px);line-height:1.08;margin:12px 0 20px">${heading}</h1>
      <p style="font-size:18px;max-width:760px;color:#475569">${description}</p>
      ${sections}
      <nav aria-label="Related policies" style="margin-top:32px"><a href="/privacy">Privacy Policy</a> · <a href="/google-data-use">Google Data Use</a> · <a href="/terms">Terms of Service</a></nav>
    </main>`;
  }
  return `<main data-static-route="${escapeHtmlAttr(route.path)}" style="max-width:960px;margin:0 auto;padding:48px 24px;font-family:system-ui,sans-serif;line-height:1.65;color:#0f172a">
    <p style="font-size:14px;font-weight:700;color:#047857">AEO Improvement</p>
    <h1 style="font-size:clamp(32px,6vw,56px);line-height:1.08;margin:12px 0 20px">${heading}</h1>
    <p style="font-size:20px;max-width:760px;color:#475569">${description}</p>
    <section style="margin-top:40px"><h2>Audit, simulate, improve, and monitor</h2><p>AEO Improvement checks citability, brand authority, AI crawler access, technical SEO, schema markup, and per-platform readiness. Recommendations include their evidence source and remain in a domain-level checklist until the user marks them complete.</p></section>
    <section style="margin-top:32px"><h2>Current methodology</h2><p>Citation-path bots are scored separately from training bots. OAI-SearchBot controls ChatGPT search discovery while GPTBot is used for model training. llms.txt is treated as optional because it is not a demonstrated citation gate. Fresh, server-visible content and explicit last-updated dates receive higher priority.</p></section>
    ${sections}
    ${faqs ? `<section style="margin-top:32px"><h2>Frequently asked questions</h2>${faqs}</section>` : ""}
    <nav aria-label="Related pages" style="margin-top:32px"><a href="/free-aeo-audit-tool">Run a free AEO audit</a> · <a href="/methodology">Read the methodology</a> · <a href="/ai-citation-readiness-benchmark">View the benchmark</a> · <a href="/pricing">Pricing</a></nav>
    <section style="margin-top:32px"><h2>Primary references</h2><ul><li><a href="https://platform.openai.com/docs/bots">OpenAI crawler documentation</a></li><li><a href="https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data">Google structured data documentation</a></li><li><a href="https://schema.org/Organization">Schema.org Organization</a></li></ul></section>
  </main>`;
}

// Every route-specific tag we inject is marked `data-shell`, matching the
// static tags in index.html. The <SEO> component removes `[data-shell]` tags
// on mount so a JS-rendering crawler sees exactly one canonical/description
// (React 19 hoists Helmet's tags into <head> without any marker of its own,
// so an "anything unmarked" cleanup would delete React's tags too).
//
// We replace the homepage's hard-coded <title>, meta description, canonical,
// og:* / twitter:* tags by substituting between two markers. Rather than do
// a fragile per-tag regex on the shipped HTML, we delete the existing
// route-specific tags by anchoring on stable patterns the build always emits.
const TAG_REGEXES = [
  /<title[^>]*>[\s\S]*?<\/title>\s*/i,
  /<meta\s+(?:data-shell\s+)?name=["']description["'][^>]*>\s*/gi,
  /<link\s+(?:data-shell\s+)?rel=["']canonical["'][^>]*>\s*/gi,
  /<meta\s+(?:data-shell\s+)?property=["']og:[^"']+["'][^>]*>\s*/gi,
  /<meta\s+(?:data-shell\s+)?property=["']article:[^"']+["'][^>]*>\s*/gi,
  /<meta\s+(?:data-shell\s+)?name=["']twitter:[^"']+["'][^>]*>\s*/gi,
];

function stripExistingHeadTags(html) {
  let out = html;
  for (const r of TAG_REGEXES) out = out.replace(r, "");
  return out;
}

// We keep the JSON-LD <script> blocks already in index.html (the rich
// Organization/Person/SoftwareApplication graph) for the homepage. For other
// routes we strip them and replace with the route-specific JSON-LD.
function stripJsonLd(html) {
  return html.replace(
    /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi,
    "",
  );
}

async function main() {
  if (!existsSync(SHELL_PATH)) {
    console.error(`prerender: ${SHELL_PATH} not found — run vite build first.`);
    process.exit(1);
  }

  const shell = await readFile(SHELL_PATH, "utf8");
  let homeWritten = false;

  for (const route of ROUTES) {
    const isHome = route.path === "/";

    // For the home route we keep the existing JSON-LD graph from index.html
    // and only normalize the title/meta to the manifest values (so this
    // script is a single source of truth even for /).
    let html = isHome ? shell : stripJsonLd(shell);
    html = stripExistingHeadTags(html);

    const injection = buildHeadInjection(route);
    html = html.replace(/<head>/i, `<head>${bootHead}`);
    html = html.replace(/<\/head>/i, `    ${injection}\n  </head>`);
    html = html.replace(/<div\s+id=["']root["']>\s*<\/div>/i, `<div id="root">${buildStaticContent(route)}</div>`);
    html = html.replace(/<body>/i, `<body>${bootStatus}`);
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>\s*/i, "");

    if (isHome) {
      await writeFile(SHELL_PATH, html, "utf8");
      homeWritten = true;
      console.log(`prerender: wrote / → ${SHELL_PATH}`);
      continue;
    }

    // Replit's static deployment serves the root SPA shell for a directory
    // route such as /pricing, even when pricing/index.html exists. It does
    // honor an exact extensionless file match, so write that equivalent too.
    // This keeps the human-friendly URL while ensuring non-JavaScript crawlers
    // receive each page's own title, metadata, schema, and static content.
    const exactRouteFile = join(DIST, ...route.path.split("/").filter(Boolean));
    await mkdir(dirname(exactRouteFile), { recursive: true });
    await writeFile(exactRouteFile, html, "utf8");
    console.log(`prerender: wrote ${route.path} → ${exactRouteFile}`);
  }

  if (!homeWritten) {
    console.warn("prerender: no home route in manifest — index.html untouched.");
  }

  const urls = ROUTES.map((route) => {
    const loc = `${SITE_ORIGIN}${route.path === "/" ? "/" : route.path}`;
    const lastmod = route.modifiedTime || "2026-07-22";
    return `  <url><loc>${escapeHtmlText(loc)}</loc><lastmod>${lastmod}</lastmod></url>`;
  }).join("\n");
  await writeFile(join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, "utf8");
  console.log(`prerender: wrote sitemap.xml (${ROUTES.length} URLs)`);
  const compressedCount = await writeCompressedAssets(DIST);
  console.log(`prerender: wrote gzip and Brotli variants for ${compressedCount} files`);
}

main().catch((err) => {
  console.error("prerender failed:", err);
  process.exit(1);
});
