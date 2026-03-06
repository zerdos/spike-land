import { describe, expect, it } from "vitest";
import * as index from "../../src/cli/spike-cli/core-logic/index.js";

describe("index", () => {
  it("exports expected symbols", () => {
    expect(index.discoverConfig).toBeDefined();
    expect(index.validateConfig).toBeDefined();
    expect(index.setVerbose).toBeDefined();
  });

  it("exports all public API symbols", () => {
    expect(index.ChatClient).toBeDefined();
    expect(index.runAgentLoop).toBeDefined();
    expect(index.ServerManager).toBeDefined();
  });
});
