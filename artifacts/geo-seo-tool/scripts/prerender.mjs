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

function buildVisibilityGuideContent(guide) {
  const sourceById = new Map(guide.sources.map((source) => [source.id, source]));
  const renderSources = (ids) => {
    if (!ids?.length) return "";
    const links = ids.map((id) => sourceById.get(id)).filter(Boolean)
      .map((source) => `<li><a href="${escapeHtmlAttr(source.url)}" target="_blank" rel="noreferrer noopener">${escapeHtmlText(source.label)}</a></li>`)
      .join("");
    return `<ul aria-label="Supporting sources" style="margin:14px 0;padding-left:22px;font-size:14px">${links}</ul>`;
  };
  const contents = guide.contents.map((item) =>
    `<li style="margin:5px 0"><a href="#${escapeHtmlAttr(item.id)}">${escapeHtmlText(item.label)}</a></li>`,
  ).join("");
  const takeaways = guide.takeaways.map((item) =>
    `<li style="margin:8px 0">${escapeHtmlText(item)}</li>`,
  ).join("");
  const sections = guide.sections.map((section) => {
    const paragraphs = section.paragraphs.map((paragraph) => `<p>${escapeHtmlText(paragraph)}</p>`).join("");
    const bullets = section.bullets?.length
      ? `<ul style="padding-left:24px">${section.bullets.map((item) => `<li style="margin:8px 0">${escapeHtmlText(item)}</li>`).join("")}</ul>`
      : "";
    const relatedLinks = section.relatedLinks?.length
      ? `<ul style="padding-left:24px">${section.relatedLinks.map((item) => `<li style="margin:8px 0"><a href="${escapeHtmlAttr(item.href)}">${escapeHtmlText(item.label)}</a> <span>${escapeHtmlText(item.context)}</span></li>`).join("")}</ul>`
      : "";
    return `<section id="${escapeHtmlAttr(section.id)}" style="margin-top:36px"><h2>${escapeHtmlText(section.heading)}</h2>${paragraphs}${bullets}${relatedLinks}${renderSources(section.sourceIds)}</section>`;
  }).join("\n");
  const setupFields = guide.worksheet.setupFields.map((field) =>
    `<label style="display:block;margin:10px 0;font-weight:600">${escapeHtmlText(field.label)}<input name="${escapeHtmlAttr(field.name)}" type="text" placeholder="${escapeHtmlAttr(field.placeholder)}" style="display:block;width:100%;min-height:42px;margin-top:5px;padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-weight:400" /></label>`,
  ).join("");
  const signalCards = guide.worksheet.signals.map((signal) => {
    const fields = signal.fields.map((field) => {
      const name = escapeHtmlText(field.label);
      const unit = field.unit ? ` <span>(${escapeHtmlText(field.unit)})</span>` : "";
      return `<div style="margin-top:16px"><p style="margin-bottom:6px;font-weight:600">${name}${unit}</p><label style="display:block;margin:8px 0">${escapeHtmlText(guide.worksheet.periodLabels.baseline)}<input name="${escapeHtmlAttr(`${field.key}_baseline`)}" type="text" placeholder="${escapeHtmlAttr(field.placeholder)}" style="display:block;width:100%;min-height:42px;margin-top:4px;padding:8px;border:1px solid #cbd5e1;border-radius:8px" /></label><label style="display:block;margin:8px 0">${escapeHtmlText(guide.worksheet.periodLabels.comparison)}<input name="${escapeHtmlAttr(`${field.key}_comparison`)}" type="text" placeholder="${escapeHtmlAttr(field.placeholder)}" style="display:block;width:100%;min-height:42px;margin-top:4px;padding:8px;border:1px solid #cbd5e1;border-radius:8px" /></label></div>`;
    }).join("");
    return `<fieldset style="min-width:0;margin:14px 0;padding:16px;border:1px solid #cbd5e1;border-radius:12px"><legend style="padding:0 6px;font-weight:700">${escapeHtmlText(signal.title)}</legend><p>${escapeHtmlText(signal.description)}</p><p style="font-size:14px;color:#475569">Source: ${escapeHtmlText(signal.source)}</p>${fields}<p style="font-size:14px;color:#475569">${escapeHtmlText(signal.guardrail)}</p></fieldset>`;
  }).join("");
  const exampleRows = guide.workedExample.rows.map((row) =>
    `<li style="margin:14px 0"><strong>${escapeHtmlText(row.metric)}:</strong> ${escapeHtmlText(row.baseline)} to ${escapeHtmlText(row.comparison)} (${escapeHtmlText(row.change)}). ${escapeHtmlText(row.interpretation)}</li>`,
  ).join("");
  const sources = guide.sources.map((source) =>
    `<li style="margin:8px 0"><a href="${escapeHtmlAttr(source.url)}" target="_blank" rel="noreferrer noopener">${escapeHtmlText(source.label)}</a></li>`,
  ).join("");
  const related = guide.related.map((item) =>
    `<li style="margin:8px 0"><a href="${escapeHtmlAttr(item.href)}">${escapeHtmlText(item.label)}</a></li>`,
  ).join("");
  const publishedLabel = new Date(`${guide.published}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return `<main data-static-route="${escapeHtmlAttr(guide.path)}" style="max-width:920px;margin:auto;padding:40px 20px;font-family:system-ui,sans-serif;line-height:1.7;color:#0f172a">
    <article>
      <header><p style="font-weight:700;color:#047857">AEO Improvement field guide</p><h1>${escapeHtmlText(guide.title)}</h1><p style="font-size:19px;color:#475569">${escapeHtmlText(guide.intro)}</p><p style="font-size:14px;color:#64748b"><time datetime="${escapeHtmlAttr(guide.published)}">Published ${escapeHtmlText(publishedLabel)}</time> · By ${escapeHtmlText(guide.byline)}</p></header>
      <figure aria-label="${escapeHtmlAttr(guide.illustration.alt)}" style="margin:28px 0;padding:18px;border:1px solid #dbe4ea;border-radius:16px;background:#f8fafc">
        <ol style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0;padding:0;list-style:none">
          <li style="padding:12px;border-radius:10px;background:#e0f2fe"><strong>01 · Indexing</strong><br />Eligibility check</li>
          <li style="padding:12px;border-radius:10px;background:#dcfce7"><strong>02 · AI reports</strong><br />Impressions or citations</li>
          <li style="padding:12px;border-radius:10px;background:#fef3c7"><strong>03 · Visits</strong><br />Analytics sessions</li>
          <li style="padding:12px;border-radius:10px;background:#ede9fe"><strong>04 · Outcomes</strong><br />Verified business events</li>
        </ol>
        <figcaption style="margin-top:12px;color:#475569">${escapeHtmlText(guide.illustration.caption)}</figcaption>
      </figure>
      <aside style="margin:26px 0;padding:20px;border:1px solid #a7f3d0;border-radius:14px;background:#ecfdf5"><h2>Key takeaways</h2><ul style="padding-left:22px">${takeaways}</ul></aside>
      <nav aria-label="On this page" style="margin:26px 0;padding:18px;border:1px solid #dbe4ea;border-radius:14px"><h2>Contents</h2><ol style="padding-left:22px">${contents}</ol></nav>
      ${sections}
      <section id="worksheet" style="margin-top:40px"><h2>Copy the repeatable worksheet</h2><p>${escapeHtmlText(guide.worksheet.intro)}</p><div id="ai-visibility-worksheet"><fieldset style="margin:18px 0;padding:16px;border:1px solid #cbd5e1;border-radius:12px"><legend style="padding:0 6px;font-weight:700">Scope and comparison</legend>${setupFields}</fieldset>${signalCards}<button type="button">${escapeHtmlText(guide.worksheet.downloadLabel)}</button> <button type="button">${escapeHtmlText(guide.worksheet.resetLabel)}</button></div></section>
      <section id="worked-example" style="margin-top:40px"><h2>${escapeHtmlText(guide.workedExample.heading)}</h2><p style="padding:12px;border-left:4px solid #f59e0b;background:#fffbeb">${escapeHtmlText(guide.workedExample.notice)}</p><p>${escapeHtmlText(guide.workedExample.intro)}</p><ul style="padding-left:24px">${exampleRows}</ul><p>${escapeHtmlText(guide.workedExample.closing)}</p></section>
      <section style="margin-top:40px"><h2>Sources</h2><p>Claims about provider reporting are linked to current official documentation. Values in the worked example are hypothetical.</p><ul style="padding-left:24px">${sources}</ul></section>
      <section style="margin-top:40px;padding:20px;border:1px solid #dbe4ea;border-radius:14px"><h2>${escapeHtmlText(guide.callToAction.heading)}</h2><p>${escapeHtmlText(guide.callToAction.body)}</p><a href="${escapeHtmlAttr(guide.callToAction.href)}">${escapeHtmlText(guide.callToAction.label)}</a></section>
      <nav aria-label="Related guides" style="margin-top:40px"><h2>Related guides</h2><ul style="padding-left:24px">${related}</ul></nav>
    </article>
  </main>`;
}

function buildStaticContent(route) {
  if (route.visibilityGuide) {
    return buildVisibilityGuideContent(route.visibilityGuide);
  }
  if (route.strategyGuide) {
    const guide = route.strategyGuide;
    const sections = guide.sections.map((section) => `<section style="margin-top:36px"><h2>${escapeHtmlText(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtmlText(paragraph)}</p>`).join("")}</section>`).join("\n");
    const sources = guide.sources.map((source) => `<li><a href="${escapeHtmlAttr(source.url)}">${escapeHtmlText(source.label)}</a></li>`).join("");
    const related = guide.related.map((path) => `<li><a href="${escapeHtmlAttr(path)}">${escapeHtmlText(path.replace(/^\//, "").replace(/-/g, " "))}</a></li>`).join("");
    return `<main data-static-route="${escapeHtmlAttr(guide.path)}" style="max-width:800px;margin:auto;padding:48px 24px;font-family:system-ui,sans-serif;line-height:1.7;color:#0f172a">
      <p>SEO + GEO field guide</p><h1>${escapeHtmlText(guide.title)}</h1><p>${escapeHtmlText(guide.intro)}</p><p>Published September 17, 2026 · By the AEO Improvement editorial team</p>
      ${sections}
      <section style="margin-top:40px"><h2>Put this to work on one page</h2><p>Run a baseline audit, choose one relevant SEO or GEO action, and record what you changed. You decide what to publish on your site.</p><a href="/free-aeo-audit-tool">Start a free website audit</a></section>
      <section style="margin-top:40px"><h2>Sources and credit</h2><p>Expert surveys and correlations are not confirmed ranking factors or promises of results.</p><ul>${sources}</ul></section>
      <nav aria-label="Related guides" style="margin-top:40px"><h2>Keep going</h2><ul>${related}</ul></nav>
    </main>`;
  }
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
  const staticRelated = (route.staticRelatedLinks || []).map(({ label, href }) => (
    `<li style="margin:8px 0"><a href="${escapeHtmlAttr(href)}">${escapeHtmlText(label)}</a></li>`
  )).join("");
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
    ${staticRelated ? `<nav aria-label="Related guides" style="margin-top:32px"><h2>Related guides</h2><ul style="padding-left:24px">${staticRelated}</ul></nav>` : ""}
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
