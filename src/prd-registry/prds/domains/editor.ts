import type { PrdDefinition } from "../../core-logic/types.js";

export const editorDomain: PrdDefinition = {
  id: "domain:editor",
  level: "domain",
  name: "Monaco Editor",
  summary:
    "Monaco editor domain with HMR, live preview panel, esbuild-wasm transpilation, auto-save, and worker-based compilation",
  purpose:
    "Core editing domain powering all code surfaces (vibe-code, create, app editor). Monaco wired to a Web Worker running esbuild-wasm for TypeScript transpilation. HMR patches the preview iframe. Auto-save persists to codespace with 500ms debounce.",
  constraints: [
    "All transpilation runs in a dedicated Web Worker — never on the main thread",
    "esbuild-wasm bundle is loaded once and reused across all editor instances on the page",
    "Auto-save debounce is 500ms; flush on page unload",
    "HMR must fall back to full iframe reload if patch cannot be applied cleanly",
    "TypeScript diagnostics piped from esbuild into Monaco markers within 200ms of change",
    "Codespace writes are scoped to authenticated user — no cross-user file access",
  ],
  acceptance: [
    "Saving a file triggers a live preview update within 500ms",
    "TypeScript errors appear as inline markers in the editor without manual save",
    "Worker-based compilation does not block editor typing responsiveness",
    "HMR successfully patches a React component state update without full reload",
    "Auto-save fires within 600ms of last keystroke and persists to codespace",
  ],
  toolCategories: ["codespace", "esbuild", "filesystem", "hmr"],
  tools: [
    "codespace_read_file",
    "codespace_write_file",
    "codespace_list_files",
    "esbuild_transpile",
    "hmr_patch",
    "preview_reload",
  ],
  composesFrom: ["platform", "domain:app-building"],
  routePatterns: [],
  keywords: [
    "editor",
    "monaco",
    "hmr",
    "live-preview",
    "transpile",
    "esbuild",
    "auto-save",
    "worker",
    "typescript",
    "codespace",
    "split-pane",
  ],
  tokenEstimate: 270,
  version: "1.0.0",
};
