/**
 * Daft Punk "Human After All" Word Wall
 *
 * Recreates the iconic radial-zoom word wall from Daft Punk's visuals using
 * the react-ts-worker Canvas renderer. Golden-orange command words fly toward
 * the camera on a dark red-brown background with glow and vignette.
 *
 * Usage (browser):
 *   import { runDaftPunkWall } from "./daft-punk-word-wall.js";
 *   const canvas = document.getElementById("canvas") as HTMLCanvasElement;
 *   const cleanup = runDaftPunkWall(canvas);
 *   // cleanup() to stop
 *
 * Usage (OffscreenCanvas in Worker):
 *   const canvas = new OffscreenCanvas(1920, 1080);
 *   runDaftPunkWall(canvas);
 */

import { createElement } from "../../react/ReactElement.js";
import { createCanvasRoot } from "../client.js";

// ── Word list — computer commands in the Daft Punk aesthetic ─────

const WORDS = [
  "WRITE",
  "LOAD",
  "SWITCH",
  "ZIP",
  "UNLOCK",
  "PAUSE",
  "FIND",
  "QUICK",
  "LOCK",
  "DELETE",
  "SAVE",
  "UPDATE",
  "BLOCK",
  "OPEN",
  "CLOSE",
  "READ",
  "COPY",
  "MOVE",
  "LINK",
  "SYNC",
  "PUSH",
  "PULL",
  "SEND",
  "GET",
  "SET",
  "RUN",
  "STOP",
  "RESET",
  "CALL",
  "DROP",
  "ADD",
  "CUT",
  "SWAP",
  "FLIP",
  "SORT",
  "SCAN",
  "PING",
  "DUMP",
  "EDIT",
  "SEEK",
  "HASH",
  "BIND",
  "CAST",
  "FORK",
  "JOIN",
  "KILL",
  "WAKE",
  "BOOT",
  "INIT",
  "EXIT",
  "SKIP",
  "GRAB",
  "FREE",
  "PACK",
  "UNDO",
  "REDO",
  "WIPE",
  "MARK",
  "PICK",
  "TEST",
  "TRIM",
  "RELOAD",
  "COMPILE",
  "EXECUTE",
  "PROCESS",
  "UPLOAD",
  "IMPORT",
  "EXPORT",
  "FILTER",
  "RENDER",
  "SEARCH",
  "INJECT",
  "DEPLOY",
  "LAUNCH",
  "BRIDGE",
  "SIGNAL",
  "STREAM",
  "PARSE",
  "BUILD",
  "MOUNT",
  "PATCH",
  "FLUSH",
  "FETCH",
  "MERGE",
  "SPLIT",
  "CLONE",
  "PRINT",
  "DEBUG",
  "TRACE",
  "STORE",
  "CACHE",
  "INDEX",
  "QUEUE",
  "ROUTE",
  "YIELD",
  "AWAIT",
  "BREAK",
  "SHIFT",
  "EJECT",
  "ERASE",
];

// ── Word block state ─────────────────────────────────────────────

interface WordBlock {
  word: string;
  x: number; // world x
  y: number; // world y
  z: number; // depth (distance from camera)
  baseZ: number; // respawn depth
  speed: number; // z-velocity
  size: number; // base font size
}

function randomWord(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)] ?? WORDS[0];
  if (word === undefined) throw new Error("WORDS array is empty");
  return word;
}

function createBlock(): WordBlock {
  const z = 100 + Math.random() * 800;
  return {
    word: randomWord(),
    x: (Math.random() - 0.5) * 1600,
    y: (Math.random() - 0.5) * 900,
    z,
    baseZ: z,
    speed: 0.3 + Math.random() * 0.7,
    size: 14 + Math.random() * 28,
  };
}

// ── Color helpers ────────────────────────────────────────────────

function wordColor(z: number, maxZ: number): string {
  const t = z / maxZ;
  const r = Math.floor(200 + 55 * (1 - t));
  const g = Math.floor(120 + 100 * (1 - t));
  const b = Math.floor(10 + 30 * t);
  const a = Math.min(1, 0.3 + 0.7 * (1 - t));
  return `rgba(${r},${g},${b},${a})`;
}

// ── Components ───────────────────────────────────────────────────

function WordElement(props: {
  word: string;
  sx: number;
  sy: number;
  fontSize: number;
  color: string;
}) {
  return createElement(
    "div",
    {
      style: {
        x: props.sx,
        y: props.sy,
        fontSize: props.fontSize,
        fontWeight: "700",
        fill: props.color,
        textAlign: "center" as const,
      },
    },
    props.word,
  );
}

function WordWallScene(props: { blocks: WordBlock[]; width: number; height: number }) {
  const cx = props.width / 2;
  const cy = props.height / 2;
  const fov = 400;
  const maxZ = 900;

  // Sort far-to-near for correct layering
  const sorted = [...props.blocks].sort((a, b) => b.z - a.z);

  const wordElements = sorted
    .map((b, i) => {
      const scale = fov / b.z;
      const sx = cx + b.x * scale;
      const sy = cy + b.y * scale;
      const fontSize = Math.max(4, b.size * scale);

      // Cull off-screen
      if (sx < -200 || sx > props.width + 200 || sy < -100 || sy > props.height + 100) {
        return null;
      }

      return createElement(WordElement, {
        key: i,
        word: b.word,
        sx: sx - fontSize * b.word.length * 0.3, // rough centering
        sy,
        fontSize,
        color: wordColor(b.z, maxZ),
      });
    })
    .filter(Boolean);

  return createElement(
    "div",
    {
      style: {
        width: props.width,
        height: props.height,
        backgroundColor: "#1a0503",
      },
    },
    ...wordElements,
  );
}

// ── Main runner ──────────────────────────────────────────────────

export function runDaftPunkWall(canvas: HTMLCanvasElement | OffscreenCanvas): () => void {
  const root = createCanvasRoot(canvas, {
    fontSize: 16,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    lineHeight: 22,
  });

  // Initialize 400 word blocks
  const blocks: WordBlock[] = [];
  for (let i = 0; i < 400; i++) {
    blocks.push(createBlock());
  }

  let running = true;

  function tick() {
    if (!running) return;

    // Advance blocks toward camera
    for (const b of blocks) {
      b.z -= b.speed * 2;
      if (b.z < 1) {
        b.z = b.baseZ;
        b.x = (Math.random() - 0.5) * 1600;
        b.y = (Math.random() - 0.5) * 900;
        b.word = randomWord();
      }
    }

    root.render(
      createElement(WordWallScene, {
        blocks,
        width: canvas.width,
        height: canvas.height,
      }),
    );

    requestAnimationFrame(tick);
  }

  tick();

  return () => {
    running = false;
    root.unmount();
  };
}
