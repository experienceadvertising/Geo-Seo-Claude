# SEO and GEO Improvement System

## Goal

Turn an audit into a repeatable loop: find the important pages, choose one evidence-backed task, prepare a verified rewrite, publish it, check the page signal again, and observe later SEO and AI visibility trends.

## Data flow

```text
Sitemap or homepage links
          |
          v
Important page selector -> Existing audit pipeline -> Prioritized action
                                                     |
                                                     v
                                      Content rewrite workbench
                                                     |
                                                     v
                                          User publishes change
                                                     |
                                                     v
                                      Fresh same-page audit check
                                                     |
                         +---------------------------+--------------------------+
                         |                                                      |
                  Search Console                                  Prompt simulations
             and DataForSEO snapshots                              and audit history
```

## Product boundaries

- Page discovery is a read-only sitemap or homepage-link request. It does not call DataForSEO or an AI model.
- A selected page scan uses the existing audit endpoint and its existing monthly quota.
- Free, Starter, Pro, and Agency accounts can discover 3, 5, 8, and 15 important pages respectively. Trial access follows the existing effective-plan policy.
- The workbench starts from saved page signals and user-supplied brand facts. It does not invent proof, customers, statistics, or differentiators.
- Check my change runs a fresh audit of the same URL and checks whether the same rule is still triggered. It does not claim a ranking or citation result.
- DataForSEO search competitors come from a stored rank snapshot. Copying a gap review does not request another provider lookup.
- The client task brief is a delivery aid. It does not add team permissions or expose one client's information to another account.

## Reliability and safety

- Every discovered URL is normalized to the original hostname and filtered before display.
- Network requests use the existing DNS-pinned SSRF-safe fetcher, response byte limits, timeouts, and redirect limits.
- Page scan failures preserve completed scan results. Existing audit quota logic refunds failed site fetches.
- User drafts are keyed by authenticated user, page, and recommendation in browser storage. Blocked storage does not interrupt the workflow.
- Historical rankings, missing provider results, and current observations remain distinct. Missing data is never replaced with zero.

## Tradeoffs

- The first release chooses important pages by sitemap paths and common page types. It is inexpensive and explainable, but it cannot understand every site's custom information architecture.
- Drafts remain in the user's browser instead of a new database table. This avoids a migration and customer-content logging risk, but drafts do not follow the user across devices.
- Verification compares rule presence instead of making an extra AI judgment. This is cheaper and reproducible, but some editorial improvements still require human review.
- Agency delivery starts with copyable briefs instead of multi-user assignments. This delivers value without introducing account roles and permissions before demand is proven.

## Revisit as usage grows

- Add encrypted server-side draft storage when cross-device demand is clear.
- Add explicit agency collaborators, assignment status, and client approvals after a permissions model is designed and tested.
- Add crawl queues and per-domain concurrency limits if multi-page runs become large enough to outlive normal HTTP requests.
- Consider DataForSEO Labs domain intersection only after tracking adoption and provider spend justify a new paid endpoint.
