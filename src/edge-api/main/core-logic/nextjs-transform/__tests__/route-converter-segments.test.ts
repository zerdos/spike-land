import { describe, expect, it } from "vitest";
import { convertSegment } from "../route-converter.ts";

describe("convertSegment", () => {
  describe("static segments", () => {
    it('returns segment unchanged for "about"', () => {
      expect(convertSegment("about")).toEqual({
        converted: "about",
        isDynamic: false,
        warning: null,
      });
    });

    it('returns segment unchanged for "blog"', () => {
      expect(convertSegment("blog")).toEqual({
        converted: "blog",
        isDynamic: false,
        warning: null,
      });
    });

    it("returns segment unchanged for a multi-word kebab slug", () => {
      expect(convertSegment("getting-started")).toEqual({
        converted: "getting-started",
        isDynamic: false,
        warning: null,
      });
    });
  });

  describe("dynamic segments [param]", () => {
    it('converts "[id]" to "$id" with isDynamic true', () => {
      expect(convertSegment("[id]")).toEqual({
        converted: "$id",
        isDynamic: true,
        warning: null,
      });
    });

    it('converts "[slug]" to "$slug" with isDynamic true', () => {
      expect(convertSegment("[slug]")).toEqual({
        converted: "$slug",
        isDynamic: true,
        warning: null,
      });
    });

    it('converts "[postId]" to "$postId" with isDynamic true', () => {
      expect(convertSegment("[postId]")).toEqual({
        converted: "$postId",
        isDynamic: true,
        warning: null,
      });
    });
  });

  describe("catch-all segments [...param]", () => {
    it('converts "[...slug]" to "$" with isDynamic true', () => {
      expect(convertSegment("[...slug]")).toEqual({
        converted: "$",
        isDynamic: true,
        warning: null,
      });
    });

    it('converts "[...params]" to "$" with isDynamic true', () => {
      expect(convertSegment("[...params]")).toEqual({
        converted: "$",
        isDynamic: true,
        warning: null,
      });
    });
  });

  describe("optional catch-all segments [[...param]]", () => {
    it('converts "[[...slug]]" to "$" with isDynamic true', () => {
      expect(convertSegment("[[...slug]]")).toEqual({
        converted: "$",
        isDynamic: true,
        warning: null,
      });
    });

    it('converts "[[...rest]]" to "$" with isDynamic true', () => {
      expect(convertSegment("[[...rest]]")).toEqual({
        converted: "$",
        isDynamic: true,
        warning: null,
      });
    });
  });

  describe("route groups (group)", () => {
    it('converts "(auth)" to empty string with no warning', () => {
      expect(convertSegment("(auth)")).toEqual({
        converted: "",
        isDynamic: false,
        warning: null,
      });
    });

    it('converts "(marketing)" to empty string with no warning', () => {
      expect(convertSegment("(marketing)")).toEqual({
        converted: "",
        isDynamic: false,
        warning: null,
      });
    });

    it('converts "(admin-panel)" to empty string with no warning', () => {
      expect(convertSegment("(admin-panel)")).toEqual({
        converted: "",
        isDynamic: false,
        warning: null,
      });
    });
  });

  describe("parallel routes @slot", () => {
    it('produces a warning containing "Parallel route" for "@sidebar"', () => {
      const result = convertSegment("@sidebar");
      expect(result.converted).toBe("");
      expect(result.isDynamic).toBe(false);
      expect(result.warning).toContain("Parallel route");
    });

    it('produces a warning containing "not supported" for "@sidebar"', () => {
      const result = convertSegment("@sidebar");
      expect(result.warning).toContain("not supported");
    });

    it('produces a warning containing "Parallel route" for "@modal"', () => {
      const result = convertSegment("@modal");
      expect(result.converted).toBe("");
      expect(result.isDynamic).toBe(false);
      expect(result.warning).toContain("Parallel route");
    });

    it('produces a warning containing "not supported" for "@modal"', () => {
      const result = convertSegment("@modal");
      expect(result.warning).toContain("not supported");
    });

    it("includes the slot name in the warning message", () => {
      const result = convertSegment("@sidebar");
      expect(result.warning).toContain("@sidebar");
    });
  });

  describe("intercepting routes (.)", () => {
    it('strips the "(.) " prefix from "(.)photo" and produces a warning', () => {
      const result = convertSegment("(.)photo");
      expect(result.converted).toBe("photo");
      expect(result.isDynamic).toBe(false);
      expect(result.warning).not.toBeNull();
    });

    it('warning for "(.)photo" mentions "Intercepting route"', () => {
      const result = convertSegment("(.)photo");
      expect(result.warning).toContain("Intercepting route");
    });

    it('strips the "(..) " prefix from "(..)category" and produces a warning', () => {
      const result = convertSegment("(..)category");
      expect(result.converted).toBe("category");
      expect(result.isDynamic).toBe(false);
      expect(result.warning).not.toBeNull();
    });

    it('warning for "(..)category" mentions "Intercepting route"', () => {
      const result = convertSegment("(..)category");
      expect(result.warning).toContain("Intercepting route");
    });

    it('strips the "(...) " prefix from "(...)global" and produces a warning', () => {
      const result = convertSegment("(...)global");
      expect(result.converted).toBe("global");
      expect(result.isDynamic).toBe(false);
      expect(result.warning).not.toBeNull();
    });

    it('warning for "(...)global" mentions "Intercepting route"', () => {
      const result = convertSegment("(...)global");
      expect(result.warning).toContain("Intercepting route");
    });

    it("intercepting route warnings mention not supported", () => {
      for (const segment of ["(.)photo", "(..)category", "(...)global"]) {
        const result = convertSegment(segment);
        expect(result.warning).toContain("not supported");
      }
    });

    it("includes the original segment in the intercepting route warning", () => {
      const result = convertSegment("(.)photo");
      expect(result.warning).toContain("(.)photo");
    });
  });

  describe("return shape invariants", () => {
    const cases = [
      "about",
      "[id]",
      "[...slug]",
      "[[...slug]]",
      "(auth)",
      "@sidebar",
      "(.)photo",
      "(..)category",
      "(...)global",
    ];

    it.each(cases)('always returns the three expected keys for "%s"', (segment) => {
      const result = convertSegment(segment);
      expect(result).toHaveProperty("converted");
      expect(result).toHaveProperty("isDynamic");
      expect(result).toHaveProperty("warning");
    });

    it.each(cases)('warning is always string or null for "%s"', (segment) => {
      const { warning } = convertSegment(segment);
      expect(warning === null || typeof warning === "string").toBe(true);
    });
  });

  describe("edge cases", () => {
    it("route group regex does not match intercepting-route prefix (.) as a group", () => {
      // (.) starts with a dot after (, so it is NOT a route group
      const result = convertSegment("(.)photo");
      expect(result.warning).not.toBeNull();
    });

    it("route group regex does not match (..) as a group", () => {
      const result = convertSegment("(..)category");
      expect(result.warning).not.toBeNull();
    });

    it("optional catch-all takes precedence over single catch-all", () => {
      // [[...slug]] must not be mistaken for a regular catch-all
      const optional = convertSegment("[[...slug]]");
      const regular = convertSegment("[...slug]");
      expect(optional.converted).toBe("$");
      expect(regular.converted).toBe("$");
    });
  });
});
