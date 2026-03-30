/**
 * Extended tests for assertion-runtime.ts targeting uncovered lines:
 *   - loadSnapshot (lines ~324-337)
 *   - formatAssertions / formatEvidence / formatReport without a core (lines ~408-430)
 *   - formatReport sections (lines ~428-461)
 *   - buildSystemPrompt (lines ~339-354)
 *   - clear() resets state (lines ~297-302)
 *   - recomputeAssertionStatuses — mixed support+conflict keeps unresolved
 *   - violated path in recompute
 *   - getEvidence by assertionId (filtered)
 */

import { describe, expect, it } from "vitest";
import {
  AssertionRuntime,
  extractAssertionsFromCore,
} from "../../../../src/cli/spike-cli/core-logic/chat/assertion-runtime.js";

// Helper: build a minimal runtime with a canonical core
function runtimeWith(coreText: string): AssertionRuntime {
  const rt = new AssertionRuntime();
  rt.setCanonicalCore(coreText);
  return rt;
}

// ── formatAssertions / formatEvidence / formatReport: no core ────────────────

describe("AssertionRuntime — methods with no canonical core", () => {
  it("formatAssertions returns fallback message when no core", () => {
    const rt = new AssertionRuntime();
    expect(rt.formatAssertions()).toBe("No canonical core configured.");
  });

  it("formatEvidence returns fallback message when no core", () => {
    const rt = new AssertionRuntime();
    expect(rt.formatEvidence()).toBe("No canonical core configured.");
  });

  it("formatReport returns fallback message when no core", () => {
    const rt = new AssertionRuntime();
    expect(rt.formatReport()).toBe("No canonical core configured.");
  });

  it("buildSystemPrompt returns empty string when no core", () => {
    const rt = new AssertionRuntime();
    expect(rt.buildSystemPrompt()).toBe("");
  });

  it("hasCanonicalCore returns false initially", () => {
    expect(new AssertionRuntime().hasCanonicalCore()).toBe(false);
  });
});

// ── clear() ──────────────────────────────────────────────────────────────────

describe("AssertionRuntime — clear()", () => {
  it("wipes core, assertions, and evidence", () => {
    const rt = runtimeWith("The system must respond within 200ms.");
    rt.recordToolEvidence({
      toolName: "perf_check",
      result: "passed",
      isError: false,
      assertionIds: [...rt.getAssertions().map((a) => a.id)],
    });

    rt.clear();

    expect(rt.hasCanonicalCore()).toBe(false);
    expect(rt.getAssertions()).toHaveLength(0);
    expect(rt.getEvidence()).toHaveLength(0);
    expect(rt.formatAssertions()).toBe("No canonical core configured.");
  });
});

// ── buildSystemPrompt ─────────────────────────────────────────────────────────

describe("AssertionRuntime — buildSystemPrompt()", () => {
  it("includes canonical core text and active assertions", () => {
    const rt = runtimeWith("The system must never expose PII.");
    const prompt = rt.buildSystemPrompt();
    expect(prompt).toContain("Canonical Core");
    expect(prompt).toContain("must never expose PII");
    expect(prompt).toContain("Active Assertions");
  });

  it("includes __assertion_ids field name in system prompt", () => {
    const rt = runtimeWith("Data must be encrypted.");
    expect(rt.buildSystemPrompt()).toContain("__assertion_ids");
  });
});

// ── loadSnapshot ──────────────────────────────────────────────────────────────

describe("AssertionRuntime — loadSnapshot()", () => {
  it("restores core, assertions, and evidence", () => {
    const original = runtimeWith("Users must not be able to access other users' data.");
    const assertionId = original.getAssertions()[0]?.id ?? "a1";
    original.recordToolEvidence({
      toolName: "access_check",
      result: "passed",
      isError: false,
      assertionIds: [assertionId],
    });

    const snap = original.getSnapshot();

    const restored = new AssertionRuntime();
    restored.loadSnapshot(snap);

    expect(restored.hasCanonicalCore()).toBe(true);
    expect(restored.getAssertions()).toHaveLength(original.getAssertions().length);
    expect(restored.getEvidence()).toHaveLength(original.getEvidence().length);
  });

  it("loadSnapshot with null clears the runtime", () => {
    const rt = runtimeWith("The system must log all errors.");
    rt.loadSnapshot(null);
    expect(rt.hasCanonicalCore()).toBe(false);
  });

  it("loadSnapshot with undefined clears the runtime", () => {
    const rt = runtimeWith("Passwords must be hashed.");
    rt.loadSnapshot(undefined);
    expect(rt.hasCanonicalCore()).toBe(false);
  });

  it("recomputes assertion statuses after loading snapshot with evidence", () => {
    // Build snapshot where evidence supports an assertion
    const original = runtimeWith("Passwords must be hashed.");
    const assertionId = original.getAssertions()[0]?.id ?? "a1";
    // Record multiple supporting evidence entries to push score over threshold
    for (let i = 0; i < 5; i++) {
      original.recordToolEvidence({
        toolName: "hash_check",
        result: "passed verified success complete",
        isError: false,
        assertionIds: [assertionId],
      });
    }

    const snap = original.getSnapshot();
    const restored = new AssertionRuntime();
    restored.loadSnapshot(snap);

    // After recompute, assertion should be satisfied
    const assertion = restored.getAssertions().find((a) => a.id === assertionId);
    expect(assertion?.status).toBe("satisfied");
  });
});

// ── getEvidence with assertionId filter ───────────────────────────────────────

describe("AssertionRuntime — getEvidence(assertionId)", () => {
  it("returns all evidence when no assertionId is specified", () => {
    const rt = runtimeWith("System must log all requests.\nSystem must never expose PII.");
    const assertions = rt.getAssertions();
    for (const a of assertions) {
      rt.recordToolEvidence({
        toolName: "check",
        result: "passed",
        isError: false,
        assertionIds: [a.id],
      });
    }
    expect(rt.getEvidence()).toHaveLength(assertions.length);
  });

  it("filters evidence by assertionId", () => {
    const rt = runtimeWith("Tokens must expire.\nPasswords must be hashed.");
    const [a1, a2] = rt.getAssertions();
    if (!a1 || !a2) return;

    rt.recordToolEvidence({
      toolName: "token_check",
      result: "verified",
      isError: false,
      assertionIds: [a1.id],
    });
    rt.recordToolEvidence({
      toolName: "hash_check",
      result: "passed",
      isError: false,
      assertionIds: [a2.id],
    });

    const forA1 = rt.getEvidence(a1.id);
    const forA2 = rt.getEvidence(a2.id);
    expect(forA1).toHaveLength(1);
    expect(forA2).toHaveLength(1);
    expect(forA1[0]?.source).toBe("token_check");
    expect(forA2[0]?.source).toBe("hash_check");
  });
});

// ── formatEvidence edge cases ──────────────────────────────────────────────────

describe("AssertionRuntime — formatEvidence()", () => {
  it("returns 'No evidence recorded.' when no evidence for assertion", () => {
    const rt = runtimeWith("Passwords must be hashed.");
    const id = rt.getAssertions()[0]?.id ?? "a1";
    expect(rt.formatEvidence(id)).toContain("No evidence");
  });

  it("returns 'Unknown assertion' for unrecognized assertionId", () => {
    const rt = runtimeWith("Passwords must be hashed.");
    expect(rt.formatEvidence("nonexistent-id")).toContain("Unknown assertion");
  });
});

// ── formatReport sections ──────────────────────────────────────────────────────

describe("AssertionRuntime — formatReport()", () => {
  it("shows 'none' for all sections when no evidence", () => {
    const rt = runtimeWith("The API must return JSON.");
    const report = rt.formatReport();
    expect(report).toContain("Satisfied: none");
    expect(report).toContain("Violated: none");
    expect(report).toContain("Unresolved:");
  });

  it("shows assertion in Violated section when conflicting evidence", () => {
    const rt = runtimeWith("Payments must succeed.");
    const id = rt.getAssertions()[0]?.id ?? "a1";

    // Direct conflicts push conflictScore >= 0.85
    for (let i = 0; i < 2; i++) {
      rt.recordToolEvidence({
        toolName: "payment_check",
        result: "error failed invalid denied",
        isError: true,
        assertionIds: [id],
      });
    }

    const report = rt.formatReport();
    expect(report).toContain("Violated:");
  });

  it("shows assertion in Satisfied section when supporting evidence passes threshold", () => {
    const rt = runtimeWith("The login must succeed.");
    const id = rt.getAssertions()[0]?.id ?? "a1";

    for (let i = 0; i < 5; i++) {
      rt.recordToolEvidence({
        toolName: "login_check",
        result: "passed success verified complete",
        isError: false,
        assertionIds: [id],
      });
    }

    const report = rt.formatReport();
    expect(report).toContain("Satisfied:");
    expect(report).not.toContain("Satisfied: none");
  });
});

// ── recomputeAssertionStatuses — mixed evidence stays unresolved ───────────────

describe("AssertionRuntime — mixed evidence keeps assertion unresolved", () => {
  it("stays unresolved when both support and conflict evidence exist", () => {
    const rt = runtimeWith("The cache must be invalidated on update.");
    const id = rt.getAssertions()[0]?.id ?? "a1";

    // One supporting
    rt.recordToolEvidence({
      toolName: "cache_check",
      result: "success passed",
      isError: false,
      assertionIds: [id],
    });
    // One conflicting
    rt.recordToolEvidence({
      toolName: "cache_error",
      result: "error failed",
      isError: true,
      assertionIds: [id],
    });

    const assertion = rt.getAssertions().find((a) => a.id === id);
    expect(assertion?.status).toBe("unresolved");
  });
});

// ── setCanonicalCore throws on empty text ─────────────────────────────────────

describe("AssertionRuntime — setCanonicalCore validation", () => {
  it("throws on empty string", () => {
    const rt = new AssertionRuntime();
    expect(() => rt.setCanonicalCore("")).toThrow(/empty/i);
  });

  it("throws on whitespace-only string", () => {
    const rt = new AssertionRuntime();
    expect(() => rt.setCanonicalCore("   \n  ")).toThrow(/empty/i);
  });
});

// ── extractAssertionsFromCore edge cases ──────────────────────────────────────

describe("extractAssertionsFromCore", () => {
  it("returns empty array for empty string", () => {
    expect(extractAssertionsFromCore("")).toHaveLength(0);
  });

  it("deduplicates identical assertion lines (case-insensitive)", () => {
    const text = "The system must respond.\nThe system MUST respond.";
    const assertions = extractAssertionsFromCore(text);
    expect(assertions).toHaveLength(1);
  });

  it("extracts section headers and sets sourceAnchor", () => {
    const text = "## Authentication\n- Users must not share tokens.";
    const assertions = extractAssertionsFromCore(text);
    expect(assertions[0]?.section).toBe("Authentication");
    expect(assertions[0]?.sourceAnchor).toContain("Authentication");
  });

  it("falls back to single assertion when no normative markers", () => {
    const text = "This is a plain description with no must/should/never.";
    const assertions = extractAssertionsFromCore(text);
    expect(assertions).toHaveLength(1);
    expect(assertions[0]?.text).toContain("plain description");
  });

  it("marks compound assertions containing and/or with comma", () => {
    const text = "Users must log in and provide MFA, or use SSO.";
    const assertions = extractAssertionsFromCore(text);
    expect(assertions.some((a) => a.isCompound)).toBe(true);
  });
});
