/**
 * Unified Google Tag (gtag.js) integration.
 *
 * Loads a single gtag.js script for GT-TQK4WH8K, which routes data to
 * linked GA4 (G-9WNEM9ZHE7) and Google Ads (AW-17978085462) destinations.
 *
 * Uses Consent Mode v2: scripts load immediately with "denied" defaults,
 * then update to "granted" when the user accepts cookies.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GOOGLE_TAG_ID = import.meta.env.VITE_GOOGLE_TAG_ID || "GT-TQK4WH8K";
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || "G-9WNEM9ZHE7";
const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID || "AW-17978085462";
const CONVERSION_LABEL: string | undefined = import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL;

let loaded = false;

function gtag(...args: unknown[]): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/**
 * Initialize Google Tag with Consent Mode v2.
 * Call once on app mount. Loads immediately — consent mode gates data collection.
 */
export function initGoogleTag(): void {
  if (loaded) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;

  // Consent Mode v2: set denied defaults BEFORE loading the script
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });

  // If user already accepted cookies, update consent immediately
  try {
    if (localStorage.getItem("cookie_consent") === "accepted") {
      gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
      });
    }
  } catch {
    // localStorage unavailable
  }

  gtag("js", new Date());

  // Configure the Google Tag (routes to linked GA4 + Ads destinations)
  gtag("config", GOOGLE_TAG_ID, { send_page_view: false });

  // Explicit GA4 config for measurement ID
  gtag("config", GA4_MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`;
  document.head.appendChild(script);
}

/** Update consent to granted. Call when user accepts cookies. */
export function updateConsent(): void {
  gtag("consent", "update", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
  });
}

/** Track a page view for SPA route changes. */
export function trackPageView(path: string): void {
  gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.origin + path,
  });
}

/** Track a Google Ads sign-up conversion. */
export function trackSignUpConversion(): void {
  if (!CONVERSION_LABEL) return;
  gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}`,
  });
}

/** Track a custom Google event. */
export function trackGoogleEvent(eventName: string, params?: Record<string, unknown>): void {
  gtag("event", eventName, params);
}
