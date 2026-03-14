import { describe, expect, it } from "vitest";
import type { RepoFile } from "../types.ts";
import { buildRouteTree, detectRoutingConvention } from "../route-converter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal RepoFile with empty content — content is not read by these functions. */
function file(path: string): RepoFile {
  return { path, content: "" };
}

// ---------------------------------------------------------------------------
// detectRoutingConvention
// ---------------------------------------------------------------------------

describe("detectRoutingConvention", () => {
  it("returns 'app' when a file starts with 'app/'", () => {
    const files = [file("app/page.tsx"), file("lib/utils.ts")];
    expect(detectRoutingConvention(files)).toBe("app");
  });

  it("returns 'pages' when a file starts with 'pages/'", () => {
    const files = [file("pages/index.tsx"), file("lib/utils.ts")];
    expect(detectRoutingConvention(files)).toBe("pages");
  });

  it("returns null when no files match either convention", () => {
    const files = [file("src/components/Button.tsx"), file("lib/utils.ts")];
    expect(detectRoutingConvention(files)).toBeNull();
  });

  it("returns null for an empty file list", () => {
    expect(detectRoutingConvention([])).toBeNull();
  });

  it("returns 'app' when both app/ and pages/ files are present (app takes precedence)", () => {
    const files = [file("app/dashboard/page.tsx"), file("pages/legacy.tsx")];
    expect(detectRoutingConvention(files)).toBe("app");
  });

  it("detects app/ when it appears as a subdirectory (contains '/app/')", () => {
    const files = [file("project/app/page.tsx")];
    expect(detectRoutingConvention(files)).toBe("app");
  });

  it("detects pages/ when it appears as a subdirectory (contains '/pages/')", () => {
    const files = [file("project/pages/index.tsx")];
    expect(detectRoutingConvention(files)).toBe("pages");
  });
});

// ---------------------------------------------------------------------------
// buildRouteTree — return shape
// ---------------------------------------------------------------------------

describe("buildRouteTree return shape", () => {
  it("returns entries, routeTreeCode, and warnings fields", () => {
    const result = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(result).toHaveProperty("entries");
    expect(result).toHaveProperty("routeTreeCode");
    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.entries)).toBe(true);
    expect(typeof result.routeTreeCode).toBe("string");
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildRouteTree — pages convention
// ---------------------------------------------------------------------------

describe("buildRouteTree — pages convention", () => {
  it("produces one entry for a single pages/index.tsx", () => {
    const { entries } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(entries).toHaveLength(1);
  });

  it("sets originalPath on the entry to the source file path", () => {
    const { entries } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(entries[0].originalPath).toBe("pages/index.tsx");
  });

  it("converts pages/index.tsx tanstackPath to routes/index.tsx", () => {
    const { entries } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(entries[0].tanstackPath).toBe("routes/index.tsx");
  });

  it("produces multiple entries for multiple pages", () => {
    const files = [file("pages/index.tsx"), file("pages/about.tsx"), file("pages/contact.tsx")];
    const { entries } = buildRouteTree(files, "pages");
    expect(entries).toHaveLength(3);
  });

  it("route tree code contains an import for each page", () => {
    const files = [file("pages/index.tsx"), file("pages/about.tsx")];
    const { routeTreeCode } = buildRouteTree(files, "pages");
    expect(routeTreeCode).toContain("routes/index");
    expect(routeTreeCode).toContain("routes/about");
  });

  it("excludes pages/api/ files", () => {
    const files = [
      file("pages/index.tsx"),
      file("pages/api/users.ts"),
      file("pages/api/posts/index.ts"),
    ];
    const { entries } = buildRouteTree(files, "pages");
    const paths = entries.map((e) => e.originalPath);
    expect(paths).not.toContain("pages/api/users.ts");
    expect(paths).not.toContain("pages/api/posts/index.ts");
    expect(paths).toContain("pages/index.tsx");
  });

  it("excludes non-JS/TS files (e.g. .css, .md)", () => {
    const files = [file("pages/index.tsx"), file("pages/styles.css"), file("pages/README.md")];
    const { entries } = buildRouteTree(files, "pages");
    expect(entries).toHaveLength(1);
    expect(entries[0].originalPath).toBe("pages/index.tsx");
  });

  it("accepts .jsx, .ts, and .js extensions alongside .tsx", () => {
    const files = [
      file("pages/index.tsx"),
      file("pages/about.jsx"),
      file("pages/contact.ts"),
      file("pages/faq.js"),
    ];
    const { entries } = buildRouteTree(files, "pages");
    expect(entries).toHaveLength(4);
  });

  it("marks a dynamic segment entry as isDynamic: true", () => {
    const { entries } = buildRouteTree([file("pages/blog/[id].tsx")], "pages");
    expect(entries[0].isDynamic).toBe(true);
  });

  it("marks a static segment entry as isDynamic: false", () => {
    const { entries } = buildRouteTree([file("pages/about.tsx")], "pages");
    expect(entries[0].isDynamic).toBe(false);
  });

  it("marks a catch-all route as isDynamic: true", () => {
    const { entries } = buildRouteTree([file("pages/[...slug].tsx")], "pages");
    expect(entries[0].isDynamic).toBe(true);
  });

  it("marks an optional catch-all route as isDynamic: true", () => {
    const { entries } = buildRouteTree([file("pages/[[...slug]].tsx")], "pages");
    expect(entries[0].isDynamic).toBe(true);
  });

  it("initialises children as an empty array on every entry", () => {
    const { entries } = buildRouteTree([file("pages/index.tsx"), file("pages/about.tsx")], "pages");
    for (const entry of entries) {
      expect(Array.isArray(entry.children)).toBe(true);
      expect(entry.children).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// buildRouteTree — app convention
// ---------------------------------------------------------------------------

describe("buildRouteTree — app convention", () => {
  it("produces one entry for app/page.tsx", () => {
    const { entries } = buildRouteTree([file("app/page.tsx")], "app");
    expect(entries).toHaveLength(1);
  });

  it("converts app/page.tsx to routes/index.tsx (root page)", () => {
    const { entries } = buildRouteTree([file("app/page.tsx")], "app");
    expect(entries[0].tanstackPath).toBe("routes/index.tsx");
  });

  it("converts app/dashboard/page.tsx to routes/dashboard.tsx", () => {
    const { entries } = buildRouteTree([file("app/dashboard/page.tsx")], "app");
    expect(entries[0].tanstackPath).toBe("routes/dashboard.tsx");
  });

  it("flattens a route group segment like (auth)", () => {
    const { entries } = buildRouteTree([file("app/(auth)/login/page.tsx")], "app");
    expect(entries[0].tanstackPath).toBe("routes/login.tsx");
  });

  it("marks app layout.tsx files as isLayout: true", () => {
    const { entries } = buildRouteTree([file("app/dashboard/layout.tsx")], "app");
    expect(entries[0].isLayout).toBe(true);
  });

  it("marks a dynamic app route as isDynamic: true", () => {
    const { entries } = buildRouteTree([file("app/blog/[slug]/page.tsx")], "app");
    expect(entries[0].isDynamic).toBe(true);
  });

  it("does not exclude app/api/ files (only pages/api/ is excluded)", () => {
    const files = [file("app/api/route.ts"), file("app/page.tsx")];
    const { entries } = buildRouteTree(files, "app");
    // Both should be processed (app/api/route.ts generates a warning but still creates an entry)
    const paths = entries.map((e) => e.originalPath);
    expect(paths).toContain("app/page.tsx");
  });

  it("emits a warning for app/loading.tsx special files", () => {
    const { warnings } = buildRouteTree([file("app/loading.tsx")], "app");
    expect(warnings.some((w) => /loading/i.test(w))).toBe(true);
  });

  it("emits a warning for app/error.tsx special files", () => {
    const { warnings } = buildRouteTree([file("app/error.tsx")], "app");
    expect(warnings.some((w) => /error/i.test(w))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildRouteTree — empty input
// ---------------------------------------------------------------------------

describe("buildRouteTree — empty input", () => {
  it("returns empty entries for an empty file list (pages convention)", () => {
    const { entries } = buildRouteTree([], "pages");
    expect(entries).toHaveLength(0);
  });

  it("returns empty entries for an empty file list (app convention)", () => {
    const { entries } = buildRouteTree([], "app");
    expect(entries).toHaveLength(0);
  });

  it("returns an empty warnings array for an empty file list", () => {
    const { warnings } = buildRouteTree([], "pages");
    expect(warnings).toHaveLength(0);
  });

  it("returns a non-empty routeTreeCode even with no entries (scaffold is always emitted)", () => {
    const { routeTreeCode } = buildRouteTree([], "pages");
    expect(routeTreeCode.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// buildRouteTree — generated routeTreeCode structure
// ---------------------------------------------------------------------------

describe("buildRouteTree — generated routeTreeCode content", () => {
  it("contains the auto-generated comment", () => {
    const { routeTreeCode } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(routeTreeCode).toContain("AUTO-GENERATED");
  });

  it("contains the manual review TODO comment", () => {
    const { routeTreeCode } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(routeTreeCode).toContain("TODO");
    expect(routeTreeCode).toContain("Manual review");
  });

  it("imports createRouter from @tanstack/react-router", () => {
    const { routeTreeCode } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(routeTreeCode).toContain('import { createRouter } from "@tanstack/react-router"');
  });

  it("imports rootRoute from ./routes/__root", () => {
    const { routeTreeCode } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(routeTreeCode).toContain('import { Route as rootRoute } from "./routes/__root"');
  });

  it("contains rootRoute.addChildren call", () => {
    const { routeTreeCode } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(routeTreeCode).toContain("rootRoute.addChildren([");
  });

  it("exports the router via createRouter", () => {
    const { routeTreeCode } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(routeTreeCode).toContain("export const router = createRouter({ routeTree })");
  });

  it("contains the TypeScript module declaration for @tanstack/react-router", () => {
    const { routeTreeCode } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(routeTreeCode).toContain("declare module '@tanstack/react-router'");
  });

  it("registers typeof router inside the module declaration", () => {
    const { routeTreeCode } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(routeTreeCode).toContain("router: typeof router");
  });

  it("generates individual route imports for each entry", () => {
    const files = [file("pages/index.tsx"), file("pages/about.tsx"), file("pages/contact.tsx")];
    const { routeTreeCode } = buildRouteTree(files, "pages");
    // Each route must appear as an import
    expect(routeTreeCode).toContain("./routes/index");
    expect(routeTreeCode).toContain("./routes/about");
    expect(routeTreeCode).toContain("./routes/contact");
  });

  it("lists every route name inside addChildren", () => {
    const files = [file("pages/index.tsx"), file("pages/about.tsx")];
    const { routeTreeCode } = buildRouteTree(files, "pages");
    const addChildrenBlock = routeTreeCode.slice(routeTreeCode.indexOf("rootRoute.addChildren(["));
    expect(addChildrenBlock).toContain("indexRoute");
    expect(addChildrenBlock).toContain("aboutRoute");
  });

  it("generates a dynamic route import with '$' in the name for a [param] segment", () => {
    const { routeTreeCode } = buildRouteTree([file("pages/blog/[id].tsx")], "pages");
    expect(routeTreeCode).toContain("./routes/blog/$id");
  });

  it("code is valid multiline text with newlines between sections", () => {
    const { routeTreeCode } = buildRouteTree([file("pages/index.tsx")], "pages");
    expect(routeTreeCode.split("\n").length).toBeGreaterThan(5);
  });
});

// ---------------------------------------------------------------------------
// buildRouteTree — warnings propagation
// ---------------------------------------------------------------------------

describe("buildRouteTree — warnings propagation", () => {
  it("emits no warnings for plain static pages routes", () => {
    const files = [file("pages/index.tsx"), file("pages/about.tsx")];
    const { warnings } = buildRouteTree(files, "pages");
    expect(warnings).toHaveLength(0);
  });

  it("silently drops pages/_app.tsx — empty tanstackPath causes continue before warnings are collected", () => {
    // buildRouteTree skips entries whose tanstackPath is empty before pushing their
    // warnings into allWarnings, so _app produces zero warnings at the tree level.
    const { warnings, entries } = buildRouteTree([file("pages/_app.tsx")], "pages");
    expect(entries).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it("silently drops pages/_document.tsx for the same reason", () => {
    const { warnings, entries } = buildRouteTree([file("pages/_document.tsx")], "pages");
    expect(entries).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it("collects warnings from files that do produce a valid tanstackPath", () => {
    // app/loading.tsx is a special app-router file that emits a warning AND still
    // returns a non-empty tanstackPath (the segment is skipped, reducing the path).
    // Use a nested loading file so the parent segment preserves a non-empty path.
    const files = [file("app/dashboard/loading.tsx")];
    const { warnings } = buildRouteTree(files, "app");
    expect(warnings.some((w) => /loading/i.test(w))).toBe(true);
  });

  it("emits a warning for parallel route segments (@slot)", () => {
    const { warnings } = buildRouteTree([file("app/@sidebar/page.tsx")], "app");
    expect(warnings.some((w) => /parallel route/i.test(w))).toBe(true);
  });
});
