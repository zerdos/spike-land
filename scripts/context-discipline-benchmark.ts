/**
 * Context Discipline Benchmark
 *
 * Empirically validates whether context discipline (keeping prompts lean)
 * outperforms simply stuffing more context into large context windows.
 *
 * Usage:
 *   npx tsx scripts/context-discipline-benchmark.ts \
 *     --model claude-opus-4-6 --concurrency 16 --sizes 50000,100000,200000,500000
 *
 * Requires ANTHROPIC_API_KEY in environment.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

interface TurnRecord {
  scenario: string;
  label: string;
  contextSize: number;
  usage: TokenUsage;
  latencyMs: number;
  score: number;
  maxScore: number;
  timestamp: number;
  raw?: string;
}

/** Mirrors TokenTracker pattern from spike-cli */
class TokenTracker {
  private turns: TurnRecord[] = [];

  record(turn: TurnRecord): void {
    this.turns.push(turn);
  }

  get totalInputTokens(): number {
    return this.turns.reduce((s, t) => s + t.usage.input_tokens, 0);
  }

  get totalOutputTokens(): number {
    return this.turns.reduce((s, t) => s + t.usage.output_tokens, 0);
  }

  /** Estimated cost in USD using Opus pricing: $15/M input, $75/M output */
  get estimatedCostUsd(): number {
    return (this.totalInputTokens / 1_000_000) * 15 + (this.totalOutputTokens / 1_000_000) * 75;
  }

  getTurns(): readonly TurnRecord[] {
    return this.turns;
  }

  formatSummary(): string {
    return [
      `Total requests: ${this.turns.length}`,
      `Input tokens:  ${this.totalInputTokens.toLocaleString()}`,
      `Output tokens: ${this.totalOutputTokens.toLocaleString()}`,
      `Est. cost:     $${this.estimatedCostUsd.toFixed(2)}`,
    ].join("\n");
  }
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  model: string;
  concurrency: number;
  sizes: number[];
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let model = "claude-opus-4-6";
  let concurrency = 16;
  let sizes = [50_000, 100_000, 200_000];

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--model":
        model = args[++i];
        break;
      case "--concurrency":
        concurrency = parseInt(args[++i], 10);
        break;
      case "--sizes":
        sizes = args[++i].split(",").map((s) => parseInt(s.trim(), 10));
        break;
      case "--help":
        console.log(
          `Usage: npx tsx scripts/context-discipline-benchmark.ts [options]

Options:
  --model <name>       Model to benchmark (default: claude-opus-4-6)
  --concurrency <n>    Max concurrent API calls (default: 16)
  --sizes <list>       Comma-separated context sizes in tokens (default: 50000,100000,200000)
`,
        );
        process.exit(0);
    }
  }
  return { model, concurrency, sizes };
}

// ---------------------------------------------------------------------------
// Semaphore for concurrency control
// ---------------------------------------------------------------------------

class Semaphore {
  private current = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.limit) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.current++;
        resolve();
      });
    });
  }

  release(): void {
    this.current--;
    const next = this.queue.shift();
    if (next) next();
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// ---------------------------------------------------------------------------
// Noise generation — reads real source files from the repo
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, "..");

/** Recursively collect .ts, .tsx, .md files up to a byte limit */
function collectSourceFiles(maxBytes: number): string[] {
  const dirs = [path.join(REPO_ROOT, "src"), path.join(REPO_ROOT, "docs")];
  const extensions = new Set([".ts", ".tsx", ".md", ".js"]);
  const collected: string[] = [];
  let totalBytes = 0;

  function walk(dir: string): void {
    if (totalBytes >= maxBytes) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (totalBytes >= maxBytes) return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules, dist, .git
        if (["node_modules", "dist", ".git", "coverage"].includes(entry.name)) continue;
        walk(full);
      } else if (entry.isFile() && extensions.has(path.extname(entry.name))) {
        try {
          const content = fs.readFileSync(full, "utf-8");
          collected.push(`\n--- FILE: ${path.relative(REPO_ROOT, full)} ---\n${content}`);
          totalBytes += content.length;
        } catch {
          // skip unreadable files
        }
      }
    }
  }

  for (const d of dirs) walk(d);
  return collected;
}

let _noiseCache: string | null = null;

/** Get a block of noise text of approximately the target character count.
 *  Rough heuristic: 1 token ~ 4 chars for code/English mix. */
function getNoise(targetTokens: number): string {
  const targetChars = targetTokens * 4;
  if (!_noiseCache || _noiseCache.length < targetChars) {
    const files = collectSourceFiles(targetChars + 500_000);
    _noiseCache = files.join("\n");
  }
  // Truncate or repeat to reach target
  if (_noiseCache.length >= targetChars) {
    return _noiseCache.slice(0, targetChars);
  }
  // Repeat if we don't have enough
  let result = _noiseCache;
  while (result.length < targetChars) {
    result += "\n" + _noiseCache;
  }
  return result.slice(0, targetChars);
}

/** Split noise into a prefix/suffix at a given fractional position */
function splitNoise(
  totalTokens: number,
  signalChars: number,
  position: number,
): { before: string; after: string } {
  const totalChars = totalTokens * 4;
  const noiseChars = totalChars - signalChars;
  const beforeChars = Math.floor(noiseChars * position);
  const afterChars = noiseChars - beforeChars;
  const noise = getNoise(totalTokens);
  return {
    before: noise.slice(0, beforeChars),
    after: noise.slice(beforeChars, beforeChars + afterChars),
  };
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function callModel(
  client: Anthropic,
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024,
): Promise<{ text: string; usage: TokenUsage; latencyMs: number }> {
  const start = Date.now();
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const latencyMs = Date.now() - start;

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return {
    text,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
    latencyMs,
  };
}

// ---------------------------------------------------------------------------
// Scenario 1: Needle-in-Haystack
// ---------------------------------------------------------------------------
// Insert a unique fact at a specific position within noise text.
// Ask the model to retrieve it. Binary scoring: found or not.

const NEEDLE_FACT = "The secret project codename is AURORA-7";
const NEEDLE_POSITIONS = [0.1, 0.25, 0.5, 0.75, 0.9];

async function runNeedleInHaystack(
  client: Anthropic,
  model: string,
  contextSize: number,
  position: number,
): Promise<TurnRecord> {
  const needle = `\n[CLASSIFIED MEMO] ${NEEDLE_FACT}. This information is eyes-only.\n`;
  const { before, after } = splitNoise(contextSize, needle.length, position);

  const userMessage = `${before}${needle}${after}

---
Based on the documents above, what is the secret project codename? Reply with ONLY the codename, nothing else.`;

  const system =
    "You are a document analyst. Answer questions precisely based on the provided documents.";

  const { text, usage, latencyMs } = await callModel(client, model, system, userMessage);

  // Score: does the response contain AURORA-7?
  const found = text.toUpperCase().includes("AURORA-7");

  return {
    scenario: "needle-in-haystack",
    label: `pos=${Math.round(position * 100)}%`,
    contextSize,
    usage,
    latencyMs,
    score: found ? 1 : 0,
    maxScore: 1,
    timestamp: Date.now(),
    raw: text.slice(0, 200),
  };
}

// ---------------------------------------------------------------------------
// Scenario 2: Multi-Hop Reasoning
// ---------------------------------------------------------------------------
// Three related facts placed at different positions in the context.
// Fact C -> Fact B -> Fact A chain. Question requires all three hops.
//
// Fact C: "Agent Falcon's real name is Dr. Elena Vasquez."
// Fact B: "Dr. Elena Vasquez discovered compound ZX-42 in 2019."
// Fact A: "Compound ZX-42 is stored in Vault 9 at the Geneva facility."
// Question: "Where is the compound discovered by Agent Falcon stored?"
// Answer requires: Falcon -> Vasquez -> ZX-42 -> Vault 9, Geneva

const MULTI_HOP_FACTS = [
  {
    text: "\n[PERSONNEL FILE] Agent Falcon's real name is Dr. Elena Vasquez. This alias has been active since 2015.\n",
    position: 0.2,
  },
  {
    text: "\n[RESEARCH LOG] Dr. Elena Vasquez discovered compound ZX-42 during her 2019 expedition to the Atacama Desert.\n",
    position: 0.5,
  },
  {
    text: "\n[INVENTORY RECORD] Compound ZX-42 is stored in Vault 9 at the Geneva facility, temperature-controlled at -40C.\n",
    position: 0.8,
  },
];

async function runMultiHopReasoning(
  client: Anthropic,
  model: string,
  contextSize: number,
): Promise<TurnRecord> {
  // Build the context with facts embedded at their positions
  const totalChars = contextSize * 4;
  const factChars = MULTI_HOP_FACTS.reduce((s, f) => s + f.text.length, 0);
  const noiseChars = totalChars - factChars;
  const noise = getNoise(contextSize);

  // Place facts at their positions within the noise
  const positions = MULTI_HOP_FACTS.map((f) => ({
    ...f,
    charPos: Math.floor(noiseChars * f.position),
  })).sort((a, b) => a.charPos - b.charPos);

  let assembled = "";
  let noiseOffset = 0;
  for (const fact of positions) {
    const chunkEnd = Math.min(fact.charPos, noiseChars);
    assembled += noise.slice(noiseOffset, chunkEnd) + fact.text;
    noiseOffset = chunkEnd;
  }
  assembled += noise.slice(noiseOffset, noiseChars);

  const userMessage = `${assembled}

---
Based on the documents above, answer this question step by step:
Where is the compound discovered by Agent Falcon stored? What facility and what vault number?
Reply concisely.`;

  const system =
    "You are an intelligence analyst. Reason through documents step by step to answer questions.";

  const { text, usage, latencyMs } = await callModel(client, model, system, userMessage, 512);

  // Score each hop: 0-3
  const response = text.toLowerCase();
  let score = 0;
  // Hop 1: Falcon -> Vasquez
  if (response.includes("vasquez") || response.includes("elena")) score++;
  // Hop 2: Vasquez -> ZX-42
  if (response.includes("zx-42") || response.includes("zx42")) score++;
  // Hop 3: ZX-42 -> Vault 9, Geneva
  if (response.includes("vault 9") || response.includes("vault-9")) score++;

  return {
    scenario: "multi-hop-reasoning",
    label: `3-hop`,
    contextSize,
    usage,
    latencyMs,
    score,
    maxScore: 3,
    timestamp: Date.now(),
    raw: text.slice(0, 300),
  };
}

// ---------------------------------------------------------------------------
// Scenario 3: Code Analysis + Noise
// ---------------------------------------------------------------------------
// A small code snippet with a subtle off-by-one bug, surrounded by
// irrelevant code from the repo. The model must identify the bug.

const BUGGY_CODE = `
\`\`\`typescript
// pagination.ts — paginate an array of items
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = Math.ceil(items.length / pageSize);
  if (page < 1 || page > totalPages) return [];

  const start = page * pageSize;         // BUG: should be (page - 1) * pageSize
  const end = start + pageSize;
  return items.slice(start, end);
}

// Example: paginate([1,2,3,4,5,6,7,8,9,10], 1, 3) should return [1,2,3]
// but actually returns [4,5,6] because start is 3 instead of 0
\`\`\`
`;

async function runCodeAnalysis(
  client: Anthropic,
  model: string,
  contextSize: number,
): Promise<TurnRecord> {
  const { before, after } = splitNoise(
    contextSize,
    BUGGY_CODE.length,
    0.5, // bug in the middle
  );

  const userMessage = `Here is a codebase to review. Find any bugs.

${before}

${BUGGY_CODE}

${after}

---
Review the code above. There is exactly ONE bug in a function called \`paginate\`.
What is the bug? Reply with a one-sentence description of the bug and the fix.`;

  const system =
    "You are a senior code reviewer. Find bugs precisely and explain the fix concisely.";

  const { text, usage, latencyMs } = await callModel(client, model, system, userMessage, 512);

  // Score: did the model identify the off-by-one?
  const response = text.toLowerCase();
  const found =
    (response.includes("page - 1") ||
      response.includes("(page-1)") ||
      response.includes("page -1") ||
      response.includes("off-by-one") ||
      response.includes("off by one") ||
      response.includes("should be 0") ||
      response.includes("starts at 0")) &&
    (response.includes("paginate") ||
      response.includes("pagination") ||
      response.includes("start"));

  return {
    scenario: "code-analysis",
    label: "off-by-one",
    contextSize,
    usage,
    latencyMs,
    score: found ? 1 : 0,
    maxScore: 1,
    timestamp: Date.now(),
    raw: text.slice(0, 300),
  };
}

// ---------------------------------------------------------------------------
// Scenario 4: Compressed vs Raw
// ---------------------------------------------------------------------------
// Compare a 6K compressed summary vs a ~40K raw conversation.
// Both are asked the same analysis question. A second API call judges quality.

const RAW_CONVERSATION = `
User: Hey, I've been thinking about our deployment strategy. We currently push to staging on every PR merge.
Assistant: That's a common pattern. What issues are you seeing?
User: Well, the main problem is that staging is always in a broken state because multiple PRs merge throughout the day.
Assistant: That's the "staging is always broken" problem. A few approaches: 1) Feature flags to decouple deploy from release, 2) Deploy queues so staging only gets one PR at a time, 3) Ephemeral environments per PR.
User: Ephemeral environments sound expensive. We're a 5-person team.
Assistant: Fair point. For a small team, a deploy queue is lightweight. You could use a simple GitHub Action that: queues merged PRs, deploys them to staging one at a time, runs smoke tests, and auto-promotes to production if tests pass.
User: What about rollbacks?
Assistant: Keep the last 3 production builds tagged. If smoke tests fail, the queue pauses and alerts the team. Rollback is just re-deploying the previous tagged build. You could automate this with a "rollback" label on the PR.
User: We also need to handle database migrations. Some PRs include schema changes.
Assistant: Database migrations add complexity. Key principles: 1) Always make migrations backward-compatible (additive only). 2) Split breaking changes into expand-contract phases. 3) Run migrations before code deploy, never after. 4) Include a migration check in your deploy queue.
User: Can you give an example of expand-contract?
Assistant: Sure. Say you want to rename column "username" to "handle". Phase 1 (expand): Add "handle" column, write to both columns, read from "handle" with fallback to "username". Deploy this. Phase 2 (contract): Once all code reads from "handle", drop the "username" column in a separate PR. Each phase is independently deployable and rollback-safe.
User: That makes sense. What about feature flags for the frontend?
Assistant: For a small team, start simple: a JSON config file in your repo that maps flag names to boolean values. Your CI injects the config at build time. No need for LaunchDarkly or similar services until you have 20+ flags or need per-user targeting.
User: We also discussed using canary deployments. Is that overkill for us?
Assistant: For 5 people, yes. Canary requires traffic splitting infrastructure, metrics collection, and automated rollback triggers. Stick with the deploy queue + smoke tests approach. You can add canary later when you have more traffic and a dedicated platform team.
User: One more thing — our CI takes 12 minutes. That's too slow for the queue approach.
Assistant: 12 minutes is indeed a bottleneck. Quick wins: 1) Parallelize test suites across workers. 2) Cache dependencies aggressively (node_modules, Docker layers). 3) Only run tests for affected packages (use turborepo or nx for this). 4) Move linting to a pre-commit hook so CI doesn't redo it. Target: under 5 minutes for the critical path.
User: Thanks, this is really helpful. Let me summarize what we'll do.
Assistant: Great, here's the action plan: 1) Implement a deploy queue GitHub Action. 2) Add smoke tests that gate promotion. 3) Keep 3 tagged production builds for rollback. 4) Make all migrations backward-compatible. 5) Use a simple JSON feature flag system. 6) Optimize CI to under 5 minutes. Skip canary for now.
`;

const COMPRESSED_SUMMARY = `
## Deployment Strategy Discussion — Summary

**Problem**: Staging environment constantly broken due to concurrent PR merges.

**Decided approach** (for a 5-person team):
1. **Deploy queue**: GitHub Action queues merged PRs, deploys to staging one at a time, runs smoke tests, auto-promotes to prod on success.
2. **Rollbacks**: Keep last 3 tagged production builds. Auto-rollback on smoke test failure.
3. **Database migrations**: Always backward-compatible (additive). Use expand-contract pattern for breaking changes (e.g., rename column = add new column first, migrate reads, then drop old column).
4. **Feature flags**: Simple JSON config in repo, injected at build time. No external service needed yet.
5. **CI optimization target**: Under 5 minutes (parallelize tests, cache deps, only test affected packages, move lint to pre-commit).
6. **Canary deployments**: Deferred — overkill for current team size.
`;

const SCENARIO4_QUESTION = `Based on the information provided, answer these questions:
1. What is the recommended approach for handling database column renames?
2. Why was canary deployment rejected?
3. What is the CI optimization target and what are the specific strategies?
Reply concisely with numbered answers.`;

async function runCompressedVsRaw(client: Anthropic, model: string): Promise<TurnRecord[]> {
  const results: TurnRecord[] = [];

  // (a) Compressed summary (~1.5K chars, ~375 tokens)
  const compressedResult = await callModel(
    client,
    model,
    "You are a technical analyst. Answer based on the provided context.",
    `${COMPRESSED_SUMMARY}\n\n---\n${SCENARIO4_QUESTION}`,
    512,
  );

  // (b) Raw conversation padded with noise to ~40K tokens
  const noise = getNoise(35_000); // ~35K tokens of noise + ~5K of conversation
  const rawResult = await callModel(
    client,
    model,
    "You are a technical analyst. Answer based on the provided context.",
    `${noise.slice(0, 70_000)}\n\n${RAW_CONVERSATION}\n\n${noise.slice(70_000, 100_000)}\n\n---\n${SCENARIO4_QUESTION}`,
    512,
  );

  // Judge both responses with a second API call
  for (const [label, result, approxSize] of [
    ["compressed-6K", compressedResult, 1_500] as const,
    ["raw-40K", rawResult, 40_000] as const,
  ]) {
    const judgeResult = await callModel(
      client,
      model,
      "You are a response quality judge. Score the answer 1-5 based on accuracy, completeness, and conciseness. Reply with ONLY a single digit 1-5.",
      `Question:\n${SCENARIO4_QUESTION}\n\nAnswer to judge:\n${result.text}\n\nGround truth: The expand-contract pattern should be mentioned for column renames. Canary was rejected because the team is too small (5 people). CI target is under 5 minutes with 4 specific strategies (parallelize, cache, affected-only, pre-commit lint).\n\nScore (1-5):`,
      8,
    );

    const scoreMatch = judgeResult.text.match(/[1-5]/);
    const score = scoreMatch ? parseInt(scoreMatch[0], 10) : 0;

    results.push({
      scenario: "compressed-vs-raw",
      label,
      contextSize: approxSize,
      usage: {
        input_tokens: result.usage.input_tokens + judgeResult.usage.input_tokens,
        output_tokens: result.usage.output_tokens + judgeResult.usage.output_tokens,
      },
      latencyMs: result.latencyMs + judgeResult.latencyMs,
      score,
      maxScore: 5,
      timestamp: Date.now(),
      raw: result.text.slice(0, 300),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Result formatting
// ---------------------------------------------------------------------------

function formatMarkdownTable(records: readonly TurnRecord[]): string {
  const lines: string[] = [];
  lines.push(
    "| Scenario | Label | Context Size | Score | Latency (ms) | Input Tokens | Output Tokens | Cost ($) |",
  );
  lines.push(
    "|----------|-------|-------------|-------|-------------|-------------|--------------|----------|",
  );

  for (const r of records) {
    const cost = (r.usage.input_tokens / 1_000_000) * 15 + (r.usage.output_tokens / 1_000_000) * 75;
    lines.push(
      `| ${r.scenario} | ${r.label} | ${r.contextSize.toLocaleString()} | ${r.score}/${r.maxScore} | ${r.latencyMs.toLocaleString()} | ${r.usage.input_tokens.toLocaleString()} | ${r.usage.output_tokens.toLocaleString()} | ${cost.toFixed(4)} |`,
    );
  }

  return lines.join("\n");
}

function formatAnalysis(records: readonly TurnRecord[]): string {
  const lines: string[] = ["\n## Analysis\n"];

  // Group by scenario
  const byScenario = new Map<string, TurnRecord[]>();
  for (const r of records) {
    const list = byScenario.get(r.scenario) ?? [];
    list.push(r);
    byScenario.set(r.scenario, list);
  }

  for (const [scenario, turns] of byScenario) {
    lines.push(`### ${scenario}`);
    const avgScore = turns.reduce((s, t) => s + t.score / t.maxScore, 0) / turns.length;
    const avgLatency = turns.reduce((s, t) => s + t.latencyMs, 0) / turns.length;
    lines.push(`- Average accuracy: ${(avgScore * 100).toFixed(1)}%`);
    lines.push(`- Average latency: ${Math.round(avgLatency).toLocaleString()} ms`);

    // For needle-in-haystack, show accuracy by context size
    if (scenario === "needle-in-haystack") {
      const bySize = new Map<number, TurnRecord[]>();
      for (const t of turns) {
        const list = bySize.get(t.contextSize) ?? [];
        list.push(t);
        bySize.set(t.contextSize, list);
      }
      for (const [size, sizeTurns] of bySize) {
        const acc = sizeTurns.reduce((s, t) => s + t.score, 0) / sizeTurns.length;
        lines.push(
          `  - ${size.toLocaleString()} tokens: ${(acc * 100).toFixed(0)}% retrieval accuracy`,
        );
      }
    }

    // For compressed-vs-raw, direct comparison
    if (scenario === "compressed-vs-raw") {
      const compressed = turns.find((t) => t.label.includes("compressed"));
      const raw = turns.find((t) => t.label.includes("raw"));
      if (compressed && raw) {
        lines.push(
          `  - Compressed (${compressed.contextSize.toLocaleString()} tokens): score ${compressed.score}/${compressed.maxScore}`,
        );
        lines.push(
          `  - Raw (${raw.contextSize.toLocaleString()} tokens): score ${raw.score}/${raw.maxScore}`,
        );
        const costComp =
          (compressed.usage.input_tokens / 1_000_000) * 15 +
          (compressed.usage.output_tokens / 1_000_000) * 75;
        const costRaw =
          (raw.usage.input_tokens / 1_000_000) * 15 + (raw.usage.output_tokens / 1_000_000) * 75;
        lines.push(`  - Cost ratio: raw is ${(costRaw / costComp).toFixed(1)}x more expensive`);
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs();
  const client = new Anthropic();
  const tracker = new TokenTracker();
  const sem = new Semaphore(args.concurrency);

  console.log(`Context Discipline Benchmark`);
  console.log(`Model: ${args.model}`);
  console.log(`Concurrency: ${args.concurrency}`);
  console.log(`Context sizes: ${args.sizes.map((s) => s.toLocaleString()).join(", ")}`);
  console.log(`---\n`);

  // Pre-warm noise cache
  console.log("Loading noise corpus from src/ and docs/ ...");
  const maxSize = Math.max(...args.sizes);
  getNoise(maxSize);
  console.log("Noise corpus loaded.\n");

  // Build task list
  type Task = () => Promise<TurnRecord | TurnRecord[]>;
  const tasks: Task[] = [];

  // Scenario 1: Needle-in-Haystack — all sizes x all positions
  for (const size of args.sizes) {
    for (const pos of NEEDLE_POSITIONS) {
      tasks.push(() => runNeedleInHaystack(client, args.model, size, pos));
    }
  }

  // Scenario 2: Multi-Hop — all sizes
  for (const size of args.sizes) {
    tasks.push(() => runMultiHopReasoning(client, args.model, size));
  }

  // Scenario 3: Code Analysis — all sizes
  for (const size of args.sizes) {
    tasks.push(() => runCodeAnalysis(client, args.model, size));
  }

  // Scenario 4: Compressed vs Raw — single run
  tasks.push(() => runCompressedVsRaw(client, args.model));

  const totalTasks = tasks.length;
  let completed = 0;

  console.log(`Running ${totalTasks} benchmark tasks...\n`);

  // Execute all tasks with concurrency limit
  const results = await Promise.allSettled(
    tasks.map((task) =>
      sem.run(async () => {
        const result = await task();
        completed++;
        const pct = Math.round((completed / totalTasks) * 100);
        process.stdout.write(`\r  Progress: ${completed}/${totalTasks} (${pct}%)`);
        return result;
      }),
    ),
  );

  console.log("\n");

  // Collect all records
  const allRecords: TurnRecord[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      const val = result.value;
      if (Array.isArray(val)) {
        allRecords.push(...val);
      } else {
        allRecords.push(val);
      }
    } else {
      console.error(`Task failed: ${result.reason}`);
    }
  }

  // Track tokens
  for (const record of allRecords) {
    tracker.record(record);
  }

  // Output results
  console.log("## Results\n");
  console.log(formatMarkdownTable(allRecords));
  console.log(formatAnalysis(allRecords));

  console.log("## Token Usage\n");
  console.log(tracker.formatSummary());
  console.log("");

  // Write JSON results
  const resultsDir = path.join(REPO_ROOT, "scripts", "benchmark-results");
  fs.mkdirSync(resultsDir, { recursive: true });

  const dateStr = new Date().toISOString().slice(0, 10);
  const outputPath = path.join(resultsDir, `context-discipline-${dateStr}.json`);
  const output = {
    meta: {
      model: args.model,
      concurrency: args.concurrency,
      sizes: args.sizes,
      timestamp: new Date().toISOString(),
      totalInputTokens: tracker.totalInputTokens,
      totalOutputTokens: tracker.totalOutputTokens,
      estimatedCostUsd: tracker.estimatedCostUsd,
    },
    records: allRecords,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Raw results written to: ${outputPath}`);
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
