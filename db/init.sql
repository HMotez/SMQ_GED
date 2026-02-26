-- =============================================================
-- SMQ_GED — Database Initialization Script
-- Sprint 7 — Dockerisation & Déploiement Containerisé
-- =============================================================
-- Ce fichier est exécuté automatiquement par PostgreSQL au
-- premier démarrage (volume pgdata vide).
-- =============================================================

-- ── 1. Roles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255)
);

-- ── 2. Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255),
  role_id        INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  is_active      BOOLEAN DEFAULT false,
  last_login     TIMESTAMP WITH TIME ZONE,
  requested_role VARCHAR(100),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 3. Document Types ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_types (
  id    SERIAL PRIMARY KEY,
  code  VARCHAR(10)  NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL
);

-- ── 4. Status ─────────────────────────────────────────────────
-- IMPORTANT : id=1 = "Brouillon" — codé en dur dans createDocument
CREATE TABLE IF NOT EXISTS status (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- ── 5. Processes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS processes (
  id                SERIAL PRIMARY KEY,
  code              VARCHAR(50),
  strategic_process VARCHAR(100),
  main_process      VARCHAR(100),
  sub_process       VARCHAR(100)
);

-- ── 6. Folders ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(255) NOT NULL,
  code      VARCHAR(50),
  level     INTEGER NOT NULL DEFAULT 1,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE
);

-- ── 7. Doc Code Sequences (EF02) ──────────────────────────────
CREATE TABLE IF NOT EXISTS doc_code_sequences (
  type_code    VARCHAR(10) NOT NULL,
  process_code VARCHAR(50) NOT NULL DEFAULT 'GLOBAL',
  last_number  INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (type_code, process_code)
);

-- ── 8. Documents ──────────────────────────────────────────────
-- NOTE: process_id = folder id (frontend envoie l'id du folder sélectionné)
--       Pas de FK sur processes pour éviter les violations de contrainte.
CREATE TABLE IF NOT EXISTS documents (
  id               SERIAL PRIMARY KEY,
  doc_code         VARCHAR(50) UNIQUE,
  title            VARCHAR(255) NOT NULL,
  responsible      VARCHAR(255),
  next_review_date DATE,
  status_id        INTEGER NOT NULL REFERENCES status(id),
  current_version  VARCHAR(10) DEFAULT '-',
  folder_id        INTEGER REFERENCES folders(id)       ON DELETE SET NULL,
  type_id          INTEGER REFERENCES document_types(id),
  process_id       INTEGER,
  created_by       INTEGER REFERENCES users(id)         ON DELETE SET NULL,
  origin           VARCHAR(10) DEFAULT 'INTERNE',
  context          TEXT,
  project_ref      VARCHAR(100),
  keywords         TEXT[],
  file_path        VARCHAR(500),
  file_name        VARCHAR(255),
  file_size        BIGINT,
  mime_type        VARCHAR(100),
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 9. Versions (EF04) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS versions (
  id             SERIAL PRIMARY KEY,
  document_id    INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_letter VARCHAR(10) NOT NULL,
  file_path      VARCHAR(500),
  file_name      VARCHAR(255),
  file_size      BIGINT,
  mime_type      VARCHAR(100),
  change_summary TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 10. Logs / Audit Trail (EF14) ─────────────────────────────
CREATE TABLE IF NOT EXISTS logs (
  id          SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  user_id     INTEGER REFERENCES users(id)     ON DELETE SET NULL,
  details     JSONB,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 11. Validations (EF05) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS validations (
  id             SERIAL PRIMARY KEY,
  document_id    INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  validator_id   INTEGER NOT NULL REFERENCES users(id)     ON DELETE RESTRICT,
  validator_name VARCHAR(255),
  validated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  comment        TEXT,
  decision       VARCHAR(20) NOT NULL
                   CHECK (decision IN ('APPROUVÉ','REJETÉ','EN_ATTENTE'))
                   DEFAULT 'EN_ATTENTE',
  version_letter VARCHAR(5),
  signature_hash VARCHAR(512),
  is_locked      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validations_document_id  ON validations(document_id);
CREATE INDEX IF NOT EXISTS idx_validations_validator_id ON validations(validator_id);
CREATE INDEX IF NOT EXISTS idx_validations_decision     ON validations(decision);

-- ── 12. Notifications (Sprint 5) ──────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id)     ON DELETE CASCADE,
  document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  message     TEXT    NOT NULL,
  type        VARCHAR(50) NOT NULL DEFAULT 'validation',
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread  ON notifications(user_id, is_read);


-- =============================================================
-- SEED DATA — Données de référence obligatoires
-- =============================================================

-- ── Status ────────────────────────────────────────────────────
INSERT INTO status (name) VALUES
  ('Brouillon'),
  ('En rédaction'),
  ('En relecture'),
  ('En validation'),
  ('Validé'),
  ('Diffusé'),
  ('Obsolète'),
  ('Archivé')
ON CONFLICT (name) DO NOTHING;

-- ── Types documentaires AES ───────────────────────────────────
INSERT INTO document_types (code, label) VALUES
  ('PR', 'Procédures'),
  ('IN', 'Instructions'),
  ('GU', 'Guides'),
  ('MN', 'Manuel'),
  ('TR', 'Trames'),
  ('EN', 'Enregistrements'),
  ('FM', 'Fiches Missions'),
  ('FF', 'Fiches Fonctions'),
  ('PT', 'Plan de traitement'),
  ('EX', 'Externe')
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- CARTOGRAPHIE DES PROCESSUS ACTIA ENGINEERING SERVICES
-- =============================================================
-- Niveau 1 : Processus Stratégiques   (level=1, parent_id=NULL)
-- Niveau 2 : Processus Principaux     (level=2, parent_id=L1.id)
-- Niveau 3 : Sous-processus           (level=3, parent_id=L2.id)
-- =============================================================

-- ── NIVEAU 1 ─────────────────────────────────────────────────
INSERT INTO folders (name, code, level, parent_id) VALUES
  ('01_PROCESSUS_STRATEGIQUE', '01-PS', 1, NULL),   -- id=1
  ('02_PROCESSUS_SUPPORT',     '02-SP', 1, NULL);   -- id=2

-- ── NIVEAU 2 — sous 01_PROCESSUS_STRATEGIQUE (parent_id=1) ───
INSERT INTO folders (name, code, level, parent_id) VALUES
  ('Concevoir_Developper_Produits',              'CDP',  2, 1),  -- id=3
  ('Faire_Evoluer_Securiser_SI',                 'FESI', 2, 1),  -- id=4
  ('Fournir_Prestations_Service',                'FPS',  2, 1),  -- id=5
  ('Gerer_Infrastructure_Environnement_Travail', 'GIET', 2, 1);  -- id=6

-- ── NIVEAU 2 — sous 02_PROCESSUS_SUPPORT (parent_id=2) ───────
INSERT INTO folders (name, code, level, parent_id) VALUES
  ('Maitriser_Achats_Logistique',   'MAL',  2, 2),  -- id=7
  ('Manager_Sante_Securite_Travail','MSST', 2, 2),  -- id=8
  ('Manager_Motiver_Ressources',    'MMR',  2, 2),  -- id=9
  ('Piloter_l_Entreprise',          'PE',   2, 2);  -- id=10

-- ── NIVEAU 3 — sous Concevoir_Developper_Produits (parent_id=3) ──
INSERT INTO folders (name, code, level, parent_id) VALUES
  ('PS_Processus_Strategique',             'CDP-PS',  3, 3),  -- id=11
  ('PM_Conception_Mecanique',              'CDP-MC',  3, 3),  -- id=12
  ('PM_Conception_Developpement_Logiciel', 'CDP-DL',  3, 3),  -- id=13
  ('PM_Conception_Developpement_Outillages','CDP-DO', 3, 3),  -- id=14
  ('PM_Electronique',                      'CDP-EL',  3, 3),  -- id=15
  ('PM_Qualification_Thermomecanique',     'CDP-QT',  3, 3),  -- id=16
  ('PM_Validation',                        'CDP-VA',  3, 3),  -- id=17
  ('PM_Industrialisation_Vie_Serie',       'CDP-IVS', 3, 3);  -- id=18

-- ── PROCESSUS — table processes (pour dashboard & stats) ──────
INSERT INTO processes (code, strategic_process, main_process, sub_process) VALUES
  ('CDP',     '01_PROCESSUS_STRATEGIQUE', 'Concevoir_Developper_Produits',              'Concevoir_Developper_Produits'),
  ('FESI',    '01_PROCESSUS_STRATEGIQUE', 'Faire_Evoluer_Securiser_SI',                 'Faire_Evoluer_Securiser_SI'),
  ('FPS',     '01_PROCESSUS_STRATEGIQUE', 'Fournir_Prestations_Service',                'Fournir_Prestations_Service'),
  ('GIET',    '01_PROCESSUS_STRATEGIQUE', 'Gerer_Infrastructure_Environnement_Travail', 'Gerer_Infrastructure_Environnement_Travail'),
  ('MAL',     '02_PROCESSUS_SUPPORT',     'Maitriser_Achats_Logistique',                'Maitriser_Achats_Logistique'),
  ('MSST',    '02_PROCESSUS_SUPPORT',     'Manager_Sante_Securite_Travail',             'Manager_Sante_Securite_Travail'),
  ('MMR',     '02_PROCESSUS_SUPPORT',     'Manager_Motiver_Ressources',                 'Manager_Motiver_Ressources'),
  ('PE',      '02_PROCESSUS_SUPPORT',     'Piloter_l_Entreprise',                       'Piloter_l_Entreprise'),
  ('CDP-PS',  '01_PROCESSUS_STRATEGIQUE', 'Concevoir_Developper_Produits',              'PS_Processus_Strategique'),
  ('CDP-MC',  '01_PROCESSUS_STRATEGIQUE', 'Concevoir_Developper_Produits',              'PM_Conception_Mecanique'),
  ('CDP-DL',  '01_PROCESSUS_STRATEGIQUE', 'Concevoir_Developper_Produits',              'PM_Conception_Developpement_Logiciel'),
  ('CDP-DO',  '01_PROCESSUS_STRATEGIQUE', 'Concevoir_Developper_Produits',              'PM_Conception_Developpement_Outillages'),
  ('CDP-EL',  '01_PROCESSUS_STRATEGIQUE', 'Concevoir_Developper_Produits',              'PM_Electronique'),
  ('CDP-QT',  '01_PROCESSUS_STRATEGIQUE', 'Concevoir_Developper_Produits',              'PM_Qualification_Thermomecanique'),
  ('CDP-VA',  '01_PROCESSUS_STRATEGIQUE', 'Concevoir_Developper_Produits',              'PM_Validation'),
  ('CDP-IVS', '01_PROCESSUS_STRATEGIQUE', 'Concevoir_Developper_Produits',              'PM_Industrialisation_Vie_Serie');
