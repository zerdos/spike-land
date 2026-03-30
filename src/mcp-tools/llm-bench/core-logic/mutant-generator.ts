/**
 * Mutant Generator — creates code mutants for test-writing challenges.
 *
 * Given correct code, produces 2-3 mutants that differ in subtle ways.
 * The LLM must write tests that distinguish the original from the mutants.
 */

import { injectBug } from "./bug-injector.js";
import type { BugType } from "./types.js";

export interface CodeMutant {
  code: string;
  bugDescription: string;
  bugType: BugType;
}

/**
 * Generate mutants from working code.
 * Each mutant has exactly one injected bug.
 */
export function generateMutants(code: string, count: number = 3): CodeMutant[] {
  const mutants: CodeMutant[] = [];
  const bugTypes: BugType[] = [
    "off_by_one",
    "wrong_operator",
    "missing_edge_case",
    "logic_inversion",
    "type_error",
  ];
  const seenCode = new Set<string>();

  for (const bugType of bugTypes) {
    if (mutants.length >= count) break;

    const injected = injectBug(code, bugType);
    if (injected && !seenCode.has(injected.buggyCode)) {
      seenCode.add(injected.buggyCode);
      mutants.push({
        code: injected.buggyCode,
        bugDescription: injected.description,
        bugType: injected.bugType,
      });
    }
  }

  return mutants;
}
