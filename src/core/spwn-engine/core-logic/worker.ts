/**
 * SPWN Web Worker Entry Point
 *
 * Handles messages from the main thread to evaluate or parse SPWN code.
 * All output from $.print() is sent back as "output" messages before the
 * final result.
 *
 * Message protocol:
 *   IN:  { kind: "eval",  code: string, id: number }
 *   IN:  { kind: "parse", code: string, id: number }
 *   OUT: { kind: "result", value: string, id: number }
 *   OUT: { kind: "output", text: string,  id: number }
 *   OUT: { kind: "error",  message: string, id: number }
 */

import { parseSource, run } from "./index.js";
import { displayValue } from "./values.js";

// ─── Message Types ────────────────────────────────────────────────────────────

export type InboundMessage =
  | { kind: "eval"; code: string; id: number }
  | { kind: "parse"; code: string; id: number };

export type OutboundMessage =
  | { kind: "result"; value: string; id: number }
  | { kind: "output"; text: string; id: number }
  | { kind: "error"; message: string; id: number };

// ─── Worker Handler ───────────────────────────────────────────────────────────

function handleMessage(msg: InboundMessage): void {
  const { id } = msg;

  try {
    if (msg.kind === "parse") {
      const ast = parseSource(msg.code);
      postMessage({
        kind: "result",
        value: JSON.stringify(ast, null, 2),
        id,
      } satisfies OutboundMessage);
      return;
    }

    if (msg.kind === "eval") {
      const printFn = (text: string): void => {
        postMessage({ kind: "output", text, id } satisfies OutboundMessage);
      };

      const result = run(msg.code, printFn);
      postMessage({ kind: "result", value: displayValue(result), id } satisfies OutboundMessage);
      return;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    postMessage({ kind: "error", message, id } satisfies OutboundMessage);
  }
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

self.addEventListener("message", (event: MessageEvent<unknown>) => {
  const data = event.data as InboundMessage;
  handleMessage(data);
});
