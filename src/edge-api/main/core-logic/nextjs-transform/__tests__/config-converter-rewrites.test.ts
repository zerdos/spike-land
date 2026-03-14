/**
 * Tests for convertRewritesAndRedirects from config-converter.ts
 *
 * Covers extraction of rewrite and redirect rules from next.config.js
 * and generation of Hono middleware code.
 */

import { describe, expect, it } from "vitest";
import { convertRewritesAndRedirects } from "../config-converter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function code(nextConfig: string): string {
  return convertRewritesAndRedirects(nextConfig).code;
}

function warn(nextConfig: string): string[] {
  return convertRewritesAndRedirects(nextConfig).warnings;
}

/** No-rules sentinel returned by the function when no rules are extracted. */
const NO_RULES = "// No rewrites or redirects found in next.config.js";

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe("convertRewritesAndRedirects return shape", () => {
  it("returns an object with code and warnings fields", () => {
    const result = convertRewritesAndRedirects("const x = 1;");
    expect(typeof result.code).toBe("string");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("code is a non-empty string", () => {
    const result = convertRewritesAndRedirects("");
    expect(result.code.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// No rules found (no rewrites / redirects sections at all)
// ---------------------------------------------------------------------------

describe("no rewrite or redirect rules present", () => {
  it("returns the no-rules comment when config has no rewrites or redirects", () => {
    expect(code("const x = 1;")).toBe(NO_RULES);
  });

  it("returns the no-rules comment for an empty string", () => {
    expect(code("")).toBe(NO_RULES);
  });

  it("returns the no-rules comment when config only has unrelated sections", () => {
    const config = `
      module.exports = {
        reactStrictMode: true,
        basePath: '/app',
      };
    `;
    expect(code(config)).toBe(NO_RULES);
  });

  it("produces no warnings when no rules are found", () => {
    expect(warn("const x = 1;")).toHaveLength(0);
  });

  it("produces no warnings for an empty config", () => {
    expect(warn("")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Rewrite rule extraction
// ---------------------------------------------------------------------------

describe("configs containing rewrites() sections", () => {
  it("generates Hono middleware for a single rewrite rule", () => {
    const config = `
      module.exports = {
        async rewrites() {
          return [
            { source: '/blog', destination: '/blog-page' },
          ];
        },
      };
    `;
    const output = code(config);
    expect(output).toContain('import type { MiddlewareHandler } from "hono"');
    expect(output).toContain("Rewrite: /blog");
    expect(output).toContain("/blog-page");
    expect(output).toContain("await next()");
  });

  it("generates Hono middleware for multiple rewrite rules", () => {
    const config = `
      module.exports = {
        async rewrites() {
          return [
            { source: '/blog', destination: '/blog-page' },
            { source: '/about', destination: '/about-page' },
          ];
        },
      };
    `;
    const output = code(config);
    expect(output).toContain("Rewrite: /blog");
    expect(output).toContain("Rewrite: /about");
  });

  it("includes TODO comment for rewrite proxy logic", () => {
    const config = `
      module.exports = {
        rewrites() {
          return [
            { source: '/api-proxy', destination: 'https://api.example.com' },
          ];
        },
      };
    `;
    const output = code(config);
    expect(output).toContain("TODO");
    expect(output).toContain("proxy");
  });
});

// ---------------------------------------------------------------------------
// Redirect rule extraction
// ---------------------------------------------------------------------------

describe("configs containing redirects() sections", () => {
  it("generates redirect with status 308 for permanent: true", () => {
    const config = `
      module.exports = {
        async redirects() {
          return [
            { source: '/legacy', destination: '/current', permanent: true },
          ];
        },
      };
    `;
    const output = code(config);
    expect(output).toContain('c.redirect("/current", 308)');
  });

  it("generates redirect with status 307 for permanent: false", () => {
    const config = `
      module.exports = {
        async redirects() {
          return [
            { source: '/temp', destination: '/new-temp', permanent: false },
          ];
        },
      };
    `;
    const output = code(config);
    expect(output).toContain('c.redirect("/new-temp", 307)');
  });

  it("generates redirect with status 307 when permanent is omitted", () => {
    const config = `
      module.exports = {
        async redirects() {
          return [
            { source: '/old', destination: '/new' },
          ];
        },
      };
    `;
    const output = code(config);
    expect(output).toContain("Redirect: /old");
    expect(output).toContain('c.redirect("/new"');
  });
});

// ---------------------------------------------------------------------------
// Both rewrites and redirects
// ---------------------------------------------------------------------------

describe("configs with both rewrites and redirects", () => {
  it("generates middleware with both rewrite and redirect rules", () => {
    const config = `
      module.exports = {
        async rewrites() {
          return [{ source: '/api-proxy', destination: 'https://api.example.com' }];
        },
        async redirects() {
          return [{ source: '/old-path', destination: '/new-path', permanent: true }];
        },
      };
    `;
    const output = code(config);
    expect(output).toContain("Rewrite: /api-proxy");
    expect(output).toContain("Redirect: /old-path");
    expect(output).toContain("308");
  });
});

// ---------------------------------------------------------------------------
// Generated code structure
// ---------------------------------------------------------------------------

describe("generated Hono middleware structure", () => {
  const config = `
    module.exports = {
      async rewrites() {
        return [{ source: '/a', destination: '/b' }];
      },
    };
  `;

  it("includes Hono MiddlewareHandler import", () => {
    expect(code(config)).toContain('import type { MiddlewareHandler } from "hono"');
  });

  it("includes await next() at end", () => {
    expect(code(config)).toContain("await next()");
  });

  it("includes auto-generated header comment", () => {
    expect(code(config)).toContain("AUTO-GENERATED");
  });

  it("exports rewritesAndRedirects middleware", () => {
    expect(code(config)).toContain("export const rewritesAndRedirects");
  });
});

// ---------------------------------------------------------------------------
// Route pattern conversion (observable through generated regex)
// ---------------------------------------------------------------------------

describe("nextPatternToRegex — observed through generated code", () => {
  it("converts dynamic segment :param to [^/]+", () => {
    const config = `
      module.exports = {
        rewrites() { return [{ source: '/user/:id', destination: '/profile/:id' }]; }
      };
    `;
    const output = code(config);
    // Slashes are escaped in the generated regex, so [^/]+ becomes [^\\/]+
    expect(output).toContain("[^\\/]+");
  });

  it("converts catch-all :param* to .+", () => {
    const config = `
      module.exports = {
        rewrites() { return [{ source: '/api/:path*', destination: 'https://backend.example.com/:path*' }]; }
      };
    `;
    const output = code(config);
    expect(output).toContain(".+");
  });

  it("returns a string for any input", () => {
    const config = `
      module.exports = {
        rewrites() { return [{ source: '/about', destination: '/about-page' }]; }
      };
    `;
    expect(typeof code(config)).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// No-rules output shape
// ---------------------------------------------------------------------------

describe("no-rules output is a valid JS comment", () => {
  it("starts with '//'", () => {
    expect(code("")).toMatch(/^\/\//);
  });

  it("is a single-line string with no newlines", () => {
    expect(code("")).not.toContain("\n");
  });
});
