import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../../../src/mcp-tools/stripe-analytics/core-logic/stripe-client.js";
import { registerSubscriptionTools } from "../../../src/mcp-tools/stripe-analytics/mcp/subscriptions.js";

function mockFetch(responses: Array<{ body: unknown; status?: number }>) {
  let callIndex = 0;
  return vi.fn(async () => {
    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return {
      ok: (resp.status ?? 200) < 400,
      status: resp.status ?? 200,
      json: async () => resp.body,
      text: async () => JSON.stringify(resp.body),
    } as unknown as Response;
  });
}

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_1",
    object: "subscription",
    status: "active",
    created: 1700000000,
    canceled_at: null,
    cancellation_details: null,
    customer: "cus_1",
    items: {
      data: [
        {
          id: "si_1",
          price: {
            id: "price_monthly",
            unit_amount: 2000,
            currency: "usd",
            recurring: { interval: "month", interval_count: 1 },
            nickname: "Pro Monthly",
          },
          quantity: 1,
        },
      ],
    },
    ...overrides,
  };
}

describe("subscription tools", () => {
  let server: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createMockServer();
  });

  function setupClient(responses: Array<{ body: unknown; status?: number }>) {
    const fetch = mockFetch(responses);
    const client = new StripeClient("sk_test_123", fetch as unknown as typeof globalThis.fetch);
    registerSubscriptionTools(server as unknown as McpServer, client);
    return fetch;
  }

  describe("stripe_mrr", () => {
    it("calculates MRR for monthly subscriptions", async () => {
      setupClient([
        {
          body: {
            object: "list",
            data: [makeSubscription(), makeSubscription({ id: "sub_2", customer: "cus_2" })],
            has_more: false,
          },
        },
      ]);

      const result = await server.call("stripe_mrr", {});
      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.mrr).toBe(4000);
      expect(data.active_subscriptions_count).toBe(2);
      expect(data.breakdown_by_plan["Pro Monthly"].count).toBe(2);
    });

    it("normalizes yearly plans to monthly", async () => {
      setupClient([
        {
          body: {
            object: "list",
            data: [
              makeSubscription({
                id: "sub_yearly",
                items: {
                  data: [
                    {
                      id: "si_yearly",
                      price: {
                        id: "price_yearly",
                        unit_amount: 24000,
                        currency: "usd",
                        recurring: { interval: "year", interval_count: 1 },
                        nickname: "Pro Yearly",
                      },
                      quantity: 1,
                    },
                  ],
                },
              }),
            ],
            has_more: false,
          },
        },
      ]);

      const result = await server.call("stripe_mrr", {});
      const data = JSON.parse(result.content[0].text);
      expect(data.mrr).toBe(2000);
    });

    it("handles API errors", async () => {
      setupClient([{ body: { error: { message: "Rate limited" } }, status: 429 }]);
      const result = await server.call("stripe_mrr", {});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("STRIPE_API_ERROR");
    });
  });

  describe("stripe_churn_analysis", () => {
    it("calculates churn rate and reasons", async () => {
      setupClient([
        // canceled subscriptions
        {
          body: {
            object: "list",
            data: [
              makeSubscription({
                id: "sub_canceled_1",
                status: "canceled",
                canceled_at: 1700100000,
                cancellation_details: { reason: "too_expensive" },
              }),
              makeSubscription({
                id: "sub_canceled_2",
                status: "canceled",
                canceled_at: 1700200000,
                cancellation_details: { reason: "too_expensive" },
              }),
              makeSubscription({
                id: "sub_canceled_3",
                status: "canceled",
                canceled_at: 1700300000,
                cancellation_details: { reason: "missing_features" },
              }),
            ],
            has_more: false,
          },
        },
        // active subscriptions
        {
          body: {
            object: "list",
            data: [makeSubscription(), makeSubscription({ id: "sub_active_2" })],
            has_more: false,
          },
        },
      ]);

      const result = await server.call("stripe_churn_analysis", {
        start_date: "2023-11-01",
        end_date: "2023-11-30",
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.churn_count).toBe(3);
      expect(data.active_count).toBe(2);
      expect(data.churn_rate).toBeCloseTo(0.6);
      expect(data.top_cancellation_reasons[0].reason).toBe("too_expensive");
      expect(data.top_cancellation_reasons[0].count).toBe(2);
    });

    it("returns error for invalid dates", async () => {
      setupClient([]);
      const result = await server.call("stripe_churn_analysis", {
        start_date: "invalid",
        end_date: "also-invalid",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("INVALID_INPUT");
    });
  });
});
