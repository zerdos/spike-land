/**
 * Core obamify algorithm — genetic pixel-swap optimiser.
 *
 * Given a source image and a target image of equal dimensions, the algorithm
 * rearranges source pixels (without duplication or omission) so that the
 * result best approximates the target according to the heuristic cost
 * function in `heuristic.ts`.
 *
 * The outer loop is a simulated-annealing–style greedy swap:
 *
 *   For each iteration:
 *     Try (swapsPerPixel * totalPixels) random candidate swaps.
 *     For each candidate: pick random dest A, pick random dest B within
 *     maxDist of A.  Compute the delta cost of swapping their assigned source
 *     pixels.  Accept if delta > 0 (improvement).
 *   Decay maxDist by maxDistDecay after each iteration.
 *   Terminate when maxDist < 4 and fewer than 10 swaps were made that round.
 *
 * Performance notes:
 *   - All pixel data lives in flat Uint8ClampedArray / Uint32Array buffers.
 *   - No per-iteration object allocation in the hot path.
 *   - A fast xorshift32 PRNG replaces Math.random().
 *   - Cached per-assignment costs avoid recomputing unchanged positions.
 */

import { computeCost } from "./heuristic.js";
import type { ObamifyConfig } from "./types.js";

// ---------------------------------------------------------------------------
// Constants & defaults
// ---------------------------------------------------------------------------

const DEFAULT_SWAPS_PER_PIXEL = 128;
const DEFAULT_PROXIMITY_IMPORTANCE = 13;
const DEFAULT_MAX_DIST_DECAY = 0.99;
const DEFAULT_PROGRESS_INTERVAL = 1;
const TERMINATION_MIN_SWAPS = 10;
const TERMINATION_MIN_MAX_DIST = 4;

// ---------------------------------------------------------------------------
// xorshift32 PRNG
// ---------------------------------------------------------------------------

/**
 * A minimal, fast xorshift32 PRNG.  Returns values in [0, 2^32).
 * Initialise `state` to any non-zero 32-bit unsigned integer.
 */
function xorshift32(state: Uint32Array): number {
  let x = state[0] ?? 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  state[0] = x >>> 0;
  return state[0] ?? 0;
}

// ---------------------------------------------------------------------------
// Main algorithm
// ---------------------------------------------------------------------------

/**
 * Run the obamify pixel-swap algorithm synchronously.
 *
 * @param sourcePixels  - RGBA flat array for the source image.
 * @param targetPixels  - RGBA flat array for the target image (same size).
 * @param weightsPixels - RGBA flat array for the weights mask (same size).
 * @param width         - Image width (= height; assumed square).
 * @param height        - Image height.
 * @param config        - Optional tuning parameters.
 * @param onProgress    - Called after each iteration with (iteration, swapsMade, maxDist, assignments).
 * @returns Uint32Array of length (width*height) mapping dest index → src index.
 */
export function obamify(
  sourcePixels: Uint8ClampedArray,
  targetPixels: Uint8ClampedArray,
  weightsPixels: Uint8ClampedArray,
  width: number,
  height: number,
  config?: ObamifyConfig,
  onProgress?: (
    iteration: number,
    swapsMade: number,
    maxDist: number,
    assignments: Uint32Array,
  ) => void,
): Uint32Array {
  const swapsPerPixel = config?.swapsPerPixel ?? DEFAULT_SWAPS_PER_PIXEL;
  const proximityImportance = config?.proximityImportance ?? DEFAULT_PROXIMITY_IMPORTANCE;
  const maxDistDecay = config?.maxDistDecay ?? DEFAULT_MAX_DIST_DECAY;
  const progressInterval = config?.progressInterval ?? DEFAULT_PROGRESS_INTERVAL;

  const totalPixels = width * height;

  // assignments[destIdx] = srcIdx
  const assignments = new Uint32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) assignments[i] = i;

  // Cached costs: cost[destIdx] = heuristic cost of current assignment at destIdx.
  const costs = new Float64Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    costs[i] = computeCost(
      assignments[i] ?? i,
      i,
      sourcePixels,
      targetPixels,
      weightsPixels,
      width,
      proximityImportance,
    );
  }

  // PRNG state (non-zero seed).
  const prngState = new Uint32Array([0xdeadbeef]);

  let maxDist = width; // INITIAL_MAX_DIST = sidelen
  let iteration = 0;
  const attemptsPerIteration = swapsPerPixel * totalPixels;

  while (true) {
    let swapsMade = 0;
    const iMaxDist = Math.ceil(maxDist);

    for (let attempt = 0; attempt < attemptsPerIteration; attempt++) {
      // Pick random destination A.
      const a = (xorshift32(prngState) % totalPixels) >>> 0;
      const ax = a % width;
      const ay = (a / width) | 0;

      // Pick a random offset within [−maxDist, +maxDist] for both axes.
      // We use rejection-free modular arithmetic: map the raw random value to
      // the window size, then offset.
      const windowSize = (iMaxDist * 2 + 1) | 0;
      const bx = ax - iMaxDist + ((xorshift32(prngState) % windowSize) >>> 0);
      const by = ay - iMaxDist + ((xorshift32(prngState) % windowSize) >>> 0);

      // Clamp to image bounds.
      if (bx < 0 || bx >= width || by < 0 || by >= height) continue;
      const b = by * width + bx;
      if (a === b) continue;

      const srcA = assignments[a] ?? a;
      const srcB = assignments[b] ?? b;

      // Current costs (already cached).
      const costA = costs[a] ?? 0;
      const costB = costs[b] ?? 0;

      // Hypothetical costs after swap.
      const newCostA = computeCost(
        srcB,
        a,
        sourcePixels,
        targetPixels,
        weightsPixels,
        width,
        proximityImportance,
      );
      const newCostB = computeCost(
        srcA,
        b,
        sourcePixels,
        targetPixels,
        weightsPixels,
        width,
        proximityImportance,
      );

      // Accept if swap reduces total cost (greedy).
      if (costA + costB - (newCostA + newCostB) > 0) {
        assignments[a] = srcB;
        assignments[b] = srcA;
        costs[a] = newCostA;
        costs[b] = newCostB;
        swapsMade++;
      }
    }

    iteration++;
    maxDist *= maxDistDecay;

    if (iteration % progressInterval === 0 && onProgress) {
      // Clone the array so the caller owns a stable snapshot.
      onProgress(iteration, swapsMade, maxDist, assignments.slice());
    }

    // Termination: radius has shrunk below threshold and almost no improvement.
    if (maxDist < TERMINATION_MIN_MAX_DIST && swapsMade < TERMINATION_MIN_SWAPS) {
      break;
    }
  }

  return assignments;
}

// ---------------------------------------------------------------------------
// Result renderer
// ---------------------------------------------------------------------------

/**
 * Apply the computed assignment to produce an output ImageData.
 *
 * Each output pixel at index `i` is filled with the source pixel at
 * `assignments[i]`, producing the obamified image.
 *
 * @param sourcePixels - RGBA flat array of the original source image.
 * @param assignments  - Mapping produced by {@link obamify}.
 * @param width        - Image width in pixels.
 * @param height       - Image height in pixels.
 * @returns A new ImageData with the rearranged pixels.
 */
export function renderResult(
  sourcePixels: Uint8ClampedArray,
  assignments: Uint32Array,
  width: number,
  height: number,
): ImageData {
  const output = new Uint8ClampedArray(width * height * 4);

  for (let destIdx = 0; destIdx < assignments.length; destIdx++) {
    const srcIdx = assignments[destIdx] ?? destIdx;
    const s = srcIdx * 4;
    const d = destIdx * 4;
    output[d] = sourcePixels[s] ?? 0;
    output[d + 1] = sourcePixels[s + 1] ?? 0;
    output[d + 2] = sourcePixels[s + 2] ?? 0;
    output[d + 3] = sourcePixels[s + 3] ?? 0;
  }

  return new ImageData(output, width, height);
}
