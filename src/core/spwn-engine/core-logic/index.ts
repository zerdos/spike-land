/**
 * SPWN Engine — Public API
 *
 * Re-exports the core types and classes needed to tokenize, parse, and evaluate
 * SPWN programs. The `run` and `parse` convenience functions are the main entry
 * points for embedding.
 */

export * from "./ast.js";
export * from "./lexer.js";
export * from "./parser.js";
export * from "./values.js";
export * from "./environment.js";
export * from "./builtins.js";
export { Evaluator, RuntimeError } from "./evaluator.js";

import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { Evaluator } from "./evaluator.js";
import type { Value } from "./values.js";
import type { Statement } from "./ast.js";
import type { PrintCallback } from "./builtins.js";

/** Parse SPWN source code into an AST without evaluating it. */
export function parseSource(source: string): Statement[] {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser();
  return parser.parse(tokens);
}

/** Evaluate SPWN source code and return the final value. */
export function run(source: string, printFn?: PrintCallback): Value {
  const program = parseSource(source);
  const evaluator = new Evaluator(printFn);
  return evaluator.evaluate(program);
}
