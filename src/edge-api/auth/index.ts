// Internal worker — the actual Worker entry is `src/edge-api/auth/db/index.ts`
// (resolved via the deploy shim at `packages/mcp-auth/index.ts`). Library
// imports should use specific subpaths (e.g. `db/auth`, `db/schema`) rather
// than this top-level barrel, which intentionally exposes nothing.
export {};
