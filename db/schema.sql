-- Reference schema — scripts/seed.js runs this same DDL automatically.
-- Kept here for anyone who wants to run it by hand (e.g. in the Neon SQL editor).

CREATE TABLE IF NOT EXISTS initiatives (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  pm TEXT NOT NULL,
  journey TEXT NOT NULL,
  core_value TEXT,
  status TEXT NOT NULL,
  health TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  impact TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  start_month INTEGER NOT NULL,
  tracker_link TEXT,
  confluence_link TEXT,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pm_avatars (
  pm_name TEXT PRIMARY KEY,
  pathname TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
