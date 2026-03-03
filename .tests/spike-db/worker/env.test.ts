import { describe, expect, it } from "vitest";
import { ENV_VARS } from "../../../src/spike-db/worker/env.js";

describe("env", () => {
  it("defines ENV_VARS", () => {
    expect(ENV_VARS).toContain("SPIKE_DATABASE");
  });
});
