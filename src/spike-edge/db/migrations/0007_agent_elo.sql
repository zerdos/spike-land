-- Migration: Agent ELO
-- Description: Linked ELO model for agents
-- Created at: 2026-03-05

CREATE TABLE IF NOT EXISTS agent_elo (
    agent_id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    elo INTEGER NOT NULL DEFAULT 1200,
    event_count INTEGER NOT NULL DEFAULT 0,
    daily_gains INTEGER NOT NULL DEFAULT 0,
    daily_reset_at TEXT,
    tier TEXT NOT NULL DEFAULT 'free',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_elo_owner_user_id ON agent_elo (owner_user_id);

CREATE TABLE IF NOT EXISTS agent_elo_events (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    delta INTEGER NOT NULL,
    old_elo INTEGER NOT NULL,
    new_elo INTEGER NOT NULL,
    reference_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (agent_id) REFERENCES agent_elo(agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_elo_events_agent_id ON agent_elo_events (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_elo_events_owner_user_id ON agent_elo_events (owner_user_id);
