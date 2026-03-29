/**
 * Sandboxed code execution engine.
 *
 * Uses `new Function()` with a restricted scope — no access to Node.js globals,
 * filesystem, network, or process. Each execution is time-bounded via
 * `Promise.race` with a timeout.
 */

import type { SandboxOptions, SandboxResult } from "../mcp/types.js";

const DEFAULT_OPTIONS: SandboxOptions = {
  timeoutMs: 5_000,
  maxOutputBytes: 1_048_576, // 1 MB
};

/**
 * Blocklist of identifiers that must not leak into the sandbox scope.
 * The sandbox function body receives these as parameters shadowed to `undefined`.
 */
const BLOCKED_GLOBALS = [
  "process",
  "require",
  "globalThis",
  "global",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "importScripts",
  "Deno",
  "Bun",
] as const;

/**
 * Execute a code snippet + expression in a restricted sandbox.
 *
 * @param code - The user's code (function/module body).
 * @param expression - An expression to evaluate after the code runs.
 *   It may reference exports from `code` via the `solution` binding.
 * @param options - Timeout and output size limits.
 * @returns Structured result with value, error, timing, and timeout flag.
 */
export async function runInSandbox(
  code: string,
  expression: string,
  options: Partial<SandboxOptions> = {},
): Promise<SandboxResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const start = Date.now();

  try {
    // Build the sandbox function body:
    //   1. Shadow dangerous globals as undefined parameters
    //   2. Run user code (which may define `solution` or export functions)
    //   3. Evaluate the test expression and return its JSON representation
    const blockedParams = BLOCKED_GLOBALS.join(", ");
    const functionBody = `
      "use strict";
      ${code}
      return JSON.stringify(${expression});
    `;

    const sandboxFn = new Function(blockedParams, functionBody);

    // Execute with timeout via Promise.race
    const executionPromise = new Promise<string>((resolve, reject) => {
      try {
        // Pass `undefined` for every blocked global
        const undefinedArgs = BLOCKED_GLOBALS.map(() => undefined);
        const result: unknown = sandboxFn(...undefinedArgs);
        resolve(String(result));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });

    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Execution timed out after ${opts.timeoutMs}ms`));
      }, opts.timeoutMs);
    });

    const rawValue = await Promise.race([executionPromise, timeoutPromise]);
    const durationMs = Date.now() - start;

    // Enforce output size limit
    if (rawValue.length > opts.maxOutputBytes) {
      return {
        value: rawValue.slice(0, opts.maxOutputBytes),
        error: `Output truncated: ${rawValue.length} bytes exceeds ${opts.maxOutputBytes} limit`,
        durationMs,
        timedOut: false,
      };
    }

    return {
      value: rawValue,
      error: undefined,
      durationMs,
      timedOut: false,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    const timedOut = message.includes("timed out");

    return {
      value: undefined as unknown as string,
      error: message,
      durationMs,
      timedOut,
    };
  }
}

/**
 * Wrap code so that the main export is available as `solution`.
 *
 * Handles common patterns:
 * - `function solution(...)` → already named `solution`
 * - `function myFunc(...)` → aliases as `const solution = myFunc;`
 * - Arrow/const: `const myFunc = ...` → aliases as `const solution = myFunc;`
 *
 * If the code already contains `solution`, it's returned as-is.
 */
export function wrapCodeWithSolutionBinding(code: string): string {
  if (/\bsolution\b/.test(code)) {
    return code;
  }

  // Match `function NAME(` — capture the first function name
  const fnMatch = /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/.exec(code);
  if (fnMatch?.[1]) {
    return `${code}\nconst solution = ${fnMatch[1]};`;
  }

  // Match `const NAME =` or `let NAME =`
  const constMatch = /\b(?:const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/.exec(code);
  if (constMatch?.[1]) {
    return `${code}\nconst solution = ${constMatch[1]};`;
  }

  return code;
}
