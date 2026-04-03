import { describe, it, expect, beforeEach } from "vitest";
import { InsightStore } from "../../src/mcp-tools/pageindex/core-logic/self-improve.js";

describe("InsightStore", () => {
  let store: InsightStore;

  beforeEach(() => {
    store = new InsightStore(5);
  });

  it("adds and retrieves insights with normalized query", () => {
    const insight = store.add({
      docId: "doc_1",
      query: "Mi a bevétel?",
      answer: "A bevétel 100M Ft.",
      citations: ["page 3"],
      confidence: 0.9,
    });

    expect(store.getAll()).toHaveLength(1);
    expect(insight.queryNorm).toBeTruthy();
    expect(insight.tags.length).toBeGreaterThan(0);
    expect(insight.hitCount).toBe(1);
  });

  it("deduplicates similar queries — bumps hitCount instead of adding new", () => {
    store.add({
      docId: "doc_1",
      query: "pénzügyi bevétel összege részletes kimutatás éves",
      answer: "100M",
      citations: [],
      confidence: 0.8,
    });
    store.add({
      docId: "doc_1",
      query: "pénzügyi bevétel összege részletes kimutatás teljes éves",
      answer: "100M Ft a teljes bevétel részletesen",
      citations: ["p3"],
      confidence: 0.8,
    });

    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0].hitCount).toBe(2);
    // Longer answer should replace shorter
    expect(store.getAll()[0].answer).toContain("teljes bevétel");
  });

  it("evicts lowest-score insights when over limit", () => {
    for (let i = 0; i < 7; i++) {
      store.add({
        docId: `doc_${i}`, // different docs to avoid dedup
        query: `Kérdés ${i} valami egyedi szó${i}`,
        answer: `Válasz ${i}`,
        citations: [],
        confidence: i * 0.1,
      });
    }

    expect(store.getAll()).toHaveLength(5);
  });

  it("finds relevant insights by cosine similarity", () => {
    store.add({
      docId: "d1",
      query: "bevétel összeg pénzügyi",
      answer: "100M",
      citations: [],
      confidence: 0.9,
    });
    store.add({
      docId: "d2",
      query: "költségek részletei kiadások",
      answer: "50M",
      citations: [],
      confidence: 0.8,
    });
    store.add({
      docId: "d3",
      query: "profit margin haszon",
      answer: "50%",
      citations: [],
      confidence: 0.7,
    });

    const results = store.findRelevant("bevétel pénzügyi adat");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].answer).toBe("100M");
  });

  it("builds context string with confidence percentages", () => {
    store.add({
      docId: "d1",
      query: "bevétel összeg adat",
      answer: "100M Ft volt a bevétel az előző évben",
      citations: ["page 5"],
      confidence: 0.9,
    });

    const ctx = store.buildContext("bevétel adat");
    expect(ctx).toContain("self-improving kontextus");
    expect(ctx).toContain("90%");
  });

  it("returns undefined context when no relevant insights", () => {
    const ctx = store.buildContext("nonexistent topic xyz");
    expect(ctx).toBeUndefined();
  });

  it("rates insights up and down", () => {
    const insight = store.add({
      docId: "d1",
      query: "teszt kérdés hosszú szöveg",
      answer: "válasz",
      citations: [],
      confidence: 0.5,
    });

    const rated = store.rate(insight.id, 1);
    expect(rated).toBeDefined();
    expect(rated!.confidence).toBeGreaterThan(0.5);
    expect(rated!.feedback).toBe(1);

    const downrated = store.rate(insight.id, -1);
    expect(downrated!.feedback).toBe(0);
  });

  it("rate returns undefined for unknown id", () => {
    expect(store.rate("nonexistent", 1)).toBeUndefined();
  });

  it("computes stats", () => {
    store.add({
      docId: "d1",
      query: "kérdés egyes valami",
      answer: "válasz",
      citations: [],
      confidence: 0.8,
    });
    store.add({
      docId: "d2",
      query: "kérdés kettes másik",
      answer: "válasz",
      citations: [],
      confidence: 0.6,
    });

    const s = store.stats();
    expect(s.total).toBe(2);
    expect(s.avgConfidence).toBeCloseTo(0.7, 1);
    expect(s.topTags.length).toBeGreaterThan(0);
  });

  it("stats returns zeros for empty store", () => {
    const s = store.stats();
    expect(s.total).toBe(0);
    expect(s.avgConfidence).toBe(0);
  });

  it("clears all insights", () => {
    store.add({
      docId: "d1",
      query: "teszt kérdés szöveg",
      answer: "answer",
      citations: [],
      confidence: 0.5,
    });
    store.clear();
    expect(store.getAll()).toHaveLength(0);
  });

  it("serializes and deserializes with all fields", () => {
    store.add({
      docId: "d1",
      query: "kérdés valami hosszabb",
      answer: "válasz szöveg itt",
      citations: ["p1"],
      confidence: 0.8,
    });

    const json = store.toJSON();
    const store2 = new InsightStore();
    store2.loadJSON(json);

    expect(store2.getAll()).toHaveLength(1);
    const restored = store2.getAll()[0];
    expect(restored.queryNorm).toBeTruthy();
    expect(restored.tags.length).toBeGreaterThan(0);
    expect(restored.hitCount).toBe(1);
  });
});
