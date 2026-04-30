import { Hono } from "hono";
import { parsePositiveInt } from "@spike-land-ai/shared";
import type { Env } from "../../core-logic/env.js";
import { createRateLimiter } from "../../core-logic/in-memory-rate-limiter.js";
import { requireInternalSecret } from "../../core-logic/internal-auth.js";

const errors = new Hono<{ Bindings: Env }>();

const isRateLimited = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

const MAX_STRING = 1024;
/**
 * Hard caps for stored payloads. Anything larger than the cap is reduced via
 * the head+tail strategy so the most diagnostic parts (top of the trace and
 * the deepest frames / final metadata fields) survive while still bounding
 * how much D1 row space a single error consumes.
 *
 * Raised from 8 KB / 4 KB (BUG-S6-17) to 64 KB / 32 KB.
 */
const MAX_STACK = 65_536; // 64 KB
const MAX_METADATA = 32_768; // 32 KB
/** Head/tail slices kept when a payload exceeds the cap. */
const STACK_HEAD_BYTES = 8_192;
const STACK_TAIL_BYTES = 4_096;
const METADATA_HEAD_BYTES = 8_192;
const METADATA_TAIL_BYTES = 4_096;
const MAX_BATCH = 50;

type TruncationStrategy = "none" | "head_tail";

interface ErrorLogEntry {
  service_name: string;
  error_code?: string;
  message: string;
  stack_trace?: string;
  metadata?: unknown;
  severity?: string;
}

interface IngestionOutcome {
  truncated: boolean;
  stack_truncated: boolean;
  metadata_truncated: boolean;
  original_stack_bytes: number;
  original_metadata_bytes: number;
  stored_stack_bytes: number;
  stored_metadata_bytes: number;
  truncation_strategy: TruncationStrategy;
}

function isValidErrorLog(e: unknown): e is ErrorLogEntry {
  if (typeof e !== "object" || e === null) return false;
  const obj = e as Record<string, unknown>;
  return (
    typeof obj["service_name"] === "string" &&
    obj["service_name"].length <= MAX_STRING &&
    typeof obj["message"] === "string" &&
    obj["message"].length <= MAX_STRING &&
    (obj["error_code"] === undefined ||
      (typeof obj["error_code"] === "string" && obj["error_code"].length <= MAX_STRING)) &&
    (obj["stack_trace"] === undefined || typeof obj["stack_trace"] === "string")
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

/**
 * Reduce an oversize payload by keeping the head and the tail, joined by a
 * machine-parseable marker that records the elided byte count. Preserves the
 * most diagnostic parts of a stack trace (top frames + deepest frames) and of
 * metadata (first/last fields after JSON.stringify).
 */
export function applyHeadTail(
  value: string,
  cap: number,
  headBytes: number,
  tailBytes: number,
): string {
  if (value.length <= cap) return value;
  const elided = value.length - headBytes - tailBytes;
  const marker = `\n…[truncated ${elided} bytes]…\n`;
  return value.slice(0, headBytes) + marker + value.slice(value.length - tailBytes);
}

const VALID_SEVERITIES = new Set(["warning", "error", "fatal"]);

interface PreparedRecord {
  service_name: string;
  error_code: string | null;
  message: string;
  stack_trace: string | null;
  metadata: string | null;
  severity: string;
  outcome: IngestionOutcome;
}

export function prepareRecord(e: ErrorLogEntry): PreparedRecord {
  const stackOriginal = e.stack_trace ?? "";
  const metadataOriginal =
    e.metadata !== undefined && e.metadata !== null ? JSON.stringify(e.metadata) : "";

  const stackBytes = stackOriginal.length;
  const metadataBytes = metadataOriginal.length;

  const storedStack = e.stack_trace
    ? applyHeadTail(stackOriginal, MAX_STACK, STACK_HEAD_BYTES, STACK_TAIL_BYTES)
    : null;
  const storedMetadata =
    metadataOriginal.length > 0
      ? applyHeadTail(metadataOriginal, MAX_METADATA, METADATA_HEAD_BYTES, METADATA_TAIL_BYTES)
      : null;

  const stackTruncated = storedStack !== null && storedStack.length !== stackBytes;
  const metadataTruncated = storedMetadata !== null && storedMetadata.length !== metadataBytes;
  const truncated = stackTruncated || metadataTruncated;

  return {
    service_name: truncate(e.service_name, MAX_STRING),
    error_code: e.error_code ? truncate(e.error_code, MAX_STRING) : null,
    message: truncate(e.message, MAX_STRING),
    stack_trace: storedStack,
    metadata: storedMetadata,
    severity: VALID_SEVERITIES.has(e.severity ?? "") ? (e.severity as string) : "error",
    outcome: {
      truncated,
      stack_truncated: stackTruncated,
      metadata_truncated: metadataTruncated,
      original_stack_bytes: stackBytes,
      original_metadata_bytes: metadataBytes,
      stored_stack_bytes: storedStack?.length ?? 0,
      stored_metadata_bytes: storedMetadata?.length ?? 0,
      truncation_strategy: truncated ? "head_tail" : "none",
    },
  };
}

/** POST /errors/ingest — batch insert error logs from any service. */
errors.post("/errors/ingest", async (c) => {
  const clientIp = c.req.header("cf-connecting-ip") ?? "unknown";
  if (isRateLimited(clientIp)) {
    return c.json({ error: "Rate limited", retryAfter: 60 }, 429);
  }

  const body = await c.req.json<unknown>();
  if (!Array.isArray(body)) {
    return c.json({ error: "Request body must be an array of error logs" }, 400);
  }

  if (body.length > MAX_BATCH) {
    return c.json({ error: `Batch size exceeds maximum of ${MAX_BATCH}` }, 400);
  }

  const entries = body.filter(isValidErrorLog);
  if (entries.length === 0) {
    return c.json({ error: "No valid error logs in batch" }, 400);
  }

  const stmt = c.env.DB.prepare(
    "INSERT INTO error_logs (service_name, error_code, message, stack_trace, metadata, client_id, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );

  const prepared = entries.map(prepareRecord);
  const batch = prepared.map((p) =>
    stmt.bind(
      p.service_name,
      p.error_code,
      p.message,
      p.stack_trace,
      p.metadata,
      clientIp,
      p.severity,
    ),
  );

  const work = c.env.DB.batch(batch);
  try {
    c.executionCtx.waitUntil(work);
  } catch {
    await work;
  }

  const truncations = prepared.map((p) => p.outcome);
  const truncatedCount = truncations.filter((o) => o.truncated).length;

  return c.json({
    accepted: entries.length,
    truncated: truncatedCount,
    limits: {
      max_stack_bytes: MAX_STACK,
      max_metadata_bytes: MAX_METADATA,
      head_tail_strategy: {
        stack_head_bytes: STACK_HEAD_BYTES,
        stack_tail_bytes: STACK_TAIL_BYTES,
        metadata_head_bytes: METADATA_HEAD_BYTES,
        metadata_tail_bytes: METADATA_TAIL_BYTES,
      },
    },
    truncations,
  });
});

/** GET /errors — list recent errors (internal/admin). */
errors.get("/errors", async (c) => {
  if (!requireInternalSecret(c.env, c.req)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const service = c.req.query("service");
  const limit = parsePositiveInt(c.req.query("limit"), 50, 200);
  const range = c.req.query("range") ?? "24h";

  const rangeMs: Record<string, number> = {
    "1h": 3_600_000,
    "24h": 86_400_000,
    "7d": 604_800_000,
  };
  const cutoff = Date.now() - (rangeMs[range] ?? 86_400_000);

  let query = "SELECT * FROM error_logs WHERE created_at >= ?";
  const params: (string | number)[] = [cutoff];

  if (service) {
    query += " AND service_name = ?";
    params.push(service);
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all();
  return c.json(result.results);
});

/** GET /errors/summary — aggregated error stats for cockpit dashboard. */
errors.get("/errors/summary", async (c) => {
  if (!requireInternalSecret(c.env, c.req)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const range = c.req.query("range") ?? "24h";
  const rangeMs: Record<string, number> = {
    "1h": 3_600_000,
    "24h": 86_400_000,
    "7d": 604_800_000,
  };
  const cutoff = Date.now() - (rangeMs[range] ?? 86_400_000);

  const [countResult, topCodes] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) as total FROM error_logs WHERE created_at >= ?")
      .bind(cutoff)
      .first<{ total: number }>(),
    c.env.DB.prepare(
      "SELECT error_code, COUNT(*) as count FROM error_logs WHERE created_at >= ? GROUP BY error_code ORDER BY count DESC LIMIT 5",
    )
      .bind(cutoff)
      .all<{ error_code: string; count: number }>(),
  ]);

  return c.json({
    total: countResult?.total ?? 0,
    topCodes: topCodes.results ?? [],
    range,
  });
});

export { errors };
