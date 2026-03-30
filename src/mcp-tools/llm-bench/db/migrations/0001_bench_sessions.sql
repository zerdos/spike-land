-- LLM Benchmark Sessions & Leaderboard
-- Migration: 0001_bench_sessions

-- bench_sessions: track each benchmark run
CREATE TABLE IF NOT EXISTS bench_sessions (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  dimensions TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  seed INTEGER,
  elo_rating REAL DEFAULT 1000,
  conflict_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_bench_sessions_model ON bench_sessions(model_id);
CREATE INDEX IF NOT EXISTS idx_bench_sessions_status ON bench_sessions(status);

-- bench_rounds: each round within a session
CREATE TABLE IF NOT EXISTS bench_rounds (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES bench_sessions(id),
  round_number INTEGER NOT NULL,
  challenges TEXT NOT NULL,
  responses TEXT,
  results TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bench_rounds_session ON bench_rounds(session_id);

-- bench_dimension_states: mastery tracking per dimension
CREATE TABLE IF NOT EXISTS bench_dimension_states (
  session_id TEXT NOT NULL REFERENCES bench_sessions(id),
  dimension TEXT NOT NULL,
  correct_count INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  mastered INTEGER DEFAULT 0,
  conflicts INTEGER DEFAULT 0,
  answer_history TEXT,
  PRIMARY KEY (session_id, dimension)
);

-- bench_leaderboard: aggregated model performance
CREATE TABLE IF NOT EXISTS bench_leaderboard (
  model_id TEXT PRIMARY KEY,
  sessions_completed INTEGER DEFAULT 0,
  avg_elo REAL DEFAULT 1000,
  best_elo REAL DEFAULT 1000,
  dimensions_mastered TEXT,
  avg_rounds_to_complete REAL,
  avg_conflict_rate REAL,
  last_session_at INTEGER
);
