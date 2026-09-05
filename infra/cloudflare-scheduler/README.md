# Cloudflare scheduler connection

## Release verification, September 5, 2026 UTC

- PRs 46 and 47 are merged. Replit published the reviewed release after a
  browser review of the additive migration: two new tables and one index only.
- The live homepage returns HTTP 200. Unsigned scheduler requests return 401.
  A privately signed, side-effect-free probe returns HTTP 200, ready, protocol 1.
- Both production scheduler tables exist and were empty before activation.
  Production configuration contains SCHEDULER_MODE=cloudflare and
  SCHEDULED_WORKER_ENABLED=true.
- This configuration enables hourly collection at minute 40 UTC. Verify the
  deployed Worker version and an actual cron invocation separately; a committed
  configuration is not proof of execution.
- No Cloudflare plan change was required. The existing account has Workers Paid.

The preparation notes below describe the earlier inactive state, not current
deployment status. Roll back by removing cron triggers and setting
SCHEDULER_ENABLED=false before considering any app timer changes.

## Setup status, September 4, 2026

- Worker created in the approved Cloudflare account. Initial version:
  f2ec2da6-3c1b-41aa-92f9-cb17289953cf.
- Matching SCHEDULER_SECRET saved through the Replit and Cloudflare secret UIs.
  Cloudflare CLI independently lists it as secret_text. No value is in this repo.
- Live Cloudflare settings confirm SCHEDULER_ENABLED=false, no cron triggers,
  no public URLs and no routes. Existing Replit scheduling was not disabled.
- Five sender tests and 42 API tests pass, including four new signature tests;
  API typecheck and Wrangler dry-run pass.
- The signed HTTP receiver and bounded PostgreSQL queue are now implemented.
  The probe is side-effect-free and works without enabling job execution.
- Local validation: 43 API tests, 27 frontend tests, six Worker tests, and a
  real disposable PostgreSQL integration fixture processing 38 mocked jobs.
- Remaining deployment gates: apply the additive queue migration, publish the
  reviewed app, verify the live signed probe and unauthorized rejection, then
  enable the Cloudflare cron. Do not infer live status from this document.

Rollback for this inactive preparation is to leave the cron list empty and
SCHEDULER_ENABLED=false. No app code was deployed and no jobs were invoked.

The Worker is deliberately inert: no cron triggers, no public URL, and
SCHEDULER_ENABLED=false. Do not enable it until the protected Replit endpoint,
job-ledger migration, bounded request execution and production smoke tests are
complete. The existing app scheduler remains unchanged by these files.

Only SCHEDULER_SECRET belongs in Cloudflare. Generate 32 random bytes, encode as
64 lowercase hexadecimal characters, and store the same value privately in
Replit. Never place the value in source, URLs, task messages or command output.

The sender signs the exact body, timestamp, method and path using HMAC-SHA256.
The receiver must use a timing-safe comparison, reject stale timestamps, accept
only the fixed run-due operation, enforce server-side schedule/activation gates,
and atomically claim each due job before side effects. Authentication does not
replace the ledger's replay protection.

The sender awaits completion. A 202/queued response is not completion. Timeout
or failure must not automatically replay uncertain email/provider side effects.
The 90-second request budget requires bounded server work, not an unbounded
all-customer email loop or detached work after responding.

## Deployment and operation

1. Sync the reviewed merge without discarding Replit publication history.
2. Use Replit's supported schema-publishing flow for the registered Drizzle
   scheduler tables. Production DDL is restricted through the read-only agent
   connection. Prepare the additive development schema, then review the publish
   migration so only the two scheduler tables and their constraints/indexes are
   created. Never copy development data or approve unrelated destructive changes.
   The SQL files remain equivalent references for local testing/other hosts.
3. Preserve SCHEDULER_SECRET in both providers. Set Replit production
   SCHEDULER_MODE=cloudflare and SCHEDULED_WORKER_ENABLED=true for the release.
   This disables the former in-process timers; the standalone worker stays off.
4. Publish and verify POST /api/internal/scheduler: missing/bad signatures must
   return 401; a correctly signed {"operation":"probe"} must return
   {"status":"ready","protocol":1}, with no provider/email/queue side effects.
5. Only then set the Worker's SCHEDULER_ENABLED=true and cron to 40 * * * *.
   It awaits at most 40 small requests, stops starting new requests after ten
   minutes, and stops on an uncertain result instead of replaying it.
6. Confirm an actual scheduled invocation and aggregate queue status. Completed
   means the job handler finished, not proof that every email was delivered.

Each request handles one recipient, one monitored site, or one small rank sweep.
Rank sweeps retain existing weekly eligibility and paid-plan checks, and queued
provider tasks are not polled again within 15 minutes. Remaining rank batches are
skipped once no work is due. Pending queue items expire instead of sending stale
messages. Uncertain/failed work blocks the affected recipient/site or rank lane,
not unrelated customers. Inspect private provider evidence before manually
resolving a failed/running item; never reset it blindly to pending.

Rollback after activation: disable the Cloudflare cron/flag first, wait for any
in-flight request to finish, and inspect running queue entries before restoring
old app timers. Do not run both schedulers simultaneously. Keep the additive
queue table so delivery-attempt history is retained.

Tests: node --test infra/cloudflare-scheduler/worker.test.mjs
Validate with Wrangler deploy --dry-run using this directory's configuration.
Before activation, test missing/invalid/stale signatures against the actual
receiver, duplicate slots, provider failures and a harmless authenticated probe.
Do not disable the current app scheduler until the complete replacement is ready.
