import { describe, it, expect, beforeEach } from "vitest";
import { InsightStore } from "../../src/mcp-tools/pageindex/core-logic/self-improve.js";

describe("InsightStore", () => {
  let store: InsightStore;

  beforeEach(() => {
    store = new InsightStore(5);
  });

  it("adds and retrieves insights", () => {
    store.add({
      docId: "doc_1",
      query: "Mi a bevétel?",
      answer: "A bevétel 100M Ft.",
      citations: ["page 3"],
      confidence: 0.9,
    });

    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0].query).toBe("Mi a bevétel?");
  });

  it("evicts oldest when over limit", () => {
    for (let i = 0; i < 7; i++) {
      store.add({
        docId: "doc_1",
        query: `Kérdés ${i}`,
        answer: `Válasz ${i}`,
        citations: [],
        confidence: 0.5,
      });
    }

    expect(store.getAll()).toHaveLength(5);
    expect(store.getAll()[0].query).toBe("Kérdés 2"); // 0 and 1 evicted
  });

  it("finds relevant insights by keyword", () => {
    store.add({
      docId: "d1",
      query: "bevétel összeg",
      answer: "100M",
      citations: [],
      confidence: 0.9,
    });
    store.add({
      docId: "d1",
      query: "költségek részletei",
      answer: "50M",
      citations: [],
      confidence: 0.8,
    });
    store.add({
      docId: "d1",
      query: "profit margin",
      answer: "50%",
      citations: [],
      confidence: 0.7,
    });

    const results = store.findRelevant("bevétel");
    expect(results).toHaveLength(1);
    expect(results[0].answer).toBe("100M");
  });

  it("builds context string from relevant insights", () => {
    store.add({
      docId: "d1",
      query: "bevétel összeg",
      answer: "100M Ft volt a bevétel",
      citations: ["page 5"],
      confidence: 0.9,
    });

    const ctx = store.buildContext("bevétel");
    expect(ctx).toContain("Korábbi releváns megállapítások");
    expect(ctx).toContain("bevétel");
  });

  it("returns undefined context when no relevant insights", () => {
    const ctx = store.buildContext("nonexistent topic xyz");
    expect(ctx).toBeUndefined();
  });

  it("clears all insights", () => {
    store.add({ docId: "d1", query: "test", answer: "answer", citations: [], confidence: 0.5 });
    store.clear();
    expect(store.getAll()).toHaveLength(0);
  });

  it("serializes and deserializes", () => {
    store.add({
      docId: "d1",
      query: "kérdés",
      answer: "válasz",
      citations: ["p1"],
      confidence: 0.8,
    });

    const json = store.toJSON();
    const store2 = new InsightStore();
    store2.loadJSON(json);

    expect(store2.getAll()).toHaveLength(1);
    expect(store2.getAll()[0].query).toBe("kérdés");
  });
});
