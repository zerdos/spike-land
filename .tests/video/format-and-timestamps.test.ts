/**
 * Tests for:
 *   - video/lib/format-context.tsx  (getFormat, formatValue — exported for testing)
 *   - core-logic/n404-narration-timestamps.ts (data integrity)
 *   - core-logic/narration-timestamps.ts      (data integrity)
 */

import { describe, expect, it } from "vitest";

// ── FORMAT_CONFIGS / VideoFormatSchema (re-imported for completeness) ──────────
import { FORMAT_CONFIGS } from "../../src/media/educational-videos/core-logic/schemas";

/**
 * Replicate the getFormat logic from format-context.tsx (pure function).
 * It is not exported from that module, so we mirror it here and verify
 * it against FORMAT_CONFIGS to ensure the constants match the logic.
 */
function getFormat(width: number, height: number): "landscape" | "portrait" | "square" {
  if (width === height) return "square";
  if (height > width) return "portrait";
  return "landscape";
}

describe("getFormat (mirrored logic from format-context)", () => {
  it("returns landscape for 1920×1080", () => {
    expect(getFormat(1920, 1080)).toBe("landscape");
  });

  it("returns portrait for 1080×1920", () => {
    expect(getFormat(1080, 1920)).toBe("portrait");
  });

  it("returns square for 1080×1080", () => {
    expect(getFormat(1080, 1080)).toBe("square");
  });

  it("returns landscape for any width > height", () => {
    expect(getFormat(800, 600)).toBe("landscape");
    expect(getFormat(1280, 720)).toBe("landscape");
  });

  it("returns portrait for any height > width", () => {
    expect(getFormat(600, 800)).toBe("portrait");
    expect(getFormat(720, 1280)).toBe("portrait");
  });

  it("returns square for any width === height", () => {
    expect(getFormat(100, 100)).toBe("square");
    expect(getFormat(512, 512)).toBe("square");
  });

  it("FORMAT_CONFIGS keys agree with getFormat logic", () => {
    expect(getFormat(FORMAT_CONFIGS.landscape.width, FORMAT_CONFIGS.landscape.height)).toBe(
      "landscape",
    );
    expect(getFormat(FORMAT_CONFIGS.portrait.width, FORMAT_CONFIGS.portrait.height)).toBe(
      "portrait",
    );
    expect(getFormat(FORMAT_CONFIGS.square.width, FORMAT_CONFIGS.square.height)).toBe("square");
  });
});

/**
 * formatValue selects from a { landscape, portrait, square } record.
 * Mirror the pure function for testing.
 */
function formatValue<T>(
  format: "landscape" | "portrait" | "square",
  values: { landscape: T; portrait: T; square: T },
): T {
  return values[format];
}

describe("formatValue (mirrored logic from format-context)", () => {
  it("returns the landscape value for landscape format", () => {
    expect(formatValue("landscape", { landscape: 1920, portrait: 1080, square: 1080 })).toBe(1920);
  });

  it("returns the portrait value for portrait format", () => {
    expect(formatValue("portrait", { landscape: "wide", portrait: "tall", square: "equal" })).toBe(
      "tall",
    );
  });

  it("returns the square value for square format", () => {
    expect(formatValue("square", { landscape: false, portrait: false, square: true })).toBe(true);
  });

  it("works with object values", () => {
    const sizes = { landscape: { w: 1920 }, portrait: { w: 1080 }, square: { w: 1080 } };
    expect(formatValue("landscape", sizes)).toEqual({ w: 1920 });
  });
});

// ── N404_NARRATION_TIMESTAMPS data integrity ───────────────────────────────────
import { N404_NARRATION_TIMESTAMPS } from "../../src/media/educational-videos/core-logic/n404-narration-timestamps";
import { N404_DURATIONS } from "../../src/media/educational-videos/core-logic/n404-constants";

describe("N404_NARRATION_TIMESTAMPS", () => {
  it("has an entry for every N404 scene", () => {
    for (const key of Object.keys(N404_DURATIONS)) {
      expect(N404_NARRATION_TIMESTAMPS[key], `Missing timestamps for scene "${key}"`).toBeDefined();
    }
  });

  it("audioDurationSeconds is positive for every scene", () => {
    for (const [key, entry] of Object.entries(N404_NARRATION_TIMESTAMPS)) {
      expect(
        entry.audioDurationSeconds,
        `${key}.audioDurationSeconds should be > 0`,
      ).toBeGreaterThan(0);
    }
  });

  it("audioDurationSeconds is shorter than scene frame duration in seconds", () => {
    const fps = 30;
    for (const [key, entry] of Object.entries(N404_NARRATION_TIMESTAMPS)) {
      const sceneDurationSec = (N404_DURATIONS[key as keyof typeof N404_DURATIONS] ?? 0) / fps;
      expect(
        entry.audioDurationSeconds,
        `${key}: audio (${entry.audioDurationSeconds}s) should be <= scene duration (${sceneDurationSec}s)`,
      ).toBeLessThanOrEqual(sceneDurationSec);
    }
  });

  it("words array is non-empty for every scene", () => {
    for (const [key, entry] of Object.entries(N404_NARRATION_TIMESTAMPS)) {
      expect(entry.words.length, `${key} should have words`).toBeGreaterThan(0);
    }
  });

  it("word timestamps are in ascending order within each scene", () => {
    for (const [key, entry] of Object.entries(N404_NARRATION_TIMESTAMPS)) {
      for (let i = 1; i < entry.words.length; i++) {
        const prev = entry.words[i - 1] as NonNullable<(typeof entry.words)[number]>;
        const curr = entry.words[i] as NonNullable<(typeof entry.words)[number]>;
        expect(
          curr.start,
          `${key}[${i}].start (${curr.start}) should be >= prev.start (${prev.start})`,
        ).toBeGreaterThanOrEqual(prev.start);
      }
    }
  });

  it("word end >= word start for every word", () => {
    for (const [key, entry] of Object.entries(N404_NARRATION_TIMESTAMPS)) {
      for (const word of entry.words) {
        expect(
          word.end,
          `${key}: word "${word.word}" end (${word.end}) should be >= start (${word.start})`,
        ).toBeGreaterThanOrEqual(word.start);
      }
    }
  });

  it("all words are non-empty strings", () => {
    for (const [key, entry] of Object.entries(N404_NARRATION_TIMESTAMPS)) {
      for (const word of entry.words) {
        expect(word.word.length, `${key}: word should be non-empty`).toBeGreaterThan(0);
      }
    }
  });

  it("last word end is approximately equal to audioDurationSeconds", () => {
    for (const [key, entry] of Object.entries(N404_NARRATION_TIMESTAMPS)) {
      const lastWord = entry.words.at(-1);
      if (!lastWord) continue;
      expect(
        lastWord.end,
        `${key}: last word end should be ≤ audioDurationSeconds`,
      ).toBeLessThanOrEqual(entry.audioDurationSeconds + 0.1); // 100ms tolerance
    }
  });
});

// ── NARRATION_TIMESTAMPS (VCP) data integrity ──────────────────────────────────
import { NARRATION_TIMESTAMPS } from "../../src/media/educational-videos/core-logic/narration-timestamps";
import { VCP_DURATIONS } from "../../src/media/educational-videos/core-logic/constants";

describe("NARRATION_TIMESTAMPS (VCP)", () => {
  it("has an entry for every VCP scene", () => {
    for (const key of Object.keys(VCP_DURATIONS)) {
      expect(NARRATION_TIMESTAMPS[key], `Missing timestamps for scene "${key}"`).toBeDefined();
    }
  });

  it("audioDurationSeconds is positive for every scene", () => {
    for (const [key, entry] of Object.entries(NARRATION_TIMESTAMPS)) {
      expect(
        entry.audioDurationSeconds,
        `${key}.audioDurationSeconds should be > 0`,
      ).toBeGreaterThan(0);
    }
  });

  it("audioDurationSeconds is shorter than scene frame duration in seconds", () => {
    const fps = 30;
    for (const [key, entry] of Object.entries(NARRATION_TIMESTAMPS)) {
      const sceneDurationSec = (VCP_DURATIONS[key as keyof typeof VCP_DURATIONS] ?? 0) / fps;
      expect(
        entry.audioDurationSeconds,
        `${key}: audio (${entry.audioDurationSeconds}s) should be <= scene duration (${sceneDurationSec}s)`,
      ).toBeLessThanOrEqual(sceneDurationSec);
    }
  });

  it("words array is non-empty for every scene", () => {
    for (const [key, entry] of Object.entries(NARRATION_TIMESTAMPS)) {
      expect(entry.words.length, `${key} should have words`).toBeGreaterThan(0);
    }
  });

  it("word timestamps are in ascending order", () => {
    for (const [key, entry] of Object.entries(NARRATION_TIMESTAMPS)) {
      for (let i = 1; i < entry.words.length; i++) {
        const prev = entry.words[i - 1] as NonNullable<(typeof entry.words)[number]>;
        const curr = entry.words[i] as NonNullable<(typeof entry.words)[number]>;
        expect(
          curr.start,
          `${key}[${i}]: word start should be non-decreasing`,
        ).toBeGreaterThanOrEqual(prev.start);
      }
    }
  });

  it("word end >= word start for every word", () => {
    for (const [_key, entry] of Object.entries(NARRATION_TIMESTAMPS)) {
      for (const word of entry.words) {
        expect(word.end).toBeGreaterThanOrEqual(word.start);
      }
    }
  });
});
