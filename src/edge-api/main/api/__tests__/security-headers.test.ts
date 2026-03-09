import { describe, expect, it } from "vitest";
import { applySecurityHeaders, isAllowedBrowserOrigin } from "../lib/security-headers.js";

describe("security header policy", () => {
  it("allows configured origins, spike.land subdomains, and localhost", () => {
    const configuredOrigins = ["https://spike.land"];

    expect(isAllowedBrowserOrigin("https://spike.land", configuredOrigins)).toBe(true);
    expect(isAllowedBrowserOrigin("https://notes-pwa.spike.land", configuredOrigins)).toBe(true);
    expect(isAllowedBrowserOrigin("https://local.spike.land:5173", configuredOrigins)).toBe(true);
    expect(isAllowedBrowserOrigin("http://localhost:5173", configuredOrigins)).toBe(true);
    expect(isAllowedBrowserOrigin("https://evil.example.com", configuredOrigins)).toBe(false);
  });

  it("applies the stable worker security header set", () => {
    const headers = new Headers();

    applySecurityHeaders(headers);

    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("permissions-policy")).toBe("camera=(), microphone=(), geolocation=(), payment=()");
    expect(headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("strict-transport-security")).toContain("max-age=63072000");
    expect(headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(headers.get("content-security-policy")).toContain("frame-ancestors *");
    expect(headers.get("content-security-policy")).toContain("wss://chat.spike.land");
  });
});
