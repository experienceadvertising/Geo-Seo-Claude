import BestAeoToolsPage from "./best-aeo-tools";

// Twin SEO page for "best GEO optimization tools" / "best generative engine
// optimization tools" search queries. Reuses the same component with the
// "geo" variant to swap copy + canonical path. We deliberately keep the
// content very close to the AEO version (the categories, the picks, the
// methodology) because the underlying buyer question is the same — the
// vocabulary just differs by community. Google's deduplication tolerates
// this kind of intentional twin page when the canonical URLs are distinct.
export default function BestGeoToolsPage() {
  return <BestAeoToolsPage variant="geo" />;
}
