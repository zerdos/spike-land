import { describe, it, expect } from "vitest";
import { generateBadgeToken, verifyBadgeToken } from "../core-logic/badge-token.js";
import type { BadgePayload } from "../core-logic/badge-token.js";

const SECRET = "test-secret-key";

const SAMPLE_PAYLOAD: BadgePayload = {
  sid: "session-abc123",
  topic: "typescript-basics",
  score: 85,
  ts: 1700000000000,
};

describe("generateBadgeToken", () => {
  it("returns a string with exactly one dot separator", () => {
    const token = generateBadgeToken(SAMPLE_PAYLOAD, SECRET);
    const parts = token.split(".");
    expect(parts).toHaveLength(2);
  });

  it("is deterministic — same inputs produce the same token", () => {
    const t1 = generateBadgeToken(SAMPLE_PAYLOAD, SECRET);
    const t2 = generateBadgeToken(SAMPLE_PAYLOAD, SECRET);
    expect(t1).toBe(t2);
  });

  it("produces different tokens for different secrets", () => {
    const t1 = generateBadgeToken(SAMPLE_PAYLOAD, "secret-a");
    const t2 = generateBadgeToken(SAMPLE_PAYLOAD, "secret-b");
    expect(t1).not.toBe(t2);
  });

  it("produces different tokens for different payloads", () => {
    const p2 = { ...SAMPLE_PAYLOAD, score: 90 };
    const t1 = generateBadgeToken(SAMPLE_PAYLOAD, SECRET);
    const t2 = generateBadgeToken(p2, SECRET);
    expect(t1).not.toBe(t2);
  });
});

describe("verifyBadgeToken", () => {
  it("returns the original payload for a valid token", () => {
    const token = generateBadgeToken(SAMPLE_PAYLOAD, SECRET);
    const result = verifyBadgeToken(token, SECRET);
    expect(result).toEqual(SAMPLE_PAYLOAD);
  });

  it("returns null when the secret is wrong", () => {
    const token = generateBadgeToken(SAMPLE_PAYLOAD, SECRET);
    const result = verifyBadgeToken(token, "wrong-secret");
    expect(result).toBeNull();
  });

  it("returns null for a tampered payload section", () => {
    const token = generateBadgeToken(SAMPLE_PAYLOAD, SECRET);
    const [, sig] = token.split(".");
    // Replace payload with a different base64 value
    const fakePayload = btoa(JSON.stringify({ ...SAMPLE_PAYLOAD, score: 100 }));
    const tampered = `${fakePayload}.${sig}`;
    expect(verifyBadgeToken(tampered, SECRET)).toBeNull();
  });

  it("returns null for a token with no dot separator", () => {
    expect(verifyBadgeToken("invalidentiretoken", SECRET)).toBeNull();
  });

  it("returns null for a token with more than one dot", () => {
    expect(verifyBadgeToken("a.b.c", SECRET)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(verifyBadgeToken("", SECRET)).toBeNull();
  });

  it("returns null for a non-base64 payload section", () => {
    expect(verifyBadgeToken("!!!notbase64!!!.sig", SECRET)).toBeNull();
  });

  it("returns null for valid base64 but non-JSON payload", () => {
    const b64 = btoa("not json at all");
    const sig = btoa("0");
    expect(verifyBadgeToken(`${b64}.${sig}`, SECRET)).toBeNull();
  });
});
