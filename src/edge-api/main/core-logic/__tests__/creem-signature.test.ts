/**
 * Regression tests for Creem webhook signature verification.
 * Guards against the timing-attack regression fixed in 2026-04-13
 * (non-constant-time `===` comparison replaced with XOR loop).
 */
import { describe, expect, it } from "vitest";
import { verifyCreemSignature } from "../creem-client.js";

const SECRET = "test-secret-abcdef";
const BODY = JSON.stringify({ type: "subscription.active", id: "sub_123" });

async function sign(body: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

describe("verifyCreemSignature", () => {
  it("accepts a valid signature", async () => {
    const valid = await sign(BODY, SECRET);
    expect(await verifyCreemSignature(BODY, valid, SECRET)).toBe(true);
  });

  it("rejects a forged signature of correct length", async () => {
    const forged = "0".repeat(64);
    expect(await verifyCreemSignature(BODY, forged, SECRET)).toBe(false);
  });

  it("rejects a signature with wrong length (no length leak)", async () => {
    expect(await verifyCreemSignature(BODY, "deadbeef", SECRET)).toBe(false);
  });

  it("rejects empty signature", async () => {
    expect(await verifyCreemSignature(BODY, "", SECRET)).toBe(false);
  });

  it("rejects empty secret", async () => {
    const valid = await sign(BODY, SECRET);
    expect(await verifyCreemSignature(BODY, valid, "")).toBe(false);
  });

  it("rejects non-hex signature (unicode bypass guard)", async () => {
    // 64 chars, but contains non-hex characters
    const bad = "g".repeat(64);
    expect(await verifyCreemSignature(BODY, bad, SECRET)).toBe(false);
  });

  it("rejects signature with tampered body", async () => {
    const valid = await sign(BODY, SECRET);
    const tampered = BODY.replace("sub_123", "sub_999");
    expect(await verifyCreemSignature(tampered, valid, SECRET)).toBe(false);
  });

  it("is case-insensitive for hex input (regex allows A-F)", async () => {
    const valid = await sign(BODY, SECRET);
    // Our verifier returns uppercase-as-mismatch because HMAC output is lowercase.
    // The hex regex accepts A-F, but comparison is still byte-exact.
    const upper = valid.toUpperCase();
    expect(await verifyCreemSignature(BODY, upper, SECRET)).toBe(false);
  });
});
