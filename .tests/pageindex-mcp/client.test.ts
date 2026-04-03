import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PageIndexClient,
  PageIndexError,
} from "../../src/mcp-tools/pageindex/core-logic/client.js";

describe("PageIndexClient", () => {
  let client: PageIndexClient;

  beforeEach(() => {
    client = new PageIndexClient({ apiKey: "test-key", baseUrl: "https://test.api" });
    vi.restoreAllMocks();
  });

  describe("getDocument", () => {
    it("fetches document info with api_key header", async () => {
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
        "https://test.api/doc/doc_123/",
        expect.objectContaining({
          headers: expect.objectContaining({
            api_key: "test-key",
          }),
        }),
      );
    });

    it("throws PageIndexError with typed code on API error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
      );

      try {
        await client.getDocument("bad_id");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PageIndexError);
        const pErr = err as PageIndexError;
        expect(pErr.code).toBe("NOT_FOUND");
        expect(pErr.statusCode).toBe(404);
      }
    });

    it("throws PageIndexError on non-JSON error body", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Server Error", { status: 500 }),
      );

      try {
        await client.getDocument("bad_id");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PageIndexError);
        expect((err as PageIndexError).code).toBe("INTERNAL_ERROR");
      }
    });
  });

  describe("getTree", () => {
    it("fetches tree structure with type=tree param", async () => {
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
        "https://test.api/doc/doc_123/?type=tree&summary=true",
        expect.anything(),
      );
    });

    it("omits summary param when false", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "completed" }), { status: 200 }),
      );

      await client.getTree("doc_123", false);

      expect(fetch).toHaveBeenCalledWith(
        "https://test.api/doc/doc_123/?type=tree",
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
        "https://test.api/docs?limit=50&offset=0",
        expect.anything(),
      );
    });

    it("includes folder_id param when provided", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ documents: [], total: 0, limit: 50, offset: 0 }), {
          status: 200,
        }),
      );

      await client.listDocuments(10, 0, "folder_abc");

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain("folder_id=folder_abc");
    });
  });

  describe("deleteDocument", () => {
    it("sends DELETE request", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      await client.deleteDocument("doc_123");

      expect(fetch).toHaveBeenCalledWith(
        "https://test.api/doc/doc_123/",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("createFolder", () => {
    it("creates folder with name and description", async () => {
      const mockFolder = {
        id: "folder_1",
        name: "Pénzügy",
        description: "Pénzügyi dokumentumok",
        parentFolderId: null,
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockFolder), { status: 200 }),
      );

      const result = await client.createFolder("Pénzügy", { description: "Pénzügyi dokumentumok" });

      expect(result.name).toBe("Pénzügy");
      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);
      expect(body.name).toBe("Pénzügy");
      expect(body.description).toBe("Pénzügyi dokumentumok");
    });
  });

  describe("listFolders", () => {
    it("lists folders without filter", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      await client.listFolders();

      expect(fetch).toHaveBeenCalledWith("https://test.api/folders/", expect.anything());
    });

    it("lists folders with parent filter", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      await client.listFolders("parent_123");

      expect(fetch).toHaveBeenCalledWith(
        "https://test.api/folders/?parent_folder_id=parent_123",
        expect.anything(),
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

      expect(results).toHaveLength(2);
    });
  });

  describe("submitDocument", () => {
    it("accepts ArrayBuffer input", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ doc_id: "new_doc" }), { status: 200 }),
      );

      const buffer = new ArrayBuffer(8);
      const result = await client.submitDocument(buffer, "test.pdf");

      expect(result.doc_id).toBe("new_doc");
    });

    it("throws PageIndexError on upload failure", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Too large", { status: 413 }),
      );

      try {
        await client.submitDocument(new ArrayBuffer(8), "big.pdf");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PageIndexError);
      }
    });
  });
});
