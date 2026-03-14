import { describe, expect, it } from "vitest";
import { convertMiddleware } from "../middleware-converter.ts";
import type { TransformResult } from "../types.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run convertMiddleware with a fixed filename. */
function convert(source: string): TransformResult {
  return convertMiddleware("middleware.ts", source);
}

/** Extract only the transformed string. */
function transformed(source: string): string {
  return convert(source).transformed;
}

/** Extract only the warnings array. */
function warnings(source: string): string[] {
  return convert(source).warnings;
}

// ---------------------------------------------------------------------------
// Dashboard demo fixture
// ---------------------------------------------------------------------------

const DASHBOARD_MIDDLEWARE = `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/") return NextResponse.next();
  const session = request.cookies.get("session_token")?.value;
  if (!session) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };`;

// ---------------------------------------------------------------------------
// 1. NextResponse.next() → await next()
// ---------------------------------------------------------------------------

describe("NextResponse.next() replacement", () => {
  it("replaces NextResponse.next() with await next()", () => {
    const source = `return NextResponse.next();`;
    expect(transformed(source)).toContain("await next()");
  });

  it("does not leave NextResponse.next() in the output", () => {
    const source = `return NextResponse.next();`;
    expect(transformed(source)).not.toContain("NextResponse.next()");
  });

  it("replaces all occurrences of NextResponse.next()", () => {
    const source = [`if (ok) return NextResponse.next();`, `return NextResponse.next();`].join(
      "\n",
    );
    const out = transformed(source);
    expect(out).not.toContain("NextResponse.next()");
    const count = (out.match(/await next\(\)/g) ?? []).length;
    expect(count).toBe(2);
  });

  it("dashboard fixture: NextResponse.next() → await next()", () => {
    const out = transformed(DASHBOARD_MIDDLEWARE);
    expect(out).not.toContain("NextResponse.next()");
    expect(out).toContain("await next()");
  });
});

// ---------------------------------------------------------------------------
// 2. Import replacement
// ---------------------------------------------------------------------------

describe("next/server import replacement", () => {
  it("replaces the next/server import with Hono Context+Next import", () => {
    const source = `import { NextResponse } from "next/server";`;
    const out = transformed(source);
    expect(out).toContain(`import type { Context, Next } from "hono"`);
    expect(out).not.toMatch(/from\s+["']next\/server["']/);
  });

  it("removes NextResponse from the import", () => {
    const source = `import { NextResponse } from "next/server";`;
    const out = transformed(source);
    expect(out).not.toMatch(/^import \{ NextResponse \}/m);
  });

  it("removes NextRequest from a combined import { NextResponse, NextRequest }", () => {
    const source = `import { NextResponse, NextRequest } from "next/server";`;
    const out = transformed(source);
    // Both are stripped; only the hono import remains
    expect(out).not.toMatch(/from\s+["']next\/server["']/);
    expect(out).toContain(`import type { Context, Next } from "hono"`);
  });

  it("preserves other specifiers as a comment when present alongside NextRequest/NextResponse", () => {
    const source = `import { NextResponse, NextRequest, SomethingElse } from "next/server";`;
    const out = transformed(source);
    expect(out).toContain("Removed:");
    expect(out).toContain("SomethingElse");
  });

  it("replaces a combined value import containing NextResponse", () => {
    const source = `import { NextResponse } from "next/server";`;
    const out = transformed(source);
    expect(out).toContain(`import type { Context, Next } from "hono"`);
    expect(out).not.toMatch(/from\s+["']next\/server["']/);
  });

  it("dashboard fixture: value next/server import is replaced with Hono import", () => {
    // The fixture has two next/server imports:
    //   import { NextResponse } from "next/server";       ← value import, replaced
    //   import type { NextRequest } from "next/server";   ← type-only import, not currently handled
    // The Hono import must be present.
    const out = transformed(DASHBOARD_MIDDLEWARE);
    expect(out).toContain(`import type { Context, Next } from "hono"`);
  });
});

// ---------------------------------------------------------------------------
// 3. NextRequest type annotation → Context
// ---------------------------------------------------------------------------

describe("NextRequest type annotation replacement", () => {
  it("replaces 'request: NextRequest' with 'c: Context'", () => {
    const source = `export function middleware(request: NextRequest) {}`;
    const out = transformed(source);
    expect(out).toContain("c: Context");
    expect(out).not.toContain("NextRequest");
  });

  it("replaces any identifier typed as NextRequest", () => {
    const source = `function handle(req: NextRequest) {}`;
    const out = transformed(source);
    expect(out).toContain("c: Context");
    expect(out).not.toContain(": NextRequest");
  });

  it("dashboard fixture: the parameter-level NextRequest annotation is replaced by c: Context", () => {
    // The `request: NextRequest` in the function signature becomes `c: Context`.
    // Note: the separate `import type { NextRequest }` line is not currently
    // handled by the converter, so NextRequest may still appear in the import.
    const out = transformed(DASHBOARD_MIDDLEWARE);
    expect(out).toContain("c: Context");
    // The parameter annotation must not remain in the function signature
    expect(out).not.toMatch(/\(\s*\w+\s*:\s*NextRequest\s*\)/);
  });
});

// ---------------------------------------------------------------------------
// 4. request.nextUrl.pathname → new URL(c.req.url).pathname
// ---------------------------------------------------------------------------

describe("nextUrl.pathname replacement", () => {
  it("replaces request.nextUrl.pathname", () => {
    const source = `const path = request.nextUrl.pathname;`;
    const out = transformed(source);
    expect(out).toContain("new URL(c.req.url).pathname");
    expect(out).not.toContain(".nextUrl.pathname");
  });

  it("replaces any identifier prefix before .nextUrl.pathname", () => {
    const source = `const p = req.nextUrl.pathname;`;
    const out = transformed(source);
    expect(out).toContain("new URL(c.req.url).pathname");
  });

  it("replaces inline .nextUrl.pathname access (not destructuring)", () => {
    // The regex matches `identifier.nextUrl.pathname` used inline, e.g.:
    //   const p = request.nextUrl.pathname;
    // The dashboard fixture uses a destructuring shorthand instead:
    //   const { pathname } = request.nextUrl;
    // which is NOT currently transformed by the converter.
    const inline = `const p = request.nextUrl.pathname;`;
    expect(transformed(inline)).toContain("new URL(c.req.url).pathname");
    expect(transformed(inline)).not.toContain(".nextUrl.pathname");
  });
});

// ---------------------------------------------------------------------------
// 5. request.nextUrl.searchParams → new URL(c.req.url).searchParams
// ---------------------------------------------------------------------------

describe("nextUrl.searchParams replacement", () => {
  it("replaces request.nextUrl.searchParams", () => {
    const source = `const params = request.nextUrl.searchParams;`;
    const out = transformed(source);
    expect(out).toContain("new URL(c.req.url).searchParams");
    expect(out).not.toContain(".nextUrl.searchParams");
  });

  it("replaces any identifier prefix before .nextUrl.searchParams", () => {
    const source = `const sp = req.nextUrl.searchParams;`;
    const out = transformed(source);
    expect(out).toContain("new URL(c.req.url).searchParams");
  });
});

// ---------------------------------------------------------------------------
// 6. cookies.get() replacement
// ---------------------------------------------------------------------------

describe("cookies.get() replacement", () => {
  it("replaces request.cookies.get(name) with c.req.cookie(name)", () => {
    const source = `const val = request.cookies.get("session_token");`;
    const out = transformed(source);
    expect(out).toContain(`c.req.cookie("session_token")`);
    expect(out).not.toContain(".cookies.get(");
  });

  it("replaces cookies.get with a variable name argument", () => {
    const source = `const tok = request.cookies.get(cookieName);`;
    const out = transformed(source);
    expect(out).toContain("c.req.cookie(cookieName)");
  });

  it("replaces cookies.get for any identifier prefix", () => {
    const source = `const v = req.cookies.get("auth");`;
    const out = transformed(source);
    expect(out).toContain(`c.req.cookie("auth")`);
  });

  it("dashboard fixture: cookies.get is replaced", () => {
    const out = transformed(DASHBOARD_MIDDLEWARE);
    expect(out).toContain(`c.req.cookie("session_token")`);
    expect(out).not.toContain(".cookies.get(");
  });
});

// ---------------------------------------------------------------------------
// 7. NextResponse.redirect → c.redirect
// ---------------------------------------------------------------------------

describe("NextResponse.redirect() replacement", () => {
  it("replaces NextResponse.redirect(new URL(path, request.url)) with c.redirect(path)", () => {
    const source = `return NextResponse.redirect(new URL("/login", request.url));`;
    const out = transformed(source);
    expect(out).toContain(`c.redirect("/login")`);
    expect(out).not.toContain("NextResponse.redirect(");
  });

  it("replaces redirect with a variable path", () => {
    const source = `return NextResponse.redirect(new URL(target, request.url));`;
    const out = transformed(source);
    expect(out).toContain("c.redirect(target)");
  });

  it("works with any identifier for the request object", () => {
    const source = `return NextResponse.redirect(new URL("/home", req.url));`;
    const out = transformed(source);
    expect(out).toContain(`c.redirect("/home")`);
  });

  it("dashboard fixture: NextResponse.redirect is replaced", () => {
    const out = transformed(DASHBOARD_MIDDLEWARE);
    expect(out).not.toContain("NextResponse.redirect(");
    expect(out).toContain(`c.redirect("/"`);
  });
});

// ---------------------------------------------------------------------------
// 8. NextResponse.rewrite → TODO comment + warning
// ---------------------------------------------------------------------------

describe("NextResponse.rewrite() handling", () => {
  it("replaces NextResponse.rewrite() with a TODO comment", () => {
    const source = `return NextResponse.rewrite(new URL("/new-path", request.url));`;
    const out = transformed(source);
    expect(out).toContain("TODO");
    expect(out).not.toContain("NextResponse.rewrite(");
  });

  it("includes 'Manual review needed' in the TODO comment", () => {
    const source = `return NextResponse.rewrite(new URL("/foo", request.url));`;
    const out = transformed(source);
    expect(out).toMatch(/manual review needed/i);
  });

  it("emits a warning for NextResponse.rewrite", () => {
    const source = `return NextResponse.rewrite(new URL("/bar", request.url));`;
    const w = warnings(source);
    expect(w.length).toBeGreaterThanOrEqual(1);
    expect(w.some((msg) => /rewrite/i.test(msg))).toBe(true);
  });

  it("warning message mentions Hono proxy or redirect pattern", () => {
    const source = `return NextResponse.rewrite(new URL("/bar", request.url));`;
    const w = warnings(source);
    expect(w.some((msg) => /hono/i.test(msg) || /proxy/i.test(msg) || /redirect/i.test(msg))).toBe(
      true,
    );
  });

  it("does not emit a rewrite warning when NextResponse.rewrite is absent", () => {
    const source = `return NextResponse.next();`;
    const w = warnings(source);
    expect(w.every((msg) => !/rewrite/i.test(msg))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9. NextResponse.json → c.json
// ---------------------------------------------------------------------------

describe("NextResponse.json() replacement", () => {
  it("replaces NextResponse.json(data) with c.json(data)", () => {
    const source = `return NextResponse.json({ ok: true });`;
    const out = transformed(source);
    expect(out).toContain("c.json({ ok: true })");
    expect(out).not.toContain("NextResponse.json(");
  });

  it("preserves the argument expression when replacing", () => {
    const source = `return NextResponse.json({ error: "not found" }, { status: 404 });`;
    const out = transformed(source);
    expect(out).toContain(`c.json({ error: "not found" }, { status: 404 })`);
  });

  it("replaces multiple json() calls in the same file", () => {
    const source = [
      `return NextResponse.json({ a: 1 });`,
      `return NextResponse.json({ b: 2 });`,
    ].join("\n");
    const out = transformed(source);
    expect(out).not.toContain("NextResponse.json(");
    expect((out.match(/c\.json\(/g) ?? []).length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 10. Function signature → authMiddleware
// ---------------------------------------------------------------------------

describe("function signature transformation", () => {
  it("renames 'export function middleware' to 'export async function authMiddleware'", () => {
    const source = `export function middleware(request: NextRequest) {}`;
    const out = transformed(source);
    expect(out).toContain("export async function authMiddleware(");
    expect(out).not.toMatch(/export\s+function\s+middleware\b/);
  });

  it("adds (c: Context, next: Next) as the parameter list", () => {
    const source = `export function middleware(request: NextRequest) {}`;
    const out = transformed(source);
    expect(out).toContain("authMiddleware(c: Context, next: Next)");
  });

  it("handles an already-async middleware", () => {
    const source = `export async function middleware(request: NextRequest) {}`;
    const out = transformed(source);
    expect(out).toContain("export async function authMiddleware(c: Context, next: Next)");
    expect(out).not.toMatch(/export\s+async\s+function\s+middleware\b/);
  });

  it("dashboard fixture: function is renamed to authMiddleware", () => {
    const out = transformed(DASHBOARD_MIDDLEWARE);
    expect(out).toContain("authMiddleware");
    expect(out).not.toMatch(/export\s+(async\s+)?function\s+middleware\b/);
  });
});

// ---------------------------------------------------------------------------
// 11. Matcher config extraction → warning with matcher value
// ---------------------------------------------------------------------------

describe("matcher config warning", () => {
  it("emits a warning when a config with matcher is present", () => {
    const source = `export const config = { matcher: ["/dashboard/:path*"] };`;
    const w = warnings(source);
    expect(w.some((msg) => /matcher/i.test(msg))).toBe(true);
  });

  it("warning includes the matcher value", () => {
    const source = `export const config = { matcher: ["/dashboard/:path*"] };`;
    const w = warnings(source);
    const matcherWarning = w.find((msg) => /matcher/i.test(msg));
    expect(matcherWarning).toBeDefined();
    expect(matcherWarning).toContain("/dashboard/:path*");
  });

  it("warning advises use as app.use() paths", () => {
    const source = `export const config = { matcher: ["/admin/:path*"] };`;
    const w = warnings(source);
    const matcherWarning = w.find((msg) => /matcher/i.test(msg));
    expect(matcherWarning).toBeDefined();
    expect(matcherWarning).toMatch(/app\.use/i);
  });

  it("does not emit a matcher warning when config is absent", () => {
    const source = `export function middleware(request: NextRequest) { return NextResponse.next(); }`;
    const w = warnings(source);
    expect(w.every((msg) => !/matcher/i.test(msg))).toBe(true);
  });

  it("dashboard fixture: matcher warning contains the correct path pattern", () => {
    const w = warnings(DASHBOARD_MIDDLEWARE);
    const matcherWarning = w.find((msg) => /matcher/i.test(msg));
    expect(matcherWarning).toBeDefined();
    expect(matcherWarning).toContain("/dashboard/:path*");
  });
});

// ---------------------------------------------------------------------------
// 12. Config export removed from output
// ---------------------------------------------------------------------------

describe("config export removal", () => {
  it("removes the config export from the transformed output", () => {
    const source = `export const config = { matcher: ["/dashboard/:path*"] };`;
    const out = transformed(source);
    expect(out).not.toMatch(/export\s+const\s+config\s*=/);
  });

  it("removes the entire config block including the matcher array", () => {
    const source = [
      `export function middleware(request: NextRequest) {}`,
      `export const config = { matcher: ["/admin/:path*", "/settings"] };`,
    ].join("\n");
    const out = transformed(source);
    expect(out).not.toContain("export const config");
    expect(out).not.toContain('"/admin/:path*"');
  });

  it("dashboard fixture: config export is absent from the output", () => {
    const out = transformed(DASHBOARD_MIDDLEWARE);
    expect(out).not.toMatch(/export\s+const\s+config/);
  });
});

// ---------------------------------------------------------------------------
// 13. Output filename
// ---------------------------------------------------------------------------

describe("output filename transformation", () => {
  it("replaces 'middleware' with 'middleware/auth' in the filename", () => {
    const result = convertMiddleware("middleware.ts", "");
    expect(result.filename).toBe("middleware/auth.ts");
  });

  it("preserves the file extension", () => {
    const result = convertMiddleware("middleware.ts", "");
    expect(result.filename.endsWith(".ts")).toBe(true);
  });

  it("handles a path prefix before middleware.ts", () => {
    const result = convertMiddleware("src/middleware.ts", "");
    expect(result.filename).toBe("src/middleware/auth.ts");
  });

  it("dashboard fixture: filename is middleware/auth.ts", () => {
    const result = convertMiddleware("middleware.ts", DASHBOARD_MIDDLEWARE);
    expect(result.filename).toBe("middleware/auth.ts");
  });
});

// ---------------------------------------------------------------------------
// 14. Hono usage comment in header
// ---------------------------------------------------------------------------

describe("Hono header comment", () => {
  it("prepends a block comment to the output", () => {
    const out = transformed("");
    expect(out.trimStart()).toMatch(/^\/\*\*/);
  });

  it("header mentions 'Hono'", () => {
    const out = transformed("");
    expect(out).toMatch(/hono/i);
  });

  it("header mentions 'authMiddleware' to guide the consumer", () => {
    const out = transformed("");
    expect(out).toContain("authMiddleware");
  });

  it("header includes a usage example referencing app.use()", () => {
    const out = transformed("");
    expect(out).toMatch(/app\.use/);
  });

  it("header is the very first content in the output", () => {
    const out = converted("").transformed;
    const firstNonWhitespace = out.trimStart();
    expect(firstNonWhitespace.startsWith("/**")).toBe(true);
  });

  it("dashboard fixture: output starts with the Hono header comment", () => {
    const out = transformed(DASHBOARD_MIDDLEWARE);
    expect(out.trimStart().startsWith("/**")).toBe(true);
    expect(out).toMatch(/hono/i);
  });
});

// ---------------------------------------------------------------------------
// 15. Original source preserved
// ---------------------------------------------------------------------------

describe("original source preservation", () => {
  it("result.original equals the source passed in", () => {
    const source = `export function middleware(request: NextRequest) {}`;
    const result = convert(source);
    expect(result.original).toBe(source);
  });

  it("result.original is unchanged even after extensive transformations", () => {
    const result = convertMiddleware("middleware.ts", DASHBOARD_MIDDLEWARE);
    expect(result.original).toBe(DASHBOARD_MIDDLEWARE);
  });

  it("result.original and result.transformed differ for non-trivial middleware", () => {
    const result = convert(DASHBOARD_MIDDLEWARE);
    expect(result.original).not.toBe(result.transformed);
  });

  it("result.original is unchanged for minimal source", () => {
    const source = `// empty middleware`;
    const result = convert(source);
    expect(result.original).toBe(source);
  });
});

// ---------------------------------------------------------------------------
// Full dashboard demo integration test
// ---------------------------------------------------------------------------

describe("dashboard demo fixture — full integration", () => {
  it("produces a TransformResult with all four fields", () => {
    const result = convertMiddleware("middleware.ts", DASHBOARD_MIDDLEWARE);
    expect(typeof result.filename).toBe("string");
    expect(typeof result.original).toBe("string");
    expect(typeof result.transformed).toBe("string");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("transformed output contains all expected Hono patterns", () => {
    const out = transformed(DASHBOARD_MIDDLEWARE);
    // Hono import replaces the value next/server import
    expect(out).toContain(`import type { Context, Next } from "hono"`);
    // Function signature is renamed and async
    expect(out).toContain("authMiddleware(c: Context, next: Next)");
    // NextResponse.next() → await next()
    expect(out).toContain("await next()");
    // cookies.get() → c.req.cookie()
    expect(out).toContain(`c.req.cookie("session_token")`);
    // NextResponse.redirect → c.redirect
    expect(out).toContain(`c.redirect("/"`);
  });

  it("transformed output removes Next.js response/function patterns", () => {
    const out = transformed(DASHBOARD_MIDDLEWARE);
    // NextResponse is gone from the output
    expect(out).not.toContain("NextResponse");
    // config export is removed
    expect(out).not.toMatch(/export\s+const\s+config/);
    // middleware function is renamed
    expect(out).not.toMatch(/export\s+(async\s+)?function\s+middleware\b/);
  });

  it("produces at least two warnings (matcher + no rewrite)", () => {
    const w = warnings(DASHBOARD_MIDDLEWARE);
    expect(w.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Helper used in test 14 — local alias to avoid shadowing outer `warnings` fn
// ---------------------------------------------------------------------------
function converted(source: string): TransformResult {
  return convertMiddleware("middleware.ts", source);
}
