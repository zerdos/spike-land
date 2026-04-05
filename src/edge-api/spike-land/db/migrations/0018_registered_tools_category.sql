-- Add category column to registered_tools to align schema.ts with migrations.
-- The column was referenced in public-apps.ts raw SQL but was missing from the table definition.
ALTER TABLE registered_tools ADD COLUMN category TEXT NOT NULL DEFAULT '';
