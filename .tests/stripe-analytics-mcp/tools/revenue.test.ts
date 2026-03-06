import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../../../src/mcp-tools/stripe-analytics/clients/stripe-client.js";
import { registerRevenueTools } from "../../../src/mcp-tools/stripe-analytics/tools/revenue.js";

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

describe("revenue tools", () => {
  let server: ReturnType<typeof createMockServer>;
  let client: StripeClient;
  let fetch: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createMockServer();
  });

  function setupClient(responses: Array<{ body: unknown; status?: number }>) {
    fetch = mockFetch(responses);
    client = new StripeClient("sk_test_123", fetch as unknown as typeof globalThis.fetch);
    registerRevenueTools(server as unknown as McpServer, client);
  }

  describe("stripe_revenue_summary", () => {
    it("registers the tool", () => {
      setupClient([]);
      expect(server.handlers.has("stripe_revenue_summary")).toBe(true);
    });

    it("aggregates balance transactions by type", async () => {
      setupClient([{
        body: {
          object: "list",
          data: [
            { id: "txn_1", type: "charge", amount: 5000, fee: 175, net: 4825, currency: "usd", created: 1700000000 },
            { id: "txn_2", type: "charge", amount: 3000, fee: 117, net: 2883, currency: "usd", created: 1700000100 },
            { id: "txn_3", type: "refund", amount: -2000, fee: 0, net: -2000, currency: "usd", created: 1700000200 },
          ],
          has_more: false,
        },
      }]);

      const result = await server.call("stripe_revenue_summary", {
        start_date: "2023-11-01",
        end_date: "2023-11-30",
        currency: "usd",
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.total_revenue).toBe(8000);
      expect(data.total_fees).toBe(292);
      expect(data.total_refunds).toBe(2000);
      expect(data.transaction_count).toBe(3);
      expect(data.by_type.charge.count).toBe(2);
      expect(data.by_type.refund.count).toBe(1);
    });

    it("returns error for invalid dates", async () => {
      setupClient([]);
      const result = await server.call("stripe_revenue_summary", {
        start_date: "not-a-date",
        end_date: "also-bad",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("INVALID_INPUT");
    });

    it("handles Stripe API errors", async () => {
      setupClient([{ body: { error: { message: "Invalid API Key" } }, status: 401 }]);
      const result = await server.call("stripe_revenue_summary", {
        start_date: "2023-11-01",
        end_date: "2023-11-30",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("STRIPE_API_ERROR");
    });
  });

  describe("stripe_payout_history", () => {
    it("returns payouts", async () => {
      setupClient([{
        body: {
          object: "list",
          data: [
            { id: "po_1", amount: 10000, currency: "usd", status: "paid", arrival_date: 1700000000, created: 1699900000, method: "standard", description: null },
          ],
          has_more: false,
        },
      }]);

      const result = await server.call("stripe_payout_history", { limit: 5 });
      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.count).toBe(1);
      expect(data.payouts[0].id).toBe("po_1");
      expect(data.payouts[0].status).toBe("paid");
    });

    it("filters by status", async () => {
      setupClient([{
        body: { object: "list", data: [], has_more: false },
      }]);

      const result = await server.call("stripe_payout_history", { limit: 10, status: "pending" });
      expect(result.isError).toBeUndefined();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("status=pending"),
        expect.anything(),
      );
    });
  });

  describe("stripe_dispute_summary", () => {
    it("summarizes disputes with win rate", async () => {
      setupClient([
        // First page
        {
          body: {
            object: "list",
            data: [
              { id: "dp_1", amount: 5000, currency: "usd", status: "won", reason: "general", created: 1700000000, charge: "ch_1" },
              { id: "dp_2", amount: 3000, currency: "usd", status: "lost", reason: "fraudulent", created: 1700000100, charge: "ch_2" },
              { id: "dp_3", amount: 2000, currency: "usd", status: "needs_response", reason: "general", created: 1700000200, charge: "ch_3" },
            ],
            has_more: false,
          },
        },
      ]);

      const result = await server.call("stripe_dispute_summary", {});
      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.total_disputes).toBe(3);
      expect(data.win_rate).toBe(0.5);
      expect(data.amount_at_risk).toBe(2000);
      expect(data.by_status.won.count).toBe(1);
    });
  });
});
