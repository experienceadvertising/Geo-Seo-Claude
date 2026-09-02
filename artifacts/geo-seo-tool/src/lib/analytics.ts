type ConsentChoice = "all" | "essential";

export interface TrackingConsent {
  analytics: boolean;
  ads: boolean;
  updatedAt: string;
}

export interface AttributionTouch {
  landingPage: string;
  referrer: string | null;
  capturedAt: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  gclid: string | null;
  msclkid: string | null;
  fbclid: string | null;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
    _linkedin_partner_id?: string;
    _linkedin_data_partner_ids?: string[];
    lintrk?: (...args: any[]) => void;
  }
}

const CONSENT_KEY = "aeo.trackingConsent";
const FIRST_TOUCH_KEY = "aeo.firstTouch";
const LAST_TOUCH_KEY = "aeo.lastTouch";

// GA4 measurement IDs are public identifiers. Keep the production property as a
// fallback so a Replit build cannot silently remove analytics when Vite does not
// receive the environment variable during its build step.
// Dev/preview builds never fall back, so local sessions can't pollute the
// live property once a tester accepts cookies.
const GA4_MEASUREMENT_ID =
  (import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined) ||
  (import.meta.env.PROD ? "G-H3L37CSDKR" : undefined);
const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined;
const GOOGLE_ADS_SIGNUP_LABEL = import.meta.env.VITE_GOOGLE_ADS_SIGNUP_LABEL as string | undefined;
const GOOGLE_ADS_ACTIVATION_LABEL = import.meta.env.VITE_GOOGLE_ADS_ACTIVATION_LABEL as string | undefined;
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
const LINKEDIN_PARTNER_ID = import.meta.env.VITE_LINKEDIN_PARTNER_ID as string | undefined;

let initialized = false;

function safeRead<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in hardened browsers.
  }
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = (...args: any[]) => {
      window.dataLayer!.push(args);
    };
  }
}

function addScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function applyGoogleConsent(consent: TrackingConsent | null) {
  ensureGtag();
  window.gtag!("consent", consent ? "update" : "default", {
    analytics_storage: consent?.analytics ? "granted" : "denied",
    ad_storage: consent?.ads ? "granted" : "denied",
    ad_user_data: consent?.ads ? "granted" : "denied",
    ad_personalization: consent?.ads ? "granted" : "denied",
    wait_for_update: consent ? 0 : 500,
  });
}

function initializeGoogle(consent: TrackingConsent) {
  if (!consent.analytics && !consent.ads) return;
  const loaderId = GA4_MEASUREMENT_ID || GOOGLE_ADS_ID;
  if (!loaderId) return;

  ensureGtag();
  addScript("aeo-google-tag", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(loaderId)}`);
  window.gtag!("js", new Date());

  if (consent.analytics && GA4_MEASUREMENT_ID) {
    window.gtag!("config", GA4_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: consent.ads,
    });
  }
  if (consent.ads && GOOGLE_ADS_ID) {
    window.gtag!("config", GOOGLE_ADS_ID);
  }
}

function initializeMeta(consent: TrackingConsent) {
  if (!consent.ads || !META_PIXEL_ID || window.fbq) return;
  const fbq = (...args: any[]) => {
    if ((fbq as any).callMethod) (fbq as any).callMethod(...args);
    else (fbq as any).queue.push(args);
  };
  (fbq as any).queue = [];
  (fbq as any).loaded = true;
  (fbq as any).version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;
  addScript("aeo-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
  window.fbq("init", META_PIXEL_ID);
}

function initializeLinkedIn(consent: TrackingConsent) {
  if (!consent.ads || !LINKEDIN_PARTNER_ID) return;
  window._linkedin_partner_id = LINKEDIN_PARTNER_ID;
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  if (!window._linkedin_data_partner_ids.includes(LINKEDIN_PARTNER_ID)) {
    window._linkedin_data_partner_ids.push(LINKEDIN_PARTNER_ID);
  }
  addScript("aeo-linkedin-insight", "https://snap.licdn.com/li.lms-analytics/insight.min.js");
}

function initializeVendors(consent: TrackingConsent) {
  initializeGoogle(consent);
  initializeMeta(consent);
  initializeLinkedIn(consent);
}

function readTouch(): AttributionTouch {
  const params = new URLSearchParams(window.location.search);
  return {
    landingPage: window.location.pathname + window.location.search,
    referrer: document.referrer || null,
    capturedAt: new Date().toISOString(),
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmTerm: params.get("utm_term"),
    utmContent: params.get("utm_content"),
    gclid: params.get("gclid"),
    msclkid: params.get("msclkid"),
    fbclid: params.get("fbclid"),
  };
}

export function captureAttribution() {
  if (typeof window === "undefined") return;
  const touch = readTouch();
  const hasCampaignSignal = Boolean(
    touch.utmSource || touch.utmMedium || touch.utmCampaign || touch.utmTerm ||
    touch.utmContent || touch.gclid || touch.msclkid || touch.fbclid,
  );
  if (!safeRead<AttributionTouch>(FIRST_TOUCH_KEY)) safeWrite(FIRST_TOUCH_KEY, touch);
  if (hasCampaignSignal || !safeRead<AttributionTouch>(LAST_TOUCH_KEY)) {
    safeWrite(LAST_TOUCH_KEY, touch);
  }
}

export function getAttribution() {
  if (typeof window === "undefined") return { firstTouch: null, lastTouch: null };
  return {
    firstTouch: safeRead<AttributionTouch>(FIRST_TOUCH_KEY),
    lastTouch: safeRead<AttributionTouch>(LAST_TOUCH_KEY),
  };
}

export function getTrackingConsent(): TrackingConsent | null {
  if (typeof window === "undefined") return null;
  return safeRead<TrackingConsent>(CONSENT_KEY);
}

export function setTrackingConsent(choice: ConsentChoice) {
  const consent: TrackingConsent = {
    analytics: choice === "all",
    ads: choice === "all",
    updatedAt: new Date().toISOString(),
  };
  safeWrite(CONSENT_KEY, consent);
  applyGoogleConsent(consent);
  initializeVendors(consent);
  window.dispatchEvent(new CustomEvent("aeo:consent-updated", { detail: consent }));
}

export function initializeAnalytics() {
  if (typeof window === "undefined") return;
  captureAttribution();
  const consent = getTrackingConsent();
  applyGoogleConsent(consent);
  if (consent) initializeVendors(consent);
  initialized = true;
}

function eventContext() {
  const { firstTouch, lastTouch } = getAttribution();
  return {
    page_path: window.location.pathname + window.location.search,
    first_utm_source: firstTouch?.utmSource ?? undefined,
    first_utm_campaign: firstTouch?.utmCampaign ?? undefined,
    last_utm_source: lastTouch?.utmSource ?? undefined,
    last_utm_campaign: lastTouch?.utmCampaign ?? undefined,
  };
}

export function trackEvent(name: string, parameters: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (!initialized) initializeAnalytics();
  const consent = getTrackingConsent();
  if (!consent?.analytics) return;

  const payload = { ...eventContext(), ...parameters };
  window.gtag?.("event", name, payload);
  if (consent.ads) {
    const metaStandardEvents: Record<string, string> = {
      sign_up_complete: "CompleteRegistration",
      audit_completed: "Lead",
      checkout_started: "InitiateCheckout",
    };
    const standardEvent = metaStandardEvents[name];
    if (standardEvent) window.fbq?.("track", standardEvent, payload);
    else window.fbq?.("trackCustom", name, payload);
  }
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  if (!initialized) initializeAnalytics();
  const consent = getTrackingConsent();
  if (!consent?.analytics) return;

  window.gtag?.("event", "page_view", {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });
  if (consent.ads) window.fbq?.("track", "PageView");
}

export function trackGoogleAdsConversion(
  kind: "signup" | "activation",
  parameters: { value?: number; currency?: string; transactionId?: string } = {},
) {
  const consent = getTrackingConsent();
  if (!consent?.ads || !GOOGLE_ADS_ID) return;
  const label = kind === "signup" ? GOOGLE_ADS_SIGNUP_LABEL : GOOGLE_ADS_ACTIVATION_LABEL;
  if (!label) return;

  window.gtag?.("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    value: parameters.value,
    currency: parameters.currency,
    transaction_id: parameters.transactionId,
  });
}
