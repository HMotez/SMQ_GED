-- =============================================================
-- Migration 004 — New review workflow statuses + SharePoint link
-- Sprint 10 — Workflow A1/A2/A3 + SharePoint integration
-- =============================================================

-- 1. New statuses for the review cycle
INSERT INTO status (name) VALUES ('Appel en relecture') ON CONFLICT (name) DO NOTHING;
INSERT INTO status (name) VALUES ('En correction')      ON CONFLICT (name) DO NOTHING;

-- 2. SharePoint link per version
ALTER TABLE versions  ADD COLUMN IF NOT EXISTS sharepoint_link VARCHAR(500);

-- 3. SharePoint link on documents (tracks current version link)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sharepoint_link VARCHAR(500);

-- 4. Track the last validated version (used for letter-cycle versioning)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS validated_version VARCHAR(10);
