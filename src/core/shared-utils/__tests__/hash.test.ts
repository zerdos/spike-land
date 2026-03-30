import { describe, it, expect } from "vitest";
import { fnv1a } from "../core-logic/hash.js";

describe("fnv1a", () => {
  it("returns a number", () => {
    expect(typeof fnv1a("hello")).toBe("number");
  });

  it("is deterministic — same input produces the same hash", () => {
    expect(fnv1a("spike.land")).toBe(fnv1a("spike.land"));
  });

  it("produces different hashes for different inputs", () => {
    expect(fnv1a("foo")).not.toBe(fnv1a("bar"));
    expect(fnv1a("user-1")).not.toBe(fnv1a("user-2"));
  });

  it("handles empty string without throwing", () => {
    expect(() => fnv1a("")).not.toThrow();
  });

  it("returns a 32-bit unsigned integer (fits in 0..2^32-1)", () => {
    const hash = fnv1a("test");
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(0xffffffff);
  });

  it("distributes well across known test strings", () => {
    const inputs = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const hashes = inputs.map(fnv1a);
    const unique = new Set(hashes);
    expect(unique.size).toBe(inputs.length);
  });

  it("handles unicode characters", () => {
    const hash = fnv1a("hello 世界");
    expect(typeof hash).toBe("number");
    expect(hash).toBeGreaterThanOrEqual(0);
  });

  it("known hash — 'hello' matches FNV-1a 32-bit reference value", () => {
    // FNV-1a 32-bit of "hello" = 0xa430d84a (decimal: 2754731082)
    expect(fnv1a("hello")).toBe(0xa430d84a);
  });
});
