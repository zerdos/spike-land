-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Notes (14 types: claim, question, idea, task, entity, quote, reference, definition, opinion, reflection, narrative, comparison, thesis, general)
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'general',
  confidence REAL NOT NULL DEFAULT 0.0,
  annotation TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  pinned INTEGER NOT NULL DEFAULT 0,
  position_x REAL NOT NULL DEFAULT 0.0,
  position_y REAL NOT NULL DEFAULT 0.0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(project_id, type);

-- Connections between notes
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT '',
  strength REAL NOT NULL DEFAULT 0.5,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_connections_project ON connections(project_id);
CREATE INDEX IF NOT EXISTS idx_connections_source ON connections(source_note_id);
CREATE INDEX IF NOT EXISTS idx_connections_target ON connections(target_note_id);

-- Emergent syntheses
CREATE TABLE IF NOT EXISTS syntheses (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  thesis TEXT NOT NULL,
  bridging_category TEXT NOT NULL DEFAULT '',
  source_note_ids TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_syntheses_project ON syntheses(project_id);
