/**
 * Numeric parsing utilities with safety guards.
 *
 * Use these helpers when parsing user-supplied query parameters or other
 * untrusted numeric input — `parseInt` returns `NaN` on non-numeric input
 * and has no upper bound, which makes naive usage a DoS vector.
 */

/**
 * Parses an unknown value as a positive integer with a default and an
 * upper bound.
 *
 * - Non-string input returns `defaultValue`.
 * - `NaN`, non-finite, or values < 1 return `defaultValue`.
 * - Valid input is capped at `max`.
 *
 * @param value - The raw value to parse (typically from `c.req.query(...)`).
 * @param defaultValue - Returned when input is missing or invalid.
 * @param max - Upper bound applied via `Math.min` to valid input.
 */
export function parsePositiveInt(value: unknown, defaultValue: number, max: number): number {
  if (typeof value !== "string") return defaultValue;
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || Number.isNaN(n) || n < 1) return defaultValue;
  return Math.min(n, max);
}
