# App review: September 4, 2026

## Coverage and limits

Reviewed the signed-out homepage, the live free-trial dashboard, audit overview and section links, prompt configuration, tracking empty state, recommended tools, and relevant signup, billing, rank-tracking, email, and plan-gating code. Checked all 28 public routes in the SEO manifest over HTTP. Each returned 200 with one H1, the expected title, a description, and its own canonical URL.

The signed-in account was stored-free with an active guided trial. This does not verify expired-free, paid Pro, or Agency behavior end to end. No live payment, subscription change, Google consent, outbound email, rank-provider request, or audit submission was performed. Local fixtures are isolated from production APIs and exercise new and returning free-trial dashboard rendering.

## Confirmed fixes prepared

1. **Unreachable audit recommendations:** the action list counted all recommendations but silently truncated at 14 even when expanded. Removed the hidden cap; the initial view still shows three. Filtering now operates on the complete list before applying that initial limit.
2. **Free setup dead end:** free users were shown 25% completion with paid connections required to finish. Replaced the paid setup checklist for free/Starter users with audit, buyer-prompt test, and one practical improvement. Paid connection setup is retained for Pro/Agency.
3. **Misleading Google connection entry:** prompt simulation used the effective trial plan to offer Google connections even though connected SEO requires a stored paid plan. The UI now matches the existing server gate and explains how to continue without Google.
4. **Invisible keyword controls:** free audit results said controls were below when those controls were not rendered. Free users now get explicit feature boundaries and an upgrade link.
5. **False empty states:** failed Google status/property requests could look like unconfigured integration or no properties. Added distinct error and retry states.
6. **Lost login destination:** protected-route redirects omitted the URL fragment. Section links now retain the destination through sign-in.
7. **Lost audit retry intent:** the saved homepage URL was cleared before its automatic audit succeeded. It is now cleared only on success. Optional browser storage cannot prevent dashboard rendering or successful audit navigation.
8. **Silent verification-email errors:** resend failures were swallowed. Both signup confirmation and verification recovery now display a retryable error.
9. **Walkthrough focus:** closing the guide could restore focus to its trigger instead of the website input. The input receives focus after the dialog closes.
10. **Misleading weekly score movement:** the digest could compare different pages on the same domain. It now compares the same URL, ignoring only fragments. No comparable recent audit means no change claim.
11. **Inconsistent rank history:** history could say not found despite a numeric stored rank. It now shares the tested display rule used in the target list.
12. **Crawler and monitoring claims:** removed homepage promises of verified bot visits, indexing, citation probability, and instant citation-drop alerts. The optional pixel records self-reported user agents; scheduled audits observe page signals. Tracking copy makes those limits explicit.
13. **Accessible controls:** added names to monitoring URL, label, cadence, and snippet-copy controls.

## Validation

- Full workspace typecheck passed during the review; final frontend typecheck rerun after UI changes.
- Frontend regression suite expanded with blocked-storage and complete-action-list cases.
- API regression suite includes same-page digest comparison.
- API production build passed. Frontend production build includes all 28 prerendered SEO routes.
- Local browser confirmed new-account guidance, returning-account guidance, and walkthrough focus on the website input.
- Live sidebar links opened tracking, recommended tools, prompt simulation, top actions, SEO opportunities, and the expanded technical breakdown.
- Existing nonfatal sourcemap warnings remain in three UI primitives.

## Next improvements, in priority order

### 1. Finish paid activation acceptance testing

Use an existing paid test account to connect an approved Google property, add a small keyword set, obtain a successful provider snapshot, revisit history, and verify paid weekly guidance. Verify Agency ownership isolation separately. Do not charge a new subscription merely to run QA.

### 2. Make recommendations fit the page's purpose

The score explanation awards points for long-form content and particular schema types. These are heuristics, not universal requirements for every homepage, product page, or article. Review the catalog by page type before changing scoring weights. Show applicability and confidence, not just priority. Avoid telling every company to lengthen its homepage or add irrelevant schema.

### 3. Make current evidence distinguishable from historical wording

Stored recommendations still contain stronger older claims, including time-specific statistics guidance. Preserve historical results, but clearly offer a refreshed audit and show the source-review date. A source badge alone should not imply primary research or proof of ranking lift.

### 4. Persist onboarding intent across devices

The homepage URL still relies on browser storage. Verification in another browser or device can lose it. Existing open PR #32 (Persist first audit through email verification) proposes account-bound storage and server validation. Reconcile and review that PR against the latest main branch rather than building a duplicate. It includes an account-schema migration and was not merged in this review. The current retry fix does not solve cross-device handoff or certify idempotent audit creation.

### 5. Reduce remaining dashboard repetition

The audit repeats prompt-test calls to action in several places. After a first completed simulation, show one next task and a dated baseline instead of repeating the invitation. Keep detailed scores available on demand. Measure audit completion, first simulation, first completed task, and first weekly return before adding more panels.

### 6. Complete mobile and delivery testing

Test the mobile drawer, long recommendation text, keyboard navigation, verification in a separate email client, and delivered paid emails. This review does not certify those workflows or promise rankings, citations, or revenue outcomes.

## Local preview

Run the frontend production preview on port 4173, then `node scripts/qa-dashboard-preview.mjs`. Use `QA_AUDIT=1 QA_PORT=4185` for the returning-user fixture. All API writes return an explicit local-preview failure. These fixtures are UI checks, not production integration tests.
