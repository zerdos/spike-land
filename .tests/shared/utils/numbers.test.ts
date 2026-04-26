import { describe, it, expect } from "vitest";
import { parsePositiveInt } from "../../../src/core/shared-utils/core-logic/numbers.js";

describe("parsePositiveInt", () => {
  it("returns the default for non-string input", () => {
    expect(parsePositiveInt(undefined, 50, 200)).toBe(50);
    expect(parsePositiveInt(null, 50, 200)).toBe(50);
    expect(parsePositiveInt(42, 50, 200)).toBe(50);
    expect(parsePositiveInt({}, 50, 200)).toBe(50);
    expect(parsePositiveInt([], 50, 200)).toBe(50);
  });

  it("returns the default for NaN / non-numeric strings", () => {
    expect(parsePositiveInt("abc", 50, 200)).toBe(50);
    expect(parsePositiveInt("", 50, 200)).toBe(50);
    expect(parsePositiveInt("  ", 50, 200)).toBe(50);
  });

  it("returns the default for negative integers", () => {
    expect(parsePositiveInt("-1", 50, 200)).toBe(50);
    expect(parsePositiveInt("-100", 50, 200)).toBe(50);
  });

  it("returns the default for zero", () => {
    expect(parsePositiveInt("0", 50, 200)).toBe(50);
  });

  it("caps valid input at max", () => {
    expect(parsePositiveInt("1000000", 50, 200)).toBe(200);
    expect(parsePositiveInt("201", 50, 200)).toBe(200);
    expect(parsePositiveInt("200", 50, 200)).toBe(200);
  });

  it("returns the parsed value when within bounds", () => {
    expect(parsePositiveInt("1", 50, 200)).toBe(1);
    expect(parsePositiveInt("42", 50, 200)).toBe(42);
    expect(parsePositiveInt("199", 50, 200)).toBe(199);
  });

  it("parses leading-numeric strings (parseInt semantics)", () => {
    expect(parsePositiveInt("42abc", 50, 200)).toBe(42);
  });
});
