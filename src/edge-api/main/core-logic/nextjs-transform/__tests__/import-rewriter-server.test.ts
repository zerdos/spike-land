import { describe, expect, it } from "vitest";
import { rewriteImports } from "../import-rewriter.ts";
import type { TransformResult } from "../types.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Call rewriteImports with a fixed filename so tests stay focused on content. */
function transform(source: string): TransformResult {
  return rewriteImports("test-file.ts", source);
}

/**
 * Returns the expected comment block that the rewriter emits for a server import.
 * The captured specifier group is whatever sits between `import` and `from`.
 */
function commentedImport(specifier: string, mod: string): string {
  return (
    `// TODO: Manual review needed — "${mod}" has no direct edge equivalent\n` +
    `// import ${specifier} from "${mod}"`
  );
}

// ---------------------------------------------------------------------------
// next/headers
// ---------------------------------------------------------------------------

describe("next/headers imports", () => {
  it("comments out a named import and adds a warning", () => {
    const source = `import { headers } from "next/headers";`;
    const result = transform(source);

    expect(result.transformed).toContain(commentedImport("{ headers }", "next/headers"));
    // The module path only appears inside comment lines, never as a live import.
    expect(result.transformed).not.toMatch(/^import .+ from "next\/headers"/m);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("next/headers");
  });

  it("warning text contains the exact server-only phrasing", () => {
    const source = `import { headers } from "next/headers";`;
    const { warnings } = transform(source);

    expect(warnings[0]).toBe(
      `Server-only import "next/headers" detected — must be manually migrated to Hono equivalents`,
    );
  });

  it("comments out multiple specifiers from the same import", () => {
    const source = `import { headers, cookies } from "next/headers";`;
    const result = transform(source);

    // The entire import statement (both specifiers) must be in the comment.
    expect(result.transformed).toContain(commentedImport("{ headers, cookies }", "next/headers"));
    expect(result.transformed).not.toMatch(/^import .+ from "next\/headers"/m);
    // Only one warning for this single module occurrence.
    expect(result.warnings.filter((w) => w.includes("next/headers"))).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// next/cookies
// ---------------------------------------------------------------------------

describe("next/cookies imports", () => {
  it("comments out a named import and adds a warning", () => {
    const source = `import { cookies } from "next/cookies";`;
    const result = transform(source);

    expect(result.transformed).toContain(commentedImport("{ cookies }", "next/cookies"));
    expect(result.transformed).not.toMatch(/^import .+ from "next\/cookies"/m);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("next/cookies");
  });

  it("warning contains the exact module name", () => {
    const source = `import { cookies } from "next/cookies";`;
    const { warnings } = transform(source);

    expect(warnings[0]).toBe(
      `Server-only import "next/cookies" detected — must be manually migrated to Hono equivalents`,
    );
  });
});

// ---------------------------------------------------------------------------
// next/server
// ---------------------------------------------------------------------------

describe("next/server imports", () => {
  it("comments out a named import and adds a warning", () => {
    const source = `import { NextResponse } from "next/server";`;
    const result = transform(source);

    expect(result.transformed).toContain(commentedImport("{ NextResponse }", "next/server"));
    expect(result.transformed).not.toMatch(/^import .+ from "next\/server"/m);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("next/server");
  });

  it("warning contains the exact module name", () => {
    const source = `import { NextResponse } from "next/server";`;
    const { warnings } = transform(source);

    expect(warnings[0]).toBe(
      `Server-only import "next/server" detected — must be manually migrated to Hono equivalents`,
    );
  });

  it("comments out a default import from next/server", () => {
    const source = `import server from "next/server";`;
    const result = transform(source);

    expect(result.transformed).toContain(commentedImport("server", "next/server"));
    expect(result.transformed).not.toMatch(/^import .+ from "next\/server"/m);
    expect(result.warnings).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Specifier preservation inside the comment
// ---------------------------------------------------------------------------

describe("specifier preservation in comment", () => {
  it("preserves named specifiers in the commented-out line", () => {
    const source = `import { headers } from "next/headers";`;
    const { transformed } = transform(source);

    // The second comment line must contain the original specifier block.
    expect(transformed).toMatch(/\/\/ import \{ headers \} from "next\/headers"/);
  });

  it("preserves multiple specifiers in the commented-out line", () => {
    const source = `import { headers, cookies } from "next/headers";`;
    const { transformed } = transform(source);

    expect(transformed).toMatch(/\/\/ import \{ headers, cookies \} from "next\/headers"/);
  });

  it("preserves a default specifier in the commented-out line", () => {
    const source = `import server from "next/server";`;
    const { transformed } = transform(source);

    expect(transformed).toMatch(/\/\/ import server from "next\/server"/);
  });
});

// ---------------------------------------------------------------------------
// No server imports
// ---------------------------------------------------------------------------

describe("files with no server imports", () => {
  it("returns source unchanged when there are no next/server imports", () => {
    const source = `import React from "react";\nexport default function Page() { return null; }`;
    const result = transform(source);

    expect(result.transformed).toBe(source);
    expect(result.warnings).toHaveLength(0);
  });

  it("produces zero warnings for a plain TypeScript file", () => {
    const source = `const x: number = 1;\nexport { x };`;
    const { warnings } = transform(source);

    expect(warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Multiple different server imports in the same file
// ---------------------------------------------------------------------------

describe("multiple server imports in one file", () => {
  it("emits one warning per distinct server module", () => {
    const source = [
      `import { headers } from "next/headers";`,
      `import { cookies } from "next/cookies";`,
      `import { NextResponse } from "next/server";`,
    ].join("\n");

    const { warnings } = transform(source);

    const serverWarnings = warnings.filter((w) => w.includes("Server-only import"));
    expect(serverWarnings).toHaveLength(3);

    const modules = serverWarnings.map((w) => {
      const m = w.match(/Server-only import "([^"]+)"/);
      return m ? m[1] : null;
    });
    expect(modules).toContain("next/headers");
    expect(modules).toContain("next/cookies");
    expect(modules).toContain("next/server");
  });

  it("comments out all three server imports", () => {
    const source = [
      `import { headers } from "next/headers";`,
      `import { cookies } from "next/cookies";`,
      `import { NextResponse } from "next/server";`,
    ].join("\n");

    const { transformed } = transform(source);

    expect(transformed).not.toMatch(/^import .+ from "next\/headers"/m);
    expect(transformed).not.toMatch(/^import .+ from "next\/cookies"/m);
    expect(transformed).not.toMatch(/^import .+ from "next\/server"/m);

    expect(transformed).toContain(`from "next/headers"`);
    expect(transformed).toContain(`from "next/cookies"`);
    expect(transformed).toContain(`from "next/server"`);
    // All occurrences must be inside comment lines.
    for (const line of transformed.split("\n")) {
      if (
        line.includes('from "next/headers"') ||
        line.includes('from "next/cookies"') ||
        line.includes('from "next/server"')
      ) {
        expect(line.trimStart()).toMatch(/^\/\//);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Mixed: server import alongside non-server imports
// ---------------------------------------------------------------------------

describe("server import alongside non-server imports", () => {
  it("only comments out the server import, leaving React import untouched", () => {
    const source = [
      `import React from "react";`,
      `import { headers } from "next/headers";`,
      `import { useState } from "react";`,
    ].join("\n");

    const result = transform(source);

    // Non-server imports survive as-is.
    expect(result.transformed).toContain(`import React from "react";`);
    expect(result.transformed).toContain(`import { useState } from "react";`);

    // Server import is gone as a live import.
    expect(result.transformed).not.toMatch(/^import .+ from "next\/headers"/m);

    // Only one warning, for the server import.
    const serverWarnings = result.warnings.filter((w) => w.includes("Server-only import"));
    expect(serverWarnings).toHaveLength(1);
  });

  it("does not alter non-next imports in any way", () => {
    const reactLine = `import { useEffect, useRef } from "react";`;
    const source = [reactLine, `import { NextResponse } from "next/server";`].join("\n");

    const { transformed } = transform(source);

    expect(transformed).toContain(reactLine);
  });
});

// ---------------------------------------------------------------------------
// TransformResult shape
// ---------------------------------------------------------------------------

describe("TransformResult shape", () => {
  it("returns the provided filename unchanged", () => {
    const result = rewriteImports("my-component.tsx", `import { headers } from "next/headers";`);
    expect(result.filename).toBe("my-component.tsx");
  });

  it("preserves the original source in result.original for server imports", () => {
    const source = `import { headers } from "next/headers";`;
    const result = transform(source);

    expect(result.original).toBe(source);
  });

  it("preserves the original source in result.original when nothing is transformed", () => {
    const source = `const x = 1;\nexport { x };`;
    const result = transform(source);

    expect(result.original).toBe(source);
    expect(result.transformed).toBe(source);
  });

  it("result.original and result.transformed differ after a server import is rewritten", () => {
    const source = `import { cookies } from "next/cookies";`;
    const result = transform(source);

    expect(result.original).not.toBe(result.transformed);
  });
});

// ---------------------------------------------------------------------------
// Quote style: single-quoted module path
// ---------------------------------------------------------------------------

describe("single-quoted module paths", () => {
  it("matches and rewrites imports using single quotes", () => {
    const source = `import { headers } from 'next/headers';`;
    const result = transform(source);

    expect(result.transformed).not.toMatch(/^import .+ from 'next\/headers'/m);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("next/headers");
  });
});
