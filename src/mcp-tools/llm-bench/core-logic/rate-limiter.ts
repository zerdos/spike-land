/**
 * Simple in-memory rate limiter for anti-cheat protection.
 *
 * Sliding window per key. Not distributed — works for single-process MCP servers.
 */

export interface RateLimiter {
  /** Returns true if the request is allowed, false if rate-limited. */
  check(key: string): boolean;
  /** Reset all state (for testing). */
  reset(): void;
}

/**
 * Create a rate limiter that allows `maxPerWindow` requests per `windowMs` milliseconds.
 */
export function createRateLimiter(maxPerWindow: number, windowMs: number): RateLimiter {
  const windows = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string): boolean {
      const now = Date.now();
      const entry = windows.get(key);

      if (!entry || now >= entry.resetAt) {
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }

      if (entry.count >= maxPerWindow) return false;
      entry.count++;
      return true;
    },

    reset(): void {
      windows.clear();
    },
  };
}
