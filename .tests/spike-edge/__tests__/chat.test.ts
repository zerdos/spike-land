import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { chat } from "../../../src/edge-api/main/api/routes/chat.js";
import { resetToolCatalogCache } from "../../../src/edge-api/main/core-logic/mcp-tools.js";
import type { Env } from "../../../src/edge-api/main/core-logic/env.js";

/** Minimal D1Database stub — every prepare() returns a chainable mock. */
function makeDb(
  options: {
    rounds?: Array<{
      id: string;
      thread_id: string;
      input_role: string;
      input_content: string;
      assistant_blocks: string;
      assistant_text: string;
      prompt_tokens: null;
      completion_tokens: null;
      total_tokens: null;
      created_at: number;
      updated_at: number;
    }>;
  } = {},
): Env["DB"] {
  const rounds = options.rounds ?? [];
  const stub = {
    prepare: vi.fn().mockImplementation(() => ({
      bind: vi.fn().mockImplementation(function (this: unknown) {
        return this;
      }),
      run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
      all: vi.fn().mockResolvedValue({ results: rounds }),
      first: vi.fn().mockResolvedValue({
        id: "thread-1",
        user_id: "user-1",
        title: "test",
        last_prompt_tokens: null,
        last_completion_tokens: null,
        last_total_tokens: null,
        created_at: 1000,
        updated_at: 1000,
      }),
    })),
  };
  return stub as unknown as Env["DB"];
}

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    R2: {} as Env["R2"],
    SPA_ASSETS: {} as Env["SPA_ASSETS"],
    DB: makeDb(),
    LIMITERS: {} as Env["LIMITERS"],
    AUTH_MCP: {} as Env["AUTH_MCP"],
    MCP_SERVICE: {
      fetch: vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ tools: [] }), { status: 200 })),
    } as unknown as Env["MCP_SERVICE"],
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    GEMINI_API_KEY: "",
    CLAUDE_OAUTH_TOKEN: "test-api-key",
    GITHUB_TOKEN: "",
    ALLOWED_ORIGINS: "",
    GA_API_SECRET: "",
    GA_MEASUREMENT_ID: "",
    INTERNAL_SERVICE_SECRET: "",
    WHATSAPP_APP_SECRET: "",
    WHATSAPP_ACCESS_TOKEN: "",
    WHATSAPP_PHONE_NUMBER_ID: "",
    WHATSAPP_VERIFY_TOKEN: "",
    MCP_INTERNAL_SECRET: "",
    ANALYTICS: {} as Env["ANALYTICS"],
    ...overrides,
  } as unknown as Env;
}

afterEach(() => {
  vi.restoreAllMocks();
  resetToolCatalogCache();
});

function makeExecCtx() {
  const promises: Promise<unknown>[] = [];
  return {
    ctx: {
      waitUntil: (p: Promise<unknown>) => {
        promises.push(p);
      },
      passThroughOnException: () => {},
    } as unknown as ExecutionContext,
    flush: () => Promise.allSettled(promises),
  };
}

function makeApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", async (c, next) => {
    c.set("requestId" as never, "test-request-id" as never);
    return next();
  });
  app.route("/", chat);
  return app;
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  let env: Env;

  beforeEach(() => {
    env = makeEnv();
    vi.restoreAllMocks();
  });

  it("returns 400 when message is missing", async () => {
    const app = makeApp();
    const { ctx } = makeExecCtx();
    const res = await app.fetch(makeRequest({}), env, ctx);
    expect(res.status).toBe(400);
    const data = await res.json<{ error: string }>();
    expect(data.error).toBe("message is required");
  });

  it("returns 400 when message is not a string", async () => {
    const app = makeApp();
    const { ctx } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: 123 }), env, ctx);
    expect(res.status).toBe(400);
  });

  it("returns 400 when message is empty string", async () => {
    const app = makeApp();
    const { ctx } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: "" }), env, ctx);
    expect(res.status).toBe(400);
  });

  it("returns SSE content-type headers on valid request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        [
          'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
          'data: {"type":"content_block_stop","index":0}',
          'data: {"type":"message_stop"}',
          "",
        ].join("\n"),
        { status: 200 },
      ),
    );

    const app = makeApp();
    const { ctx, flush } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: "Hello" }), env, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.headers.get("X-Request-Id")).toBe("test-request-id");

    await res.text();
    await flush();
  });

  it("streams text_delta events", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        [
          'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
          'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi "}}',
          'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"there"}}',
          'data: {"type":"content_block_stop","index":0}',
          'data: {"type":"message_stop"}',
          "",
        ].join("\n"),
        { status: 200 },
      ),
    );

    const app = makeApp();
    const { ctx, flush } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: "Hello" }), env, ctx);
    const body = await res.text();
    await flush();

    expect(body).toContain('"type":"text_delta"');
    expect(body).toContain('"text":"Hi "');
    expect(body).toContain('"text":"there"');
    expect(body).toContain("data: [DONE]");
  });

  it("calls MCP_SERVICE to fetch tools", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        [
          'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
          'data: {"type":"content_block_stop","index":0}',
          'data: {"type":"message_stop"}',
          "",
        ].join("\n"),
        { status: 200 },
      ),
    );

    const app = makeApp();
    const { ctx, flush } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: "Hello" }), env, ctx);
    await res.text();
    await flush();

    expect(env.MCP_SERVICE.fetch).toHaveBeenCalledTimes(1);
  });

  it("sends error event when Anthropic returns non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Bad Request", { status: 400 }),
    );

    const app = makeApp();
    const { ctx, flush } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: "Hello" }), env, ctx);
    const body = await res.text();
    await flush();

    expect(body).toContain('"type":"error"');
    expect(body).toContain("Anthropic API error: 400");
  });

  it("passes history in Anthropic request", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          [
            'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
            'data: {"type":"content_block_stop","index":0}',
            'data: {"type":"message_stop"}',
            "",
          ].join("\n"),
          { status: 200 },
        ),
      );

    // Seed the DB with a prior round so the route includes history in its context.
    const priorRound = {
      id: "round-1",
      thread_id: "thread-1",
      input_role: "user",
      input_content: "Hello",
      assistant_blocks: JSON.stringify([{ type: "text", text: "Hi there!" }]),
      assistant_text: "Hi there!",
      prompt_tokens: null,
      completion_tokens: null,
      total_tokens: null,
      created_at: 1000,
      updated_at: 1000,
    };
    env = makeEnv({ DB: makeDb({ rounds: [priorRound] }) });

    const app = makeApp();
    const { ctx, flush } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: "What did I say?" }), env, ctx);
    await res.text();
    await flush();

    // fetchSpy was called for the Anthropic API with the current message included.
    expect(fetchSpy).toHaveBeenCalled();
    const anthropicCall = fetchSpy.mock.calls[0];
    const anthropicBody = JSON.parse(anthropicCall[1]?.body as string) as {
      messages: Array<{ role: string; content: unknown }>;
    };
    // The current user message must appear in the messages sent to Anthropic.
    const lastMessage = anthropicBody.messages[anthropicBody.messages.length - 1];
    expect(lastMessage?.role).toBe("user");
    const lastContent =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage?.content);
    expect(lastContent).toContain("What did I say?");
  });
});
