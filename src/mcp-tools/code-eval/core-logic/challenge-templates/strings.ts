/**
 * String manipulation challenge templates.
 */

import type { Challenge, ChallengeTemplate, Difficulty } from "../../mcp/types.js";

export const isPalindrome: ChallengeTemplate = {
  title: "Is Palindrome",
  category: "strings",
  difficulties: ["easy", "medium", "hard"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const baseCases: Array<[string, boolean]> = [
      ["racecar", true],
      ["hello", false],
      ["", true],
      ["a", true],
      ["ab", false],
      ["aba", true],
      ["abba", true],
    ];

    const mediumCases: Array<[string, boolean]> = [
      ["A man a plan a canal Panama", false], // case-sensitive, spaces matter
      ["aabbaa", true],
      ["abcba", true],
      ["abcda", false],
    ];

    const hardCases: Array<[string, boolean]> = [
      ["a".repeat(1000), true],
      ["a".repeat(999) + "b", false],
      ["abcddcba", true],
      ["Was it a car or a cat I saw", false],
    ];

    let cases = baseCases;
    if (difficulty === "medium") cases = [...baseCases, ...mediumCases];
    if (difficulty === "hard") cases = [...baseCases, ...mediumCases, ...hardCases];

    return {
      id: `strings-palindrome-${difficulty}-${seed}`,
      title: "Is Palindrome",
      description:
        "Given a string, return true if it reads the same forwards and backwards. Case-sensitive, whitespace matters.",
      functionSignature: `function solution(s: string): boolean`,
      starterCode: `function solution(s) {\n  // Your code here\n}`,
      tests: cases.map(([input, expected], i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(input)})`,
        expected: JSON.stringify(expected),
      })),
      referenceSolution: `function solution(s) {\n  return s === s.split("").reverse().join("");\n}`,
      difficulty,
      category: "strings",
    };
  },
};

export const countVowels: ChallengeTemplate = {
  title: "Count Vowels",
  category: "strings",
  difficulties: ["easy"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const cases: Array<[string, number]> = [
      ["hello", 2],
      ["", 0],
      ["aeiou", 5],
      ["AEIOU", 5],
      ["bcdfg", 0],
      ["Hello World", 3],
      ["rhythm", 0],
      ["aaa", 3],
    ];

    return {
      id: `strings-vowels-${difficulty}-${seed}`,
      title: "Count Vowels",
      description: "Given a string, return the count of vowels (a, e, i, o, u) — case insensitive.",
      functionSignature: `function solution(s: string): number`,
      starterCode: `function solution(s) {\n  // Your code here\n}`,
      tests: cases.map(([input, expected], i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(input)})`,
        expected: JSON.stringify(expected),
      })),
      referenceSolution: `function solution(s) {\n  return (s.toLowerCase().match(/[aeiou]/g) || []).length;\n}`,
      difficulty,
      category: "strings",
    };
  },
};

export const longestSubstringKDistinct: ChallengeTemplate = {
  title: "Longest Substring with K Distinct Characters",
  category: "strings",
  difficulties: ["medium", "hard"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const cases: Array<[string, number, number]> = [
      ["eceba", 2, 3], // "ece"
      ["aa", 1, 2],
      ["", 2, 0],
      ["a", 1, 1],
      ["aabbcc", 2, 4], // "aabb"
      ["abcabcabc", 3, 9],
    ];

    if (difficulty === "hard") {
      cases.push(
        ["abaccc", 2, 4], // "accc"
        ["aabacbebebe", 3, 7], // "cbebebe"
      );
    }

    const refFn = (s: string, k: number): number => {
      if (k === 0 || s.length === 0) return 0;
      const map = new Map<string, number>();
      let left = 0;
      let maxLen = 0;
      for (let right = 0; right < s.length; right++) {
        map.set(s[right] as string, (map.get(s[right] as string) ?? 0) + 1);
        while (map.size > k) {
          const leftChar = s[left] as string;
          const count = (map.get(leftChar) ?? 0) - 1;
          if (count === 0) map.delete(leftChar);
          else map.set(leftChar, count);
          left++;
        }
        maxLen = Math.max(maxLen, right - left + 1);
      }
      return maxLen;
    };

    return {
      id: `strings-k-distinct-${difficulty}-${seed}`,
      title: "Longest Substring with K Distinct Characters",
      description:
        "Given a string s and an integer k, return the length of the longest substring that contains at most k distinct characters.",
      functionSignature: `function solution(s: string, k: number): number`,
      starterCode: `function solution(s, k) {\n  // Your code here\n}`,
      tests: cases.map(([s, k, _expected], i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(s)}, ${k})`,
        expected: JSON.stringify(refFn(s, k)),
      })),
      referenceSolution: `function solution(s, k) {\n  if (k === 0 || s.length === 0) return 0;\n  const map = new Map();\n  let left = 0, maxLen = 0;\n  for (let right = 0; right < s.length; right++) {\n    map.set(s[right], (map.get(s[right]) || 0) + 1);\n    while (map.size > k) {\n      const c = s[left];\n      const cnt = map.get(c) - 1;\n      if (cnt === 0) map.delete(c); else map.set(c, cnt);\n      left++;\n    }\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}`,
      difficulty,
      category: "strings",
    };
  },
};

export const compressString: ChallengeTemplate = {
  title: "String Compression",
  category: "strings",
  difficulties: ["medium"],
  generate(difficulty: Difficulty, seed: number): Challenge {
    const cases: Array<[string, string]> = [
      ["aabcccccaaa", "a2b1c5a3"],
      ["abc", "abc"],
      ["", ""],
      ["a", "a"],
      ["aa", "a2"],
      ["aabb", "a2b2"],
      ["aaabbbccc", "a3b3c3"],
    ];

    const refFn = (s: string): string => {
      if (s.length <= 1) return s;
      let result = "";
      let count = 1;
      for (let i = 1; i <= s.length; i++) {
        if (i < s.length && s[i] === s[i - 1]) {
          count++;
        } else {
          result += s[i - 1] + String(count);
          count = 1;
        }
      }
      return result.length < s.length ? result : s;
    };

    return {
      id: `strings-compress-${difficulty}-${seed}`,
      title: "String Compression",
      description:
        "Compress a string by replacing consecutive repeated characters with the character followed by the count (e.g., 'aabcccccaaa' → 'a2b1c5a3'). Return the original string if compression doesn't reduce length.",
      functionSignature: `function solution(s: string): string`,
      starterCode: `function solution(s) {\n  // Your code here\n}`,
      tests: cases.map(([input, _expected], i) => ({
        name: `test_${i}`,
        input: `solution(${JSON.stringify(input)})`,
        expected: JSON.stringify(refFn(input)),
      })),
      referenceSolution: `function solution(s) {\n  if (s.length <= 1) return s;\n  let result = "", count = 1;\n  for (let i = 1; i <= s.length; i++) {\n    if (i < s.length && s[i] === s[i - 1]) { count++; }\n    else { result += s[i - 1] + count; count = 1; }\n  }\n  return result.length < s.length ? result : s;\n}`,
      difficulty,
      category: "strings",
    };
  },
};

export const stringTemplates: ChallengeTemplate[] = [
  isPalindrome,
  countVowels,
  longestSubstringKDistinct,
  compressString,
];
