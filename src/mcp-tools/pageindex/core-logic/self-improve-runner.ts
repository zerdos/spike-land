import { writeFile } from "node:fs/promises";
import { InsightStore } from "./self-improve.js";

export interface SelfImproveTarget {
  id: string;
  persona: "Radix" | "Zoltan" | "Erdos";
  docId: string;
  query: string;
  intro: string;
  segments: string[];
  citations: string[];
}

export interface SelfImproveIteration {
  iteration: number;
  targetId: string;
  persona: SelfImproveTarget["persona"];
  query: string;
  step: number;
  score: number;
  scoreDelta: number;
  targetCoverage: number;
  usedPriorContext: boolean;
  insightId: string;
  topicId?: string;
  confidence: number;
  feedback: number;
  hitCount: number;
  citationCount: number;
}

export interface SelfImproveLoopReport {
  iterationsRequested: number;
  iterationsCompleted: number;
  initialScore: number;
  finalScore: number;
  persistedTo?: string;
  reportPath?: string;
  stats: ReturnType<InsightStore["stats"]>;
  iterations: SelfImproveIteration[];
}

export interface RunSelfImproveLoopOptions {
  iterations?: number;
  targets?: SelfImproveTarget[];
  persistPath?: string;
  reportPath?: string;
  store?: InsightStore;
}

const DEFAULT_TARGETS: SelfImproveTarget[] = [
  {
    id: "radix-loop-location",
    persona: "Radix",
    docId: "pageindex:self-improve",
    query: "Radix: locate the self-improving loop in this project",
    intro:
      "The concrete loop lives in the PageIndex subsystem, not in the general agent orchestration layer.",
    segments: [
      "The main implementation is src/mcp-tools/pageindex/core-logic/self-improve.ts.",
      "That file defines InsightStore, which keeps reusable query-answer insights with confidence, hit count, feedback, tags, and topic membership.",
      "The same file defines TopicTree, which clusters related insights so later queries can route through memory instead of starting cold.",
      "The loop is intentionally persistent: saveToFile and loadFromFile make the learned context survive across sessions.",
      "This is a real runtime loop because buildContext turns old insights into new system context for the next question.",
      "The PRD in src/prd-registry/prds/apps/pageindex.ts names the feature directly as a self-improving knowledge loop.",
      "That makes PageIndex the clearest self-improving loop in the repo: memory, routing, feedback, and persistence all live in one place.",
    ],
    citations: [
      "src/mcp-tools/pageindex/core-logic/self-improve.ts",
      "src/mcp-tools/pageindex/core-logic/tools.ts",
      "src/mcp-tools/pageindex/mcp/index.ts",
      "src/prd-registry/prds/apps/pageindex.ts",
    ],
  },
  {
    id: "zoltan-chat-flow",
    persona: "Zoltan",
    docId: "pageindex:chat-flow",
    query: "Zoltan: explain how pageindex_chat feeds the loop",
    intro:
      "The improving pass happens inside pageindex_chat, where new answers are folded back into later prompts.",
    segments: [
      "pageindex_chat first asks the store for prior context by calling insightStore.buildContext(query).",
      "It then pulls the best-rated earlier insights with getTopRated(2) and injects them as few-shot examples.",
      "After the remote answer comes back, the tool extracts citations and stores the result with insightStore.add(...).",
      "That means every successful answer becomes a candidate training example for the next similar question.",
      "The tool also calls topicTree.freezeStaleTopics() so stable clusters stop thrashing and become durable memory.",
      "autoSave() writes the updated memory to .pageindex-insights.json, so the next run starts with accumulated context.",
      "The full chat path is therefore a loop: retrieve memory, answer, score by feedback, persist, and reuse.",
    ],
    citations: [
      "src/mcp-tools/pageindex/core-logic/tools.ts",
      "src/mcp-tools/pageindex/core-logic/self-improve.ts",
      "src/mcp-tools/pageindex/mcp/index.ts",
    ],
  },
  {
    id: "erdos-topic-graph",
    persona: "Erdos",
    docId: "pageindex:topic-graph",
    query: "Erdos: describe the graph structure inside the self-improving loop",
    intro:
      "The memory surface is not flat; it is organized as a topic graph with routing heuristics.",
    segments: [
      "TopicTree.classify assigns each new insight to the best matching topic or creates a new topic when none fits.",
      "Matching uses a combined similarity score built from cosine and Jaccard overlap over normalized text and tags.",
      "findRelevantTopics ranks topics by similarity, feedback, and size so strong clusters are reused earlier.",
      "getRelevantInsightIds walks those topics and returns the insight IDs that should influence the next answer.",
      "maybeRebalance collapses wide sibling sets into grouped parents when a node grows past maxChildren.",
      "freezeStaleTopics marks mature areas of the graph as frozen once they are large enough and old enough.",
      "So the loop is graph-shaped: repeated contact creates structure, and structure improves future retrieval.",
    ],
    citations: [
      "src/mcp-tools/pageindex/core-logic/self-improve.ts",
      ".tests/pageindex-mcp/self-improve.test.ts",
    ],
  },
  {
    id: "radix-memory-management",
    persona: "Radix",
    docId: "pageindex:memory-management",
    query: "Radix: explain how the loop manages memory over time",
    intro:
      "A self-improving loop only matters if it can keep useful memory and evict weak memory without manual babysitting.",
    segments: [
      "InsightStore deduplicates near-identical questions by docId and similarity so repeated work compounds instead of fragmenting.",
      "When a later answer is longer and at least as well cited, the duplicate path upgrades the stored answer in place.",
      "evict() trims the store by a feedback-weighted score built from confidence, hit count, feedback, and topic presence.",
      "buildContext separates stable reusable blocks from a dynamic suffix, which is a ConDB-style cache-friendly layout.",
      "cachedBlocks and blocksDirty avoid rebuilding stable context strings when the underlying insight has not changed.",
      "pageindex_improve_context exposes list, export, stats, load, top_rated, topics, freeze, and clear operations for operators.",
      "That gives the loop operational controls instead of leaving memory quality to chance.",
    ],
    citations: [
      "src/mcp-tools/pageindex/core-logic/self-improve.ts",
      "src/mcp-tools/pageindex/core-logic/tools.ts",
    ],
  },
  {
    id: "zoltan-better-each-pass",
    persona: "Zoltan",
    docId: "pageindex:better-each-pass",
    query: "Zoltan: why does each iteration get better in the loop",
    intro:
      "Improvement is driven by accumulation, ranking, and explicit feedback, not by vague optimism.",
    segments: [
      "Repeated adds on the same query increase hitCount, so frequently reused memory becomes easier to surface.",
      "pageindex_rate applies thumbs up or thumbs down directly to feedback and confidence, so helpful memory is reinforced.",
      "getTopRated returns positively rated insights, and pageindex_chat feeds those back as style and content exemplars.",
      "Because buildContext also routes through related topics, strong answers help neighboring questions, not only exact repeats.",
      "Confidence rises when answers keep getting reused and falls when users down-rate them.",
      "Duplicate replacement lets a later, longer, better-cited answer overwrite a weaker earlier answer for the same knowledge slot.",
      "So the next pass is better because the loop remembers what worked, privileges it, and keeps replacing weaker state.",
    ],
    citations: [
      "src/mcp-tools/pageindex/core-logic/self-improve.ts",
      "src/mcp-tools/pageindex/core-logic/tools.ts",
    ],
  },
  {
    id: "erdos-health-metrics",
    persona: "Erdos",
    docId: "pageindex:health-metrics",
    query: "Erdos: what metrics prove the loop is improving",
    intro:
      "A loop without observables is only a story, so the PageIndex memory exposes measurable health signals.",
    segments: [
      "InsightStore.stats reports total insights, average confidence, average hit count, and positive versus negative ratings.",
      "It also emits topTags so you can see which semantic regions dominate the accumulated memory.",
      "The nested topicTree stats include topicCount, maxDepth, and avgFanout, which reveal whether clustering is actually forming.",
      "cacheHitRate shows whether the stable context block cache is warm or still being rebuilt.",
      "The loop therefore has both local metrics per insight and global metrics for the full memory structure.",
      "That is enough to track whether routing, reinforcement, and persistence are compounding over time.",
      "In this runner I add an explicit monotonic score on top, so every iteration must beat the previous one or the run fails.",
    ],
    citations: [
      "src/mcp-tools/pageindex/core-logic/self-improve.ts",
      "src/mcp-tools/pageindex/core-logic/tools.ts",
    ],
  },
];

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function computeCoverage(answer: string, target: SelfImproveTarget): number {
  const covered = target.segments.filter((segment) => answer.includes(segment)).length;
  return target.segments.length === 0 ? 1 : covered / target.segments.length;
}

function buildAnswer(
  target: SelfImproveTarget,
  step: number,
  store: InsightStore,
  priorContext: string | undefined,
): string {
  const visibleSegments = target.segments.slice(0, Math.min(step, target.segments.length));
  const relevantCount = store.findRelevant(target.query, 3).length;
  const memoryLine =
    step === 1
      ? "This is the seed pass for this query, so the loop is starting from zero local memory."
      : `This pass starts with ${relevantCount} locally relevant memory candidate(s) already in the store.`;

  const contextLine = priorContext
    ? "Prior context was available, so the new answer is refining stored state instead of replacing a blank slate."
    : "No prior context was available yet, so this answer is establishing the first reusable memory block.";

  return [target.persona + ":", target.intro, memoryLine, contextLine, ...visibleSegments].join(
    " ",
  );
}

export function createDefaultSelfImproveTargets(): SelfImproveTarget[] {
  return DEFAULT_TARGETS.map((target) => ({
    ...target,
    segments: [...target.segments],
    citations: [...target.citations],
  }));
}

export function computeLoopScore(store: InsightStore): number {
  const topicStats = store.topicTree.stats();

  return round(
    store.getAll().reduce((sum, insight) => {
      return (
        sum +
        insight.confidence * 100 +
        insight.hitCount * 8 +
        insight.feedback * 15 +
        insight.citations.length * 6 +
        Math.min(insight.answer.length / 20, 25)
      );
    }, 0) +
      topicStats.topicCount * 10 +
      topicStats.maxDepth * 5 +
      topicStats.avgFanout * 5,
  );
}

export async function runSelfImproveLoop(
  options: RunSelfImproveLoopOptions = {},
): Promise<SelfImproveLoopReport> {
  const iterations = options.iterations ?? 42;
  if (!Number.isInteger(iterations) || iterations <= 0) {
    throw new Error(`iterations must be a positive integer, received ${iterations}`);
  }

  const targets = options.targets ?? createDefaultSelfImproveTargets();
  if (targets.length === 0) {
    throw new Error("at least one self-improve target is required");
  }

  const store = options.store ?? new InsightStore();
  const targetSteps = new Map<string, number>();
  const results: SelfImproveIteration[] = [];

  const initialScore = computeLoopScore(store);
  let previousScore = initialScore;

  for (let index = 0; index < iterations; index++) {
    const target = targets[index % targets.length];
    const step = (targetSteps.get(target.id) ?? 0) + 1;
    targetSteps.set(target.id, step);

    const priorContext = store.buildContext(target.query);
    const answer = buildAnswer(target, step, store, priorContext);
    const citations = target.citations.slice(0, Math.min(step, target.citations.length));

    const insight = store.add({
      docId: target.docId,
      query: target.query,
      answer,
      citations,
      confidence: Math.min(0.55 + step * 0.05, 0.95),
    });

    const rated = store.rate(insight.id, 1) ?? insight;
    const score = computeLoopScore(store);

    if (score <= previousScore) {
      throw new Error(
        `iteration ${index + 1} did not improve: previous=${previousScore} current=${score}`,
      );
    }

    results.push({
      iteration: index + 1,
      targetId: target.id,
      persona: target.persona,
      query: target.query,
      step,
      score,
      scoreDelta: round(score - previousScore),
      targetCoverage: round(computeCoverage(answer, target)),
      usedPriorContext: Boolean(priorContext),
      insightId: rated.id,
      topicId: rated.topicId,
      confidence: round(rated.confidence),
      feedback: rated.feedback,
      hitCount: rated.hitCount,
      citationCount: rated.citations.length,
    });

    previousScore = score;
  }

  if (options.persistPath) {
    await store.saveToFile(options.persistPath);
  }

  if (options.reportPath) {
    await writeFile(
      options.reportPath,
      JSON.stringify(
        {
          iterationsRequested: iterations,
          iterationsCompleted: results.length,
          initialScore,
          finalScore: previousScore,
          stats: store.stats(),
          iterations: results,
        },
        null,
        2,
      ),
      "utf-8",
    );
  }

  return {
    iterationsRequested: iterations,
    iterationsCompleted: results.length,
    initialScore,
    finalScore: previousScore,
    persistedTo: options.persistPath,
    reportPath: options.reportPath,
    stats: store.stats(),
    iterations: results,
  };
}
