import { describe, it, expect } from "vitest";
import { oidcConfig, authProviders } from "./auth";

// Cast to Record to access OIDC fields that exist at runtime
// but are hidden behind a union type (AuthProviderProps = ...Settings | ...UserManager)
const config = oidcConfig as Record<string, unknown>;

describe("oidcConfig", () => {
  it("has required OIDC fields", () => {
    expect(config.authority).toBeDefined();
    expect(config.client_id).toBeDefined();
    expect(config.redirect_uri).toContain("/callback");
    expect(config.scope).toContain("openid");
    expect(config.response_type).toBe("code");
  });

  it("enables silent renew", () => {
    expect(config.automaticSilentRenew).toBe(true);
    expect(config.silent_redirect_uri).toContain("/silent-renew.html");
  });

  it("monitors session", () => {
    expect(config.monitorSession).toBe(true);
  });

  it("uses localStorage for state", () => {
    expect(config.userStore).toBeDefined();
  });
});

describe("authProviders", () => {
  it("includes github and google", () => {
    const ids = authProviders.map((p) => p.id);
    expect(ids).toContain("github");
    expect(ids).toContain("google");
  });

  it("has name and icon for each provider", () => {
    for (const provider of authProviders) {
      expect(provider.name).toBeTruthy();
      expect(provider.icon).toBeTruthy();
    }
  });
});
