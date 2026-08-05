# Google Search Console Opportunity Layer

## What it does

The prompt simulator can use real Google Search Console queries as fan-out seeds.

1. The user connects Google with read-only Analytics and Search Console scopes.
2. The simulator lists Search Console properties available to that account.
3. It selects the property that best matches the audited page.
4. It loads finalized Google web-search query data for the exact page over the last 90 days.
5. It ranks queries that have at least five impressions and an average position of 30 or better.
6. The user selects a query and generates a fan-out cluster grounded in that query.
7. The interface compares the cluster with the stored page title, description, headings, and citation-block previews to flag covered topics, weak matches, and possible gaps.

The opportunity score is only an internal sorting aid. It blends current impressions and average position. It does not predict ranking lift, traffic, citations, or revenue.

## Google Cloud setup

The existing Google OAuth client is reused. The following was confirmed in Google Cloud on August 4, 2026:

- Project: `AEO Improvement` (`aeo-improvement`)
- OAuth client: `AEO Improvement Web Client`
- Google Search Console API: enabled
- Search Console read-only scope: saved as a non-sensitive scope
- Analytics read-only scope: saved as a sensitive scope
- Callback URL: `https://aeoimprovement.com/api/integrations/google/callback`
- Authorized domain: `aeoimprovement.com`
- Application home page: `https://aeoimprovement.com`
- Publishing status: External, Testing
- Test user: `evan@experienceadvertising.com`

The app is ready for OAuth testing with Evan's account. It is not ready for general customer OAuth access.

Production setup still requires:

1. Publish valid privacy and terms pages. The live `/privacy` and `/terms` routes currently render the site's Page not found screen.
2. Add the verified privacy and terms URLs to OAuth branding.
3. Decide whether to upload a production app logo.
4. Publish the OAuth app and complete any Google verification required for the sensitive Analytics scope.
5. Do not alter the existing callback URL:

   `https://aeoimprovement.com/api/integrations/google/callback`

The configured Search Console read-only scope is:

   `https://www.googleapis.com/auth/webmasters.readonly`

The configured Analytics read-only scope is:

   `https://www.googleapis.com/auth/analytics.readonly`

Official references:

- [Search Console Search Analytics query API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Search Console sites list API](https://developers.google.com/webmaster-tools/v1/sites/list)
- [Google OAuth scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

## Existing users

Connections created before this feature only include Analytics access. The API detects the stored scopes and the interface asks those users to reconnect Google. Reconnection requests both read-only scopes and keeps the existing refresh-token behavior.

## Data handling

- Search Console access is read-only.
- Search Console query rows are fetched when the user opens the opportunity panel.
- Query rows and property selections are not persisted in the database.
- The server verifies that the selected Search Console property is available to the connected Google account before querying it.
- The API requests finalized data and ends the date range three days before the current date.
- Page filters include trailing-slash URL variants because Search Console page equality filters are case-sensitive.

## Opportunity bands

| Average position | Label | Suggested use |
|---|---|---|
| 1 to 3 | Established | Protect the ranking and expand only into tightly related questions |
| 4 to 10 | Page 1 opportunity | Improve the existing page around relevant fan-out questions and stronger evidence |
| 11 to 20 | Growth | Check intent match, strengthen the page, and cover useful topic gaps |
| 21 to 30 | Emerging | Validate intent before investing in broader coverage |

## Known limitations

- Search Console returns top rows and does not guarantee every query row.
- Exact-page filtering depends on the canonical URL Google reports.
- The current implementation tries both trailing-slash variants but does not discover arbitrary canonical changes.
- The coverage preview is lexical. It does not yet perform a full semantic comparison against the complete current page.
- Query selection is not yet saved with the audit or simulation.
