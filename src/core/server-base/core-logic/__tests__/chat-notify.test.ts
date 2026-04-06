import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

function makeMockFetch(opts: { ok?: boolean; status?: number; body?: unknown } = {}) {
  const { ok = true, status = 200, body = { id: "msg-1", channelId: "mcp-events" } } = opts;
  const capturedRequests: CapturedRequest[] = [];

  const fetchFn = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    const headers = (init?.headers as Record<string, string>) ?? {};
    const rawBody = init?.body as string | undefined;
    const parsedBody = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    capturedRequests.push({
      url: String(url),
      method: String(init?.method ?? "GET"),
      headers,
      body: parsedBody,
    });

    return {
      ok,
      status,
      statusText: ok ? "OK" : "Error",
      text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    } as unknown as Response;
  });

  return { fetchFn, capturedRequests };
}

// ---------------------------------------------------------------------------
// Re-import helpers
//
// The chat-notify module uses module-level singletons that persist between
// test runs.  We use vi.resetModules() + dynamic import inside each test to
// get a clean slate.
// ---------------------------------------------------------------------------

type ChatNotifyModule = typeof import("../chat-notify.js");

async function freshModule(): Promise<ChatNotifyModule> {
  vi.resetModules();
  return import("../chat-notify.js");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("chatNotify", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns null when initChatNotify has not been called", async () => {
    const { chatNotify } = await freshModule();

    const result = await chatNotify("hello world");

    expect(result).toBeNull();
  });

  it("posts to default channel 'mcp-events' when no channel specified", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, chatNotify } = await freshModule();

    initChatNotify({ fetch: fetchFn });
    await chatNotify("test message");

    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0].body.channelId).toBe("mcp-events");
  });

  it("uses custom defaultChannel from config", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, chatNotify } = await freshModule();

    initChatNotify({ fetch: fetchFn, defaultChannel: "my-custom-channel" });
    await chatNotify("msg");

    expect(capturedRequests[0].body.channelId).toBe("my-custom-channel");
  });

  it("uses channel from opts over config default", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, chatNotify } = await freshModule();

    initChatNotify({ fetch: fetchFn, defaultChannel: "config-channel" });
    await chatNotify("msg", { channel: "override-channel" });

    expect(capturedRequests[0].body.channelId).toBe("override-channel");
  });

  it("prepends [serverName] tag to message content", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, chatNotify } = await freshModule();

    initChatNotify({ fetch: fetchFn, serverName: "my-mcp" });
    await chatNotify("something happened");

    expect(capturedRequests[0].body.content).toBe("[my-mcp] something happened");
  });

  it("does not prepend tag when serverName is not set", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, chatNotify } = await freshModule();

    initChatNotify({ fetch: fetchFn });
    await chatNotify("plain message");

    expect(capturedRequests[0].body.content).toBe("plain message");
  });

  it("swallows errors and returns null when silent=true (default)", async () => {
    const errorFetch = vi.fn().mockRejectedValue(new Error("network failure"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { initChatNotify, chatNotify } = await freshModule();

    initChatNotify({ fetch: errorFetch });
    const result = await chatNotify("msg");

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("swallows errors when silent is explicitly true", async () => {
    const errorFetch = vi.fn().mockRejectedValue(new Error("timeout"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { initChatNotify, chatNotify } = await freshModule();

    initChatNotify({ fetch: errorFetch, silent: true });
    const result = await chatNotify("msg");

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });

  it("re-throws errors when silent=false", async () => {
    const errorFetch = vi.fn().mockRejectedValue(new Error("boom"));
    const { initChatNotify, chatNotify } = await freshModule();

    initChatNotify({ fetch: errorFetch, silent: false });

    await expect(chatNotify("msg")).rejects.toThrow("boom");
  });

  it("sends contentType from opts when provided", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, chatNotify } = await freshModule();

    initChatNotify({ fetch: fetchFn });
    await chatNotify("update", { contentType: "app_updated" });

    expect(capturedRequests[0].body.contentType).toBe("app_updated");
  });

  it("defaults contentType to 'text' when not specified", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, chatNotify } = await freshModule();

    initChatNotify({ fetch: fetchFn });
    await chatNotify("plain");

    expect(capturedRequests[0].body.contentType).toBe("text");
  });
});

describe("notifyToolResult", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("posts 'ok <tool>: <detail>' on success with detail", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, notifyToolResult } = await freshModule();

    initChatNotify({ fetch: fetchFn });
    await notifyToolResult("my_tool", "success", "5 results");

    expect(capturedRequests[0].body.content).toBe("ok my_tool: 5 results");
  });

  it("posts 'ok <tool>' on success without detail", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, notifyToolResult } = await freshModule();

    initChatNotify({ fetch: fetchFn });
    await notifyToolResult("my_tool", "success");

    expect(capturedRequests[0].body.content).toBe("ok my_tool");
  });

  it("posts 'ERR <tool>: <detail>' on error with detail", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, notifyToolResult } = await freshModule();

    initChatNotify({ fetch: fetchFn });
    await notifyToolResult("my_tool", "error", "timeout");

    expect(capturedRequests[0].body.content).toBe("ERR my_tool: timeout");
  });

  it("posts 'ERR <tool>' on error without detail", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, notifyToolResult } = await freshModule();

    initChatNotify({ fetch: fetchFn });
    await notifyToolResult("my_tool", "error");

    expect(capturedRequests[0].body.content).toBe("ERR my_tool");
  });

  it("includes tool name and outcome in metadata", async () => {
    const { fetchFn, capturedRequests } = makeMockFetch();
    const { initChatNotify, notifyToolResult } = await freshModule();

    initChatNotify({ fetch: fetchFn });
    await notifyToolResult("search_hackernews", "success", "10 results");

    const metadata = capturedRequests[0].body.metadata as Record<string, unknown>;
    expect(metadata.tool).toBe("search_hackernews");
    expect(metadata.outcome).toBe("success");
  });

  it("returns null when initChatNotify has not been called", async () => {
    const { notifyToolResult } = await freshModule();

    const result = await notifyToolResult("my_tool", "success");

    expect(result).toBeNull();
  });
});
