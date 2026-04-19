import { describe, expect, it, vi } from "vitest";

import { connections } from "../api/routes/connections";

type Row = Record<string, unknown>;

interface FakeDb {
  // Ordered script of per-statement results, consumed FIFO per `prepare()` call.
  script: Array<
    | { kind: "first"; value: Row | null }
    | { kind: "run"; changes?: number }
    | { kind: "all"; rows: Row[] }
  >;
  calls: Array<{ sql: string; binds: unknown[] }>;
}

function makeEnv(db: FakeDb): { DB: unknown } {
  return {
    DB: {
      prepare(sql: string) {
        const binds: unknown[] = [];
        const api = {
          bind(...args: unknown[]) {
            binds.push(...args);
            return api;
          },
          async first() {
            db.calls.push({ sql, binds: [...binds] });
            const step = db.script.shift();
            if (!step || step.kind !== "first") {
              throw new Error(
                "unexpected first() call — next scripted step is " + (step?.kind ?? "none"),
              );
            }
            return step.value;
          },
          async run() {
            db.calls.push({ sql, binds: [...binds] });
            const step = db.script.shift();
            if (!step || step.kind !== "run") {
              throw new Error(
                "unexpected run() call — next scripted step is " + (step?.kind ?? "none"),
              );
            }
            return { meta: { changes: step.changes ?? 1 } };
          },
          async all() {
            db.calls.push({ sql, binds: [...binds] });
            const step = db.script.shift();
            if (!step || step.kind !== "all") {
              throw new Error(
                "unexpected all() call — next scripted step is " + (step?.kind ?? "none"),
              );
            }
            return { results: step.rows };
          },
        };
        return api;
      },
    },
  };
}

function req(path: string, init?: RequestInit) {
  return new Request("http://x" + path, init);
}

describe("connections route", () => {
  it("GET lists connections for a project", async () => {
    const db: FakeDb = {
      script: [{ kind: "all", rows: [{ id: "c1" }, { id: "c2" }] }],
      calls: [],
    };
    const res = await connections.fetch(
      req("/api/projects/p1/connections"),
      makeEnv(db) as never,
      {} as never,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { connections: Row[] };
    expect(body.connections).toHaveLength(2);
    expect(db.calls[0]!.binds).toEqual(["p1"]);
  });

  it("POST creates a connection (dedups existing + inserts)", async () => {
    const uuid = "00000000-0000-0000-0000-000000000abc";
    vi.stubGlobal("crypto", { ...globalThis.crypto, randomUUID: () => uuid });

    const db: FakeDb = {
      script: [
        { kind: "first", value: { id: "p1" } }, // project lookup
        { kind: "run", changes: 0 }, // dedupe delete
        { kind: "run", changes: 1 }, // insert
      ],
      calls: [],
    };

    const res = await connections.fetch(
      req("/api/projects/p1/connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source_note_id: "n1",
          target_note_id: "n2",
          relationship: "supports",
          strength: 0.8,
        }),
      }),
      makeEnv(db) as never,
      {} as never,
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.id).toBe(uuid);
    expect(body.source_note_id).toBe("n1");
    expect(body.target_note_id).toBe("n2");
    expect(body.relationship).toBe("supports");
    expect(body.strength).toBe(0.8);

    // Dedupe call checks both directions
    expect(db.calls[1]!.binds).toEqual(["p1", "n1", "n2", "n2", "n1"]);
    vi.unstubAllGlobals();
  });

  it("POST rejects self-loops with 400", async () => {
    const db: FakeDb = { script: [], calls: [] };
    const res = await connections.fetch(
      req("/api/projects/p1/connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source_note_id: "n1", target_note_id: "n1" }),
      }),
      makeEnv(db) as never,
      {} as never,
    );
    expect(res.status).toBe(400);
    expect(db.calls).toHaveLength(0);
  });

  it("POST returns 400 when ids are missing", async () => {
    const db: FakeDb = { script: [], calls: [] };
    const res = await connections.fetch(
      req("/api/projects/p1/connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source_note_id: "n1" }),
      }),
      makeEnv(db) as never,
      {} as never,
    );
    expect(res.status).toBe(400);
  });

  it("POST returns 404 when project does not exist", async () => {
    const db: FakeDb = {
      script: [{ kind: "first", value: null }],
      calls: [],
    };
    const res = await connections.fetch(
      req("/api/projects/missing/connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source_note_id: "n1", target_note_id: "n2" }),
      }),
      makeEnv(db) as never,
      {} as never,
    );
    expect(res.status).toBe(404);
  });

  it("DELETE removes a connection", async () => {
    const db: FakeDb = {
      script: [{ kind: "run", changes: 1 }],
      calls: [],
    };
    const res = await connections.fetch(
      req("/api/connections/c1", { method: "DELETE" }),
      makeEnv(db) as never,
      {} as never,
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { deleted: boolean }).deleted).toBe(true);
    expect(db.calls[0]!.binds).toEqual(["c1"]);
  });

  it("DELETE returns 404 when nothing was deleted", async () => {
    const db: FakeDb = {
      script: [{ kind: "run", changes: 0 }],
      calls: [],
    };
    const res = await connections.fetch(
      req("/api/connections/missing", { method: "DELETE" }),
      makeEnv(db) as never,
      {} as never,
    );
    expect(res.status).toBe(404);
  });
});
