import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

// index.html ships a hard-coded homepage canonical / og:* / twitter:* /
// description set. react-helmet-async only manages tags it created
// (marked `data-rh`), so on any route that isn't prerendered — /privacy,
// /terms, the signed-in app — a JS-rendering crawler would otherwise see
// TWO canonicals (the shell's "/" and this page's). Strip the shell's copies
// once on first mount; prerendered routes have already had them replaced at
// build time, so this is a no-op there.
const SHELL_TAG_SELECTOR = [
  'link[rel="canonical"]:not([data-rh])',
  'meta[name="description"]:not([data-rh])',
  'meta[property^="og:"]:not([data-rh])',
  'meta[property^="article:"]:not([data-rh])',
  'meta[name^="twitter:"]:not([data-rh])',
].join(",");
let shellTagsStripped = false;
function stripShellHeadTags(): void {
  if (shellTagsStripped || typeof document === "undefined") return;
  shellTagsStripped = true;
  document.head.querySelectorAll(SHELL_TAG_SELECTOR).forEach((el) => el.remove());
}

interface SEOProps {
  title: string;
  description: string;
  // Path component AFTER the domain, including leading slash. Used for the
  // canonical link and og:url. We never trust window.location.href because
  // it can include tracking query params we don't want indexed.
  path: string;
  // Optional structured data — pass an object, we'll JSON.stringify it.
  // Use this to add FAQPage / Article / Product schema for rich snippets.
  jsonLd?: object | object[];
  // Override og:image if a page has a more specific share image. Defaults
  // to the global opengraph.jpg referenced in index.html.
  ogImage?: string;
  // Open Graph type. "article" enables LinkedIn/X to render byline + date
  // for guide-style pages. Defaults to "website".
  ogType?: "website" | "article";
  // Article metadata — only emitted when ogType === "article".
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  // If false, page won't be indexed (use for thin or duplicate content
  // landing pages). Defaults to true — comparison pages NEED indexing.
  index?: boolean;
}

const SITE = "https://aeoimprovement.com";
const OG_IMAGE_W = 1280;
const OG_IMAGE_H = 720;

/**
 * Per-page SEO component. Wraps react-helmet-async to set <title>,
 * meta description, canonical, OpenGraph + Twitter Card tags, and
 * optional JSON-LD structured data.
 *
 * The HelmetProvider lives in App.tsx so this component can be dropped
 * into any page. Tags from this component override the defaults in
 * index.html — react-helmet-async handles the merge correctly.
 */
export function SEO({
  title,
  description,
  path,
  jsonLd,
  ogImage,
  ogType = "website",
  publishedTime,
  modifiedTime,
  authorName,
  index = true,
}: SEOProps) {
  useEffect(stripShellHeadTags, []);

  const canonical = `${SITE}${path}`;
  const image = ogImage ?? `${SITE}/opengraph.jpg`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const isArticle = ogType === "article";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {!index && <meta name="robots" content="noindex, follow" />}

      {/* OpenGraph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content={String(OG_IMAGE_W)} />
      <meta property="og:image:height" content={String(OG_IMAGE_H)} />
      <meta property="og:site_name" content="AEO Improvement" />
      <meta property="og:locale" content="en_US" />

      {isArticle && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {isArticle && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {isArticle && authorName && (
        <meta property="article:author" content={authorName} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD blocks. Helmet renders children verbatim into <head>;
          stringify ensures the JSON is valid. */}
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
}

/**
 * Build a BreadcrumbList JSON-LD for a page. Pass crumbs in display order;
 * we'll add the @context, @type, and 1-indexed positions.
 */
export function breadcrumbJsonLd(
  crumbs: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE}${c.path}`,
    })),
  };
}
