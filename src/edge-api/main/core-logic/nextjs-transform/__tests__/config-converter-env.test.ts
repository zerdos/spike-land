import { describe, expect, it } from "vitest";
import { rewriteEnvVars } from "../config-converter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run rewriteEnvVars and return only the transformed string. */
function transform(source: string, filename = "test.ts"): string {
  return rewriteEnvVars(filename, source).transformed;
}

/** Run rewriteEnvVars and return only the warnings array. */
function warnings(source: string, filename = "test.ts"): string[] {
  return rewriteEnvVars(filename, source).warnings;
}

// ---------------------------------------------------------------------------
// TransformResult shape
// ---------------------------------------------------------------------------

describe("rewriteEnvVars return shape", () => {
  it("preserves filename in result", () => {
    const source = `const url = process.env.NEXT_PUBLIC_API_URL;`;
    const result = rewriteEnvVars("src/config.ts", source);

    expect(result.filename).toBe("src/config.ts");
  });

  it("preserves original source unchanged in result", () => {
    const source = `const url = process.env.NEXT_PUBLIC_API_URL;`;
    const result = rewriteEnvVars("src/config.ts", source);

    expect(result.original).toBe(source);
  });

  it("result shape has filename, original, transformed, and warnings", () => {
    const source = `const x = process.env.NEXT_PUBLIC_API_URL;`;
    const result = rewriteEnvVars("app.ts", source);

    expect(typeof result.filename).toBe("string");
    expect(typeof result.original).toBe("string");
    expect(typeof result.transformed).toBe("string");
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// NEXT_PUBLIC_* → import.meta.env.VITE_*
// ---------------------------------------------------------------------------

describe("process.env.NEXT_PUBLIC_* → import.meta.env.VITE_*", () => {
  it("converts NEXT_PUBLIC_API_URL to VITE_API_URL", () => {
    const source = `const url = process.env.NEXT_PUBLIC_API_URL;`;
    expect(transform(source)).toBe(`const url = import.meta.env.VITE_API_URL;`);
  });

  it("converts NEXT_PUBLIC_APP_NAME to VITE_APP_NAME", () => {
    const source = `const name = process.env.NEXT_PUBLIC_APP_NAME;`;
    expect(transform(source)).toBe(`const name = import.meta.env.VITE_APP_NAME;`);
  });

  it("converts multiple distinct NEXT_PUBLIC vars in the same file", () => {
    const source = [
      `const url = process.env.NEXT_PUBLIC_API_URL;`,
      `const name = process.env.NEXT_PUBLIC_APP_NAME;`,
      `const key = process.env.NEXT_PUBLIC_STRIPE_PK;`,
    ].join("\n");

    const result = transform(source);
    expect(result).toContain("import.meta.env.VITE_API_URL");
    expect(result).toContain("import.meta.env.VITE_APP_NAME");
    expect(result).toContain("import.meta.env.VITE_STRIPE_PK");
    expect(result).not.toContain("process.env.NEXT_PUBLIC_");
  });

  it("produces no warnings for NEXT_PUBLIC conversions", () => {
    const source = `const url = process.env.NEXT_PUBLIC_API_URL;`;
    expect(warnings(source)).toHaveLength(0);
  });

  it("converts NEXT_PUBLIC var inside a template literal", () => {
    const source = "const msg = `Base URL: ${process.env.NEXT_PUBLIC_BASE_URL}`;";
    const result = transform(source);
    expect(result).toContain("import.meta.env.VITE_BASE_URL");
    expect(result).not.toContain("process.env.NEXT_PUBLIC_BASE_URL");
  });

  it("converts NEXT_PUBLIC var inside a conditional expression", () => {
    const source = `const endpoint = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";`;
    const result = transform(source);
    expect(result).toBe(
      `const endpoint = import.meta.env.VITE_API_URL ?? "http://localhost:3000";`,
    );
  });
});

// ---------------------------------------------------------------------------
// Server-only env vars — warning + TODO marker
// ---------------------------------------------------------------------------

describe("server-only env vars (non-NEXT_PUBLIC)", () => {
  it("wraps DATABASE_URL with a TODO comment", () => {
    const source = `const db = process.env.DATABASE_URL;`;
    const result = transform(source);
    expect(result).toContain("/* TODO: Manual review needed — server env */");
    expect(result).toContain("process.env.DATABASE_URL");
  });

  it("produces a warning for a server-only env var", () => {
    const source = `const secret = process.env.SECRET_KEY;`;
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("warning text includes the env var name", () => {
    const source = `const secret = process.env.SECRET_KEY;`;
    const w = warnings(source);
    expect(w.some((msg) => msg.includes("SECRET_KEY"))).toBe(true);
  });

  it("warning text includes the full process.env reference", () => {
    const source = `const db = process.env.DATABASE_URL;`;
    const w = warnings(source);
    expect(w.some((msg) => msg.includes("process.env.DATABASE_URL"))).toBe(true);
  });

  it("produces multiple warnings for multiple unique server-only vars", () => {
    const source = [
      `const db = process.env.DATABASE_URL;`,
      `const secret = process.env.JWT_SECRET;`,
      `const key = process.env.REDIS_PASSWORD;`,
    ].join("\n");

    const w = warnings(source);
    expect(w.some((msg) => msg.includes("DATABASE_URL"))).toBe(true);
    expect(w.some((msg) => msg.includes("JWT_SECRET"))).toBe(true);
    expect(w.some((msg) => msg.includes("REDIS_PASSWORD"))).toBe(true);
  });

  it("produces only one warning for duplicate server-only vars", () => {
    const source = [
      `const a = process.env.DATABASE_URL;`,
      `const b = process.env.DATABASE_URL;`,
      `const c = process.env.DATABASE_URL;`,
    ].join("\n");

    const w = warnings(source);
    const databaseUrlWarnings = w.filter((msg) => msg.includes("DATABASE_URL"));
    expect(databaseUrlWarnings).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Mixed: both NEXT_PUBLIC and server-only vars
// ---------------------------------------------------------------------------

describe("files with both NEXT_PUBLIC and server-only vars", () => {
  it("converts NEXT_PUBLIC vars and wraps server-only vars", () => {
    const source = [
      `const apiUrl = process.env.NEXT_PUBLIC_API_URL;`,
      `const dbUrl = process.env.DATABASE_URL;`,
    ].join("\n");

    const result = transform(source);
    expect(result).toContain("import.meta.env.VITE_API_URL");
    expect(result).toContain("/* TODO: Manual review needed — server env */");
    expect(result).toContain("process.env.DATABASE_URL");
  });

  it("produces a warning only for the server-only var, not the NEXT_PUBLIC one", () => {
    const source = [
      `const apiUrl = process.env.NEXT_PUBLIC_API_URL;`,
      `const secret = process.env.SECRET_KEY;`,
    ].join("\n");

    const w = warnings(source);
    expect(w.some((msg) => msg.includes("SECRET_KEY"))).toBe(true);
    expect(w.every((msg) => !msg.includes("NEXT_PUBLIC_API_URL"))).toBe(true);
    expect(w.every((msg) => !msg.includes("VITE_API_URL"))).toBe(true);
  });

  it("handles multiple NEXT_PUBLIC and multiple server-only vars together", () => {
    const source = [
      `const apiUrl = process.env.NEXT_PUBLIC_API_URL;`,
      `const appName = process.env.NEXT_PUBLIC_APP_NAME;`,
      `const db = process.env.DATABASE_URL;`,
      `const jwtSecret = process.env.JWT_SECRET;`,
    ].join("\n");

    const result = transform(source);
    expect(result).toContain("import.meta.env.VITE_API_URL");
    expect(result).toContain("import.meta.env.VITE_APP_NAME");
    expect(result).not.toContain("process.env.NEXT_PUBLIC_");

    const w = warnings(source);
    expect(w.some((msg) => msg.includes("DATABASE_URL"))).toBe(true);
    expect(w.some((msg) => msg.includes("JWT_SECRET"))).toBe(true);
    expect(w).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// No-op cases — files without env vars
// ---------------------------------------------------------------------------

describe("files without env var references", () => {
  it("leaves source unchanged when there are no env vars", () => {
    const source = `export function greet(name: string) { return \`Hello \${name}\`; }`;
    expect(transform(source)).toBe(source);
  });

  it("produces no warnings when there are no env vars", () => {
    const source = `const x = 42;`;
    expect(warnings(source)).toHaveLength(0);
  });

  it("does not modify an empty file", () => {
    expect(transform("")).toBe("");
  });

  it("does not modify a file with only import statements", () => {
    const source = `import React from "react";\nimport { z } from "zod";`;
    expect(transform(source)).toBe(source);
  });
});
