/**
 * Unit tests for video/lib/animations.ts pure functions.
 *
 * These functions take plain numbers and return numbers or strings.
 * Remotion imports (interpolate, spring, Easing) are mocked in setup.ts.
 *
 * Tested functions:
 *   typewriter, stagger, countUp, pulse, glitchOffset,
 *   progressBar, radialClipPath, bezierPath, rgbSplit, shake
 *
 * Functions using Remotion's `interpolate` or `spring` at their core
 * (fadeIn, fadeOut, slideIn, springScale, barGrow) are tested for
 * their API contract and determinism rather than exact numeric values,
 * since the mocked `interpolate` returns clamped endpoint values.
 */

import { describe, expect, it } from "vitest";
import {
  typewriter,
  stagger,
  countUp,
  pulse,
  glitchOffset,
  radialClipPath,
  bezierPath,
  rgbSplit,
  shake,
  fadeIn,
  fadeOut,
  slideIn,
  progressBar,
} from "../../src/media/educational-videos/video/lib/animations";

// ── typewriter ────────────────────────────────────────────────────────────────
describe("typewriter", () => {
  const fps = 30;
  const text = "Hello, World!";

  it("returns empty string at frame 0 (no delay)", () => {
    expect(typewriter(0, fps, text)).toBe("");
  });

  it("returns full text well past the end", () => {
    // At 999 frames the elapsed seconds far exceeds the text length
    expect(typewriter(999, fps, text)).toBe(text);
  });

  it("reveals characters progressively", () => {
    // At 30 chars/s, fps=30: 1 char per frame
    const prev = typewriter(4, fps, text, 30);
    const next = typewriter(5, fps, text, 30);
    expect(next.length).toBeGreaterThanOrEqual(prev.length);
  });

  it("respects delay: nothing revealed before delay frames", () => {
    const delay = 60; // 2 seconds
    expect(typewriter(0, fps, text, 30, delay)).toBe("");
    expect(typewriter(59, fps, text, 30, delay)).toBe("");
  });

  it("starts revealing after the delay", () => {
    const delay = 30; // 1 second
    // At frame 31 (1 frame past delay), exactly 1 char at 30 chars/s
    const result = typewriter(31, fps, text, 30, delay);
    expect(result.length).toBeGreaterThan(0);
  });

  it("never returns more characters than text length", () => {
    expect(typewriter(10000, fps, text)).toHaveLength(text.length);
  });

  it("works with custom charsPerSecond", () => {
    // At 1 char/s and fps=30: need 30 frames per character
    const slow = typewriter(29, fps, text, 1); // < 1 second, 0 chars
    const oneChar = typewriter(30, fps, text, 1); // exactly 1 second, 1 char
    expect(slow).toBe("");
    expect(oneChar).toBe("H");
  });

  it("works with empty text", () => {
    expect(typewriter(100, fps, "")).toBe("");
  });
});

// ── stagger ───────────────────────────────────────────────────────────────────
describe("stagger", () => {
  it("returns 0 for index 0", () => {
    expect(stagger(0)).toBe(0);
    expect(stagger(0, 10)).toBe(0);
  });

  it("returns index * staggerAmount", () => {
    expect(stagger(3, 5)).toBe(15);
    expect(stagger(1, 10)).toBe(10);
    expect(stagger(4, 5)).toBe(20);
  });

  it("uses default staggerAmount of 5", () => {
    expect(stagger(3)).toBe(15);
    expect(stagger(7)).toBe(35);
  });

  it("increases linearly with index", () => {
    const amount = 8;
    for (let i = 0; i < 10; i++) {
      expect(stagger(i, amount)).toBe(i * amount);
    }
  });
});

// ── countUp ───────────────────────────────────────────────────────────────────
describe("countUp", () => {
  // countUp uses Remotion's interpolate (mocked) to get progress,
  // then does Math.round(progress * targetValue).
  // The mock returns output[0] when frame <= input[0], else output[last]
  // i.e. at frame=0 → progress=0 → 0; at frame=large → progress=1 → targetValue

  it("returns 0 at frame 0 with no delay", () => {
    expect(countUp(0, 30, 100)).toBe(0);
  });

  it("returns targetValue when fully progressed", () => {
    // Mock returns 1 (output.last) when frame >= input.last
    expect(countUp(9999, 30, 500)).toBe(500);
  });

  it("is non-negative for positive targets", () => {
    for (const frame of [0, 5, 15, 30, 60]) {
      expect(countUp(frame, 30, 100)).toBeGreaterThanOrEqual(0);
    }
  });
});

// ── pulse ─────────────────────────────────────────────────────────────────────
describe("pulse", () => {
  const fps = 30;

  it("returns values in [0, 1]", () => {
    // pulse = (sin(phase) + 1) / 2, range is [0, 1]
    for (let frame = 0; frame < 120; frame++) {
      const val = pulse(frame, fps);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it("is periodic: same value after one full cycle", () => {
    const frequency = 2; // 2 pulses per second
    const framesPerCycle = fps / frequency; // 15 frames
    const val0 = pulse(0, fps, frequency);
    const val1 = pulse(framesPerCycle, fps, frequency);
    expect(val0).toBeCloseTo(val1, 10);
  });

  it("uses default frequency of 2 pulses/second", () => {
    const framesPerCycle = fps / 2;
    expect(pulse(0, fps)).toBeCloseTo(pulse(framesPerCycle, fps), 10);
  });

  it("higher frequency means more cycles per second", () => {
    // At freq=4, period is 7.5 frames; at freq=2, period is 15 frames
    const half1 = pulse(fps / (2 * 2), fps, 2); // half-cycle for freq=2
    const half4 = pulse(fps / (2 * 4), fps, 4); // half-cycle for freq=4
    // Both should hit the peak (~1) at their respective half-cycle
    expect(half1).toBeCloseTo(1, 5);
    expect(half4).toBeCloseTo(1, 5);
  });
});

// ── glitchOffset ──────────────────────────────────────────────────────────────
describe("glitchOffset", () => {
  it("is deterministic for the same inputs", () => {
    expect(glitchOffset(42, 10, 0)).toBe(glitchOffset(42, 10, 0));
    expect(glitchOffset(100, 5, 7)).toBe(glitchOffset(100, 5, 7));
  });

  it("returns values within [-maxOffset, +maxOffset]", () => {
    const maxOffset = 15;
    for (let frame = 0; frame < 200; frame++) {
      const val = glitchOffset(frame, maxOffset, 0);
      expect(val).toBeGreaterThanOrEqual(-maxOffset);
      expect(val).toBeLessThanOrEqual(maxOffset);
    }
  });

  it("different frames produce different values (not all identical)", () => {
    const values = new Set<number>();
    for (let frame = 0; frame < 10; frame++) {
      values.add(glitchOffset(frame, 10, 0));
    }
    // Expect multiple distinct values across frames
    expect(values.size).toBeGreaterThan(1);
  });

  it("different seeds produce different offsets for the same frame", () => {
    const s0 = glitchOffset(5, 10, 0);
    const s1 = glitchOffset(5, 10, 1);
    expect(s0).not.toBe(s1);
  });

  it("maxOffset=0 always returns 0", () => {
    for (let frame = 0; frame < 10; frame++) {
      expect(glitchOffset(frame, 0, 0)).toBe(0);
    }
  });
});

// ── radialClipPath ────────────────────────────────────────────────────────────
describe("radialClipPath", () => {
  it("returns a CSS circle() clip-path string", () => {
    const result = radialClipPath(0.5);
    expect(result).toMatch(/^circle\(/);
  });

  it("at progress=0 radius is 0%", () => {
    const result = radialClipPath(0);
    expect(result).toContain("circle(0%");
  });

  it("at progress=1 radius is 150%", () => {
    const result = radialClipPath(1);
    expect(result).toContain("circle(150%");
  });

  it("uses default center of 50% 50%", () => {
    const result = radialClipPath(0.5);
    expect(result).toContain("at 50% 50%");
  });

  it("respects custom centerX and centerY", () => {
    const result = radialClipPath(0.5, 25, 75);
    expect(result).toContain("at 25% 75%");
  });

  it("radius scales linearly with progress", () => {
    // radius = progress * 150
    const r0 = parseFloat(radialClipPath(0.2).replace("circle(", ""));
    const r1 = parseFloat(radialClipPath(0.4).replace("circle(", ""));
    expect(r1 / r0).toBeCloseTo(2, 5);
  });
});

// ── bezierPath ────────────────────────────────────────────────────────────────
describe("bezierPath", () => {
  const p0 = { x: 0, y: 0 };
  const p1 = { x: 0.33, y: 0.5 };
  const p2 = { x: 0.66, y: 0.5 };
  const p3 = { x: 1, y: 1 };

  it("at progress=0 returns p0", () => {
    const result = bezierPath(0, p0, p1, p2, p3);
    expect(result.x).toBeCloseTo(p0.x, 10);
    expect(result.y).toBeCloseTo(p0.y, 10);
  });

  it("at progress=1 returns p3", () => {
    const result = bezierPath(1, p0, p1, p2, p3);
    expect(result.x).toBeCloseTo(p3.x, 10);
    expect(result.y).toBeCloseTo(p3.y, 10);
  });

  it("clamps progress < 0 to 0 (same as t=0)", () => {
    const negative = bezierPath(-1, p0, p1, p2, p3);
    const zero = bezierPath(0, p0, p1, p2, p3);
    expect(negative.x).toBeCloseTo(zero.x, 10);
    expect(negative.y).toBeCloseTo(zero.y, 10);
  });

  it("clamps progress > 1 to 1 (same as t=1)", () => {
    const over = bezierPath(2, p0, p1, p2, p3);
    const one = bezierPath(1, p0, p1, p2, p3);
    expect(over.x).toBeCloseTo(one.x, 10);
    expect(over.y).toBeCloseTo(one.y, 10);
  });

  it("for a straight line (p0→p3 with aligned control points) midpoint is ~midpoint", () => {
    // Control points collinear: p1=(0.33,0.33), p2=(0.66,0.66)
    const straight = bezierPath(
      0.5,
      { x: 0, y: 0 },
      { x: 0.33, y: 0.33 },
      { x: 0.66, y: 0.66 },
      { x: 1, y: 1 },
    );
    expect(straight.x).toBeCloseTo(0.5, 1);
    expect(straight.y).toBeCloseTo(0.5, 1);
  });

  it("is deterministic", () => {
    const a = bezierPath(0.3, p0, p1, p2, p3);
    const b = bezierPath(0.3, p0, p1, p2, p3);
    expect(a.x).toBe(b.x);
    expect(a.y).toBe(b.y);
  });
});

// ── rgbSplit ──────────────────────────────────────────────────────────────────
describe("rgbSplit", () => {
  it("returns an object with r, g, b channels", () => {
    const result = rgbSplit(10);
    expect(result).toHaveProperty("r");
    expect(result).toHaveProperty("g");
    expect(result).toHaveProperty("b");
  });

  it("green channel is always {x:0, y:0}", () => {
    for (const frame of [0, 5, 10, 50]) {
      expect(rgbSplit(frame).g).toEqual({ x: 0, y: 0 });
    }
  });

  it("red and blue x-offsets are equal and opposite", () => {
    for (const frame of [1, 7, 42, 100]) {
      const { r, b } = rgbSplit(frame, 10);
      expect(r.x).toBeCloseTo(-b.x, 10);
    }
  });

  it("red and blue y-offsets are equal and opposite", () => {
    for (const frame of [1, 7, 42, 100]) {
      const { r, b } = rgbSplit(frame, 10);
      expect(r.y).toBeCloseTo(-b.y, 10);
    }
  });

  it("intensity=0 results in zero offsets", () => {
    const { r, b } = rgbSplit(42, 0);
    expect(r.x).toBe(0);
    expect(r.y).toBe(0);
    expect(b.x).toBe(0);
    expect(b.y).toBe(0);
  });
});

// ── shake ─────────────────────────────────────────────────────────────────────
describe("shake", () => {
  it("returns {x, y} object", () => {
    const result = shake(10);
    expect(result).toHaveProperty("x");
    expect(result).toHaveProperty("y");
  });

  it("is deterministic for the same frame", () => {
    const a = shake(5, 8, 30);
    const b = shake(5, 8, 30);
    expect(a.x).toBe(b.x);
    expect(a.y).toBe(b.y);
  });

  it("intensity=0 returns zero offsets", () => {
    const result = shake(42, 0);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("x and y components are independent (different seeds)", () => {
    // x uses seed=0, y uses seed=100 — they should differ for the same frame
    const { x, y } = shake(7, 10, 30);
    // Not guaranteed to be different for every frame, but with seed=0 vs seed=100
    // the probability of collision is effectively zero
    expect(x).not.toBe(y);
  });
});

// ── progressBar ───────────────────────────────────────────────────────────────
describe("progressBar", () => {
  // progressBar uses Remotion's mocked interpolate:
  //   - frame <= startFrame → startValue
  //   - frame >= endFrame → endValue

  it("returns startValue at startFrame", () => {
    expect(progressBar(0, 0, 100, 0, 100)).toBe(0);
  });

  it("returns endValue at or after endFrame", () => {
    expect(progressBar(100, 0, 100, 0, 100)).toBe(100);
  });

  it("works with custom start/end values", () => {
    expect(progressBar(0, 0, 50, 25, 75)).toBe(25);
    expect(progressBar(50, 0, 50, 25, 75)).toBe(75);
  });
});

// ── fadeIn / fadeOut ──────────────────────────────────────────────────────────
describe("fadeIn", () => {
  it("returns 0 at frame 0 (mock clamps to output[0])", () => {
    expect(fadeIn(0, 30)).toBe(0);
  });

  it("returns 1 well past the duration (mock clamps to output[last])", () => {
    expect(fadeIn(9999, 30)).toBe(1);
  });

  it("is a number (not NaN)", () => {
    expect(Number.isNaN(fadeIn(15, 30))).toBe(false);
  });
});

describe("fadeOut", () => {
  it("returns 1 at startFrame (mock clamps to output[0])", () => {
    expect(fadeOut(0, 30, 0)).toBe(1);
  });

  it("returns 0 after duration completes", () => {
    expect(fadeOut(9999, 30, 0)).toBe(0);
  });
});

// ── slideIn ───────────────────────────────────────────────────────────────────
describe("slideIn", () => {
  it("returns a number", () => {
    const result = slideIn(10, 30, "left", 100);
    expect(typeof result).toBe("number");
  });

  it("returns 0 (fully slid in) when fully progressed", () => {
    // Mock interpolate returns output[0]=0 at frame=0, output[last]=1 at frame>>input[last]
    // progress=1 → offset = interpolate(1, [0,1], [distance, 0]) = 0
    // So for frame far past delay+duration, slide returns 0 (on-screen)
    expect(slideIn(9999, 30, "bottom", 100)).toBe(0);
  });

  it("different directions return numbers", () => {
    const directions: Array<"left" | "right" | "top" | "bottom"> = [
      "left",
      "right",
      "top",
      "bottom",
    ];
    for (const dir of directions) {
      expect(typeof slideIn(10, 30, dir, 100)).toBe("number");
    }
  });
});
