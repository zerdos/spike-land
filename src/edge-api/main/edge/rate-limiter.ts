import { DurableObject } from "cloudflare:workers";

// OWASP A05:2021 — Security Misconfiguration: rate limiting must be tuned per
// resource sensitivity. Expensive or security-sensitive endpoints (AI proxy,
// auth) need tighter windows than generic endpoints.

export type RateLimitProfile =
  | "POST_AI" // expensive AI proxy — tight window, long cooldown
  | "POST_AUTH" // auth endpoints — moderate window, longer cooldown
  | "POST_DEFAULT" // general POST — current behaviour, unchanged
  | "GET_DEFAULT"; // general GET — generous window, minimal cooldown

interface ProfileConfig {
  /** Maximum requests allowed within the grace period before throttling begins. */
  graceLimit: number;
  /** Duration (seconds) over which the grace limit is measured. */
  gracePeriod: number;
  /** Cooldown duration (seconds) returned to the caller when limit is exceeded. */
  cooldown: number;
}

// Profiles are intentionally not mutable at runtime. All tuning happens here.
const PROFILE_CONFIGS: Record<RateLimitProfile, ProfileConfig> = {
  POST_AI: {
    // 2 req/10s before throttling; 1s cooldown per excess request.
    // Low limits because each AI call proxies to a paid upstream (Anthropic/Gemini).
    graceLimit: 2,
    gracePeriod: 10,
    cooldown: 1,
  },
  POST_AUTH: {
    // 10 req/60s before throttling; 2s cooldown.
    // Longer cooldown discourages credential stuffing (OWASP A07:2021).
    graceLimit: 10,
    gracePeriod: 60,
    cooldown: 2,
  },
  POST_DEFAULT: {
    // 4 req/20s; 0.5s cooldown — original behaviour preserved.
    graceLimit: 4,
    gracePeriod: 20,
    cooldown: 0.5,
  },
  GET_DEFAULT: {
    // 30 req/60s; 0.5s cooldown — read-heavy endpoints can sustain more traffic.
    graceLimit: 30,
    gracePeriod: 60,
    cooldown: 0.5,
  },
};

interface ProfileState {
  /** Epoch seconds after which the next request is allowed. */
  nextAllowedTime: number;
  /** Running request count within the current grace window. */
  requestCount: number;
}

/**
 * RateLimiter — Cloudflare Durable Object providing per-profile, per-key rate
 * limiting. Each DO instance represents a single client key (e.g. IP address
 * or session ID). State is tracked independently per profile so that hitting
 * the AI limit does not affect the auth budget, and vice versa.
 *
 * Protocol:
 *   Request:  any method to any URL.
 *             Header `X-Rate-Limit-Profile` selects the profile (optional).
 *             If omitted, POST requests use POST_DEFAULT; others use GET_DEFAULT.
 *   Response: plain-text body — "0" means allowed; a positive decimal string
 *             (e.g. "1") means the caller must back off for that many seconds.
 *             HTTP 400 is returned for an unrecognised profile value.
 *             HTTP 500 is returned on internal error.
 *
 * Security notes:
 * - The profile header is read from the internal rate-limiter request that the
 *   edge worker constructs — it is never forwarded from untrusted clients.
 * - State lives only in Durable Object memory; it is ephemeral and does not
 *   persist across DO restarts, which is acceptable for soft rate limiting.
 */
export class RateLimiter extends DurableObject {
  // Per-profile state map. Lazily initialised on first request for each profile.
  private readonly profileState = new Map<RateLimitProfile, ProfileState>();

  private getProfileState(profile: RateLimitProfile): ProfileState {
    let state = this.profileState.get(profile);
    if (!state) {
      state = { nextAllowedTime: 0, requestCount: 0 };
      this.profileState.set(profile, state);
    }
    return state;
  }

  override async fetch(request: Request): Promise<Response> {
    try {
      // Resolve profile: trust the header only (set by our own edge code, not
      // passed through from external clients).
      const profileHeader = request.headers.get("X-Rate-Limit-Profile");

      let profile: RateLimitProfile;
      if (profileHeader === null) {
        // Default: POST → POST_DEFAULT, everything else → GET_DEFAULT.
        profile = request.method === "POST" ? "POST_DEFAULT" : "GET_DEFAULT";
      } else if (profileHeader in PROFILE_CONFIGS) {
        profile = profileHeader as RateLimitProfile;
      } else {
        // Unknown profile — fail closed rather than silently bypassing limits.
        return new Response(`Unknown rate limit profile: ${profileHeader}`, { status: 400 });
      }

      const config = PROFILE_CONFIGS[profile];
      const state = this.getProfileState(profile);
      const now = Date.now() / 1000;

      // Reset the counter when the grace window has fully elapsed since the
      // last recorded request time.
      if (now > state.nextAllowedTime + config.gracePeriod) {
        state.requestCount = 0;
        state.nextAllowedTime = now;
      }

      state.requestCount++;

      if (state.requestCount > config.graceLimit) {
        // Grace exhausted: apply cooldown and signal the caller to back off.
        state.nextAllowedTime = now + config.cooldown;
        return new Response(String(config.cooldown));
      }

      // Within grace limit — allowed, no backoff required.
      return new Response("0");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rate limiter error";
      return new Response(message, { status: 500 });
    }
  }
}
