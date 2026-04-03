/**
 * Canvas Text Rendering Demo
 *
 * Demonstrates using the react-ts-worker Canvas renderer with @chenglou/pretext
 * for DOM-free text measurement and layout.
 *
 * This renders a card UI entirely to Canvas — no DOM elements, no reflow.
 * Perfect for Worker-based rendering, headless testing, and self-improving loops.
 *
 * Usage (browser):
 *   import { runDemo } from "./canvas-text-demo.js";
 *   const canvas = document.getElementById("canvas") as HTMLCanvasElement;
 *   runDemo(canvas);
 *
 * Usage (OffscreenCanvas in Worker):
 *   const canvas = new OffscreenCanvas(800, 600);
 *   runDemo(canvas);
 *   // canvas.transferToImageBitmap() to send to main thread
 */

import { createElement } from "../../react/ReactElement.js";
import { createCanvasRoot } from "../client.js";

// ── Component definitions using createElement ──────────────────────

function Card(props: { title: string; body: string; footer: string }) {
  return createElement(
    "div",
    {
      style: {
        x: 40,
        y: 40,
        width: 400,
        backgroundColor: "#1a1a2e",
        borderRadius: 12,
        padding: 24,
        stroke: "#16213e",
        strokeWidth: 2,
      },
    },
    createElement(
      "div",
      {
        style: {
          fontSize: 24,
          fontWeight: "700",
          fill: "#e94560",
          lineHeight: 32,
        },
      },
      props.title,
    ),
    createElement(
      "div",
      {
        style: {
          fontSize: 16,
          fill: "#eee",
          lineHeight: 24,
          paddingTop: 12,
        },
      },
      props.body,
    ),
    createElement(
      "div",
      {
        style: {
          fontSize: 13,
          fill: "#888",
          lineHeight: 20,
          paddingTop: 16,
        },
      },
      props.footer,
    ),
  );
}

function MultilingualDemo() {
  return createElement(
    "div",
    {
      style: {
        x: 40,
        y: 280,
        width: 400,
        backgroundColor: "#0f3460",
        borderRadius: 12,
        padding: 24,
        stroke: "#533483",
        strokeWidth: 2,
      },
    },
    createElement(
      "div",
      {
        style: {
          fontSize: 20,
          fontWeight: "700",
          fill: "#e94560",
          lineHeight: 28,
        },
      },
      "Multilingual Text Layout 🌍",
    ),
    createElement(
      "div",
      {
        style: {
          fontSize: 16,
          fill: "#eee",
          lineHeight: 24,
          paddingTop: 12,
        },
      },
      "English text with 日本語 and العربية mixed together. Pretext handles bidi, CJK, emoji 🚀 and grapheme clusters correctly — all measured without touching the DOM.",
    ),
  );
}

function MetricsPanel(props: { fps: string; layoutTime: string; paintTime: string }) {
  return createElement(
    "div",
    {
      style: {
        x: 480,
        y: 40,
        width: 280,
        backgroundColor: "#16213e",
        borderRadius: 8,
        padding: 16,
        stroke: "#0f3460",
        strokeWidth: 1,
      },
    },
    createElement(
      "div",
      {
        style: {
          fontSize: 14,
          fontWeight: "600",
          fill: "#e94560",
          lineHeight: 20,
        },
      },
      "Performance Metrics",
    ),
    createElement(
      "div",
      {
        style: {
          fontSize: 13,
          fill: "#aaa",
          lineHeight: 22,
          paddingTop: 8,
        },
      },
      `FPS: ${props.fps} | Layout: ${props.layoutTime} | Paint: ${props.paintTime}`,
    ),
  );
}

// ── Demo runner ────────────────────────────────────────────────────

export function runDemo(canvas: HTMLCanvasElement | OffscreenCanvas): void {
  const root = createCanvasRoot(canvas, {
    fontSize: 16,
    fontFamily: "Inter",
    lineHeight: 22,
  });

  const app = createElement(
    "div",
    { style: { width: canvas.width, height: canvas.height } },
    createElement(Card, {
      title: "Canvas React Renderer",
      body: "This entire UI is rendered to a Canvas element using our custom React reconciler. Text measurement is powered by @chenglou/pretext — no DOM, no reflow, no layout thrashing. Pure computation.",
      footer: "react-ts-worker/react-canvas • @chenglou/pretext",
    }),
    createElement(MultilingualDemo, {}),
    createElement(MetricsPanel, {
      fps: "60",
      layoutTime: "0.09ms",
      paintTime: "0.5ms",
    }),
  );

  root.render(app);
}

/**
 * Run an interactive demo with state updates (requires browser)
 */
export function runInteractiveDemo(canvas: HTMLCanvasElement): () => void {
  const root = createCanvasRoot(canvas, {
    fontSize: 16,
    fontFamily: "Inter",
    lineHeight: 22,
    onCommit: () => {
      // This fires after every React commit — perfect for perf tracking
    },
  });

  let frame = 0;
  let running = true;

  function tick() {
    if (!running) return;
    frame++;

    const app = createElement(
      "div",
      { style: { width: canvas.width, height: canvas.height } },
      createElement(Card, {
        title: "Live Canvas Rendering",
        body: `Frame ${frame}: React state updates trigger layout + paint entirely on Canvas. The reconciler diffs the scene graph, pretext measures text, and Canvas 2D paints the result. Zero DOM operations.`,
        footer: `Frame #${frame} • ${new Date().toLocaleTimeString()}`,
      }),
      createElement(MultilingualDemo, {}),
    );

    root.render(app);
    requestAnimationFrame(tick);
  }

  tick();

  // Return cleanup function
  return () => {
    running = false;
    root.unmount();
  };
}
