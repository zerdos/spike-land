import { describe, expect, it } from "vitest";
import { ALIAS_CONFIG_VERSION } from "../../../src/spike-cli/alias/types";

describe("alias types", () => {
  it("defines ALIAS_CONFIG_VERSION", () => {
    expect(ALIAS_CONFIG_VERSION).toBe(1);
  });
});
