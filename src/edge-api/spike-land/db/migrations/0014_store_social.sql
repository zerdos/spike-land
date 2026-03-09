-- ALTER mcp_apps: add columns for search/recommendations
ALTER TABLE mcp_apps ADD COLUMN category TEXT NOT NULL DEFAULT '';
ALTER TABLE mcp_apps ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE mcp_apps ADD COLUMN tagline TEXT NOT NULL DEFAULT '';
ALTER TABLE mcp_apps ADD COLUMN pricing TEXT NOT NULL DEFAULT 'free';
ALTER TABLE mcp_apps ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0;
ALTER TABLE mcp_apps ADD COLUMN is_new INTEGER NOT NULL DEFAULT 0;
CREATE INDEX idx_mcp_apps_category ON mcp_apps(category);
CREATE INDEX idx_mcp_apps_featured ON mcp_apps(is_featured);

-- App Ratings/Reviews (one per user per app, upsert semantics)
CREATE TABLE app_ratings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_slug TEXT NOT NULL REFERENCES mcp_apps(slug) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX idx_app_ratings_user_app ON app_ratings(user_id, app_slug);
CREATE INDEX idx_app_ratings_app ON app_ratings(app_slug);
CREATE INDEX idx_app_ratings_created ON app_ratings(app_slug, created_at);

-- User Wishlists
CREATE TABLE app_wishlists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_slug TEXT NOT NULL REFERENCES mcp_apps(slug) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX idx_app_wishlists_user_app ON app_wishlists(user_id, app_slug);
CREATE INDEX idx_app_wishlists_user ON app_wishlists(user_id);

-- App Installs (local tracking for personalized recommendations)
CREATE TABLE app_installs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_slug TEXT NOT NULL REFERENCES mcp_apps(slug) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX idx_app_installs_user_app ON app_installs(user_id, app_slug);
CREATE INDEX idx_app_installs_user ON app_installs(user_id);
CREATE INDEX idx_app_installs_app ON app_installs(app_slug);
