/**
 * Tests for terminal/auth.ts — resolveTerminalChatClientOptions
 *
 * This module is 0% covered. It has three distinct code paths:
 *   1. No API key AND no OAuth token  → throws
 *   2. API key present                → uses apiKey
 *   3. Only OAuth token present       → uses authToken
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveTerminalChatClientOptions } from "../../../../src/cli/spike-cli/core-logic/terminal/auth.js";

const ENV_KEYS = ["ANTHROPIC_API_KEY", "CLAUDE_CODE_OAUTH_TOKEN"] as const;

function clearEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe("resolveTerminalChatClientOptions", () => {
  beforeEach(clearEnv);
  afterEach(clearEnv);

  it("throws when neither ANTHROPIC_API_KEY nor CLAUDE_CODE_OAUTH_TOKEN is set", () => {
    expect(() => resolveTerminalChatClientOptions({ model: "claude-sonnet-4-6" })).toThrow(
      /ANTHROPIC_API_KEY|CLAUDE_CODE_OAUTH_TOKEN/,
    );
  });

  it("returns apiKey when ANTHROPIC_API_KEY is set", () => {
    process.env["ANTHROPIC_API_KEY"] = "test-api-key";
    const opts = resolveTerminalChatClientOptions({ model: "claude-sonnet-4-6" });
    expect(opts.apiKey).toBe("test-api-key");
    expect(opts.authToken).toBeUndefined();
    expect(opts.model).toBe("claude-sonnet-4-6");
  });

  it("prefers ANTHROPIC_API_KEY over CLAUDE_CODE_OAUTH_TOKEN when both are set", () => {
    process.env["ANTHROPIC_API_KEY"] = "api-key";
    process.env["CLAUDE_CODE_OAUTH_TOKEN"] = "oauth-token";
    const opts = resolveTerminalChatClientOptions({});
    expect(opts.apiKey).toBe("api-key");
    expect(opts.authToken).toBeUndefined();
  });

  it("returns authToken when only CLAUDE_CODE_OAUTH_TOKEN is set", () => {
    process.env["CLAUDE_CODE_OAUTH_TOKEN"] = "bearer-token";
    const opts = resolveTerminalChatClientOptions({});
    expect(opts.authToken).toBe("bearer-token");
    expect(opts.apiKey).toBeUndefined();
  });

  it("omits model when options.model is falsy", () => {
    process.env["ANTHROPIC_API_KEY"] = "key";
    const opts = resolveTerminalChatClientOptions({});
    expect(opts.model).toBeUndefined();
  });

  it("includes model when options.model is provided", () => {
    process.env["ANTHROPIC_API_KEY"] = "key";
    const opts = resolveTerminalChatClientOptions({ model: "claude-haiku-3" });
    expect(opts.model).toBe("claude-haiku-3");
  });
});
