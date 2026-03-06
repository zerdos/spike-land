# Future Ideas

A living document of improvement ideas for the monaco-editor repository. Agents and contributors should append new ideas to the appropriate section below.

> **To add an idea:** Append it to the relevant section with a brief description. Use `- [ ]` for actionable items.

Last updated: 2026-02-19

## Build & Infrastructure

- [x] Restore prettier-check in CI (currently commented out) — **Done**
- [ ] Consolidate to a single bundler (Rollup only), drop the AMD/Vite pipeline
- [x] Enable code coverage reporting in CI — **Done**
- [x] Add performance benchmarking — track build time and bundle size per commit — **Done** (check-bundle-size script)
- [x] Separate website build into its own CI job — **Done** (parallel `website` job in ci.yml)
- [ ] Create Docker setup for consistent dev environment
- [x] Resolve Parcel smoke test or remove it from CI config — **Documented with explanation in ci.yml**

## Dependencies & Modernization

- [x] Modernize outdated dependencies — **Done** (glob ^10.4.5, prettier ^3.4.2, husky ^9.1.7)
- [x] Remove unused mocha/chai devDependencies — **Done**
- [x] Add ESLint configuration — **Done** (eslint.config.mjs added)
- [x] Convert webpack-plugin to ESM — **Won't Fix** (webpack plugins require CJS; ESM conversion provides zero benefit)
- [ ] Use TypeScript Compiler API in `importTypescript.ts` instead of string manipulation
- [x] Add `.editorconfig` for consistent editor settings across contributors — **Done**
- [ ] Upgrade ESLint `no-explicit-any` rule from `warn` to `error` once all `any` annotations are removed from src/

## Languages & Testing

- [x] Add missing grammar tests for `ini/` — **Done** (comprehensive tests added in commit 960f7b41)
- [x] Resolve all `postiats.ts` TODO/FIXME comments — **Done (6 resolved)**
- [ ] Auto-generate test samples from language definitions
- [ ] Add structured flakiness detection for Playwright smoke tests
- [x] Type the worker interface methods — **Done** (16 any types replaced with proper ts.\* types in commit 960f7b41)
- [ ] Improve test coverage for worst-covered language tokenizers (e.g., scala numeric literal separators, swift unicode identifiers)

## Documentation & Developer Experience

- [x] Create a language contribution guide with working examples — **Done** (see docs/LANGUAGE_CONTRIBUTION.md)
- [x] Document the module ID mapping transformation pipeline — **Done** (see docs/MODULE_ID_MAPPING.md)
- [x] Complete the TBD webpack plugin publishing process in `MAINTAINING.md` — **Done**
- [x] Add API stability guarantees documentation — **Done** (see docs/API_STABILITY.md)
- [x] Update sample projects to current dependency versions — **Done** (React 18.3.1, Vite 7.1.11, TypeScript 5.9.3 already current)
