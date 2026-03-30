/**
 * Deterministic Bug Injector — injects known bugs into working code.
 *
 * Takes a working solution and applies a specific mutation to introduce
 * a bug. The mutation is deterministic based on bug type.
 */

import type { BugType } from "./types.js";

export interface InjectedBug {
  buggyCode: string;
  bugType: BugType;
  description: string;
}

/**
 * Inject a deterministic bug into working code.
 * Returns the buggy code and a description of what was changed.
 */
export function injectBug(code: string, bugType: BugType): InjectedBug | undefined {
  const injector = BUG_INJECTORS[bugType];
  return injector(code);
}

/**
 * Try all bug types and return the first one that produces a valid mutation.
 */
export function injectAnyBug(code: string, preferredType?: BugType): InjectedBug | undefined {
  if (preferredType) {
    const result = injectBug(code, preferredType);
    if (result) return result;
  }

  for (const bugType of BUG_TYPE_ORDER) {
    if (bugType === preferredType) continue;
    const result = injectBug(code, bugType);
    if (result) return result;
  }

  return undefined;
}

// ─── Bug Injection Strategies ───────────────────────────────────────────────

const BUG_TYPE_ORDER: BugType[] = [
  "off_by_one",
  "wrong_operator",
  "missing_edge_case",
  "logic_inversion",
  "type_error",
];

type BugInjector = (code: string) => InjectedBug | undefined;

const BUG_INJECTORS: Record<BugType, BugInjector> = {
  off_by_one: (code) => {
    // Change < to <= or > to >= (or vice versa)
    const patterns: Array<{ from: RegExp; to: string; desc: string }> = [
      {
        from: /(\w+)\s*<\s*(\w+\.length)/,
        to: "$1 <= $2",
        desc: "Changed < to <= in length comparison",
      },
      {
        from: /(\w+)\s*<=\s*(\w+\.length)/,
        to: "$1 < $2",
        desc: "Changed <= to < in length comparison",
      },
      {
        from: /(\w+)\s*<\s*(\w+)(?!\.length)/,
        to: "$1 <= $2",
        desc: "Changed < to <= in comparison",
      },
      {
        from: /= (\d+);/,
        to: (match: string) => {
          const num = parseInt(match.match(/\d+/)?.[0] ?? "0", 10);
          return `= ${num + 1};`;
        },
        desc: "Off-by-one in initial value",
      },
      { from: /(\w+)\s*\+\s*1/, to: "$1 + 2", desc: "Changed +1 to +2" },
      { from: /(\w+)\s*-\s*1(?!\d)/, to: "$1 - 2", desc: "Changed -1 to -2" },
    ];

    for (const pattern of patterns) {
      if (pattern.from.test(code)) {
        const replacement = typeof pattern.to === "function" ? pattern.to : pattern.to;
        const buggyCode = code.replace(pattern.from, replacement as string);
        if (buggyCode !== code) {
          return { buggyCode, bugType: "off_by_one", description: pattern.desc };
        }
      }
    }
    return undefined;
  },

  wrong_operator: (code) => {
    const patterns: Array<{ from: RegExp; to: string; desc: string }> = [
      { from: /(\w+)\s*\+\s*(\w+)(?!\+)/, to: "$1 - $2", desc: "Changed + to -" },
      { from: /(\w+)\s*&&\s*(\w+)/, to: "$1 || $2", desc: "Changed && to ||" },
      { from: /(\w+)\s*===\s*(\w+)/, to: "$1 !== $2", desc: "Changed === to !==" },
      { from: /(\w+)\s*>\s*(\w+)(?!=)/, to: "$1 < $2", desc: "Changed > to <" },
      { from: /Math\.max/, to: "Math.min", desc: "Changed Math.max to Math.min" },
      { from: /Math\.min/, to: "Math.max", desc: "Changed Math.min to Math.max" },
    ];

    for (const pattern of patterns) {
      if (pattern.from.test(code)) {
        const buggyCode = code.replace(pattern.from, pattern.to);
        if (buggyCode !== code) {
          return { buggyCode, bugType: "wrong_operator", description: pattern.desc };
        }
      }
    }
    return undefined;
  },

  missing_edge_case: (code) => {
    // Remove common edge case guards
    const patterns: Array<{ from: RegExp; to: string; desc: string }> = [
      {
        from: /if\s*\(\s*\w+\.length\s*===?\s*0\s*\)\s*return\s+[^;]+;?\s*\n?/,
        to: "",
        desc: "Removed empty array/string guard",
      },
      {
        from: /if\s*\(\s*!\w+\s*\)\s*return\s+[^;]+;?\s*\n?/,
        to: "",
        desc: "Removed falsy check guard",
      },
      {
        from: /if\s*\(\s*\w+\s*(?:===?|<=?)\s*0\s*\)\s*return\s+[^;]+;?\s*\n?/,
        to: "",
        desc: "Removed zero-value guard",
      },
      { from: /\?\?\s*\[\]/, to: "", desc: "Removed nullish coalescing for array" },
      { from: /\?\?\s*0/, to: "", desc: "Removed nullish coalescing for number" },
      { from: /\?\?\s*""/, to: "", desc: "Removed nullish coalescing for string" },
    ];

    for (const pattern of patterns) {
      if (pattern.from.test(code)) {
        const buggyCode = code.replace(pattern.from, pattern.to);
        if (buggyCode !== code && buggyCode.trim().length > 0) {
          return { buggyCode, bugType: "missing_edge_case", description: pattern.desc };
        }
      }
    }
    return undefined;
  },

  type_error: (code) => {
    const patterns: Array<{ from: RegExp; to: string; desc: string }> = [
      { from: /parseInt\(/, to: "parseFloat(", desc: "Changed parseInt to parseFloat" },
      { from: /\.toString\(\)/, to: "", desc: "Removed .toString() call" },
      { from: /Number\(/, to: "String(", desc: "Changed Number() to String()" },
      { from: /String\(/, to: "Number(", desc: "Changed String() to Number()" },
      {
        from: /\.map\(/,
        to: ".forEach(",
        desc: "Changed .map() to .forEach() (loses return value)",
      },
    ];

    for (const pattern of patterns) {
      if (pattern.from.test(code)) {
        const buggyCode = code.replace(pattern.from, pattern.to);
        if (buggyCode !== code) {
          return { buggyCode, bugType: "type_error", description: pattern.desc };
        }
      }
    }
    return undefined;
  },

  logic_inversion: (code) => {
    const patterns: Array<{ from: RegExp; to: string; desc: string }> = [
      {
        from: /\.sort\(\(a,\s*b\)\s*=>\s*a\s*-\s*b\)/,
        to: ".sort((a, b) => b - a)",
        desc: "Inverted sort order (asc → desc)",
      },
      {
        from: /\.sort\(\(a,\s*b\)\s*=>\s*b\s*-\s*a\)/,
        to: ".sort((a, b) => a - b)",
        desc: "Inverted sort order (desc → asc)",
      },
      { from: /\.reverse\(\)/, to: "", desc: "Removed .reverse() call" },
      { from: /return true;/, to: "return false;", desc: "Inverted return value (true → false)" },
      { from: /return false;/, to: "return true;", desc: "Inverted return value (false → true)" },
      {
        from: /\.filter\((\w+)\s*=>\s*(\w+)/,
        to: ".filter($1 => !$2",
        desc: "Negated filter condition",
      },
    ];

    for (const pattern of patterns) {
      if (pattern.from.test(code)) {
        const buggyCode = code.replace(pattern.from, pattern.to);
        if (buggyCode !== code) {
          return { buggyCode, bugType: "logic_inversion", description: pattern.desc };
        }
      }
    }
    return undefined;
  },
};
