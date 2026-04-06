/**
 * Headless Render Loop — The Self-Improving Loop
 *
 * This demonstrates the key use case: rendering React to Canvas in a Worker
 * (or Node.js with OffscreenCanvas polyfill) with no DOM at all.
 *
 * The loop: generate UI → render to canvas → measure results → adjust → repeat
 * All without a browser, all without DOM reflow.
 *
 * This is the missing piece for:
 * - AI agents that generate and validate UI layouts
 * - Automated visual regression testing without a browser
 * - Server-side thumbnail/preview generation
 * - Worker-based UI rendering pipelines
 */

import { createElement } from "../../react/ReactElement.js";
import { createCanvasRoot, type CanvasRoot } from "../client.js";
import { type CanvasNode, type CanvasTextNode } from "../../host-config/CanvasHostConfig.js";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";

// ── Types ──────────────────────────────────────────────────────────

interface LayoutMetrics {
  totalHeight: number;
  lineCount: number;
  overflows: boolean;
  textFitsContainer: boolean;
}

interface RenderResult {
  metrics: LayoutMetrics;
  sceneGraph: CanvasNode;
  renderTimeMs: number;
}

// ── Measure text metrics without rendering ─────────────────────────

export function measureTextLayout(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  containerHeight: number,
): LayoutMetrics {
  const prepared = prepareWithSegments(text, font);
  const { height, lineCount } = layoutWithLines(prepared, maxWidth, lineHeight);

  return {
    totalHeight: height,
    lineCount,
    overflows: height > containerHeight,
    textFitsContainer: height <= containerHeight,
  };
}

// ── Render and measure a component ─────────────────────────────────

export function renderAndMeasure(
  root: CanvasRoot,
  element: unknown,
  _containerWidth: number,
  containerHeight: number,
): RenderResult {
  const start = performance.now();

  root.render(element as Parameters<typeof root.render>[0]);

  const renderTimeMs = performance.now() - start;

  const sceneGraph = root.getSceneGraph();

  // Walk the scene graph to compute metrics
  const metrics = computeMetrics(sceneGraph, containerHeight);

  return { metrics, sceneGraph, renderTimeMs };
}

function computeMetrics(node: CanvasNode, containerHeight: number): LayoutMetrics {
  let totalHeight = node.computedHeight;
  let lineCount = 0;

  function isCanvasNode(c: CanvasNode | CanvasTextNode): c is CanvasNode {
    return c.type !== "__text__";
  }

  function walk(n: CanvasNode): void {
    for (const child of n.children) {
      if (!isCanvasNode(child)) {
        // Count text nodes — they contribute to line count via their prepared data
        if (child.prepared) {
          lineCount++;
        }
      } else {
        totalHeight = Math.max(totalHeight, child.computedY + child.computedHeight);
        walk(child);
      }
    }
  }

  walk(node);

  return {
    totalHeight,
    lineCount,
    overflows: totalHeight > containerHeight,
    textFitsContainer: totalHeight <= containerHeight,
  };
}

// ── Self-improving loop example ────────────────────────────────────

export interface LoopConfig {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  maxIterations?: number;
  targetHeight: number;
  initialFontSize: number;
  text: string;
  fontFamily?: string;
}

/**
 * Iteratively adjusts font size until text fits the target container height.
 * No DOM involved — pure computation with pretext.
 *
 * Returns the optimal font size and the number of iterations it took.
 */
export function fitTextToContainer(config: LoopConfig): {
  fontSize: number;
  iterations: number;
  finalMetrics: LayoutMetrics;
} {
  const {
    canvas,
    maxIterations = 20,
    targetHeight,
    initialFontSize,
    text,
    fontFamily = "Inter",
  } = config;

  let fontSize = initialFontSize;
  let lo = 4;
  let hi = initialFontSize * 2;
  let bestMetrics: LayoutMetrics | null = null;

  const root = createCanvasRoot(canvas, {
    fontSize,
    fontFamily,
    lineHeight: Math.round(fontSize * 1.4),
  });

  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    fontSize = Math.round((lo + hi) / 2);
    const lineHeight = Math.round(fontSize * 1.4);

    const element = createElement(
      "div",
      {
        style: {
          width: canvas.width,
          fontSize,
          fontFamily,
          lineHeight,
          fill: "#fff",
          padding: 16,
        },
      },
      text,
    );

    const { metrics } = renderAndMeasure(root, element, canvas.width, targetHeight);
    bestMetrics = metrics;

    if (metrics.textFitsContainer && !metrics.overflows) {
      // Text fits — try larger
      lo = fontSize;
    } else {
      // Text overflows — try smaller
      hi = fontSize;
    }

    // Converged
    if (hi - lo <= 1) break;
  }

  root.unmount();

  return {
    fontSize: lo, // Use the last known fitting size
    iterations,
    finalMetrics:
      bestMetrics ??
      (() => {
        throw new Error("No iterations executed — maxIterations must be > 0");
      })(),
  };
}

/**
 * Pure pretext version — even faster, no React or Canvas involved.
 * Binary search on font size using only pretext measurement.
 */
export function fitTextPure(
  text: string,
  maxWidth: number,
  targetHeight: number,
  fontFamily: string = "Inter",
  maxIterations: number = 20,
): { fontSize: number; iterations: number; lineCount: number } {
  let lo = 4;
  let hi = 200;
  let bestLineCount = 0;
  let iterations = 0;

  while (iterations < maxIterations && hi - lo > 1) {
    iterations++;
    const mid = Math.round((lo + hi) / 2);
    const lineHeight = Math.round(mid * 1.4);
    const font = `400 ${mid}px ${fontFamily}`;

    const metrics = measureTextLayout(text, font, maxWidth, lineHeight, targetHeight);

    if (metrics.textFitsContainer) {
      lo = mid;
      bestLineCount = metrics.lineCount;
    } else {
      hi = mid;
    }
  }

  return { fontSize: lo, iterations, lineCount: bestLineCount };
}
