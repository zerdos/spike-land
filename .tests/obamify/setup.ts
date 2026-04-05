/**
 * Vitest setup for obamify tests.
 *
 * Polyfills the browser-native `ImageData` class for the Node.js test
 * environment.  The real `ImageData` lives on CanvasRenderingContext2D and is
 * not available in Node — this minimal stub is sufficient for unit tests that
 * only care about `width`, `height`, and `data`.
 */

class ImageDataPolyfill {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;

  constructor(data: Uint8ClampedArray, width: number, height?: number) {
    this.data = data;
    this.width = width;
    this.height = height ?? data.length / 4 / width;
  }
}

// Only install the polyfill if the environment doesn't already provide it.
if (typeof ImageData === "undefined") {
  (globalThis as Record<string, unknown>)["ImageData"] = ImageDataPolyfill;
}
