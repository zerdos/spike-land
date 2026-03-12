import { type DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../db/schema";

function generateId(): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(21));
  for (const byte of bytes) {
    id += chars[byte % chars.length];
  }
  return id;
}

interface AuditEntry {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(
  db: DrizzleD1Database<typeof schema>,
  entry: AuditEntry,
): Promise<void> {
  const { auditLog } = await import("../db/schema");
  await db.insert(auditLog).values({
    id: generateId(),
    actorId: entry.actorId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    details: entry.details ? JSON.stringify(entry.details) : null,
    ipAddress: entry.ipAddress ?? null,
    createdAt: Math.floor(Date.now() / 1000),
  });
}
