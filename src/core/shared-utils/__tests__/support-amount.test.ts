import { describe, it, expect } from "vitest";
import {
  snapSupportAmount,
  formatSupportAmount,
  parseSupportAmount,
  normalizeSupportAmountInput,
  isValidSupportAmount,
  SUPPORT_MAGIC_AMOUNT,
  SUPPORT_MAGIC_RANGE_MIN,
  SUPPORT_MAGIC_RANGE_MAX,
  SUPPORT_AMOUNT_MIN,
  SUPPORT_AMOUNT_MAX,
} from "../core-logic/support-amount.js";

describe("snapSupportAmount", () => {
  it("returns the magic amount for values in the magic range", () => {
    expect(snapSupportAmount(SUPPORT_MAGIC_RANGE_MIN)).toBe(SUPPORT_MAGIC_AMOUNT);
    expect(snapSupportAmount(SUPPORT_MAGIC_RANGE_MAX)).toBe(SUPPORT_MAGIC_AMOUNT);
    expect(snapSupportAmount(420)).toBe(SUPPORT_MAGIC_AMOUNT);
    expect(snapSupportAmount(415)).toBe(SUPPORT_MAGIC_AMOUNT);
  });

  it("returns the original value outside the magic range", () => {
    expect(snapSupportAmount(10)).toBe(10);
    expect(snapSupportAmount(410)).toBe(410);
    expect(snapSupportAmount(430)).toBe(430);
    expect(snapSupportAmount(999)).toBe(999);
  });

  it("handles boundary values correctly", () => {
    expect(snapSupportAmount(SUPPORT_MAGIC_RANGE_MIN - 1)).toBe(SUPPORT_MAGIC_RANGE_MIN - 1);
    expect(snapSupportAmount(SUPPORT_MAGIC_RANGE_MAX + 1)).toBe(SUPPORT_MAGIC_RANGE_MAX + 1);
  });
});

describe("formatSupportAmount", () => {
  it("formats whole numbers without decimals", () => {
    expect(formatSupportAmount(10)).toBe("10");
    expect(formatSupportAmount(100)).toBe("100");
    expect(formatSupportAmount(1)).toBe("1");
  });

  it("formats amounts with two decimal places when needed", () => {
    expect(formatSupportAmount(10.99)).toBe("10.99");
    expect(formatSupportAmount(1.23)).toBe("1.23");
  });

  it("trims trailing zero in single decimal", () => {
    expect(formatSupportAmount(10.5)).toBe("10.5");
  });

  it("rounds to two decimal places", () => {
    // 10.004 rounds to 10 (which is integer)
    expect(formatSupportAmount(10.004)).toBe("10");
    // 10.005 rounds to 10.01
    expect(formatSupportAmount(10.005)).toBe("10.01");
  });
});

describe("parseSupportAmount", () => {
  it("parses valid integer strings", () => {
    expect(parseSupportAmount("10")).toBe(10);
    expect(parseSupportAmount("100")).toBe(100);
  });

  it("parses valid decimal strings", () => {
    expect(parseSupportAmount("9.99")).toBe(9.99);
  });

  it("returns null for empty string", () => {
    expect(parseSupportAmount("")).toBeNull();
    expect(parseSupportAmount("   ")).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(parseSupportAmount("abc")).toBeNull();
    expect(parseSupportAmount("£10")).toBeNull();
  });

  it("applies magic snapping when value is in magic range", () => {
    expect(parseSupportAmount("415")).toBe(SUPPORT_MAGIC_AMOUNT);
    expect(parseSupportAmount("420")).toBe(SUPPORT_MAGIC_AMOUNT);
  });

  it("trims whitespace before parsing", () => {
    expect(parseSupportAmount("  50  ")).toBe(50);
  });
});

describe("normalizeSupportAmountInput", () => {
  it("returns empty string for empty input", () => {
    expect(normalizeSupportAmountInput("")).toBe("");
    expect(normalizeSupportAmountInput("   ")).toBe("");
  });

  it("returns original input when not in magic range", () => {
    expect(normalizeSupportAmountInput("50")).toBe("50");
    expect(normalizeSupportAmountInput("10.99")).toBe("10.99");
  });

  it("returns original input for non-numeric values", () => {
    expect(normalizeSupportAmountInput("abc")).toBe("abc");
  });

  it("normalizes magic range values to formatted magic amount", () => {
    const result = normalizeSupportAmountInput("415");
    expect(result).toBe(String(SUPPORT_MAGIC_AMOUNT));
  });
});

describe("isValidSupportAmount", () => {
  it("returns true for amounts within the valid range", () => {
    expect(isValidSupportAmount(SUPPORT_AMOUNT_MIN)).toBe(true);
    expect(isValidSupportAmount(SUPPORT_AMOUNT_MAX)).toBe(true);
    expect(isValidSupportAmount(50)).toBe(true);
  });

  it("returns false for amounts below the minimum", () => {
    expect(isValidSupportAmount(SUPPORT_AMOUNT_MIN - 1)).toBe(false);
    expect(isValidSupportAmount(0)).toBe(false);
    expect(isValidSupportAmount(-1)).toBe(false);
  });

  it("returns false for amounts above the maximum", () => {
    expect(isValidSupportAmount(SUPPORT_AMOUNT_MAX + 1)).toBe(false);
    expect(isValidSupportAmount(10000)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isValidSupportAmount(null)).toBe(false);
  });

  it("acts as type guard — result narrows to number", () => {
    const amount: number | null = 50;
    if (isValidSupportAmount(amount)) {
      // TypeScript should accept amount as number here
      const doubled: number = amount * 2;
      expect(doubled).toBe(100);
    }
  });
});
