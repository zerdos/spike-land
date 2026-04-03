/**
 * Web Worker entry point for the obamify algorithm.
 *
 * This file is intended to be bundled as a separate chunk and instantiated via
 * `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`.
 *
 * ## Message protocol
 *
 * ### Inbound (host → worker)
 * ```ts
 * { kind: "start", sourceImageData, targetImageData, weightsImageData, config? }
 * { kind: "stop" }
 * ```
 *
 * ### Outbound (worker → host)
 * ```ts
 * { kind: "progress", iteration, swapsMade, maxDist, assignments }  // Transferable
 * { kind: "done", assignments, iterations }                          // Transferable
 * { kind: "error", message }
 * ```
 *
 * The `assignments` Uint32Array is transferred (zero-copy) with each outbound
 * message.  The host must either consume it synchronously or clone it before
 * the next message arrives.
 */

import { obamify } from "./obamify.js";
import type { WorkerInMessage, WorkerOutMessage } from "./types.js";

// ---------------------------------------------------------------------------
// Cancellation token
// ---------------------------------------------------------------------------

/** Set to true when the host sends { kind: "stop" }. */
let cancelled = false;

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;

  if (msg.kind === "stop") {
    cancelled = true;
    return;
  }

  if (msg.kind === "start") {
    cancelled = false;
    runAlgorithm(msg);
    return;
  }
};

// ---------------------------------------------------------------------------
// Algorithm runner
// ---------------------------------------------------------------------------

function runAlgorithm(msg: Extract<WorkerInMessage, { kind: "start" }>): void {
  const { sourceImageData, targetImageData, weightsImageData, config } = msg;

  // Validate dimensions.
  if (
    sourceImageData.width !== targetImageData.width ||
    sourceImageData.height !== targetImageData.height ||
    sourceImageData.width !== weightsImageData.width ||
    sourceImageData.height !== weightsImageData.height
  ) {
    const outErr: WorkerOutMessage = {
      kind: "error",
      message:
        `Dimension mismatch: source ${sourceImageData.width}x${sourceImageData.height}, ` +
        `target ${targetImageData.width}x${targetImageData.height}, ` +
        `weights ${weightsImageData.width}x${weightsImageData.height}. ` +
        `All three images must have identical dimensions.`,
    };
    self.postMessage(outErr);
    return;
  }

  const width = sourceImageData.width;
  const height = sourceImageData.height;

  let iterationCount = 0;

  try {
    const assignments = obamify(
      sourceImageData.data,
      targetImageData.data,
      weightsImageData.data,
      width,
      height,
      config,
      (iteration, swapsMade, maxDist, snapshot) => {
        iterationCount = iteration;

        if (cancelled) return;

        const progressMsg: WorkerOutMessage = {
          kind: "progress",
          iteration,
          swapsMade,
          maxDist,
          assignments: snapshot,
        };
        // Transfer the snapshot buffer for zero-copy delivery.
        self.postMessage(progressMsg, { transfer: [snapshot.buffer as ArrayBuffer] });
      },
    );

    if (cancelled) return;

    const doneMsg: WorkerOutMessage = {
      kind: "done",
      assignments,
      iterations: iterationCount,
    };
    self.postMessage(doneMsg, { transfer: [assignments.buffer as ArrayBuffer] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errMsg: WorkerOutMessage = { kind: "error", message };
    self.postMessage(errMsg);
  }
}
