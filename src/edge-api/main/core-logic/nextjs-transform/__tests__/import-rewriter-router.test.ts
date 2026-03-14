import { describe, expect, it } from "vitest";
import { rewriteImports } from "../import-rewriter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run rewriteImports and return only the transformed string. */
function transform(source: string): string {
  return rewriteImports("test.tsx", source).transformed;
}

/** Run rewriteImports and return only the warnings array. */
function warnings(source: string): string[] {
  return rewriteImports("test.tsx", source).warnings;
}

// ---------------------------------------------------------------------------
// TransformResult shape
// ---------------------------------------------------------------------------

describe("rewriteImports return shape", () => {
  it("returns filename, original, transformed, and warnings fields", () => {
    const source = `import { useRouter } from "next/router";`;
    const result = rewriteImports("my-component.tsx", source);

    expect(result.filename).toBe("my-component.tsx");
    expect(result.original).toBe(source);
    expect(typeof result.transformed).toBe("string");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("original is never mutated by the transform", () => {
    const source = `import { useRouter } from "next/router";`;
    const result = rewriteImports("test.tsx", source);

    expect(result.original).toBe(source);
    expect(result.transformed).not.toBe(source);
  });
});

// ---------------------------------------------------------------------------
// Individual hook rewrites — double-quoted imports
// ---------------------------------------------------------------------------

describe("next/router → @tanstack/react-router (double quotes)", () => {
  it("rewrites useRouter", () => {
    const source = `import { useRouter } from "next/router";`;
    expect(transform(source)).toContain(`import { useRouter } from "@tanstack/react-router"`);
  });

  it("rewrites usePathname → useLocation", () => {
    const source = `import { usePathname } from "next/router";`;
    expect(transform(source)).toContain(`import { useLocation } from "@tanstack/react-router"`);
  });

  it("rewrites useSearchParams → useSearch", () => {
    const source = `import { useSearchParams } from "next/router";`;
    expect(transform(source)).toContain(`import { useSearch } from "@tanstack/react-router"`);
  });

  it("rewrites useParams → useParams (same name)", () => {
    const source = `import { useParams } from "next/router";`;
    expect(transform(source)).toContain(`import { useParams } from "@tanstack/react-router"`);
  });

  it("rewrites useSelectedLayoutSegment → useMatch", () => {
    const source = `import { useSelectedLayoutSegment } from "next/router";`;
    expect(transform(source)).toContain(`import { useMatch } from "@tanstack/react-router"`);
  });

  it("rewrites useSelectedLayoutSegments → useMatches", () => {
    const source = `import { useSelectedLayoutSegments } from "next/router";`;
    expect(transform(source)).toContain(`import { useMatches } from "@tanstack/react-router"`);
  });
});

// ---------------------------------------------------------------------------
// Single-quoted imports
// ---------------------------------------------------------------------------

describe("next/router with single quotes", () => {
  it("rewrites useRouter from single-quoted import", () => {
    const source = `import { useRouter } from 'next/router';`;
    expect(transform(source)).toContain(`import { useRouter } from "@tanstack/react-router"`);
  });

  it("rewrites usePathname from single-quoted import", () => {
    const source = `import { usePathname } from 'next/router';`;
    expect(transform(source)).toContain(`import { useLocation } from "@tanstack/react-router"`);
  });

  it("rewrites useSearchParams from single-quoted import", () => {
    const source = `import { useSearchParams } from 'next/router';`;
    expect(transform(source)).toContain(`import { useSearch } from "@tanstack/react-router"`);
  });
});

// ---------------------------------------------------------------------------
// Multiple imports in a single statement
// ---------------------------------------------------------------------------

describe("multiple named imports in one statement", () => {
  it("rewrites useRouter and usePathname together", () => {
    const source = `import { useRouter, usePathname } from "next/router";`;
    const result = transform(source);
    expect(result).toContain("useRouter");
    expect(result).toContain("useLocation");
    expect(result).toContain(`from "@tanstack/react-router"`);
    // Both must appear in the same import statement (single line)
    expect(result).toMatch(/import \{[^}]*useRouter[^}]*\} from "@tanstack\/react-router"/);
    expect(result).toMatch(/import \{[^}]*useLocation[^}]*\} from "@tanstack\/react-router"/);
  });

  it("rewrites useSearchParams and useParams together", () => {
    const source = `import { useSearchParams, useParams } from "next/router";`;
    const result = transform(source);
    expect(result).toContain("useSearch");
    expect(result).toContain("useParams");
    expect(result).toContain(`from "@tanstack/react-router"`);
  });

  it("rewrites all six router hooks in one import", () => {
    const source = `import { useRouter, usePathname, useSearchParams, useParams, useSelectedLayoutSegment, useSelectedLayoutSegments } from "next/router";`;
    const result = transform(source);
    expect(result).toContain("useRouter");
    expect(result).toContain("useLocation");
    expect(result).toContain("useSearch");
    expect(result).toContain("useParams");
    expect(result).toContain("useMatch");
    expect(result).toContain("useMatches");
    expect(result).toContain(`from "@tanstack/react-router"`);
    // The original next/router specifier must not appear in the output
    expect(result).not.toContain("next/router");
  });
});

// ---------------------------------------------------------------------------
// Aliased imports
// ---------------------------------------------------------------------------

describe("aliased imports (import { X as Y } from 'next/router')", () => {
  it("preserves the alias when rewriting useRouter", () => {
    const source = `import { useRouter as myRouter } from "next/router";`;
    const result = transform(source);
    expect(result).toContain("useRouter as myRouter");
    expect(result).toContain(`from "@tanstack/react-router"`);
  });

  it("uses the tanstack name on the left-hand side of the alias", () => {
    const source = `import { usePathname as currentPath } from "next/router";`;
    const result = transform(source);
    expect(result).toContain("useLocation as currentPath");
    expect(result).toContain(`from "@tanstack/react-router"`);
  });

  it("rewrites the tanstack name while preserving alias for useSearchParams", () => {
    const source = `import { useSearchParams as queryParams } from "next/router";`;
    const result = transform(source);
    expect(result).toContain("useSearch as queryParams");
    expect(result).not.toContain("useSearchParams");
  });

  it("handles alias alongside non-aliased import in the same statement", () => {
    const source = `import { useRouter as nav, usePathname } from "next/router";`;
    const result = transform(source);
    expect(result).toContain("useRouter as nav");
    expect(result).toContain("useLocation");
    expect(result).toContain(`from "@tanstack/react-router"`);
  });
});

// ---------------------------------------------------------------------------
// Unknown imports
// ---------------------------------------------------------------------------

describe("unknown next/router imports", () => {
  it("keeps an unknown specifier as-is", () => {
    const source = `import { withRouter } from "next/router";`;
    const result = transform(source);
    // The specifier must still appear in the output
    expect(result).toContain("withRouter");
  });

  it("produces a warning for an unknown specifier", () => {
    const source = `import { withRouter } from "next/router";`;
    const w = warnings(source);
    expect(w.some((msg) => msg.includes("withRouter"))).toBe(true);
    expect(w.some((msg) => msg.includes("next/router"))).toBe(true);
  });

  it("warning message mentions manual review", () => {
    const source = `import { createRouter } from "next/router";`;
    const w = warnings(source);
    expect(w.some((msg) => /manual review/i.test(msg))).toBe(true);
  });

  it("rewrites known specifiers even when mixed with unknown ones", () => {
    const source = `import { useRouter, withRouter } from "next/router";`;
    const result = transform(source);
    expect(result).toContain("useRouter");
    expect(result).toContain("withRouter");
    expect(result).toContain(`from "@tanstack/react-router"`);
    const w = warnings(source);
    expect(w.some((msg) => msg.includes("withRouter"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// No-op cases — files without next/router
// ---------------------------------------------------------------------------

describe("files without next/router imports", () => {
  it("leaves source unchanged when there is no next/router import", () => {
    const source = `import { useState } from "react";\n\nexport function Comp() {}`;
    expect(transform(source)).toBe(source);
  });

  it("produces no warnings when there is no next/router import", () => {
    const source = `import { useState } from "react";`;
    expect(warnings(source)).toHaveLength(0);
  });

  it("does not touch an empty file", () => {
    expect(transform("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Preservation of non-next imports
// ---------------------------------------------------------------------------

describe("preservation of non-next imports in the same file", () => {
  it("keeps react imports intact alongside a rewritten router import", () => {
    const source = [
      `import React, { useState, useEffect } from "react";`,
      `import { useRouter } from "next/router";`,
      ``,
      `export function Page() { return null; }`,
    ].join("\n");

    const result = transform(source);
    expect(result).toContain(`import React, { useState, useEffect } from "react"`);
    expect(result).toContain(`import { useRouter } from "@tanstack/react-router"`);
    expect(result).not.toContain(`from "next/router"`);
  });

  it("keeps third-party imports untouched", () => {
    const source = [
      `import { z } from "zod";`,
      `import { usePathname } from "next/router";`,
      `import clsx from "clsx";`,
    ].join("\n");

    const result = transform(source);
    expect(result).toContain(`import { z } from "zod"`);
    expect(result).toContain(`import clsx from "clsx"`);
    expect(result).toContain(`import { useLocation } from "@tanstack/react-router"`);
  });
});

// ---------------------------------------------------------------------------
// Multiple next/router import statements in the same file
// ---------------------------------------------------------------------------

describe("multiple next/router import statements in the same file", () => {
  it("rewrites every next/router import statement", () => {
    const source = [
      `import { useRouter } from "next/router";`,
      `// some code in between`,
      `import { usePathname } from "next/router";`,
    ].join("\n");

    const result = transform(source);
    expect(result).not.toContain("next/router");
    expect(result).toContain(`import { useRouter } from "@tanstack/react-router"`);
    expect(result).toContain(`import { useLocation } from "@tanstack/react-router"`);
  });

  it("accumulates warnings from all next/router statements", () => {
    const source = [
      `import { withRouter } from "next/router";`,
      `import { createRouter } from "next/router";`,
    ].join("\n");

    const w = warnings(source);
    expect(w.some((msg) => msg.includes("withRouter"))).toBe(true);
    expect(w.some((msg) => msg.includes("createRouter"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Output does not retain the original specifier string
// ---------------------------------------------------------------------------

describe("original next/router specifier is removed from output", () => {
  it("does not contain 'next/router' after a successful rewrite", () => {
    const source = `import { useRouter, usePathname, useParams } from "next/router";`;
    expect(transform(source)).not.toContain("next/router");
  });

  it("replaces single-quoted next/router with double-quoted tanstack path", () => {
    const source = `import { useRouter } from 'next/router';`;
    const result = transform(source);
    expect(result).not.toContain("next/router");
    expect(result).toContain(`"@tanstack/react-router"`);
  });
});
