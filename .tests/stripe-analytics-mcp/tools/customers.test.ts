import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "@spike-land-ai/mcp-server-base";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../../../src/mcp-tools/stripe-analytics/core-logic/stripe-client.js";
import { registerCustomerTools } from "../../../src/mcp-tools/stripe-analytics/mcp/customers.js";

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

describe("customer tools", () => {
  let server: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createMockServer();
  });

  function setupClient(responses: Array<{ body: unknown; status?: number }>) {
    const fetch = mockFetch(responses);
    const client = new StripeClient("sk_test_123", fetch as unknown as typeof globalThis.fetch);
    registerCustomerTools(server as unknown as McpServer, client);
    return fetch;
  }

  describe("stripe_customer_ltv", () => {
    it("calculates LTV for a specific customer", async () => {
      setupClient([{
        body: {
          object: "list",
          data: [
            { id: "ch_1", amount: 5000, currency: "usd", created: 1700000000, customer: "cus_1", status: "succeeded" },
            { id: "ch_2", amount: 3000, currency: "usd", created: 1700100000, customer: "cus_1", status: "succeeded" },
            { id: "ch_3", amount: 1000, currency: "usd", created: 1700200000, customer: "cus_1", status: "failed" },
          ],
          has_more: false,
        },
      }]);

      const result = await server.call("stripe_customer_ltv", { customer_id: "cus_1" });
      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.customer_id).toBe("cus_1");
      expect(data.total_spend).toBe(8000);
      expect(data.charge_count).toBe(2);
      expect(data.average_charge).toBe(4000);
    });

    it("returns top customers when no customer_id provided", async () => {
      setupClient([{
        body: {
          object: "list",
          data: [
            { id: "ch_1", amount: 10000, currency: "usd", created: 1700000000, customer: "cus_1", status: "succeeded" },
            { id: "ch_2", amount: 5000, currency: "usd", created: 1700100000, customer: "cus_2", status: "succeeded" },
            { id: "ch_3", amount: 8000, currency: "usd", created: 1700200000, customer: "cus_1", status: "succeeded" },
          ],
          has_more: false,
        },
      }]);

      const result = await server.call("stripe_customer_ltv", { limit: 10 });
      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.top_customers).toHaveLength(2);
      expect(data.top_customers[0].customer_id).toBe("cus_1");
      expect(data.top_customers[0].total_spend).toBe(18000);
      expect(data.top_customers[1].customer_id).toBe("cus_2");
      expect(data.average_ltv).toBe(11500);
    });

    it("handles API errors", async () => {
      setupClient([{ body: { error: { message: "Not found" } }, status: 404 }]);
      const result = await server.call("stripe_customer_ltv", { customer_id: "cus_bad" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("STRIPE_API_ERROR");
    });
  });

  describe("stripe_upcoming_invoices", () => {
    it("forecasts revenue from upcoming invoices", async () => {
      setupClient([
        // active subscriptions
        {
          body: {
            object: "list",
            data: [
              { id: "sub_1", status: "active", customer: "cus_1", items: { data: [] }, created: 1700000000, canceled_at: null, cancellation_details: null },
              { id: "sub_2", status: "active", customer: "cus_2", items: { data: [] }, created: 1700000000, canceled_at: null, cancellation_details: null },
            ],
            has_more: false,
          },
        },
        // upcoming invoice for cus_1
        {
          body: { id: "inv_1", amount_due: 2000, currency: "usd", customer: "cus_1", status: "draft" },
        },
        // upcoming invoice for cus_2
        {
          body: { id: "inv_2", amount_due: 5000, currency: "usd", customer: "cus_2", status: "draft" },
        },
      ]);

      const result = await server.call("stripe_upcoming_invoices", {});
      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.total_upcoming_amount).toBe(7000);
      expect(data.invoice_count).toBe(2);
    });

    it("handles errors for individual customers gracefully", async () => {
      setupClient([
        // active subscriptions
        {
          body: {
            object: "list",
            data: [
              { id: "sub_1", status: "active", customer: "cus_1", items: { data: [] }, created: 1700000000, canceled_at: null, cancellation_details: null },
            ],
            has_more: false,
          },
        },
        // error for upcoming invoice
        { body: { error: { message: "No upcoming invoices" } }, status: 404 },
      ]);

      const result = await server.call("stripe_upcoming_invoices", {});
      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.invoice_count).toBe(0);
    });
  });
});
