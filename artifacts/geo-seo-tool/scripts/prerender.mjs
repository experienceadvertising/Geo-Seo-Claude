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
// scripts/seo-manifest.mjs, writes dist/public/<route>/index.html with the
// route-specific <title>, meta description, canonical, OpenGraph, Twitter
// Card, and JSON-LD blocks substituted in. The body still loads the React
// SPA bundle, so users get full client-side interactivity once JS executes.
//
// Replit static hosting (and most static hosts) serve directory paths as
// <dir>/index.html, so /pricing → dist/public/pricing/index.html with no
// rewrite needed. Local Vite preview already has a SPA fallback that
// rewrites unknown paths to /index.html — once these files exist on disk
// they're served directly instead of falling back.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTES, SITE_ORIGIN } from "./seo-manifest.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist", "public");
const SHELL_PATH = join(DIST, "index.html");

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
  const ogImage = `${SITE_ORIGIN}/opengraph.jpg`;
  const ogType = route.ogType ?? "website";

  const lines = [
    `<title>${escapeHtmlText(route.title)}</title>`,
    `<meta name="description" content="${escapeHtmlAttr(route.description)}" />`,
    `<link rel="canonical" href="${escapeHtmlAttr(canonical)}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(canonical)}" />`,
    `<meta property="og:title" content="${escapeHtmlAttr(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttr(route.description)}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:width" content="1280" />`,
    `<meta property="og:image:height" content="720" />`,
    `<meta property="og:site_name" content="AEO Improvement" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(route.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(route.description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
  ];

  if (ogType === "article") {
    if (route.publishedTime) {
      lines.push(
        `<meta property="article:published_time" content="${escapeHtmlAttr(route.publishedTime)}" />`,
      );
    }
    if (route.modifiedTime) {
      lines.push(
        `<meta property="article:modified_time" content="${escapeHtmlAttr(route.modifiedTime)}" />`,
      );
    }
    if (route.authorName) {
      lines.push(
        `<meta property="article:author" content="${escapeHtmlAttr(route.authorName)}" />`,
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

// We replace the homepage's hard-coded <title>, meta description, canonical,
// og:* / twitter:* tags by substituting between two markers. Rather than do
// a fragile per-tag regex on the shipped HTML, we delete the existing
// route-specific tags by anchoring on stable patterns the build always emits.
const TAG_REGEXES = [
  /<title>[\s\S]*?<\/title>\s*/i,
  /<meta\s+name=["']description["'][^>]*>\s*/gi,
  /<link\s+rel=["']canonical["'][^>]*>\s*/gi,
  /<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi,
  /<meta\s+property=["']article:[^"']+["'][^>]*>\s*/gi,
  /<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi,
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
    html = html.replace(/<\/head>/i, `    ${injection}\n  </head>`);

    if (isHome) {
      await writeFile(SHELL_PATH, html, "utf8");
      homeWritten = true;
      console.log(`prerender: wrote / → ${SHELL_PATH}`);
      continue;
    }

    const outDir = join(DIST, ...route.path.split("/").filter(Boolean));
    await mkdir(outDir, { recursive: true });
    const outFile = join(outDir, "index.html");
    await writeFile(outFile, html, "utf8");
    console.log(`prerender: wrote ${route.path} → ${outFile}`);
  }

  if (!homeWritten) {
    console.warn("prerender: no home route in manifest — index.html untouched.");
  }
}

main().catch((err) => {
  console.error("prerender failed:", err);
  process.exit(1);
});
