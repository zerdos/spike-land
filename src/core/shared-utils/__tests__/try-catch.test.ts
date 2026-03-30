import { describe, it, expect } from "vitest";
import { tryCatch } from "../core-logic/try-catch.js";

describe("tryCatch", () => {
  it("wraps a resolved promise in { data, error: null }", async () => {
    const result = await tryCatch(Promise.resolve(42));
    expect(result.data).toBe(42);
    expect(result.error).toBeNull();
  });

  it("wraps a rejected promise in { data: null, error }", async () => {
    const err = new Error("boom");
    const result = await tryCatch(Promise.reject(err));
    expect(result.data).toBeNull();
    expect(result.error).toBe(err);
  });

  it("works with non-Error thrown values", async () => {
    const result = await tryCatch(Promise.reject("string error"));
    expect(result.data).toBeNull();
    expect(result.error).toBe("string error");
  });

  it("preserves complex resolved values", async () => {
    const payload = { id: "abc", scores: [1, 2, 3] };
    const result = await tryCatch(Promise.resolve(payload));
    expect(result.data).toEqual(payload);
    expect(result.error).toBeNull();
  });

  it("handles null resolved value", async () => {
    const result = await tryCatch(Promise.resolve(null));
    // null is a valid data value
    expect(result.error).toBeNull();
  });

  it("handles undefined resolved value", async () => {
    const result = await tryCatch(Promise.resolve(undefined));
    expect(result.error).toBeNull();
    expect(result.data).toBeUndefined();
  });

  it("does not throw — always returns a Result shape", async () => {
    const alwaysRejects = async () => tryCatch(Promise.reject(new Error("oops")));
    await expect(alwaysRejects()).resolves.toMatchObject({ data: null });
  });
});
