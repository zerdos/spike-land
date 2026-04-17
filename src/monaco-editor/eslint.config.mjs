// @ts-check
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Disallow bare `any` for new code — use `unknown`, type guards, or
      // proper types instead. Per BUG-S6-06 (BUGBOOK_SPRINT6).
      // Vendored Microsoft monaco-editor sources retain warn-only via the
      // overrides block below (tracked under BUG-S6-07 — acceptable debt).
      "@typescript-eslint/no-explicit-any": "error",
      // NOTE (BUG-S6-06): `@typescript-eslint/no-unnecessary-type-assertion`
      // is intentionally NOT enabled here — it requires typed linting
      // (`parserOptions.project: true`) which is not configured in this
      // workspace. Enabling it without type info causes the rule to throw at
      // load time. Re-enable as `error` together with typed linting in a
      // follow-up bug entry.
      // Catch unused variables (common source of bugs)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // Prefer `const` for variables that are never reassigned
      "prefer-const": "warn",
      // Allow Node.js globals
      "no-undef": "off",
    },
  },

  // Vendored Microsoft monaco-editor sources (Copyright Microsoft Corporation,
  // MIT). These mirror upstream microsoft/monaco-editor and must stay in sync
  // with the upstream repo, so we don't modify them locally. Tracked under
  // BUG-S6-07 (vendored debt, marked acceptable). Keep `no-explicit-any` at
  // warn so violations surface in lint output but do not break CI for new
  // code added under the rule's stricter `error` level above.
  // TODO(BUG-S6-07): remove entries from this list when the corresponding
  // vendored file is rewritten or upstream replaces the `any` casts.
  {
    files: [
      "src/languages/definitions/typescript/register.ts",
      "src/languages/features/css/cssWorker.ts",
      "src/languages/features/html/htmlWorker.ts",
      "src/languages/features/typescript/languageFeatures.ts",
      "src/languages/features/typescript/tsWorker.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // JavaScript/MJS build files
  {
    files: ["**/*.mjs", "**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "prefer-const": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  // Ignore generated and vendored directories
  {
    ignores: [
      "out/**",
      "node_modules/**",
      "src/language/typescript/lib/**",
      "website/**",
      "samples/**/node_modules/**",
      "test/smoke/out/**",
      // Vendored copy of the `rollup-plugin-keep-css-imports` npm package
      // (build/esm/rollup-plugin-keep-css-imports/package.json present).
      // Contains pre-compiled `.d.ts` and `.mjs` files we don't author.
      "build/esm/rollup-plugin-keep-css-imports/**",
    ],
  },
];
