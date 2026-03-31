-- Migration: Create learn_it_content and learn_it_relations tables

CREATE TABLE IF NOT EXISTS learn_it_content (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS learn_it_content_slug_idx ON learn_it_content (slug);
CREATE INDEX IF NOT EXISTS learn_it_content_status_idx ON learn_it_content (status);

CREATE TABLE IF NOT EXISTS learn_it_relations (
  id TEXT PRIMARY KEY,
  from_topic_id TEXT NOT NULL REFERENCES learn_it_content(id) ON DELETE CASCADE,
  to_topic_id TEXT NOT NULL REFERENCES learn_it_content(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  strength INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS learn_it_relations_from_to_type_idx ON learn_it_relations (from_topic_id, to_topic_id, type);
CREATE INDEX IF NOT EXISTS learn_it_relations_from_idx ON learn_it_relations (from_topic_id);
CREATE INDEX IF NOT EXISTS learn_it_relations_to_idx ON learn_it_relations (to_topic_id);
CREATE INDEX IF NOT EXISTS learn_it_relations_type_idx ON learn_it_relations (type);
