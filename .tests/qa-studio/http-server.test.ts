import { describe, expect, it } from "vitest";

import { isAllowedQaStudioOrigin } from "../../src/core/browser-automation/lazy-imports/http-server";

describe("isAllowedQaStudioOrigin", () => {
  it("allows the local QA Studio browser origins used in dev", () => {
    expect(isAllowedQaStudioOrigin(undefined)).toBe(true);
    expect(isAllowedQaStudioOrigin("http://localhost:5173")).toBe(true);
    expect(isAllowedQaStudioOrigin("https://localhost:5173")).toBe(true);
    expect(isAllowedQaStudioOrigin("https://127.0.0.1:5173")).toBe(true);
    expect(isAllowedQaStudioOrigin("https://local.spike.land:5173")).toBe(true);
    expect(isAllowedQaStudioOrigin("https://spike.land")).toBe(true);
  });

  it("rejects unrelated origins", () => {
    expect(isAllowedQaStudioOrigin("https://evil.example")).toBe(false);
    expect(isAllowedQaStudioOrigin("https://localhost.evil.example:5173")).toBe(false);
  });
});
