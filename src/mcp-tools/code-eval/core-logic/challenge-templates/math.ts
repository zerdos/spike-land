/**
 * Math challenge templates.
 */

import type { Challenge, ChallengeTemplate, Difficulty } from "../../mcp/types.js";

export const fibonacci: ChallengeTemplate = {
  title: "Fibonacci Number",
  category: "math",
  difficulties: ["easy", "medium", "hard"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const expectedResults: Record<number, number> = {
      0: 0,
      1: 1,
      2: 1,
      3: 2,
      4: 3,
      5: 5,
      6: 8,
      7: 13,
      8: 21,
      10: 55,
      15: 610,
      20: 6765,
      30: 832040,
    };

    let cases: number[];
    if (difficulty === "easy") cases = [0, 1, 2, 3, 5, 8, 10];
    else if (difficulty === "medium") cases = [0, 1, 2, 5, 10, 15, 20];
    else cases = [0, 1, 2, 5, 10, 15, 20, 30];

    return {
      id: `math-fibonacci-${difficulty}-${seed}`,
      title: "Fibonacci Number",
      description:
        "Given a non-negative integer n, return the nth Fibonacci number. F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2).",
      functionSignature: `function solution(n: number): number`,
      starterCode: `function solution(n) {\n  // Your code here\n}`,
      tests: cases.map((n, i) => ({
        name: `test_${i}`,
        input: `solution(${n})`,
        expected: JSON.stringify(expectedResults[n]),
      })),
      referenceSolution: `function solution(n) {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; }\n  return b;\n}`,
      difficulty,
      category: "math",
    };
  },
};

export const isPrime: ChallengeTemplate = {
  title: "Is Prime",
  category: "math",
  difficulties: ["easy", "medium"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const cases: Array<[number, boolean]> = [
      [0, false],
      [1, false],
      [2, true],
      [3, true],
      [4, false],
      [5, true],
      [7, true],
      [9, false],
      [11, true],
      [15, false],
      [17, true],
      [25, false],
      [29, true],
    ];

    if (difficulty === "medium") {
      cases.push([97, true], [100, false], [101, true], [997, true], [1000, false]);
    }

    return {
      id: `math-prime-${difficulty}-${seed}`,
      title: "Is Prime",
      description: "Given a non-negative integer, return true if it is a prime number.",
      functionSignature: `function solution(n: number): boolean`,
      starterCode: `function solution(n) {\n  // Your code here\n}`,
      tests: cases.map(([n, expected], i) => ({
        name: `test_${i}`,
        input: `solution(${n})`,
        expected: JSON.stringify(expected),
      })),
      referenceSolution: `function solution(n) {\n  if (n < 2) return false;\n  for (let i = 2; i * i <= n; i++) { if (n % i === 0) return false; }\n  return true;\n}`,
      difficulty,
      category: "math",
    };
  },
};

export const gcd: ChallengeTemplate = {
  title: "Greatest Common Divisor",
  category: "math",
  difficulties: ["easy", "medium"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const cases: Array<[number, number, number]> = [
      [12, 8, 4],
      [7, 3, 1],
      [100, 75, 25],
      [0, 5, 5],
      [1, 1, 1],
      [17, 17, 17],
      [48, 36, 12],
    ];

    if (difficulty === "medium") {
      cases.push([1071, 462, 21], [270, 192, 6], [10000, 625, 625]);
    }

    return {
      id: `math-gcd-${difficulty}-${seed}`,
      title: "Greatest Common Divisor",
      description: "Given two non-negative integers, return their greatest common divisor (GCD).",
      functionSignature: `function solution(a: number, b: number): number`,
      starterCode: `function solution(a, b) {\n  // Your code here\n}`,
      tests: cases.map(([a, b, expected], i) => ({
        name: `test_${i}`,
        input: `solution(${a}, ${b})`,
        expected: JSON.stringify(expected),
      })),
      referenceSolution: `function solution(a, b) {\n  while (b !== 0) { [a, b] = [b, a % b]; }\n  return a;\n}`,
      difficulty,
      category: "math",
    };
  },
};

export const powerOfTwo: ChallengeTemplate = {
  title: "Power of Two",
  category: "math",
  difficulties: ["easy"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const cases: Array<[number, boolean]> = [
      [1, true],
      [2, true],
      [3, false],
      [4, true],
      [5, false],
      [8, true],
      [16, true],
      [15, false],
      [0, false],
      [1024, true],
      [1023, false],
      [64, true],
    ];

    return {
      id: `math-power-of-two-${difficulty}-${seed}`,
      title: "Power of Two",
      description: "Given a positive integer, return true if it is a power of two.",
      functionSignature: `function solution(n: number): boolean`,
      starterCode: `function solution(n) {\n  // Your code here\n}`,
      tests: cases.map(([n, expected], i) => ({
        name: `test_${i}`,
        input: `solution(${n})`,
        expected: JSON.stringify(expected),
      })),
      referenceSolution: `function solution(n) {\n  return n > 0 && (n & (n - 1)) === 0;\n}`,
      difficulty,
      category: "math",
    };
  },
};

export const mathTemplates: ChallengeTemplate[] = [fibonacci, isPrime, gcd, powerOfTwo];
