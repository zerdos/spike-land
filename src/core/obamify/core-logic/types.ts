/**
 * Shared types for the obamify pixel-swap algorithm.
 *
 * The algorithm rearranges pixels from a source image so that, when rendered at
 * destination positions, the result approximates a target image.  An
 * `assignments` Uint32Array of length `width * height` maps each destination
 * pixel index to the source pixel index that should be placed there.
 */

// ---------------------------------------------------------------------------
// Pixel representation
// ---------------------------------------------------------------------------

/**
 * A single pixel with its colour channels and its *original* position in the
 * source image.  The `cost` field caches the heuristic value at the pixel's
 * current assignment so we avoid recomputing it from scratch inside the hot
 * path.
 */
export interface Pixel {
  /** Red channel, 0-255. */
  r: number;
  /** Green channel, 0-255. */
  g: number;
  /** Blue channel, 0-255. */
  b: number;
  /** Original column in the source image. */
  srcX: number;
  /** Original row in the source image. */
  srcY: number;
  /** Cached heuristic cost for the pixel's current assignment. */
  cost: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Tunable parameters for the obamify algorithm.  All fields are optional;
 * defaults match the reference Rust implementation.
 */
export interface ObamifyConfig {
  /**
   * Number of attempted swaps per pixel per iteration.
   * @default 128
   */
  swapsPerPixel?: number;

  /**
   * Controls how strongly spatial distance penalises the cost function.
   * Higher values keep pixels closer to their origin.
   * @default 13
   */
  proximityImportance?: number;

  /**
   * Multiplicative decay applied to `maxDist` after each iteration.
   * @default 0.99
   */
  maxDistDecay?: number;

  /**
   * Emit a progress message every this many iterations.
   * @default 1
   */
  progressInterval?: number;
}

// ---------------------------------------------------------------------------
// Worker message protocol
// ---------------------------------------------------------------------------

/** Messages sent *to* the worker. */
export type WorkerInMessage =
  | {
      kind: "start";
      sourceImageData: ImageData;
      targetImageData: ImageData;
      weightsImageData: ImageData;
      config?: ObamifyConfig;
    }
  | { kind: "stop" };

/** Messages sent *from* the worker. */
export type WorkerOutMessage =
  | {
      kind: "progress";
      iteration: number;
      swapsMade: number;
      maxDist: number;
      /**
       * Transferable zero-copy snapshot of the current assignment array.
       * The caller must transfer ownership back (or clone) before the next
       * progress event arrives.
       */
      assignments: Uint32Array;
    }
  | {
      kind: "done";
      assignments: Uint32Array;
      iterations: number;
    }
  | {
      kind: "error";
      message: string;
    };
