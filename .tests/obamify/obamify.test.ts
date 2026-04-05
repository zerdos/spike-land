import { describe, it, expect } from "vitest";
import { obamify, renderResult } from "../../src/core/obamify/core-logic/obamify.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a flat RGBA Uint8ClampedArray for an image of `size x size` pixels.
 * The fill function receives the linear pixel index and returns [r,g,b,a].
 */
function makeImage(
  size: number,
  fill: (idx: number) => [number, number, number, number],
): Uint8ClampedArray {
  const arr = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const [r, g, b, a] = fill(i);
    arr[i * 4] = r;
    arr[i * 4 + 1] = g;
    arr[i * 4 + 2] = b;
    arr[i * 4 + 3] = a;
  }
  return arr;
}

/** Uniform-colour helpers. */
const red = (sz: number): Uint8ClampedArray => makeImage(sz, () => [255, 0, 0, 255]);
const blue = (sz: number): Uint8ClampedArray => makeImage(sz, () => [0, 0, 255, 255]);
const whiteMask = (sz: number): Uint8ClampedArray => makeImage(sz, () => [255, 255, 255, 255]);
const blackMask = (sz: number): Uint8ClampedArray => makeImage(sz, () => [0, 0, 0, 255]);

// ---------------------------------------------------------------------------
// obamify()
// ---------------------------------------------------------------------------

describe("obamify", () => {
  it("returns a Uint32Array of length width*height", () => {
    const SIZE = 4;
    const result = obamify(red(SIZE), red(SIZE), whiteMask(SIZE), SIZE, SIZE);
    expect(result).toBeInstanceOf(Uint32Array);
    expect(result.length).toBe(SIZE * SIZE);
  });

  it("is a permutation: every source index appears exactly once", () => {
    const SIZE = 4;
    const assignments = obamify(red(SIZE), blue(SIZE), whiteMask(SIZE), SIZE, SIZE);
    const counts = new Uint32Array(SIZE * SIZE);
    for (let i = 0; i < assignments.length; i++) {
      counts[assignments[i]]++;
    }
    for (let i = 0; i < counts.length; i++) {
      expect(counts[i]).toBe(1);
    }
  });

  it("identity-maps when source and target are identical with zero-weight mask", () => {
    // With weight=0 there is no colour penalty, only spatial.
    // Starting from identity the total cost is already 0, so no swaps occur.
    const SIZE = 4;
    const src = makeImage(SIZE, (i) => [(i * 7) % 256, (i * 13) % 256, (i * 31) % 256, 255]);
    const assignments = obamify(src, src, blackMask(SIZE), SIZE, SIZE);
    for (let i = 0; i < assignments.length; i++) {
      expect(assignments[i]).toBe(i);
    }
  });

  it("calls onProgress with iteration >= 1 and valid maxDist", () => {
    const SIZE = 4;
    const progressCalls: Array<{ iteration: number; swapsMade: number; maxDist: number }> = [];

    obamify(
      red(SIZE),
      blue(SIZE),
      whiteMask(SIZE),
      SIZE,
      SIZE,
      { progressInterval: 1 },
      (iteration, swapsMade, maxDist) => {
        progressCalls.push({ iteration, swapsMade, maxDist });
      },
    );

    expect(progressCalls.length).toBeGreaterThan(0);
    for (const call of progressCalls) {
      expect(call.iteration).toBeGreaterThan(0);
      expect(call.maxDist).toBeGreaterThan(0);
      expect(call.swapsMade).toBeGreaterThanOrEqual(0);
    }
  });

  it("terminates when source equals target (no improvements needed)", () => {
    // Trivially optimal — should not hang.
    const SIZE = 8;
    const src = makeImage(SIZE, (i) => [(i * 3) % 256, (i * 7) % 256, (i * 11) % 256, 255]);
    expect(() => obamify(src, src, whiteMask(SIZE), SIZE, SIZE)).not.toThrow();
  });

  it("respects progressInterval: only emits every N iterations", () => {
    const SIZE = 4;
    const INTERVAL = 3;
    const receivedIterations: number[] = [];

    obamify(
      red(SIZE),
      blue(SIZE),
      whiteMask(SIZE),
      SIZE,
      SIZE,
      { progressInterval: INTERVAL },
      (iteration) => {
        receivedIterations.push(iteration);
      },
    );

    for (const iter of receivedIterations) {
      expect(iter % INTERVAL).toBe(0);
    }
  });

  it("accepts custom config parameters without throwing", () => {
    const SIZE = 4;
    expect(() =>
      obamify(red(SIZE), blue(SIZE), whiteMask(SIZE), SIZE, SIZE, {
        swapsPerPixel: 4,
        proximityImportance: 5,
        maxDistDecay: 0.95,
        progressInterval: 2,
      }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// renderResult()
// ---------------------------------------------------------------------------

describe("renderResult", () => {
  it("produces an ImageData of the correct dimensions", () => {
    const SIZE = 4;
    const src = red(SIZE);
    const assignments = new Uint32Array(SIZE * SIZE);
    for (let i = 0; i < assignments.length; i++) assignments[i] = i;

    const img = renderResult(src, assignments, SIZE, SIZE);
    expect(img.width).toBe(SIZE);
    expect(img.height).toBe(SIZE);
    expect(img.data.length).toBe(SIZE * SIZE * 4);
  });

  it("copies pixels according to the assignment mapping", () => {
    // 2-pixel image: assign dest[0] ← src[1] and dest[1] ← src[0] (swap).
    const src = makeImage(2, (i) => (i === 0 ? [255, 0, 0, 255] : [0, 0, 255, 255]));
    const assignments = new Uint32Array([1, 0]); // swap

    const img = renderResult(src, assignments, 2, 1);

    // dest[0] should be blue (was src[1])
    expect(img.data[0]).toBe(0); // r
    expect(img.data[2]).toBe(255); // b
    // dest[1] should be red (was src[0])
    expect(img.data[4]).toBe(255); // r
    expect(img.data[6]).toBe(0); // b
  });

  it("identity assignment reproduces the source image exactly", () => {
    const SIZE = 4;
    const src = makeImage(SIZE, (i) => [(i * 17) % 256, (i * 37) % 256, (i * 53) % 256, 255]);
    const assignments = new Uint32Array(SIZE * SIZE);
    for (let i = 0; i < assignments.length; i++) assignments[i] = i;

    const img = renderResult(src, assignments, SIZE, SIZE);
    expect(Array.from(img.data)).toEqual(Array.from(src));
  });
});
