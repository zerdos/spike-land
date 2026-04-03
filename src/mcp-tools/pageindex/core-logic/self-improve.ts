/**
 * Self-improving feedback loop rendszer — ChatIndex + ConDB ihletésű.
 *
 * Négy réteg:
 * 1. InsightStore — kérdés-válasz párok relevancia-score-ral
 * 2. TopicTree — fa-struktúrájú topic clustering (ChatIndex mintára)
 * 3. CacheableContext — stabil insight blokkok + dinamikus query suffix (ConDB mintára)
 * 4. FeedbackLoop — feedback-weighted routing, lazy summarization, eviction
 *
 * Persistence — fájl-alapú mentés/betöltés cross-session tanuláshoz
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

// ─── Insight ───

export interface Insight {
  id: string;
  docId: string;
  query: string;
  /** Normalizált query (kisbetűs, ékezet nélkül, stopszavak nélkül) */
  queryNorm: string;
  answer: string;
  citations: string[];
  createdAt: string;
  lastUsedAt: string;
  /** 0-1, emelkedik ha újra releváns, csökken idővel */
  confidence: number;
  /** Hányszor volt releváns újra-felhasználva */
  hitCount: number;
  /** Felhasználói feedback: +1 hasznos, -1 rossz, 0 semleges */
  feedback: number;
  /** Címkék a gyorsabb kereséshez */
  tags: string[];
  /** Topic ID a fa-struktúrában */
  topicId?: string;
}

// ─── TopicNode — ChatIndex-ihletésű fa ───

export interface TopicNode {
  id: string;
  name: string;
  /** Lazy summary — csak "befagyott" node-okra generálódik */
  summary: string;
  /** Gyerek topic-ok */
  children: TopicNode[];
  /** Insight ID-k ebben a topic-ban */
  insightIds: string[];
  /** Összesített feedback score */
  avgFeedback: number;
  /** Utolsó frissítés */
  lastUpdated: string;
  /** Befagyott — summary stabil, nem változik */
  frozen: boolean;
}

// ─── Szöveg normalizálás ───

const HU_STOPWORDS = new Set([
  "a",
  "az",
  "egy",
  "és",
  "is",
  "hogy",
  "nem",
  "van",
  "volt",
  "meg",
  "de",
  "vagy",
  "ha",
  "mint",
  "már",
  "csak",
  "még",
  "fel",
  "ki",
  "be",
  "the",
  "and",
  "or",
  "is",
  "in",
  "of",
  "to",
  "for",
  "with",
  "on",
  "what",
  "how",
  "when",
  "where",
  "which",
  "this",
  "that",
  "are",
  "was",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // ékezetek le
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !HU_STOPWORDS.has(w))
    .join(" ");
}

function extractTags(text: string): string[] {
  const norm = normalize(text);
  const words = norm.split(/\s+/).filter((w) => w.length > 3);
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

export function cosineSimilarity(a: string, b: string): number {
  const wordsA = a.split(/\s+/).filter(Boolean);
  const wordsB = new Set(b.split(/\s+/).filter(Boolean));
  if (wordsA.length === 0 || wordsB.size === 0) return 0;
  const intersection = wordsA.filter((w) => wordsB.has(w)).length;
  return intersection / Math.sqrt(wordsA.length * wordsB.size);
}

/** Jaccard hasonlóság — kiegészíti a cosine-t rövid szövegeknél */
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/).filter(Boolean));
  const setB = new Set(b.split(/\s+/).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  return intersection / (setA.size + setB.size - intersection);
}

/** Kombinált hasonlóság: cosine + jaccard hibrid */
function combinedSimilarity(a: string, b: string): number {
  return cosineSimilarity(a, b) * 0.6 + jaccardSimilarity(a, b) * 0.4;
}

// ─── TopicTree ───

export class TopicTree {
  root: TopicNode;
  private maxChildren: number;

  constructor(maxChildren = 8) {
    this.maxChildren = maxChildren;
    this.root = {
      id: "root",
      name: "Root",
      summary: "",
      children: [],
      insightIds: [],
      avgFeedback: 0,
      lastUpdated: new Date().toISOString(),
      frozen: false,
    };
  }

  /** Insight besorolása a megfelelő topic-ba */
  classify(insight: Insight): string {
    const bestTopic = this.findBestTopic(this.root, insight.queryNorm, insight.tags);

    if (bestTopic && bestTopic.id !== "root") {
      bestTopic.insightIds.push(insight.id);
      bestTopic.lastUpdated = new Date().toISOString();
      this.updateAvgFeedback(bestTopic, [insight]);
      this.maybeRebalance(bestTopic);
      return bestTopic.id;
    }

    // Nincs jó match — új topic létrehozása
    const topicName = insight.tags.slice(0, 3).join(" ") || insight.queryNorm.slice(0, 30);
    const newTopic: TopicNode = {
      id: `topic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: topicName,
      summary: "",
      children: [],
      insightIds: [insight.id],
      avgFeedback: insight.feedback,
      lastUpdated: new Date().toISOString(),
      frozen: false,
    };
    this.root.children.push(newTopic);
    this.maybeRebalance(this.root);
    return newTopic.id;
  }

  /** Releváns topic-ok keresése — feedback-weighted routing */
  findRelevantTopics(queryNorm: string, limit = 3): TopicNode[] {
    const scored: Array<{ node: TopicNode; score: number }> = [];
    this.scoreTopics(this.root, queryNorm, scored);
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.node);
  }

  /** Összes insight ID releváns topic-okból */
  getRelevantInsightIds(queryNorm: string, limit = 10): string[] {
    const topics = this.findRelevantTopics(queryNorm, 5);
    const ids: string[] = [];
    for (const topic of topics) {
      this.collectInsightIds(topic, ids);
    }
    return [...new Set(ids)].slice(0, limit);
  }

  /** Befagyasztás: ha egy topic >3 insight-tal rendelkezik és >1 napja nem változott */
  freezeStaleTopics(): number {
    let count = 0;
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    const walk = (node: TopicNode) => {
      if (
        !node.frozen &&
        node.insightIds.length >= 3 &&
        now - new Date(node.lastUpdated).getTime() > ONE_DAY
      ) {
        node.frozen = true;
        count++;
      }
      for (const child of node.children) walk(child);
    };
    walk(this.root);
    return count;
  }

  /** Fa statisztikák */
  stats(): { topicCount: number; maxDepth: number; avgFanout: number } {
    let count = 0;
    let maxDepth = 0;
    let totalChildren = 0;
    let parentCount = 0;

    const walk = (node: TopicNode, depth: number) => {
      count++;
      maxDepth = Math.max(maxDepth, depth);
      if (node.children.length > 0) {
        totalChildren += node.children.length;
        parentCount++;
      }
      for (const child of node.children) walk(child, depth + 1);
    };
    walk(this.root, 0);
    return {
      topicCount: count,
      maxDepth,
      avgFanout: parentCount > 0 ? totalChildren / parentCount : 0,
    };
  }

  // ─── Belső ───

  private findBestTopic(node: TopicNode, queryNorm: string, tags: string[]): TopicNode | null {
    let best: TopicNode | null = null;
    let bestScore = 0.3; // minimum küszöb

    const walk = (n: TopicNode) => {
      const nameNorm = normalize(n.name);
      const sim = combinedSimilarity(queryNorm, nameNorm);
      const tagSim = combinedSimilarity(tags.join(" "), nameNorm);
      // Feedback boost: jobb rated topic-ok kapnak prioritást
      const feedbackBoost = Math.max(0, n.avgFeedback * 0.05);
      const score = sim * 0.5 + tagSim * 0.3 + feedbackBoost + (n.insightIds.length > 0 ? 0.05 : 0);

      if (score > bestScore) {
        bestScore = score;
        best = n;
      }
      for (const child of n.children) walk(child);
    };

    for (const child of node.children) walk(child);
    return best;
  }

  private scoreTopics(
    node: TopicNode,
    queryNorm: string,
    results: Array<{ node: TopicNode; score: number }>,
  ): void {
    if (node.id !== "root") {
      const nameNorm = normalize(node.name);
      const sim = combinedSimilarity(queryNorm, nameNorm);
      const feedbackBoost = Math.max(0, node.avgFeedback * 0.05);
      const sizeBoost = Math.min(node.insightIds.length / 10, 0.1);
      results.push({ node, score: sim + feedbackBoost + sizeBoost });
    }
    for (const child of node.children) {
      this.scoreTopics(child, queryNorm, results);
    }
  }

  private collectInsightIds(node: TopicNode, ids: string[]): void {
    ids.push(...node.insightIds);
    for (const child of node.children) this.collectInsightIds(child, ids);
  }

  private updateAvgFeedback(node: TopicNode, newInsights: Insight[]): void {
    const total = node.avgFeedback * Math.max(node.insightIds.length - newInsights.length, 0);
    const newTotal = newInsights.reduce((s, i) => s + i.feedback, 0);
    node.avgFeedback = node.insightIds.length > 0 ? (total + newTotal) / node.insightIds.length : 0;
  }

  private maybeRebalance(node: TopicNode): void {
    if (node.children.length <= this.maxChildren) return;
    // Horizontális split: két csoportra bontás hasonlóság alapján
    const mid = Math.ceil(node.children.length / 2);
    const groupA = node.children.slice(0, mid);
    const groupB = node.children.slice(mid);

    const makeGroup = (children: TopicNode[], label: string): TopicNode => ({
      id: `topic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name:
        children
          .map((c) => c.name)
          .slice(0, 2)
          .join(", ") + ` (${label})`,
      summary: "",
      children,
      insightIds: [],
      avgFeedback: children.reduce((s, c) => s + c.avgFeedback, 0) / children.length,
      lastUpdated: new Date().toISOString(),
      frozen: false,
    });

    node.children = [makeGroup(groupA, "A"), makeGroup(groupB, "B")];
  }

  toJSON(): string {
    return JSON.stringify(this.root);
  }

  loadJSON(json: string): void {
    this.root = JSON.parse(json) as TopicNode;
  }
}

// ─── InsightStore ───

export class InsightStore {
  private insights: Insight[] = [];
  private maxInsights: number;
  readonly topicTree: TopicTree;

  /** Cache-natív blokkok — stabil insight szövegek, ritkán változnak */
  private cachedBlocks: Map<string, string> = new Map();
  private blocksDirty = true;

  constructor(maxInsights = 200) {
    this.maxInsights = maxInsights;
    this.topicTree = new TopicTree();
  }

  add(input: {
    docId: string;
    query: string;
    answer: string;
    citations: string[];
    confidence: number;
  }): Insight {
    const queryNorm = normalize(input.query);

    // Deduplikáció: ha nagyon hasonló kérdés már létezik, frissítsd
    const existing = this.findDuplicate(queryNorm, input.docId);
    if (existing) {
      existing.hitCount++;
      existing.lastUsedAt = new Date().toISOString();
      existing.confidence = Math.min(1, existing.confidence + 0.05);
      if (
        input.answer.length > existing.answer.length &&
        input.citations.length >= existing.citations.length
      ) {
        existing.answer = input.answer;
        existing.citations = input.citations;
        this.blocksDirty = true;
      }
      return existing;
    }

    const insight: Insight = {
      id: `ins_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      docId: input.docId,
      query: input.query,
      queryNorm,
      answer: input.answer,
      citations: input.citations,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      confidence: input.confidence,
      hitCount: 1,
      feedback: 0,
      tags: extractTags(`${input.query} ${input.answer}`),
    };

    this.insights.push(insight);

    // Topic fa besorolás
    insight.topicId = this.topicTree.classify(insight);

    this.blocksDirty = true;
    this.evict();
    return insight;
  }

  /** Felhasználói feedback: thumbs up/down */
  rate(insightId: string, delta: 1 | -1): Insight | undefined {
    const insight = this.insights.find((i) => i.id === insightId);
    if (!insight) return undefined;
    insight.feedback += delta;
    insight.confidence = Math.max(0, Math.min(1, insight.confidence + delta * 0.1));
    this.blocksDirty = true;
    return insight;
  }

  /** Relevancia-alapú keresés: topic-tree routing + composite scoring */
  findRelevant(query: string, limit = 5): Insight[] {
    const queryNorm = normalize(query);
    if (!queryNorm.trim()) return this.getRecent(limit);

    // 1. Topic-tree routing: releváns topic-ok insight ID-i
    const topicInsightIds = new Set(this.topicTree.getRelevantInsightIds(queryNorm, limit * 3));

    const now = Date.now();
    return this.insights
      .map((insight) => {
        const textSim = combinedSimilarity(queryNorm, insight.queryNorm);
        const tagSim = combinedSimilarity(queryNorm, insight.tags.join(" "));
        const similarity = textSim * 0.6 + tagSim * 0.4;

        // Topic routing boost
        const topicBoost = topicInsightIds.has(insight.id) ? 0.15 : 0;

        // Recency decay: felezési ideje 7 nap
        const ageMs = now - new Date(insight.lastUsedAt).getTime();
        const recency = Math.exp(-ageMs / (7 * 24 * 60 * 60 * 1000));

        // Feedback-weighted score
        const feedbackScore = Math.max(0, insight.feedback / 5);

        // Composite score
        const score =
          similarity * 0.35 +
          insight.confidence * 0.2 +
          recency * 0.1 +
          Math.min(insight.hitCount / 10, 1) * 0.05 +
          feedbackScore * 0.15 +
          topicBoost;

        return { insight, score, similarity };
      })
      .filter((r) => r.similarity > 0.05 || topicInsightIds.has(r.insight.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.insight);
  }

  /**
   * Cache-natív kontextus építés (ConDB-ihletésű).
   * Stabil blokkok: az insight-ok szövege ritkán változik → cachelhető prefix.
   * Dinamikus suffix: a query és routing info.
   */
  buildContext(query: string): string | undefined {
    const relevant = this.findRelevant(query, 3);
    if (relevant.length === 0) return undefined;

    // Stabil blokkok — csak dirty-nél újragenerálás
    const blocks = this.getCacheableBlocks(relevant);

    // Dinamikus suffix
    const topicHints = this.topicTree
      .findRelevantTopics(normalize(query), 2)
      .map((t) => t.name)
      .join(", ");

    return [
      "── Korábbi megállapítások (self-improving kontextus) ──",
      ...blocks,
      topicHints ? `── Releváns témakörök: ${topicHints} ──` : "",
      `── ${this.insights.length} tárolt insight, ${relevant.length} releváns ──`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  /** Top-rated insight-ok — few-shot prompting-hoz */
  getTopRated(limit = 5, minFeedback = 1): Insight[] {
    return this.insights
      .filter((i) => i.feedback >= minFeedback)
      .sort((a, b) => b.feedback - a.feedback || b.confidence - a.confidence)
      .slice(0, limit);
  }

  /** Statisztika a loop egészségéről */
  stats(): {
    total: number;
    avgConfidence: number;
    avgHitCount: number;
    positiveRated: number;
    negativeRated: number;
    oldestDays: number;
    topTags: Array<{ tag: string; count: number }>;
    topicTree: { topicCount: number; maxDepth: number; avgFanout: number };
    cacheHitRate: number;
  } {
    if (this.insights.length === 0) {
      return {
        total: 0,
        avgConfidence: 0,
        avgHitCount: 0,
        positiveRated: 0,
        negativeRated: 0,
        oldestDays: 0,
        topTags: [],
        topicTree: { topicCount: 0, maxDepth: 0, avgFanout: 0 },
        cacheHitRate: 0,
      };
    }

    const avgConfidence =
      this.insights.reduce((s, i) => s + i.confidence, 0) / this.insights.length;
    const avgHitCount = this.insights.reduce((s, i) => s + i.hitCount, 0) / this.insights.length;
    const positiveRated = this.insights.filter((i) => i.feedback > 0).length;
    const negativeRated = this.insights.filter((i) => i.feedback < 0).length;
    const oldest = Math.min(...this.insights.map((i) => new Date(i.createdAt).getTime()));
    const oldestDays = Math.round((Date.now() - oldest) / (24 * 60 * 60 * 1000));

    // Top tags
    const tagFreq = new Map<string, number>();
    for (const i of this.insights) {
      for (const t of i.tags) tagFreq.set(t, (tagFreq.get(t) ?? 0) + 1);
    }
    const topTags = [...tagFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return {
      total: this.insights.length,
      avgConfidence,
      avgHitCount,
      positiveRated,
      negativeRated,
      oldestDays,
      topTags,
      topicTree: this.topicTree.stats(),
      cacheHitRate: this.blocksDirty ? 0 : 1,
    };
  }

  // ─── Cache-natív blokkok (ConDB mintára) ───

  private getCacheableBlocks(relevant: Insight[]): string[] {
    return relevant.map((i) => {
      // Cache hit ellenőrzés
      if (!this.blocksDirty && this.cachedBlocks.has(i.id)) {
        return this.cachedBlocks.get(i.id)!;
      }

      const conf = Math.round(i.confidence * 100);
      const fb = i.feedback > 0 ? " ⬆" : i.feedback < 0 ? " ⬇" : "";
      const cite = i.citations.length > 0 ? ` [${i.citations.join(", ")}]` : "";
      const hits = i.hitCount > 1 ? ` (×${i.hitCount})` : "";
      const block = `- [${conf}%${fb}${hits}] "${i.query}" → ${i.answer.slice(0, 200)}${cite}`;

      this.cachedBlocks.set(i.id, block);
      return block;
    });
  }

  // ─── Belső segédek ───

  private findDuplicate(queryNorm: string, docId: string): Insight | undefined {
    return this.insights.find(
      (i) => i.docId === docId && combinedSimilarity(queryNorm, i.queryNorm) > 0.7,
    );
  }

  private evict(): void {
    if (this.insights.length <= this.maxInsights) return;
    // Score-alapú eviction: feedback-weighted
    this.insights.sort((a, b) => {
      const scoreA =
        a.confidence * 0.3 + a.hitCount * 0.2 + a.feedback * 0.3 + (a.topicId ? 0.2 : 0);
      const scoreB =
        b.confidence * 0.3 + b.hitCount * 0.2 + b.feedback * 0.3 + (b.topicId ? 0.2 : 0);
      return scoreB - scoreA;
    });
    this.insights = this.insights.slice(0, this.maxInsights);
  }

  private getRecent(limit: number): Insight[] {
    return this.insights
      .slice()
      .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
      .slice(0, limit);
  }

  getAll(): Insight[] {
    return [...this.insights];
  }

  clear(): void {
    this.insights = [];
    this.cachedBlocks.clear();
    this.blocksDirty = true;
    this.topicTree.loadJSON(
      JSON.stringify({
        id: "root",
        name: "Root",
        summary: "",
        children: [],
        insightIds: [],
        avgFeedback: 0,
        lastUpdated: new Date().toISOString(),
        frozen: false,
      }),
    );
  }

  toJSON(): string {
    return JSON.stringify({
      insights: this.insights,
      topicTree: this.topicTree.toJSON(),
      version: 2,
    });
  }

  loadJSON(json: string): void {
    const data = JSON.parse(json);
    // v2 format: insights + topicTree
    if (data.version === 2) {
      this.insights = data.insights as Insight[];
      this.topicTree.loadJSON(data.topicTree);
    } else {
      // v1 compat: flat insight array
      this.insights = Array.isArray(data) ? (data as Insight[]) : [];
      // Rebuild topic tree from existing insights
      for (const insight of this.insights) {
        insight.topicId = this.topicTree.classify(insight);
      }
    }
    this.blocksDirty = true;
  }

  // ─── Fájl persistence ───

  async saveToFile(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, this.toJSON(), "utf-8");
    this.blocksDirty = false;
  }

  async loadFromFile(filePath: string): Promise<boolean> {
    try {
      const data = await readFile(filePath, "utf-8");
      this.loadJSON(data);
      return true;
    } catch {
      return false;
    }
  }
}
