-- ============================================================
-- SMQ_GED - Diagramme de Classes Global
-- 7 tables exactement comme le diagramme de classes
-- Base : smq_ged_diagram
-- ============================================================

-- 1. STATUT
CREATE TABLE statut (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. UTILISATEUR
CREATE TABLE utilisateur (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255),
    role           VARCHAR(100),
    is_active      BOOLEAN DEFAULT false,
    login_attempts INTEGER DEFAULT 0,
    locked_until   TIMESTAMP WITH TIME ZONE,
    last_login     TIMESTAMP WITH TIME ZONE,
    last_login_ip  VARCHAR(64),
    requested_role VARCHAR(100),
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DOCUMENT (FK vers statut et utilisateur)
CREATE TABLE document (
    id                SERIAL PRIMARY KEY,
    doc_code          VARCHAR(50) UNIQUE,
    title             VARCHAR(255) NOT NULL,
    responsible       VARCHAR(255),
    origin            VARCHAR(10)  DEFAULT 'INTERNE',
    context           TEXT,
    project_ref       VARCHAR(100),
    keywords          TEXT[],
    next_review_date  DATE,
    current_version   VARCHAR(10)  DEFAULT '-',
    validated_version VARCHAR(10),
    file_path         VARCHAR(500),
    file_name         VARCHAR(255),
    file_size         INTEGER,
    mime_type         VARCHAR(100),
    folder_id         INTEGER,
    type_id           INTEGER,
    statut_id         INTEGER NOT NULL REFERENCES statut(id),
    created_by        INTEGER REFERENCES utilisateur(id) ON DELETE SET NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. VERSION (FK vers document)
CREATE TABLE version (
    id              SERIAL PRIMARY KEY,
    document_id     INTEGER NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    version_letter  VARCHAR(10) NOT NULL,
    file_path       VARCHAR(500),
    file_name       VARCHAR(255),
    file_size       INTEGER,
    mime_type       VARCHAR(100),
    change_summary  TEXT,
    sharepoint_link VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. NOTIFICATION (FK vers utilisateur et document)
CREATE TABLE notification (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES utilisateur(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES document(id)    ON DELETE SET NULL,
    message     TEXT NOT NULL,
    type        VARCHAR(50) DEFAULT 'validation',
    is_read     BOOLEAN DEFAULT false,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. VALIDATION (FK vers document et utilisateur)
CREATE TABLE validation (
    id             SERIAL PRIMARY KEY,
    document_id    INTEGER NOT NULL REFERENCES document(id)    ON DELETE CASCADE,
    validator_id   INTEGER NOT NULL REFERENCES utilisateur(id) ON DELETE RESTRICT,
    validator_name VARCHAR(255),
    validated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    comment        TEXT,
    decision       VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
                     CHECK (decision IN ('APPROUVE','REJETE','EN_ATTENTE')),
    version_letter VARCHAR(5),
    signature_hash VARCHAR(512),
    is_locked      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. LOG (FK vers document et utilisateur)
CREATE TABLE log (
    id          SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES document(id)    ON DELETE SET NULL,
    user_id     INTEGER REFERENCES utilisateur(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    details     JSONB,
    ip_address  VARCHAR(64),
    user_agent  VARCHAR(255),
    severity    VARCHAR(16) DEFAULT 'info'
                  CHECK (severity IN ('info','warning','critical')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- DONNEES DE DEMONSTRATION
-- ============================================================

INSERT INTO statut (id, name) VALUES
  (1,'Brouillon'),(2,'En redaction'),(3,'En relecture'),
  (4,'En validation'),(5,'Valide'),(6,'Diffuse'),
  (7,'Obsolete'),(8,'Archive'),(9,'Appel en relecture'),(10,'En correction');

INSERT INTO utilisateur (id, name, email, role, is_active) VALUES
  (1,'Admin',          'admin@test.com',        'Admin',        true),
  (2,'Ing Qualite',    'ing@test.com',           'Ing. Qualite', true),
  (3,'Reviewer',       'reviewer@test.com',      'Reviewer',     true),
  (4,'Moetez Hamzaoui','motezhm40@gmail.com',   'Reviewer',     true);

INSERT INTO document (doc_code, title, responsible, statut_id, current_version, file_name, created_by) VALUES
  ('PR0001','Procedure Qualite',    'Moetez', 5, 'A',  'PR0001_Procedure.pdf', 1),
  ('TR0001','Trame Standard',       'Moetez', 8, 'A1', 'TR0001_Trame.pdf',     2),
  ('GU0001','Guide Securite',       'Moetez', 6, 'A',  'GU0001_Guide.pdf',     2),
  ('MN0001','Manuel Qualite',       'Alison', 1, 'A',  'MN0001_Manuel.pdf',    2),
  ('TR0002','Trame Processus',      'Moetez', 4, 'A2', 'TR0002_Trame.pdf',     2),
  ('GU0002','Guide Infrastructure', 'Alison', 4, 'A',  'GU0002_Guide.pdf',     2);

INSERT INTO version (document_id, version_letter, file_name, change_summary) VALUES
  (1, '-',  'PR0001_Procedure_-.pdf', 'Version initiale'),
  (1, 'A',  'PR0001_Procedure_A.pdf', 'Corrections mineures'),
  (2, '-',  'TR0001_Trame_-.pdf',     'Version initiale'),
  (2, 'A',  'TR0001_Trame_A.pdf',     'Mise a jour contenu'),
  (2, 'A1', 'TR0001_Trame_A1.pdf',    'Revision complete');

INSERT INTO validation (document_id, validator_id, validator_name, decision, comment, version_letter) VALUES
  (1, 3, 'Reviewer', 'APPROUVE',   'Document conforme ISO 9001', 'A'),
  (2, 1, 'Admin',    'APPROUVE',   'Validation admin',           'A1'),
  (3, 3, 'Reviewer', 'EN_ATTENTE', '',                           'A');

INSERT INTO notification (user_id, document_id, message, type, is_read) VALUES
  (1, 1, '[PR0001] Procedure soumise en validation',     'validation', false),
  (2, 2, '[TR0001] Nouvelle version A1 disponible',      'version',    false),
  (1, 3, '[GU0001] Document expire - revision requise',  'expiration', false),
  (3, 1, '[PR0001] Validation enregistree',              'validation', true);

INSERT INTO log (document_id, user_id, action, details, severity) VALUES
  (1, 1, 'CREATE_DOCUMENT',    '{"doc_code":"PR0001","typeCode":"PR"}',         'info'),
  (1, 2, 'STATUS_CHANGE',      '{"from":"Brouillon","to":"En validation"}',     'info'),
  (1, 3, 'VALIDATION_CREATED', '{"decision":"APPROUVE","validator":"Reviewer"}','info'),
  (2, 2, 'NEW_VERSION',        '{"from":"A","to":"A1","summary":"Revision"}',   'info'),
  (NULL,3,'LOGIN_FAILURE',     '{"email":"test@test.com","reason":"wrong_pwd"}','warning');
