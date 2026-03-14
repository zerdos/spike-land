import { describe, expect, it } from "vitest";
import { convertFilePath } from "../route-converter.ts";

// ---------------------------------------------------------------------------
// Pages convention
// ---------------------------------------------------------------------------

describe("convertFilePath — pages convention", () => {
  it("converts pages/index.tsx to routes/index.tsx", () => {
    const result = convertFilePath("pages/index.tsx", "pages");
    expect(result.tanstackPath).toBe("routes/index.tsx");
    expect(result.isLayout).toBe(false);
    expect(result.isDynamic).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts pages/about.tsx to routes/about.tsx", () => {
    const result = convertFilePath("pages/about.tsx", "pages");
    expect(result.tanstackPath).toBe("routes/about.tsx");
    expect(result.isLayout).toBe(false);
    expect(result.isDynamic).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts pages/blog/[id].tsx to routes/blog/$id.tsx", () => {
    const result = convertFilePath("pages/blog/[id].tsx", "pages");
    expect(result.tanstackPath).toBe("routes/blog/$id.tsx");
    expect(result.isLayout).toBe(false);
    expect(result.isDynamic).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts pages/[...slug].tsx catch-all to routes/$.tsx", () => {
    const result = convertFilePath("pages/[...slug].tsx", "pages");
    expect(result.tanstackPath).toBe("routes/$.tsx");
    expect(result.isLayout).toBe(false);
    expect(result.isDynamic).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts pages/_app.tsx to empty tanstackPath with isLayout true and a warning", () => {
    const result = convertFilePath("pages/_app.tsx", "pages");
    expect(result.tanstackPath).toBe("");
    expect(result.isLayout).toBe(true);
    expect(result.isDynamic).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/_app/);
  });

  it("converts pages/_document.tsx to empty tanstackPath with isLayout false and a warning", () => {
    const result = convertFilePath("pages/_document.tsx", "pages");
    expect(result.tanstackPath).toBe("");
    expect(result.isLayout).toBe(false);
    expect(result.isDynamic).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/_document/);
  });

  it("converts pages/blog/index.tsx to routes/blog/index.tsx (index kept as literal segment in pages convention)", () => {
    // The pages convention does not strip "index" sub-segments — only the app
    // convention strips the "page" special file. TanStack Router treats
    // routes/blog/index.tsx as the index child of the blog route.
    const result = convertFilePath("pages/blog/index.tsx", "pages");
    expect(result.tanstackPath).toBe("routes/blog/index.tsx");
    expect(result.isLayout).toBe(false);
    expect(result.isDynamic).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts a nested dynamic pages route pages/shop/[category]/[id].tsx", () => {
    const result = convertFilePath("pages/shop/[category]/[id].tsx", "pages");
    expect(result.tanstackPath).toBe("routes/shop/$category/$id.tsx");
    expect(result.isDynamic).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts optional catch-all pages/[[...slug]].tsx to routes/$.tsx", () => {
    const result = convertFilePath("pages/[[...slug]].tsx", "pages");
    expect(result.tanstackPath).toBe("routes/$.tsx");
    expect(result.isDynamic).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// App convention
// ---------------------------------------------------------------------------

describe("convertFilePath — app convention", () => {
  it("converts app/page.tsx to routes/index.tsx", () => {
    const result = convertFilePath("app/page.tsx", "app");
    expect(result.tanstackPath).toBe("routes/index.tsx");
    expect(result.isLayout).toBe(false);
    expect(result.isDynamic).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts app/dashboard/page.tsx to routes/dashboard.tsx", () => {
    const result = convertFilePath("app/dashboard/page.tsx", "app");
    expect(result.tanstackPath).toBe("routes/dashboard.tsx");
    expect(result.isLayout).toBe(false);
    expect(result.isDynamic).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts app/layout.tsx to routes/__root.tsx with isLayout true", () => {
    const result = convertFilePath("app/layout.tsx", "app");
    expect(result.tanstackPath).toBe("routes/__root.tsx");
    expect(result.isLayout).toBe(true);
    expect(result.isDynamic).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts app/dashboard/layout.tsx to routes/dashboard/route.tsx with isLayout true", () => {
    const result = convertFilePath("app/dashboard/layout.tsx", "app");
    expect(result.tanstackPath).toBe("routes/dashboard/route.tsx");
    expect(result.isLayout).toBe(true);
    expect(result.isDynamic).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("strips route groups: app/(auth)/login/page.tsx → routes/login.tsx", () => {
    const result = convertFilePath("app/(auth)/login/page.tsx", "app");
    expect(result.tanstackPath).toBe("routes/login.tsx");
    expect(result.isLayout).toBe(false);
    expect(result.isDynamic).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts app/shop/[category]/page.tsx with single dynamic segment", () => {
    const result = convertFilePath("app/shop/[category]/page.tsx", "app");
    expect(result.tanstackPath).toBe("routes/shop/$category.tsx");
    expect(result.isDynamic).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts app/shop/[category]/[product]/page.tsx with multiple dynamic segments", () => {
    const result = convertFilePath("app/shop/[category]/[product]/page.tsx", "app");
    expect(result.tanstackPath).toBe("routes/shop/$category/$product.tsx");
    expect(result.isDynamic).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("emits a warning for app/loading.tsx special file", () => {
    const result = convertFilePath("app/loading.tsx", "app");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/loading/);
  });

  it("emits a warning for app/error.tsx special file", () => {
    const result = convertFilePath("app/error.tsx", "app");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/error/);
  });

  it("emits a warning for app/not-found.tsx special file", () => {
    const result = convertFilePath("app/not-found.tsx", "app");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/not-found/);
  });

  it("treats app/template.tsx as layout with a warning", () => {
    const result = convertFilePath("app/template.tsx", "app");
    expect(result.isLayout).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/template/);
  });

  it("emits a warning for app/api/data/route.ts API route", () => {
    const result = convertFilePath("app/api/data/route.ts", "app");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/route/i);
  });

  it("strips multiple route groups: app/(marketing)/(public)/about/page.tsx → routes/about.tsx", () => {
    const result = convertFilePath("app/(marketing)/(public)/about/page.tsx", "app");
    expect(result.tanstackPath).toBe("routes/about.tsx");
    expect(result.isDynamic).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts nested layout app/settings/layout.tsx → routes/settings/route.tsx", () => {
    const result = convertFilePath("app/settings/layout.tsx", "app");
    expect(result.tanstackPath).toBe("routes/settings/route.tsx");
    expect(result.isLayout).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("handles dynamic segment inside route group: app/(shop)/[id]/page.tsx → routes/$id.tsx", () => {
    const result = convertFilePath("app/(shop)/[id]/page.tsx", "app");
    expect(result.tanstackPath).toBe("routes/$id.tsx");
    expect(result.isDynamic).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("converts app/blog/[...slug]/page.tsx catch-all → routes/blog/$.tsx", () => {
    const result = convertFilePath("app/blog/[...slug]/page.tsx", "app");
    expect(result.tanstackPath).toBe("routes/blog/$.tsx");
    expect(result.isDynamic).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Return shape invariants
// ---------------------------------------------------------------------------

describe("convertFilePath — return shape", () => {
  it("always returns all four fields regardless of convention", () => {
    for (const input of [
      { path: "pages/index.tsx", convention: "pages" as const },
      { path: "app/page.tsx", convention: "app" as const },
    ]) {
      const result = convertFilePath(input.path, input.convention);
      expect(result).toHaveProperty("tanstackPath");
      expect(result).toHaveProperty("isLayout");
      expect(result).toHaveProperty("isDynamic");
      expect(result).toHaveProperty("warnings");
      expect(Array.isArray(result.warnings)).toBe(true);
    }
  });

  it("isDynamic is false for fully static routes", () => {
    expect(convertFilePath("pages/contact.tsx", "pages").isDynamic).toBe(false);
    expect(convertFilePath("app/contact/page.tsx", "app").isDynamic).toBe(false);
  });

  it("isDynamic is true whenever any path segment is dynamic", () => {
    expect(convertFilePath("pages/blog/[id].tsx", "pages").isDynamic).toBe(true);
    expect(convertFilePath("app/shop/[category]/page.tsx", "app").isDynamic).toBe(true);
  });
});
