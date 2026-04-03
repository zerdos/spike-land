/**
 * PageIndex MCP tool registrations.
 * Registers tools on any McpServer instance.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PageIndexClient } from "./client.js";
import { InsightStore } from "./self-improve.js";

const INSIGHTS_FILE = ".pageindex-insights.json";

export function registerPageIndexTools(
  server: McpServer,
  client: PageIndexClient,
  insightStore: InsightStore,
): void {
  // Auto-save after mutations
  async function autoSave(): Promise<void> {
    try {
      await insightStore.saveToFile(INSIGHTS_FILE);
    } catch {
      // silent — best effort persistence
    }
  }

  // ── Upload Document ──
  server.tool(
    "pageindex_upload_document",
    "PDF dokumentum feltöltése és fa-struktúrájú index létrehozása (vectorless RAG)",
    {
      url: z.string().url().describe("A PDF dokumentum URL-je"),
      folder_id: z.string().optional().describe("Mappa azonosító (opcionális)"),
    },
    async ({ url, folder_id }) => {
      const res = await fetch(url);
      if (!res.ok) {
        return {
          content: [{ type: "text" as const, text: `Hiba a letöltésnél: ${res.status}` }],
          isError: true,
        };
      }
      const blob = new Blob([await res.arrayBuffer()], { type: "application/pdf" });
      const fileName = url.split("/").pop() ?? "document.pdf";
      const result = await client.submitDocument(
        blob,
        fileName,
        folder_id ? { folderId: folder_id } : undefined,
      );
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
    "Kérdés feltevése dokumentumoknak — reasoning-alapú keresés oldalszintű hivatkozásokkal. Self-improving: a válaszok kontextusként visszatáplálódnak, topic-fába rendeződnek.",
    {
      query: z.string().describe("A kérdés a dokumentumhoz"),
      doc_id: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe("Dokumentum ID(k) — ha üres, minden dokumentumban keres"),
      temperature: z.number().min(0).max(1).default(0.1).describe("Sampling hőmérséklet"),
    },
    async ({ query, doc_id, temperature }) => {
      const priorContext = insightStore.buildContext(query);
      const topRated = insightStore.getTopRated(2);
      const messages: Array<{ role: "user" | "system"; content: string }> = [];

      if (priorContext) {
        messages.push({ role: "system", content: priorContext });
      }

      // Few-shot: top-rated insight-ok mint példák
      if (topRated.length > 0) {
        const examples = topRated
          .map((i) => `K: ${i.query}\nV: ${i.answer.slice(0, 100)}`)
          .join("\n---\n");
        messages.push({
          role: "system",
          content: `── Legjobban értékelt korábbi válaszok (példa a kívánt stílusra) ──\n${examples}`,
        });
      }

      messages.push({ role: "user", content: query });

      const result = await client.chat(messages, doc_id, {
        enableCitations: true,
        temperature,
      });

      const answer = result.choices[0]?.message?.content ?? "Nincs válasz.";

      const citationRegex = /<doc=[^;]+;page=(\d+)>/g;
      const citations: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = citationRegex.exec(answer)) !== null) {
        citations.push(`page ${match[1]}`);
      }

      // Self-improving: store & classify into topic tree & auto-save
      const insight = insightStore.add({
        docId: typeof doc_id === "string" ? doc_id : (doc_id?.[0] ?? "all"),
        query,
        answer,
        citations,
        confidence: citations.length > 0 ? 0.9 : 0.6,
      });

      // Periodic topic freezing
      insightStore.topicTree.freezeStaleTopics();

      await autoSave();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                answer,
                citations,
                usage: result.usage,
                insight_id: insight.id,
                topic_id: insight.topicId,
                insights_count: insightStore.getAll().length,
                prior_context_used: !!priorContext,
                top_rated_examples: topRated.length,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── Rate Insight ──
  server.tool(
    "pageindex_rate",
    "Insight értékelése: thumbs up (+1) vagy thumbs down (-1). A self-improving loop tanul a feedback-ből — topic routing és confidence is frissül.",
    {
      insight_id: z.string().describe("Az insight azonosítója (pageindex_chat válaszából)"),
      rating: z.enum(["up", "down"]).describe("Értékelés: up = hasznos, down = rossz/irreleváns"),
    },
    async ({ insight_id, rating }) => {
      const delta = rating === "up" ? 1 : -1;
      const updated = insightStore.rate(insight_id, delta as 1 | -1);
      if (!updated) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "Insight nem található", insight_id }),
            },
          ],
          isError: true,
        };
      }
      await autoSave();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              rated: true,
              insight_id,
              new_confidence: Math.round(updated.confidence * 100),
              total_feedback: updated.feedback,
              topic_id: updated.topicId,
            }),
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

  // ── Folder Management ──
  server.tool(
    "pageindex_create_folder",
    "Új mappa létrehozása dokumentumok rendszerezéséhez",
    {
      name: z.string().describe("Mappa neve"),
      description: z.string().optional().describe("Mappa leírása"),
      parent_folder_id: z.string().optional().describe("Szülő mappa ID (almappához)"),
    },
    async ({ name, description, parent_folder_id }) => {
      const opts: { description?: string; parentFolderId?: string } = {};
      if (description) opts.description = description;
      if (parent_folder_id) opts.parentFolderId = parent_folder_id;
      const folder = await client.createFolder(name, opts);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(folder, null, 2) }],
      };
    },
  );

  server.tool(
    "pageindex_list_folders",
    "Mappák listázása",
    {
      parent_folder_id: z.string().optional().describe("Szülő mappa ID szűréshez"),
    },
    async ({ parent_folder_id }) => {
      const folders = await client.listFolders(parent_folder_id);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ folders, count: folders.length }, null, 2),
          },
        ],
      };
    },
  );

  // ── Self-Improving Loop Management ──
  server.tool(
    "pageindex_improve_context",
    "A self-improving loop kezelése: insights listázása, törlése, exportálása, statisztikák, topic-fa info, vagy fájlból betöltés",
    {
      action: z
        .enum(["list", "clear", "export", "stats", "load", "top_rated", "topics", "freeze"])
        .describe("Művelet: list/clear/export/stats/load/top_rated/topics/freeze"),
    },
    async ({ action }) => {
      switch (action) {
        case "list":
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  { insights: insightStore.getAll(), count: insightStore.getAll().length },
                  null,
                  2,
                ),
              },
            ],
          };
        case "clear":
          insightStore.clear();
          await autoSave();
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ cleared: true }) }],
          };
        case "export":
          return {
            content: [{ type: "text" as const, text: insightStore.toJSON() }],
          };
        case "stats":
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(insightStore.stats(), null, 2),
              },
            ],
          };
        case "load": {
          const loaded = await insightStore.loadFromFile(INSIGHTS_FILE);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  loaded,
                  count: insightStore.getAll().length,
                }),
              },
            ],
          };
        }
        case "top_rated":
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    top_rated: insightStore.getTopRated(10),
                    count: insightStore.getTopRated(10).length,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        case "topics":
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    tree: JSON.parse(insightStore.topicTree.toJSON()),
                    stats: insightStore.topicTree.stats(),
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        case "freeze": {
          const frozen = insightStore.topicTree.freezeStaleTopics();
          await autoSave();
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ frozen_count: frozen }),
              },
            ],
          };
        }
      }
    },
  );
}
