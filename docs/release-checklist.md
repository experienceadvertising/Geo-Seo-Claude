# Customer-facing release checklist

For each meaningful user-facing release:

- Add or update an entry in artifacts/geo-seo-tool/src/data/releases.json.
- Record a stable slug, actual release date, benefit, affected plans, specific changes, and useful next-step links.
- Record the PR or commit and live verification evidence in the evidence field. A merge alone is not proof of deployment.
- Keep unreleased features out of published entries. Do not update dates just to make the page look fresh.
- Review historical statements if plan limits or feature behavior changed. Label corrections rather than inventing original release dates.
- Run frontend tests, typecheck, production build, and check:seo.
- Confirm the built changelog includes every entry, date, and link without JavaScript, with matching metadata and schema.
- After publishing, verify the newest entry and its links on the live page, including a mobile-width check.

The shared release source feeds the changelog, dashboard What's new card, prerendered HTML, schema and sitemap modification date. Publication still requires editorial review; this is not an automatic claim-generating feed.
