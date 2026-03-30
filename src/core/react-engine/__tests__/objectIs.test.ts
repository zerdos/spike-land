import { describe, it, expect } from "vitest";
import objectIs from "../core-logic/shared/objectIs.js";

describe("objectIs", () => {
  it("returns true for identical primitives", () => {
    expect(objectIs(1, 1)).toBe(true);
    expect(objectIs("hello", "hello")).toBe(true);
    expect(objectIs(true, true)).toBe(true);
    expect(objectIs(null, null)).toBe(true);
    expect(objectIs(undefined, undefined)).toBe(true);
  });

  it("returns false for different primitives", () => {
    expect(objectIs(1, 2)).toBe(false);
    expect(objectIs("a", "b")).toBe(false);
    expect(objectIs(true, false)).toBe(false);
  });

  it("returns false for null vs undefined", () => {
    expect(objectIs(null, undefined)).toBe(false);
    expect(objectIs(undefined, null)).toBe(false);
  });

  it("handles NaN correctly — NaN === NaN", () => {
    expect(objectIs(NaN, NaN)).toBe(true);
  });

  it("distinguishes +0 and -0", () => {
    expect(objectIs(0, -0)).toBe(false);
    expect(objectIs(-0, 0)).toBe(false);
    expect(objectIs(+0, +0)).toBe(true);
    expect(objectIs(-0, -0)).toBe(true);
  });

  it("returns false for different object references", () => {
    const a = {};
    const b = {};
    expect(objectIs(a, b)).toBe(false);
  });

  it("returns true for the same object reference", () => {
    const obj = { x: 1 };
    expect(objectIs(obj, obj)).toBe(true);
  });
});
