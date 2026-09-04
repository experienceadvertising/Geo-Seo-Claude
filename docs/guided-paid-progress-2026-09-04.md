# Guided paid progress: first implementation

## Implemented

- Dashboard comparisons and sparklines use the same page, excluding fragments. A first audit is a baseline, not an improvement over another website.
- New rank targets become eligible on the next scheduler sweep. Successful observations remain on a weekly cadence, including manual snapshots. Failed submissions wait at least a day before resubmission. Pending tasks block duplicate submission.
- Queue polling runs every 15 minutes while the API process is running. Standard-mode collection, stored paid-plan checks, advisory locking and the 100-target sweep bound remain in place.
- Keyword lists show queued, failed, awaiting-baseline and overdue states, collection date, next eligible date, actual found page and intended-page mismatch guidance. Missing results are not described as absence from all Google results.
- Dashboard reports configured targets separately from collected baselines and overdue results. Monitoring configuration is separate from completed runs.
- Paid audit results include the existing Search Console performance endpoint, matching the audited page's property instead of substituting an unrelated site. Current and previous periods, metric definitions and up to three query opportunities are visible.
- Weekly emails distinguish collected observations, numeric ranks, pending baselines and stale results, with a link to collection history. Existing delivery cadence and opt-out behavior are unchanged. No live messages sent.
- Desktop navigation remains sticky; the mobile account drawer can scroll.

## Validation and release gates

Use frontend and API regression suites, workspace typecheck, both production builds, and local sample-account browser checks. These do not validate the production scheduler or execute a paid DataForSEO request.

Before release, confirm that the Replit hosting arrangement keeps the in-process scheduler running. Autoscale idle shutdown can prevent cron execution. A durable external scheduler or always-on worker is still a deployment requirement for dependable unattended collection. Do not promise precise delivery times until verified.

After an approved release, verify one existing target's queued-to-collected transition and freshness UI. No live API requests, emails, schema changes or deployment performed in this implementation step.

## Remaining work

- Cached DataForSEO keyword enrichment: volume, intent, estimated difficulty and demand trends. Not implemented in this change and no new enrichment credits consumed.
- Keyword import from Search Console with an explicit target/location/device confirmation.
- Persisted Search Console history and completed-action overlays, beyond the current two-period comparison.
- Broader simulator, recommendation completion and mobile end-to-end checks.
- Actual ranking improvements are not promised. Observed movement is not proof of causation.
