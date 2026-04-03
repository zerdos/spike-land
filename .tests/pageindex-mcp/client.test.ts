import { describe, it, expect, vi, beforeEach } from "vitest";
import { PageIndexClient } from "../../src/mcp-tools/pageindex/core-logic/client.js";

describe("PageIndexClient", () => {
  let client: PageIndexClient;

  beforeEach(() => {
    client = new PageIndexClient({ apiKey: "test-key", baseUrl: "https://test.api" });
    vi.restoreAllMocks();
  });

  describe("getDocument", () => {
    it("fetches document info with auth header", async () => {
      const mockDoc = {
        id: "doc_123",
        name: "test.pdf",
        description: null,
        status: "completed",
        pageNum: 10,
        folderId: null,
        createdAt: "2026-04-03T00:00:00Z",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockDoc), { status: 200 }),
      );

      const result = await client.getDocument("doc_123");

      expect(result).toEqual(mockDoc);
      expect(fetch).toHaveBeenCalledWith(
        "https://test.api/v1/documents/doc_123",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-key",
          }),
        }),
      );
    });

    it("throws on API error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Not found", { status: 404 }),
      );

      await expect(client.getDocument("bad_id")).rejects.toThrow("PageIndex API error 404");
    });
  });

  describe("getTree", () => {
    it("fetches tree structure", async () => {
      const mockTree = {
        status: "completed",
        tree: {
          title: "Root",
          node_id: "0001",
          start_index: 0,
          end_index: 10,
          summary: "Document root",
          nodes: [],
        },
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockTree), { status: 200 }),
      );

      const result = await client.getTree("doc_123", true);

      expect(result.status).toBe("completed");
      expect(result.tree?.title).toBe("Root");
      expect(fetch).toHaveBeenCalledWith(
        "https://test.api/v1/documents/doc_123/tree?nodeSummary=true",
        expect.anything(),
      );
    });
  });

  describe("chat", () => {
    it("sends chat request with citations enabled", async () => {
      const mockResponse = {
        choices: [{ message: { role: "assistant", content: "A válasz <doc=test.pdf;page=3>" } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await client.chat(
        [{ role: "user", content: "Mi a fő megállapítás?" }],
        "doc_123",
      );

      expect(result.choices[0].message.content).toContain("page=3");

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);
      expect(body.enable_citations).toBe(true);
      expect(body.doc_id).toBe("doc_123");
    });
  });

  describe("listDocuments", () => {
    it("lists documents with pagination", async () => {
      const mockList = {
        documents: [{ id: "doc_1", name: "a.pdf", status: "completed" }],
        total: 1,
        limit: 50,
        offset: 0,
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockList), { status: 200 }),
      );

      const result = await client.listDocuments(50, 0);

      expect(result.documents).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://test.api/v1/documents?limit=50&offset=0",
        expect.anything(),
      );
    });
  });

  describe("deleteDocument", () => {
    it("sends DELETE request", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      await client.deleteDocument("doc_123");

      expect(fetch).toHaveBeenCalledWith(
        "https://test.api/v1/documents/doc_123",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("searchDocuments", () => {
    it("filters documents by name", async () => {
      const mockList = {
        documents: [
          { id: "doc_1", name: "annual-report.pdf", description: null, status: "completed" },
          { id: "doc_2", name: "budget.pdf", description: "Annual budget", status: "completed" },
        ],
        total: 2,
        limit: 100,
        offset: 0,
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockList), { status: 200 }),
      );

      const results = await client.searchDocuments("annual");

      expect(results).toHaveLength(2); // both match "annual"
    });
  });
});
