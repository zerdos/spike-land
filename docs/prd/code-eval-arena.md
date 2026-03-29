# Code Eval Arena — LLM Coding Benchmark MCP Server | PRD v1.0

> **Date**: 29 March 2026
> **Author**: The Arena (Radix, Zoltan, Erdos, Arnold, Raju)
> **Status**: Draft — executable blueprint
> **Company**: SPIKE LAND LTD
> **Current state**: No eval infrastructure exists. Platform has 80+ MCP tools
> but no way to evaluate LLM coding ability. Zero benchmarking surface.

---

## 1. Product Vision

An MCP server that evaluates LLM-generated code using the best ideas from 15
academic benchmarks, distilled into 5 tools that actually matter.

The insight from the benchmark landscape: the market has too many benchmarks
measuring the wrong thing (isolated function generation) and not enough
measuring the right thing (cross-file repo work with robust test coverage). Most
benchmarks are saturated (HumanEval 95%+), contaminated (training data overlap),
or too narrow (single language, single domain).

Code Eval Arena takes what works:

| Source Benchmark | Idea We Steal | Why |
|---|---|---|
| **EvalPlus** | Test amplification (80x expansion) | Thin test suites produce false positives |
| **CodeElo** | Elo rating system | Intuitive scoring humans understand |
| **LiveCodeBench** | Temporal freshness gating | Only defense against contamination |
| **RepoBench** | Cross-file eval (retrieval → completion) | Tests what agents actually do |
| **SWE-bench** | Real issue resolution | Most realistic coding task |

> **Radix**: "15 benchmarks and most of them test whether an LLM can write
> FizzBuzz. The world doesn't need another pass@k leaderboard. It needs custom
> eval pipelines applied to YOUR codebase. That's what we're building."

> **Erdos**: "The elegant formulation: CodeEval = f(code, tests) → elo_rating.
> Test amplification is the multiplier. Temporal filtering is the integrity
> guarantee. Everything else is presentation."

> **Arnold**: "If I can't run an eval from a chat message in under 10 seconds,
> it's not a product. No CLI setup, no Docker, no 'download this 2GB dataset
> first'. MCP tool call. Done."

> **Zoltan**: "We ship it as MCP tools. Any Claude Code session, any chat
> persona, any automation pipeline can call `eval_code` and get a structured
> result. That's the distribution advantage — zero install."

> **Raju**: "I will use this to test every code generation persona on the
> platform. Einstein writes physics sims? Eval it. GP ships a banking app? Eval
> it. If the code doesn't pass amplified tests, the persona gets flagged."

---

## 2. Core Features

### Feature 1: Code Evaluator (`eval_code`)

Submit code + test cases. Get a structured correctness report.

**What it does**:

- Accepts a code snippet (function/module) and test suite (assertions)
- Runs code in a sandboxed environment (isolated `Function` constructor, no
  `eval`, no filesystem access)
- Reports: pass/fail per test, execution time, error messages
- Supports JavaScript and TypeScript (transpiled to JS before execution)

**Schema**:

```typescript
{
  code: z.string().describe("The code to evaluate"),
  tests: z.array(z.object({
    name: z.string().describe("Test case name"),
    input: z.string().describe("Expression to evaluate (uses `solution` as the export)"),
    expected: z.string().describe("Expected result as JSON string"),
  })).describe("Test cases to run against the code"),
  language: z.enum(["javascript", "typescript"]).default("javascript"),
  timeoutMs: z.number().int().min(100).max(30000).default(5000),
}
```

**Done-when**:

- [ ] `eval_code` tool registered and callable
- [ ] Sandboxed execution prevents filesystem/network access
- [ ] Each test reports pass/fail/error independently
- [ ] Timeout enforcement per test case
- [ ] TypeScript code transpiled before execution

---

### Feature 2: Test Amplifier (`amplify_tests`)

Given code and a small test suite, generate additional test cases that probe edge
cases, boundary conditions, and error paths. EvalPlus-style expansion.

**What it does**:

- Analyzes the code to understand its interface (function signature, types)
- Generates edge case inputs: empty arrays, zero, negative, unicode, max int,
  null-ish, duplicate elements, single element, large inputs
- Generates boundary tests: off-by-one, empty string, max length
- Generates error path tests: invalid types, missing args, malformed input
- Returns structured test cases compatible with `eval_code`

**Schema**:

```typescript
{
  code: z.string().describe("The code to generate additional tests for"),
  existingTests: z.array(z.object({
    name: z.string(),
    input: z.string(),
    expected: z.string(),
  })).optional().describe("Existing tests to build upon"),
  amplificationFactor: z.number().int().min(2).max(50).default(10),
}
```

**Strategy** (deterministic, no LLM needed):

1. Parse function signature to extract parameter types
2. For each parameter type, apply type-specific mutation strategies:
   - `number` → 0, -1, 1, NaN, Infinity, -Infinity, MAX_SAFE_INTEGER
   - `string` → "", " ", "a", very long string, unicode, special chars
   - `array` → [], [single], [duplicates], sorted, reverse-sorted, large
   - `boolean` → true, false
   - `object` → {}, null, nested
3. Combine mutations across parameters (cartesian product, capped)
4. Filter out duplicates of existing tests

**Done-when**:

- [ ] `amplify_tests` tool registered and callable
- [ ] Generates at least 5x tests from a single-test input
- [ ] Type-aware mutation strategies for number, string, array, boolean, object
- [ ] Output format compatible with `eval_code` input

---

### Feature 3: Elo Rating (`rate_solution`)

Compare a solution against reference solutions using a chess-style Elo system.
Makes benchmark scores intuitive: "This solution is rated 1650" is immediately
meaningful.

**What it does**:

- Maintains an in-memory Elo ladder per evaluation session
- Compares solutions by: correctness (pass rate), performance (execution time),
  code quality (length as proxy for complexity)
- Returns Elo rating and percentile
- Supports head-to-head comparison between two solutions

**Schema**:

```typescript
{
  solutionCode: z.string().describe("The solution to rate"),
  referenceCode: z.string().optional().describe("Reference solution to compare against"),
  tests: z.array(z.object({
    name: z.string(),
    input: z.string(),
    expected: z.string(),
  })).describe("Test suite for evaluation"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
}
```

**Elo Calculation**:

- Base rating: 1000 (new player)
- K-factor: 32 (standard)
- Score components: correctness (70%), speed (20%), brevity (10%)
- Difficulty multiplier: easy=0.8, medium=1.0, hard=1.2

**Done-when**:

- [ ] `rate_solution` tool registered and callable
- [ ] Elo calculation matches standard algorithm (±1 of reference impl)
- [ ] Difficulty affects rating delta appropriately
- [ ] Returns: elo, percentile, pass_rate, avg_execution_ms

---

### Feature 4: Challenge Generator (`generate_challenge`)

Generate coding challenges with test suites at specified difficulty levels.
Provides fresh problems not in any training dataset.

**What it does**:

- Generates algorithmic challenges from parameterized templates
- Templates cover: array manipulation, string processing, math, data structures
- Each challenge includes: description, function signature, starter code, test
  suite (5-10 tests), reference solution
- Difficulty controls: input size, edge case density, algorithmic complexity

**Schema**:

```typescript
{
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  category: z.enum([
    "arrays", "strings", "math", "sorting",
    "searching", "data-structures", "dynamic-programming",
  ]).optional().describe("Problem category"),
  seed: z.number().int().optional().describe("Random seed for reproducibility"),
}
```

**Template Examples**:

- Easy: "Given an array, return the sum of elements greater than X"
- Medium: "Find the longest substring with at most K distinct characters"
- Hard: "Given a weighted graph, find the shortest path with at most N edges"

**Done-when**:

- [ ] `generate_challenge` tool registered and callable
- [ ] At least 20 challenge templates across all categories
- [ ] Seed produces deterministic output
- [ ] Generated tests are verified against reference solution

---

### Feature 5: Eval Report (`eval_report`)

Run a full evaluation pipeline: generate challenge → amplify tests → evaluate
code → rate. Returns a comprehensive report.

**What it does**:

- Orchestrates the full pipeline in one call
- Accepts code and optionally a challenge (or generates one)
- Amplifies test suite automatically
- Returns structured report with all metrics

**Schema**:

```typescript
{
  code: z.string().describe("The solution code to evaluate"),
  challengeId: z.string().optional().describe("Previously generated challenge ID"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  category: z.string().optional(),
}
```

**Done-when**:

- [ ] `eval_report` tool registered and callable
- [ ] Orchestrates generate → amplify → eval → rate pipeline
- [ ] Returns: challenge description, test results, elo rating, summary

---

## 3. Architecture

### MCP Server (Node.js)

Standard `@spike-land-ai` MCP server pattern:

```
src/mcp-tools/code-eval/
├── manifest.json
├── index.ts
├── core-logic/
│   ├── sandbox.ts          # Sandboxed code execution engine
│   ├── evaluator.ts        # eval_code tool
│   ├── amplifier.ts        # amplify_tests tool
│   ├── elo.ts              # rate_solution tool + Elo calculator
│   ├── challenges.ts       # generate_challenge tool + templates
│   ├── report.ts           # eval_report orchestrator tool
│   └── challenge-templates/ # Parameterized challenge definitions
│       ├── arrays.ts
│       ├── strings.ts
│       ├── math.ts
│       ├── sorting.ts
│       └── data-structures.ts
└── mcp/
    ├── index.ts            # Server entry point
    └── types.ts            # Types & re-exports
```

### Sandboxing Strategy

No `eval()`. No `vm`. Use `new Function()` with:
- No access to `require`, `import`, `process`, `fs`, `fetch`, `globalThis`
- Timeout via `setTimeout` + `Promise.race`
- Memory limit via output size cap (1MB)
- Each test runs in its own `try/catch`

### No External Dependencies

The entire eval engine runs locally with zero network calls. No LLM needed for
test amplification (deterministic mutations). No database (in-memory Elo
ladder). No Docker. Just pure computation.

---

## 4. What We're NOT Building

- **Not a leaderboard service.** No persistence, no global rankings. Eval is
  stateless per call. If the platform wants to track Elo over time, that's a
  separate service on top.
- **Not a Jupyter/REPL.** This evaluates code, it doesn't provide an
  interactive coding environment.
- **Not reproducing academic benchmarks.** We're not downloading HumanEval's 164
  problems. We generate fresh problems from templates.
- **Not supporting Python/Go/Rust.** JavaScript and TypeScript only. This runs
  in Node.js, and the spike.land platform is JS-native.

---

## 5. Success Metrics

| Metric | Target |
|---|---|
| `eval_code` latency (10 tests) | < 500ms |
| `amplify_tests` expansion ratio | 5-20x from seed tests |
| `generate_challenge` template count | 20+ across 5 categories |
| False positive rate (code passes thin tests but fails amplified) | > 15% detection rate |
| Test coverage | Tier 1 (90%+) |

---

## 6. Platform Integration

### Chat Persona (Spike Chat)

Any persona can call the eval tools during a conversation:

```
User: "Write a function that finds the longest palindrome in a string"
Persona: *generates code* → calls eval_report → "Your solution scores Elo 1450.
It passed 8/12 tests. The 4 failures were edge cases: empty string, single char,
string with all identical chars, and unicode palindromes."
```

### MCP Registry

All 5 tools registered in the spike-land-mcp registry under category
`code-eval`. Available to any MCP client.

### QA Arena Integration

Raju's QA persona can use `eval_code` to validate code blocks in blog posts,
documentation examples, and generated code artifacts.
