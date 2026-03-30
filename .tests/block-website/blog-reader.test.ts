import { describe, expect, it } from "vitest";
import {
  buildReaderTimeline,
  estimateReaderSeconds,
  findReaderBlockIndexByTime,
  formatReaderTime,
  normalizeReaderText,
} from "../../src/core/block-website/core-logic/blog-reader";
import type { ReaderBlock } from "../../src/core/block-website/core-logic/blog-reader";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlock(
  text: string,
  overrides: Partial<Omit<ReaderBlock, "text" | "words">> = {},
): ReaderBlock {
  const normalized = text.replace(/\s+/g, " ").trim();
  return {
    element: {} as HTMLElement,
    id: overrides.id ?? "block-0",
    kind: overrides.kind ?? "p",
    text: normalized,
    words: normalized.split(" ").filter(Boolean).length,
  };
}

// ---------------------------------------------------------------------------
// normalizeReaderText
// ---------------------------------------------------------------------------

describe("normalizeReaderText", () => {
  it("collapses multiple spaces into one", () => {
    expect(normalizeReaderText("hello   world")).toBe("hello world");
  });

  it("collapses tabs and newlines", () => {
    expect(normalizeReaderText("foo\t\nbar")).toBe("foo bar");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeReaderText("  hello  ")).toBe("hello");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeReaderText("   \n\t")).toBe("");
  });

  it("leaves already-clean text unchanged", () => {
    expect(normalizeReaderText("clean text")).toBe("clean text");
  });
});

// ---------------------------------------------------------------------------
// estimateReaderSeconds
// ---------------------------------------------------------------------------

describe("estimateReaderSeconds", () => {
  const WPM = 165;

  it("returns 0 for empty text", () => {
    expect(estimateReaderSeconds("", 1)).toBe(0);
  });

  it("returns 0 for whitespace-only text", () => {
    expect(estimateReaderSeconds("   ", 1)).toBe(0);
  });

  it("estimates seconds for a known word count at rate 1", () => {
    // 165 words at rate 1 = 60 seconds exactly, but min is 1.25
    const text = Array.from({ length: 165 }, () => "word").join(" ");
    const result = estimateReaderSeconds(text, 1);
    expect(result).toBe(60);
  });

  it("scales inversely with rate (faster rate = fewer seconds)", () => {
    const text = Array.from({ length: WPM }, () => "word").join(" ");
    const slow = estimateReaderSeconds(text, 0.5);
    const fast = estimateReaderSeconds(text, 2.0);
    expect(slow).toBeGreaterThan(fast);
  });

  it("clamps rate to a minimum of 0.6 (prevents absurdly long estimates)", () => {
    const text = "one two three";
    const at0 = estimateReaderSeconds(text, 0);
    const at06 = estimateReaderSeconds(text, 0.6);
    expect(at0).toBe(at06);
  });

  it("enforces a minimum result of 1.25 seconds for any non-empty text", () => {
    // Single very short word — seconds would be tiny without the floor
    const result = estimateReaderSeconds("hi", 1);
    expect(result).toBeGreaterThanOrEqual(1.25);
  });

  it("rounds result to 2 decimal places", () => {
    const text = "one two three four five";
    const result = estimateReaderSeconds(text, 1);
    expect(String(result).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// buildReaderTimeline
// ---------------------------------------------------------------------------

describe("buildReaderTimeline", () => {
  it("returns an empty array for no blocks", () => {
    expect(buildReaderTimeline([], 1)).toEqual([]);
  });

  it("builds sequential start/end times", () => {
    const blocks = [makeBlock("one two"), makeBlock("three four five")];
    const timeline = buildReaderTimeline(blocks, 1);

    expect(timeline).toHaveLength(2);
    expect(timeline[0]?.start).toBe(0);
    expect(timeline[1]?.start).toBe(timeline[0]?.end);
  });

  it("each entry's end equals start + seconds", () => {
    const blocks = [makeBlock("hello world"), makeBlock("foo bar baz")];
    const timeline = buildReaderTimeline(blocks, 1);

    for (const entry of timeline) {
      expect(entry.end).toBeCloseTo(entry.start + entry.seconds, 5);
    }
  });

  it("references the correct block in each entry", () => {
    const blocks = [makeBlock("block one", { id: "b1" }), makeBlock("block two", { id: "b2" })];
    const timeline = buildReaderTimeline(blocks, 1);

    expect(timeline[0]?.block.id).toBe("b1");
    expect(timeline[1]?.block.id).toBe("b2");
  });

  it("produces larger seconds at slower rates", () => {
    const blocks = [makeBlock("some text here")];
    const slow = buildReaderTimeline(blocks, 0.7);
    const normal = buildReaderTimeline(blocks, 1);

    expect(slow[0]?.seconds).toBeGreaterThan(normal[0]?.seconds ?? 0);
  });
});

// ---------------------------------------------------------------------------
// findReaderBlockIndexByTime
// ---------------------------------------------------------------------------

describe("findReaderBlockIndexByTime", () => {
  it("returns 0 for an empty timeline", () => {
    expect(findReaderBlockIndexByTime([], 10)).toBe(0);
  });

  it("returns 0 when target is before the first entry", () => {
    const blocks = [makeBlock("hello world"), makeBlock("foo bar")];
    const timeline = buildReaderTimeline(blocks, 1);
    expect(findReaderBlockIndexByTime(timeline, 0)).toBe(0);
  });

  it("returns the last index when target is past the end", () => {
    const blocks = [makeBlock("one"), makeBlock("two")];
    const timeline = buildReaderTimeline(blocks, 1);
    const lastEnd = timeline.at(-1)?.end ?? 0;
    expect(findReaderBlockIndexByTime(timeline, lastEnd + 100)).toBe(1);
  });

  it("correctly identifies the block index for a mid-timeline time", () => {
    // Build a timeline with known word counts so we can predict durations
    const blocks = [
      makeBlock(Array.from({ length: 165 }, () => "word").join(" "), { id: "b0" }),
      makeBlock(Array.from({ length: 165 }, () => "word").join(" "), { id: "b1" }),
    ];
    const timeline = buildReaderTimeline(blocks, 1);
    // First block ends at ~60s; querying at 30s should give block 0
    expect(findReaderBlockIndexByTime(timeline, 30)).toBe(0);
    // Querying at 70s should give block 1
    expect(findReaderBlockIndexByTime(timeline, 70)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// formatReaderTime
// ---------------------------------------------------------------------------

describe("formatReaderTime", () => {
  it("formats zero seconds as 0:00", () => {
    expect(formatReaderTime(0)).toBe("0:00");
  });

  it("formats sub-minute times correctly", () => {
    expect(formatReaderTime(45)).toBe("0:45");
  });

  it("pads single-digit seconds with a leading zero", () => {
    expect(formatReaderTime(61)).toBe("1:01");
  });

  it("formats exactly one minute as 1:00", () => {
    expect(formatReaderTime(60)).toBe("1:00");
  });

  it("formats multi-minute times correctly", () => {
    expect(formatReaderTime(125)).toBe("2:05");
    expect(formatReaderTime(3600)).toBe("60:00");
  });

  it("floors fractional seconds before formatting", () => {
    expect(formatReaderTime(59.9)).toBe("0:59");
  });

  it("clamps negative seconds to zero", () => {
    expect(formatReaderTime(-5)).toBe("0:00");
  });
});
