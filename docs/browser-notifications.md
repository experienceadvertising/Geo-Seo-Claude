# Browser notifications

Browser notifications are opt-in. The app does not ask for browser permission until the signed-in user clicks **Enable notifications**. The feature stays hidden unless all three server variables below are present.

## Server configuration

- `VAPID_PUBLIC_KEY`: the public Web Push application key. It is safe to return to the signed-in browser.
- `VAPID_PRIVATE_KEY`: the private Web Push application key. Keep it only in server-side secret storage.
- `VAPID_SUBJECT`: a contact URI, such as `mailto:info@aeoimprovement.com`.

Generate one key pair for the production application with `pnpm exec web-push generate-vapid-keys`. Do not commit the output. Save the private key only in Replit Secrets or equivalent server-side secret storage.

## Product behavior

- The app stores the browser-provided endpoint and encryption keys against the signed-in account.
- Notifications contain a short task title and an account-relative link. They do not include page excerpts, scores, search queries, or detailed audit content.
- Expired endpoints reported with HTTP 404 or 410 are deleted automatically.
- The user can turn notifications off on the browser where they enabled them.
- Audit completion and simulation completion can trigger an immediate update. Paid weekly summaries can also send the same next action used in the matching email.

## Release check

1. Confirm the feature is hidden when the three variables are absent.
2. Confirm no permission prompt appears on page load.
3. Click **Enable notifications** and confirm the browser permission prompt appears only then.
4. Confirm a subscription is stored for the current account and cannot be claimed by another account.
5. Send a test push to a dedicated internal account. Confirm the link opens the expected AEO Improvement task.
6. Disable the subscription and confirm the current browser no longer receives notifications.
