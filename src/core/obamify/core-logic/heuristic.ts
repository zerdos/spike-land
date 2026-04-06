/**
 * Heuristic (cost) function for the obamify pixel-swap algorithm.
 *
 * For a given destination index `destIdx`, this computes how poorly the
 * currently assigned source pixel matches the target:
 *
 *   cost = colorDistanceSq * weight
 *        + (spatialDistanceSq * proximityImportance)^2
 *
 * where:
 *   colorDistanceSq  = (rs-rt)^2 + (gs-gt)^2 + (bs-bt)^2
 *   spatialDistanceSq = (srcX-destX)^2 + (srcY-destY)^2
 *   weight           = weightsPixels[destIdx * 4]   (0-255 grayscale)
 *
 * All heavy arithmetic is kept in flat-array arithmetic with no object
 * allocation so it survives tree-shaking and JIT optimisation.
 */

/**
 * Compute the heuristic cost for one (source, destination) pairing.
 *
 * @param srcIdx   - Linear index into source pixel flat array.
 * @param destIdx  - Linear index into destination (target) pixel flat array.
 * @param sourcePixels  - Source image RGBA flat array (Uint8ClampedArray).
 * @param targetPixels  - Target image RGBA flat array (Uint8ClampedArray).
 * @param weightsPixels - Weights mask RGBA flat array (Uint8ClampedArray).
 * @param width         - Image width in pixels.
 * @param proximityImportance - Spatial penalty multiplier (default 13).
 * @returns Non-negative cost value; lower is better.
 */
export function computeCost(
  srcIdx: number,
  destIdx: number,
  sourcePixels: Uint8ClampedArray,
  targetPixels: Uint8ClampedArray,
  weightsPixels: Uint8ClampedArray,
  width: number,
  proximityImportance: number,
): number {
  const s4 = srcIdx * 4;
  const d4 = destIdx * 4;

  // Colour distance squared between assigned source pixel and target pixel.
  // Bounds are guaranteed by caller — srcIdx/destIdx are within image dimensions.
  const dr = (sourcePixels[s4] ?? 0) - (targetPixels[d4] ?? 0);
  const dg = (sourcePixels[s4 + 1] ?? 0) - (targetPixels[d4 + 1] ?? 0);
  const db = (sourcePixels[s4 + 2] ?? 0) - (targetPixels[d4 + 2] ?? 0);
  const colorDistSq = dr * dr + dg * dg + db * db;

  // Weight from the mask (red channel of the grayscale weights image).
  const weight = weightsPixels[d4] ?? 0;

  // Spatial distance squared: original source position vs destination position.
  const srcX = srcIdx % width;
  const srcY = (srcIdx / width) | 0;
  const destX = destIdx % width;
  const destY = (destIdx / width) | 0;
  const dx = srcX - destX;
  const dy = srcY - destY;
  const spatialDistSq = dx * dx + dy * dy;

  // Spatial penalty term: (spatialDistSq * proximityImportance)^2
  const spatialTerm = spatialDistSq * proximityImportance;

  return colorDistSq * weight + spatialTerm * spatialTerm;
}
