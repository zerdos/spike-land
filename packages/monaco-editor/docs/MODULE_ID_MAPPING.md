# Module ID Mapping

How Monaco Editor remaps module IDs during the build, and why.

## Why Module ID Remapping Exists

Monaco Editor is extracted from VS Code, which historically uses an AMD module system where all modules live under the `vs/` namespace. The editor core is published as `monaco-editor-core` (an npm package built from VS Code), while this repository adds languages, workers, and features on top.

The build must reconcile three different module path conventions:

1. **Source paths** (`src/languages/...`, `src/features/...`) -- this repo's code
2. **Core paths** (`node_modules/monaco-editor-core/esm/vs/...`) -- the editor core
3. **External dependencies** (`node_modules/vscode-css-languageservice/...`, etc.)

All of these need to be flattened into a coherent output structure where everything appears under a unified namespace. The module ID mapping system in `build/shared.mjs` handles this transformation.

## The Mapping Transforms

The mappings are defined in `build/shared.mjs` (lines 98-104) as a `mappedPaths` object. Each entry maps an absolute filesystem prefix to an output prefix. Entries are matched in order -- the first matching prefix wins.

### ESM Mappings (`mapModuleId`)

| Source prefix                          | Output prefix                 | Purpose                                                |
| -------------------------------------- | ----------------------------- | ------------------------------------------------------ |
| `node_modules/monaco-editor-core/esm/` | `.` (root)                    | Flatten core editor modules to the output root         |
| `node_modules/`                        | `external/`                   | Namespace all other npm dependencies under `external/` |
| `monaco-lsp-client/`                   | `external/monaco-lsp-client/` | LSP client treated as external                         |
| `src/deprecated/`                      | `vs/`                         | Legacy entry points keep the `vs/` prefix              |
| `src/`                                 | `vs/`                         | This repo's source maps to `vs/` namespace             |

### AMD Mappings (`mapModuleIdAmd`)

The AMD build (lines 131-137) uses slightly different mappings:

| Source prefix                          | Output prefix                 | Purpose                                                                     |
| -------------------------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| `node_modules/monaco-editor-core/esm/` | `.` (root)                    | Same as ESM                                                                 |
| `node_modules/`                        | `external/`                   | Same as ESM                                                                 |
| `monaco-lsp-client/`                   | `external/monaco-lsp-client/` | Same as ESM                                                                 |
| `src/deprecated/`                      | `.` (root)                    | Maps to root, not `vs/` -- the AMD `basePath: 'vs'` setting adds the prefix |
| `src/`                                 | `.` (root)                    | Maps to root -- AMD `basePath` handles the `vs/` prefix                     |

The difference exists because the AMD build (via Vite) sets `amd.basePath: 'vs'` with `autoId: true`, which automatically prepends `vs/` to all AMD module IDs. So the mapping only needs to produce the path relative to that base.

### Concrete Examples

```
# ESM transforms (mapModuleId):
src/languages/definitions/css/css.ts
  → vs/languages/definitions/css/css.js

node_modules/monaco-editor-core/esm/vs/editor/editor.api.js
  → vs/editor/editor.api.js

node_modules/vscode-css-languageservice/lib/esm/cssLanguageService.js
  → external/vscode-css-languageservice/lib/esm/cssLanguageService.js

src/deprecated/editor/editor.main.ts
  → vs/editor/editor.main.js

# AMD transforms (mapModuleIdAmd):
src/languages/definitions/css/css.ts
  → languages/definitions/css/css.js    (Vite adds vs/ prefix → vs/languages/definitions/css/css)

src/deprecated/editor/editor.main.ts
  → editor/editor.main.js               (Vite adds vs/ prefix → vs/editor/editor.main)
```

## Entry Points

Entry points are defined by `getEntryPoints()` in `build/shared.mjs` (line 67). The function builds a map of logical names to absolute file paths:

- **`editor`** -- `src/editor.ts` (re-exports the core API from `monaco-editor-core`)
- **`index`** -- `src/index.ts` (main entry: all languages + features + LSP)
- **Feature registrations** -- all files matching `src/**/register.*` (when `includeFeatures=true`)
- **Deprecated entry points** -- files under `src/deprecated/` (for backwards compatibility)

These entry points become the inputs to both the Rollup (ESM) and Vite (AMD) builds. The `package.json` `exports` field maps them to the built output:

```json
{
	".": {
		"types": "./esm/vs/index.d.ts",
		"import": "./esm/vs/index.js",
		"require": "./min/vs/index.js"
	},
	"./*.js": "./esm/vs/*.js",
	"./*": "./esm/vs/*.js"
}
```

## Build Pipeline Integration

### ESM Build (Rollup)

In `build/esm/rollup.config.mjs`, the Rollup config uses `mapModuleId` in two places:

1. **`entryFileNames`** (line 31-39) -- determines the output filename for each entry chunk by passing `chunkInfo.facadeModuleId` through `mapModuleId`.
2. **`keepCssImports` plugin** (line 77-89) -- maps CSS asset paths to their output location using the same `mapModuleId` function.

The build uses `preserveModules: true` so each source file produces a corresponding output file (no bundling), and the module ID mapping controls where each file lands in `out/monaco-editor/esm/`.

### AMD Build (Vite)

In `build/amd/vite.config.mjs`, the Vite config uses `mapModuleIdAmd` in the `lib.fileName` function (line 29-38). Combined with the `amd.basePath: 'vs'` and `autoId: true` settings, this produces AMD modules with `vs/`-prefixed IDs in `out/monaco-editor/min/vs/` (production) or `out/monaco-editor/dev/vs/` (development).

### Types Build

Both ESM and AMD pipelines run a separate `rollup-types.config.mjs` to generate `.d.ts` files. The main orchestrator (`build/build-monaco-editor.ts`) copies the AMD types output to `out/monaco-editor/monaco.d.ts` and appends a global `monaco` namespace declaration.

## How to Add a New Entry Point

1. **Create the source file** under `src/`. For a new feature registration, follow the pattern `src/features/myFeature/register.ts` or `src/languages/definitions/mylang/mylang.contribution.ts`.

2. **If it's a feature registration** (`register.*` pattern), it will be picked up automatically by `getEntryPoints(true)` via the glob `./src/**/register.*`.

3. **If it's a standalone entry point**, add it explicitly in `getEntryPoints()` in `build/shared.mjs`:

   ```js
   const result = {
   	...features,
   	editor: join(root, 'src/editor.ts'),
   	index: join(root, './src/index.ts'),
   	myNewEntry: join(root, 'src/myNewEntry.ts'), // add here
   	...deprecatedEntryPoints
   };
   ```

4. **Verify the output path.** Run the build and check that your new entry point appears at the expected location in `out/monaco-editor/esm/`. The `src/` prefix maps to `vs/`, so `src/myNewEntry.ts` becomes `esm/vs/myNewEntry.js`.

5. **If consumers need to import it directly**, add an entry to the `exports` field in `package.json`. The existing wildcard `"./*": "./esm/vs/*.js"` handles most cases automatically.
