import { describe, it, expect, beforeEach } from "vitest";
import {
  InsightStore,
  TopicTree,
  cosineSimilarity,
} from "../../src/mcp-tools/pageindex/core-logic/self-improve.js";

describe("cosineSimilarity", () => {
  it("returns 0 for empty strings", () => {
    expect(cosineSimilarity("", "")).toBe(0);
    expect(cosineSimilarity("hello", "")).toBe(0);
  });

  it("returns 1 for identical single-word strings", () => {
    expect(cosineSimilarity("hello", "hello")).toBe(1);
  });

  it("returns partial score for overlapping words", () => {
    const score = cosineSimilarity("bevétel összeg pénzügyi", "bevétel adat pénzügyi");
    expect(score).toBeGreaterThan(0.3);
    expect(score).toBeLessThan(1);
  });
});

describe("TopicTree", () => {
  let tree: TopicTree;

  beforeEach(() => {
    tree = new TopicTree(4);
  });

  it("classifies insights into new topics", () => {
    const insight = {
      id: "ins_1",
      docId: "d1",
      query: "bevétel összeg",
      queryNorm: "bevetel osszeg",
      answer: "100M",
      citations: [],
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      confidence: 0.8,
      hitCount: 1,
      feedback: 0,
      tags: ["bevetel", "osszeg", "penzugyi"],
    };

    const topicId = tree.classify(insight);
    expect(topicId).toBeTruthy();
    expect(tree.root.children.length).toBe(1);
  });

  it("routes similar insights to the same topic", () => {
    const base = {
      docId: "d1",
      citations: [] as string[],
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      confidence: 0.8,
      hitCount: 1,
      feedback: 0,
    };

    const i1 = {
      ...base,
      id: "ins_1",
      query: "bevétel összeg pénzügyi adat",
      queryNorm: "bevetel osszeg penzugyi adat",
      answer: "100M",
      tags: ["bevetel", "osszeg", "penzugyi", "adat"],
    };
    const i2 = {
      ...base,
      id: "ins_2",
      query: "bevétel összeg kimutatás részletes",
      queryNorm: "bevetel osszeg kimutatas reszletes",
      answer: "150M",
      tags: ["bevetel", "osszeg", "kimutatas"],
    };

    tree.classify(i1);
    tree.classify(i2);

    // Should be routed to same topic
    expect(tree.root.children.length).toBe(1);
    expect(tree.root.children[0].insightIds).toHaveLength(2);
  });

  it("creates separate topics for unrelated insights", () => {
    const base = {
      docId: "d1",
      citations: [] as string[],
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      confidence: 0.8,
      hitCount: 1,
      feedback: 0,
    };

    tree.classify({
      ...base,
      id: "ins_1",
      query: "bevétel összeg kimutatás",
      queryNorm: "bevetel osszeg kimutatas",
      answer: "100M",
      tags: ["bevetel", "osszeg", "kimutatas"],
    });
    tree.classify({
      ...base,
      id: "ins_2",
      query: "költségek kiadások bontás",
      queryNorm: "koltsegek kiadasok bontas",
      answer: "50M",
      tags: ["koltsegek", "kiadasok", "bontas"],
    });

    expect(tree.root.children.length).toBe(2);
  });

  it("finds relevant topics by query", () => {
    const base = {
      docId: "d1",
      citations: [] as string[],
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      confidence: 0.8,
      hitCount: 1,
      feedback: 0,
    };

    tree.classify({
      ...base,
      id: "ins_1",
      query: "bevétel összeg",
      queryNorm: "bevetel osszeg",
      answer: "100M",
      tags: ["bevetel", "osszeg"],
    });

    const topics = tree.findRelevantTopics("bevetel", 3);
    expect(topics.length).toBeGreaterThan(0);
  });

  it("rebalances when exceeding maxChildren", () => {
    const base = {
      docId: "d_",
      citations: [] as string[],
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      confidence: 0.8,
      hitCount: 1,
      feedback: 0,
    };

    // Add 6 unrelated insights to force rebalance (max=4)
    for (let i = 0; i < 6; i++) {
      const word = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"][i];
      tree.classify({
        ...base,
        id: `ins_${i}`,
        docId: `d_${i}`,
        query: `${word} unique topic special`,
        queryNorm: `${word} unique topic special`,
        answer: `answer ${i}`,
        tags: [word, "unique", "topic"],
      });
    }

    // After rebalance, root should have <= maxChildren
    expect(tree.root.children.length).toBeLessThanOrEqual(4);
  });

  it("returns stats", () => {
    const s = tree.stats();
    expect(s.topicCount).toBe(1); // root only
    expect(s.maxDepth).toBe(0);
  });

  it("serializes and deserializes", () => {
    const base = {
      docId: "d1",
      citations: [] as string[],
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      confidence: 0.8,
      hitCount: 1,
      feedback: 0,
    };
    tree.classify({
      ...base,
      id: "ins_1",
      query: "teszt kerdes",
      queryNorm: "teszt kerdes",
      answer: "answer",
      tags: ["teszt", "kerdes"],
    });

    const json = tree.toJSON();
    const tree2 = new TopicTree();
    tree2.loadJSON(json);
    expect(tree2.root.children.length).toBe(1);
  });
});

describe("InsightStore", () => {
  let store: InsightStore;

  beforeEach(() => {
    store = new InsightStore(5);
  });

  it("adds and retrieves insights with normalized query and topic", () => {
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
    expect(insight.topicId).toBeTruthy();
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
    expect(store.getAll()[0].answer).toContain("teljes bevétel");
  });

  it("evicts lowest-score insights when over limit", () => {
    for (let i = 0; i < 7; i++) {
      store.add({
        docId: `doc_${i}`,
        query: `Kérdés ${i} valami egyedi szó${i}`,
        answer: `Válasz ${i}`,
        citations: [],
        confidence: i * 0.1,
      });
    }

    expect(store.getAll()).toHaveLength(5);
  });

  it("finds relevant insights by combined similarity + topic routing", () => {
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

  it("builds context string with confidence and topic hints", () => {
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

  it("returns top rated insights", () => {
    const i1 = store.add({
      docId: "d1",
      query: "kérdés egyes fontos szöveg",
      answer: "válasz 1",
      citations: [],
      confidence: 0.8,
    });
    store.add({
      docId: "d2",
      query: "kérdés kettes másik szöveg",
      answer: "válasz 2",
      citations: [],
      confidence: 0.6,
    });

    store.rate(i1.id, 1);
    store.rate(i1.id, 1);

    const topRated = store.getTopRated(5);
    expect(topRated).toHaveLength(1);
    expect(topRated[0].id).toBe(i1.id);
  });

  it("computes stats with topic tree info", () => {
    store.add({
      docId: "d1",
      query: "kérdés egyes valami szöveg",
      answer: "válasz",
      citations: [],
      confidence: 0.8,
    });
    store.add({
      docId: "d2",
      query: "kérdés kettes másik szöveg",
      answer: "válasz",
      citations: [],
      confidence: 0.6,
    });

    const s = store.stats();
    expect(s.total).toBe(2);
    expect(s.avgConfidence).toBeCloseTo(0.7, 1);
    expect(s.topTags.length).toBeGreaterThan(0);
    expect(s.topicTree).toBeDefined();
    expect(s.topicTree.topicCount).toBeGreaterThanOrEqual(1);
  });

  it("stats returns zeros for empty store", () => {
    const s = store.stats();
    expect(s.total).toBe(0);
    expect(s.avgConfidence).toBe(0);
    expect(s.topicTree.topicCount).toBe(0);
  });

  it("clears all insights and topic tree", () => {
    store.add({
      docId: "d1",
      query: "teszt kérdés szöveg",
      answer: "answer",
      citations: [],
      confidence: 0.5,
    });
    store.clear();
    expect(store.getAll()).toHaveLength(0);
    expect(store.topicTree.root.children).toHaveLength(0);
  });

  it("serializes and deserializes v2 format with topic tree", () => {
    store.add({
      docId: "d1",
      query: "kérdés valami hosszabb szöveg",
      answer: "válasz szöveg itt van",
      citations: ["p1"],
      confidence: 0.8,
    });

    const json = store.toJSON();
    expect(JSON.parse(json).version).toBe(2);

    const store2 = new InsightStore();
    store2.loadJSON(json);

    expect(store2.getAll()).toHaveLength(1);
    const restored = store2.getAll()[0];
    expect(restored.queryNorm).toBeTruthy();
    expect(restored.tags.length).toBeGreaterThan(0);
    expect(restored.topicId).toBeTruthy();
  });

  it("loads v1 format (flat array) and rebuilds topic tree", () => {
    const v1Data = [
      {
        id: "ins_old",
        docId: "d1",
        query: "régi kérdés szöveges",
        queryNorm: "regi kerdes szoveges",
        answer: "régi válasz",
        citations: [],
        createdAt: "2026-01-01T00:00:00Z",
        lastUsedAt: "2026-01-01T00:00:00Z",
        confidence: 0.7,
        hitCount: 3,
        feedback: 1,
        tags: ["regi", "kerdes"],
      },
    ];

    store.loadJSON(JSON.stringify(v1Data));
    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0].topicId).toBeTruthy();
    expect(store.topicTree.root.children.length).toBeGreaterThan(0);
  });
});
