import { describe, it, expect } from "vitest";
import shallowEqual from "../core-logic/shared/shallowEqual.js";

describe("shallowEqual", () => {
  it("returns true for two empty objects", () => {
    expect(shallowEqual({}, {})).toBe(true);
  });

  it("returns true when all top-level properties are strictly equal", () => {
    expect(shallowEqual({ a: 1, b: "x" }, { a: 1, b: "x" })).toBe(true);
  });

  it("returns false when a property value differs", () => {
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("returns false when the objects have different numbers of keys", () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });

  it("returns false when a key is missing in the second object", () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
  });

  it("returns true for the same primitive value (identity)", () => {
    expect(shallowEqual(42, 42)).toBe(true);
    expect(shallowEqual("str", "str")).toBe(true);
  });

  it("returns true for the same object reference", () => {
    const obj = { x: 1 };
    expect(shallowEqual(obj, obj)).toBe(true);
  });

  it("returns false for different object references with nested objects (shallow)", () => {
    const inner = { z: 1 };
    // Same nested reference — shallow equal sees same reference
    expect(shallowEqual({ a: inner }, { a: inner })).toBe(true);

    // Different nested reference — shallow equal returns false even if deeply equal
    expect(shallowEqual({ a: { z: 1 } }, { a: { z: 1 } })).toBe(false);
  });

  it("returns false when one argument is null", () => {
    expect(shallowEqual(null, {})).toBe(false);
    expect(shallowEqual({}, null)).toBe(false);
  });

  it("returns true when both arguments are null", () => {
    expect(shallowEqual(null, null)).toBe(true);
  });

  it("correctly handles NaN values via objectIs semantics", () => {
    expect(shallowEqual({ a: NaN }, { a: NaN })).toBe(true);
  });

  it("correctly distinguishes +0 and -0 via objectIs semantics", () => {
    expect(shallowEqual({ a: 0 }, { a: -0 })).toBe(false);
  });

  it("handles non-object types (numbers, strings) — returns false if not identical", () => {
    expect(shallowEqual(1, 2)).toBe(false);
    expect(shallowEqual("a", "b")).toBe(false);
  });
});
