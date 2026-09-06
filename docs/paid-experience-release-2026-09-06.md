# Paid experience repairs

## Scope

- Page-specific task completion, including page-aware dashboard, sidebar, audit, simulation, monitoring and weekly email selection.
- Legacy completion notes remain available, without guessing which page was changed. Shared site files and off-site work retain site scope.
- Browser-specific subscription ownership, explicit recovery on account switching, category preferences, visible load errors and sign-out cleanup.
- Email unsubscribe no longer disables opted-in weekly push. Delivery outcomes are recorded by channel in the scheduler ledger. Failed or uncertain work is held for review, not automatically resent.
- Weekly multi-site summaries include each displayed client's next task and snapshot state. The email shows up to ten sites with a link to the workspace for additional sites.
- Saved domain simulations are available after re-auditing, with an older-run notice and reusable prompts. No automatic paid rerun.
- Evergreen strategy reminders link to a relevant unfinished task where available, otherwise an implementation guide. They are not described as newly researched findings.
- Direct Action Plan and SEO navigation, compact notification controls, three improvements before optional setup, collapsed query research, clearer Google setup limitations and duplicate monitoring warnings.
- Freshness guidance prioritizes accurate, relevant evidence, not changing years or replacing useful older sources. Historical findings get corrected presentation text without rewriting stored audit evidence.

## Release gates

Run workspace typecheck, API and frontend tests, recommendation catalog validation, production API build, frontend build/prerender and public metadata validation. Run isolated PostgreSQL tests for the actual migration SQL, progress route handlers, notification ownership/preferences and push-only/email-only scheduler eligibility. Render local desktop/mobile dashboard and personalized email fixtures. Never use production credentials in these tests.

## Migration and rollback

The startup migration adds `recommendation_progress.page_url`, preserves rows and notes, and replaces the old domain-only uniqueness index with page-aware uniqueness. It adds three push preference columns and `scheduled_job_items.delivery_outcomes`. No customer rows are deleted.

Do not revert the API to the old domain-only completion writer after page-specific records exist. For rollback, keep the schema-aware progress endpoints and migrations while reverting unrelated UI/email changes, or deploy a forward fix. Do not recreate the old uniqueness index or delete page records to force a rollback.

If the new deployment fails progress save/read, paid navigation, or notification status, stop promotion and inspect logs. Do not replay failed notification jobs without checking their stored accepted/failed/uncertain channel outcomes. Provider acceptance does not prove inbox or operating-system display.

## Boundaries

This release does not add provider lookups, change pricing or billing, reconnect Google accounts, merge monitored sites automatically, or send test messages to customers. Google access and property selection are explicitly distinguished from verified per-site data. Live inbox/device delivery still needs a controlled recipient test.

## Local verification

- 60 API regression tests and 43 frontend tests passed.
- Workspace typecheck and recommendation snapshot validation passed.
- Actual progress handlers and startup migration SQL passed isolated PostgreSQL tests, including a second migration run after multiple page records exist.
- Actual notification routes and scheduler queue SQL passed account isolation, category preference, email-only and push-only tests.
- Desktop/mobile dashboard permission handling and personalized email rendering passed without sending a message. Public metadata validation passed for 30 routes.
