import { describe, expect, it, beforeEach } from "vitest";
import { sqliteAdapter } from "../../src/core/block-sdk/db/sqlite.js";
import type { StorageAdapter } from "../../src/core/block-sdk/core-logic/types-block-sdk.js";

describe("SQLite StorageAdapter", () => {
  let adapter: StorageAdapter;

  beforeEach(() => {
    adapter = sqliteAdapter(); // in-memory
  });

  describe("WAL mode", () => {
    it("should have WAL journal mode active for file-based databases", async () => {
      const os = await import("node:os");
      const path = await import("node:path");
      const fs = await import("node:fs");
      const dbPath = path.join(os.tmpdir(), `test-wal-${Date.now()}.db`);
      try {
        const fileAdapter = sqliteAdapter({ path: dbPath });
        const result = await fileAdapter.sql.execute<{ journal_mode: string }>(
          "PRAGMA journal_mode",
        );
        expect(result.rows[0]?.journal_mode).toBe("wal");
      } finally {
        // Clean up temp files
        for (const suffix of ["", "-wal", "-shm"]) {
          try {
            fs.unlinkSync(dbPath + suffix);
          } catch {}
        }
      }
    });

    it("should report memory journal mode for in-memory databases", async () => {
      const result = await adapter.sql.execute<{ journal_mode: string }>("PRAGMA journal_mode");
      expect(result.rows[0]?.journal_mode).toBe("memory");
    });
  });

  describe("KV adapter", () => {
    it("should return null for missing key", async () => {
      expect(await adapter.kv.get("missing")).toBeNull();
    });

    it("should put and get a value", async () => {
      await adapter.kv.put("key1", { hello: "world" });
      expect(await adapter.kv.get("key1")).toEqual({ hello: "world" });
    });

    it("should overwrite existing key", async () => {
      await adapter.kv.put("key1", "v1");
      await adapter.kv.put("key1", "v2");
      expect(await adapter.kv.get("key1")).toBe("v2");
    });

    it("should delete a key and return true", async () => {
      await adapter.kv.put("key1", "val");
      expect(await adapter.kv.delete("key1")).toBe(true);
      expect(await adapter.kv.get("key1")).toBeNull();
    });

    it("should return false when deleting non-existent key", async () => {
      expect(await adapter.kv.delete("nope")).toBe(false);
    });

    it("should list all keys", async () => {
      await adapter.kv.put("a:1", 1);
      await adapter.kv.put("a:2", 2);
      await adapter.kv.put("b:1", 3);
      const all = await adapter.kv.list();
      expect(all).toHaveLength(3);
    });

    it("should list keys with prefix", async () => {
      await adapter.kv.put("user:1", { name: "Alice" });
      await adapter.kv.put("user:2", { name: "Bob" });
      await adapter.kv.put("post:1", { title: "Hello" });
      const users = await adapter.kv.list("user:");
      expect(users).toHaveLength(2);
      expect(users.map((e) => e.key)).toEqual(["user:1", "user:2"]);
    });
  });

  describe("SQL adapter", () => {
    it("should execute CREATE TABLE and INSERT", async () => {
      await adapter.sql.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL)");
      const result = await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [
        1,
        "foo",
      ]);
      expect(result.rowsAffected).toBe(1);
    });

    it("should execute SELECT", async () => {
      await adapter.sql.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)");
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [1, "foo"]);
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [2, "bar"]);
      const result = await adapter.sql.execute<{ id: number; name: string }>("SELECT * FROM items");
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.name).toBe("foo");
    });

    it("should execute UPDATE", async () => {
      await adapter.sql.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)");
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [1, "foo"]);
      const result = await adapter.sql.execute("UPDATE items SET name = ? WHERE id = ?", [
        "bar",
        1,
      ]);
      expect(result.rowsAffected).toBe(1);
      const check = await adapter.sql.execute<{ name: string }>(
        "SELECT name FROM items WHERE id = ?",
        [1],
      );
      expect(check.rows[0]?.name).toBe("bar");
    });

    it("should execute DELETE", async () => {
      await adapter.sql.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)");
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [1, "foo"]);
      const result = await adapter.sql.execute("DELETE FROM items WHERE id = ?", [1]);
      expect(result.rowsAffected).toBe(1);
    });

    it("should support ORDER BY and LIMIT", async () => {
      await adapter.sql.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)");
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [1, "c"]);
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [2, "a"]);
      await adapter.sql.execute("INSERT INTO items (id, name) VALUES (?, ?)", [3, "b"]);

      const result = await adapter.sql.execute<{ name: string }>(
        "SELECT name FROM items ORDER BY name ASC LIMIT 2",
      );
      expect(result.rows.map((r) => r.name)).toEqual(["a", "b"]);
    });

    it("should enforce foreign key constraints", async () => {
      await adapter.sql.execute(
        "CREATE TABLE parents (id INTEGER PRIMARY KEY, name TEXT NOT NULL)",
      );
      await adapter.sql.execute(
        "CREATE TABLE children (id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL REFERENCES parents(id))",
      );

      await expect(
        adapter.sql.execute("INSERT INTO children (id, parent_id) VALUES (?, ?)", [1, 999]),
      ).rejects.toThrow();
    });

    it("should batch queries in a transaction", async () => {
      await adapter.sql.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)");

      const results = await adapter.sql.batch([
        { query: "INSERT INTO items (id, name) VALUES (?, ?)", params: [1, "a"] },
        { query: "INSERT INTO items (id, name) VALUES (?, ?)", params: [2, "b"] },
        { query: "SELECT * FROM items" },
      ]);

      expect(results).toHaveLength(3);
      expect(results[0]?.rowsAffected).toBe(1);
      expect(results[1]?.rowsAffected).toBe(1);
      expect(results[2]?.rows).toHaveLength(2);
    });

    it("should batch mix of SELECT and non-SELECT statements", async () => {
      await adapter.sql.execute("CREATE TABLE logs (id INTEGER PRIMARY KEY, msg TEXT)");

      // Mix: INSERT, SELECT, DELETE in one batch
      const results = await adapter.sql.batch([
        { query: "INSERT INTO logs (id, msg) VALUES (?, ?)", params: [1, "hello"] },
        { query: "INSERT INTO logs (id, msg) VALUES (?, ?)", params: [2, "world"] },
        { query: "SELECT * FROM logs ORDER BY id" },
        { query: "DELETE FROM logs WHERE id = ?", params: [1] },
      ]);

      expect(results).toHaveLength(4);
      expect(results[0]?.rowsAffected).toBe(1);
      expect(results[1]?.rowsAffected).toBe(1);
      expect(results[2]?.rows).toHaveLength(2);
      expect(results[3]?.rowsAffected).toBe(1);
    });

    it("should batch non-SELECT statement without params", async () => {
      await adapter.sql.execute("CREATE TABLE scratch (id INTEGER PRIMARY KEY, val TEXT)");
      await adapter.sql.execute("INSERT INTO scratch (id, val) VALUES (1, 'x')");
      await adapter.sql.execute("INSERT INTO scratch (id, val) VALUES (2, 'y')");

      // DELETE all rows — no params, non-SELECT path in batch
      const results = await adapter.sql.batch([{ query: "DELETE FROM scratch" }]);

      expect(results[0]?.rowsAffected).toBe(2);

      const remaining = await adapter.sql.execute("SELECT * FROM scratch");
      expect(remaining.rows).toHaveLength(0);
    });
  });

  describe("Blob adapter", () => {
    it("should return null for missing blob", async () => {
      expect(await adapter.blobs?.get("missing")).toBeNull();
    });

    it("should put and get ArrayBuffer", async () => {
      const data = new Uint8Array([1, 2, 3, 4]).buffer;
      await adapter.blobs?.put("blob1", data as ArrayBuffer);
      const result = await adapter.blobs?.get("blob1");
      expect(result).not.toBeNull();
      expect(new Uint8Array(result)).toEqual(new Uint8Array([1, 2, 3, 4]));
    });

    it("should put and get Uint8Array", async () => {
      const data = new Uint8Array([10, 20, 30]);
      await adapter.blobs?.put("blob2", data);
      const result = await adapter.blobs?.get("blob2");
      expect(new Uint8Array(result)).toEqual(new Uint8Array([10, 20, 30]));
    });

    it("should delete a blob and return true", async () => {
      await adapter.blobs?.put("blob1", new Uint8Array([1]));
      expect(await adapter.blobs?.delete("blob1")).toBe(true);
      expect(await adapter.blobs?.get("blob1")).toBeNull();
    });

    it("should return false when deleting non-existent blob", async () => {
      expect(await adapter.blobs?.delete("nope")).toBe(false);
    });

    it("should list blobs with prefix", async () => {
      await adapter.blobs?.put("img:1", new Uint8Array([1]));
      await adapter.blobs?.put("img:2", new Uint8Array([2]));
      await adapter.blobs?.put("doc:1", new Uint8Array([3]));

      const imgs = await adapter.blobs?.list("img:");
      expect(imgs).toEqual(["img:1", "img:2"]);

      const all = await adapter.blobs?.list();
      expect(all).toHaveLength(3);
    });

    it("should put and get ReadableStream blob", async () => {
      const text = "stream content for sqlite";
      const encoded = new TextEncoder().encode(text);

      // Build a ReadableStream with two chunks to exercise the chunk-accumulation loop
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoded.slice(0, 10));
          controller.enqueue(encoded.slice(10));
          controller.close();
        },
      });

      await adapter.blobs?.put("stream-blob", stream);
      const result = await adapter.blobs?.get("stream-blob");
      expect(result).not.toBeNull();
      expect(new TextDecoder().decode(result as ArrayBuffer)).toBe(text);
    });

    it("should overwrite existing blob key", async () => {
      await adapter.blobs?.put("key1", new Uint8Array([1, 2]));
      await adapter.blobs?.put("key1", new Uint8Array([9, 8, 7]));
      const result = await adapter.blobs?.get("key1");
      expect(new Uint8Array(result as ArrayBuffer)).toEqual(new Uint8Array([9, 8, 7]));
    });
  });

  describe("SQL - WITH CTE queries", () => {
    it("should execute WITH CTE queries via SELECT path", async () => {
      await adapter.sql.execute("CREATE TABLE numbers (n INTEGER PRIMARY KEY)");
      await adapter.sql.execute("INSERT INTO numbers (n) VALUES (?)", [1]);
      await adapter.sql.execute("INSERT INTO numbers (n) VALUES (?)", [2]);
      await adapter.sql.execute("INSERT INTO numbers (n) VALUES (?)", [3]);

      // WITH CTE queries start with "WITH" — should be treated as SELECT
      const result = await adapter.sql.execute<{ n: number }>(
        "WITH filtered AS (SELECT n FROM numbers WHERE n > 1) SELECT * FROM filtered",
      );
      expect(result.rows).toHaveLength(2);
      expect(result.rows.map((r) => r.n).sort()).toEqual([2, 3]);
    });
  });

  describe("SQL - PRAGMA queries", () => {
    it("should execute PRAGMA queries as SELECT path", async () => {
      const result = await adapter.sql.execute<{ foreign_keys: number }>("PRAGMA foreign_keys");
      expect(result.rows).toHaveLength(1);
      // foreign_keys is ON (1) due to sqliteAdapter setup
      expect(result.rows[0]?.foreign_keys).toBe(1);
    });
  });
});
