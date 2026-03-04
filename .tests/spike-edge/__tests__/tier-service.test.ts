import { describe, expect, it, vi } from "vitest";
import { resolveEffectiveTier } from "../../../src/spike-edge/lib/tier-service.js";

// ── Mock D1 Builder ───────────────────────────────────────────────────────────

/**
 * Creates a minimal D1Database mock where each SQL query returns
 * a configurable first() result. The mock inspects the SQL string
 * to route responses to the right query.
 */
function createMockDb(config: {
  subscription?: { plan: string } | null;
  grant?: { tier: string } | null;
  byok?: Record<string, unknown> | null;
  elo?: { elo: number } | null;
}) {
  const mockPrepare = vi.fn().mockImplementation((sql: string) => {
    let result: unknown = null;

    if (sql.includes("subscriptions")) {
      result = config.subscription ?? null;
    } else if (sql.includes("access_grants")) {
      result = config.grant ?? null;
    } else if (sql.includes("user_api_key_vault")) {
      result = config.byok ?? null;
    } else if (sql.includes("user_elo")) {
      result = config.elo ?? null;
    }

    return {
      bind: (..._args: unknown[]) => ({
        first: vi.fn().mockResolvedValue(result),
      }),
    };
  });

  return { prepare: mockPrepare } as unknown as D1Database;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("resolveEffectiveTier", () => {
  const userId = "user-test";

  describe("priority 1: active Stripe subscription", () => {
    it("returns pro when active pro subscription exists", async () => {
      const db = createMockDb({ subscription: { plan: "pro" } });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("pro");
    });

    it("returns business when active business subscription exists", async () => {
      const db = createMockDb({ subscription: { plan: "business" } });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("business");
    });

    it("falls through when subscription plan is not pro or business", async () => {
      // 'free' plan in subscriptions table should fall through to grant
      const db = createMockDb({
        subscription: { plan: "free" },
        grant: { tier: "pro" },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("pro");
    });

    it("falls through when no active subscription", async () => {
      const db = createMockDb({
        subscription: null,
        grant: { tier: "business" },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("business");
    });
  });

  describe("priority 2: access grants", () => {
    it("returns pro grant tier when no subscription", async () => {
      const db = createMockDb({
        subscription: null,
        grant: { tier: "pro" },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("pro");
    });

    it("returns business grant tier", async () => {
      const db = createMockDb({
        subscription: null,
        grant: { tier: "business" },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("business");
    });

    it("falls through when grant tier is unrecognized", async () => {
      const db = createMockDb({
        subscription: null,
        grant: { tier: "unknown" },
        byok: { id: "key-1" },
      });
      const tier = await resolveEffectiveTier(db, userId);
      // Falls through to BYOK → pro
      expect(tier).toBe("pro");
    });

    it("falls through when no grant exists", async () => {
      const db = createMockDb({
        subscription: null,
        grant: null,
        byok: { id: "key-1" },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("pro");
    });
  });

  describe("priority 3: BYOK key detection", () => {
    it("returns pro when BYOK key is stored", async () => {
      const db = createMockDb({
        subscription: null,
        grant: null,
        byok: { id: "api-key-vault-entry" },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("pro");
    });

    it("falls through to ELO when no BYOK key", async () => {
      const db = createMockDb({
        subscription: null,
        grant: null,
        byok: null,
        elo: { elo: 1500 },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("business"); // ELO 1500 → business
    });
  });

  describe("priority 4: ELO-based tier resolution", () => {
    it("returns free for ELO below 1000", async () => {
      const db = createMockDb({
        subscription: null,
        grant: null,
        byok: null,
        elo: { elo: 999 },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("free");
    });

    it("returns pro for ELO 1000-1499", async () => {
      const db = createMockDb({
        subscription: null,
        grant: null,
        byok: null,
        elo: { elo: 1200 },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("pro");
    });

    it("returns business for ELO 1500+", async () => {
      const db = createMockDb({
        subscription: null,
        grant: null,
        byok: null,
        elo: { elo: 1500 },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("business");
    });

    it("returns free when no ELO record exists", async () => {
      const db = createMockDb({
        subscription: null,
        grant: null,
        byok: null,
        elo: null,
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("free");
    });
  });

  describe("priority chain: subscription > grant > BYOK > ELO", () => {
    it("subscription wins over grant, BYOK, and ELO", async () => {
      const db = createMockDb({
        subscription: { plan: "pro" },
        grant: { tier: "business" },
        byok: { id: "key-1" },
        elo: { elo: 2000 },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("pro");
    });

    it("grant wins over BYOK and ELO when no subscription", async () => {
      const db = createMockDb({
        subscription: null,
        grant: { tier: "business" },
        byok: { id: "key-1" },
        elo: { elo: 500 },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("business");
    });

    it("BYOK wins over ELO when no subscription or grant", async () => {
      const db = createMockDb({
        subscription: null,
        grant: null,
        byok: { id: "key-1" },
        elo: { elo: 200 }, // would be free
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("pro");
    });

    it("ELO is last resort when all other sources are absent", async () => {
      const db = createMockDb({
        subscription: null,
        grant: null,
        byok: null,
        elo: { elo: 1300 },
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("pro");
    });

    it("returns free when all sources empty", async () => {
      const db = createMockDb({
        subscription: null,
        grant: null,
        byok: null,
        elo: null,
      });
      const tier = await resolveEffectiveTier(db, userId);
      expect(tier).toBe("free");
    });
  });

  describe("DB query isolation", () => {
    it("does not query access_grants, BYOK, or ELO when subscription resolves", async () => {
      const db = createMockDb({ subscription: { plan: "business" } });
      await resolveEffectiveTier(db, userId);

      const prepareCalls = (db as unknown as { prepare: ReturnType<typeof vi.fn> }).prepare.mock
        .calls.map(([sql]: [string]) => sql);

      expect(prepareCalls.some((s) => s.includes("subscriptions"))).toBe(true);
      expect(prepareCalls.some((s) => s.includes("access_grants"))).toBe(false);
      expect(prepareCalls.some((s) => s.includes("user_api_key_vault"))).toBe(false);
      expect(prepareCalls.some((s) => s.includes("user_elo"))).toBe(false);
    });

    it("queries user_elo only when subscription, grant, and BYOK are all absent", async () => {
      const db = createMockDb({
        subscription: null,
        grant: null,
        byok: null,
        elo: { elo: 800 },
      });
      await resolveEffectiveTier(db, userId);

      const prepareCalls = (db as unknown as { prepare: ReturnType<typeof vi.fn> }).prepare.mock
        .calls.map(([sql]: [string]) => sql);

      expect(prepareCalls.some((s) => s.includes("user_elo"))).toBe(true);
    });
  });
});
