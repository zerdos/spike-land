/**
 * Guard Expression Parser
 *
 * Safe recursive-descent parser for guard expressions used by the statechart
 * engine. Supports arithmetic, comparison, logical operators, string/number
 * literals, boolean/null keywords, and context field access.
 */
/**
 * Evaluate a guard expression string against a context object.
 * Returns true if the expression evaluates to a truthy value.
 */
export declare function evaluateGuard(
  expression: string,
  context: Record<string, unknown>,
): boolean;
/**
 * Evaluate an arbitrary expression string against a context object.
 * Returns the raw result value (may be string, number, boolean, null, etc.).
 */
export declare function evaluateExpression(
  expression: string,
  context: Record<string, unknown>,
): unknown;
//# sourceMappingURL=parser.d.ts.map
