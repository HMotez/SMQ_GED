-- ============================================================
-- Migration 003 — Table ai_query_logs (Sprint 6 — Module IA)
-- ============================================================
-- Journalisation des requêtes soumises au chatbot qualité.
-- Cette table est aussi créée automatiquement au démarrage
-- via ensureAITables() dans aiController.js.
--
-- Pour une base existante sans Docker (ou volume pgdata déjà
-- initialisé), appliquer manuellement :
--   psql -U postgres -d smq_db -f 003_create_ai_tables.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_query_logs (
  id           SERIAL PRIMARY KEY,

  -- Utilisateur ayant soumis la requête (NULL si session expirée)
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Texte brut de la requête en langage naturel
  query_text   TEXT NOT NULL,

  -- Intention NLP détectée (ex: expired_docs, by_type, statistics…)
  intent       VARCHAR(80),

  -- Nombre de résultats retournés
  result_count INTEGER DEFAULT 0,

  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index : accès rapide par utilisateur et tri chronologique
CREATE INDEX IF NOT EXISTS idx_ai_logs_user    ON ai_query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_query_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_intent  ON ai_query_logs(intent);
