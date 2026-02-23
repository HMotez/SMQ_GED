-- ============================================================
-- Migration 002 — Table logs (EF14 — Audit Trail)
-- Sprint 2, Carte 2 — Traçabilité & Signature numérique ISO
-- ============================================================

CREATE TABLE IF NOT EXISTS logs (
  id          SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  action      VARCHAR(100) NOT NULL,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  details     JSONB,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_document_id ON logs(document_id);
CREATE INDEX IF NOT EXISTS idx_logs_action      ON logs(action);
