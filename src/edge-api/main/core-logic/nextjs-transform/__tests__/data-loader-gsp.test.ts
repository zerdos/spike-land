import { describe, expect, it } from "vitest";
import { convertDataLoaders } from "../data-loader-converter.ts";
import type { TransformResult } from "../types.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run convertDataLoaders and return the full result. */
function run(source: string, filename = "pages/index.tsx"): TransformResult {
  return convertDataLoaders(filename, source);
}

/** Return only the transformed string. */
function transform(source: string, filename = "pages/index.tsx"): string {
  return run(source, filename).transformed;
}

/** Return only the warnings array. */
function warnings(source: string, filename = "pages/index.tsx"): string[] {
  return run(source, filename).warnings;
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const GSP_ASYNC = `
export async function getStaticProps() {
  const data = await fetch("https://api.example.com/items").then((r) => r.json());
  return { props: { data } };
}
`.trim();

const GSP_SYNC = `
export function getStaticProps() {
  return { props: { title: "Hello" } };
}
`.trim();

const GSP_WITH_PARAMS = `
export async function getStaticProps({ params }) {
  const post = await db.posts.findById(params.id);
  return { props: { post } };
}
`.trim();

const GSPA_ASYNC = `
export async function getStaticPaths() {
  const ids = await fetch("/api/ids").then((r) => r.json());
  return { paths: ids.map((id: string) => ({ params: { id } })), fallback: false };
}
`.trim();

const GSPA_SYNC = `
export function getStaticPaths() {
  return { paths: [{ params: { id: "1" } }], fallback: false };
}
`.trim();

// ---------------------------------------------------------------------------
// TransformResult shape
// ---------------------------------------------------------------------------

describe("convertDataLoaders return shape", () => {
  it("returns filename, original, transformed, and warnings fields", () => {
    const source = `export default function Page() { return null; }`;
    const result = run(source, "pages/about.tsx");

    expect(result.filename).toBe("pages/about.tsx");
    expect(result.original).toBe(source);
    expect(typeof result.transformed).toBe("string");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("original is never mutated by the transform", () => {
    const result = run(GSP_ASYNC);

    expect(result.original).toBe(GSP_ASYNC);
  });

  it("preserves the filename passed as first argument", () => {
    const result = run(GSP_SYNC, "pages/blog/[slug].tsx");

    expect(result.filename).toBe("pages/blog/[slug].tsx");
  });
});

// ---------------------------------------------------------------------------
// 1. Basic getStaticProps → loader stub generated
// ---------------------------------------------------------------------------

describe("getStaticProps — basic conversion to loader", () => {
  it("removes the original getStaticProps export from the output", () => {
    const result = transform(GSP_ASYNC);

    expect(result).not.toMatch(/export\s+(async\s+)?function\s+getStaticProps/);
  });

  it("adds an exported const loader arrow function", () => {
    const result = transform(GSP_ASYNC);

    expect(result).toMatch(/export\s+const\s+loader\s*=/);
  });

  it("loader is an async arrow function", () => {
    const result = transform(GSP_ASYNC);

    expect(result).toMatch(/export\s+const\s+loader\s*=\s*async\s*\(\)/);
  });

  it("converts sync getStaticProps (no async keyword)", () => {
    const result = transform(GSP_SYNC);

    expect(result).not.toMatch(/export\s+(async\s+)?function\s+getStaticProps/);
    expect(result).toMatch(/export\s+const\s+loader\s*=/);
  });

  it("converts getStaticProps with destructured parameters", () => {
    const result = transform(GSP_WITH_PARAMS);

    expect(result).not.toMatch(/export\s+(async\s+)?function\s+getStaticProps/);
    expect(result).toMatch(/export\s+const\s+loader\s*=/);
  });
});

// ---------------------------------------------------------------------------
// 2. Warning about build-time vs load-time
// ---------------------------------------------------------------------------

describe("getStaticProps — build-time vs load-time warning", () => {
  it("emits a warning when getStaticProps is detected", () => {
    const w = warnings(GSP_ASYNC);

    expect(w.length).toBeGreaterThan(0);
  });

  it("warning mentions getStaticProps", () => {
    const w = warnings(GSP_ASYNC);

    expect(w.some((msg) => msg.includes("getStaticProps"))).toBe(true);
  });

  it("warning mentions TanStack Router loader", () => {
    const w = warnings(GSP_ASYNC);

    expect(w.some((msg) => /tanstack router loader/i.test(msg) || /loader/i.test(msg))).toBe(true);
  });

  it("warning contrasts build time with load time", () => {
    const w = warnings(GSP_ASYNC);

    // The implementation says "data will be fetched at route load time instead of build time"
    const hasBuildVsLoad = w.some((msg) => /build.?time/i.test(msg) || /load.?time/i.test(msg));
    expect(hasBuildVsLoad).toBe(true);
  });

  it("warning is present for the sync form as well", () => {
    const w = warnings(GSP_SYNC);

    expect(w.some((msg) => msg.includes("getStaticProps"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Original body preserved as comments inside the loader
// ---------------------------------------------------------------------------

describe("getStaticProps — original body commented inside loader", () => {
  it("loader block contains commented-out lines from the original body", () => {
    const result = transform(GSP_ASYNC);

    // Each line of the original body should appear prefixed with "//"
    expect(result).toContain("// ");
  });

  it("original fetch call appears commented out in the loader", () => {
    const source = `
export async function getStaticProps() {
  const data = await fetch("https://api.example.com");
  return { props: { data } };
}
`.trim();

    const result = transform(source);

    // The fetch call should appear, but only in a comment
    expect(result).toMatch(/\/\/.*fetch\("https:\/\/api\.example\.com"\)/);
    // It must not appear as live code
    expect(result).not.toMatch(/^\s*(const|let|var)\s+data\s*=/m);
  });

  it("all lines of the original body are prefixed with //", () => {
    const source = `
export async function getStaticProps() {
  const x = 1;
  const y = 2;
  return { props: { x, y } };
}
`.trim();

    const result = transform(source);

    // The loader block must exist and contain commented body lines
    // "const x = 1" and "const y = 2" should only appear commented
    const liveX = result.match(/^\s*const x = 1;/m);
    const liveY = result.match(/^\s*const y = 2;/m);
    expect(liveX).toBeNull();
    expect(liveY).toBeNull();

    expect(result).toMatch(/\/\/.*const x = 1/);
    expect(result).toMatch(/\/\/.*const y = 2/);
  });

  it("loader contains a TODO comment directing the developer", () => {
    const result = transform(GSP_ASYNC);

    expect(result).toMatch(/\/\/\s*TODO/i);
  });

  it("loader returns an empty object as a placeholder", () => {
    const result = transform(GSP_ASYNC);

    expect(result).toContain("return {};");
  });
});

// ---------------------------------------------------------------------------
// 4. getStaticProps extraction failure → warning
// ---------------------------------------------------------------------------

describe("getStaticProps — extraction failure handling", () => {
  it("emits a parse-failure warning when body cannot be extracted", () => {
    // Malformed source: unbalanced braces — extractFunctionBody will fail
    // because depth never reaches 0.
    const malformed = `export async function getStaticProps() { if (true) {`;

    const w = warnings(malformed);

    expect(w.some((msg) => /could not parse/i.test(msg) || /manual migration/i.test(msg))).toBe(
      true,
    );
  });

  it("still emits the initial detection warning before the parse failure", () => {
    const malformed = `export async function getStaticProps() { if (true) {`;

    const w = warnings(malformed);

    expect(w.some((msg) => msg.includes("getStaticProps"))).toBe(true);
  });

  it("returns the source unchanged when extraction fails", () => {
    const malformed = `export async function getStaticProps() { if (true) {`;

    const result = transform(malformed);

    // The original function signature is still present (not replaced)
    expect(result).toContain("export async function getStaticProps()");
  });
});

// ---------------------------------------------------------------------------
// 5. No getStaticProps → file left unchanged
// ---------------------------------------------------------------------------

describe("files without getStaticProps", () => {
  it("leaves a plain component file unchanged", () => {
    const source = `
import React from "react";

export default function Page() {
  return <div>Hello</div>;
}
`.trim();

    expect(transform(source)).toBe(source);
  });

  it("produces no getStaticProps-related warnings", () => {
    const source = `export default function Page() { return null; }`;
    const w = warnings(source);

    expect(w.some((msg) => msg.includes("getStaticProps"))).toBe(false);
  });

  it("does not insert a loader when there is no getStaticProps", () => {
    const source = `export default function Page() { return null; }`;

    expect(transform(source)).not.toMatch(/export\s+const\s+loader\s*=/);
  });

  it("handles an empty string without throwing", () => {
    expect(() => transform("")).not.toThrow();
    expect(transform("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 6. getStaticPaths → removed with comment
// ---------------------------------------------------------------------------

describe("getStaticPaths — removal", () => {
  it("removes the async getStaticPaths function from the output", () => {
    const result = transform(GSPA_ASYNC);

    expect(result).not.toMatch(/export\s+(async\s+)?function\s+getStaticPaths/);
  });

  it("removes the sync getStaticPaths function from the output", () => {
    const result = transform(GSPA_SYNC);

    expect(result).not.toMatch(/export\s+(async\s+)?function\s+getStaticPaths/);
  });

  it("replaces getStaticPaths with a comment", () => {
    const result = transform(GSPA_ASYNC);

    expect(result).toMatch(/\/\/.*getStaticPaths/);
  });

  it("comment mentions client-side routing", () => {
    const result = transform(GSPA_ASYNC);

    // The implementation adds "// getStaticPaths removed — not needed with client-side routing"
    expect(result).toMatch(/\/\/.*client.?side routing/i);
  });

  it("body of getStaticPaths does not appear as live code", () => {
    const source = `
export async function getStaticPaths() {
  const SECRET = "should-not-appear-live";
  return { paths: [], fallback: false };
}
`.trim();

    const result = transform(source);

    // The live assignment must not be present
    expect(result).not.toMatch(/^\s*const SECRET\s*=/m);
  });
});

// ---------------------------------------------------------------------------
// 7. getStaticPaths warning about client-side routing
// ---------------------------------------------------------------------------

describe("getStaticPaths — warning", () => {
  it("emits a warning when getStaticPaths is detected", () => {
    const w = warnings(GSPA_ASYNC);

    expect(w.length).toBeGreaterThan(0);
  });

  it("warning mentions getStaticPaths", () => {
    const w = warnings(GSPA_ASYNC);

    expect(w.some((msg) => msg.includes("getStaticPaths"))).toBe(true);
  });

  it("warning mentions client-side routing", () => {
    const w = warnings(GSPA_ASYNC);

    expect(w.some((msg) => /client.?side routing/i.test(msg))).toBe(true);
  });

  it("warning mentions removal or not needed", () => {
    const w = warnings(GSPA_ASYNC);

    const mentionsRemoval = w.some((msg) => /removed/i.test(msg) || /not needed/i.test(msg));
    expect(mentionsRemoval).toBe(true);
  });

  it("warning is emitted for sync form as well", () => {
    const w = warnings(GSPA_SYNC);

    expect(w.some((msg) => msg.includes("getStaticPaths"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. Both getStaticProps and getStaticPaths → both transformed
// ---------------------------------------------------------------------------

describe("file with both getStaticProps and getStaticPaths", () => {
  const BOTH = `
import React from "react";

export async function getStaticPaths() {
  return { paths: [{ params: { id: "1" } }], fallback: false };
}

export async function getStaticProps({ params }) {
  const item = await fetch(\`/api/items/\${params.id}\`).then((r) => r.json());
  return { props: { item } };
}

export default function PostPage({ item }: { item: unknown }) {
  return <div>{JSON.stringify(item)}</div>;
}
`.trim();

  it("removes getStaticPaths", () => {
    const result = transform(BOTH);

    expect(result).not.toMatch(/export\s+(async\s+)?function\s+getStaticPaths/);
  });

  it("removes getStaticProps", () => {
    const result = transform(BOTH);

    expect(result).not.toMatch(/export\s+(async\s+)?function\s+getStaticProps/);
  });

  it("adds a loader", () => {
    const result = transform(BOTH);

    expect(result).toMatch(/export\s+const\s+loader\s*=/);
  });

  it("adds a comment replacing getStaticPaths", () => {
    const result = transform(BOTH);

    expect(result).toMatch(/\/\/.*getStaticPaths/);
  });

  it("emits a getStaticProps warning", () => {
    const w = warnings(BOTH);

    expect(w.some((msg) => msg.includes("getStaticProps"))).toBe(true);
  });

  it("emits a getStaticPaths warning", () => {
    const w = warnings(BOTH);

    expect(w.some((msg) => msg.includes("getStaticPaths"))).toBe(true);
  });

  it("preserves the default export component", () => {
    const result = transform(BOTH);

    expect(result).toContain("export default function PostPage");
  });
});

// ---------------------------------------------------------------------------
// 9. Non-async getStaticPaths → still removed
// ---------------------------------------------------------------------------

describe("non-async getStaticPaths", () => {
  it("removes a synchronous getStaticPaths", () => {
    const result = transform(GSPA_SYNC);

    expect(result).not.toMatch(/export\s+function\s+getStaticPaths/);
  });

  it("adds a removal comment for the sync form", () => {
    const result = transform(GSPA_SYNC);

    expect(result).toMatch(/\/\/.*getStaticPaths/);
  });

  it("emits a warning for the sync form", () => {
    const w = warnings(GSPA_SYNC);

    expect(w.some((msg) => msg.includes("getStaticPaths"))).toBe(true);
  });

  it("does not insert a loader for getStaticPaths-only files", () => {
    const result = transform(GSPA_SYNC);

    expect(result).not.toMatch(/export\s+const\s+loader\s*=/);
  });
});

// ---------------------------------------------------------------------------
// 10. Result preserves filename and original
// ---------------------------------------------------------------------------

describe("result object invariants", () => {
  it("filename matches the argument passed to convertDataLoaders", () => {
    const result = run(GSP_ASYNC, "pages/products/[id].tsx");

    expect(result.filename).toBe("pages/products/[id].tsx");
  });

  it("original field equals the unmodified source string", () => {
    const source = GSP_ASYNC;
    const result = run(source, "pages/index.tsx");

    expect(result.original).toBe(source);
    expect(result.original).not.toBe(result.transformed);
  });

  it("original field equals source even when no transformation occurs", () => {
    const source = `export default function Page() { return null; }`;
    const result = run(source, "pages/about.tsx");

    expect(result.original).toBe(source);
  });

  it("transformed field is a string for every code path", () => {
    for (const source of [GSP_ASYNC, GSP_SYNC, GSPA_ASYNC, GSPA_SYNC, ""]) {
      const result = run(source);
      expect(typeof result.transformed).toBe("string");
    }
  });

  it("warnings field is always an array", () => {
    for (const source of [GSP_ASYNC, GSP_SYNC, GSPA_ASYNC, GSPA_SYNC, ""]) {
      const result = run(source);
      expect(Array.isArray(result.warnings)).toBe(true);
    }
  });
});
