# Actionable simulation follow-up

## Intended loop

Simulation completed -> read successful answers and errors -> choose a relevant page -> implement one supported improvement -> record the task -> review subsequent SEO data and comparable AI answers.

The completion message uses counts from the completed run, excluding failed engine answers. A failed run is not described as zero visibility. Optional on-site and off-site strategies are explicitly not diagnoses of why a brand was omitted. No ranking or citation gains are promised.

The AI visibility workspace repeats the implementation loop with links to Action plan, off-site resources and SEO performance. Paid weekly digests retain their existing unfinished-task selection, add an optional off-site check and point to the new workspace routes. Existing educational and onboarding messages use the current Action plan label.

## Delivery boundaries

No changes to send frequency, recipient selection, consent, unsubscribe handling, quotas, billing or provider calls. No historical emails are resent. No new drip enrollment or automatic outreach is introduced. The existing simulation completion trigger passes only mention/citation booleans and error state into the template; raw answers and provider errors are not included in the message.

## Evidence and measurement

Reviewed Google Search Central's AI features guidance and link-spam policy on September 5, 2026:

- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/essentials/spam-policies#link-spam

Editorial implementation suggestions complement the existing audit catalog, rather than adding new scoring factors. Judge this workflow by relevant completed improvements and subsequent measurement, not email opens alone. Review after sufficient usage; do not promise an engagement benchmark without data.

## Offline validation

Run `node --experimental-strip-types scripts/preview-simulation-email.mjs OUTPUT_DIRECTORY` for synthetic no-mention, partial and failed-run previews. This imports no sender and sends no emails.

Regression tests cover missing audit context, successful and failed answers, escaping, HTML/text next-step parity and paid-digest deep links. Publication and a real delivered-email check require a separate release; local previews are not delivery proof.
