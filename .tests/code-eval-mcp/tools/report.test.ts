import { describe, expect, it } from "vitest";
import { runEvalPipeline } from "../../../src/mcp-tools/code-eval/core-logic/report.js";
import { generateChallenge } from "../../../src/mcp-tools/code-eval/core-logic/challenges.js";

describe("runEvalPipeline", () => {
  it("produces a complete report for correct solution", async () => {
    const challenge = generateChallenge("easy", "math", 42);
    expect(challenge).toBeDefined();

    const c1 = challenge as NonNullable<typeof challenge>;
    const report = await runEvalPipeline(c1.referenceSolution, c1.id);

    expect(report.challenge.id).toBe(c1.id);
    expect(report.challenge.title).toBeDefined();
    expect(report.originalTestCount).toBeGreaterThan(0);
    expect(report.amplifiedTestCount).toBeGreaterThanOrEqual(report.originalTestCount);
    expect(report.evalResult.passRate).toBeGreaterThan(0.8);
    expect(report.eloRating.elo).toBeGreaterThan(800);
    expect(report.summary).toBeDefined();
    expect(report.summary.length).toBeGreaterThan(0);
  });

  it("produces a low-rated report for incorrect solution", async () => {
    const challenge = generateChallenge("easy", "arrays", 42);
    expect(challenge).toBeDefined();

    const c2 = challenge as NonNullable<typeof challenge>;
    const report = await runEvalPipeline("function solution() { return 0; }", c2.id);

    expect(report.evalResult.passRate).toBeLessThan(1);
    expect(report.eloRating.elo).toBeLessThan(1600);
  });

  it("generates a challenge when no challengeId provided", async () => {
    const report = await runEvalPipeline(
      "function solution(n) { return n; }",
      undefined,
      "easy",
      "math",
    );

    expect(report.challenge.category).toBe("math");
    expect(report.challenge.difficulty).toBe("easy");
  });

  it("includes amplified tests in the report", async () => {
    const challenge = generateChallenge("easy", "strings", 99);
    expect(challenge).toBeDefined();

    const c3 = challenge as NonNullable<typeof challenge>;
    const report = await runEvalPipeline(c3.referenceSolution, c3.id);

    // Amplification should add tests beyond the original set
    expect(report.amplifiedTestCount).toBeGreaterThanOrEqual(report.originalTestCount);
  });

  it("summary contains Elo and pass rate", async () => {
    const challenge = generateChallenge("easy", "math", 1);
    expect(challenge).toBeDefined();

    const c4 = challenge as NonNullable<typeof challenge>;
    const report = await runEvalPipeline(c4.referenceSolution, c4.id);

    expect(report.summary).toContain("Elo");
    expect(report.summary).toMatch(/\d+\/\d+/); // "X/Y tests"
  });

  it("throws for invalid challenge parameters", async () => {
    await expect(
      runEvalPipeline("function solution() {}", "nonexistent-id-easy-999"),
    ).rejects.toThrow();
  });
});
