import { describe, expect, it } from "vitest";
import { convertConfig } from "../config-converter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run convertConfig and return the full TransformResult. */
function convert(source: string) {
  return convertConfig("next.config.js", source);
}

/** Run convertConfig and return only the transformed string. */
function transformed(source: string): string {
  return convert(source).transformed;
}

/** Run convertConfig and return only the warnings array. */
function warnings(source: string): string[] {
  return convert(source).warnings;
}

// ---------------------------------------------------------------------------
// Minimal valid next.config.js sources used across multiple tests
// ---------------------------------------------------------------------------

const MINIMAL_CONFIG = `
/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
`.trim();

// ---------------------------------------------------------------------------
// 1. Basic next.config.js with no special features
// ---------------------------------------------------------------------------

describe("basic config with no special features", () => {
  it("returns a TransformResult with all required fields", () => {
    const result = convert(MINIMAL_CONFIG);

    expect(result).toHaveProperty("filename");
    expect(result).toHaveProperty("original");
    expect(result).toHaveProperty("transformed");
    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("produces no warnings for a bare-minimum config", () => {
    expect(warnings(MINIMAL_CONFIG)).toHaveLength(0);
  });

  it("generates a non-empty vite.config.ts body", () => {
    expect(transformed(MINIMAL_CONFIG).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Output filename is always "vite.config.ts"
// ---------------------------------------------------------------------------

describe("output filename", () => {
  it('is always "vite.config.ts" regardless of input filename', () => {
    expect(convertConfig("next.config.js", MINIMAL_CONFIG).filename).toBe("vite.config.ts");
  });

  it('is "vite.config.ts" when called with next.config.mjs', () => {
    expect(convertConfig("next.config.mjs", MINIMAL_CONFIG).filename).toBe("vite.config.ts");
  });

  it('is "vite.config.ts" when called with an empty filename', () => {
    expect(convertConfig("", MINIMAL_CONFIG).filename).toBe("vite.config.ts");
  });
});

// ---------------------------------------------------------------------------
// 3. basePath → base entry in output
// ---------------------------------------------------------------------------

describe("basePath config", () => {
  it("adds a base entry when basePath is present", () => {
    const source = `module.exports = { basePath: '/my-app' };`;
    expect(transformed(source)).toContain('base: "/my-app"');
  });

  it("preserves the basePath value exactly", () => {
    const source = `module.exports = { basePath: '/sub/path' };`;
    expect(transformed(source)).toContain('base: "/sub/path"');
  });

  it("does not add a base entry when basePath is absent", () => {
    expect(transformed(MINIMAL_CONFIG)).not.toContain("base:");
  });

  it("produces no warning for basePath (it is fully handled)", () => {
    const source = `module.exports = { basePath: '/app' };`;
    expect(warnings(source)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 4. trailingSlash → warning
// ---------------------------------------------------------------------------

describe("trailingSlash config", () => {
  it("emits a warning when trailingSlash: true is present", () => {
    const source = `module.exports = { trailingSlash: true };`;
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("warning message mentions trailingSlash", () => {
    const source = `module.exports = { trailingSlash: true };`;
    expect(warnings(source).some((msg) => msg.includes("trailingSlash"))).toBe(true);
  });

  it("does not emit a trailing-slash warning when trailingSlash is absent", () => {
    const source = `module.exports = { trailingSlash: false };`;
    expect(warnings(source).some((msg) => msg.includes("trailingSlash"))).toBe(false);
  });

  it("does not emit a trailing-slash warning for minimal config", () => {
    expect(warnings(MINIMAL_CONFIG).some((msg) => msg.includes("trailingSlash"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. i18n → warning
// ---------------------------------------------------------------------------

describe("i18n config", () => {
  it("emits a warning when i18n block is present", () => {
    const source = `module.exports = { i18n: { locales: ['en', 'fr'], defaultLocale: 'en' } };`;
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("warning message mentions i18n", () => {
    const source = `module.exports = { i18n: { locales: ['en'], defaultLocale: 'en' } };`;
    expect(warnings(source).some((msg) => msg.includes("i18n"))).toBe(true);
  });

  it("warning message mentions manual migration", () => {
    const source = `module.exports = { i18n: { locales: ['en'], defaultLocale: 'en' } };`;
    expect(warnings(source).some((msg) => /manual/i.test(msg))).toBe(true);
  });

  it("does not emit an i18n warning for minimal config", () => {
    expect(warnings(MINIMAL_CONFIG).some((msg) => msg.includes("i18n"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. images → warning
// ---------------------------------------------------------------------------

describe("images config", () => {
  it("emits a warning when images block is present", () => {
    const source = `module.exports = { images: { domains: ['example.com'] } };`;
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("warning message mentions images", () => {
    const source = `module.exports = { images: { formats: ['image/avif', 'image/webp'] } };`;
    expect(warnings(source).some((msg) => /image/i.test(msg))).toBe(true);
  });

  it("warning message mentions native img tags", () => {
    const source = `module.exports = { images: { domains: ['cdn.example.com'] } };`;
    expect(warnings(source).some((msg) => /<img>/i.test(msg) || /native/i.test(msg))).toBe(true);
  });

  it("does not emit an images warning for minimal config", () => {
    expect(warnings(MINIMAL_CONFIG).some((msg) => /image/i.test(msg))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. webpack → warning
// ---------------------------------------------------------------------------

describe("webpack config", () => {
  it("emits a warning when a webpack function is present (function keyword)", () => {
    const source = `module.exports = { webpack: function(config) { return config; } };`;
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("emits a warning when a webpack arrow function is present", () => {
    const source = `module.exports = { webpack: (config) => config };`;
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("warning message mentions webpack", () => {
    const source = `module.exports = { webpack: (config) => config };`;
    expect(warnings(source).some((msg) => msg.includes("webpack"))).toBe(true);
  });

  it("warning message mentions Vite plugins", () => {
    const source = `module.exports = { webpack: (config) => config };`;
    expect(warnings(source).some((msg) => /vite/i.test(msg))).toBe(true);
  });

  it("does not emit a webpack warning for minimal config", () => {
    expect(warnings(MINIMAL_CONFIG).some((msg) => msg.includes("webpack"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 8. experimental → warning
// ---------------------------------------------------------------------------

describe("experimental config", () => {
  it("emits a warning when experimental block is present", () => {
    const source = `module.exports = { experimental: { appDir: true } };`;
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("warning message mentions experimental", () => {
    const source = `module.exports = { experimental: { serverComponents: true } };`;
    expect(warnings(source).some((msg) => /experimental/i.test(msg))).toBe(true);
  });

  it("does not emit an experimental warning for minimal config", () => {
    expect(warnings(MINIMAL_CONFIG).some((msg) => /experimental/i.test(msg))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. headers() → warning
// ---------------------------------------------------------------------------

describe("headers() config", () => {
  it("emits a warning when an async headers() function is present", () => {
    const source = `
module.exports = {
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'X-Foo', value: 'bar' }] }];
  }
};`.trim();
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("emits a warning when a non-async headers() function is present", () => {
    const source = `module.exports = { headers() { return []; } };`;
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("warning message mentions headers", () => {
    const source = `module.exports = { async headers() { return []; } };`;
    expect(warnings(source).some((msg) => msg.includes("headers"))).toBe(true);
  });

  it("warning message mentions Hono middleware", () => {
    const source = `module.exports = { async headers() { return []; } };`;
    expect(warnings(source).some((msg) => /hono/i.test(msg))).toBe(true);
  });

  it("does not emit a headers warning for minimal config", () => {
    expect(warnings(MINIMAL_CONFIG).some((msg) => msg.includes("headers"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10. rewrites() → warning
// ---------------------------------------------------------------------------

describe("rewrites() config", () => {
  it("emits a warning when an async rewrites() function is present", () => {
    const source = `
module.exports = {
  async rewrites() {
    return [{ source: '/old', destination: '/new' }];
  }
};`.trim();
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("emits a warning when a non-async rewrites() function is present", () => {
    const source = `module.exports = { rewrites() { return []; } };`;
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("warning message mentions rewrites", () => {
    const source = `module.exports = { async rewrites() { return []; } };`;
    expect(
      warnings(source).some((msg) => msg.includes("rewrites") || msg.includes("Rewrites")),
    ).toBe(true);
  });

  it("does not emit a rewrites warning for minimal config", () => {
    expect(warnings(MINIMAL_CONFIG).some((msg) => /rewrites/i.test(msg))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11. redirects() → warning
// ---------------------------------------------------------------------------

describe("redirects() config", () => {
  it("emits a warning when an async redirects() function is present", () => {
    const source = `
module.exports = {
  async redirects() {
    return [{ source: '/old', destination: '/new', permanent: true }];
  }
};`.trim();
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("emits a warning when a non-async redirects() function is present", () => {
    const source = `module.exports = { redirects() { return []; } };`;
    const w = warnings(source);
    expect(w.length).toBeGreaterThan(0);
  });

  it("warning message mentions redirects", () => {
    const source = `module.exports = { async redirects() { return []; } };`;
    expect(
      warnings(source).some((msg) => msg.includes("redirects") || msg.includes("Redirects")),
    ).toBe(true);
  });

  it("does not emit a redirects warning for minimal config", () => {
    expect(warnings(MINIMAL_CONFIG).some((msg) => /redirects/i.test(msg))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 12. NEXT_PUBLIC_* env vars → comment in output
// ---------------------------------------------------------------------------

describe("NEXT_PUBLIC_* env vars", () => {
  it("includes a mapping comment when NEXT_PUBLIC_* var is found", () => {
    const source = `
const nextConfig = { env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL } };
module.exports = nextConfig;
`.trim();
    expect(transformed(source)).toContain("NEXT_PUBLIC_API_URL");
  });

  it("shows the VITE_* mapping target in the comment", () => {
    const source = `const x = process.env.NEXT_PUBLIC_API_URL;`;
    const out = transformed(source);
    expect(out).toContain("VITE_API_URL");
  });

  it("handles multiple distinct NEXT_PUBLIC_* vars", () => {
    const source = `
const a = process.env.NEXT_PUBLIC_API_URL;
const b = process.env.NEXT_PUBLIC_ANALYTICS_KEY;
`.trim();
    const out = transformed(source);
    expect(out).toContain("NEXT_PUBLIC_API_URL");
    expect(out).toContain("NEXT_PUBLIC_ANALYTICS_KEY");
  });

  it("deduplicates repeated references to the same var", () => {
    const source = `
const a = process.env.NEXT_PUBLIC_API_URL;
const b = process.env.NEXT_PUBLIC_API_URL;
`.trim();
    const out = transformed(source);
    // The var name should appear, but only once in the mapping comment
    const commentSection = out.split("Environment variable mapping:")[1] ?? "";
    const occurrences = (commentSection.match(/NEXT_PUBLIC_API_URL/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it("does not add an env-var comment when no NEXT_PUBLIC_* vars are present", () => {
    expect(transformed(MINIMAL_CONFIG)).not.toContain("NEXT_PUBLIC_");
  });
});

// ---------------------------------------------------------------------------
// 13. Output contains TanStackRouterVite
// ---------------------------------------------------------------------------

describe("TanStackRouterVite plugin in output", () => {
  it("always includes TanStackRouterVite() in the plugins array", () => {
    expect(transformed(MINIMAL_CONFIG)).toContain("TanStackRouterVite()");
  });

  it("includes the TanStackRouterVite import statement", () => {
    expect(transformed(MINIMAL_CONFIG)).toContain("TanStackRouterVite");
    expect(transformed(MINIMAL_CONFIG)).toContain("@tanstack/router-plugin/vite");
  });

  it("TanStackRouterVite appears before react() in the plugins list", () => {
    const out = transformed(MINIMAL_CONFIG);
    const tanstackIndex = out.indexOf("TanStackRouterVite()");
    const reactIndex = out.indexOf("react()");
    expect(tanstackIndex).toBeGreaterThanOrEqual(0);
    expect(reactIndex).toBeGreaterThanOrEqual(0);
    expect(tanstackIndex).toBeLessThan(reactIndex);
  });
});

// ---------------------------------------------------------------------------
// 14. Output contains react plugin
// ---------------------------------------------------------------------------

describe("react plugin in output", () => {
  it("always includes react() in the plugins array", () => {
    expect(transformed(MINIMAL_CONFIG)).toContain("react()");
  });

  it("includes the @vitejs/plugin-react import statement", () => {
    expect(transformed(MINIMAL_CONFIG)).toContain("@vitejs/plugin-react");
  });
});

// ---------------------------------------------------------------------------
// 15. Original source preserved
// ---------------------------------------------------------------------------

describe("original source preservation", () => {
  it("result.original equals the input source exactly", () => {
    const result = convert(MINIMAL_CONFIG);
    expect(result.original).toBe(MINIMAL_CONFIG);
  });

  it("result.original is not modified when the source contains special features", () => {
    const source = `module.exports = { trailingSlash: true, basePath: '/app' };`;
    const result = convert(source);
    expect(result.original).toBe(source);
  });

  it("result.transformed differs from result.original for any valid config", () => {
    const result = convert(MINIMAL_CONFIG);
    expect(result.transformed).not.toBe(result.original);
  });

  it("result.original is not affected when the input contains NEXT_PUBLIC_* vars", () => {
    const source = `const x = process.env.NEXT_PUBLIC_FOO;`;
    const result = convert(source);
    expect(result.original).toBe(source);
  });
});

// ---------------------------------------------------------------------------
// Output structural guarantees
// ---------------------------------------------------------------------------

describe("output structural content", () => {
  it("contains defineConfig call", () => {
    expect(transformed(MINIMAL_CONFIG)).toContain("defineConfig(");
  });

  it("contains server proxy config pointing to localhost:8787", () => {
    expect(transformed(MINIMAL_CONFIG)).toContain("localhost:8787");
  });

  it("contains a build config section", () => {
    expect(transformed(MINIMAL_CONFIG)).toContain("build:");
  });

  it("contains a resolve alias section", () => {
    expect(transformed(MINIMAL_CONFIG)).toContain("resolve:");
    expect(transformed(MINIMAL_CONFIG)).toContain("alias:");
  });

  it("maps @ to /src in the alias section", () => {
    expect(transformed(MINIMAL_CONFIG)).toContain('"@": "/src"');
  });

  it("includes the auto-generated file header comment", () => {
    expect(transformed(MINIMAL_CONFIG)).toContain("AUTO-GENERATED");
  });

  it("contains the vite import from defineConfig", () => {
    expect(transformed(MINIMAL_CONFIG)).toContain('from "vite"');
  });
});

// ---------------------------------------------------------------------------
// Multi-feature configs — warning accumulation
// ---------------------------------------------------------------------------

describe("multiple Next.js features produce independent warnings", () => {
  it("emits separate warnings for trailingSlash and i18n together", () => {
    const source = `
module.exports = {
  trailingSlash: true,
  i18n: { locales: ['en', 'fr'], defaultLocale: 'en' },
};`.trim();
    const w = warnings(source);
    expect(w.some((msg) => msg.includes("trailingSlash"))).toBe(true);
    expect(w.some((msg) => msg.includes("i18n"))).toBe(true);
    expect(w.length).toBeGreaterThanOrEqual(2);
  });

  it("emits separate warnings for rewrites and redirects together", () => {
    const source = `
module.exports = {
  async rewrites() { return []; },
  async redirects() { return []; },
};`.trim();
    const w = warnings(source);
    expect(w.some((msg) => /rewrites/i.test(msg))).toBe(true);
    expect(w.some((msg) => /redirects/i.test(msg))).toBe(true);
    expect(w.length).toBeGreaterThanOrEqual(2);
  });

  it("emits all eight possible warnings when all features are present", () => {
    const source = `
module.exports = {
  trailingSlash: true,
  i18n: { locales: ['en'], defaultLocale: 'en' },
  images: { domains: ['example.com'] },
  webpack: (config) => config,
  experimental: { appDir: true },
  async headers() { return []; },
  async rewrites() { return []; },
  async redirects() { return []; },
};`.trim();
    expect(warnings(source)).toHaveLength(8);
  });
});
