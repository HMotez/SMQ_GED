-- =============================================================
-- SMQ_GED — Seed: Documents réels depuis le disque ACTIA ES
-- Synchronise la DB avec les fichiers physiques sur le disque
-- Exécuter avec: docker exec -i smq_db psql -U postgres -d smq_db < db/seed_actia_es.sql
-- =============================================================

BEGIN;

-- =============================================================
-- 1. DOSSIERS MANQUANTS (niveau 3 — sous-dossiers documentaires)
-- =============================================================

-- Sous Faire_Evoluer_Securiser_SI (id=4)
INSERT INTO folders (name, code, level, parent_id)
  SELECT 'TR_Trames', 'FESI-TR', 3, 4
  WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'TR_Trames' AND parent_id = 4);

-- Sous Gerer_Infrastructure_Environnement_Travail (id=6)
INSERT INTO folders (name, code, level, parent_id)
  SELECT 'IN_Instructions', 'GIET-IN', 3, 6
  WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'IN_Instructions' AND parent_id = 6);

-- Sous Maitriser_Achats_Logistique (id=7)
INSERT INTO folders (name, code, level, parent_id)
  SELECT 'GU_Guides', 'MAL-GU', 3, 7
  WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'GU_Guides' AND parent_id = 7);

INSERT INTO folders (name, code, level, parent_id)
  SELECT 'IN_Instructions', 'MAL-IN', 3, 7
  WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'IN_Instructions' AND parent_id = 7);

-- =============================================================
-- 2. DOCUMENTS — INSERT OR UPDATE (file_path + folder_id + title)
-- =============================================================

-- ── TR0002 : Trame ───────────────────────────────────────────
-- Dossier: PM_Conception_Developpement_Logiciel (id=13)
-- Fichier le plus récent: TR0002_Trame_vA.pdf
INSERT INTO documents (
  doc_code, title, responsible, status_id, current_version,
  folder_id, type_id, origin,
  file_path, file_name, mime_type, created_by
) VALUES (
  'TR0002',
  'Trame',
  'Moetez',
  (SELECT id FROM status WHERE name = 'Diffusé'),
  'vA',
  13,
  (SELECT id FROM document_types WHERE code = 'TR'),
  'INTERNE',
  '01_PROCESSUS_STRATEGIQUE/Concevoir_Developper_Produits/PM_Processus_Metiers/PM_Conception_Developpement_Logiciel/TR0002_Trame_vA.pdf',
  'TR0002_Trame_vA.pdf',
  'application/pdf',
  (SELECT id FROM users WHERE name = 'Admin' LIMIT 1)
)
ON CONFLICT (doc_code) DO UPDATE SET
  file_path        = EXCLUDED.file_path,
  file_name        = EXCLUDED.file_name,
  folder_id        = EXCLUDED.folder_id,
  current_version  = EXCLUDED.current_version,
  status_id        = EXCLUDED.status_id,
  updated_at       = NOW();

-- ── TR0003 : Trame ───────────────────────────────────────────
-- Dossier: TR_Trames sous Faire_Evoluer_Securiser_SI
INSERT INTO documents (
  doc_code, title, responsible, status_id, current_version,
  folder_id, type_id, origin,
  file_path, file_name, mime_type, created_by
) VALUES (
  'TR0003',
  'Trame',
  'Moetez',
  (SELECT id FROM status WHERE name = 'Diffusé'),
  'vA',
  (SELECT id FROM folders WHERE name = 'TR_Trames' AND parent_id = 4 LIMIT 1),
  (SELECT id FROM document_types WHERE code = 'TR'),
  'INTERNE',
  '01_PROCESSUS_STRATEGIQUE/Faire_Evoluer_Securiser_SI/TR_Trames/TR0003_Trame_vA.pdf',
  'TR0003_Trame_vA.pdf',
  'application/pdf',
  (SELECT id FROM users WHERE name = 'Admin' LIMIT 1)
)
ON CONFLICT (doc_code) DO UPDATE SET
  file_path        = EXCLUDED.file_path,
  file_name        = EXCLUDED.file_name,
  folder_id        = EXCLUDED.folder_id,
  current_version  = EXCLUDED.current_version,
  status_id        = EXCLUDED.status_id,
  updated_at       = NOW();

-- ── IN0002 : Instructions ─────────────────────────────────────
-- Dossier: IN_Instructions sous Gerer_Infrastructure_Environnement_Travail
INSERT INTO documents (
  doc_code, title, responsible, status_id, current_version,
  folder_id, type_id, origin,
  file_path, file_name, mime_type, created_by
) VALUES (
  'IN0002',
  'Instructions',
  'Moetez',
  (SELECT id FROM status WHERE name = 'Brouillon'),
  '-',
  (SELECT id FROM folders WHERE name = 'IN_Instructions' AND parent_id = 6 LIMIT 1),
  (SELECT id FROM document_types WHERE code = 'IN'),
  'INTERNE',
  '01_PROCESSUS_STRATEGIQUE/Gerer_Infrastructure_Environnement_Travail/IN_Instructions/IN0002_Instructions_-.pdf',
  'IN0002_Instructions_-.pdf',
  'application/pdf',
  (SELECT id FROM users WHERE name = 'Admin' LIMIT 1)
)
ON CONFLICT (doc_code) DO UPDATE SET
  file_path        = EXCLUDED.file_path,
  file_name        = EXCLUDED.file_name,
  folder_id        = EXCLUDED.folder_id,
  updated_at       = NOW();

-- ── GU0002 : Guide ───────────────────────────────────────────
-- Dossier: GU_Guides sous Maitriser_Achats_Logistique
-- Fichier le plus récent: GU0002_Guide_vA2.pdf
INSERT INTO documents (
  doc_code, title, responsible, status_id, current_version,
  folder_id, type_id, origin,
  file_path, file_name, mime_type, created_by
) VALUES (
  'GU0002',
  'Guide',
  'Moetez',
  (SELECT id FROM status WHERE name = 'Diffusé'),
  'vA2',
  (SELECT id FROM folders WHERE name = 'GU_Guides' AND parent_id = 7 LIMIT 1),
  (SELECT id FROM document_types WHERE code = 'GU'),
  'INTERNE',
  '02_PROCESSUS_SUPPORT/Maitriser_Achats_Logistique/GU_Guides/GU0002_Guide_vA2.pdf',
  'GU0002_Guide_vA2.pdf',
  'application/pdf',
  (SELECT id FROM users WHERE name = 'Admin' LIMIT 1)
)
ON CONFLICT (doc_code) DO UPDATE SET
  file_path        = EXCLUDED.file_path,
  file_name        = EXCLUDED.file_name,
  folder_id        = EXCLUDED.folder_id,
  current_version  = EXCLUDED.current_version,
  status_id        = EXCLUDED.status_id,
  updated_at       = NOW();

-- ── IN0001 : Instructions ─────────────────────────────────────
-- Dossier: IN_Instructions sous Maitriser_Achats_Logistique
INSERT INTO documents (
  doc_code, title, responsible, status_id, current_version,
  folder_id, type_id, origin,
  file_path, file_name, mime_type, created_by
) VALUES (
  'IN0001',
  'Instructions',
  'Moetez',
  (SELECT id FROM status WHERE name = 'Brouillon'),
  '-',
  (SELECT id FROM folders WHERE name = 'IN_Instructions' AND parent_id = 7 LIMIT 1),
  (SELECT id FROM document_types WHERE code = 'IN'),
  'INTERNE',
  '02_PROCESSUS_SUPPORT/Maitriser_Achats_Logistique/IN_Instructions/IN0001_Instructions_-.pdf',
  'IN0001_Instructions_-.pdf',
  'application/pdf',
  (SELECT id FROM users WHERE name = 'Admin' LIMIT 1)
)
ON CONFLICT (doc_code) DO UPDATE SET
  file_path        = EXCLUDED.file_path,
  file_name        = EXCLUDED.file_name,
  folder_id        = EXCLUDED.folder_id,
  updated_at       = NOW();

-- =============================================================
-- 3. VERSIONS — Historique de chaque document
-- =============================================================

-- TR0002 versions
INSERT INTO versions (document_id, version_letter, file_path, file_name, mime_type, change_summary)
  SELECT d.id, '-',
    '01_PROCESSUS_STRATEGIQUE/Concevoir_Developper_Produits/PM_Processus_Metiers/PM_Conception_Developpement_Logiciel/TR0002_Trame_-.pdf',
    'TR0002_Trame_-.pdf', 'application/pdf', 'Version initiale'
  FROM documents d WHERE d.doc_code = 'TR0002'
  AND NOT EXISTS (SELECT 1 FROM versions v WHERE v.document_id = d.id AND v.version_letter = '-');

INSERT INTO versions (document_id, version_letter, file_path, file_name, mime_type, change_summary)
  SELECT d.id, 'vA',
    '01_PROCESSUS_STRATEGIQUE/Concevoir_Developper_Produits/PM_Processus_Metiers/PM_Conception_Developpement_Logiciel/TR0002_Trame_vA.pdf',
    'TR0002_Trame_vA.pdf', 'application/pdf', 'Version A'
  FROM documents d WHERE d.doc_code = 'TR0002'
  AND NOT EXISTS (SELECT 1 FROM versions v WHERE v.document_id = d.id AND v.version_letter = 'vA');

-- TR0003 versions
INSERT INTO versions (document_id, version_letter, file_path, file_name, mime_type, change_summary)
  SELECT d.id, '-',
    '01_PROCESSUS_STRATEGIQUE/Faire_Evoluer_Securiser_SI/TR_Trames/TR0003_Trame_-.pdf',
    'TR0003_Trame_-.pdf', 'application/pdf', 'Version initiale'
  FROM documents d WHERE d.doc_code = 'TR0003'
  AND NOT EXISTS (SELECT 1 FROM versions v WHERE v.document_id = d.id AND v.version_letter = '-');

INSERT INTO versions (document_id, version_letter, file_path, file_name, mime_type, change_summary)
  SELECT d.id, 'vA',
    '01_PROCESSUS_STRATEGIQUE/Faire_Evoluer_Securiser_SI/TR_Trames/TR0003_Trame_vA.pdf',
    'TR0003_Trame_vA.pdf', 'application/pdf', 'Version A'
  FROM documents d WHERE d.doc_code = 'TR0003'
  AND NOT EXISTS (SELECT 1 FROM versions v WHERE v.document_id = d.id AND v.version_letter = 'vA');

-- IN0002 versions
INSERT INTO versions (document_id, version_letter, file_path, file_name, mime_type, change_summary)
  SELECT d.id, '-',
    '01_PROCESSUS_STRATEGIQUE/Gerer_Infrastructure_Environnement_Travail/IN_Instructions/IN0002_Instructions_-.pdf',
    'IN0002_Instructions_-.pdf', 'application/pdf', 'Version initiale'
  FROM documents d WHERE d.doc_code = 'IN0002'
  AND NOT EXISTS (SELECT 1 FROM versions v WHERE v.document_id = d.id AND v.version_letter = '-');

-- GU0002 versions
INSERT INTO versions (document_id, version_letter, file_path, file_name, mime_type, change_summary)
  SELECT d.id, '-',
    '02_PROCESSUS_SUPPORT/Maitriser_Achats_Logistique/GU_Guides/GU0002_Guide_-.pdf',
    'GU0002_Guide_-.pdf', 'application/pdf', 'Version initiale'
  FROM documents d WHERE d.doc_code = 'GU0002'
  AND NOT EXISTS (SELECT 1 FROM versions v WHERE v.document_id = d.id AND v.version_letter = '-');

INSERT INTO versions (document_id, version_letter, file_path, file_name, mime_type, change_summary)
  SELECT d.id, 'vA',
    '02_PROCESSUS_SUPPORT/Maitriser_Achats_Logistique/GU_Guides/GU0002_Guide_vA.pdf',
    'GU0002_Guide_vA.pdf', 'application/pdf', 'Version A'
  FROM documents d WHERE d.doc_code = 'GU0002'
  AND NOT EXISTS (SELECT 1 FROM versions v WHERE v.document_id = d.id AND v.version_letter = 'vA');

INSERT INTO versions (document_id, version_letter, file_path, file_name, mime_type, change_summary)
  SELECT d.id, 'vA2',
    '02_PROCESSUS_SUPPORT/Maitriser_Achats_Logistique/GU_Guides/GU0002_Guide_vA2.pdf',
    'GU0002_Guide_vA2.pdf', 'application/pdf', 'Version A2'
  FROM documents d WHERE d.doc_code = 'GU0002'
  AND NOT EXISTS (SELECT 1 FROM versions v WHERE v.document_id = d.id AND v.version_letter = 'vA2');

-- IN0001 versions
INSERT INTO versions (document_id, version_letter, file_path, file_name, mime_type, change_summary)
  SELECT d.id, '-',
    '02_PROCESSUS_SUPPORT/Maitriser_Achats_Logistique/IN_Instructions/IN0001_Instructions_-.pdf',
    'IN0001_Instructions_-.pdf', 'application/pdf', 'Version initiale'
  FROM documents d WHERE d.doc_code = 'IN0001'
  AND NOT EXISTS (SELECT 1 FROM versions v WHERE v.document_id = d.id AND v.version_letter = '-');

-- =============================================================
-- 4. SEQUENCES doc_code — mise à jour des compteurs
-- =============================================================
INSERT INTO doc_code_sequences (type_code, process_code, last_number) VALUES
  ('TR', 'GLOBAL', 3),
  ('IN', 'GLOBAL', 2),
  ('GU', 'GLOBAL', 2)
ON CONFLICT (type_code, process_code) DO UPDATE
  SET last_number = GREATEST(doc_code_sequences.last_number, EXCLUDED.last_number);

-- =============================================================
-- 5. VÉRIFICATION FINALE
-- =============================================================
SELECT
  d.doc_code,
  d.title,
  dt.code  AS type,
  s.name   AS status,
  d.current_version,
  f.name   AS folder,
  d.file_path
FROM documents d
JOIN status         s  ON s.id  = d.status_id
JOIN document_types dt ON dt.id = d.type_id
JOIN folders        f  ON f.id  = d.folder_id
WHERE d.doc_code IN ('TR0002','TR0003','IN0001','IN0002','GU0002')
ORDER BY d.doc_code;

COMMIT;
