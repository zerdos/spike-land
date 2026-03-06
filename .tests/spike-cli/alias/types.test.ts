import { describe, expect, it } from "vitest";
import { ALIAS_CONFIG_VERSION } from "../../../src/cli/spike-cli/core-logic/alias/types";

describe("alias types", () => {
  it("defines ALIAS_CONFIG_VERSION", () => {
    expect(ALIAS_CONFIG_VERSION).toBe(1);
  });
});
