import { describe, it, expect } from "vitest";
import { evaluateGuard, evaluateExpression } from "../core-logic/parser.js";

describe("evaluateExpression — literals", () => {
  const ctx = {};

  it("evaluates integer literals", () => {
    expect(evaluateExpression("42", ctx)).toBe(42);
    expect(evaluateExpression("0", ctx)).toBe(0);
  });

  it("evaluates floating point literals", () => {
    expect(evaluateExpression("3.14", ctx)).toBeCloseTo(3.14);
  });

  it("evaluates boolean literals", () => {
    expect(evaluateExpression("true", ctx)).toBe(true);
    expect(evaluateExpression("false", ctx)).toBe(false);
  });

  it("evaluates null literal", () => {
    expect(evaluateExpression("null", ctx)).toBeNull();
  });

  it("evaluates double-quoted string literals", () => {
    expect(evaluateExpression('"hello"', ctx)).toBe("hello");
  });

  it("evaluates single-quoted string literals", () => {
    expect(evaluateExpression("'world'", ctx)).toBe("world");
  });
});

describe("evaluateExpression — arithmetic", () => {
  const ctx = {};

  it("adds numbers", () => {
    expect(evaluateExpression("1 + 2", ctx)).toBe(3);
  });

  it("subtracts numbers", () => {
    expect(evaluateExpression("10 - 4", ctx)).toBe(6);
  });

  it("multiplies numbers", () => {
    expect(evaluateExpression("3 * 4", ctx)).toBe(12);
  });

  it("divides numbers", () => {
    expect(evaluateExpression("10 / 2", ctx)).toBe(5);
  });

  it("throws on division by zero", () => {
    expect(() => evaluateExpression("5 / 0", ctx)).toThrow("Division by zero");
  });

  it("handles exponentiation", () => {
    expect(evaluateExpression("2 ** 10", ctx)).toBe(1024);
  });

  it("respects operator precedence (* before +)", () => {
    expect(evaluateExpression("2 + 3 * 4", ctx)).toBe(14);
  });

  it("respects parentheses", () => {
    expect(evaluateExpression("(2 + 3) * 4", ctx)).toBe(20);
  });
});

describe("evaluateExpression — comparisons", () => {
  const ctx = {};

  it("== equality", () => {
    expect(evaluateExpression("1 == 1", ctx)).toBe(true);
    expect(evaluateExpression("1 == 2", ctx)).toBe(false);
  });

  it("!= inequality", () => {
    expect(evaluateExpression("1 != 2", ctx)).toBe(true);
    expect(evaluateExpression("1 != 1", ctx)).toBe(false);
  });

  it("> greater than", () => {
    expect(evaluateExpression("5 > 3", ctx)).toBe(true);
    expect(evaluateExpression("3 > 5", ctx)).toBe(false);
  });

  it("< less than", () => {
    expect(evaluateExpression("3 < 5", ctx)).toBe(true);
    expect(evaluateExpression("5 < 3", ctx)).toBe(false);
  });

  it(">= greater than or equal", () => {
    expect(evaluateExpression("5 >= 5", ctx)).toBe(true);
    expect(evaluateExpression("5 >= 6", ctx)).toBe(false);
  });

  it("<= less than or equal", () => {
    expect(evaluateExpression("4 <= 4", ctx)).toBe(true);
    expect(evaluateExpression("5 <= 4", ctx)).toBe(false);
  });
});

describe("evaluateExpression — logical operators", () => {
  const ctx = {};

  it("|| returns true if either side is truthy", () => {
    expect(evaluateExpression("true || false", ctx)).toBe(true);
    expect(evaluateExpression("false || false", ctx)).toBe(false);
  });

  it("&& returns true only when both sides are truthy", () => {
    expect(evaluateExpression("true && true", ctx)).toBe(true);
    expect(evaluateExpression("true && false", ctx)).toBe(false);
  });

  it("! negates a boolean", () => {
    expect(evaluateExpression("!true", ctx)).toBe(false);
    expect(evaluateExpression("!false", ctx)).toBe(true);
  });

  it("combined logical expression", () => {
    expect(evaluateExpression("true && !false", ctx)).toBe(true);
  });
});

describe("evaluateExpression — context access", () => {
  it("reads a top-level context field", () => {
    expect(evaluateExpression("context.x", { x: 7 })).toBe(7);
  });

  it("reads a nested context field", () => {
    expect(evaluateExpression("context.a.b", { a: { b: 42 } })).toBe(42);
  });

  it("returns undefined for missing fields", () => {
    expect(evaluateExpression("context.missing", {})).toBeUndefined();
  });

  it("uses context values in arithmetic", () => {
    expect(evaluateExpression("context.count + 5", { count: 10 })).toBe(15);
  });

  it("accesses event via event. prefix mapping to context._event", () => {
    expect(evaluateExpression("event.amount", { _event: { amount: 100 } })).toBe(100);
  });
});

describe("evaluateExpression — error cases", () => {
  it("throws on unknown identifiers", () => {
    expect(() => evaluateExpression("unknownIdent", {})).toThrow(/unknown identifier/);
  });

  it("throws on trailing garbage after valid expression", () => {
    expect(() => evaluateExpression("42 garbage", {})).toThrow(/unexpected trailing content/);
  });

  it("throws on unterminated string literal", () => {
    expect(() => evaluateExpression('"unclosed', {})).toThrow(/unterminated string/);
  });
});

describe("evaluateGuard", () => {
  it("returns true for a truthy expression", () => {
    expect(evaluateGuard("1 == 1", {})).toBe(true);
  });

  it("returns false for a falsy expression", () => {
    expect(evaluateGuard("1 == 2", {})).toBe(false);
  });

  it("coerces non-boolean result to boolean", () => {
    // 5 is truthy
    expect(evaluateGuard("5", {})).toBe(true);
    // 0 is falsy
    expect(evaluateGuard("0", {})).toBe(false);
  });

  it("evaluates context-based guards", () => {
    expect(evaluateGuard('context.role == "admin"', { role: "admin" })).toBe(true);
    expect(evaluateGuard('context.role == "admin"', { role: "user" })).toBe(false);
  });

  it("handles complex compound guard", () => {
    const ctx = { score: 90, attempts: 3 };
    expect(evaluateGuard("context.score >= 80 && context.attempts <= 5", ctx)).toBe(true);
  });
});
