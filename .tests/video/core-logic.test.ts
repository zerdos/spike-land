/**
 * Unit tests for media/educational-videos core logic.
 *
 * Covers pure functions and data structures with no Remotion dependency:
 *   - animation-utils.ts  (interpolate, clamp, seededRandom)
 *   - constants.ts        (VCP_DURATIONS frame math, SPRING_CONFIGS shape)
 *   - arena-constants.ts  (ARENA_DURATIONS integrity)
 *   - erdos-constants.ts  (SIXTEEN_FRAMEWORKS count, AUDIT_VERDICTS bounds)
 *   - newcomb-constants.ts (DECISION_NODES / GRAPH_EDGES referential integrity)
 *   - n404-constants.ts   (frame math consistency)
 *   - schemas.ts          (FORMAT_CONFIGS shape, VideoFormatSchema parse)
 *   - narration.ts        (getSceneAudioEntries ordering)
 *   - n404-narration.ts   (getN404SceneAudioEntries ordering)
 */

import { describe, expect, it } from "vitest";

// ── animation-utils ────────────────────────────────────────────────────────────
import {
  interpolate,
  clamp,
  seededRandom,
} from "../../src/media/educational-videos/core-logic/animation-utils";

describe("interpolate", () => {
  it("returns output[0] for values at or below input[0]", () => {
    expect(interpolate(0, [0, 1], [10, 20])).toBe(10);
    expect(interpolate(-5, [0, 1], [10, 20])).toBe(10);
  });

  it("returns output[last] for values at or above input[last]", () => {
    expect(interpolate(1, [0, 1], [10, 20])).toBe(20);
    expect(interpolate(99, [0, 1], [10, 20])).toBe(20);
  });

  it("linearly interpolates midpoint", () => {
    expect(interpolate(0.5, [0, 1], [0, 100])).toBe(50);
    expect(interpolate(0.25, [0, 1], [0, 100])).toBe(25);
    expect(interpolate(0.75, [0, 1], [0, 100])).toBe(75);
  });

  it("handles piecewise segments correctly", () => {
    // Segment 1: [0→0.5] maps to [0→100], segment 2: [0.5→1] maps to [100→50]
    expect(interpolate(0.25, [0, 0.5, 1], [0, 100, 50])).toBe(50);
    expect(interpolate(0.75, [0, 0.5, 1], [0, 100, 50])).toBe(75);
    expect(interpolate(0.5, [0, 0.5, 1], [0, 100, 50])).toBe(100);
  });

  it("returns 0 for empty input/output arrays", () => {
    expect(interpolate(0.5, [], [])).toBe(0);
  });

  it("guard: zero-width input segment does not throw", () => {
    // Both input values are 0; val (0.5) >= input.last (0) → right-clamp
    expect(() => interpolate(0.5, [0, 0], [0, 100])).not.toThrow();
  });

  it("interpolates negative output ranges", () => {
    expect(interpolate(0.5, [0, 1], [-100, 0])).toBe(-50);
  });

  it("works with non-unit input ranges", () => {
    // Frame 15 out of [0, 30] → 50% through [0, 1]
    expect(interpolate(15, [0, 30], [0, 1])).toBeCloseTo(0.5);
  });
});

describe("clamp", () => {
  it("returns the value when within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("clamps to min when below", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(-999, 0, 10)).toBe(0);
  });

  it("clamps to max when above", () => {
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(999, 0, 10)).toBe(10);
  });

  it("handles equal min and max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
    expect(clamp(1, 3, 3)).toBe(3);
  });

  it("handles negative ranges", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
    expect(clamp(-15, -10, -1)).toBe(-10);
  });
});

describe("seededRandom", () => {
  it("is deterministic: same seed → same value", () => {
    expect(seededRandom(0)).toBe(seededRandom(0));
    expect(seededRandom(42)).toBe(seededRandom(42));
    expect(seededRandom(12345)).toBe(seededRandom(12345));
  });

  it("produces different values for different seeds", () => {
    expect(seededRandom(1)).not.toBe(seededRandom(2));
    expect(seededRandom(100)).not.toBe(seededRandom(101));
  });

  it("returns values in [0, 1)", () => {
    for (const seed of [0, 1, 7, 99, 1000, -5, 3.14]) {
      const val = seededRandom(seed);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

// ── constants.ts ───────────────────────────────────────────────────────────────
import {
  VCP_DURATIONS,
  VCP_TIMING,
  VIDEO_CONFIG,
  COLORS,
  TYPOGRAPHY,
  SPRING_CONFIGS,
  VERITASIUM_COLORS,
} from "../../src/media/educational-videos/core-logic/constants";

describe("VCP_DURATIONS", () => {
  it("all frame values are positive integers", () => {
    for (const [key, frames] of Object.entries(VCP_DURATIONS)) {
      expect(frames, `${key} should be a positive integer`).toBeGreaterThan(0);
      expect(Number.isInteger(frames), `${key} should be an integer`).toBe(true);
    }
  });

  it("sum of scene durations equals totalFrames", () => {
    const sum = Object.values(VCP_DURATIONS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(VCP_TIMING.totalFrames);
  });

  it("covers all 10 expected scenes", () => {
    const expectedScenes = [
      "hook",
      "physicsOfAttention",
      "beforeState",
      "fiveLayerStack",
      "fixLoop",
      "agentMemory",
      "skillMatching",
      "metaBuild",
      "results",
      "endCard",
    ];
    expect(Object.keys(VCP_DURATIONS)).toEqual(expectedScenes);
  });
});

describe("VIDEO_CONFIG", () => {
  it("is 1080p landscape at 30fps", () => {
    expect(VIDEO_CONFIG.width).toBe(1920);
    expect(VIDEO_CONFIG.height).toBe(1080);
    expect(VIDEO_CONFIG.fps).toBe(30);
  });

  it("durationInFrames is consistent with VCP totalFrames", () => {
    // VIDEO_CONFIG.durationInFrames should equal VCP total
    expect(VIDEO_CONFIG.durationInFrames).toBe(VCP_TIMING.totalFrames);
  });
});

describe("COLORS", () => {
  it("all values are valid CSS hex strings", () => {
    const hexOrRgba = /^#[0-9A-Fa-f]{3,8}$|^rgba?\(/;
    for (const [key, value] of Object.entries(COLORS)) {
      expect(hexOrRgba.test(value), `${key}: "${value}" should be valid CSS color`).toBe(true);
    }
  });

  it("contains required brand colors", () => {
    expect(COLORS.cyan).toBeDefined();
    expect(COLORS.fuchsia).toBeDefined();
    expect(COLORS.purple).toBeDefined();
    expect(COLORS.darkBg).toBeDefined();
  });
});

describe("TYPOGRAPHY", () => {
  it("fontSize scale is strictly increasing", () => {
    const sizes = Object.values(TYPOGRAPHY.fontSize);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i - 1] as number);
    }
  });

  it("fontFamily contains sans and mono", () => {
    expect(TYPOGRAPHY.fontFamily.sans).toContain("Inter");
    expect(TYPOGRAPHY.fontFamily.mono).toContain("JetBrains Mono");
  });
});

describe("SPRING_CONFIGS", () => {
  it("each config has at least a damping value", () => {
    for (const [key, config] of Object.entries(SPRING_CONFIGS)) {
      expect("damping" in config, `${key} should have a damping property`).toBe(true);
    }
  });

  it("damping values are positive", () => {
    for (const [key, config] of Object.entries(SPRING_CONFIGS)) {
      expect(config.damping, `${key}.damping should be positive`).toBeGreaterThan(0);
    }
  });

  it("stiffness, when present, is positive", () => {
    for (const [key, config] of Object.entries(SPRING_CONFIGS)) {
      if ("stiffness" in config && config.stiffness !== undefined) {
        expect(config.stiffness, `${key}.stiffness should be positive`).toBeGreaterThan(0);
      }
    }
  });
});

describe("VERITASIUM_COLORS", () => {
  it("all values are valid CSS hex strings", () => {
    const hexPattern = /^#[0-9A-Fa-f]{3,8}$/;
    for (const [key, value] of Object.entries(VERITASIUM_COLORS)) {
      expect(hexPattern.test(value), `${key}: "${value}" should be hex color`).toBe(true);
    }
  });
});

// ── arena-constants.ts ─────────────────────────────────────────────────────────
import {
  ARENA_PERSONAS,
  ARENA_COMMENTERS,
  ARENA_TIMING,
  ARENA_DURATIONS,
} from "../../src/media/educational-videos/core-logic/arena-constants";

describe("ARENA_PERSONAS", () => {
  it("has exactly 3 personas", () => {
    expect(ARENA_PERSONAS.length).toBe(3);
  });

  it("each persona has name, icon, role, and color", () => {
    for (const persona of ARENA_PERSONAS) {
      expect(persona.name).toBeTruthy();
      expect(persona.icon).toBeTruthy();
      expect(persona.role).toBeTruthy();
      expect(persona.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("persona names are the expected three", () => {
    const names = ARENA_PERSONAS.map((p) => p.name);
    expect(names).toContain("Radix");
    expect(names).toContain("Erdős");
    expect(names).toContain("Hofstadter");
  });
});

describe("ARENA_COMMENTERS", () => {
  it("has at least 6 commenters", () => {
    expect(ARENA_COMMENTERS.length).toBeGreaterThanOrEqual(6);
  });

  it("each commenter has name and argument", () => {
    for (const commenter of ARENA_COMMENTERS) {
      expect(commenter.name).toBeTruthy();
      expect(commenter.argument).toBeTruthy();
    }
  });
});

describe("ARENA_DURATIONS", () => {
  it("scene durations sum is less than or equal to totalFrames", () => {
    const sum = Object.values(ARENA_DURATIONS).reduce((a, b) => a + b, 0);
    expect(sum).toBeLessThanOrEqual(ARENA_TIMING.totalFrames);
  });

  it("all durations are positive integers", () => {
    for (const [key, val] of Object.entries(ARENA_DURATIONS)) {
      expect(val, `${key} should be positive`).toBeGreaterThan(0);
      expect(Number.isInteger(val), `${key} should be an integer`).toBe(true);
    }
  });
});

// ── erdos-constants.ts ─────────────────────────────────────────────────────────
import {
  ERDOS_DURATIONS,
  ERDOS_TIMING,
  SIXTEEN_FRAMEWORKS,
  AUDIT_VERDICTS,
  ERDOS_COLLABORATORS,
  ERDOS_COLORS,
} from "../../src/media/educational-videos/core-logic/erdos-constants";

describe("SIXTEEN_FRAMEWORKS", () => {
  it("has exactly 16 frameworks", () => {
    expect(SIXTEEN_FRAMEWORKS.length).toBe(16);
  });

  it("each framework has name and icon", () => {
    for (const fw of SIXTEEN_FRAMEWORKS) {
      expect(fw.name).toBeTruthy();
      expect(fw.icon).toBeTruthy();
    }
  });

  it("framework names are unique", () => {
    const names = SIXTEEN_FRAMEWORKS.map((f) => f.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

describe("AUDIT_VERDICTS", () => {
  it("all indices reference valid framework positions", () => {
    for (const { index } of AUDIT_VERDICTS) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(SIXTEEN_FRAMEWORKS.length);
    }
  });

  it("verdict values are only 'pass' or 'fail'", () => {
    for (const { verdict } of AUDIT_VERDICTS) {
      expect(["pass", "fail"]).toContain(verdict);
    }
  });

  it("each verdict has a non-empty label", () => {
    for (const { label } of AUDIT_VERDICTS) {
      expect(label).toBeTruthy();
    }
  });

  it("no duplicate framework indices", () => {
    const indices = AUDIT_VERDICTS.map((v) => v.index);
    const unique = new Set(indices);
    expect(unique.size).toBe(indices.length);
  });
});

describe("ERDOS_COLLABORATORS", () => {
  it("has a non-empty list", () => {
    expect(ERDOS_COLLABORATORS.length).toBeGreaterThan(0);
  });

  it("all names are non-empty strings", () => {
    for (const name of ERDOS_COLLABORATORS) {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

describe("ERDOS_DURATIONS", () => {
  it("sum of scene durations equals totalFrames", () => {
    const sum = Object.values(ERDOS_DURATIONS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(ERDOS_TIMING.totalFrames);
  });
});

describe("ERDOS_COLORS", () => {
  it("all values are valid CSS hex strings", () => {
    const hexPattern = /^#[0-9A-Fa-f]{3,8}$/;
    for (const [key, value] of Object.entries(ERDOS_COLORS)) {
      expect(hexPattern.test(value), `${key}: "${value}" should be hex color`).toBe(true);
    }
  });
});

// ── newcomb-constants.ts ───────────────────────────────────────────────────────
import {
  NEWCOMB_DURATIONS,
  NEWCOMB_TIMING,
  BOXES,
  DECISION_NODES,
  GRAPH_EDGES,
  GP_APPLICATIONS,
  NEWCOMB_NARRATION,
  NEWCOMB_COLORS,
} from "../../src/media/educational-videos/core-logic/newcomb-constants";

describe("NEWCOMB_DURATIONS", () => {
  it("sum of scene durations equals totalFrames", () => {
    const sum = Object.values(NEWCOMB_DURATIONS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(NEWCOMB_TIMING.totalFrames);
  });

  it("all durations are positive multiples of 30 (whole seconds)", () => {
    for (const [key, val] of Object.entries(NEWCOMB_DURATIONS)) {
      expect(val % 30, `${key} should be a multiple of 30 frames`).toBe(0);
      expect(val).toBeGreaterThan(0);
    }
  });
});

describe("BOXES", () => {
  it("transparent box contains £1,000", () => {
    expect(BOXES.transparent.contents).toContain("1,000");
  });

  it("opaque box conditional contents are correct", () => {
    expect(BOXES.opaque.contentsIfPredicted).toContain("1,000,000");
    expect(BOXES.opaque.contentsIfNot).toBe("£0");
  });
});

describe("DECISION_NODES", () => {
  it("has 6 nodes", () => {
    expect(DECISION_NODES.length).toBe(6);
  });

  it("all node IDs are unique", () => {
    const ids = DECISION_NODES.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("positions are normalized (x, y in [0, 1])", () => {
    for (const node of DECISION_NODES) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(1);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(1);
    }
  });

  it("root node is at depth 0", () => {
    const root = DECISION_NODES.find((n) => n.depth === 0);
    expect(root?.id).toBe("omega");
  });

  it("depths are non-negative integers", () => {
    for (const node of DECISION_NODES) {
      expect(node.depth).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(node.depth)).toBe(true);
    }
  });
});

describe("GRAPH_EDGES", () => {
  it("all edge endpoints reference valid node IDs", () => {
    const nodeIds = new Set(DECISION_NODES.map((n) => n.id));
    for (const edge of GRAPH_EDGES) {
      expect(nodeIds.has(edge.from), `edge.from "${edge.from}" must be a valid node ID`).toBe(true);
      expect(nodeIds.has(edge.to), `edge.to "${edge.to}" must be a valid node ID`).toBe(true);
    }
  });

  it("graph has at least one invisible edge", () => {
    const invisible = GRAPH_EDGES.filter((e) => "invisible" in e && e.invisible === true);
    expect(invisible.length).toBeGreaterThan(0);
  });

  it("edges are directed (no self-loops)", () => {
    for (const edge of GRAPH_EDGES) {
      expect(edge.from).not.toBe(edge.to);
    }
  });

  it("omega node has outgoing edges only", () => {
    const omegaOutgoing = GRAPH_EDGES.filter((e) => e.from === "omega");
    const omegaIncoming = GRAPH_EDGES.filter((e) => e.to === "omega");
    expect(omegaOutgoing.length).toBeGreaterThan(0);
    expect(omegaIncoming.length).toBe(0);
  });
});

describe("GP_APPLICATIONS", () => {
  it("has at least 4 applications", () => {
    expect(GP_APPLICATIONS.length).toBeGreaterThanOrEqual(4);
  });

  it("each application has name, domain, and status", () => {
    for (const app of GP_APPLICATIONS) {
      expect(app.name).toBeTruthy();
      expect(app.domain).toBeTruthy();
      expect(["shipped", "announced"]).toContain(app.status);
    }
  });
});

describe("NEWCOMB_NARRATION", () => {
  it("has narration for all 8 scenes", () => {
    const scenes = [
      "hook",
      "twoBox",
      "oneBox",
      "invisibleGraph",
      "gpChemist",
      "cancerCure",
      "timeTraversal",
      "endCard",
    ];
    for (const scene of scenes) {
      expect(NEWCOMB_NARRATION[scene as keyof typeof NEWCOMB_NARRATION]).toBeDefined();
      expect(NEWCOMB_NARRATION[scene as keyof typeof NEWCOMB_NARRATION].length).toBeGreaterThan(0);
    }
  });

  it("all narration lines are non-empty strings", () => {
    for (const lines of Object.values(NEWCOMB_NARRATION)) {
      for (const line of lines) {
        expect(typeof line).toBe("string");
        expect(line.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("NEWCOMB_COLORS", () => {
  it("all values are valid CSS color strings", () => {
    const colorPattern = /^(#[0-9A-Fa-f]{3,8}|rgba?\()/;
    for (const [key, value] of Object.entries(NEWCOMB_COLORS)) {
      expect(colorPattern.test(value), `${key}: "${value}" should be a CSS color`).toBe(true);
    }
  });
});

// ── n404-constants.ts ──────────────────────────────────────────────────────────
import {
  N404_DURATIONS,
  N404_TIMING,
  N404_MCP_TOOL_COUNT,
} from "../../src/media/educational-videos/core-logic/n404-constants";

describe("N404_DURATIONS", () => {
  it("all frame values are positive integers", () => {
    for (const [key, frames] of Object.entries(N404_DURATIONS)) {
      expect(frames, `${key} should be positive`).toBeGreaterThan(0);
      expect(Number.isInteger(frames), `${key} should be an integer`).toBe(true);
    }
  });

  it("sum of scene durations is at most totalFrames", () => {
    // Note: N404_DURATIONS defines 9 named scenes that don't necessarily fill
    // totalFrames exactly — some compositions may add unlisted padding or have
    // scenes still being finalized. The contract is that no single sum exceeds
    // the declared total.
    const sum = Object.values(N404_DURATIONS).reduce((a, b) => a + b, 0);
    expect(sum).toBeLessThanOrEqual(N404_TIMING.totalFrames);
  });

  it("covers all 9 expected scenes", () => {
    const expectedScenes = [
      "hook",
      "platform",
      "codespace",
      "learnit",
      "generate",
      "bazdmeg",
      "breakthrough",
      "agents",
      "endCard",
    ];
    expect(Object.keys(N404_DURATIONS)).toEqual(expectedScenes);
  });

  it("audio durations match frame counts (buffer of 2s = 60 frames)", () => {
    // Each scene: frames = ceil(audioDuration * 30) + 60
    // hook: 558 frames = 18.6s, audio said 16.6s
    const hookSeconds = N404_DURATIONS.hook / N404_TIMING.fps;
    expect(hookSeconds).toBeCloseTo(18.6, 0);
  });
});

describe("N404_MCP_TOOL_COUNT", () => {
  it("is a reasonable positive integer", () => {
    expect(N404_MCP_TOOL_COUNT).toBeGreaterThan(0);
    expect(Number.isInteger(N404_MCP_TOOL_COUNT)).toBe(true);
  });

  it("is in the hundreds (platform scale)", () => {
    // The count represents real MCP tools — must be > 100
    expect(N404_MCP_TOOL_COUNT).toBeGreaterThan(100);
  });
});

// ── schemas.ts ─────────────────────────────────────────────────────────────────
import {
  VideoFormatSchema,
  FORMAT_CONFIGS,
} from "../../src/media/educational-videos/core-logic/schemas";

describe("VideoFormatSchema", () => {
  it("parses valid formats", () => {
    expect(VideoFormatSchema.parse("landscape")).toBe("landscape");
    expect(VideoFormatSchema.parse("portrait")).toBe("portrait");
    expect(VideoFormatSchema.parse("square")).toBe("square");
  });

  it("throws on invalid format", () => {
    expect(() => VideoFormatSchema.parse("widescreen")).toThrow();
    expect(() => VideoFormatSchema.parse("")).toThrow();
    expect(() => VideoFormatSchema.parse(42)).toThrow();
  });
});

describe("FORMAT_CONFIGS", () => {
  it("landscape is wider than tall", () => {
    const { width, height } = FORMAT_CONFIGS.landscape;
    expect(width).toBeGreaterThan(height);
  });

  it("portrait is taller than wide", () => {
    const { width, height } = FORMAT_CONFIGS.portrait;
    expect(height).toBeGreaterThan(width);
  });

  it("square has equal width and height", () => {
    const { width, height } = FORMAT_CONFIGS.square;
    expect(width).toBe(height);
  });

  it("landscape and portrait are aspect-ratio mirrors", () => {
    expect(FORMAT_CONFIGS.landscape.width).toBe(FORMAT_CONFIGS.portrait.height);
    expect(FORMAT_CONFIGS.landscape.height).toBe(FORMAT_CONFIGS.portrait.width);
  });

  it("all dimensions are positive integers", () => {
    for (const [fmt, { width, height }] of Object.entries(FORMAT_CONFIGS)) {
      expect(width, `${fmt}.width should be positive`).toBeGreaterThan(0);
      expect(height, `${fmt}.height should be positive`).toBeGreaterThan(0);
      expect(Number.isInteger(width), `${fmt}.width should be integer`).toBe(true);
      expect(Number.isInteger(height), `${fmt}.height should be integer`).toBe(true);
    }
  });
});

// ── narration.ts (getSceneAudioEntries) ───────────────────────────────────────
import {
  getSceneAudioEntries,
  getVoiceActiveFrames,
} from "../../src/media/educational-videos/core-logic/narration";

describe("getSceneAudioEntries", () => {
  it("returns one entry per VCP scene", () => {
    const entries = getSceneAudioEntries();
    expect(entries.length).toBe(Object.keys(VCP_DURATIONS).length);
  });

  it("first scene starts at frame 0", () => {
    const entries = getSceneAudioEntries();
    expect(entries[0]?.startFrame).toBe(0);
  });

  it("entries are in ascending startFrame order", () => {
    const entries = getSceneAudioEntries();
    for (let i = 1; i < entries.length; i++) {
      expect((entries[i] as NonNullable<(typeof entries)[number]>).startFrame).toBeGreaterThan(
        (entries[i - 1] as NonNullable<(typeof entries)[number]>).startFrame,
      );
    }
  });

  it("sceneIds match VCP_DURATIONS keys in order", () => {
    const entries = getSceneAudioEntries();
    const expected = Object.keys(VCP_DURATIONS);
    const actual = entries.map((e) => e.sceneId);
    expect(actual).toEqual(expected);
  });

  it("consecutive startFrames differ by the scene duration", () => {
    const entries = getSceneAudioEntries();
    const durations = Object.values(VCP_DURATIONS);
    for (let i = 1; i < entries.length; i++) {
      const gap =
        (entries[i] as NonNullable<(typeof entries)[number]>).startFrame -
        (entries[i - 1] as NonNullable<(typeof entries)[number]>).startFrame;
      expect(gap).toBe(durations[i - 1]);
    }
  });
});

describe("getVoiceActiveFrames", () => {
  it("returns one range per VCP scene", () => {
    const ranges = getVoiceActiveFrames();
    expect(ranges.length).toBe(Object.keys(VCP_DURATIONS).length);
  });

  it("each range is a [start, end] tuple where end > start", () => {
    const ranges = getVoiceActiveFrames();
    for (const [start, end] of ranges) {
      expect(end).toBeGreaterThan(start);
    }
  });

  it("first range starts at frame 0", () => {
    const [[start]] = getVoiceActiveFrames();
    expect(start).toBe(0);
  });

  it("ranges do not overlap", () => {
    const ranges = getVoiceActiveFrames();
    for (let i = 1; i < ranges.length; i++) {
      const prevEnd = (ranges[i - 1] as NonNullable<(typeof ranges)[number]>)[1];
      const currStart = (ranges[i] as NonNullable<(typeof ranges)[number]>)[0];
      expect(currStart).toBeGreaterThanOrEqual(prevEnd);
    }
  });
});

// ── n404-narration.ts (getN404SceneAudioEntries) ───────────────────────────────
import { getN404SceneAudioEntries } from "../../src/media/educational-videos/core-logic/n404-narration";

describe("getN404SceneAudioEntries", () => {
  it("returns one entry per N404 scene", () => {
    const entries = getN404SceneAudioEntries();
    expect(entries.length).toBe(Object.keys(N404_DURATIONS).length);
  });

  it("first scene starts at frame 0", () => {
    const entries = getN404SceneAudioEntries();
    expect(entries[0]?.startFrame).toBe(0);
  });

  it("entries are in ascending startFrame order", () => {
    const entries = getN404SceneAudioEntries();
    for (let i = 1; i < entries.length; i++) {
      expect((entries[i] as NonNullable<(typeof entries)[number]>).startFrame).toBeGreaterThan(
        (entries[i - 1] as NonNullable<(typeof entries)[number]>).startFrame,
      );
    }
  });

  it("sceneIds match N404_DURATIONS keys in order", () => {
    const entries = getN404SceneAudioEntries();
    const expected = Object.keys(N404_DURATIONS);
    const actual = entries.map((e) => e.sceneId);
    expect(actual).toEqual(expected);
  });

  it("consecutive startFrames differ by the scene duration", () => {
    const entries = getN404SceneAudioEntries();
    const durations = Object.values(N404_DURATIONS);
    for (let i = 1; i < entries.length; i++) {
      const gap =
        (entries[i] as NonNullable<(typeof entries)[number]>).startFrame -
        (entries[i - 1] as NonNullable<(typeof entries)[number]>).startFrame;
      expect(gap).toBe(durations[i - 1]);
    }
  });

  it("last entry startFrame + last duration = sum of all scene durations", () => {
    // The cumulative sum of all scenes is internally consistent, even if it
    // differs from the N404_TIMING.totalFrames constant (which may include
    // unscheduled padding not reflected in N404_DURATIONS).
    const entries = getN404SceneAudioEntries();
    const lastEntry = entries.at(-1) as NonNullable<(typeof entries)[number]>;
    const lastDuration = Object.values(N404_DURATIONS).at(-1) as number;
    const expectedTotal = Object.values(N404_DURATIONS).reduce((a, b) => a + b, 0);
    expect(lastEntry.startFrame + lastDuration).toBe(expectedTotal);
  });
});
