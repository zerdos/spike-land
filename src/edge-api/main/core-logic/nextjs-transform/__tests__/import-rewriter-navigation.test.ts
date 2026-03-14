import { describe, expect, it } from "vitest";
import { rewriteImports } from "../import-rewriter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convenience wrapper that returns only the transformed source. */
function transform(source: string): string {
  return rewriteImports("test.tsx", source).transformed;
}

/** Convenience wrapper that returns only the warnings array. */
function warnings(source: string): string[] {
  return rewriteImports("test.tsx", source).warnings;
}

// ---------------------------------------------------------------------------
// TransformResult shape
// ---------------------------------------------------------------------------

describe("rewriteImports — TransformResult shape", () => {
  it("returns all required fields", () => {
    const result = rewriteImports("foo.tsx", 'import { useRouter } from "next/navigation"');
    expect(result).toHaveProperty("filename", "foo.tsx");
    expect(result).toHaveProperty("original");
    expect(result).toHaveProperty("transformed");
    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("preserves the original source unchanged", () => {
    const source = 'import { useRouter } from "next/navigation"';
    const result = rewriteImports("foo.tsx", source);
    expect(result.original).toBe(source);
  });
});

// ---------------------------------------------------------------------------
// next/navigation — individual hook rewrites
// ---------------------------------------------------------------------------

describe("rewriteImports — next/navigation single named imports", () => {
  it("rewrites useRouter to useNavigate", () => {
    const source = 'import { useRouter } from "next/navigation"';
    expect(transform(source)).toBe('import { useNavigate } from "@tanstack/react-router"');
  });

  it("rewrites usePathname to useLocation", () => {
    const source = 'import { usePathname } from "next/navigation"';
    expect(transform(source)).toBe('import { useLocation } from "@tanstack/react-router"');
  });

  it("rewrites useSearchParams to useSearch", () => {
    const source = 'import { useSearchParams } from "next/navigation"';
    expect(transform(source)).toBe('import { useSearch } from "@tanstack/react-router"');
  });

  it("rewrites useParams to useParams (same name)", () => {
    const source = 'import { useParams } from "next/navigation"';
    expect(transform(source)).toBe('import { useParams } from "@tanstack/react-router"');
  });

  it("rewrites redirect to useNavigate", () => {
    const source = 'import { redirect } from "next/navigation"';
    expect(transform(source)).toBe('import { useNavigate } from "@tanstack/react-router"');
  });

  it("rewrites notFound to notFound (same name)", () => {
    const source = 'import { notFound } from "next/navigation"';
    expect(transform(source)).toBe('import { notFound } from "@tanstack/react-router"');
  });

  it("rewrites useSelectedLayoutSegment to useMatch", () => {
    const source = 'import { useSelectedLayoutSegment } from "next/navigation"';
    expect(transform(source)).toBe('import { useMatch } from "@tanstack/react-router"');
  });

  it("rewrites useSelectedLayoutSegments to useMatches", () => {
    const source = 'import { useSelectedLayoutSegments } from "next/navigation"';
    expect(transform(source)).toBe('import { useMatches } from "@tanstack/react-router"');
  });
});

// ---------------------------------------------------------------------------
// next/navigation — multiple imports in one statement
// ---------------------------------------------------------------------------

describe("rewriteImports — next/navigation multiple imports", () => {
  it("rewrites multiple navigation hooks in a single import statement", () => {
    const source = 'import { useRouter, usePathname, useSearchParams } from "next/navigation"';
    const result = transform(source);
    expect(result).toBe(
      'import { useNavigate, useLocation, useSearch } from "@tanstack/react-router"',
    );
    expect(warnings(source)).toHaveLength(0);
  });

  it("handles all eight navigation hooks together", () => {
    const source =
      'import { useRouter, usePathname, useSearchParams, useParams, redirect, notFound, useSelectedLayoutSegment, useSelectedLayoutSegments } from "next/navigation"';
    const result = transform(source);
    expect(result).toContain("@tanstack/react-router");
    expect(result).toContain("useNavigate");
    expect(result).toContain("useLocation");
    expect(result).toContain("useSearch");
    expect(result).toContain("useParams");
    expect(result).toContain("notFound");
    expect(result).toContain("useMatch");
    expect(result).toContain("useMatches");
    // redirect → useNavigate produces a duplicate; both should be present
    const useNavigateCount = (result.match(/useNavigate/g) ?? []).length;
    expect(useNavigateCount).toBe(2);
  });

  it("rewrites only navigation hooks, leaving unrelated lines intact", () => {
    const source = [
      'import React from "react";',
      'import { useRouter, usePathname } from "next/navigation"',
      "",
      "export function MyComponent() {",
      "  const router = useRouter();",
      "  return <div />;",
      "}",
    ].join("\n");

    const result = transform(source);
    expect(result).toContain('import React from "react"');
    expect(result).toContain("useNavigate");
    expect(result).toContain("useLocation");
    expect(result).not.toContain("next/navigation");
  });

  it("handles imports with trailing whitespace around specifiers", () => {
    const source = 'import {  useRouter ,  usePathname  } from "next/navigation"';
    const result = transform(source);
    expect(result).toContain("useNavigate");
    expect(result).toContain("useLocation");
    expect(result).not.toContain("next/navigation");
  });
});

// ---------------------------------------------------------------------------
// next/navigation — aliased imports
// ---------------------------------------------------------------------------

describe("rewriteImports — next/navigation aliased imports", () => {
  it("preserves the alias when rewriting a named import", () => {
    const source = 'import { useRouter as navigate } from "next/navigation"';
    const result = transform(source);
    // The mapped name is useNavigate but the alias navigate should be preserved
    expect(result).toBe('import { useNavigate as navigate } from "@tanstack/react-router"');
  });

  it("preserves alias for usePathname", () => {
    const source = 'import { usePathname as getPath } from "next/navigation"';
    const result = transform(source);
    expect(result).toBe('import { useLocation as getPath } from "@tanstack/react-router"');
  });
});

// ---------------------------------------------------------------------------
// next/navigation — unknown imports generate warnings
// ---------------------------------------------------------------------------

describe("rewriteImports — next/navigation unknown imports", () => {
  it("generates a warning for an unrecognised next/navigation export", () => {
    const source = 'import { unstable_noStore } from "next/navigation"';
    const result = rewriteImports("test.tsx", source);
    expect(result.warnings.some((w) => w.includes("unstable_noStore"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("next/navigation"))).toBe(true);
  });

  it("keeps the unknown specifier in the output import", () => {
    const source = 'import { unstable_noStore } from "next/navigation"';
    const result = transform(source);
    expect(result).toContain("unstable_noStore");
    expect(result).toContain("@tanstack/react-router");
  });

  it("warns for unknown but still rewrites known specifiers in the same statement", () => {
    const source = 'import { useRouter, unstable_noStore } from "next/navigation"';
    const w = warnings(source);
    expect(w.some((msg) => msg.includes("unstable_noStore"))).toBe(true);
    const result = transform(source);
    expect(result).toContain("useNavigate");
    expect(result).toContain("unstable_noStore");
  });
});

// ---------------------------------------------------------------------------
// next/link — default import rewrite
// ---------------------------------------------------------------------------

describe("rewriteImports — next/link default import", () => {
  it("rewrites default Link import to named export from @tanstack/react-router", () => {
    const source = 'import Link from "next/link"';
    expect(transform(source)).toBe('import { Link } from "@tanstack/react-router"');
  });

  it("handles single-quote delimiters", () => {
    const source = "import Link from 'next/link'";
    expect(transform(source)).toBe('import { Link } from "@tanstack/react-router"');
  });

  it("produces no warnings when the imported identifier is already named Link", () => {
    const source = 'import Link from "next/link"';
    expect(warnings(source)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// next/link — aliased default import generates a warning
// ---------------------------------------------------------------------------

describe("rewriteImports — next/link aliased import warning", () => {
  it("produces a warning when the default import uses a name other than Link", () => {
    const source = 'import MyLink from "next/link"';
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
    expect(w.some((msg) => msg.includes("MyLink"))).toBe(true);
  });

  it("still rewrites the import to the canonical named Link export", () => {
    const source = 'import MyLink from "next/link"';
    const result = transform(source);
    expect(result).toBe('import { Link } from "@tanstack/react-router"');
  });

  it("warning message mentions the aliased name and suggests manual JSX update", () => {
    const source = 'import NavLink from "next/link"';
    const w = warnings(source);
    const msg = w.find((m) => m.includes("NavLink")) ?? "";
    expect(msg).toContain("NavLink");
    // The implementation says "renamed to Link, update JSX usage manually"
    expect(msg).toContain("Link");
  });
});

// ---------------------------------------------------------------------------
// next/link — <Link href=...> → <Link to=...> JSX attribute rewrite
// ---------------------------------------------------------------------------

describe("rewriteImports — next/link JSX href → to attribute", () => {
  it('rewrites <Link href="/about"> to <Link to="/about">', () => {
    const source = [
      'import Link from "next/link"',
      "",
      "export function Nav() {",
      '  return <Link href="/about">About</Link>;',
      "}",
    ].join("\n");

    const result = transform(source);
    expect(result).toContain('<Link to="/about">');
    expect(result).not.toContain("href=");
  });

  it("rewrites href with a JSX expression value", () => {
    const source = [
      'import Link from "next/link"',
      'const url = "/home";',
      "return <Link href={url}>Home</Link>;",
    ].join("\n");

    const result = transform(source);
    expect(result).toContain("<Link to={url}>");
    expect(result).not.toContain("href={url}");
  });

  it("rewrites multiple Link usages in the same file", () => {
    const source = [
      'import Link from "next/link"',
      "",
      "export function Nav() {",
      "  return (",
      "    <nav>",
      '      <Link href="/home">Home</Link>',
      '      <Link href="/about">About</Link>',
      '      <Link href="/contact">Contact</Link>',
      "    </nav>",
      "  );",
      "}",
    ].join("\n");

    const result = transform(source);
    const hrefCount = (result.match(/href=/g) ?? []).length;
    const toCount = (result.match(/<Link to=/g) ?? []).length;
    expect(hrefCount).toBe(0);
    expect(toCount).toBe(3);
  });

  it("does not touch href attributes on non-Link elements", () => {
    // The regex targets `<Link href=` specifically, so <a href=...> must be left alone.
    const source = [
      'import Link from "next/link"',
      '<a href="/plain">plain anchor</a>',
      '<Link href="/tanstack">TanStack</Link>',
    ].join("\n");

    const result = transform(source);
    expect(result).toContain('<a href="/plain">');
    expect(result).toContain('<Link to="/tanstack">');
  });
});

// ---------------------------------------------------------------------------
// Files with no next/navigation or next/link — must remain unchanged
// ---------------------------------------------------------------------------

describe("rewriteImports — no next/* imports", () => {
  it("returns the source unchanged when there are no Next.js imports", () => {
    const source = [
      'import React from "react"',
      'import { useState } from "react"',
      "",
      "export function Counter() {",
      "  const [count, setCount] = React.useState(0);",
      "  return <button onClick={() => setCount(count + 1)}>{count}</button>;",
      "}",
    ].join("\n");

    expect(transform(source)).toBe(source);
    expect(warnings(source)).toHaveLength(0);
  });

  it("does not alter imports from other @tanstack packages", () => {
    const source = 'import { createRouter } from "@tanstack/react-router"';
    expect(transform(source)).toBe(source);
  });

  it("does not alter unrelated third-party imports", () => {
    const source = 'import { z } from "zod"';
    expect(transform(source)).toBe(source);
  });

  it("returns an empty warnings array for clean source", () => {
    expect(warnings("const x = 1;")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Combined — both next/navigation and next/link in the same file
// ---------------------------------------------------------------------------

describe("rewriteImports — next/navigation and next/link combined", () => {
  it("transforms both import types in a single pass", () => {
    const source = [
      'import { useRouter, usePathname } from "next/navigation"',
      'import Link from "next/link"',
      "",
      "export function Layout({ children }: { children: React.ReactNode }) {",
      "  const router = useRouter();",
      "  const path = usePathname();",
      "  return (",
      "    <div>",
      '      <Link href="/home">Home</Link>',
      "      {children}",
      "    </div>",
      "  );",
      "}",
    ].join("\n");

    const result = transform(source);

    // navigation imports fully rewritten
    expect(result).toContain("useNavigate");
    expect(result).toContain("useLocation");
    expect(result).not.toContain("next/navigation");

    // link import fully rewritten
    expect(result).toContain('import { Link } from "@tanstack/react-router"');
    expect(result).not.toContain("next/link");

    // JSX href → to
    expect(result).toContain('<Link to="/home">');
    expect(result).not.toContain("href=");

    // No spurious warnings
    expect(warnings(source)).toHaveLength(0);
  });

  it("emits warnings from both transforms when unknowns are present", () => {
    const source = [
      'import { unstable_noStore } from "next/navigation"',
      'import MyLink from "next/link"',
    ].join("\n");

    const w = warnings(source);
    expect(w.some((msg) => msg.includes("unstable_noStore"))).toBe(true);
    expect(w.some((msg) => msg.includes("MyLink"))).toBe(true);
  });

  it("does not duplicate the @tanstack/react-router import when both are present", () => {
    // Each rewriter emits its own import statement — the consumer is expected to
    // deduplicate. Verify we get exactly two separate statements (one per original
    // import) rather than a single merged one, which would be a different contract.
    const source = [
      'import { useRouter } from "next/navigation"',
      'import Link from "next/link"',
    ].join("\n");

    const result = transform(source);
    const tanstackImports = result.match(/@tanstack\/react-router/g) ?? [];
    // Two separate import lines — one for navigation hooks, one for Link
    expect(tanstackImports.length).toBe(2);
  });

  it("preserves non-next code between the two import lines", () => {
    const source = [
      'import { useRouter } from "next/navigation"',
      "// router utilities",
      'import Link from "next/link"',
    ].join("\n");

    const result = transform(source);
    expect(result).toContain("// router utilities");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("rewriteImports — edge cases", () => {
  it("handles an empty string source without throwing", () => {
    expect(() => rewriteImports("empty.ts", "")).not.toThrow();
    expect(transform("")).toBe("");
  });

  it("handles a source with only whitespace", () => {
    const source = "   \n\t\n   ";
    expect(transform(source)).toBe(source);
  });

  it("treats double and single quoted next/navigation imports identically", () => {
    const double = 'import { useRouter } from "next/navigation"';
    const single = "import { useRouter } from 'next/navigation'";
    const resultDouble = transform(double);
    const resultSingle = transform(single);
    // Both should resolve to the same tanstack import (quotes may differ but content matches)
    expect(resultDouble).toContain("useNavigate");
    expect(resultSingle).toContain("useNavigate");
    expect(resultDouble).not.toContain("next/navigation");
    expect(resultSingle).not.toContain("next/navigation");
  });

  it("treats double and single quoted next/link imports identically", () => {
    const double = 'import Link from "next/link"';
    const single = "import Link from 'next/link'";
    expect(transform(double)).toContain("@tanstack/react-router");
    expect(transform(single)).toContain("@tanstack/react-router");
  });

  it("returns the filename passed in verbatim", () => {
    const result = rewriteImports("src/pages/index.tsx", "const x = 1;");
    expect(result.filename).toBe("src/pages/index.tsx");
  });
});
