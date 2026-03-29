/**
 * Data structure challenge templates.
 */

import type { Challenge, ChallengeTemplate, Difficulty } from "../../mcp/types.js";

export const validParentheses: ChallengeTemplate = {
  title: "Valid Parentheses",
  category: "data-structures",
  difficulties: ["easy", "medium"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const cases: Array<[string, boolean]> = [
      ["()", true],
      ["()[]{}", true],
      ["(]", false],
      ["", true],
      ["(", false],
      [")", false],
      ["((()))", true],
      ["({[]})", true],
      ["({[}])", false],
    ];

    if (difficulty === "medium") {
      cases.push(
        ["((((", false],
        ["))))", false],
        ["{[]}", true],
        ["[{()}]", true],
        ["[(])", false],
      );
    }

    return {
      id: `ds-valid-parens-${difficulty}-${seed}`,
      title: "Valid Parentheses",
      description:
        "Given a string containing only '(', ')', '{', '}', '[', ']', determine if the input string is valid. A string is valid if: open brackets are closed by the same type, and in the correct order.",
      functionSignature: `function solution(s: string): boolean`,
      starterCode: `function solution(s) {\n  // Your code here\n}`,
      tests: cases.map(([input, expected], i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(input)})`,
        expected: JSON.stringify(expected),
      })),
      referenceSolution: `function solution(s) {\n  const stack = [];\n  const map = { ')': '(', ']': '[', '}': '{' };\n  for (const c of s) {\n    if ('([{'.includes(c)) stack.push(c);\n    else if (stack.pop() !== map[c]) return false;\n  }\n  return stack.length === 0;\n}`,
      difficulty,
      category: "data-structures",
    };
  },
};

export const twoSum: ChallengeTemplate = {
  title: "Two Sum",
  category: "data-structures",
  difficulties: ["easy", "medium"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    // Each case: [nums, target, expected indices (sorted)]
    const cases: Array<[number[], number, number[]]> = [
      [[2, 7, 11, 15], 9, [0, 1]],
      [[3, 2, 4], 6, [1, 2]],
      [[3, 3], 6, [0, 1]],
      [[1, 2, 3, 4, 5], 9, [3, 4]],
    ];

    if (difficulty === "medium") {
      cases.push(
        [[-1, -2, -3, -4, -5], -8, [2, 4]],
        [[0, 4, 3, 0], 0, [0, 3]],
        [[1, 5, 1, 5], 10, [1, 3]],
      );
    }

    return {
      id: `ds-two-sum-${difficulty}-${seed}`,
      title: "Two Sum",
      description:
        "Given an array of integers and a target, return the indices of two numbers that add up to the target. Return the indices sorted ascending. Each input has exactly one solution.",
      functionSignature: `function solution(nums: number[], target: number): number[]`,
      starterCode: `function solution(nums, target) {\n  // Your code here\n}`,
      tests: cases.map(([nums, target, expected], i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(nums)}, ${target})`,
        expected: JSON.stringify(expected),
      })),
      referenceSolution: `function solution(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i].sort((a, b) => a - b);\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      difficulty,
      category: "data-structures",
    };
  },
};

export const maxStack: ChallengeTemplate = {
  title: "Max Stack Operations",
  category: "data-structures",
  difficulties: ["medium", "hard"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    // Simulate stack operations and verify results
    const cases: Array<[string[], unknown[]]> = [
      [
        ["push:5", "push:1", "push:5", "top", "pop", "max", "top", "max", "pop", "max"],
        [null, null, null, 5, 5, 5, 1, 5, 1, 5],
      ],
      [
        ["push:3", "max", "push:7", "max", "pop", "max"],
        [null, 3, null, 7, 7, 3],
      ],
      [
        ["push:1", "push:2", "push:3", "max", "pop", "pop", "max"],
        [null, null, null, 3, 3, 2, 1],
      ],
    ];

    if (difficulty === "hard") {
      cases.push([
        ["push:-2", "push:0", "push:-3", "min", "pop", "top", "min"],
        [null, null, null, -3, -3, 0, -2],
      ]);
    }

    return {
      id: `ds-max-stack-${difficulty}-${seed}`,
      title: "Max Stack Operations",
      description: `Process a sequence of stack operations and return the results. Operations: "push:N" pushes N onto the stack, "pop" removes and returns top, "top" returns top without removing, "max" returns the maximum element${difficulty === "hard" ? ', "min" returns the minimum element' : ""}. Return an array of results (null for push operations).`,
      functionSignature: `function solution(operations: string[]): (number | null)[]`,
      starterCode: `function solution(operations) {\n  // Your code here\n}`,
      tests: cases.map(([ops, expected], i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(ops)})`,
        expected: JSON.stringify(expected),
      })),
      referenceSolution: `function solution(operations) {\n  const stack = [];\n  const results = [];\n  for (const op of operations) {\n    if (op.startsWith("push:")) {\n      stack.push(Number(op.slice(5)));\n      results.push(null);\n    } else if (op === "pop") {\n      results.push(stack.pop());\n    } else if (op === "top") {\n      results.push(stack[stack.length - 1]);\n    } else if (op === "max") {\n      results.push(Math.max(...stack));\n    } else if (op === "min") {\n      results.push(Math.min(...stack));\n    }\n  }\n  return results;\n}`,
      difficulty,
      category: "data-structures",
    };
  },
};

export const dataStructureTemplates: ChallengeTemplate[] = [validParentheses, twoSum, maxStack];
