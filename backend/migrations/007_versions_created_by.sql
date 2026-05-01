-- Migration 007 — Add created_by to versions table
ALTER TABLE versions ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
