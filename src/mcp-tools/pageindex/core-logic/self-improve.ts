/**
 * Self-improving loop: persist insights from PageIndex queries
 * as reusable context for future queries.
 *
 * Insights are stored as a simple JSON array and fed back
 * as system context in subsequent chat calls.
 */

export interface Insight {
  id: string;
  docId: string;
  query: string;
  answer: string;
  citations: string[];
  createdAt: string;
  confidence: number;
}

export class InsightStore {
  private insights: Insight[] = [];
  private maxInsights: number;

  constructor(maxInsights = 100) {
    this.maxInsights = maxInsights;
  }

  add(insight: Omit<Insight, "id" | "createdAt">): Insight {
    const full: Insight = {
      ...insight,
      id: `insight_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.insights.push(full);
    // Evict oldest if over limit
    if (this.insights.length > this.maxInsights) {
      this.insights = this.insights.slice(-this.maxInsights);
    }
    return full;
  }

  /** Get relevant insights for a query (simple keyword matching) */
  findRelevant(query: string, limit = 5): Insight[] {
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    if (words.length === 0) return this.insights.slice(-limit);

    return this.insights
      .map((insight) => {
        const text = `${insight.query} ${insight.answer}`.toLowerCase();
        const score = words.filter((w) => text.includes(w)).length;
        return { insight, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.insight);
  }

  /** Build system context from past insights */
  buildContext(query: string): string | undefined {
    const relevant = this.findRelevant(query);
    if (relevant.length === 0) return undefined;

    const lines = relevant.map(
      (i) => `- Kérdés: "${i.query}" → Válasz: "${i.answer.slice(0, 200)}"`,
    );
    return ["Korábbi releváns megállapítások (self-improving kontextus):", ...lines].join("\n");
  }

  getAll(): Insight[] {
    return [...this.insights];
  }

  clear(): void {
    this.insights = [];
  }

  /** Serialize for persistence */
  toJSON(): string {
    return JSON.stringify(this.insights);
  }

  /** Load from serialized form */
  loadJSON(json: string): void {
    this.insights = JSON.parse(json) as Insight[];
  }
}
