import { describe, it, expect, vi, beforeEach } from "vitest";
import { SpikeChatClient } from "../core-logic/client.js";
import type { ChatChannel, ChatMessage } from "../core-logic/types.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface MockFetchOptions {
  status?: number;
  statusText?: string;
  body?: unknown;
  /** Raw text to return instead of JSON-stringified body */
  rawText?: string;
}

function makeMockFetch(opts: MockFetchOptions = {}) {
  const { status = 200, statusText = "OK", body, rawText } = opts;
  const text = rawText !== undefined ? rawText : body !== undefined ? JSON.stringify(body) : "";
  const ok = status >= 200 && status < 300;

  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText,
    text: vi.fn().mockResolvedValue(text),
  } as unknown as Response);
}

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "msg-1",
    channelId: "general",
    userId: "user-1",
    content: "hello",
    contentType: "text",
    threadId: null,
    createdAt: 1_000_000,
    ...overrides,
  };
}

function makeChannel(overrides: Partial<ChatChannel> = {}): ChatChannel {
  return {
    id: "ch-1",
    workspaceId: "ws-1",
    name: "General",
    slug: "general",
    type: "public",
    createdBy: "user-1",
    createdAt: 1_000_000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SpikeChatClient", () => {
  const BASE = "https://chat.spike.land";

  describe("listChannels", () => {
    it("sends GET to /api/v1/channels with workspaceId param and returns parsed JSON", async () => {
      const channels = [makeChannel()];
      const fetchMock = makeMockFetch({ body: channels });
      const client = new SpikeChatClient({ fetch: fetchMock });

      const result = await client.listChannels("ws-42");

      expect(fetchMock).toHaveBeenCalledOnce();
      const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(calledUrl).toBe(`${BASE}/api/v1/channels?workspaceId=ws-42`);
      expect(result).toEqual(channels);
    });
  });

  describe("postMessage", () => {
    it("sends POST with correct body and Content-Type header", async () => {
      const message = makeMessage({ content: "hi there" });
      const fetchMock = makeMockFetch({ body: message });
      const client = new SpikeChatClient({ fetch: fetchMock });

      const result = await client.postMessage("general", "hi there");

      expect(fetchMock).toHaveBeenCalledOnce();
      const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(calledUrl).toBe(`${BASE}/api/v1/messages`);
      expect(init.method).toBe("POST");

      const headers = init.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("application/json");

      const sentBody = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(sentBody.channelId).toBe("general");
      expect(sentBody.content).toBe("hi there");
      expect(result).toEqual(message);
    });

    it("includes Bearer Authorization header when apiKey is provided", async () => {
      const fetchMock = makeMockFetch({ body: makeMessage() });
      const client = new SpikeChatClient({ apiKey: "sk-test-123", fetch: fetchMock });

      await client.postMessage("general", "secured");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer sk-test-123");
    });

    it("includes x-agent-id header when agentId is provided", async () => {
      const fetchMock = makeMockFetch({ body: makeMessage() });
      const client = new SpikeChatClient({ agentId: "agent-007", fetch: fetchMock });

      await client.postMessage("general", "from agent");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers["x-agent-id"]).toBe("agent-007");
    });
  });

  describe("deleteMessage", () => {
    it("sends DELETE request to /api/v1/messages/:id", async () => {
      const fetchMock = makeMockFetch({ rawText: "" });
      const client = new SpikeChatClient({ fetch: fetchMock });

      await client.deleteMessage("msg-abc");

      expect(fetchMock).toHaveBeenCalledOnce();
      const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(calledUrl).toBe(`${BASE}/api/v1/messages/msg-abc`);
      expect(init.method).toBe("DELETE");
    });
  });

  describe("postAppUpdate", () => {
    it("posts to app-<slug> channel with contentType app_updated", async () => {
      const message = makeMessage({ channelId: "app-my-app", contentType: "app_updated" });
      const fetchMock = makeMockFetch({ body: message });
      const client = new SpikeChatClient({ fetch: fetchMock });

      const result = await client.postAppUpdate("my-app", "Deployed v1.2.3", {
        version: "1.2.3",
        changedFiles: ["index.ts"],
      });

      const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(calledUrl).toBe(`${BASE}/api/v1/messages`);

      const sentBody = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(sentBody.channelId).toBe("app-my-app");
      expect(sentBody.contentType).toBe("app_updated");
      expect(sentBody.content).toBe("Deployed v1.2.3");
      expect(result).toEqual(message);
    });
  });

  describe("listMessages", () => {
    it("passes since cursor as query param when provided", async () => {
      const messages = [makeMessage({ id: "msg-99" })];
      const fetchMock = makeMockFetch({ body: messages });
      const client = new SpikeChatClient({ fetch: fetchMock });

      await client.listMessages("general", { since: "01JXCURSOR00000", limit: 50 });

      const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
      const url = new URL(calledUrl);
      expect(url.searchParams.get("channelId")).toBe("general");
      expect(url.searchParams.get("since")).toBe("01JXCURSOR00000");
      expect(url.searchParams.get("limit")).toBe("50");
    });

    it("omits since param when not provided", async () => {
      const fetchMock = makeMockFetch({ body: [] });
      const client = new SpikeChatClient({ fetch: fetchMock });

      await client.listMessages("general");

      const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
      const url = new URL(calledUrl);
      expect(url.searchParams.has("since")).toBe(false);
    });
  });

  describe("poll", () => {
    it("groups results by channel and updates cursors map with last message id", async () => {
      const msg1 = makeMessage({ id: "msg-1", channelId: "ch-a", content: "first" });
      const msg2 = makeMessage({ id: "msg-2", channelId: "ch-b", content: "second" });

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: "OK",
          text: vi.fn().mockResolvedValue(JSON.stringify([msg1])),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: "OK",
          text: vi.fn().mockResolvedValue(JSON.stringify([msg2])),
        } as unknown as Response);

      const client = new SpikeChatClient({ fetch: fetchMock });
      const cursors = new Map<string, string>();

      const results = await client.poll(["ch-a", "ch-b"], cursors);

      // Both channels should appear
      const channelIds = results.map((r) => r.channelId).sort();
      expect(channelIds).toEqual(["ch-a", "ch-b"]);

      // Cursors updated to last message id
      expect(cursors.get("ch-a")).toBe("msg-1");
      expect(cursors.get("ch-b")).toBe("msg-2");
    });

    it("passes existing cursor as since param for subsequent polls", async () => {
      const msg = makeMessage({ id: "msg-10", channelId: "ch-a" });
      const fetchMock = makeMockFetch({ body: [msg] });
      const client = new SpikeChatClient({ fetch: fetchMock });
      const cursors = new Map([["ch-a", "msg-5"]]);

      await client.poll(["ch-a"], cursors);

      const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
      const url = new URL(calledUrl);
      expect(url.searchParams.get("since")).toBe("msg-5");
    });

    it("omits channels with no new messages from results", async () => {
      const fetchMock = makeMockFetch({ body: [] });
      const client = new SpikeChatClient({ fetch: fetchMock });
      const cursors = new Map<string, string>();

      const results = await client.poll(["ch-empty"], cursors);

      expect(results).toHaveLength(0);
      expect(cursors.size).toBe(0);
    });
  });

  describe("error handling", () => {
    it("throws an error with status code when response is not ok", async () => {
      const fetchMock = makeMockFetch({
        status: 403,
        statusText: "Forbidden",
        rawText: "Access denied",
      });
      const client = new SpikeChatClient({ fetch: fetchMock });

      await expect(client.listChannels("ws-bad")).rejects.toThrow("spike-chat 403 Forbidden");
    });

    it("includes server error body in the thrown error message", async () => {
      const fetchMock = makeMockFetch({
        status: 500,
        statusText: "Internal Server Error",
        rawText: "database offline",
      });
      const client = new SpikeChatClient({ fetch: fetchMock });

      await expect(client.postMessage("ch", "msg")).rejects.toThrow("database offline");
    });
  });

  describe("subscribe", () => {
    it("returns a no-op handle when WebSocket is not available (Node.js environment)", () => {
      // In Node.js test environment, WebSocket is not defined globally
      const client = new SpikeChatClient({ fetch: makeMockFetch() });

      const handle = client.subscribe({
        channelId: "general",
        userId: "user-1",
        onEvent: vi.fn(),
      });

      expect(handle).toBeDefined();
      expect(typeof handle.close).toBe("function");
      // close() should not throw
      expect(() => handle.close()).not.toThrow();
    });

    it("subscribe no-op returns undefined from close()", () => {
      const client = new SpikeChatClient({ fetch: makeMockFetch() });
      const handle = client.subscribe({
        channelId: "general",
        userId: "u1",
        onEvent: vi.fn(),
      });

      const result = handle.close();
      // The no-op close returns undefined (as defined in source)
      expect(result).toBeUndefined();
    });
  });
});
