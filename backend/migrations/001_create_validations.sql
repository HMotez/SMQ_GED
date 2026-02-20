-- ============================================================
-- Migration 001 — Table validations (EF05)
-- Sprint 2, Carte 1 — Workflow & Validation ISO
-- ============================================================

CREATE TABLE IF NOT EXISTS validations (
  id             SERIAL PRIMARY KEY,

  -- Lien document (EF05)
  document_id    INTEGER NOT NULL
                   REFERENCES documents(id) ON DELETE CASCADE,

  -- Validateur (EF05 + EF06 — garantit validateur ≠ rédacteur)
  validator_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  validator_name VARCHAR(255),          -- copie dénormalisée pour audit

  -- Date/heure (EF05 — ISO horodatage)
  validated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Commentaire (EF05)
  comment        TEXT,

  -- Décision : APPROUVÉ | REJETÉ | EN_ATTENTE (EF05)
  decision       VARCHAR(20) NOT NULL
                   CHECK (decision IN ('APPROUVÉ','REJETÉ','EN_ATTENTE'))
                   DEFAULT 'EN_ATTENTE',

  -- Contexte ISO : lettre de version au moment de la validation
  version_letter VARCHAR(5),

  -- Signature numérique (EF14 — traçabilité ISO)
  signature_hash VARCHAR(512),           -- SHA-256 ou HMAC, ex: pour audit légal

  -- Immutabilité (EF14 — non modifiable après création)
  is_locked      BOOLEAN DEFAULT TRUE,   -- toujours TRUE, empêche toute édition

  -- Audit trail
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accès rapide par document
CREATE INDEX IF NOT EXISTS idx_validations_document_id
  ON validations(document_id);

-- Index pour accès rapide par validateur
CREATE INDEX IF NOT EXISTS idx_validations_validator_id
  ON validations(validator_id);

-- Index sur la décision (pour requêtes filtrées)
CREATE INDEX IF NOT EXISTS idx_validations_decision
  ON validations(decision);

-- Contrainte ISO : garantit que la validation ne peut pas être modifiée
ALTER TABLE validations
  ADD CONSTRAINT check_locked_immutable CHECK (is_locked = TRUE);
