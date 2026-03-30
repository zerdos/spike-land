import { describe, it, expect, vi, afterEach } from "vitest";
import { randn, sampleGamma, sampleBeta } from "../../../src/core/shared-utils/core-logic/stats.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("randn", () => {
  it("returns a finite number", () => {
    expect(Number.isFinite(randn())).toBe(true);
  });

  it("produces a distribution centered near 0 with std ~1 over many samples", () => {
    const N = 5000;
    const samples = Array.from({ length: N }, randn);
    const mean = samples.reduce((a, b) => a + b, 0) / N;
    const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / N;
    const std = Math.sqrt(variance);
    expect(Math.abs(mean)).toBeLessThan(0.1); // mean close to 0
    expect(std).toBeGreaterThan(0.9); // std close to 1
    expect(std).toBeLessThan(1.1);
  });
});

describe("sampleGamma", () => {
  it("returns a positive finite number for shape >= 1", () => {
    const val = sampleGamma(1);
    expect(val).toBeGreaterThan(0);
    expect(Number.isFinite(val)).toBe(true);
  });

  it("works for shape < 1 (uses boost trick)", () => {
    const val = sampleGamma(0.5);
    expect(val).toBeGreaterThan(0);
    expect(Number.isFinite(val)).toBe(true);
  });

  it("works for large shape values", () => {
    const val = sampleGamma(10);
    expect(val).toBeGreaterThan(0);
    expect(Number.isFinite(val)).toBe(true);
  });

  it("mean of samples approximates the shape parameter", () => {
    const shape = 3;
    const N = 5000;
    const samples = Array.from({ length: N }, () => sampleGamma(shape));
    const mean = samples.reduce((a, b) => a + b, 0) / N;
    // E[Gamma(k)] = k, allow 10% tolerance
    expect(mean).toBeGreaterThan(shape * 0.9);
    expect(mean).toBeLessThan(shape * 1.1);
  });
});

describe("sampleBeta", () => {
  it("returns a value strictly between 0 and 1", () => {
    for (let i = 0; i < 20; i++) {
      const val = sampleBeta(2, 2);
      expect(val).toBeGreaterThan(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("symmetric Beta(alpha, alpha) has mean approximately 0.5", () => {
    const N = 5000;
    const samples = Array.from({ length: N }, () => sampleBeta(5, 5));
    const mean = samples.reduce((a, b) => a + b, 0) / N;
    // E[Beta(a,a)] = 0.5, allow 2% tolerance
    expect(mean).toBeGreaterThan(0.48);
    expect(mean).toBeLessThan(0.52);
  });

  it("Beta(1, 9) is skewed toward 0 — mean approximately 0.1", () => {
    const N = 5000;
    const samples = Array.from({ length: N }, () => sampleBeta(1, 9));
    const mean = samples.reduce((a, b) => a + b, 0) / N;
    // E[Beta(1,9)] = 1/10 = 0.1
    expect(mean).toBeGreaterThan(0.08);
    expect(mean).toBeLessThan(0.12);
  });
});
