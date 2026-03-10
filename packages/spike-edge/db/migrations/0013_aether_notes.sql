-- Aether Bayesian memory notes for Spike Chat
CREATE TABLE IF NOT EXISTS aether_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  trigger_text TEXT NOT NULL,
  lesson TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5,
  help_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_aether_notes_user ON aether_notes(user_id, confidence DESC);
