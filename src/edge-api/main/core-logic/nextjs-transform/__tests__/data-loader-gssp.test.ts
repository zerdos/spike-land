import { describe, expect, it } from "vitest";
import { convertDataLoaders } from "../data-loader-converter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run convertDataLoaders and return only the transformed string. */
function transform(source: string, filename = "pages/index.tsx"): string {
  return convertDataLoaders(filename, source).transformed;
}

/** Run convertDataLoaders and return only the warnings array. */
function warnings(source: string, filename = "pages/index.tsx"): string[] {
  return convertDataLoaders(filename, source).warnings;
}

// ---------------------------------------------------------------------------
// Minimal realistic fixtures
// ---------------------------------------------------------------------------

const SIMPLE_GSSP = `\
export function getServerSideProps() {
  return { props: { name: "Alice" } };
}

export default function Home({ name }) {
  return <h1>{name}</h1>;
}
`;

const ASYNC_GSSP = `\
export async function getServerSideProps(context) {
  const data = await fetch("https://api.example.com/posts").then((r) => r.json());
  return { props: { data } };
}

export default function Posts({ data }) {
  return <ul>{data.map((d) => <li key={d.id}>{d.title}</li>)}</ul>;
}
`;

const COMPLEX_GSSP = `\
export async function getServerSideProps(context) {
  try {
    const { params } = context;
    if (!params?.id) {
      return { notFound: true };
    }
    const response = await fetch(\`https://api.example.com/items/\${params.id}\`);
    if (!response.ok) {
      throw new Error("fetch failed");
    }
    const item = await response.json();
    return { props: { item } };
  } catch (err) {
    return { props: { item: null } };
  }
}

export default function ItemPage({ item }) {
  return <div>{item?.name}</div>;
}
`;

const NO_GSSP = `\
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
`;

const MULTI_PROP_COMPONENT = `\
export async function getServerSideProps() {
  return { props: { title: "Hello", user: { id: 1 }, items: [] } };
}

export default function Dashboard({ title, user, items }) {
  return <div>{title}</div>;
}
`;

// ---------------------------------------------------------------------------
// TransformResult shape
// ---------------------------------------------------------------------------

describe("convertDataLoaders — result shape", () => {
  it("returns the original source unchanged in result.original", () => {
    const result = convertDataLoaders("pages/index.tsx", SIMPLE_GSSP);
    expect(result.original).toBe(SIMPLE_GSSP);
  });

  it("preserves the filename in result.filename", () => {
    const result = convertDataLoaders("pages/blog/[slug].tsx", SIMPLE_GSSP);
    expect(result.filename).toBe("pages/blog/[slug].tsx");
  });

  it("result.original is never mutated even when a transform is applied", () => {
    const result = convertDataLoaders("pages/index.tsx", SIMPLE_GSSP);
    expect(result.original).toBe(SIMPLE_GSSP);
    expect(result.transformed).not.toBe(SIMPLE_GSSP);
  });

  it("always returns all four keys", () => {
    const result = convertDataLoaders("pages/index.tsx", NO_GSSP);
    expect(result).toHaveProperty("filename");
    expect(result).toHaveProperty("original");
    expect(result).toHaveProperty("transformed");
    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// No getServerSideProps — source is unchanged
// ---------------------------------------------------------------------------

describe("file with no getServerSideProps", () => {
  it("leaves transformed source identical to input", () => {
    expect(transform(NO_GSSP)).toBe(NO_GSSP);
  });

  it("emits no warnings", () => {
    expect(warnings(NO_GSSP)).toHaveLength(0);
  });

  it("does not add useServerData hook to source without GSSP", () => {
    expect(transform(NO_GSSP)).not.toContain("useServerData");
  });
});

// ---------------------------------------------------------------------------
// Basic synchronous getServerSideProps removal
// ---------------------------------------------------------------------------

describe("basic sync getServerSideProps", () => {
  it("removes the export function getServerSideProps declaration", () => {
    const result = transform(SIMPLE_GSSP);
    expect(result).not.toMatch(/export\s+function\s+getServerSideProps/);
  });

  it("does not leave the original return value in the output", () => {
    // The specific return props object should be gone along with the function body
    const result = transform(SIMPLE_GSSP);
    // The function body with "return { props: { name" should be removed
    expect(result).not.toContain('props: { name: "Alice" }');
  });

  it("adds the useServerData hook", () => {
    expect(transform(SIMPLE_GSSP)).toContain("useServerData");
  });
});

// ---------------------------------------------------------------------------
// Async getServerSideProps
// ---------------------------------------------------------------------------

describe("async getServerSideProps", () => {
  it("removes the export async function getServerSideProps declaration", () => {
    const result = transform(ASYNC_GSSP);
    expect(result).not.toMatch(/export\s+async\s+function\s+getServerSideProps/);
  });

  it("adds the useServerData hook for async GSSP", () => {
    expect(transform(ASYNC_GSSP)).toContain("useServerData");
  });

  it("emits at least one warning for async GSSP", () => {
    expect(warnings(ASYNC_GSSP).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Warning: server-only logic must move to API endpoint
// ---------------------------------------------------------------------------

describe("server-only logic warning", () => {
  it("emits a warning about moving server-only logic to an API endpoint", () => {
    const w = warnings(SIMPLE_GSSP);
    expect(w.some((msg) => /api endpoint/i.test(msg))).toBe(true);
  });

  it("warning mentions server-only logic (DB queries, auth checks)", () => {
    const w = warnings(SIMPLE_GSSP);
    expect(w.some((msg) => /server-only/i.test(msg))).toBe(true);
  });

  it("emits the server-only warning for async GSSP as well", () => {
    const w = warnings(ASYNC_GSSP);
    expect(w.some((msg) => /server-only/i.test(msg))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Generated hook: useState, useEffect, fetch
// ---------------------------------------------------------------------------

describe("generated useServerData hook contents", () => {
  it("hook contains useState", () => {
    expect(transform(SIMPLE_GSSP)).toContain("useState");
  });

  it("hook contains useEffect", () => {
    expect(transform(SIMPLE_GSSP)).toContain("useEffect");
  });

  it("hook contains a fetch call", () => {
    expect(transform(SIMPLE_GSSP)).toContain("fetch(");
  });

  it("hook is a named function called useServerData", () => {
    expect(transform(SIMPLE_GSSP)).toMatch(/function\s+useServerData\s*\(\s*\)/);
  });

  it("hook returns data, loading and error fields", () => {
    const result = transform(SIMPLE_GSSP);
    expect(result).toContain("loading");
    expect(result).toContain("error");
    expect(result).toContain("data");
  });

  it("hook includes a setLoading call for loading state management", () => {
    expect(transform(SIMPLE_GSSP)).toContain("setLoading");
  });

  it("hook includes error handling (setError)", () => {
    expect(transform(SIMPLE_GSSP)).toContain("setError");
  });

  it("hook includes a TODO comment pointing to the original pattern", () => {
    const result = transform(SIMPLE_GSSP);
    expect(result).toMatch(/TODO/);
  });
});

// ---------------------------------------------------------------------------
// Component props signature rewrite
// ---------------------------------------------------------------------------

describe("component with destructured props from getServerSideProps", () => {
  it("removes destructured props from the default export function signature", () => {
    const result = transform(SIMPLE_GSSP);
    // The original { name } destructuring should not appear as a parameter
    expect(result).not.toMatch(/export\s+default\s+function\s+\w+\s*\(\s*\{\s*name\s*\}/);
  });

  it("the default export component signature becomes a no-arg function", () => {
    const result = transform(SIMPLE_GSSP);
    expect(result).toMatch(/export\s+default\s+function\s+\w+\s*\(\s*\)/);
  });

  it("adds a TODO comment about using useServerData instead of props", () => {
    const result = transform(SIMPLE_GSSP);
    expect(result).toMatch(/TODO.*useServerData/i);
  });

  it("emits a warning naming the component and its original props", () => {
    const w = warnings(SIMPLE_GSSP);
    const propsWarning = w.find((msg) => msg.includes("Home"));
    expect(propsWarning).toBeDefined();
    expect(propsWarning).toContain("name");
  });

  it("warning mentions using useServerData() hook instead of props", () => {
    const w = warnings(SIMPLE_GSSP);
    expect(w.some((msg) => /useServerData/i.test(msg))).toBe(true);
  });

  it("handles multiple destructured props (title, user, items)", () => {
    const result = transform(MULTI_PROP_COMPONENT);
    expect(result).not.toMatch(
      /export\s+default\s+function\s+\w+\s*\(\s*\{\s*title,\s*user,\s*items\s*\}/,
    );
  });

  it("emits a warning that includes all prop names for multi-prop component", () => {
    const w = warnings(MULTI_PROP_COMPONENT);
    const propsWarning = w.find((msg) => msg.includes("Dashboard"));
    expect(propsWarning).toBeDefined();
    expect(propsWarning).toContain("title");
    expect(propsWarning).toContain("user");
    expect(propsWarning).toContain("items");
  });
});

// ---------------------------------------------------------------------------
// Complex function body with nested braces
// ---------------------------------------------------------------------------

describe("getServerSideProps with complex body (nested braces, try/catch)", () => {
  it("removes the entire GSSP function including nested braces", () => {
    const result = transform(COMPLEX_GSSP);
    expect(result).not.toMatch(/export\s+async\s+function\s+getServerSideProps/);
  });

  it("does not leave dangling closing braces from the GSSP function", () => {
    // The remaining code should still be valid-looking TypeScript
    // (no stray return-only fragment like 'return { notFound: true };' at top level)
    const result = transform(COMPLEX_GSSP);
    expect(result).not.toContain("notFound: true");
  });

  it("still adds the useServerData hook after a complex body extraction", () => {
    expect(transform(COMPLEX_GSSP)).toContain("useServerData");
  });

  it("still rewrites the component props signature after complex GSSP", () => {
    const result = transform(COMPLEX_GSSP);
    expect(result).not.toMatch(/export\s+default\s+function\s+\w+\s*\(\s*\{\s*item\s*\}/);
  });
});

// ---------------------------------------------------------------------------
// Multiple warnings when both body extraction and props are detected
// ---------------------------------------------------------------------------

describe("warning accumulation", () => {
  it("produces at least two warnings when GSSP and component props are both present", () => {
    // Minimum expected: server-only warning + props-rewrite warning
    expect(warnings(SIMPLE_GSSP).length).toBeGreaterThanOrEqual(2);
  });

  it("server-only API endpoint warning is distinct from the component props warning", () => {
    const w = warnings(SIMPLE_GSSP);
    const serverWarning = w.find((msg) => /api endpoint/i.test(msg));
    const propsWarning = w.find((msg) => /useServerData/i.test(msg));
    expect(serverWarning).toBeDefined();
    expect(propsWarning).toBeDefined();
    expect(serverWarning).not.toBe(propsWarning);
  });

  it("async GSSP with component props also accumulates multiple warnings", () => {
    expect(warnings(ASYNC_GSSP).length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Body extraction failure: manual migration warning
// ---------------------------------------------------------------------------

describe("body extraction failure", () => {
  it("adds a 'manual migration required' warning when body cannot be parsed", () => {
    // Construct source that matches the GSSP pattern but has an unclosed brace
    // so extractFunctionBody returns null (depth never reaches 0).
    // We simulate this by providing only the open brace without the matching close.
    const malformed =
      "export function getServerSideProps() {\n  return { props: {} };\n// missing closing brace";

    const w = warnings(malformed);
    expect(w.some((msg) => /manual migration required/i.test(msg))).toBe(true);
  });

  it("returns source unchanged when body extraction fails", () => {
    const malformed =
      "export function getServerSideProps() {\n  return { props: {} };\n// missing closing brace";

    const result = transform(malformed);
    // When extraction fails, source is returned as-is (after the early return)
    expect(result).toContain("export function getServerSideProps");
  });
});

// ---------------------------------------------------------------------------
// React import deduplication
// ---------------------------------------------------------------------------

describe("React import handling in generated hook", () => {
  it("adds useState and useEffect import when no React import exists in source", () => {
    const sourceWithoutReact = `\
export function getServerSideProps() {
  return { props: { value: 42 } };
}

export default function Page({ value }) {
  return <span>{value}</span>;
}
`;
    const result = transform(sourceWithoutReact);
    expect(result).toContain('import { useState, useEffect } from "react"');
  });

  it("does not produce a duplicate useState import when React is already imported", () => {
    const sourceWithReact = `\
import React, { useState, useEffect } from "react";

export function getServerSideProps() {
  return { props: { count: 0 } };
}

export default function Widget({ count }) {
  const [n, setN] = useState(count);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
`;
    const result = transform(sourceWithReact);
    const importCount = (result.match(/import \{ useState/g) ?? []).length;
    // There must be at most one useState import statement
    expect(importCount).toBeLessThanOrEqual(1);
  });
});
