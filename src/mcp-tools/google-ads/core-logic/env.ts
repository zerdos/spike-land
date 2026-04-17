/**
 * Environment variable parsing for the Google Ads MCP server.
 *
 * Returns a discriminated union so callers can either initialise a real client
 * or surface a structured "not configured" error to the LLM without crashing.
 */

import { z } from "zod";
import { GoogleAdsAuthClient } from "./google-oauth.js";
import { GoogleAdsClient } from "./ads-client.js";

export const ENV_VAR_NAMES = [
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_CUSTOMER_ID",
] as const;

export const ENV_VAR_OPTIONAL = ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"] as const;

const envSchema = z.object({
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().min(1),
  GOOGLE_ADS_REFRESH_TOKEN: z.string().min(1),
  GOOGLE_ADS_CLIENT_ID: z.string().min(1),
  GOOGLE_ADS_CLIENT_SECRET: z.string().min(1),
  GOOGLE_ADS_CUSTOMER_ID: z.string().min(1),
  GOOGLE_ADS_LOGIN_CUSTOMER_ID: z.string().min(1).optional(),
});

export type GoogleAdsEnv = z.infer<typeof envSchema>;

export type EnvParseResult =
  | { ok: true; env: GoogleAdsEnv }
  | { ok: false; missing: readonly string[]; error: string };

/**
 * Parse the Google Ads env vars from a record (defaults to `process.env`).
 * Never throws — returns a structured failure listing the missing keys.
 */
export function parseGoogleAdsEnv(
  source: Record<string, string | undefined> = process.env,
): EnvParseResult {
  const result = envSchema.safeParse(source);
  if (result.success) {
    return { ok: true, env: result.data };
  }
  const missing = ENV_VAR_NAMES.filter((key) => {
    const value = source[key];
    return typeof value !== "string" || value.length === 0;
  });
  return {
    ok: false,
    missing,
    error: `GOOGLE_ADS_* env vars not configured: missing ${missing.join(", ")}`,
  };
}

/**
 * Build a `GoogleAdsClient` from a parsed env. Pulled out so tests can
 * inject a fake env without touching `process.env`.
 */
export function clientFromEnv(env: GoogleAdsEnv): GoogleAdsClient {
  const auth = new GoogleAdsAuthClient({
    clientId: env.GOOGLE_ADS_CLIENT_ID,
    clientSecret: env.GOOGLE_ADS_CLIENT_SECRET,
    refreshToken: env.GOOGLE_ADS_REFRESH_TOKEN,
    developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
    customerId: env.GOOGLE_ADS_CUSTOMER_ID,
    ...(env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
      ? { loginCustomerId: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID }
      : {}),
  });
  return new GoogleAdsClient(auth);
}
