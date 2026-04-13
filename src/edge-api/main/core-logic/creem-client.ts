/**
 * Creem.io REST API client for Cloudflare Workers.
 * No SDK — plain fetch with x-api-key auth.
 */

const CREEM_BASE = "https://api.creem.io";

export interface CreemResponse<T = Record<string, unknown>> {
  ok: boolean;
  data: T;
  status: number;
}

async function creemFetch<T = Record<string, unknown>>(
  apiKey: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<CreemResponse<T>> {
  const headers: Record<string, string> = {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };

  const res = await fetch(`${CREEM_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = (await res.json()) as T;
  return { ok: res.ok, data, status: res.status };
}

// ─── Checkout ──────────────────────────────────────────────────────────────

export interface CreemCheckoutRequest {
  product_id: string;
  success_url: string;
  request_id?: string;
  customer?: { email?: string };
  metadata?: Record<string, string>;
}

export interface CreemCheckoutResponse {
  id: string;
  checkout_url: string;
  product_id: string;
  status: string;
}

export function createCheckout(
  apiKey: string,
  params: CreemCheckoutRequest,
): Promise<CreemResponse<CreemCheckoutResponse>> {
  return creemFetch<CreemCheckoutResponse>(
    apiKey,
    "POST",
    "/v1/checkouts",
    params as unknown as Record<string, unknown>,
  );
}

// ─── Customer Billing Portal ───────────────────────────────────────────────

export interface CreemBillingPortalResponse {
  customer_portal_link: string;
}

export function createBillingPortal(
  apiKey: string,
  customerId: string,
): Promise<CreemResponse<CreemBillingPortalResponse>> {
  return creemFetch<CreemBillingPortalResponse>(apiKey, "POST", "/v1/customers/billing", {
    customer_id: customerId,
  });
}

// ─── Webhook Signature Verification ────────────────────────────────────────

const HEX_ONLY = /^[0-9a-f]+$/i;

export async function verifyCreemSignature(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  // Reject empty/malformed inputs before touching crypto.
  if (!signature || !secret) return false;
  // Hex-only guard prevents unicode-normalisation bypasses.
  if (!HEX_ONLY.test(signature)) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const expectedHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Length check is safe to short-circuit — it does not leak signature bytes.
  if (expectedHex.length !== signature.length) return false;

  // Constant-time XOR comparison (OWASP A02, CWE-208).
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
