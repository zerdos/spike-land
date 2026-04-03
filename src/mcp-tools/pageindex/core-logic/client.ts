/**
 * PageIndex API client — wraps the PageIndex.ai REST API.
 * Vectorless, reasoning-based RAG: tree-structured document indexing.
 *
 * API docs: https://docs.pageindex.ai/endpoints
 * Auth: api_key header
 * Base: https://api.pageindex.ai
 */

const BASE_URL = "https://api.pageindex.ai";

export interface PageIndexConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface DocumentSubmitResult {
  doc_id: string;
}

export interface DocumentMetadata {
  id: string;
  name: string;
  description: string | null;
  status: "processing" | "completed" | "failed";
  pageNum: number;
  folderId: string | null;
  createdAt: string;
}

export interface TreeNode {
  title: string;
  node_id: string;
  start_index: number;
  end_index: number;
  summary: string;
  nodes: TreeNode[];
}

export interface DocumentResult {
  status: "processing" | "completed" | "failed";
  tree?: TreeNode;
  metadata?: DocumentMetadata;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatChoice {
  message: { role: "assistant"; content: string };
}

export interface ChatResponse {
  choices: ChatChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface DocumentListResult {
  documents: DocumentMetadata[];
  total: number;
  limit: number;
  offset: number;
}

export class PageIndexClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: PageIndexConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? BASE_URL;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        api_key: this.apiKey,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PageIndex API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async submitDocument(file: Blob, fileName: string): Promise<DocumentSubmitResult> {
    const formData = new FormData();
    formData.append("file", file, fileName);
    const res = await fetch(`${this.baseUrl}/doc/`, {
      method: "POST",
      headers: { api_key: this.apiKey },
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PageIndex upload error ${res.status}: ${text}`);
    }
    return res.json() as Promise<DocumentSubmitResult>;
  }

  async getDocument(docId: string): Promise<DocumentResult> {
    return this.request<DocumentResult>(`/doc/${docId}/`);
  }

  async getMetadata(docId: string): Promise<DocumentMetadata> {
    return this.request<DocumentMetadata>(`/doc/${docId}/metadata`);
  }

  async getTree(docId: string, _nodeSummary = false): Promise<DocumentResult> {
    return this.request<DocumentResult>(`/doc/${docId}/`);
  }

  async listDocuments(limit = 50, offset = 0): Promise<DocumentListResult> {
    return this.request<DocumentListResult>(`/docs?limit=${limit}&offset=${offset}`);
  }

  async deleteDocument(docId: string): Promise<void> {
    await this.request<unknown>(`/doc/${docId}/`, { method: "DELETE" });
  }

  async chat(
    messages: ChatMessage[],
    docId?: string | string[],
    options?: { enableCitations?: boolean; temperature?: number },
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        messages,
        doc_id: docId,
        enable_citations: options?.enableCitations ?? true,
        temperature: options?.temperature ?? 0.1,
      }),
    });
  }

  async searchDocuments(query: string): Promise<DocumentMetadata[]> {
    const result = await this.listDocuments(100);
    const q = query.toLowerCase();
    return result.documents.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)),
    );
  }
}
