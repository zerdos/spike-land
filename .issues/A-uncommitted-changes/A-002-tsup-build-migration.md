# A-002 Build System Migration: mcp-server-base to tsup

**Priority:** N/A (housekeeping)
**Category:** Uncommitted Changes
**Type:** Infrastructure
**Affected Personas:** N/A (internal)
**Estimated Effort:** S

## Problem

The `mcp-server-base` package build system was migrated from raw `tsc` to `tsup` for dual ESM/CJS output with declaration files, but the changes were never committed.

## Evidence

3 files with uncommitted changes:

**Root package.json**: Added `tsup` dependency (`^8.5.1`)

**packages/mcp-server-base/package.json**:
- Added `"require": "./dist/index.cjs"` to exports map
- Changed build script: `"tsc"` → `"tsup index.ts --format esm,cjs --dts --clean"`
- Changed dev script: `"tsc --watch"` → `"tsup index.ts --format esm,cjs --dts --watch"`
- Added devDependencies: `tsup@8.5.1`, `tsx@4.21.0`

**yarn.lock**: Updated with tsup dependency resolution

## Acceptance Criteria

- [ ] All 3 files committed
- [ ] `cd packages/mcp-server-base && npm run build` succeeds
- [ ] Package produces both `dist/index.js` (ESM) and `dist/index.cjs` (CJS)
- [ ] Declaration file `dist/index.d.ts` is generated

## Implementation Notes

The tsup migration enables CJS consumers to `require()` the package. This is a build tooling change only — no source code modifications.
