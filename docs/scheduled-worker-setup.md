# Scheduled worker: prepared, not activated

## Hosting arrangement

Keep the customer-facing app on Autoscale. Prepare a separate Scheduled deployment from the same reviewed code, not a conversion of the existing web deployment. Scheduled deployments do not serve a public website. Confirm the current Replit account supports the separate project/deployment before proceeding.

- Build: `pnpm --filter @workspace/api-server build`
- Run: `node artifacts/api-server/dist/scheduled-worker.mjs`
- Schedule: once per hour, five minutes past the hour, interpreted in UTC.
- Initial job timeout: 15 minutes, subject to the account's available settings. Configure failures to notify the owner.
- Keep `SCHEDULED_WORKER_ENABLED` absent during setup. The worker prints only its planned job names/slots and does not load the database or job handlers in default dry-run mode.

## Cost review

Sources checked: https://docs.replit.com/billing/deployment-pricing and its linked calculator https://deployment-pricing.replit.app/.

The calculator's Scheduled tab states a typical $0–$10/month, but does not calculate this app's hourly workload. The documentation's extracted rate table has blank price cells. Neither is an account-specific quote or guaranteed cap. An hourly schedule is about 720 launches per 30 days. Measure actual duration after approval; do not promise a fixed monthly amount from the generic calculator.

Suggested initial hosting budget for owner approval: $10/month additional worker compute. Confirm whether Replit can enforce a deployment-specific limit; an account-wide budget would affect unrelated projects and must not be changed without separate approval. A budget alert alone is not a hard stop.

Excluded costs: DataForSEO requests, monitoring audit model calls, Postmark email, database compute and transfer. Existing paid-plan checks and collection cadence remain. Worker submissions are bounded to 25 targets per hourly sweep and monitored audits to 25 per daily sweep. This is a workload bound, not a dollar limit. Provider task completion can take multiple hourly sweeps.

## Activation sequence, only after cost and access approval

1. Verify the worker code and web release use the same approved commit. Verify rollback artifacts and current production health.
2. Apply `scripts/sql/scheduled-job-runs.sql` to the existing production database after migration approval. This is additive; never replace the database with development data.
3. Configure only the worker's required production database/provider/email/AI settings through Replit's private secret controls. Do not copy auth, Stripe or unrelated credentials. Confirm monitoring's Chromium/runtime dependencies before enabling that job. No secrets are included in this document.
4. With worker activation still absent, run the dry-run command and verify no production side effects.
5. Set `SCHEDULER_MODE=external` on the web deployment and deploy it. Confirm in-process cron and the trial-email startup timer are disabled on every web instance before starting the external worker. Do not leave web timers and worker active together.
6. Set both `SCHEDULER_MODE=external` and `SCHEDULED_WORKER_ENABLED=true` on the scheduled worker and activate it only with approval. First execution can process real due audits, provider tasks and emails.
7. Verify one approved collection end to end, per-job ledger entries, no duplicate email runs, exit status and failure alerts. Check ordinary sign-in and task completion on the web app.

## Reliability semantics and limitations

- A database advisory lock prevents overlapping worker invocations. Unique job/slot records are claimed before side effects; repeated invocations skip existing slots.
- Failed or interrupted slots are not automatically replayed. This favors avoiding duplicate email sends over automatic delivery recovery. Investigate a failed/running slot and provider delivery records before any manual replay.
- Completed means the handler returned, not that every recipient received an email or every keyword succeeded. Existing handler/provider status logs remain necessary.
- Daily jobs can catch up later on the same UTC date. Weekly/monthly jobs run only on the configured weekday/date; a full-day outage needs manual review. This is not a persistent catch-up queue.
- Preserve opt-outs, verified-email checks and paid-plan checks. No customer emails, queries or page content belong in the worker ledger.
- Dry-run and mocked claim tests do not prove real database concurrency, provider delivery or production scheduling. Those require approved staging/live verification.

## Rollback

Stop the scheduled deployment first. Verify no worker is still running. Then restore the prior web scheduler setting only after checking for already-sent periodic emails. Keep the ledger for review. Do not delete production data or automatically replay uncertain jobs.
