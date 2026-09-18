import { test } from "node:test";
import assert from "node:assert/strict";
import { CAMPAIGN_ID, renderNewsletter } from "./strategy-newsletter.mjs";

test("strategy newsletter credits sources, includes working destinations, and escapes names", () => {
  const message = renderNewsletter("A <Buyer>", "123 Example St, Example City, NY 10001", "https://aeoimprovement.com/api/auth/unsubscribe?token=fixture");
  assert.equal(CAMPAIGN_ID, "seo-geo-strategies-2026-09-17");
  assert.match(message.html, /Hi A &lt;Buyer&gt;/);
  assert.doesNotMatch(message.html, /Hi A <Buyer>/);
  assert.match(message.text, /Cyrus Shepard, Zyppy Signal/);
  assert.match(message.html, /developers\.google\.com\/search\/docs\/appearance\/ai-features/);
  assert.match(message.html, /seo-geo-priorities-2026/);
  assert.match(message.html, /improve-service-pages-for-ai-search/);
  assert.match(message.html, /pm:unsubscribe/);
  assert.match(message.html, /123 Example St/);
  assert.match(message.html, /A PRACTICAL FIELD NOTE/);
  assert.match(message.html, /Check the facts beyond your site/);
  assert.match(message.text, /bought links and made-up reviews are not a shortcut/);
  assert.match(message.html, /Use the step-by-step guide/);
  assert.doesNotMatch(message.html + message.text, /—/);
  assert.doesNotMatch(message.html, /guarantees a ranking or AI citation(?!\.)/);
});

test("strategy newsletter refuses a missing postal address", () => {
  assert.throws(() => renderNewsletter("", "", "https://aeoimprovement.com/unsubscribe"), /postal address/);
});
