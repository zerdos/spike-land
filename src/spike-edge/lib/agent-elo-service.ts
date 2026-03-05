/**
 * Agent ELO service: business logic for agent ELO reputation.
 * Agents have their own ELO linked to their owner.
 */

import { applyEloDelta, eloToTier } from "./elo.js";
import { ensureUserElo, recordEloEvent, type EloEventType, type EloEventResult } from "./elo-service.js";

const DAILY_GAIN_CAP = 100;

export interface AgentElo {
  agentId: string;
  ownerUserId: string;
  elo: number;
  eventCount: number;
  dailyGains: number;
  dailyResetAt: number;
  tier: "free" | "pro" | "business";
}

/** In-memory cache for hot-path ELO lookups (60s TTL per isolate). */
const agentEloCache = new Map<string, { data: AgentElo; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

function getCached(agentId: string): AgentElo | null {
  const entry = agentEloCache.get(agentId);
  if (entry && entry.expiresAt > Date.now()) return entry.data;
  if (entry) agentEloCache.delete(agentId);
  return null;
}

function setCache(data: AgentElo): void {
  agentEloCache.set(data.agentId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function invalidateCache(agentId: string): void {
  agentEloCache.delete(agentId);
}

/** Get agent ELO, creating the row if it doesn't exist. */
export async function ensureAgentElo(db: D1Database, agentId: string, ownerUserId: string): Promise<AgentElo> {
  const cached = getCached(agentId);
  if (cached) return cached;

  const row = await db.prepare(
    "SELECT agent_id, owner_user_id, elo, event_count, daily_gains, daily_reset_at, tier FROM agent_elo WHERE agent_id = ?",
  ).bind(agentId).first<{
    agent_id: string;
    owner_user_id: string;
    elo: number;
    event_count: number;
    daily_gains: number;
    daily_reset_at: number;
    tier: string;
  }>();

  if (row) {
    const data: AgentElo = {
      agentId: row.agent_id,
      ownerUserId: row.owner_user_id,
      elo: row.elo,
      eventCount: row.event_count,
      dailyGains: row.daily_gains,
      dailyResetAt: row.daily_reset_at,
      tier: row.tier as AgentElo["tier"],
    };
    setCache(data);
    return data;
  }

  // Determine starting ELO: min(1200, ownerElo)
  const owner = await ensureUserElo(db, ownerUserId);
  const startingElo = Math.min(1200, owner.elo);
  const tier = eloToTier(startingElo);
  const now = Date.now();

  await db.prepare(
    "INSERT INTO agent_elo (agent_id, owner_user_id, elo, event_count, daily_gains, daily_reset_at, tier, created_at, updated_at) VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?)",
  ).bind(agentId, ownerUserId, startingElo, now, tier, now, now).run();

  const data: AgentElo = {
    agentId,
    ownerUserId,
    elo: startingElo,
    eventCount: 0,
    dailyGains: 0,
    dailyResetAt: now,
    tier,
  };
  setCache(data);
  return data;
}

function shouldResetDaily(dailyResetAt: number, now: number): boolean {
  const resetDate = new Date(dailyResetAt);
  const nowDate = new Date(now);
  return (
    resetDate.getUTCFullYear() !== nowDate.getUTCFullYear() ||
    resetDate.getUTCMonth() !== nowDate.getUTCMonth() ||
    resetDate.getUTCDate() !== nowDate.getUTCDate()
  );
}

// We redefine deltas for agent-specific logic to match user logic, but maybe we could import it. 
// However, the prompt says "same logic as user ELO". We'll replicate the delta map or assume it's same.
const ELO_DELTAS: Record<EloEventType, number> = {
  report_valid_bug: 25,
  bug_confirmed: 10,
  successful_tool_use: 1,
  false_bug_report: -15,
  rate_limit_hit: -5,
  abuse_flag: -50,
  whatsapp_productive_use: 2,
  bug_bounty_granted: 50,
  agent_abuse_penalty: -25,
};

export async function recordAgentEloEvent(
  db: D1Database,
  agentId: string,
  ownerUserId: string,
  eventType: EloEventType,
  referenceId?: string,
): Promise<EloEventResult> {
  const agent = await ensureAgentElo(db, agentId, ownerUserId);
  const now = Date.now();
  let baseDelta = ELO_DELTAS[eventType];

  if (eventType === "abuse_flag") {
    // Linked abuse: penalise the owner
    await recordEloEvent(db, ownerUserId, "agent_abuse_penalty", agentId);
  }

  // Reset daily gains if new day
  let dailyGains = agent.dailyGains;
  let dailyResetAt = agent.dailyResetAt;
  if (shouldResetDaily(agent.dailyResetAt, now)) {
    dailyGains = 0;
    dailyResetAt = now;
  }

  // Apply daily gain cap for positive deltas
  let capped = false;
  if (baseDelta > 0) {
    const remainingCap = Math.max(0, DAILY_GAIN_CAP - dailyGains);
    if (baseDelta > remainingCap) {
      baseDelta = remainingCap;
      capped = true;
    }
    if (baseDelta === 0) {
      return { newElo: agent.elo, delta: 0, tier: agent.tier, capped: true };
    }
    dailyGains += baseDelta;
  }

  const newElo = applyEloDelta(agent.elo, baseDelta);
  const newTier = eloToTier(newElo);

  await db.batch([
    db.prepare(
      "UPDATE agent_elo SET elo = ?, event_count = event_count + 1, daily_gains = ?, daily_reset_at = ?, tier = ?, updated_at = ? WHERE agent_id = ?",
    ).bind(newElo, dailyGains, dailyResetAt, newTier, now, agentId),
    db.prepare(
      "INSERT INTO agent_elo_events (id, agent_id, owner_user_id, event_type, delta, old_elo, new_elo, reference_id, created_at) VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(agentId, ownerUserId, eventType, baseDelta, agent.elo, newElo, referenceId ?? null, now),
  ]);

  invalidateCache(agentId);

  return { newElo, delta: baseDelta, tier: newTier, capped };
}

export async function getAgentElo(db: D1Database, agentId: string): Promise<AgentElo | null> {
  const cached = getCached(agentId);
  if (cached) return cached;

  const row = await db.prepare(
    "SELECT agent_id, owner_user_id, elo, event_count, daily_gains, daily_reset_at, tier FROM agent_elo WHERE agent_id = ?",
  ).bind(agentId).first<{
    agent_id: string;
    owner_user_id: string;
    elo: number;
    event_count: number;
    daily_gains: number;
    daily_reset_at: number;
    tier: string;
  }>();

  if (!row) return null;

  const data: AgentElo = {
    agentId: row.agent_id,
    ownerUserId: row.owner_user_id,
    elo: row.elo,
    eventCount: row.event_count,
    dailyGains: row.daily_gains,
    dailyResetAt: row.daily_reset_at,
    tier: row.tier as AgentElo["tier"],
  };
  setCache(data);
  return data;
}

export function clearAgentEloCache(): void {
  agentEloCache.clear();
}
