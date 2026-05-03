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
  // If false, page won't be indexed (use for thin or duplicate content
  // landing pages). Defaults to true — comparison pages NEED indexing.
  index?: boolean;
}

const SITE = "https://aeoimprovement.com";

/**
 * Per-page SEO component. Wraps react-helmet-async to set <title>,
 * meta description, canonical, OpenGraph + Twitter Card tags, and
 * optional JSON-LD structured data.
 *
 * The HelmetProvider lives in App.tsx so this component can be dropped
 * into any page. Tags from this component override the defaults in
 * index.html — react-helmet-async handles the merge correctly.
 *
 * Per Google's docs, JSON-LD should live in <head> as a script type
 * application/ld+json. Multiple blocks are allowed.
 */
export function SEO({ title, description, path, jsonLd, ogImage, index = true }: SEOProps) {
  const canonical = `${SITE}${path}`;
  const image = ogImage ?? `${SITE}/opengraph.jpg`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {!index && <meta name="robots" content="noindex, follow" />}

      {/* OpenGraph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="AEO Improvement" />

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
