/**
 * Tests for pure logic functions extracted from moonshot-arena/ui/MusicWidget.tsx.
 *
 * Functions under test are NOT exported from the source module (they are
 * module-internal helpers). We inline the implementations here so we can test
 * them in isolation without importing the React component, which requires
 * AudioContext / canvas / framer-motion and would force a full jsdom+Web-Audio
 * environment.
 *
 * If the implementations in MusicWidget.tsx ever change, update the copies here
 * to match.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// ── Inlined implementations (mirrors MusicWidget.tsx) ────────────────────────

const SECTIONS = [
  { name: "Intro", bars: 4 },
  { name: "Minden összefügg", bars: 8 },
  { name: "Build-up", bars: 4 },
  { name: "Összefüggés", bars: 8 },
  { name: "Breakdown", bars: 4 },
  { name: "Outro", bars: 4 },
];

const SECTION_STEPS = SECTIONS.map((s) => s.bars * 16);
const TOTAL_STEPS = SECTION_STEPS.reduce((a, b) => a + b, 0);

function getSectionForStep(step: number): number {
  let acc = 0;
  for (let i = 0; i < SECTION_STEPS.length; i++) {
    acc += SECTION_STEPS[i] ?? 0;
    if (step < acc) return i;
  }
  return 0;
}

function getSectionProgress(step: number): number {
  let acc = 0;
  for (let i = 0; i < SECTION_STEPS.length; i++) {
    const sLen = SECTION_STEPS[i] ?? 0;
    if (step < acc + sLen) return (step - acc) / sLen;
    acc += sLen;
  }
  return 0;
}

const STORAGE_KEY_VOLUME = "moonshot-music-volume";

function readStorage(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota exceeded or blocked */
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("moonshot-arena: SECTIONS / SECTION_STEPS constants", () => {
  it("has 6 sections", () => {
    expect(SECTIONS).toHaveLength(6);
  });

  it("SECTION_STEPS is steps = bars * 16 for each section", () => {
    SECTIONS.forEach((s, i) => {
      expect(SECTION_STEPS[i]).toBe(s.bars * 16);
    });
  });

  it("TOTAL_STEPS equals 512 (32 bars * 16 steps)", () => {
    // 4+8+4+8+4+4 = 32 bars, 32 * 16 = 512
    expect(TOTAL_STEPS).toBe(512);
  });
});

describe("getSectionForStep", () => {
  it("returns 0 for step 0 (first step of Intro)", () => {
    expect(getSectionForStep(0)).toBe(0);
  });

  it("returns 0 for the last step of Intro (step 63)", () => {
    // Intro: bars=4 → 64 steps, indices 0-63
    expect(getSectionForStep(63)).toBe(0);
  });

  it("returns 1 at the first step of section 1 (step 64)", () => {
    expect(getSectionForStep(64)).toBe(1);
  });

  it("returns 1 for the last step of section 1", () => {
    // Section 1: bars=8 → 128 steps, indices 64-191
    expect(getSectionForStep(191)).toBe(1);
  });

  it("returns 2 at the first step of Build-up (step 192)", () => {
    expect(getSectionForStep(192)).toBe(2);
  });

  it("returns 3 for a step inside Összefüggés (drop section)", () => {
    // Section 3 starts at step 192+64=256, spans 8 bars = 128 steps (256-383)
    expect(getSectionForStep(256)).toBe(3);
    expect(getSectionForStep(383)).toBe(3);
  });

  it("returns 4 for Breakdown section steps", () => {
    // Section 4 starts at 384, spans 4 bars = 64 steps (384-447)
    expect(getSectionForStep(384)).toBe(4);
    expect(getSectionForStep(447)).toBe(4);
  });

  it("returns 5 for Outro section steps", () => {
    // Section 5 starts at 448, spans 4 bars = 64 steps (448-511)
    expect(getSectionForStep(448)).toBe(5);
    expect(getSectionForStep(511)).toBe(5);
  });

  it("returns 0 (fallback) when step equals TOTAL_STEPS (boundary past end)", () => {
    // The loop exhausts all sections and falls through — returns 0
    expect(getSectionForStep(TOTAL_STEPS)).toBe(0);
  });
});

describe("getSectionProgress", () => {
  it("returns 0 at the very start of a section", () => {
    // Step 0 is the first step of section 0
    expect(getSectionProgress(0)).toBe(0);
  });

  it("returns 0 at the first step of section 1", () => {
    expect(getSectionProgress(64)).toBe(0);
  });

  it("returns a mid-section fraction for Intro", () => {
    // Intro has 64 steps. Step 32 is halfway through.
    expect(getSectionProgress(32)).toBeCloseTo(0.5, 5);
  });

  it("returns a mid-section fraction for section 1 (128 steps)", () => {
    // Section 1 starts at 64, has 128 steps. Step 64+64=128 is halfway.
    expect(getSectionProgress(128)).toBeCloseTo(0.5, 5);
  });

  it("approaches 1 at the last step of a section without reaching it", () => {
    // Last step of Intro: step 63 → progress = 63/64
    const progress = getSectionProgress(63);
    expect(progress).toBeGreaterThan(0.98);
    expect(progress).toBeLessThan(1);
  });

  it("returns 0 (fallback) when step equals TOTAL_STEPS (past end)", () => {
    expect(getSectionProgress(TOTAL_STEPS)).toBe(0);
  });

  it("is monotonically increasing within each section", () => {
    // Sample a few steps within the Breakdown section (section 4: steps 384-447)
    const steps = [384, 400, 416, 432, 447];
    const progressValues = steps.map(getSectionProgress);
    for (let i = 1; i < progressValues.length; i++) {
      expect(progressValues[i]).toBeGreaterThan(progressValues[i - 1] as number);
    }
  });
});

describe("readStorage / writeStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("readStorage returns fallback when key is absent", () => {
    expect(readStorage(STORAGE_KEY_VOLUME, "0.4")).toBe("0.4");
  });

  it("readStorage returns stored value when key is present", () => {
    localStorage.setItem(STORAGE_KEY_VOLUME, "0.7");
    expect(readStorage(STORAGE_KEY_VOLUME, "0.4")).toBe("0.7");
  });

  it("writeStorage persists a value that readStorage can retrieve", () => {
    writeStorage(STORAGE_KEY_VOLUME, "0.9");
    expect(readStorage(STORAGE_KEY_VOLUME, "0.4")).toBe("0.9");
  });

  it("writeStorage overwrites a previously stored value", () => {
    writeStorage(STORAGE_KEY_VOLUME, "0.3");
    writeStorage(STORAGE_KEY_VOLUME, "0.6");
    expect(readStorage(STORAGE_KEY_VOLUME, "0.4")).toBe("0.6");
  });

  it("readStorage returns fallback when localStorage.getItem throws", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(readStorage(STORAGE_KEY_VOLUME, "0.5")).toBe("0.5");
    spy.mockRestore();
  });

  it("writeStorage silently swallows an error from localStorage.setItem", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    // Should not throw
    expect(() => writeStorage(STORAGE_KEY_VOLUME, "0.8")).not.toThrow();
    spy.mockRestore();
  });

  it("volume string round-trips through storage as a parseable float", () => {
    const originalVolume = 0.42;
    writeStorage(STORAGE_KEY_VOLUME, String(originalVolume));
    const retrieved = parseFloat(readStorage(STORAGE_KEY_VOLUME, "0.4"));
    expect(retrieved).toBeCloseTo(originalVolume, 5);
  });
});
