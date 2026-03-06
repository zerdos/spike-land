import { describe, expect, it } from "vitest";
import { SPIKE_CONFIG_VERSION } from "../../../src/cli/spike-cli/core-logic/config/types";

describe("config types", () => {
  it("defines SPIKE_CONFIG_VERSION", () => {
    expect(SPIKE_CONFIG_VERSION).toBe(1);
  });
});
