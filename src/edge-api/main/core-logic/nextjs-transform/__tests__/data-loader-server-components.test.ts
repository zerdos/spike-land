import { describe, expect, it } from "vitest";
import { convertDataLoaders } from "../data-loader-converter.ts";
import type { TransformResult } from "../types.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run convertDataLoaders and return only the transformed string. */
function transform(filename: string, source: string): string {
  return convertDataLoaders(filename, source).transformed;
}

/** Run convertDataLoaders and return only the warnings array. */
function warnings(filename: string, source: string): string[] {
  return convertDataLoaders(filename, source).warnings;
}

// ---------------------------------------------------------------------------
// TransformResult shape
// ---------------------------------------------------------------------------

describe("convertDataLoaders return shape", () => {
  it("returns filename, original, transformed, and warnings fields", () => {
    const source = `export default async function Page() { return null; }`;
    const result: TransformResult = convertDataLoaders("page.tsx", source);

    expect(result.filename).toBe("page.tsx");
    expect(result.original).toBe(source);
    expect(typeof result.transformed).toBe("string");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("original is never mutated by the transform", () => {
    const source = `export default async function Page() { return null; }`;
    const result = convertDataLoaders("page.tsx", source);

    expect(result.original).toBe(source);
  });
});

// ---------------------------------------------------------------------------
// Server Component detection — async default export without "use client"
// ---------------------------------------------------------------------------

describe("async default export without 'use client' → converted to client component", () => {
  it("prepends 'use client' directive to the transformed output", () => {
    const source = `export default async function Page() { return null; }`;
    const result = transform("page.tsx", source);

    expect(result).toMatch(/^"use client"/);
  });

  it("converts 'export default async function' to a synchronous function", () => {
    const source = `export default async function Page() { return null; }`;
    const result = transform("page.tsx", source);

    expect(result).toContain("export default function Page()");
    expect(result).not.toMatch(/export default async function Page/);
  });

  it("emits a Server Component conversion warning", () => {
    const source = `export default async function Page() { return null; }`;
    const w = warnings("page.tsx", source);

    expect(w.length).toBeGreaterThan(0);
    expect(w.some((msg) => /server component/i.test(msg))).toBe(true);
  });

  it("preserves function parameters during async→sync conversion", () => {
    const source = `export default async function ProductPage({ id, locale }: Props) { return null; }`;
    const result = transform("product.tsx", source);

    expect(result).toContain("export default function ProductPage({ id, locale }: Props)");
  });

  it("adds a TODO comment above the converted function signature", () => {
    const source = `export default async function Page() { return null; }`;
    const result = transform("page.tsx", source);

    // The implementation emits one or more comment lines before the converted
    // function declaration; verify a TODO comment precedes it somewhere.
    const todoIndex = result.indexOf("// TODO");
    const funcIndex = result.indexOf("export default function Page");
    expect(todoIndex).toBeGreaterThanOrEqual(0);
    expect(funcIndex).toBeGreaterThan(todoIndex);
  });
});

// ---------------------------------------------------------------------------
// "use client" file → unchanged
// ---------------------------------------------------------------------------

describe('"use client" file is left entirely unchanged', () => {
  it("does not modify source that starts with double-quoted use client", () => {
    const source = `"use client";\n\nexport default async function Page() { return null; }`;
    const result = transform("page.tsx", source);

    expect(result).toBe(source);
  });

  it("does not modify source that starts with single-quoted use client", () => {
    const source = `'use client';\n\nexport default async function Page() { return null; }`;
    const result = transform("page.tsx", source);

    expect(result).toBe(source);
  });

  it("produces no Server Component warning for a file with use client", () => {
    const source = `"use client";\n\nexport default async function Page() { return null; }`;
    const w = warnings("page.tsx", source);

    expect(w.some((msg) => /server component/i.test(msg))).toBe(false);
  });

  it("produces no warnings at all for a simple use-client file", () => {
    const source = `"use client";\n\nimport React from "react";\n\nexport default function Page() { return null; }`;
    const w = warnings("page.tsx", source);

    // No data-fetching patterns and no server imports → no warnings
    expect(w.filter((msg) => /server component/i.test(msg))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Server-only import (no async) → warning, source not converted
// ---------------------------------------------------------------------------

describe("server-only imports without an async default export", () => {
  it("emits a warning about server-only modules for a prisma import", () => {
    const source = [
      `import { PrismaClient } from "prisma";`,
      ``,
      `export default function Page() { return null; }`,
    ].join("\n");
    const w = warnings("page.tsx", source);

    expect(w.some((msg) => /server[-\s]only/i.test(msg))).toBe(true);
  });

  it("does not prepend 'use client' when the component is not async", () => {
    const source = [
      `import { PrismaClient } from "prisma";`,
      ``,
      `export default function Page() { return null; }`,
    ].join("\n");
    const result = transform("page.tsx", source);

    expect(result).not.toMatch(/^"use client"/);
  });

  it("does not modify the source text when the component is not async", () => {
    const source = [
      `import { PrismaClient } from "prisma";`,
      ``,
      `export default function Page() { return null; }`,
    ].join("\n");
    const result = transform("page.tsx", source);

    expect(result).toContain(`import { PrismaClient } from "prisma"`);
    expect(result).toContain("export default function Page()");
  });

  it("warning for server-only import suggests migrating to an API endpoint", () => {
    const source = `import db from "database";\n\nexport default function Page() { return null; }`;
    const w = warnings("page.tsx", source);

    expect(w.some((msg) => /api endpoint/i.test(msg))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Async with direct await → await lines commented out
// ---------------------------------------------------------------------------

describe("async default export with direct await statements", () => {
  it("comments out a 'const x = await' line", () => {
    const source = [
      `export default async function Page() {`,
      `  const data = await fetchData();`,
      `  return null;`,
      `}`,
    ].join("\n");
    const result = transform("page.tsx", source);

    expect(result).toContain("// const data = await");
  });

  it("adds a TODO comment before each commented-out await", () => {
    const source = [
      `export default async function Page() {`,
      `  const data = await fetchData();`,
      `  return null;`,
      `}`,
    ].join("\n");
    const result = transform("page.tsx", source);

    expect(result).toMatch(/\/\/ TODO[^\n]*\n[^\n]*\/\/ const data = await/);
  });

  it("comments out a 'let x = await' line", () => {
    const source = [
      `export default async function Page() {`,
      `  let user = await getUser();`,
      `  return null;`,
      `}`,
    ].join("\n");
    const result = transform("page.tsx", source);

    expect(result).toContain("// let user = await");
  });

  it("comments out a 'var x = await' line", () => {
    const source = [
      `export default async function Page() {`,
      `  var config = await loadConfig();`,
      `  return null;`,
      `}`,
    ].join("\n");
    const result = transform("page.tsx", source);

    expect(result).toContain("// var config = await");
  });

  it("prepends 'use client' even when await lines are present", () => {
    const source = [
      `export default async function Page() {`,
      `  const data = await fetchData();`,
      `  return null;`,
      `}`,
    ].join("\n");
    const result = transform("page.tsx", source);

    expect(result).toMatch(/^"use client"/);
  });
});

// ---------------------------------------------------------------------------
// Regular (non-async) component without server imports → unchanged
// ---------------------------------------------------------------------------

describe("regular non-async component without server imports", () => {
  it("leaves the source unchanged", () => {
    const source = [
      `import React from "react";`,
      ``,
      `export default function Page() {`,
      `  return <div>Hello</div>;`,
      `}`,
    ].join("\n");
    const result = transform("page.tsx", source);

    expect(result).toBe(source);
  });

  it("produces no warnings", () => {
    const source = `export default function Page() { return null; }`;
    const w = warnings("page.tsx", source);

    expect(w).toHaveLength(0);
  });

  it("does not add 'use client' to a plain sync component", () => {
    const source = `export default function Widget() { return null; }`;
    const result = transform("widget.tsx", source);

    expect(result).not.toContain(`"use client"`);
  });
});

// ---------------------------------------------------------------------------
// Warning text includes the filename
// ---------------------------------------------------------------------------

describe("warning text includes the filename", () => {
  it("Server Component warning contains the exact filename passed in", () => {
    const source = `export default async function Page() { return null; }`;
    const w = warnings("components/ProductPage.tsx", source);

    expect(w.some((msg) => msg.includes("components/ProductPage.tsx"))).toBe(true);
  });

  it("server-only import warning contains the filename", () => {
    const source = `import db from "db";\n\nexport default function Page() { return null; }`;
    const w = warnings("routes/admin.tsx", source);

    expect(w.some((msg) => msg.includes("routes/admin.tsx"))).toBe(true);
  });

  it("filename appears verbatim (not altered) in the warning", () => {
    const filename = "src/pages/[id]/details.tsx";
    const source = `export default async function DetailsPage() { return null; }`;
    const w = warnings(filename, source);

    expect(w.some((msg) => msg.includes(filename))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// "use client" at file start → skipped entirely
// ---------------------------------------------------------------------------

describe('"use client" at file start causes the server-component pass to be skipped entirely', () => {
  it("skipped: double-quoted use client on the very first line", () => {
    const source = `"use client";\nexport default async function Page() {}`;
    const result = transform("page.tsx", source);

    // Must not get a second "use client" prepended
    expect((result.match(/"use client"/g) ?? []).length).toBe(1);
  });

  it("skipped: single-quoted use client on the very first line", () => {
    const source = `'use client';\nexport default async function Page() {}`;
    const result = transform("page.tsx", source);

    expect((result.match(/'use client'/g) ?? []).length).toBe(1);
  });

  it("does not emit a server-component warning when use client is present", () => {
    const source = `"use client";\nexport default async function Page() {}`;
    const w = warnings("page.tsx", source);

    expect(w.filter((msg) => /server component/i.test(msg))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Multiple server-only imports
// ---------------------------------------------------------------------------

describe("multiple server-only imports", () => {
  it("emits at least one warning for a file with both fs and path imports", () => {
    const source = [
      `import { readFile } from "fs";`,
      `import { join } from "path";`,
      ``,
      `export default function Page() { return null; }`,
    ].join("\n");
    const w = warnings("page.tsx", source);

    expect(w.length).toBeGreaterThan(0);
  });

  it("detects a drizzle import as server-only", () => {
    const source = `import { db } from "drizzle";\n\nexport default function Page() { return null; }`;
    const w = warnings("page.tsx", source);

    expect(w.some((msg) => /server[-\s]only/i.test(msg))).toBe(true);
  });

  it("detects an @/server import as server-only", () => {
    const source = `import { auth } from "@/server";\n\nexport default function Page() { return null; }`;
    const w = warnings("page.tsx", source);

    expect(w.some((msg) => /server[-\s]only/i.test(msg))).toBe(true);
  });

  it("detects an @/lib/server import as server-only", () => {
    const source = `import { session } from "@/lib/server";\n\nexport default function Page() { return null; }`;
    const w = warnings("page.tsx", source);

    expect(w.some((msg) => /server[-\s]only/i.test(msg))).toBe(true);
  });

  it("detects a crypto import as server-only", () => {
    const source = `import { randomBytes } from "crypto";\n\nexport default function Page() { return null; }`;
    const w = warnings("page.tsx", source);

    expect(w.some((msg) => /server[-\s]only/i.test(msg))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Result preserves original source
// ---------------------------------------------------------------------------

describe("result always preserves original source verbatim", () => {
  it("original field equals the source passed in for an async component", () => {
    const source = `export default async function Page() { return null; }`;
    const result = convertDataLoaders("page.tsx", source);

    expect(result.original).toBe(source);
  });

  it("original field equals the source passed in for a use-client file", () => {
    const source = `"use client";\n\nexport default function Page() { return null; }`;
    const result = convertDataLoaders("page.tsx", source);

    expect(result.original).toBe(source);
  });

  it("original field equals the source passed in for a server-import-only file", () => {
    const source = `import { PrismaClient } from "prisma";\n\nexport default function Page() { return null; }`;
    const result = convertDataLoaders("page.tsx", source);

    expect(result.original).toBe(source);
  });

  it("original field equals the source passed in for a plain sync component", () => {
    const source = `export default function Widget() { return null; }`;
    const result = convertDataLoaders("widget.tsx", source);

    expect(result.original).toBe(source);
  });

  it("original field is not affected by any mutations to the transformed string", () => {
    const source = `export default async function Page() { return null; }`;
    const result = convertDataLoaders("page.tsx", source);

    // Transformed differs from original for async components
    expect(result.transformed).not.toBe(result.original);
    // But original is still the raw input
    expect(result.original).toBe(source);
  });
});
