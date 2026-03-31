/**
 * Resilient fetch utility with timeout, retries, and fallback URLs.
 *
 * Usage:
 *   const res = await resilientFetch("/api/apps", undefined, {
 *     fallbackUrls: ["https://backup.spike.land/api/apps"],
 *     timeoutMs: 5000,
 *     retries: 2,
 *   });
 */

export interface FetchWithFallbackOptions {
  /** Alternative URLs to try if the primary fails. */
  fallbackUrls?: string[];
  /** Per-request timeout in milliseconds. Defaults to 10000 (10s). */
  timeoutMs?: number;
  /** Number of retry attempts per URL (0 = no retries). Defaults to 1. */
  retries?: number;
}

/**
 * Fetch with timeout support. Returns a Response or throws on failure/timeout.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const existingSignal = init?.signal;

  // Combine caller-provided signal with our timeout signal
  if (existingSignal) {
    existingSignal.addEventListener("abort", () => controller.abort(existingSignal.reason));
  }

  const timeoutId = setTimeout(() => controller.abort(new Error("Request timed out")), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Attempt a single URL with retries. Returns the first successful Response
 * (HTTP status is not checked — caller decides what counts as success).
 * Throws the last error if all attempts fail.
 */
async function attemptWithRetries(
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number,
  retries: number,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout(url, init, timeoutMs);
    } catch (err: unknown) {
      lastError = err;
      // Don't retry if the caller explicitly aborted
      if (init?.signal?.aborted) {
        throw err;
      }
    }
  }

  throw lastError;
}

/**
 * Fetch a URL with automatic retries, timeout, and fallback URLs.
 *
 * Tries the primary URL first (with retries), then each fallback URL in order.
 * Throws the last encountered error only if all URLs and retries are exhausted.
 */
export async function resilientFetch(
  url: string,
  init?: RequestInit,
  options?: FetchWithFallbackOptions,
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const retries = options?.retries ?? 1;
  const fallbackUrls = options?.fallbackUrls ?? [];

  const allUrls = [url, ...fallbackUrls];
  let lastError: unknown;

  for (const targetUrl of allUrls) {
    try {
      return await attemptWithRetries(targetUrl, init, timeoutMs, retries);
    } catch (err: unknown) {
      lastError = err;
      // Don't try fallbacks if the caller explicitly aborted
      if (init?.signal?.aborted) {
        throw err;
      }
    }
  }

  throw lastError;
}
