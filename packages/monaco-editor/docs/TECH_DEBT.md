# Tech Debt Audit

Last updated: 2026-02-19

## High

### 3 bundlers in use (Rollup + Vite + Webpack)

AMD output is deprecated but still fully built and tested via Vite. Rollup handles ESM. Webpack plugin is a separate package. This triples build complexity and maintenance surface.

## Medium

### `any` types in 5 src/ files (not vendored)

Five non-vendored source files still use `any` type annotations rather than `unknown` or specific types:

- `src/internal/common/initialize.ts` — callback parameter types
- `src/internal/common/workers.ts` — `IWebWorkerOptions.createData` and `.host`
- `src/languages/features/json/register.ts` — `JSONSchema` interface fields (default, enum, const, examples, body, schema)
- `src/languages/features/common/lspLanguageFeatures.ts` — `isMarkupContent(thing: any)` type guard parameter
- `src/languages/definitions/_.contribution.ts` — Promise reject callback

### TODO comments in 3 language tokenizers

Bare or stale TODO comments remain in:

- `src/languages/definitions/scala/scala.test.ts` line 552 — numeric literal separator tokenization not handled
- `src/languages/definitions/swift/swift.ts` lines 39, 216 — Unicode identifier regex and escape sequences borrowed from C# without validation
- `src/languages/definitions/abap/abap.ts` line 1281 — `>` operator stored with leading space workaround

### @ts-ignore in tsWorker.ts

`src/languages/features/typescript/tsWorker.ts` line 532 uses `@ts-ignore` for `globalThis.ts = ts.typescript`. Should use `(globalThis as Record<string, unknown>).ts = ts.typescript` instead.

## Low

### 12.5MB of vendored TypeScript libs

`src/languages/features/typescript/lib/` contains 90+ files with many `@deprecated` annotations — pulled from TypeScript's lib folder.

---

## Resolved (sprint 2026-02-19, agent sprint 3)

- ✅ **`any` types in 5 src/ files** — Fixed: replaced with `unknown` in initialize.ts, workers.ts, json/register.ts, lspLanguageFeatures.ts, and \_.contribution.ts
- ✅ **TODO comments in 3 language tokenizers** — Fixed: expanded with explanatory comments in scala.test.ts, swift.ts, and abap.ts
- ✅ **`@ts-ignore` in tsWorker.ts** — Fixed: replaced with `(globalThis as Record<string, unknown>)` type assertion
- ✅ **ESLint config improvements** — Added `@typescript-eslint/no-unnecessary-type-assertion` rule
- ✅ **CI website job** — Separated website build into its own parallel CI job

## Resolved (2026-02-19)

- ✅ **Legacy AMD samples** — Fixed: removed `samples/legacy/` directory (14 AMD-format sample directories)

- ✅ **`wgsl.ts` uses `/u` regex flag incompatible with es5 target** — Fixed: changed tsconfig target from es5 to es2018 (type-checking only; esbuild handles transpilation)

## Resolved (commit 960f7b41, bazdmeg sprint 2026-02-18)

- ✅ **Outdated dependencies** — Fixed: glob updated to ^10.4.5, prettier to ^3.4.2, husky to ^9.1.7
- ✅ **1 language missing tests (ini)** — Fixed: comprehensive grammar tests added at `src/languages/definitions/ini/ini.test.ts`
- ✅ **No ESLint config** — Fixed: `eslint.config.mjs` added to project root
- ✅ **Smoke tests have hardcoded retry loops** — Fixed: refactored to use proper Playwright APIs (waitForSelector, waitForFunction)
- ✅ **Samples use outdated dependencies** — Fixed: updated to React 18.3.1 and Vite 7.1.11
- ✅ **`postiats.ts` has 6 unresolved TODO/FIXME comments** — Fixed: all TODO/FIXME comments resolved
- ✅ **Module ID mapping duplicated** — Already consolidated — vite.config.mjs imports from shared.mjs (confirmed 2026-02-18)
- ✅ **Webpack plugin uses CommonJS throughout** — Won't fix — webpack plugins require CJS. The plugin uses require.resolve() for runtime path resolution and export = for CJS compat. ESM conversion would provide zero benefit as webpack cannot load ESM plugins.
- ✅ **`any` types in TypeScript worker interfaces** — Fixed: 16 any type aliases in register.ts replaced with proper ts.\* types via type-only import from ./lib/typescriptServices. All eslint-disable comments removed.
- ✅ **`checkJs: false` in tsconfig** — Fixed: enabled checkJs: true in src/tsconfig.json. Added skipLibCheck: true and excluded languages/features/typescript/lib/typescriptServices.js (vendored, 37k errors). Fixed 3 implicit-any errors in sql/keywords.js. One pre-existing wgsl.ts regex error remains (unrelated).

## Resolved (commit 5b8c5f6b + sprint 2026-02-18)

- ✅ **`CONTRIBUTING.md` has wrong paths** — Fixed: updated to `src/languages/definitions/{myLang}/`
- ✅ **Prettier check disabled in CI** — Fixed: `npm run prettier-check` step restored in CI
- ✅ **Unused test framework dependencies** — Fixed: `mocha` and `chai` removed from devDependencies
- ✅ **Pre-commit hook is a stub** — Fixed: `.husky/pre-commit` now runs `pretty-quick --staged`
- ✅ **Deprecated API shims in CSS register** — Fixed: backward-compat shims removed
- ✅ **`MAINTAINING.md` has TBD section** — Fixed: webpack plugin publishing process documented
- ✅ **No `.editorconfig`** — Fixed: `.editorconfig` added
- ✅ **Parcel CI comment** — Fixed: documented with explanation and FUTURE_IDEAS.md reference
- ✅ **`importTypescript.ts` brittle string-based codegen** — Audited: most string manipulation is low-fragility (prepends, appends, simple templates). The only fragile part (CodeQL suppression comment injection) now has a validation guard that throws if patterns stop matching after a TS version bump.
