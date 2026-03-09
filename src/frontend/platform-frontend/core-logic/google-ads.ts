/**
 * Google Ads conversion tracking.
 *
 * gtag.js is loaded statically in index.html with Consent Mode v2.
 * This module provides helpers to fire conversion and custom events.
 * Conversion label for sign-up: set VITE_GOOGLE_ADS_CONVERSION_LABEL after
 * creating the conversion action in Google Ads (Tools > Conversions).
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GOOGLE_ADS_ID = "AW-17978085462";
const CONVERSION_LABEL: string | undefined = import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL;

/** No-op — gtag.js is now loaded statically in index.html with consent mode. */
export function initGoogleAds(): void {
  // Tag loads from HTML <head>; consent mode handles privacy.
}

/** Track a Google Ads sign-up conversion. */
export function trackSignUpConversion(): void {
  if (!CONVERSION_LABEL || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}`,
  });
}

/** Track a custom Google Ads event (e.g. docs engagement, CLI install page). */
export function trackGoogleAdsEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}
