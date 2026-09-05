# Cloudflare scheduler connection (not active)

## Setup status, September 4, 2026

- Worker created in the approved Cloudflare account. Initial version:
  f2ec2da6-3c1b-41aa-92f9-cb17289953cf.
- Matching SCHEDULER_SECRET saved through the Replit and Cloudflare secret UIs.
  Cloudflare CLI independently lists it as secret_text. No value is in this repo.
- Live Cloudflare settings confirm SCHEDULER_ENABLED=false, no cron triggers,
  no public URLs and no routes. Existing Replit scheduling was not disabled.
- Five sender tests and 42 API tests pass, including four new signature tests;
  API typecheck and Wrangler dry-run pass.
- This is connection preparation only. The verifier is not wired to an HTTP
  route yet. Replit's production runtime has not been republished to load the
  new secret, and no live authenticated job/probe has been run.
- Remaining release gates: bounded server execution, ledger migration, HTTP
  receiver tests, production build, reviewed PR merge/sync, Replit publication,
  harmless live verification, then coordinated schedule activation.

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

Tests: node --test infra/cloudflare-scheduler/worker.test.mjs
Validate with Wrangler deploy --dry-run using this directory's configuration.
Before activation, test missing/invalid/stale signatures against the actual
receiver, duplicate slots, provider failures and a harmless authenticated probe.
Do not disable the current app scheduler until the complete replacement is ready.
