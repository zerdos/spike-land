/**
 * PageIndex MCP tool registrations.
 * Registers tools on any McpServer instance.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PageIndexClient } from "./client.js";
import { InsightStore } from "./self-improve.js";

export function registerPageIndexTools(
  server: McpServer,
  client: PageIndexClient,
  insightStore: InsightStore,
): void {
  // ── Upload Document ──
  server.tool(
    "pageindex_upload_document",
    "PDF dokumentum feltöltése és fa-struktúrájú index létrehozása (vectorless RAG)",
    { url: z.string().url().describe("A PDF dokumentum URL-je") },
    async ({ url }) => {
      const res = await fetch(url);
      if (!res.ok) {
        return {
          content: [{ type: "text" as const, text: `Hiba a letöltésnél: ${res.status}` }],
          isError: true,
        };
      }
      const blob = new Blob([await res.arrayBuffer()], { type: "application/pdf" });
      const fileName = url.split("/").pop() ?? "document.pdf";
      const result = await client.submitDocument(blob, fileName);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              doc_id: result.doc_id,
              status: "processing",
              message: "Dokumentum feltöltve, feldolgozás folyamatban.",
            }),
          },
        ],
      };
    },
  );

  // ── Get Tree ──
  server.tool(
    "pageindex_get_tree",
    "Dokumentum fa-struktúrájú tartalomjegyzékének lekérése",
    {
      doc_id: z.string().describe("Dokumentum azonosító"),
      include_summaries: z.boolean().default(false).describe("Node összefoglalók megjelenítése"),
    },
    async ({ doc_id, include_summaries }) => {
      const result = await client.getTree(doc_id, include_summaries);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ── Chat with Document ──
  server.tool(
    "pageindex_chat",
    "Kérdés feltevése dokumentumoknak — reasoning-alapú keresés oldalszintű hivatkozásokkal. Self-improving: a válaszok kontextusként visszatáplálódnak.",
    {
      query: z.string().describe("A kérdés a dokumentumhoz"),
      doc_id: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe("Dokumentum ID(k) — ha üres, minden dokumentumban keres"),
      temperature: z.number().min(0).max(1).default(0.1).describe("Sampling hőmérséklet"),
    },
    async ({ query, doc_id, temperature }) => {
      // Build self-improving context
      const priorContext = insightStore.buildContext(query);
      const messages: Array<{ role: "user" | "system"; content: string }> = [];
      if (priorContext) {
        messages.push({ role: "system", content: priorContext });
      }
      messages.push({ role: "user", content: query });

      const result = await client.chat(messages, doc_id, {
        enableCitations: true,
        temperature,
      });

      const answer = result.choices[0]?.message?.content ?? "Nincs válasz.";

      // Extract citation markers
      const citationRegex = /<doc=[^;]+;page=(\d+)>/g;
      const citations: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = citationRegex.exec(answer)) !== null) {
        citations.push(`page ${match[1]}`);
      }

      // Self-improving: store insight
      insightStore.add({
        docId: typeof doc_id === "string" ? doc_id : (doc_id?.[0] ?? "all"),
        query,
        answer,
        citations,
        confidence: citations.length > 0 ? 0.9 : 0.6,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                answer,
                citations,
                usage: result.usage,
                insights_count: insightStore.getAll().length,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── Search Documents ──
  server.tool(
    "pageindex_search_documents",
    "Dokumentumok keresése név vagy leírás alapján",
    { query: z.string().describe("Keresési kifejezés") },
    async ({ query }) => {
      const docs = await client.searchDocuments(query);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ results: docs, count: docs.length }, null, 2),
          },
        ],
      };
    },
  );

  // ── List Documents ──
  server.tool(
    "pageindex_list_documents",
    "Feltöltött dokumentumok listázása",
    {
      limit: z.number().min(1).max(100).default(50).describe("Maximum elemszám"),
      offset: z.number().min(0).default(0).describe("Kezdő pozíció"),
    },
    async ({ limit, offset }) => {
      const result = await client.listDocuments(limit, offset);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ── Get Document Info ──
  server.tool(
    "pageindex_get_document",
    "Dokumentum részleteinek és feldolgozási státuszának lekérése",
    { doc_id: z.string().describe("Dokumentum azonosító") },
    async ({ doc_id }) => {
      const doc = await client.getDocument(doc_id);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(doc, null, 2) }],
      };
    },
  );

  // ── Delete Document ──
  server.tool(
    "pageindex_delete_document",
    "Dokumentum és kapcsolódó adatok végleges törlése",
    { doc_id: z.string().describe("Dokumentum azonosító") },
    async ({ doc_id }) => {
      await client.deleteDocument(doc_id);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ deleted: true, doc_id }) }],
      };
    },
  );

  // ── Self-Improving Context ──
  server.tool(
    "pageindex_improve_context",
    "A self-improving loop kezelése: korábbi megállapítások listázása, törlése, vagy exportálása",
    {
      action: z.enum(["list", "clear", "export"]).describe("Művelet: list/clear/export"),
    },
    async ({ action }) => {
      switch (action) {
        case "list":
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    insights: insightStore.getAll(),
                    count: insightStore.getAll().length,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        case "clear":
          insightStore.clear();
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ cleared: true }) }],
          };
        case "export":
          return {
            content: [{ type: "text" as const, text: insightStore.toJSON() }],
          };
      }
    },
  );
}
