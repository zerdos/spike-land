/**
 * Self-improving feedback loop rendszer.
 *
 * Három réteg:
 * 1. InsightStore — eltárolja a kérdés-válasz párokat relevancia-score-ral
 * 2. FeedbackLoop — automatikus finomítás: ismétlődő kérdések felismerése,
 *    válaszok összevonása, konfidencia emelése/csökkentése felhasználói feedback alapján
 * 3. Persistence — fájl-alapú mentés/betöltés cross-session tanuláshoz
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
  // Leggyakoribb szavak mint címkék
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

function cosineSimilarity(a: string, b: string): number {
  const wordsA = a.split(/\s+/);
  const wordsB = new Set(b.split(/\s+/));
  if (wordsA.length === 0 || wordsB.size === 0) return 0;
  const intersection = wordsA.filter((w) => wordsB.has(w)).length;
  return intersection / Math.sqrt(wordsA.length * wordsB.size);
}

// ─── InsightStore ───

export class InsightStore {
  private insights: Insight[] = [];
  private maxInsights: number;

  constructor(maxInsights = 200) {
    this.maxInsights = maxInsights;
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
      // Ha az új válasz hosszabb/jobb, cseréld ki
      if (
        input.answer.length > existing.answer.length &&
        input.citations.length >= existing.citations.length
      ) {
        existing.answer = input.answer;
        existing.citations = input.citations;
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
    this.evict();
    return insight;
  }

  /** Felhasználói feedback: thumbs up/down */
  rate(insightId: string, delta: 1 | -1): Insight | undefined {
    const insight = this.insights.find((i) => i.id === insightId);
    if (!insight) return undefined;
    insight.feedback += delta;
    insight.confidence = Math.max(0, Math.min(1, insight.confidence + delta * 0.1));
    return insight;
  }

  /** Relevancia-alapú keresés: cosine similarity + confidence + recency + feedback */
  findRelevant(query: string, limit = 5): Insight[] {
    const queryNorm = normalize(query);
    if (!queryNorm.trim()) return this.getRecent(limit);

    const now = Date.now();
    return this.insights
      .map((insight) => {
        const textSim = cosineSimilarity(queryNorm, insight.queryNorm);
        const tagSim = cosineSimilarity(queryNorm, insight.tags.join(" "));
        const similarity = textSim * 0.7 + tagSim * 0.3;

        // Recency decay: halad felezési ideje 7 nap
        const ageMs = now - new Date(insight.lastUsedAt).getTime();
        const recency = Math.exp(-ageMs / (7 * 24 * 60 * 60 * 1000));

        // Composite score
        const score =
          similarity * 0.4 +
          insight.confidence * 0.25 +
          recency * 0.15 +
          Math.min(insight.hitCount / 10, 1) * 0.1 +
          Math.max(0, insight.feedback / 5) * 0.1;

        return { insight, score, similarity };
      })
      .filter((r) => r.similarity > 0.05) // minimum relevancia küszöb
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.insight);
  }

  /** Kontextus építése: priorizált, tömör */
  buildContext(query: string): string | undefined {
    const relevant = this.findRelevant(query, 3);
    if (relevant.length === 0) return undefined;

    const lines = relevant.map((i) => {
      const conf = Math.round(i.confidence * 100);
      const cite = i.citations.length > 0 ? ` [${i.citations.join(", ")}]` : "";
      return `- [${conf}%] "${i.query}" → ${i.answer.slice(0, 150)}${cite}`;
    });

    return [
      "── Korábbi megállapítások (self-improving kontextus) ──",
      ...lines,
      `── ${this.insights.length} tárolt insight, ${relevant.length} releváns ──`,
    ].join("\n");
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
    };
  }

  // ─── Belső segédek ───

  private findDuplicate(queryNorm: string, docId: string): Insight | undefined {
    return this.insights.find(
      (i) => i.docId === docId && cosineSimilarity(queryNorm, i.queryNorm) > 0.8,
    );
  }

  private evict(): void {
    if (this.insights.length <= this.maxInsights) return;
    // Score-alapú eviction: legkevésbé hasznos kerül ki
    this.insights.sort((a, b) => {
      const scoreA = a.confidence * 0.4 + a.hitCount * 0.3 + a.feedback * 0.3;
      const scoreB = b.confidence * 0.4 + b.hitCount * 0.3 + b.feedback * 0.3;
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
  }

  toJSON(): string {
    return JSON.stringify(this.insights);
  }

  loadJSON(json: string): void {
    this.insights = JSON.parse(json) as Insight[];
  }

  // ─── Fájl persistence ───

  async saveToFile(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, this.toJSON(), "utf-8");
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
