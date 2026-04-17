/**
 * In-memory ring buffer for per-isolate request latency samples.
 *
 * Records the wall-clock duration of each request handled by the worker so that
 * /health endpoints can surface p50/p99 percentiles from THIS isolate's recent
 * traffic. The buffer is module-level: it is shared across all requests served
 * by the same V8 isolate and is reset whenever the isolate is evicted by
 * Cloudflare's runtime (this is acceptable — health is best-effort, not a
 * persistent metric store).
 *
 * Design constraints:
 *   - O(1) write (append into a fixed-size circular array)
 *   - O(N log N) read (sort-on-percentile-compute is fine for small N)
 *   - Zero external deps — always works even when Analytics Engine / D1 / etc.
 *     are unavailable.
 *   - Coexists with the Analytics Engine / D1 service-metrics middleware: the
 *     concerns are different (Analytics = persistent cross-isolate aggregation,
 *     this = per-isolate "is THIS worker degraded right now?" signal).
 */

/** Default ring buffer capacity (samples). */
export const DEFAULT_LATENCY_BUFFER_CAPACITY = 1000;

/** Default p99 health threshold in milliseconds. */
export const DEFAULT_P99_THRESHOLD_MS = 2000;

export interface LatencySummary {
  /** Median latency in ms, null if no samples. */
  p50_ms: number | null;
  /** 99th-percentile latency in ms, null if no samples. */
  p99_ms: number | null;
  /** Number of samples present in the buffer right now. */
  sample_count: number;
  /** Width of the time window (oldest to newest sample) in seconds; 0 if <2 samples. */
  window_seconds: number;
}

interface Sample {
  /** Latency in milliseconds. */
  ms: number;
  /** Wall-clock timestamp the request finished (ms since epoch). */
  recordedAt: number;
}

export class LatencyBuffer {
  private readonly buffer: Array<Sample | undefined>;
  private writeIndex = 0;
  private filled = 0;

  constructor(public readonly capacity: number = DEFAULT_LATENCY_BUFFER_CAPACITY) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error(`LatencyBuffer capacity must be a positive integer, got ${capacity}`);
    }
    this.buffer = new Array<Sample | undefined>(capacity);
  }

  /** Append a latency sample. O(1). Negative or non-finite values are ignored. */
  record(latencyMs: number, now: number = Date.now()): void {
    if (!Number.isFinite(latencyMs) || latencyMs < 0) {
      return;
    }
    this.buffer[this.writeIndex] = { ms: latencyMs, recordedAt: now };
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.filled < this.capacity) {
      this.filled += 1;
    }
  }

  /** Number of samples currently held. */
  get size(): number {
    return this.filled;
  }

  /** Erase all samples — primarily for tests. */
  reset(): void {
    for (let i = 0; i < this.buffer.length; i += 1) {
      this.buffer[i] = undefined;
    }
    this.writeIndex = 0;
    this.filled = 0;
  }

  /** Snapshot all live samples in arbitrary order. */
  private snapshot(): Sample[] {
    const out: Sample[] = [];
    for (let i = 0; i < this.filled; i += 1) {
      const sample = this.buffer[i];
      if (sample) {
        out.push(sample);
      }
    }
    return out;
  }

  /**
   * Compute p50/p99 over the current contents of the buffer.
   * Returns null percentiles when there are no samples.
   */
  summary(): LatencySummary {
    const samples = this.snapshot();
    if (samples.length === 0) {
      return { p50_ms: null, p99_ms: null, sample_count: 0, window_seconds: 0 };
    }

    const sorted = samples.map((s) => s.ms).sort((a, b) => a - b);
    const p50 = percentile(sorted, 0.5);
    const p99 = percentile(sorted, 0.99);

    let oldest = samples[0]!.recordedAt;
    let newest = samples[0]!.recordedAt;
    for (let i = 1; i < samples.length; i += 1) {
      const ts = samples[i]!.recordedAt;
      if (ts < oldest) oldest = ts;
      if (ts > newest) newest = ts;
    }

    return {
      p50_ms: p50,
      p99_ms: p99,
      sample_count: samples.length,
      window_seconds: Math.max(0, Math.round((newest - oldest) / 1000)),
    };
  }
}

/**
 * Linear-interpolated percentile over a pre-sorted ascending array of numbers.
 * Returns null for empty input.
 */
export function percentile(sortedAsc: readonly number[], q: number): number | null {
  if (sortedAsc.length === 0) return null;
  if (sortedAsc.length === 1) return sortedAsc[0] ?? null;
  if (q <= 0) return sortedAsc[0] ?? null;
  if (q >= 1) return sortedAsc[sortedAsc.length - 1] ?? null;

  const rank = q * (sortedAsc.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  const loVal = sortedAsc[lo];
  const hiVal = sortedAsc[hi];
  if (loVal === undefined || hiVal === undefined) return null;
  if (lo === hi) return loVal;
  const fraction = rank - lo;
  return loVal + (hiVal - loVal) * fraction;
}

/**
 * Module-level singletons keyed by service name. Each Workers isolate gets
 * exactly one buffer per service; the buffer survives across requests within
 * the isolate but resets when the isolate is evicted.
 */
const buffers = new Map<string, LatencyBuffer>();

export function getLatencyBuffer(
  serviceName: string,
  capacity: number = DEFAULT_LATENCY_BUFFER_CAPACITY,
): LatencyBuffer {
  let buffer = buffers.get(serviceName);
  if (!buffer) {
    buffer = new LatencyBuffer(capacity);
    buffers.set(serviceName, buffer);
  }
  return buffer;
}

/** Test helper — drop all named buffers. Not exported from the package surface. */
export function __resetLatencyBuffersForTests(): void {
  buffers.clear();
}

/**
 * Parse the HEALTH_P99_THRESHOLD_MS env var. Returns the default on missing,
 * empty, or non-numeric input.
 */
export function resolveP99ThresholdMs(raw: string | undefined | null): number {
  if (raw === undefined || raw === null || raw === "") {
    return DEFAULT_P99_THRESHOLD_MS;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_P99_THRESHOLD_MS;
  }
  return parsed;
}
