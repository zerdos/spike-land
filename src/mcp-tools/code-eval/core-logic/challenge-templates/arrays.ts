/**
 * Array manipulation challenge templates.
 */

import type { Challenge, ChallengeTemplate, Difficulty } from "../../mcp/types.js";

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export const sumAboveThreshold: ChallengeTemplate = {
  title: "Sum Above Threshold",
  category: "arrays",
  difficulties: ["easy", "medium", "hard"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const rng = seededRandom(seed);
    const thresholds: Record<Difficulty, number> = { easy: 5, medium: 10, hard: 50 };
    const sizes: Record<Difficulty, number> = { easy: 5, medium: 10, hard: 20 };
    const threshold = thresholds[difficulty];
    const size = sizes[difficulty];

    const makeArray = (len: number): number[] =>
      Array.from({ length: len }, () => Math.floor(rng() * 100));

    const testArrays = Array.from({ length: 5 }, () => makeArray(size));
    const edgeCases = [[], [threshold], [threshold - 1], [threshold + 1]];
    const allCases = [...testArrays, ...edgeCases];

    const refFn = (arr: number[]) => arr.filter((n) => n > threshold).reduce((a, b) => a + b, 0);

    return {
      id: `arrays-sum-above-${difficulty}-${seed}`,
      title: `Sum Above Threshold (${threshold})`,
      description: `Given an array of numbers, return the sum of all elements strictly greater than ${threshold}.`,
      functionSignature: `function solution(arr: number[]): number`,
      starterCode: `function solution(arr) {\n  // Your code here\n}`,
      tests: allCases.map((arr, i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(arr)})`,
        expected: JSON.stringify(refFn(arr)),
      })),
      referenceSolution: `function solution(arr) {\n  return arr.filter(n => n > ${threshold}).reduce((a, b) => a + b, 0);\n}`,
      difficulty,
      category: "arrays",
    };
  },
};

export const findDuplicates: ChallengeTemplate = {
  title: "Find Duplicates",
  category: "arrays",
  difficulties: ["easy", "medium", "hard"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const rng = seededRandom(seed);
    const sizes: Record<Difficulty, number> = { easy: 6, medium: 12, hard: 25 };
    const size = sizes[difficulty];

    const makeArray = (len: number): number[] =>
      Array.from({ length: len }, () => Math.floor(rng() * (len / 2)));

    const testArrays = Array.from({ length: 5 }, () => makeArray(size));
    const edgeCases: number[][] = [[], [1], [1, 1], [1, 2, 3]];
    const allCases = [...testArrays, ...edgeCases];

    const refFn = (arr: number[]) =>
      [...new Set(arr.filter((v, i) => arr.indexOf(v) !== i))].sort((a, b) => a - b);

    return {
      id: `arrays-find-duplicates-${difficulty}-${seed}`,
      title: "Find Duplicates",
      description:
        "Given an array of numbers, return a sorted array of values that appear more than once.",
      functionSignature: `function solution(arr: number[]): number[]`,
      starterCode: `function solution(arr) {\n  // Your code here\n}`,
      tests: allCases.map((arr, i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(arr)})`,
        expected: JSON.stringify(refFn(arr)),
      })),
      referenceSolution: `function solution(arr) {\n  return [...new Set(arr.filter((v, i) => arr.indexOf(v) !== i))].sort((a, b) => a - b);\n}`,
      difficulty,
      category: "arrays",
    };
  },
};

export const rotateArray: ChallengeTemplate = {
  title: "Rotate Array",
  category: "arrays",
  difficulties: ["easy", "medium", "hard"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const rng = seededRandom(seed);
    const sizes: Record<Difficulty, number> = { easy: 5, medium: 10, hard: 20 };
    const size = sizes[difficulty];

    const makeArray = (len: number): number[] =>
      Array.from({ length: len }, () => Math.floor(rng() * 50));
    const makeK = () => Math.floor(rng() * size * 2);

    const testPairs = Array.from({ length: 5 }, () => [makeArray(size), makeK()] as const);
    const edgeCases: Array<readonly [number[], number]> = [
      [[], 3],
      [[1], 0],
      [[1], 1],
      [[1, 2], 2],
    ];
    const allCases = [...testPairs, ...edgeCases];

    const refFn = (arr: number[], k: number) => {
      if (arr.length === 0) return [];
      const shift = k % arr.length;
      return [...arr.slice(arr.length - shift), ...arr.slice(0, arr.length - shift)];
    };

    return {
      id: `arrays-rotate-${difficulty}-${seed}`,
      title: "Rotate Array",
      description: "Given an array and a number k, rotate the array to the right by k positions.",
      functionSignature: `function solution(arr: number[], k: number): number[]`,
      starterCode: `function solution(arr, k) {\n  // Your code here\n}`,
      tests: allCases.map(([arr, k], i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(arr)}, ${k})`,
        expected: JSON.stringify(refFn([...arr], k)),
      })),
      referenceSolution: `function solution(arr, k) {\n  if (arr.length === 0) return [];\n  const shift = k % arr.length;\n  return [...arr.slice(arr.length - shift), ...arr.slice(0, arr.length - shift)];\n}`,
      difficulty,
      category: "arrays",
    };
  },
};

export const flattenDeep: ChallengeTemplate = {
  title: "Flatten Nested Array",
  category: "arrays",
  difficulties: ["medium", "hard"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const testCases: Array<[unknown[], unknown[]]> = [
      [
        [1, [2, [3, [4]]]],
        [1, 2, 3, 4],
      ],
      [
        [1, 2, 3],
        [1, 2, 3],
      ],
      [[], []],
      [[[1]], [1]],
      [[[[[5]]]], [5]],
    ];

    if (difficulty === "hard") {
      testCases.push(
        [
          [1, [2, [3]], [4, [5, [6]]]],
          [1, 2, 3, 4, 5, 6],
        ],
        [
          [
            [1, 2],
            [3, [4, [5, [6, [7]]]]],
          ],
          [1, 2, 3, 4, 5, 6, 7],
        ],
      );
    }

    return {
      id: `arrays-flatten-${difficulty}-${seed}`,
      title: "Flatten Nested Array",
      description: "Given a deeply nested array, return a flat array with all values.",
      functionSignature: `function solution(arr: unknown[]): unknown[]`,
      starterCode: `function solution(arr) {\n  // Your code here\n}`,
      tests: testCases.map(([input, expected], i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(input)})`,
        expected: JSON.stringify(expected),
      })),
      referenceSolution: `function solution(arr) {\n  return arr.flat(Infinity);\n}`,
      difficulty,
      category: "arrays",
    };
  },
};

export const arrayTemplates: ChallengeTemplate[] = [
  sumAboveThreshold,
  findDuplicates,
  rotateArray,
  flattenDeep,
];
