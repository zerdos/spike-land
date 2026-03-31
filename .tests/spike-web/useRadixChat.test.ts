/**
 * Tests for packages/spike-web/src/components/react/radix-chat/useRadixChat.ts
 *
 * Tests the pure utility functions inline (as behaviour specs) and exercises
 * the hook with mocked fetch and localStorage.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Inline re-implementations of the private pure utility functions.
// These are tested as pure-function specs.  If the utilities are ever
// extracted to their own module, replace the inline copies with imports.
// ---------------------------------------------------------------------------

type PipelineStage = "classify" | "plan" | "execute" | "extract" | "idle";

const VALID_STAGES: ReadonlySet<string> = new Set<PipelineStage>([
  "classify",
  "plan",
  "execute",
  "extract",
  "idle",
]);

function toPipelineStage(value: string | undefined): PipelineStage {
  return value !== undefined && VALID_STAGES.has(value) ? (value as PipelineStage) : "idle";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

interface LocationLike {
  hostname: string;
  origin: string;
}

function getBaseURLFrom(location: LocationLike): string {
  const { hostname } = location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8787";
  }
  if (hostname === "local.spike.land") {
    return "https://local.spike.land:8787";
  }
  if (
    hostname === "spike.land" ||
    hostname === "www.spike.land" ||
    hostname === "analytics.spike.land"
  ) {
    return location.origin;
  }
  return "https://spike.land";
}

interface RadixMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function loadStoredMessages(raw: string | null): RadixMessage[] {
  try {
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RadixMessage =>
        isObject(item) &&
        typeof item["id"] === "string" &&
        (item["role"] === "user" || item["role"] === "assistant"),
    );
  } catch {
    return [];
  }
}

let nextId = 0;
function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++nextId}`;
}

// ---------------------------------------------------------------------------
// toPipelineStage
// ---------------------------------------------------------------------------

describe("toPipelineStage", () => {
  it('returns "classify" for the string "classify"', () => {
    expect(toPipelineStage("classify")).toBe("classify");
  });

  it('returns "plan" for the string "plan"', () => {
    expect(toPipelineStage("plan")).toBe("plan");
  });

  it('returns "execute" for the string "execute"', () => {
    expect(toPipelineStage("execute")).toBe("execute");
  });

  it('returns "extract" for the string "extract"', () => {
    expect(toPipelineStage("extract")).toBe("extract");
  });

  it('returns "idle" for the string "idle"', () => {
    expect(toPipelineStage("idle")).toBe("idle");
  });

  it('returns "idle" for an unknown string', () => {
    expect(toPipelineStage("unknown-stage")).toBe("idle");
  });

  it('returns "idle" for an empty string', () => {
    expect(toPipelineStage("")).toBe("idle");
  });

  it('returns "idle" for undefined', () => {
    expect(toPipelineStage(undefined)).toBe("idle");
  });

  it('returns "idle" for a stage name with wrong casing', () => {
    expect(toPipelineStage("Classify")).toBe("idle");
    expect(toPipelineStage("EXECUTE")).toBe("idle");
  });
});

// ---------------------------------------------------------------------------
// isObject
// ---------------------------------------------------------------------------

describe("isObject", () => {
  it("returns true for a plain object", () => {
    expect(isObject({ key: "value" })).toBe(true);
  });

  it("returns true for an empty object", () => {
    expect(isObject({})).toBe(true);
  });

  it("returns true for an array (arrays are objects in JS)", () => {
    expect(isObject([])).toBe(true);
  });

  it("returns false for null", () => {
    expect(isObject(null)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isObject("hello")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isObject(42)).toBe(false);
  });

  it("returns false for a boolean", () => {
    expect(isObject(true)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isObject(undefined)).toBe(false);
  });

  it("returns false for a function", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(isObject(() => {})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getBaseURL
// ---------------------------------------------------------------------------

describe("getBaseURL", () => {
  it('returns "http://localhost:8787" for hostname "localhost"', () => {
    expect(getBaseURLFrom({ hostname: "localhost", origin: "http://localhost:3000" })).toBe(
      "http://localhost:8787",
    );
  });

  it('returns "http://localhost:8787" for hostname "127.0.0.1"', () => {
    expect(getBaseURLFrom({ hostname: "127.0.0.1", origin: "http://127.0.0.1:3000" })).toBe(
      "http://localhost:8787",
    );
  });

  it('returns "https://local.spike.land:8787" for hostname "local.spike.land"', () => {
    expect(
      getBaseURLFrom({ hostname: "local.spike.land", origin: "https://local.spike.land" }),
    ).toBe("https://local.spike.land:8787");
  });

  it("returns the origin for hostname spike.land", () => {
    expect(getBaseURLFrom({ hostname: "spike.land", origin: "https://spike.land" })).toBe(
      "https://spike.land",
    );
  });

  it("returns the origin for hostname www.spike.land", () => {
    expect(getBaseURLFrom({ hostname: "www.spike.land", origin: "https://www.spike.land" })).toBe(
      "https://www.spike.land",
    );
  });

  it("returns the origin for hostname analytics.spike.land", () => {
    expect(
      getBaseURLFrom({
        hostname: "analytics.spike.land",
        origin: "https://analytics.spike.land",
      }),
    ).toBe("https://analytics.spike.land");
  });

  it('returns "https://spike.land" for an unrecognised hostname', () => {
    expect(
      getBaseURLFrom({ hostname: "unknown.example.com", origin: "https://unknown.example.com" }),
    ).toBe("https://spike.land");
  });

  it('returns "https://spike.land" for an empty hostname', () => {
    expect(getBaseURLFrom({ hostname: "", origin: "" })).toBe("https://spike.land");
  });
});

// ---------------------------------------------------------------------------
// loadStoredMessages
// ---------------------------------------------------------------------------

describe("loadStoredMessages", () => {
  it("returns an empty array for null", () => {
    expect(loadStoredMessages(null)).toEqual([]);
  });

  it("returns an empty array for an empty string", () => {
    expect(loadStoredMessages("")).toEqual([]);
  });

  it("returns an empty array for invalid JSON", () => {
    expect(loadStoredMessages("{broken json")).toEqual([]);
  });

  it("returns an empty array when the JSON value is not an array", () => {
    expect(loadStoredMessages(JSON.stringify({ id: "1", role: "user" }))).toEqual([]);
    expect(loadStoredMessages(JSON.stringify("string value"))).toEqual([]);
    expect(loadStoredMessages(JSON.stringify(42))).toEqual([]);
  });

  it("returns an empty array for an empty JSON array", () => {
    expect(loadStoredMessages(JSON.stringify([]))).toEqual([]);
  });

  it("returns valid user messages", () => {
    const msgs: RadixMessage[] = [{ id: "1", role: "user", content: "hello", timestamp: 1000 }];
    expect(loadStoredMessages(JSON.stringify(msgs))).toEqual(msgs);
  });

  it("returns valid assistant messages", () => {
    const msgs: RadixMessage[] = [
      { id: "2", role: "assistant", content: "hi there", timestamp: 2000 },
    ];
    expect(loadStoredMessages(JSON.stringify(msgs))).toEqual(msgs);
  });

  it("filters out messages with an invalid role", () => {
    const raw = JSON.stringify([
      { id: "1", role: "user", content: "ok", timestamp: 1 },
      { id: "2", role: "system", content: "bad role", timestamp: 2 },
      { id: "3", role: "assistant", content: "also ok", timestamp: 3 },
    ]);
    const result = loadStoredMessages(raw);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.id)).toEqual(["1", "3"]);
  });

  it("filters out messages that are missing the id field", () => {
    const raw = JSON.stringify([
      { role: "user", content: "no id", timestamp: 1 },
      { id: "valid", role: "user", content: "has id", timestamp: 2 },
    ]);
    const result = loadStoredMessages(raw);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("valid");
  });

  it("filters out non-object array elements", () => {
    const raw = JSON.stringify([
      null,
      "a string",
      42,
      { id: "ok", role: "assistant", content: "real", timestamp: 1 },
    ]);
    const result = loadStoredMessages(raw);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("ok");
  });

  it("returns multiple valid messages in order", () => {
    const msgs: RadixMessage[] = [
      { id: "a", role: "user", content: "msg1", timestamp: 100 },
      { id: "b", role: "assistant", content: "msg2", timestamp: 200 },
      { id: "c", role: "user", content: "msg3", timestamp: 300 },
    ];
    expect(loadStoredMessages(JSON.stringify(msgs))).toEqual(msgs);
  });
});

// ---------------------------------------------------------------------------
// makeId
// ---------------------------------------------------------------------------

describe("makeId", () => {
  it("generates a string containing the prefix", () => {
    const id = makeId("radix");
    expect(id).toMatch(/^radix-/);
  });

  it("generates unique IDs on successive calls", () => {
    const ids = Array.from({ length: 10 }, () => makeId("test"));
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
  });

  it("incorporates a timestamp in the id", () => {
    const before = Date.now();
    const id = makeId("ts");
    const after = Date.now();
    const parts = id.split("-");
    const ts = Number(parts[1]);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("works with an empty string prefix", () => {
    const id = makeId("");
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// useRadixChat hook — integration tests
// ---------------------------------------------------------------------------

describe("useRadixChat hook", () => {
  let store: Record<string, string>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    store = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function importHook() {
    vi.resetModules();
    const mod = await import(
      "../../packages/spike-web/src/components/react/radix-chat/useRadixChat"
    );
    return mod.useRadixChat;
  }

  it("initialises with empty messages when localStorage is empty", async () => {
    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));
    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.currentStage).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("loads stored messages from localStorage on mount", async () => {
    const stored: RadixMessage[] = [
      { id: "msg-1", role: "user", content: "Hello", timestamp: Date.now() },
      { id: "msg-2", role: "assistant", content: "Hi!", timestamp: Date.now() },
    ];
    store["test-persona-chat-messages"] = JSON.stringify(stored);

    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]?.content).toBe("Hello");
  });

  it("filters out malformed messages from localStorage", async () => {
    const raw = JSON.stringify([
      { id: "msg-1", role: "user", content: "valid" },
      { broken: true },
      { id: "msg-3", role: "unknown", content: "bad role" },
      { id: "msg-4", role: "assistant", content: "valid2" },
    ]);
    store["test-persona-chat-messages"] = raw;

    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));
    expect(result.current.messages).toHaveLength(2);
  });

  it("returns empty array for invalid JSON in localStorage", async () => {
    store["test-persona-chat-messages"] = "not valid json{{{";

    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));
    expect(result.current.messages).toEqual([]);
  });

  it("does not send empty messages", async () => {
    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));
    await act(async () => {
      await result.current.sendMessage("");
    });
    expect(result.current.messages).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("does not send whitespace-only messages", async () => {
    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));
    await act(async () => {
      await result.current.sendMessage("   \n  ");
    });
    expect(result.current.messages).toEqual([]);
  });

  it("sends a message and processes SSE text_delta events", async () => {
    const sseData = [
      'data: {"type":"stage_update","stage":"classify"}\n',
      'data: {"type":"text_delta","text":"Hello "}\n',
      'data: {"type":"text_delta","text":"world"}\n',
      "data: [DONE]\n",
    ].join("\n");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseData));
        controller.close();
      },
    });

    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true, body: stream } as Response);

    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));

    await act(async () => {
      await result.current.sendMessage("Hi there");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]?.role).toBe("user");
    expect(result.current.messages[0]?.content).toBe("Hi there");
    expect(result.current.messages[1]?.role).toBe("assistant");
    expect(result.current.messages[1]?.content).toBe("Hello world");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.currentStage).toBe("idle");
  });

  it("sets error state when SSE emits an error event", async () => {
    const sseData = 'data: {"type":"error","error":"Rate limited"}\n\n';
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseData));
        controller.close();
      },
    });

    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true, body: stream } as Response);

    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));

    await act(async () => {
      await result.current.sendMessage("test");
    });

    expect(result.current.error).toBe("Rate limited");
  });

  it("sets error state when the HTTP response is not ok", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    } as unknown as Response);

    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));

    await act(async () => {
      await result.current.sendMessage("test");
    });

    expect(result.current.error).toBe("Internal Server Error");
    expect(result.current.messages[1]?.content).toBe(
      "Sorry, something went wrong. Please try again.",
    );
  });

  it("clearError resets the error state to null", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("error"),
    } as unknown as Response);

    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));

    await act(async () => {
      await result.current.sendMessage("test");
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("clearMessages removes all messages and removes the localStorage key", async () => {
    const stored: RadixMessage[] = [
      { id: "msg-1", role: "user", content: "Hello", timestamp: Date.now() },
    ];
    store["test-persona-chat-messages"] = JSON.stringify(stored);

    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));
    expect(result.current.messages).toHaveLength(1);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
    expect(localStorage.removeItem).toHaveBeenCalledWith("test-persona-chat-messages");
  });

  it("skips malformed SSE data gracefully and processes valid lines", async () => {
    const sseData = [
      "data: not-valid-json\n",
      'data: {"type":"text_delta","text":"works"}\n',
      "data: [DONE]\n",
    ].join("\n");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseData));
        controller.close();
      },
    });

    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true, body: stream } as Response);

    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test-persona"));

    await act(async () => {
      await result.current.sendMessage("test");
    });

    expect(result.current.messages[1]?.content).toBe("works");
  });

  it("uses the persona-scoped storage key for localStorage reads", async () => {
    const useRadixChat = await importHook();

    renderHook(() => useRadixChat("arnold"));
    expect(localStorage.getItem).toHaveBeenCalledWith("arnold-chat-messages");

    renderHook(() => useRadixChat("erdos"));
    expect(localStorage.getItem).toHaveBeenCalledWith("erdos-chat-messages");
  });

  it("calls fetch with /api/spike-chat in the URL", async () => {
    const sseData = "data: [DONE]\n\n";
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseData));
        controller.close();
      },
    });

    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true, body: stream } as Response);

    const useRadixChat = await importHook();
    const { result } = renderHook(() => useRadixChat("test"));

    await act(async () => {
      await result.current.sendMessage("hello");
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/spike-chat"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
