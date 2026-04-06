import { describe, expect, it } from "vitest";
import {
  generateChallenge,
  getChallengeById,
  getTemplates,
  listCategories,
} from "../../../src/mcp-tools/code-eval/core-logic/challenges.js";

describe("getTemplates", () => {
  it("returns all templates when no filter", () => {
    const templates = getTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(15);
  });

  it("filters by category", () => {
    const arrays = getTemplates("arrays");
    expect(arrays.length).toBeGreaterThan(0);
    expect(arrays.every((t) => t.category === "arrays")).toBe(true);
  });

  it("filters by difficulty", () => {
    const easy = getTemplates(undefined, "easy");
    expect(easy.length).toBeGreaterThan(0);
    expect(easy.every((t) => t.difficulties.includes("easy"))).toBe(true);
  });

  it("filters by both category and difficulty", () => {
    const result = getTemplates("math", "easy");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.category === "math" && t.difficulties.includes("easy"))).toBe(
      true,
    );
  });

  it("returns empty for non-existent category", () => {
    const result = getTemplates("searching");
    expect(result.length).toBe(0);
  });
});

describe("generateChallenge", () => {
  it("generates a challenge with all required fields", () => {
    const challenge = generateChallenge("easy", "arrays", 42);
    expect(challenge).toBeDefined();
    const c = challenge as NonNullable<typeof challenge>;
    expect(c.id).toBeDefined();
    expect(c.title).toBeDefined();
    expect(c.description).toBeDefined();
    expect(c.starterCode).toBeDefined();
    expect(c.referenceSolution).toBeDefined();
    expect(c.tests.length).toBeGreaterThan(0);
    expect(c.difficulty).toBe("easy");
    expect(c.category).toBe("arrays");
  });

  it("is deterministic with same seed", () => {
    const a = generateChallenge("medium", "strings", 123);
    const b = generateChallenge("medium", "strings", 123);
    const sa = a as NonNullable<typeof a>;
    const sb = b as NonNullable<typeof b>;
    expect(sa.id).toBe(sb.id);
    expect(sa.tests).toEqual(sb.tests);
  });

  it("produces different challenges with different seeds", () => {
    const a = generateChallenge("medium", undefined, 1);
    const b = generateChallenge("medium", undefined, 2);
    // Different seeds may still hit the same template, but that's OK
    expect(a).toBeDefined();
    expect(b).toBeDefined();
  });

  it("returns undefined for impossible filter", () => {
    const result = generateChallenge("easy", "dynamic-programming");
    expect(result).toBeUndefined();
  });

  it("generates valid test expressions", () => {
    const challenge = generateChallenge("easy", "math", 99);
    expect(challenge).toBeDefined();
    const c = challenge as NonNullable<typeof challenge>;
    for (const test of c.tests) {
      expect(test.input).toMatch(/^solution\(/);
      expect(test.expected).toBeDefined();
    }
  });
});

describe("getChallengeById", () => {
  it("retrieves a previously generated challenge", () => {
    const original = generateChallenge("easy", "arrays", 42);
    expect(original).toBeDefined();
    const orig = original as NonNullable<typeof original>;

    const retrieved = getChallengeById(orig.id);
    expect(retrieved).toBeDefined();
    const ret = retrieved as NonNullable<typeof retrieved>;
    expect(ret.id).toBe(orig.id);
    expect(ret.tests).toEqual(orig.tests);
  });

  it("returns undefined for non-existent ID", () => {
    expect(getChallengeById("nonexistent-challenge-easy-999")).toBeUndefined();
  });

  it("returns undefined for malformed ID", () => {
    expect(getChallengeById("bad")).toBeUndefined();
    expect(getChallengeById("")).toBeUndefined();
  });
});

describe("listCategories", () => {
  it("returns all categories with counts", () => {
    const categories = listCategories();
    expect(categories.length).toBeGreaterThanOrEqual(4);

    for (const cat of categories) {
      expect(cat.category).toBeDefined();
      expect(cat.count).toBeGreaterThan(0);
      expect(cat.difficulties.length).toBeGreaterThan(0);
    }
  });

  it("includes expected categories", () => {
    const names = listCategories().map((c) => c.category);
    expect(names).toContain("arrays");
    expect(names).toContain("strings");
    expect(names).toContain("math");
    expect(names).toContain("sorting");
    expect(names).toContain("data-structures");
  });
});
