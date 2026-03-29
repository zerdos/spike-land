/**
 * Sorting challenge templates.
 */

import type { Challenge, ChallengeTemplate, Difficulty } from "../../mcp/types.js";

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export const mergeSort: ChallengeTemplate = {
  title: "Merge Sort",
  category: "sorting",
  difficulties: ["medium", "hard"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const rng = seededRandom(seed);
    const sizes: Record<Difficulty, number> = { easy: 5, medium: 10, hard: 25 };
    const size = sizes[difficulty];

    const makeArray = (len: number): number[] =>
      Array.from({ length: len }, () => Math.floor(rng() * 200) - 100);

    const testArrays = Array.from({ length: 5 }, () => makeArray(size));
    const edgeCases: number[][] = [[], [1], [2, 1], [1, 1, 1], [5, 4, 3, 2, 1]];
    const allCases = [...testArrays, ...edgeCases];

    return {
      id: `sorting-merge-sort-${difficulty}-${seed}`,
      title: "Merge Sort",
      description:
        "Implement merge sort. Given an array of numbers, return a new sorted array (ascending).",
      functionSignature: `function solution(arr: number[]): number[]`,
      starterCode: `function solution(arr) {\n  // Your code here\n}`,
      tests: allCases.map((arr, i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(arr)})`,
        expected: JSON.stringify([...arr].sort((a, b) => a - b)),
      })),
      referenceSolution: `function solution(arr) {\n  if (arr.length <= 1) return [...arr];\n  const mid = Math.floor(arr.length / 2);\n  const left = solution(arr.slice(0, mid));\n  const right = solution(arr.slice(mid));\n  const result = [];\n  let i = 0, j = 0;\n  while (i < left.length && j < right.length) {\n    if (left[i] <= right[j]) result.push(left[i++]);\n    else result.push(right[j++]);\n  }\n  return result.concat(left.slice(i), right.slice(j));\n}`,
      difficulty,
      category: "sorting",
    };
  },
};

export const kthLargest: ChallengeTemplate = {
  title: "Kth Largest Element",
  category: "sorting",
  difficulties: ["medium", "hard"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const cases: Array<[number[], number, number]> = [
      [[3, 2, 1, 5, 6, 4], 2, 5],
      [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4, 4],
      [[1], 1, 1],
      [[2, 1], 1, 2],
      [[2, 1], 2, 1],
      [[7, 6, 5, 4, 3, 2, 1], 3, 5],
    ];

    if (difficulty === "hard") {
      cases.push([[1, 1, 1, 1, 1], 1, 1], [[10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 5, 6]);
    }

    return {
      id: `sorting-kth-largest-${difficulty}-${seed}`,
      title: "Kth Largest Element",
      description:
        "Given an array of integers and k, return the kth largest element (1-indexed). For example, k=1 returns the largest.",
      functionSignature: `function solution(nums: number[], k: number): number`,
      starterCode: `function solution(nums, k) {\n  // Your code here\n}`,
      tests: cases.map(([nums, k, expected], i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(nums)}, ${k})`,
        expected: JSON.stringify(expected),
      })),
      referenceSolution: `function solution(nums, k) {\n  return nums.sort((a, b) => b - a)[k - 1];\n}`,
      difficulty,
      category: "sorting",
    };
  },
};

export const sortByFrequency: ChallengeTemplate = {
  title: "Sort by Frequency",
  category: "sorting",
  difficulties: ["medium"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const cases: Array<[number[], number[]]> = [
      [
        [1, 1, 2, 2, 2, 3],
        [2, 2, 2, 1, 1, 3],
      ],
      [
        [2, 3, 1, 3, 2],
        [2, 2, 3, 3, 1],
      ],
      [[1], [1]],
      [[], []],
      [
        [5, 5, 5, 5],
        [5, 5, 5, 5],
      ],
      [
        [1, 2, 3],
        [1, 2, 3],
      ], // same frequency → maintain relative order of first appearance
    ];

    return {
      id: `sorting-frequency-${difficulty}-${seed}`,
      title: "Sort by Frequency",
      description:
        "Sort an array by frequency of elements (most frequent first). Elements with equal frequency maintain their relative order of first appearance.",
      functionSignature: `function solution(nums: number[]): number[]`,
      starterCode: `function solution(nums) {\n  // Your code here\n}`,
      tests: cases.map(([input, expected], i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(input)})`,
        expected: JSON.stringify(expected),
      })),
      referenceSolution: `function solution(nums) {\n  const freq = new Map();\n  const firstIdx = new Map();\n  nums.forEach((n, i) => {\n    freq.set(n, (freq.get(n) || 0) + 1);\n    if (!firstIdx.has(n)) firstIdx.set(n, i);\n  });\n  return [...nums].sort((a, b) => {\n    const df = freq.get(b) - freq.get(a);\n    return df !== 0 ? df : firstIdx.get(a) - firstIdx.get(b);\n  });\n}`,
      difficulty,
      category: "sorting",
    };
  },
};

export const sortingTemplates: ChallengeTemplate[] = [mergeSort, kthLargest, sortByFrequency];
