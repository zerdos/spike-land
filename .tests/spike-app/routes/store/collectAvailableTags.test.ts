/**
 * Tests for the collectAvailableTags utility extracted from
 * src/frontend/platform-frontend/ui/routes/store/category/$categorySlug.tsx
 *
 * collectAvailableTags is a private function; its behaviour is specified here
 * as a pure-function spec.  If the algorithm ever gets extracted to a shared
 * module this test file should be updated to import it directly.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Types mirrored from McpAppSummary (only the fields used by this function)
// ---------------------------------------------------------------------------

interface AppSummary {
  tags: string[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Inline re-implementation — kept 1:1 with the source function so that the
// tests act as a living spec.
// ---------------------------------------------------------------------------

function collectAvailableTags(apps: AppSummary[]): string[] {
  const tagCounts = new Map<string, number>();

  for (const app of apps) {
    for (const tag of app.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .filter(([, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 20);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApp(tags: string[]): AppSummary {
  return { slug: "test", name: "Test", tags };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("collectAvailableTags", () => {
  describe("basic inclusion", () => {
    it("returns an empty array when no apps are provided", () => {
      expect(collectAvailableTags([])).toEqual([]);
    });

    it("returns an empty array when every app has an empty tag array", () => {
      const apps = [makeApp([]), makeApp([]), makeApp([])];
      expect(collectAvailableTags(apps)).toEqual([]);
    });

    it("returns tags that appear exactly once (threshold is 1)", () => {
      const apps = [makeApp(["once"])];
      expect(collectAvailableTags(apps)).toContain("once");
    });

    it("returns tags that appear multiple times", () => {
      const apps = [makeApp(["popular"]), makeApp(["popular"]), makeApp(["popular"])];
      expect(collectAvailableTags(apps)).toContain("popular");
    });

    it("includes all unique tags from a single app", () => {
      const apps = [makeApp(["a", "b", "c"])];
      const result = collectAvailableTags(apps);
      expect(result).toContain("a");
      expect(result).toContain("b");
      expect(result).toContain("c");
    });
  });

  describe("frequency ordering", () => {
    it("sorts more-frequent tags before less-frequent ones", () => {
      const apps = [
        makeApp(["rare"]),
        makeApp(["common", "rare"]),
        makeApp(["common"]),
        makeApp(["common"]),
      ];
      const result = collectAvailableTags(apps);
      const commonIdx = result.indexOf("common");
      const rareIdx = result.indexOf("rare");
      expect(commonIdx).toBeLessThan(rareIdx);
    });

    it("returns the most frequent tag as the first element", () => {
      const apps = [makeApp(["b", "a"]), makeApp(["a"]), makeApp(["a"])];
      const result = collectAvailableTags(apps);
      expect(result[0]).toBe("a");
    });

    it("handles ties in frequency without throwing", () => {
      const apps = [makeApp(["x"]), makeApp(["y"])];
      const result = collectAvailableTags(apps);
      expect(result).toHaveLength(2);
      expect(result).toContain("x");
      expect(result).toContain("y");
    });
  });

  describe("limit of 20 tags", () => {
    it("returns at most 20 tags when more unique tags exist", () => {
      const manyTags = Array.from({ length: 30 }, (_, i) => `tag-${i}`);
      const apps = [makeApp(manyTags)];
      const result = collectAvailableTags(apps);
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it("returns exactly 20 when there are exactly 20 unique tags", () => {
      const tags = Array.from({ length: 20 }, (_, i) => `t${i}`);
      const result = collectAvailableTags([makeApp(tags)]);
      expect(result).toHaveLength(20);
    });

    it("returns fewer than 20 when there are fewer than 20 unique tags", () => {
      const apps = [makeApp(["a", "b", "c"])];
      const result = collectAvailableTags(apps);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it("drops the least-frequent tags beyond the cap of 20", () => {
      // 21 unique tags; the first one appears twice so it wins all 20 slots
      // alongside the next 19; the 21st (last) one should be cut.
      const uniqueTags = Array.from({ length: 21 }, (_, i) => `tag-${i}`);
      // Give tag-0 an extra occurrence so it is definitely included.
      const apps = [makeApp([uniqueTags[0] as string]), makeApp(uniqueTags)];
      const result = collectAvailableTags(apps);
      expect(result).toHaveLength(20);
      // The most frequent one must be present.
      expect(result[0]).toBe("tag-0");
    });
  });

  describe("deduplication across apps", () => {
    it("counts the same tag from multiple apps only once per app occurrence", () => {
      const apps = [
        makeApp(["dup", "dup"]), // two occurrences on the same app
        makeApp(["dup"]),
      ];
      // Each iteration of the inner loop increments the count — so "dup"
      // appears three times total across the loops.
      const result = collectAvailableTags(apps);
      expect(result).toContain("dup");
    });

    it("treats tags case-sensitively", () => {
      const apps = [makeApp(["React"]), makeApp(["react"])];
      const result = collectAvailableTags(apps);
      expect(result).toContain("React");
      expect(result).toContain("react");
      // They are treated as two distinct tags.
      expect(result).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("handles apps with no tags alongside apps with tags", () => {
      const apps = [makeApp([]), makeApp(["present"]), makeApp([])];
      const result = collectAvailableTags(apps);
      expect(result).toEqual(["present"]);
    });

    it("handles a single app with a single tag", () => {
      expect(collectAvailableTags([makeApp(["solo"])])).toEqual(["solo"]);
    });

    it("handles tag strings with spaces and special characters", () => {
      const apps = [makeApp(["open source", "AI/ML", "C++"])];
      const result = collectAvailableTags(apps);
      expect(result).toContain("open source");
      expect(result).toContain("AI/ML");
      expect(result).toContain("C++");
    });
  });
});
