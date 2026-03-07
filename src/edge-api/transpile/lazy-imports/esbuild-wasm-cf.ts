// Worker-compatible WASM import (no Vite ?url suffix).
// Wrangler's CompiledWasm rule handles .wasm files directly.
import wasmModule from "esbuild-wasm/esbuild.wasm";
export const wasmFile = "esbuild.wasm"; // placeholder string, unused in worker context
export { wasmModule };
