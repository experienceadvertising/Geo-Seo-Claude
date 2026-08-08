# Advertising measurement setup

This implementation keeps advertising and analytics scripts off until a visitor accepts analytics cookies. The IDs below are configuration values, not passwords, but keeping them in environment variables makes staging and production easier to manage.

## Values to add

Add these values to the production app environment:

```
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GOOGLE_ADS_ID=AW-XXXXXXXXX
VITE_GOOGLE_ADS_SIGNUP_LABEL=XXXXXXXXXXXX
VITE_GOOGLE_ADS_ACTIVATION_LABEL=XXXXXXXXXXXX
```

Optional channels:

```
VITE_META_PIXEL_ID=123456789012345
VITE_LINKEDIN_PARTNER_ID=1234567
```

Do not add a Google Ads account login, API secret, Meta access token, or private key. This browser tracking setup does not need them.

## GA4

1. Open Google Analytics, then Admin.
2. Under Data collection and modification, open Data streams.
3. Select the AEO Improvement web stream or create one for `https://aeoimprovement.com`.
4. Copy the Measurement ID beginning with `G-`.
5. Add it as `VITE_GA4_MEASUREMENT_ID`.

The app sends page views and these launch events: `audit_url_submitted`, `sign_up_started`, `sign_up_complete`, `audit_started`, `audit_completed`, `checkout_started`, and `billing_portal_opened`. Campaign parameters and click IDs are attached as first-touch and last-touch attribution when available.

## Google Ads conversions

1. Open Google Ads.
2. Go to Goals, Conversions, then Summary.
3. Create a website conversion named `Account created`.
4. Use the Sign-up category, no assigned value for now, and count One.
5. Create a second website conversion named `First audit completed`.
6. Use Submit lead or Qualified lead, no assigned value for now, and count One.
7. Open each conversion's tag setup and copy the shared Conversion ID beginning with `AW-`.
8. Copy the unique conversion label for each action.
9. Add the ID and labels using the environment names above.

Use `First audit completed` as the primary advertising optimization event. Keep `Account created` as a secondary conversion until signup quality is proven.

## Meta Pixel, optional

1. Open Events Manager.
2. Connect a Web data source and create or select the AEO Improvement pixel.
3. Copy the numeric Pixel ID.
4. Add it as `VITE_META_PIXEL_ID`.

The app sends `PageView`, `CompleteRegistration`, `Lead`, and `InitiateCheckout` after consent.

## LinkedIn Insight Tag, optional

1. Open Campaign Manager.
2. Go to Analyze, Insight Tag.
3. Copy the numeric Partner ID.
4. Add it as `VITE_LINKEDIN_PARTNER_ID`.

## Validation before spending

1. Visit the site in a private window.
2. Confirm no analytics or ad scripts load before consent.
3. Accept analytics and confirm GA4 receives a page view in Realtime or DebugView.
4. Complete a test signup and first audit.
5. Confirm the events appear in GA4.
6. Use Google Tag Assistant to confirm the Google Ads conversion tags.
7. If enabled, confirm Meta Pixel Helper and LinkedIn Campaign Manager see their tags.
8. Test Essential only and confirm nonessential scripts stay blocked.

Do not optimize campaigns to a client-side purchase event. Stripe webhooks remain the billing source of truth.
