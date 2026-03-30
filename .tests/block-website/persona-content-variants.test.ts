import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getContentVariant,
  getPersonaGroup,
  getPersonaSlug,
} from "../../src/core/block-website/core-logic/persona-content-variants";

// ---------------------------------------------------------------------------
// getPersonaGroup
// ---------------------------------------------------------------------------

describe("getPersonaGroup", () => {
  it("maps technical developer personas to the 'technical' group", () => {
    const technicalPersonas = [
      "ai-indie",
      "classic-indie",
      "agency-dev",
      "in-house-dev",
      "ml-engineer",
      "ai-hobbyist",
      "enterprise-devops",
      "startup-devops",
    ];
    for (const slug of technicalPersonas) {
      expect(getPersonaGroup(slug), `expected 'technical' for ${slug}`).toBe("technical");
    }
  });

  it("maps founder personas to the 'founder' group", () => {
    expect(getPersonaGroup("technical-founder")).toBe("founder");
    expect(getPersonaGroup("nontechnical-founder")).toBe("founder");
  });

  it("maps leader personas to the 'leader' group", () => {
    expect(getPersonaGroup("growth-leader")).toBe("leader");
    expect(getPersonaGroup("ops-leader")).toBe("leader");
  });

  it("maps creative personas to the 'creative' group", () => {
    const creativePersonas = [
      "content-creator",
      "hobbyist-creator",
      "social-gamer",
      "solo-explorer",
    ];
    for (const slug of creativePersonas) {
      expect(getPersonaGroup(slug), `expected 'creative' for ${slug}`).toBe("creative");
    }
  });

  it("falls back to 'creative' for unknown persona slugs", () => {
    expect(getPersonaGroup("totally-unknown-persona")).toBe("creative");
    expect(getPersonaGroup("")).toBe("creative");
  });
});

// ---------------------------------------------------------------------------
// getContentVariant
// ---------------------------------------------------------------------------

describe("getContentVariant", () => {
  it("returns an advanced quiz difficulty for technical personas", () => {
    const variant = getContentVariant("ai-indie");
    expect(variant.group).toBe("technical");
    expect(variant.quizDifficulty).toBe("advanced");
  });

  it("returns standard quiz difficulty for non-technical personas", () => {
    expect(getContentVariant("nontechnical-founder").quizDifficulty).toBe("standard");
    expect(getContentVariant("growth-leader").quizDifficulty).toBe("standard");
    expect(getContentVariant("solo-explorer").quizDifficulty).toBe("standard");
  });

  it("returns non-empty support copy for every known group", () => {
    for (const slug of ["ai-indie", "technical-founder", "growth-leader", "solo-explorer"]) {
      const variant = getContentVariant(slug);
      expect(variant.supportCopy.length, `missing supportCopy for ${slug}`).toBeGreaterThan(0);
    }
  });

  it("returns non-empty expandedCategories for every known group", () => {
    for (const slug of ["ml-engineer", "nontechnical-founder", "ops-leader", "hobbyist-creator"]) {
      const variant = getContentVariant(slug);
      expect(
        variant.expandedCategories.length,
        `missing expandedCategories for ${slug}`,
      ).toBeGreaterThan(0);
    }
  });

  it("returns creative defaults for unknown persona slugs", () => {
    const variant = getContentVariant("made-up-slug");
    expect(variant.group).toBe("creative");
  });

  it("returns the same object reference for the same group", () => {
    // Both are 'technical' — should return the same variant data
    const a = getContentVariant("ai-indie");
    const b = getContentVariant("startup-devops");
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// getPersonaSlug
// ---------------------------------------------------------------------------

describe("getPersonaSlug", () => {
  describe("SSR / non-browser environment", () => {
    it("returns 'solo-explorer' when window is undefined", () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error intentionally deleting window to simulate SSR
      delete globalThis.window;
      try {
        expect(getPersonaSlug()).toBe("solo-explorer");
      } finally {
        globalThis.window = originalWindow;
      }
    });
  });

  describe("browser environment (jsdom)", () => {
    beforeEach(() => {
      // Clear cookies and localStorage before each test
      document.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .forEach((name) => {
          if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it("returns 'solo-explorer' when no cookie or localStorage entry exists", () => {
      expect(getPersonaSlug()).toBe("solo-explorer");
    });

    it("reads from the spike-persona cookie first", () => {
      document.cookie = "spike-persona=technical-founder";
      expect(getPersonaSlug()).toBe("technical-founder");
    });

    it("reads from spike_persona_slug in localStorage when no cookie", () => {
      localStorage.setItem("spike_persona_slug", "ml-engineer");
      expect(getPersonaSlug()).toBe("ml-engineer");
    });

    it("reads from spike_persona in localStorage as a fallback", () => {
      localStorage.setItem("spike_persona", "solo-explorer");
      expect(getPersonaSlug()).toBe("solo-explorer");
    });

    it("prefers spike_persona_slug over spike_persona when both are set", () => {
      localStorage.setItem("spike_persona_slug", "ai-indie");
      localStorage.setItem("spike_persona", "ops-leader");
      expect(getPersonaSlug()).toBe("ai-indie");
    });

    it("returns 'solo-explorer' when localStorage throws", () => {
      const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
      try {
        expect(getPersonaSlug()).toBe("solo-explorer");
      } finally {
        getItemSpy.mockRestore();
      }
    });
  });
});
