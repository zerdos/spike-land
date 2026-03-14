import { describe, expect, it } from "vitest";
import { convertApiRoute } from "../route-converter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run convertApiRoute and return only the generated code string. */
function code(filename: string, source: string): string {
  return convertApiRoute(filename, source).code;
}

/** Run convertApiRoute and return only the warnings array. */
function warnings(filename: string, source: string): string[] {
  return convertApiRoute(filename, source).warnings;
}

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe("convertApiRoute return shape", () => {
  it("returns an object with code and warnings fields", () => {
    const result = convertApiRoute("pages/api/hello.ts", "");
    expect(typeof result.code).toBe("string");
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Warning always emitted — test 10
// ---------------------------------------------------------------------------

describe("warning always includes filename", () => {
  it("includes the exact filename in the warning message", () => {
    const filename = "pages/api/hello.ts";
    const w = warnings(filename, "");
    expect(w.length).toBeGreaterThanOrEqual(1);
    expect(w.some((msg) => msg.includes(filename))).toBe(true);
  });

  it("always emits exactly one warning regardless of source content", () => {
    expect(warnings("pages/api/foo.ts", "")).toHaveLength(1);
    expect(warnings("pages/api/foo.ts", 'if (req.method === "GET") {}')).toHaveLength(1);
  });

  it("warning message mentions manual migration", () => {
    const w = warnings("pages/api/test.ts", "");
    expect(w.some((msg) => /manual migration/i.test(msg))).toBe(true);
  });

  it("includes filename for a deeply nested route", () => {
    const filename = "pages/api/users/[id].ts";
    const w = warnings(filename, "");
    expect(w.some((msg) => msg.includes(filename))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Generated code structure — tests 11 & 12
// ---------------------------------------------------------------------------

describe("generated code always includes Hono import and export default", () => {
  it("includes Hono import — test 11", () => {
    const output = code("pages/api/hello.ts", "");
    expect(output).toContain('import { Hono } from "hono"');
  });

  it("includes export default app — test 12", () => {
    const output = code("pages/api/hello.ts", "");
    expect(output).toContain("export default app");
  });

  it("instantiates the Hono app", () => {
    const output = code("pages/api/hello.ts", "");
    expect(output).toContain("const app = new Hono()");
  });

  it("includes a migration comment referencing the original filename", () => {
    const filename = "pages/api/hello.ts";
    const output = code(filename, "");
    expect(output).toContain(`// Migrated from: ${filename}`);
  });
});

// ---------------------------------------------------------------------------
// HTTP method detection — pages router (req.method) — tests 1, 2, 3
// ---------------------------------------------------------------------------

describe("pages router req.method detection", () => {
  it("detects GET method — test 1", () => {
    const source = `if (req.method === "GET") { res.json({ ok: true }); }`;
    const output = code("pages/api/hello.ts", source);
    expect(output).toContain("app.get(");
  });

  it("generates a GET handler stub at the correct route — test 1", () => {
    const source = `if (req.method === "GET") {}`;
    const output = code("pages/api/hello.ts", source);
    expect(output).toContain('app.get("/api/hello"');
  });

  it("detects POST method — test 2", () => {
    const source = `if (req.method === "POST") { res.json({ created: true }); }`;
    const output = code("pages/api/hello.ts", source);
    expect(output).toContain("app.post(");
    expect(output).not.toContain("app.get(");
  });

  it("detects both GET and POST when both appear — test 3", () => {
    const source = [
      `if (req.method === "GET") { res.json(items); }`,
      `if (req.method === "POST") { res.json({ created: true }); }`,
    ].join("\n");
    const output = code("pages/api/items.ts", source);
    expect(output).toContain("app.get(");
    expect(output).toContain("app.post(");
  });

  it("each method produces its own handler block — test 3", () => {
    const source = [`if (req.method === "GET") {}`, `if (req.method === "POST") {}`].join("\n");
    const output = code("pages/api/items.ts", source);
    // Both handler calls must be present as separate app.method() invocations
    const getMatches = output.match(/app\.get\(/g) ?? [];
    const postMatches = output.match(/app\.post\(/g) ?? [];
    expect(getMatches).toHaveLength(1);
    expect(postMatches).toHaveLength(1);
  });

  it("detects PUT method — test 13", () => {
    const source = `if (req.method === "PUT") {}`;
    const output = code("pages/api/resource.ts", source);
    expect(output).toContain("app.put(");
  });

  it("detects DELETE method — test 13", () => {
    const source = `if (req.method === "DELETE") {}`;
    const output = code("pages/api/resource.ts", source);
    expect(output).toContain("app.delete(");
  });

  it("detects PATCH method — test 13", () => {
    const source = `if (req.method === "PATCH") {}`;
    const output = code("pages/api/resource.ts", source);
    expect(output).toContain("app.patch(");
  });

  it("detects all five methods simultaneously — test 13", () => {
    const source = [
      `if (req.method === "GET") {}`,
      `if (req.method === "POST") {}`,
      `if (req.method === "PUT") {}`,
      `if (req.method === "DELETE") {}`,
      `if (req.method === "PATCH") {}`,
    ].join("\n");
    const output = code("pages/api/resource.ts", source);
    expect(output).toContain("app.get(");
    expect(output).toContain("app.post(");
    expect(output).toContain("app.put(");
    expect(output).toContain("app.delete(");
    expect(output).toContain("app.patch(");
  });
});

// ---------------------------------------------------------------------------
// HTTP method detection — app router (export async function) — tests 4 & 5
// ---------------------------------------------------------------------------

describe("app router named export detection", () => {
  it("detects GET from export async function GET — test 4", () => {
    const source = `export async function GET(request: Request) { return Response.json({}); }`;
    const output = code("pages/api/hello.ts", source);
    expect(output).toContain("app.get(");
  });

  it("detects GET from non-async export function GET", () => {
    const source = `export function GET(request: Request) { return Response.json({}); }`;
    const output = code("pages/api/hello.ts", source);
    expect(output).toContain("app.get(");
  });

  it("detects POST from export async function POST — test 5", () => {
    const source = `export async function POST(request: Request) { return Response.json({}); }`;
    const output = code("pages/api/hello.ts", source);
    expect(output).toContain("app.post(");
    expect(output).not.toContain("app.get(");
  });

  it("detects PUT from export async function PUT", () => {
    const source = `export async function PUT(request: Request) {}`;
    const output = code("pages/api/hello.ts", source);
    expect(output).toContain("app.put(");
  });

  it("detects DELETE from export async function DELETE", () => {
    const source = `export async function DELETE(request: Request) {}`;
    const output = code("pages/api/hello.ts", source);
    expect(output).toContain("app.delete(");
  });

  it("detects PATCH from export async function PATCH", () => {
    const source = `export async function PATCH(request: Request) {}`;
    const output = code("pages/api/hello.ts", source);
    expect(output).toContain("app.patch(");
  });

  it("detects multiple app-router exports in the same file", () => {
    const source = [
      `export async function GET(request: Request) {}`,
      `export async function POST(request: Request) {}`,
    ].join("\n");
    const output = code("pages/api/hello.ts", source);
    expect(output).toContain("app.get(");
    expect(output).toContain("app.post(");
  });
});

// ---------------------------------------------------------------------------
// Method deduplication (pages + app router patterns together)
// ---------------------------------------------------------------------------

describe("method deduplication when both patterns match the same method", () => {
  it("does not produce duplicate GET handler when both patterns detect GET", () => {
    const source = [
      `if (req.method === "GET") {}`,
      `export async function GET(request: Request) {}`,
    ].join("\n");
    const output = code("pages/api/hello.ts", source);
    const getMatches = output.match(/app\.get\(/g) ?? [];
    expect(getMatches).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Default to GET when no methods detected — test 6
// ---------------------------------------------------------------------------

describe("no method detection defaults to GET — test 6", () => {
  it("defaults to GET when source has no method checks", () => {
    const output = code("pages/api/hello.ts", "export default function handler() {}");
    expect(output).toContain("app.get(");
  });

  it("defaults to GET for empty source", () => {
    const output = code("pages/api/hello.ts", "");
    expect(output).toContain("app.get(");
  });

  it("does not generate non-GET handlers when source has no method patterns", () => {
    const output = code("pages/api/hello.ts", "export default function handler() {}");
    expect(output).not.toContain("app.post(");
    expect(output).not.toContain("app.put(");
    expect(output).not.toContain("app.delete(");
    expect(output).not.toContain("app.patch(");
  });
});

// ---------------------------------------------------------------------------
// Handler stub content
// ---------------------------------------------------------------------------

describe("generated handler stub content", () => {
  it("stub returns 501 not implemented JSON response", () => {
    const output = code("pages/api/hello.ts", "");
    expect(output).toContain("501");
    expect(output).toContain("not implemented");
  });

  it("stub uses async handler with context parameter c", () => {
    const output = code("pages/api/hello.ts", "");
    expect(output).toMatch(/async \(c\)/);
  });

  it("stub includes a TODO comment for manual review", () => {
    const output = code("pages/api/hello.ts", "");
    expect(output).toContain("TODO");
  });
});

// ---------------------------------------------------------------------------
// Route path generation — tests 7, 8, 9
// ---------------------------------------------------------------------------

describe("route path generation from filename", () => {
  it("simple pages/api/hello.ts → /api/hello — test 7 baseline", () => {
    const output = code("pages/api/hello.ts", "");
    expect(output).toContain('"/api/hello"');
  });

  it("dynamic segment [id] becomes :id — test 7", () => {
    const output = code("pages/api/users/[id].ts", "");
    expect(output).toContain('"/api/users/:id"');
  });

  it("dynamic segment [userId] becomes :userId", () => {
    const output = code("pages/api/posts/[userId].ts", "");
    expect(output).toContain('"/api/posts/:userId"');
  });

  it("catch-all [...slug] becomes * — test 8", () => {
    const output = code("pages/api/[...slug].ts", "");
    // The catch-all segment replaces [...slug] with *, giving /api/*
    expect(output).toContain("/api/*");
  });

  it("catch-all [...path] inside a directory becomes * — test 8", () => {
    const output = code("pages/api/docs/[...path].ts", "");
    // The catch-all segment becomes * regardless of nesting
    expect(output).toContain("*");
  });

  it("index route pages/api/index.ts → /api/ — test 9", () => {
    const output = code("pages/api/index.ts", "");
    expect(output).toContain('"/api/"');
  });

  it("nested index pages/api/users/index.ts → /api/users/ — test 9", () => {
    const output = code("pages/api/users/index.ts", "");
    expect(output).toContain('"/api/users/"');
  });

  it("strips /index suffix, not just any trailing segment", () => {
    // /api/hello must remain /api/hello (not have index stripped)
    const output = code("pages/api/hello.ts", "");
    expect(output).toContain('"/api/hello"');
    expect(output).not.toContain('"/api/"');
  });

  it("nested dynamic route pages/api/org/[orgId]/repo/[repoId].ts", () => {
    const output = code("pages/api/org/[orgId]/repo/[repoId].ts", "");
    expect(output).toContain('"/api/org/:orgId/repo/:repoId"');
  });
});

// ---------------------------------------------------------------------------
// Full end-to-end snapshot-style checks for representative inputs
// ---------------------------------------------------------------------------

describe("full output structure for representative routes", () => {
  it("pages router GET route has all required sections in order", () => {
    const source = `if (req.method === "GET") { res.json({ items: [] }); }`;
    const output = code("pages/api/items.ts", source);

    const honoImportIdx = output.indexOf('import { Hono } from "hono"');
    const appInstIdx = output.indexOf("const app = new Hono()");
    const handlerIdx = output.indexOf("app.get(");
    const exportIdx = output.indexOf("export default app");

    expect(honoImportIdx).toBeGreaterThanOrEqual(0);
    expect(appInstIdx).toBeGreaterThan(honoImportIdx);
    expect(handlerIdx).toBeGreaterThan(appInstIdx);
    expect(exportIdx).toBeGreaterThan(handlerIdx);
  });

  it("app router GET + POST route has both handlers before export default", () => {
    const source = [
      `export async function GET(request: Request) {}`,
      `export async function POST(request: Request) {}`,
    ].join("\n");
    const output = code("pages/api/items.ts", source);

    const getIdx = output.indexOf("app.get(");
    const postIdx = output.indexOf("app.post(");
    const exportIdx = output.indexOf("export default app");

    expect(getIdx).toBeGreaterThanOrEqual(0);
    expect(postIdx).toBeGreaterThanOrEqual(0);
    expect(exportIdx).toBeGreaterThan(Math.max(getIdx, postIdx));
  });
});
