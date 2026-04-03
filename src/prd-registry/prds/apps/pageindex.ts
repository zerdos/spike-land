import type { PrdDefinition } from "../../core-logic/types.js";

export const pageindexPrd: PrdDefinition = {
  id: "app:pageindex",
  level: "app",
  name: "PageIndex",
  summary:
    "Vectorless reasoning-based RAG with tree-structured document indexing and self-improving loop",
  purpose:
    "Integrate PageIndex.ai as an MCP tool for document understanding. Upload PDFs, build tree indexes, chat with documents, and feed insights back into the platform's self-improving knowledge loop.",
  constraints: [
    "Must use PageIndex JS SDK or native MCP endpoint (api.pageindex.ai/mcp)",
    "API key stored in secrets, never exposed to client",
    "Document processing is async — poll status before querying",
    "Citations must include page-level references",
    "Self-improving loop: query results feed back as context for future queries",
    "Free tier limit: 200 credits, 200 active pages",
  ],
  acceptance: [
    "PDF upload returns doc_id and tree structure on completion",
    "Chat API returns cited answers scoped to uploaded documents",
    "MCP tools registered: pageindex_upload, pageindex_query, pageindex_search, pageindex_tree",
    "Self-improving loop persists insights as reusable context",
  ],
  toolCategories: ["pageindex", "document-rag"],
  tools: [
    "pageindex_upload_document",
    "pageindex_get_tree",
    "pageindex_chat",
    "pageindex_search_documents",
    "pageindex_get_page",
    "pageindex_list_documents",
    "pageindex_delete_document",
    "pageindex_improve_context",
  ],
  composesFrom: ["platform", "domain:ai-automation", "route:/apps"],
  routePatterns: ["/apps/pageindex"],
  keywords: [
    "pageindex",
    "rag",
    "document",
    "pdf",
    "vectorless",
    "reasoning",
    "tree",
    "index",
    "citation",
    "self-improving",
  ],
  tokenEstimate: 450,
  version: "1.0.0",
};
