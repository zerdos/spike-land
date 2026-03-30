/**
 * Tests for PrdDefinitionSchema and PrdLevel validation (types.ts)
 * Covers all field constraints: lengths, array limits, required fields, defaults.
 */

import { describe, expect, it } from "vitest";
import { PrdDefinitionSchema, PrdLevel } from "../core-logic/types.js";

function validBase() {
  return {
    id: "platform",
    level: "platform" as const,
    name: "Platform",
    summary: "A valid summary under 120 chars",
    tokenEstimate: 200,
  };
}

describe("PrdLevel", () => {
  it("accepts all valid level values", () => {
    const levels = ["platform", "domain", "route", "app", "tool-category"];
    for (const level of levels) {
      expect(() => PrdLevel.parse(level)).not.toThrow();
    }
  });

  it("rejects unknown level values", () => {
    expect(() => PrdLevel.parse("unknown")).toThrow();
    expect(() => PrdLevel.parse("service")).toThrow();
    expect(() => PrdLevel.parse("")).toThrow();
  });
});

describe("PrdDefinitionSchema", () => {
  describe("required fields", () => {
    it("parses a minimal valid PRD", () => {
      const result = PrdDefinitionSchema.parse(validBase());
      expect(result.id).toBe("platform");
      expect(result.level).toBe("platform");
      expect(result.name).toBe("Platform");
      expect(result.summary).toBe("A valid summary under 120 chars");
      expect(result.tokenEstimate).toBe(200);
    });

    it("rejects empty id", () => {
      expect(() => PrdDefinitionSchema.parse({ ...validBase(), id: "" })).toThrow();
    });

    it("rejects empty name", () => {
      expect(() => PrdDefinitionSchema.parse({ ...validBase(), name: "" })).toThrow();
    });

    it("rejects invalid level", () => {
      expect(() => PrdDefinitionSchema.parse({ ...validBase(), level: "invalid" })).toThrow();
    });

    it("rejects missing tokenEstimate", () => {
      const { tokenEstimate: _, ...rest } = validBase();
      expect(() => PrdDefinitionSchema.parse(rest)).toThrow();
    });

    it("rejects non-positive tokenEstimate", () => {
      expect(() => PrdDefinitionSchema.parse({ ...validBase(), tokenEstimate: 0 })).toThrow();
      expect(() => PrdDefinitionSchema.parse({ ...validBase(), tokenEstimate: -1 })).toThrow();
    });

    it("rejects non-integer tokenEstimate", () => {
      expect(() => PrdDefinitionSchema.parse({ ...validBase(), tokenEstimate: 1.5 })).toThrow();
    });
  });

  describe("summary constraint (max 120 chars)", () => {
    it("accepts summary at exactly 120 chars", () => {
      const summary = "x".repeat(120);
      const result = PrdDefinitionSchema.parse({ ...validBase(), summary });
      expect(result.summary).toBe(summary);
    });

    it("rejects summary over 120 chars", () => {
      expect(() =>
        PrdDefinitionSchema.parse({ ...validBase(), summary: "x".repeat(121) }),
      ).toThrow();
    });
  });

  describe("purpose constraint (optional, max 300 chars)", () => {
    it("accepts purpose under 300 chars", () => {
      const purpose = "x".repeat(300);
      const result = PrdDefinitionSchema.parse({ ...validBase(), purpose });
      expect(result.purpose).toBe(purpose);
    });

    it("rejects purpose over 300 chars", () => {
      expect(() =>
        PrdDefinitionSchema.parse({ ...validBase(), purpose: "x".repeat(301) }),
      ).toThrow();
    });

    it("omits purpose when not provided", () => {
      const result = PrdDefinitionSchema.parse(validBase());
      expect(result.purpose).toBeUndefined();
    });
  });

  describe("context constraint (optional, max 500 chars)", () => {
    it("accepts context at exactly 500 chars", () => {
      const context = "x".repeat(500);
      const result = PrdDefinitionSchema.parse({ ...validBase(), context });
      expect(result.context).toBe(context);
    });

    it("rejects context over 500 chars", () => {
      expect(() =>
        PrdDefinitionSchema.parse({ ...validBase(), context: "x".repeat(501) }),
      ).toThrow();
    });

    it("omits context when not provided", () => {
      const result = PrdDefinitionSchema.parse(validBase());
      expect(result.context).toBeUndefined();
    });
  });

  describe("constraints array (max 8)", () => {
    it("accepts up to 8 constraints", () => {
      const constraints = Array.from({ length: 8 }, (_, i) => `constraint-${i}`);
      const result = PrdDefinitionSchema.parse({ ...validBase(), constraints });
      expect(result.constraints).toHaveLength(8);
    });

    it("rejects more than 8 constraints", () => {
      const constraints = Array.from({ length: 9 }, (_, i) => `constraint-${i}`);
      expect(() => PrdDefinitionSchema.parse({ ...validBase(), constraints })).toThrow();
    });

    it("defaults to empty array when omitted", () => {
      const result = PrdDefinitionSchema.parse(validBase());
      expect(result.constraints).toEqual([]);
    });
  });

  describe("acceptance array (max 5)", () => {
    it("accepts up to 5 acceptance criteria", () => {
      const acceptance = Array.from({ length: 5 }, (_, i) => `criteria-${i}`);
      const result = PrdDefinitionSchema.parse({ ...validBase(), acceptance });
      expect(result.acceptance).toHaveLength(5);
    });

    it("rejects more than 5 acceptance criteria", () => {
      const acceptance = Array.from({ length: 6 }, (_, i) => `criteria-${i}`);
      expect(() => PrdDefinitionSchema.parse({ ...validBase(), acceptance })).toThrow();
    });

    it("defaults to empty array when omitted", () => {
      const result = PrdDefinitionSchema.parse(validBase());
      expect(result.acceptance).toEqual([]);
    });
  });

  describe("array defaults", () => {
    it("defaults toolCategories to empty array", () => {
      const result = PrdDefinitionSchema.parse(validBase());
      expect(result.toolCategories).toEqual([]);
    });

    it("defaults tools to empty array", () => {
      const result = PrdDefinitionSchema.parse(validBase());
      expect(result.tools).toEqual([]);
    });

    it("defaults composesFrom to empty array", () => {
      const result = PrdDefinitionSchema.parse(validBase());
      expect(result.composesFrom).toEqual([]);
    });

    it("defaults routePatterns to empty array", () => {
      const result = PrdDefinitionSchema.parse(validBase());
      expect(result.routePatterns).toEqual([]);
    });

    it("defaults keywords to empty array", () => {
      const result = PrdDefinitionSchema.parse(validBase());
      expect(result.keywords).toEqual([]);
    });
  });

  describe("version default", () => {
    it("defaults version to 1.0.0", () => {
      const result = PrdDefinitionSchema.parse(validBase());
      expect(result.version).toBe("1.0.0");
    });

    it("accepts custom version", () => {
      const result = PrdDefinitionSchema.parse({ ...validBase(), version: "2.1.0" });
      expect(result.version).toBe("2.1.0");
    });
  });

  describe("full PRD round-trip", () => {
    it("parses a fully-populated PRD without information loss", () => {
      const input = {
        id: "app:chess-arena",
        level: "app" as const,
        name: "Chess Arena",
        summary: "Multiplayer chess with ELO rankings",
        purpose: "A flagship chess experience",
        constraints: ["Moves validated server-side", "ELO updates are atomic"],
        acceptance: ["Two players can complete a game", "Leaderboard reflects rankings"],
        context: "Part of the gaming vertical",
        toolCategories: ["chess-game", "chess-player"],
        tools: ["chess_create_game", "chess_make_move"],
        composesFrom: ["platform", "domain:app-building"],
        routePatterns: ["/apps/chess-arena"],
        keywords: ["chess", "game", "elo"],
        tokenEstimate: 400,
        version: "1.0.0",
      };
      const result = PrdDefinitionSchema.parse(input);
      expect(result).toMatchObject(input);
    });
  });
});
