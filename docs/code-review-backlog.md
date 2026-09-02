# Code review backlog (September 2026)

Findings from a full-app review that were verified against the code but
deliberately **not** changed in the same pass, because each needs a product
decision, a data migration, or a larger refactor. Ordered by value.

## Needs a decision or migration

- **`users.email` has no unique constraint.** Registration is check-then-insert,
  so two concurrent sign-ups for the same address create two rows and login
  picks one arbitrarily. Fix: `uniqueIndex` on `lower(email)` + catch `23505`
  in `/auth/register` → 409. Not applied because `drizzle-kit push` would fail
  if duplicates already exist in production — dedupe first.
- **Referral codes are 32-bit** (`randomBytes(4)`). Birthday-bound collisions
  become likely around ~65k users and a collision makes registration 500.
  Move to 8 bytes (or retry on `23505`); existing codes stay valid.
- **Google integration gating is inconsistent.** `/google/connect` and the
  Search Console routes use the trial-aware `requirePro`; the GA4 property and
  AI-referral routes use `requirePaidSubscription`. A trial user can connect,
  then dead-ends with a 403 on the GA4 picker. Pick one gate (or block
  `/connect` for trials) so the UI never shows a half-working integration.
- **Checkout 409s users whose subscription is `unpaid`/`paused`/`incomplete`.**
  They have already been downgraded to free by the webhook but cannot
  re-purchase. Prefer entitling statuses when deciding whether to block, and
  route non-entitling blockers to the billing portal explicitly.

## Frontend

- **`<Link><Button/></Link>` renders `<a><button>`** (invalid nesting, two tab
  stops) in layout, home, pricing, projects, results, not-found and the auth
  pages. Use `<Button asChild><Link …/></Button>`.
- **Prerender manifest titles diverge from runtime titles** for `/pricing` and
  `/vs/*`, so JS and non-JS crawlers see different pages. Import the manifest
  (or a shared TS module) from both the page components and `prerender.mjs`.
- **Main-flow form labels lack `htmlFor`/`id`** on the simulate page; a few
  icon-only buttons lack `aria-label`; the "How?" tooltip trigger on results
  is a non-focusable `div`.
- **Split the three 1.1k-line pages** (`home.tsx`, `results.tsx`,
  `simulate.tsx`) and drop the `as any` casts on API data — the generated
  client already has `SimulationResult`/`Audit` types.
- **Stripe/checkout plumbing is copy-pasted** across pricing, upgrade and
  home (`getPriceForPlan`, `formatPrice`, the `?checkout=` toast effect).
  Move into `hooks/useStripe.ts`.

## Server quality

- **Three copies of the host allow-list** (`app.ts`, `routes/auth.ts`,
  `lib/publicUrl.ts`); consolidate on `publicUrl.ts`.
- **N+1 `getUserPlan()`** per user/target in `emailScheduler.ts` and
  `seoTrackingScheduler.ts`; resolve the plan in the query.
- **`pageRenderer` re-resolves DNS for every sub-resource request** on every
  render; cache per-hostname verdicts for the lifetime of the page.
- **Share-of-voice loads every simulation's full results JSON** for a domain
  with no limit (`routes/geo/simulate.ts`); aggregate in SQL or cap to the
  last N runs.
- **Dead code / unused deps**: `stripeStorage.listProductsWithPrices`,
  `getActiveSubscriptionForCustomer`; `cookie-parser`, `http-proxy-middleware`
  and `svix` are in `package.json` but imported nowhere. `/auth/me` and `/me`
  overlap — `/me` is a superset.
