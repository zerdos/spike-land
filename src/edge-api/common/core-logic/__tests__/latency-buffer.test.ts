import { describe, expect, it } from "vitest";
import {
  DEFAULT_P99_THRESHOLD_MS,
  LatencyBuffer,
  __resetLatencyBuffersForTests,
  getLatencyBuffer,
  percentile,
  resolveP99ThresholdMs,
} from "../latency-buffer";

describe("LatencyBuffer", () => {
  it("returns null percentiles and zero counts when empty", () => {
    const buf = new LatencyBuffer(8);
    const summary = buf.summary();
    expect(summary.p50_ms).toBeNull();
    expect(summary.p99_ms).toBeNull();
    expect(summary.sample_count).toBe(0);
    expect(summary.window_seconds).toBe(0);
  });

  it("computes p50/p99 from a known set of latencies", () => {
    const buf = new LatencyBuffer(200);
    // 100 samples 1..100ms
    for (let i = 1; i <= 100; i += 1) {
      buf.record(i, 1_000_000_000_000 + i * 1000);
    }
    const summary = buf.summary();
    expect(summary.sample_count).toBe(100);
    // p50 with linear interpolation over [1..100]: rank = 0.5 * 99 = 49.5 →
    // between sorted[49]=50 and sorted[50]=51 → 50.5
    expect(summary.p50_ms).toBeCloseTo(50.5, 5);
    // p99: rank = 0.99 * 99 = 98.01 → between sorted[98]=99 and sorted[99]=100 → 99.01
    expect(summary.p99_ms).toBeCloseTo(99.01, 5);
    // window: first sample at +1s, last at +100s → 99 seconds
    expect(summary.window_seconds).toBe(99);
  });

  it("overwrites oldest entries once capacity is exceeded (FIFO)", () => {
    const buf = new LatencyBuffer(3);
    buf.record(10);
    buf.record(20);
    buf.record(30);
    buf.record(40); // evicts 10
    const summary = buf.summary();
    expect(summary.sample_count).toBe(3);
    // sorted [20,30,40], p50 ~ 30
    expect(summary.p50_ms).toBe(30);
  });

  it("ignores negative or non-finite samples", () => {
    const buf = new LatencyBuffer(8);
    buf.record(-1);
    buf.record(Number.NaN);
    buf.record(Number.POSITIVE_INFINITY);
    buf.record(5);
    expect(buf.size).toBe(1);
    expect(buf.summary().p50_ms).toBe(5);
  });

  it("rejects invalid capacity at construction", () => {
    expect(() => new LatencyBuffer(0)).toThrow();
    expect(() => new LatencyBuffer(-3)).toThrow();
    expect(() => new LatencyBuffer(1.5)).toThrow();
  });

  it("reset() clears all samples", () => {
    const buf = new LatencyBuffer(4);
    buf.record(10);
    buf.record(20);
    buf.reset();
    expect(buf.size).toBe(0);
    expect(buf.summary().sample_count).toBe(0);
  });
});

describe("percentile", () => {
  it("returns null for empty input", () => {
    expect(percentile([], 0.5)).toBeNull();
  });

  it("returns the only value for a single element", () => {
    expect(percentile([42], 0.5)).toBe(42);
    expect(percentile([42], 0.99)).toBe(42);
  });

  it("clamps q outside [0,1] to the endpoints", () => {
    expect(percentile([1, 2, 3], -1)).toBe(1);
    expect(percentile([1, 2, 3], 5)).toBe(3);
  });

  it("matches expected interpolated values", () => {
    const arr = [1, 2, 3, 4];
    // rank = 0.5 * 3 = 1.5 → between 2 and 3 → 2.5
    expect(percentile(arr, 0.5)).toBe(2.5);
  });
});

describe("getLatencyBuffer", () => {
  it("returns the same singleton per service name", () => {
    __resetLatencyBuffersForTests();
    const a = getLatencyBuffer("svc-a");
    const b = getLatencyBuffer("svc-a");
    expect(a).toBe(b);
    const c = getLatencyBuffer("svc-b");
    expect(c).not.toBe(a);
  });
});

describe("resolveP99ThresholdMs", () => {
  it("returns the default when undefined / empty / non-numeric", () => {
    expect(resolveP99ThresholdMs(undefined)).toBe(DEFAULT_P99_THRESHOLD_MS);
    expect(resolveP99ThresholdMs(null)).toBe(DEFAULT_P99_THRESHOLD_MS);
    expect(resolveP99ThresholdMs("")).toBe(DEFAULT_P99_THRESHOLD_MS);
    expect(resolveP99ThresholdMs("not-a-number")).toBe(DEFAULT_P99_THRESHOLD_MS);
    expect(resolveP99ThresholdMs("0")).toBe(DEFAULT_P99_THRESHOLD_MS);
    expect(resolveP99ThresholdMs("-5")).toBe(DEFAULT_P99_THRESHOLD_MS);
  });

  it("parses positive numeric strings", () => {
    expect(resolveP99ThresholdMs("500")).toBe(500);
    expect(resolveP99ThresholdMs("3000")).toBe(3000);
  });
});
