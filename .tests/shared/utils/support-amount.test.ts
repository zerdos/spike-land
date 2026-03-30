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
} from "../../../src/core/shared-utils/core-logic/support-amount.js";

describe("snapSupportAmount", () => {
  it("snaps values within the magic range to the magic amount", () => {
    expect(snapSupportAmount(SUPPORT_MAGIC_RANGE_MIN)).toBe(SUPPORT_MAGIC_AMOUNT);
    expect(snapSupportAmount(SUPPORT_MAGIC_RANGE_MAX)).toBe(SUPPORT_MAGIC_AMOUNT);
    expect(snapSupportAmount(SUPPORT_MAGIC_AMOUNT)).toBe(SUPPORT_MAGIC_AMOUNT);
    expect(snapSupportAmount(415)).toBe(SUPPORT_MAGIC_AMOUNT);
  });

  it("leaves values outside the magic range unchanged", () => {
    expect(snapSupportAmount(10)).toBe(10);
    expect(snapSupportAmount(SUPPORT_MAGIC_RANGE_MIN - 1)).toBe(SUPPORT_MAGIC_RANGE_MIN - 1);
    expect(snapSupportAmount(SUPPORT_MAGIC_RANGE_MAX + 1)).toBe(SUPPORT_MAGIC_RANGE_MAX + 1);
    expect(snapSupportAmount(999)).toBe(999);
  });
});

describe("formatSupportAmount", () => {
  it("formats whole numbers without a decimal point", () => {
    expect(formatSupportAmount(10)).toBe("10");
    expect(formatSupportAmount(1)).toBe("1");
    expect(formatSupportAmount(100)).toBe("100");
  });

  it("formats values with two significant decimal places", () => {
    expect(formatSupportAmount(10.99)).toBe("10.99");
    expect(formatSupportAmount(1.5)).toBe("1.5");
  });

  it("rounds to two decimal places", () => {
    expect(formatSupportAmount(10.004)).toBe("10");
    expect(formatSupportAmount(10.005)).toBe("10.01");
  });
});

describe("parseSupportAmount", () => {
  it("parses valid positive numbers", () => {
    expect(parseSupportAmount("10")).toBe(10);
    expect(parseSupportAmount("9.99")).toBe(9.99);
  });

  it("returns null for empty or whitespace-only strings", () => {
    expect(parseSupportAmount("")).toBeNull();
    expect(parseSupportAmount("   ")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseSupportAmount("abc")).toBeNull();
    expect(parseSupportAmount("£10")).toBeNull();
  });

  it("applies magic snapping for amounts in the magic range", () => {
    expect(parseSupportAmount("415")).toBe(SUPPORT_MAGIC_AMOUNT);
    expect(parseSupportAmount("420")).toBe(SUPPORT_MAGIC_AMOUNT);
    expect(parseSupportAmount("429")).toBe(SUPPORT_MAGIC_AMOUNT);
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(parseSupportAmount("  50  ")).toBe(50);
  });
});

describe("normalizeSupportAmountInput", () => {
  it("returns empty string for empty or whitespace-only input", () => {
    expect(normalizeSupportAmountInput("")).toBe("");
    expect(normalizeSupportAmountInput("   ")).toBe("");
  });

  it("returns original string when value is outside the magic range", () => {
    expect(normalizeSupportAmountInput("50")).toBe("50");
    expect(normalizeSupportAmountInput("10.99")).toBe("10.99");
  });

  it("returns original string for non-numeric input", () => {
    expect(normalizeSupportAmountInput("abc")).toBe("abc");
  });

  it("returns the formatted magic amount when value is in the magic range", () => {
    const result = normalizeSupportAmountInput("415");
    expect(result).toBe(String(SUPPORT_MAGIC_AMOUNT));
  });
});

describe("isValidSupportAmount", () => {
  it("accepts amounts within the valid range", () => {
    expect(isValidSupportAmount(SUPPORT_AMOUNT_MIN)).toBe(true);
    expect(isValidSupportAmount(SUPPORT_AMOUNT_MAX)).toBe(true);
    expect(isValidSupportAmount(50)).toBe(true);
  });

  it("rejects amounts below the minimum", () => {
    expect(isValidSupportAmount(SUPPORT_AMOUNT_MIN - 1)).toBe(false);
    expect(isValidSupportAmount(0)).toBe(false);
    expect(isValidSupportAmount(-5)).toBe(false);
  });

  it("rejects amounts above the maximum", () => {
    expect(isValidSupportAmount(SUPPORT_AMOUNT_MAX + 1)).toBe(false);
    expect(isValidSupportAmount(10000)).toBe(false);
  });

  it("rejects null", () => {
    expect(isValidSupportAmount(null)).toBe(false);
  });

  it("acts as a type guard narrowing to number", () => {
    const amount: number | null = 100;
    if (isValidSupportAmount(amount)) {
      const doubled: number = amount * 2;
      expect(doubled).toBe(200);
    }
  });
});
