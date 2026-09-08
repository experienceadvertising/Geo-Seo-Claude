# Guided site scanning

## Scope

New users keep their automatic homepage audit, then land in a page-selection workspace. Existing users can open Site scan from navigation. Discovery retains the existing plan cap and every scan uses the existing audit allowance. Paid users can rescan selected pages and compare an explicitly chosen, previously audited competitor page. No provider lookup runs on page load.

## Acceptance criteria

- Users confirm pages before additional scans. Existing homepage findings remain accessible.
- Failed scans preserve completed results and stop the batch. Refreshing never starts scans.
- Public-page batch requests respect robots restrictions and reject unsafe URLs using existing safe fetch protections.
- The site plan uses only the authenticated user's saved audits and unfinished page-scoped tasks.
- Existing paid rank snapshots inform opportunity ordering, with timestamps and explicit stale state. No rank means unknown, not zero.
- Competitor comparisons show observable saved differences, not proof of ranking factors or copied text. Users deliberately select the comparison page.
- Existing completion notes, re-audit history and SEO tracking remain the progress record. No billing limits or scheduler changes.

## Non-goals

An unlimited crawler, automatic competitor discovery, copying competitor content, new DataForSEO spending, or ranking guarantees. Search Console page discovery and automatic change detection are follow-up work.

## Success measures

After release, evaluate page-selection completion, number of users completing their first task, return visits to review progress and scan failure rate. These are evaluation measures, not claimed results.

## Validation status

Implementation is local on `codex/site-scan-workspace`. Workspace typecheck, existing API/frontend suites, five focused selection/priority checks and production builds passed during implementation. Browser fixture did not reach its initial heading; a subsequent browser launch stalled and the in-app preview also timed out attaching. UI validation is not complete and this is not published. Re-run production builds after final crawl-policy edits before release. No paid provider calls, real customer scans or notifications were triggered.

Competitor comparison v1 is deliberately limited to saved page titles, description presence and word counts, with guidance to inspect intent and evidence. It is not an automated content-gap or competitor-strategy analysis. Existing SEO links expose ongoing keyword history; the workspace does not collect new ranking baselines automatically.
