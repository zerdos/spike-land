/**
 * Tests for the D1 StorageAdapter (Cloudflare Workers target).
 *
 * Since the real D1/KV/R2 runtime isn't available in Node, all CF bindings
 * are mocked. The goal is to verify the adapter wires calls correctly and
 * handles edge cases (missing KV/R2 options, delete-always-returns-true, etc.).
 */

import { describe, expect, it, vi } from "vitest";
import { d1Adapter } from "../../src/core/block-sdk/core-logic/d1.js";
import type { D1Database, KVNamespace, R2Bucket } from "../../src/core/block-sdk/core-logic/d1.js";

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeD1(): D1Database {
  const allRows: Record<string, unknown>[] = [];

  const stmt = {
    _query: "",
    _params: [] as unknown[],
    bind(...values: unknown[]) {
      this._params = values;
      return this;
    },
    async all<T = Record<string, unknown>>() {
      return {
        results: allRows as T[],
        success: true,
        meta: { changes: 0, last_row_id: 0, rows_read: allRows.length, rows_written: 0 },
      };
    },
    async run() {
      return {
        results: [],
        success: true,
        meta: { changes: 1, last_row_id: 0, rows_read: 0, rows_written: 1 },
      };
    },
    async first<T = Record<string, unknown>>() {
      return (allRows[0] as T) ?? null;
    },
  };

  return {
    prepare(query: string) {
      stmt._query = query;
      stmt._params = [];
      return stmt;
    },
    async batch(statements) {
      return statements.map(() => ({
        results: [],
        success: true,
        meta: { changes: 1, last_row_id: 0, rows_read: 0, rows_written: 1 },
      }));
    },
    async exec(_query: string) {
      return { count: 0, duration: 0 };
    },
  };
}

function makeKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      store.delete(key);
    },
    async list(options?: { prefix?: string }) {
      const prefix = options?.prefix;
      const keys = [...store.keys()]
        .filter((k) => !prefix || k.startsWith(prefix))
        .map((name) => ({ name }));
      return { keys };
    },
  };
}

function makeR2(): R2Bucket {
  const store = new Map<string, ArrayBuffer>();
  return {
    async put(key: string, value: ArrayBuffer | ReadableStream) {
      if (value instanceof ArrayBuffer) {
        store.set(key, value);
      } else {
        // ReadableStream — collect
        const reader = (value as ReadableStream).getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;
          if (result.value) chunks.push(result.value as Uint8Array);
        }
        const total = chunks.reduce((n, c) => n + c.byteLength, 0);
        const buf = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          buf.set(chunk, offset);
          offset += chunk.byteLength;
        }
        store.set(key, buf.buffer);
      }
    },
    async get(key: string) {
      const buf = store.get(key);
      if (!buf) return null;
      return { arrayBuffer: async () => buf };
    },
    async delete(key: string | string[]) {
      if (Array.isArray(key)) {
        key.forEach((k) => store.delete(k));
      } else {
        store.delete(key);
      }
    },
    async list(options?: { prefix?: string }) {
      const prefix = options?.prefix;
      const objects = [...store.keys()]
        .filter((k) => !prefix || k.startsWith(prefix))
        .map((key) => ({ key }));
      return { objects };
    },
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("d1Adapter - KV fallback (no KVNamespace)", () => {
  it("returns null for missing key", async () => {
    const adapter = d1Adapter({ db: makeD1() });
    expect(await adapter.kv.get("missing")).toBeNull();
  });

  it("puts and gets a JSON value", async () => {
    const adapter = d1Adapter({ db: makeD1() });
    await adapter.kv.put("user:1", { name: "Alice" });
    expect(await adapter.kv.get("user:1")).toEqual({ name: "Alice" });
  });

  it("overwrites existing key", async () => {
    const adapter = d1Adapter({ db: makeD1() });
    await adapter.kv.put("k", "v1");
    await adapter.kv.put("k", "v2");
    expect(await adapter.kv.get("k")).toBe("v2");
  });

  it("deletes a key and returns true", async () => {
    const adapter = d1Adapter({ db: makeD1() });
    await adapter.kv.put("k", "val");
    expect(await adapter.kv.delete("k")).toBe(true);
    expect(await adapter.kv.get("k")).toBeNull();
  });

  it("returns false when deleting non-existent key", async () => {
    const adapter = d1Adapter({ db: makeD1() });
    expect(await adapter.kv.delete("ghost")).toBe(false);
  });

  it("lists all entries without prefix", async () => {
    const adapter = d1Adapter({ db: makeD1() });
    await adapter.kv.put("a:1", 1);
    await adapter.kv.put("a:2", 2);
    await adapter.kv.put("b:1", 3);
    const all = await adapter.kv.list();
    expect(all).toHaveLength(3);
  });

  it("lists entries filtered by prefix", async () => {
    const adapter = d1Adapter({ db: makeD1() });
    await adapter.kv.put("user:alice", { role: "admin" });
    await adapter.kv.put("user:bob", { role: "viewer" });
    await adapter.kv.put("post:1", { title: "Hello" });
    const users = await adapter.kv.list("user:");
    expect(users).toHaveLength(2);
    expect(users.map((e) => e.key).sort()).toEqual(["user:alice", "user:bob"]);
  });
});

describe("d1Adapter - KV with real KVNamespace mock", () => {
  it("delegates put/get to KVNamespace", async () => {
    const kv = makeKV();
    const putSpy = vi.spyOn(kv, "put");

    const adapter = d1Adapter({ db: makeD1(), kv });
    await adapter.kv.put("session:1", { token: "abc" });

    expect(putSpy).toHaveBeenCalledOnce();

    const value = await adapter.kv.get<{ token: string }>("session:1");
    expect(value).toEqual({ token: "abc" });
  });

  it("delete always returns true (KV does not report existence)", async () => {
    const kv = makeKV();
    const adapter = d1Adapter({ db: makeD1(), kv });

    // Delete a non-existent key — D1 KV adapter always returns true
    expect(await adapter.kv.delete("nonexistent")).toBe(true);
  });

  it("list returns entries with deserialized values", async () => {
    const kv = makeKV();
    const adapter = d1Adapter({ db: makeD1(), kv });

    await adapter.kv.put("item:1", { name: "Foo" });
    await adapter.kv.put("item:2", { name: "Bar" });

    const all = await adapter.kv.list("item:");
    expect(all).toHaveLength(2);
    expect(all.find((e) => e.key === "item:1")?.value).toEqual({ name: "Foo" });
  });

  it("list returns null value when KV get returns null for a listed key", async () => {
    // Simulate a KV namespace where list() reports a key but get() returns null
    // (e.g. TTL expiry between list and get)
    const ghostKv: KVNamespace = {
      async get() {
        return null;
      },
      async put() {},
      async delete() {},
      async list() {
        return { keys: [{ name: "ghost:key" }] };
      },
    };

    const adapter = d1Adapter({ db: makeD1(), kv: ghostKv });
    const entries = await adapter.kv.list("ghost:");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({ key: "ghost:key", value: null });
  });
});

describe("d1Adapter - SQL", () => {
  it("executes SELECT queries via .all()", async () => {
    const db = makeD1();
    const prepareSpy = vi.spyOn(db, "prepare");

    const adapter = d1Adapter({ db });
    await adapter.sql.execute("SELECT * FROM tasks");

    expect(prepareSpy).toHaveBeenCalledWith("SELECT * FROM tasks");
  });

  it("executes WITH queries as SELECT path", async () => {
    const db = makeD1();
    const prepareSpy = vi.spyOn(db, "prepare");

    const adapter = d1Adapter({ db });
    await adapter.sql.execute("WITH cte AS (SELECT 1) SELECT * FROM cte");

    expect(prepareSpy).toHaveBeenCalledOnce();
  });

  it("executes non-SELECT queries via .run()", async () => {
    const db = makeD1();
    const adapter = d1Adapter({ db });
    const result = await adapter.sql.execute("INSERT INTO tasks (id) VALUES (?)", ["t1"]);
    expect(result.rowsAffected).toBe(1);
  });

  it("binds params when provided", async () => {
    const db = makeD1();
    const stmt = db.prepare("SELECT * FROM t WHERE id = ?");
    const bindSpy = vi.spyOn(stmt, "bind");
    vi.spyOn(db, "prepare").mockReturnValue(stmt);

    const adapter = d1Adapter({ db });
    await adapter.sql.execute("SELECT * FROM t WHERE id = ?", ["abc"]);

    expect(bindSpy).toHaveBeenCalledWith("abc");
  });

  it("batch executes multiple statements", async () => {
    const db = makeD1();
    const batchSpy = vi.spyOn(db, "batch");

    const adapter = d1Adapter({ db });
    const results = await adapter.sql.batch([
      { query: "INSERT INTO t (id) VALUES (?)", params: ["1"] },
      { query: "INSERT INTO t (id) VALUES (?)", params: ["2"] },
    ]);

    expect(batchSpy).toHaveBeenCalledOnce();
    expect(results).toHaveLength(2);
  });

  it("batch binds params for each statement", async () => {
    const db = makeD1();
    const adapter = d1Adapter({ db });

    // Query without params — should not call bind
    const results = await adapter.sql.batch([
      { query: "SELECT * FROM t" },
      { query: "DELETE FROM t WHERE id = ?", params: ["1"] },
    ]);
    expect(results).toHaveLength(2);
  });
});

describe("d1Adapter - blobs not present when R2 not provided", () => {
  it("blobs is undefined when no R2 bucket provided", () => {
    const adapter = d1Adapter({ db: makeD1() });
    expect(adapter.blobs).toBeUndefined();
  });
});

describe("d1Adapter - R2 blob adapter", () => {
  it("puts and gets ArrayBuffer", async () => {
    const r2 = makeR2();
    const adapter = d1Adapter({ db: makeD1(), r2 });

    const data = new TextEncoder().encode("hello r2").buffer as ArrayBuffer;
    const blobs = adapter.blobs as NonNullable<typeof adapter.blobs>;
    await blobs.put("file.txt", data);

    const result = await blobs.get("file.txt");
    expect(result).not.toBeNull();
    expect(new TextDecoder().decode(result as ArrayBuffer)).toBe("hello r2");
  });

  it("puts Uint8Array by slicing to ArrayBuffer", async () => {
    const r2 = makeR2();
    const adapter = d1Adapter({ db: makeD1(), r2 });

    const data = new Uint8Array([10, 20, 30, 40]);
    const blobs = adapter.blobs as NonNullable<typeof adapter.blobs>;
    await blobs.put("bytes.bin", data);

    const result = await blobs.get("bytes.bin");
    expect(new Uint8Array(result as ArrayBuffer)).toEqual(new Uint8Array([10, 20, 30, 40]));
  });

  it("returns null for missing blob", async () => {
    const r2 = makeR2();
    const adapter = d1Adapter({ db: makeD1(), r2 });
    const blobs = adapter.blobs as NonNullable<typeof adapter.blobs>;
    expect(await blobs.get("nope")).toBeNull();
  });

  it("delete always returns true", async () => {
    const r2 = makeR2();
    const adapter = d1Adapter({ db: makeD1(), r2 });
    // Delete non-existent key — R2 adapter always returns true
    const blobs = adapter.blobs as NonNullable<typeof adapter.blobs>;
    expect(await blobs.delete("ghost")).toBe(true);
  });

  it("lists blobs with prefix", async () => {
    const r2 = makeR2();
    const adapter = d1Adapter({ db: makeD1(), r2 });
    const blobs = adapter.blobs as NonNullable<typeof adapter.blobs>;

    await blobs.put("img/a.png", new Uint8Array([1]).buffer as ArrayBuffer);
    await blobs.put("img/b.png", new Uint8Array([2]).buffer as ArrayBuffer);
    await blobs.put("doc/c.pdf", new Uint8Array([3]).buffer as ArrayBuffer);

    const imgs = await blobs.list("img/");
    expect(imgs.sort()).toEqual(["img/a.png", "img/b.png"]);

    const all = await blobs.list();
    expect(all).toHaveLength(3);
  });

  it("puts ReadableStream by collecting chunks", async () => {
    const r2 = makeR2();
    const adapter = d1Adapter({ db: makeD1(), r2 });

    const text = "streamed into r2";
    const encoded = new TextEncoder().encode(text);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoded.slice(0, 8));
        controller.enqueue(encoded.slice(8));
        controller.close();
      },
    });

    const blobs = adapter.blobs as NonNullable<typeof adapter.blobs>;
    await blobs.put("stream.txt", stream as unknown as ArrayBuffer);
    const result = await blobs.get("stream.txt");
    expect(new TextDecoder().decode(result as ArrayBuffer)).toBe(text);
  });
});
