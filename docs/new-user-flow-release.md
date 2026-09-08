# New-user flow

## Implemented
- First audit opens the saved site plan with a first-result heading.
- A shared site-wide queue is used by Dashboard, Site scan and the Action plan landing page. Specific task links retain the page-level editing view.
- Completion invalidates the shared queue. Page scanning is secondary to making the first change.
- Saved sites come from the authenticated user's audit history.
- Scan allowance is displayed, checked before the batch, and refreshed afterward. Server-side quota enforcement remains unchanged.
- Registration stores validated onboarding URL context. The authenticated /api/me response restores it until the first audit milestone. On another device the URL is prefilled for explicit continuation, not silently scanned.

## Release requirements
The additive users.onboarding_url column must exist before serving the new code. The existing startup product migration adds it before the server listens. The equivalent idempotent SQL is scripts/sql/onboarding-url.sql. No production database changes have been performed as part of local implementation.

## Validation
- Workspace typecheck passed.
- Frontend tests (43) passed.
- Existing API test suite and the new onboarding URL test passed.
- API and frontend production builds passed.
- Synthetic browser checks passed for page scans, failure recovery, free restrictions, mobile width, same-browser handoff and cross-device URL prefill without an automatic provider request.
- Production email verification, real database migration and live deployment remain release checks. No real emails or paid scans were used in these tests.

Existing accounts without saved onboarding context still enter their website manually. This change cannot recover URLs that were never saved during past registrations.
