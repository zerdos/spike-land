/**
 * Public API for the obamify pixel-swap algorithm.
 *
 * ## Quick start (synchronous, main thread)
 *
 * ```ts
 * import { obamify, renderResult } from "@spike-land-ai/core/obamify";
 *
 * const assignments = obamify(
 *   source.data, target.data, weights.data,
 *   256, 256,
 *   { swapsPerPixel: 64 },
 * );
 * const output = renderResult(source.data, assignments, 256, 256);
 * ctx.putImageData(output, 0, 0);
 * ```
 *
 * ## Quick start (Web Worker)
 *
 * ```ts
 * import { createObamifyWorker } from "@spike-land-ai/core/obamify";
 *
 * const worker = createObamifyWorker();
 * worker.onmessage = (e) => {
 *   if (e.data.kind === "done") {
 *     const output = renderResult(source.data, e.data.assignments, 256, 256);
 *     ctx.putImageData(output, 0, 0);
 *   }
 * };
 * worker.postMessage({ kind: "start", sourceImageData, targetImageData, weightsImageData });
 * ```
 *
 * ## Notes on target / weights images
 *
 * The algorithm is image-agnostic.  Callers are responsible for loading and
 * providing the target (e.g. Obama's face at 256×256) and the weights mask.
 * A suitable weights mask is a grayscale image where brighter pixels (higher
 * weight) indicate regions that must match colour more precisely (e.g. the
 * face area) and darker pixels allow more spatial displacement.
 */

export { obamify, renderResult } from "./obamify.js";
export type { ObamifyConfig, Pixel, WorkerInMessage, WorkerOutMessage } from "./types.js";

// ---------------------------------------------------------------------------
// Worker factory
// ---------------------------------------------------------------------------

/**
 * Instantiate the obamify Web Worker.
 *
 * The worker module (`./worker.ts`) is resolved relative to this file at
 * bundle time via `import.meta.url`, which is supported by Vite and most
 * modern bundlers.
 *
 * @returns A `Worker` instance ready to accept `WorkerInMessage` messages.
 */
export function createObamifyWorker(): Worker {
  return new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
}
