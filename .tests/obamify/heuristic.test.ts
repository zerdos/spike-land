import { describe, it, expect } from "vitest";
import { computeCost } from "../../src/core/obamify/core-logic/heuristic.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a flat RGBA Uint8ClampedArray from an array of [r,g,b,a] tuples. */
function makePixels(pixels: [number, number, number, number][]): Uint8ClampedArray {
  const arr = new Uint8ClampedArray(pixels.length * 4);
  for (let i = 0; i < pixels.length; i++) {
    arr[i * 4] = pixels[i][0];
    arr[i * 4 + 1] = pixels[i][1];
    arr[i * 4 + 2] = pixels[i][2];
    arr[i * 4 + 3] = pixels[i][3];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("computeCost", () => {
  const PROXIMITY = 13;

  it("returns zero when source pixel perfectly matches target at its origin", () => {
    // 1x1 image: srcIdx === destIdx === 0, same colour, weight = 255
    const src = makePixels([[100, 150, 200, 255]]);
    const tgt = makePixels([[100, 150, 200, 255]]);
    const wgt = makePixels([[255, 255, 255, 255]]);

    const cost = computeCost(0, 0, src, tgt, wgt, 1, PROXIMITY);
    expect(cost).toBe(0);
  });

  it("is dominated by colour distance when spatial offset is zero", () => {
    // 1x1: same position so no spatial cost; pure colour mismatch.
    const src = makePixels([[255, 0, 0, 255]]);
    const tgt = makePixels([[0, 0, 0, 255]]);
    const wgt = makePixels([[1, 0, 0, 0]]); // weight = 1

    // colorDistSq = 255^2 = 65025; weight = 1 → colour term = 65025
    // spatialDistSq = 0 → spatial term = 0
    const cost = computeCost(0, 0, src, tgt, wgt, 1, PROXIMITY);
    expect(cost).toBe(65025);
  });

  it("scales the colour term by the weight channel", () => {
    const src = makePixels([[255, 0, 0, 255]]);
    const tgt = makePixels([[0, 0, 0, 255]]);

    const wgt0 = makePixels([[0, 0, 0, 0]]); // weight = 0 → no colour penalty
    const wgt255 = makePixels([[255, 0, 0, 0]]); // weight = 255

    const costNoWeight = computeCost(0, 0, src, tgt, wgt0, 1, PROXIMITY);
    const costFullWeight = computeCost(0, 0, src, tgt, wgt255, 1, PROXIMITY);

    expect(costNoWeight).toBe(0);
    expect(costFullWeight).toBe(255 * 255 * 255); // 65025 * 255
  });

  it("incurs spatial penalty when source pixel is displaced from destination", () => {
    // 2x1 image (width=2): srcIdx=0 (x=0), destIdx=1 (x=1)
    // spatialDistSq = (0-1)^2 + (0-0)^2 = 1
    // spatialTerm = (1 * 13)^2 = 169; weight=0 so colour term = 0
    const src = makePixels([
      [100, 100, 100, 255],
      [100, 100, 100, 255],
    ]);
    const tgt = makePixels([
      [100, 100, 100, 255],
      [100, 100, 100, 255],
    ]);
    const wgt = makePixels([
      [0, 0, 0, 255],
      [0, 0, 0, 255],
    ]);

    const cost = computeCost(0, 1, src, tgt, wgt, 2, PROXIMITY);
    // spatialDistSq = 1; term = (1 * 13)^2 = 169
    expect(cost).toBe(169);
  });

  it("combines colour and spatial penalties correctly", () => {
    // 2x1 (width=2): srcIdx=0 (x=0), destIdx=1 (x=1)
    // dr=10, dg=0, db=0 → colorDistSq=100; weight=2 → colourTerm=200
    // spatialDistSq=1 → spatialTerm=(1*13)^2=169
    const src = makePixels([
      [110, 0, 0, 255],
      [0, 0, 0, 255],
    ]);
    const tgt = makePixels([
      [0, 0, 0, 255],
      [100, 0, 0, 255],
    ]);
    const wgt = makePixels([
      [2, 0, 0, 255],
      [2, 0, 0, 255],
    ]);

    const cost = computeCost(0, 1, src, tgt, wgt, 2, PROXIMITY);
    // colourTerm: (110-100)^2 = 100 * 2 = 200
    // spatialTerm: (0-1)^2=1 → (1*13)^2 = 169
    expect(cost).toBe(200 + 169);
  });
});
