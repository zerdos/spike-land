/**
 * PageIndex API client — wraps the PageIndex.ai REST API.
 * Vectorless, reasoning-based RAG: tree-structured document indexing.
 *
 * API docs: https://docs.pageindex.ai/endpoints
 * Auth: api_key header
 * Base: https://api.pageindex.ai
 */

const BASE_URL = "https://api.pageindex.ai";

// ─── Typed Errors ───

export type PageIndexErrorCode =
  | "USAGE_LIMIT_REACHED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "PLAN_REQUIRED"
  | "FOLDER_SCOPE_VIOLATION"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

function mapStatusToErrorCode(status: number): PageIndexErrorCode {
  switch (status) {
    case 400:
      return "INVALID_INPUT";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "PLAN_REQUIRED";
    case 404:
      return "NOT_FOUND";
    case 429:
      return "RATE_LIMITED";
    case 503:
      return "SERVICE_UNAVAILABLE";
    default:
      return "INTERNAL_ERROR";
  }
}

export class PageIndexError extends Error {
  code: PageIndexErrorCode;
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.name = "PageIndexError";
    this.statusCode = statusCode;
    this.code = details?.errorCode
      ? (details.errorCode as PageIndexErrorCode)
      : mapStatusToErrorCode(statusCode);
    if (details) this.details = details;
  }
}

// ─── Types ───

export interface PageIndexConfig {
  apiKey: string;
  baseUrl?: string;
  folderId?: string;
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

export interface ChatCompletionChunk {
  choices: Array<{ delta: { content?: string }; finish_reason?: string }>;
}

export interface DocumentListResult {
  documents: DocumentMetadata[];
  total: number;
  limit: number;
  offset: number;
}

export interface FolderInfo {
  id: string;
  name: string;
  description: string | null;
  parentFolderId: string | null;
}

// ─── Client ───

export class PageIndexClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private folderId?: string;

  constructor(config: PageIndexConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? BASE_URL;
    if (config.folderId) this.folderId = config.folderId;
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
      let details: Record<string, unknown> | undefined;
      try {
        details = JSON.parse(text) as Record<string, unknown>;
      } catch {
        // not JSON
      }
      throw new PageIndexError(
        details?.error ? String(details.error) : `PageIndex API error ${res.status}: ${text}`,
        res.status,
        details,
      );
    }
    return res.json() as Promise<T>;
  }

  async submitDocument(
    file: Blob | ArrayBuffer,
    fileName: string,
    options?: { mode?: string; folderId?: string },
  ): Promise<DocumentSubmitResult> {
    const formData = new FormData();
    const blob = file instanceof Blob ? file : new Blob([file], { type: "application/pdf" });
    formData.append("file", blob, fileName);
    if (options?.mode) formData.append("mode", options.mode);
    const fId = options?.folderId ?? this.folderId;
    if (fId) formData.append("folder_id", fId);

    const res = await fetch(`${this.baseUrl}/doc/`, {
      method: "POST",
      headers: { api_key: this.apiKey },
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new PageIndexError(`PageIndex upload error ${res.status}: ${text}`, res.status);
    }
    return res.json() as Promise<DocumentSubmitResult>;
  }

  async getDocument(docId: string): Promise<DocumentResult> {
    return this.request<DocumentResult>(`/doc/${docId}/`);
  }

  async getMetadata(docId: string): Promise<DocumentMetadata> {
    return this.request<DocumentMetadata>(`/doc/${docId}/metadata`);
  }

  async getTree(docId: string, nodeSummary = false): Promise<DocumentResult> {
    const params = new URLSearchParams({ type: "tree" });
    if (nodeSummary) params.set("summary", "true");
    return this.request<DocumentResult>(`/doc/${docId}/?${params}`);
  }

  async listDocuments(limit = 50, offset = 0, folderId?: string): Promise<DocumentListResult> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const fId = folderId ?? this.folderId;
    if (fId) params.set("folder_id", fId);
    return this.request<DocumentListResult>(`/docs?${params}`);
  }

  async deleteDocument(docId: string): Promise<void> {
    await this.request<unknown>(`/doc/${docId}/`, { method: "DELETE" });
  }

  async createFolder(
    name: string,
    options?: { description?: string; parentFolderId?: string },
  ): Promise<FolderInfo> {
    return this.request<FolderInfo>("/folder/", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: options?.description,
        parent_folder_id: options?.parentFolderId,
      }),
    });
  }

  async listFolders(parentFolderId?: string): Promise<FolderInfo[]> {
    const params = parentFolderId ? `?parent_folder_id=${parentFolderId}` : "";
    return this.request<FolderInfo[]>(`/folders/${params}`);
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

  async *chatStream(
    messages: ChatMessage[],
    docId?: string | string[],
    options?: { enableCitations?: boolean; temperature?: number },
  ): AsyncGenerator<ChatCompletionChunk> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        api_key: this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        doc_id: docId,
        enable_citations: options?.enableCitations ?? true,
        temperature: options?.temperature ?? 0.1,
        stream: true,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new PageIndexError(`PageIndex stream error ${res.status}: ${text}`, res.status);
    }
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ") || trimmed === "data: [DONE]") continue;
          const chunk = JSON.parse(trimmed.slice(6)) as ChatCompletionChunk;
          yield chunk;
        }
      }
    } finally {
      reader.releaseLock();
    }
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
