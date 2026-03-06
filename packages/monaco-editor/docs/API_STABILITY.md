# API Stability

What's stable, what's internal, and how breaking changes are handled.

## Stable Public API

The stable public API is defined by `monaco.d.ts`, generated during the build and shipped with the npm package. Everything exported through this file is considered stable:

- The `monaco` global namespace (available when using the AMD loader)
- All types, interfaces, enums, and functions exported from the main entry point (`import * from 'monaco-editor'`)
- The `editor`, `languages`, `Uri`, `KeyCode`, `KeyMod`, and other top-level namespaces within `monaco`

### How the API surface is defined

- `src/editor.ts` re-exports everything from `monaco-editor-core/esm/vs/editor/editor.api` -- this is the core editor API surface from VS Code.
- `src/index.ts` re-exports `src/editor.ts` and adds `css`, `html`, `json`, `typescript` (language service namespaces) and `lsp` (the LSP client).
- The build generates `monaco.d.ts` from the AMD types output, then appends `declare global { export import monaco = editor_main; }` to create the global namespace.

### Versioning

Monaco Editor follows semantic versioning. The `version` field in `package.json` tracks releases (currently `0.55.1`). While in the `0.x` range, minor version bumps may include breaking changes, but these are documented in `CHANGELOG.md`.

## Internal / Unstable API

The following are **not** part of the stable API:

- **Direct `vs/` path imports** -- Importing from deep paths like `monaco-editor/esm/vs/editor/common/...` bypasses the public API. These paths mirror VS Code internals and can change without notice.
- **Worker internals** -- The internal message protocol between the main thread and language service workers.
- **Monarch tokenizer internals** -- The Monarch engine itself is stable, but its internal implementation details are not.
- **Build artifacts structure** -- The exact file layout under `esm/` and `min/` may change between versions. Use `package.json` `exports` to resolve imports.
- **Feature registration modules** -- The `register.*` files under `src/features/` are meant for tree-shaking, not direct consumption. Their existence and naming may change.

## Relationship with VS Code

Monaco Editor Core (`monaco-editor-core` npm package) is built directly from the VS Code repository. The `package.json` `vscodeRef` field tracks which VS Code commit the current core is built from.

**Key implications for contributors:**

- **Core editor bugs** (cursor behavior, text rendering, selection, scrolling, etc.) should be fixed in the [VS Code repository](https://github.com/microsoft/vscode), not here.
- **This repository adds** 84 Monarch tokenizer languages, 4 web-worker language services (CSS, HTML, JSON, TypeScript), the LSP client (`@vscode/monaco-lsp-client`), tree-shakeable feature registrations, and the webpack plugin.
- **Core API changes** flow from VS Code into Monaco Editor through `monaco-editor-core` version bumps. These are tracked via the `vscodeRef` field.

## Breaking Changes

### What constitutes a breaking change

- Removing or renaming any export from `monaco.d.ts`
- Changing the signature of a public method or constructor
- Changing the behavior of a public API in a way that breaks existing consumers
- Removing a language definition or worker that was previously included by default
- Changing `package.json` `exports` in a way that breaks existing import paths

### What is NOT a breaking change

- Adding new exports, methods, or interfaces
- Changes to internal `vs/` paths
- Changes to the AMD output (the AMD build is deprecated)
- Worker protocol changes (these are internal)
- Build tooling changes that don't affect the published output
- Bug fixes that correct behavior to match documented intent

### How breaking changes are communicated

- Documented in `CHANGELOG.md` with migration guidance
- Major version bumps once the project reaches `1.0` (currently in `0.x`, so minor bumps may include breaking changes)

## Worker APIs

Monaco Editor ships 4 language service workers, each running in a Web Worker:

| Worker                | Package                        | API stability                                                                                                      |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| TypeScript/JavaScript | Built-in (bundled TS compiler) | **Stable**: `typescript.typescriptDefaults`, `typescript.javascriptDefaults`, diagnostic options, compiler options |
| CSS/LESS/SCSS         | `vscode-css-languageservice`   | **Stable**: `css.cssDefaults`, `css.lessDefaults`, `css.scssDefaults`, diagnostic/formatting options               |
| HTML                  | `vscode-html-languageservice`  | **Stable**: `html.htmlDefaults`, `html.handlebarDefaults`, `html.razorDefaults`, formatting options                |
| JSON                  | `vscode-json-languageservice`  | **Stable**: `json.jsonDefaults`, schema association, diagnostic options                                            |

The `*Defaults` configuration objects and their `setDiagnosticsOptions`, `setCompilerOptions` (TypeScript), and similar methods are stable public API.

**Unstable worker internals:**

- The `createWorker` functions and the `WorkerManager` class
- The message protocol between main thread and worker
- The `*Worker` classes that wrap the underlying language service
- Direct access to the language service instances within workers
