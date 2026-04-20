-- Minimal user reference (resolved by auth service; kept as FK target only).
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Outbound audit log.
CREATE TABLE IF NOT EXISTS email_sends (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  to_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  resend_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_email_sends_user ON email_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_created ON email_sends(created_at);

-- Inbound messages — headers in D1, raw RFC822 in R2.
CREATE TABLE IF NOT EXISTS email_inbound (
  id TEXT PRIMARY KEY,
  message_id TEXT,
  from_address TEXT,
  to_address TEXT,
  subject TEXT,
  in_reply_to TEXT,
  r2_key TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_inbound_to ON email_inbound(to_address);
CREATE INDEX IF NOT EXISTS idx_email_inbound_received ON email_inbound(received_at);
CREATE INDEX IF NOT EXISTS idx_email_inbound_message ON email_inbound(message_id);
