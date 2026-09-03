import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

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

// index.html (and every prerendered route file) ships a static
// title/description/canonical/og/twitter set for non-JS crawlers, each tag
// marked `data-shell`. Once React mounts, this component owns those tags;
// React 19 hoists the <Helmet> children into <head> as plain elements, so the
// static copies must go or a JS-rendering crawler sees two canonicals.
//
// Only `[data-shell]` is removed — never "anything unmarked" — because React's
// hoisted tags carry no marker and would otherwise be deleted as well
// (which briefly left the live home/pricing pages with no canonical at all).
const SHELL_TAG_SELECTOR = "head [data-shell]";
function stripShellHeadTags(): void {
  if (typeof document === "undefined") return;
  document.querySelectorAll(SHELL_TAG_SELECTOR).forEach((el) => el.remove());
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
      {/* Always emitted: the shell's robots tag is stripped with the rest, and
          a page must never end up with two conflicting directives. */}
      <meta
        name="robots"
        content={index ? "index, follow, max-image-preview:large, max-snippet:-1" : "noindex, follow"}
      />

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
