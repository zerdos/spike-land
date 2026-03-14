-- Migration: 0016_auth_audit_log
-- Creates the auth_audit_log table for non-blocking security event recording.
-- event_type values: 'login_success', 'login_failure', 'session_validated',
--                    'rate_limited', 'internal_auth'

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  metadata TEXT,                   -- JSON blob for extra context
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_auth_audit_event ON auth_audit_log(event_type, created_at);
CREATE INDEX idx_auth_audit_user ON auth_audit_log(user_id, created_at);
