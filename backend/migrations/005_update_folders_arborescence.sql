-- =============================================================
-- Migration 005 — Arborescence complète conforme au disque ACTIA ES
-- Ajoute PM_Processus_Metiers + tous les sous-dossiers types
-- =============================================================

-- 1. Ajouter PM_Processus_Metiers sous Concevoir_Developper_Produits (id=3)
INSERT INTO folders (name, code, level, parent_id)
VALUES ('PM_Processus_Metiers', 'CDP-PM', 3, 3)
ON CONFLICT DO NOTHING;

-- 2. Récupérer l'id de PM_Processus_Metiers et rattacher les PM_ folders
UPDATE folders
SET parent_id = (SELECT id FROM folders WHERE code = 'CDP-PM'),
    level     = 4
WHERE code IN ('CDP-MC','CDP-DL','CDP-DO','CDP-EL','CDP-QT','CDP-VA','CDP-IVS');

-- 3. Sous-dossiers types sous PS_Processus_Strategique (code=CDP-PS)
INSERT INTO folders (name, code, level, parent_id)
SELECT name, code, 4, (SELECT id FROM folders WHERE code = 'CDP-PS')
FROM (VALUES
  ('PR_Procedures',      'CDP-PS-PR'),
  ('IN_Instructions',    'CDP-PS-IN'),
  ('GU_Guides',          'CDP-PS-GU'),
  ('TR_Trames',          'CDP-PS-TR'),
  ('EN_Enregistrements', 'CDP-PS-EN')
) AS t(name, code)
ON CONFLICT DO NOTHING;

-- 4. Sous-dossiers types sous Faire_Evoluer_Securiser_SI (code=FESI)
INSERT INTO folders (name, code, level, parent_id)
SELECT name, code, 3, (SELECT id FROM folders WHERE code = 'FESI')
FROM (VALUES
  ('PR_Procedures',      'FESI-PR'),
  ('IN_Instructions',    'FESI-IN'),
  ('GU_Guides',          'FESI-GU'),
  ('TR_Trames',          'FESI-TR'),
  ('EN_Enregistrements', 'FESI-EN')
) AS t(name, code)
ON CONFLICT DO NOTHING;

-- 5. Sous-dossiers types sous Fournir_Prestations_Service (code=FPS)
INSERT INTO folders (name, code, level, parent_id)
SELECT name, code, 3, (SELECT id FROM folders WHERE code = 'FPS')
FROM (VALUES
  ('PR_Procedures',      'FPS-PR'),
  ('IN_Instructions',    'FPS-IN'),
  ('GU_Guides',          'FPS-GU'),
  ('TR_Trames',          'FPS-TR'),
  ('EN_Enregistrements', 'FPS-EN')
) AS t(name, code)
ON CONFLICT DO NOTHING;

-- 6. Sous-dossiers types sous Gerer_Infrastructure (code=GIET)
INSERT INTO folders (name, code, level, parent_id)
SELECT name, code, 3, (SELECT id FROM folders WHERE code = 'GIET')
FROM (VALUES
  ('PR_Procedures',      'GIET-PR'),
  ('IN_Instructions',    'GIET-IN'),
  ('GU_Guides',          'GIET-GU'),
  ('TR_Trames',          'GIET-TR'),
  ('EN_Enregistrements', 'GIET-EN')
) AS t(name, code)
ON CONFLICT DO NOTHING;

-- 7. Sous-dossiers types sous Maitriser_Achats_Logistique (code=MAL)
INSERT INTO folders (name, code, level, parent_id)
SELECT name, code, 3, (SELECT id FROM folders WHERE code = 'MAL')
FROM (VALUES
  ('PR_Procedures',      'MAL-PR'),
  ('IN_Instructions',    'MAL-IN'),
  ('GU_Guides',          'MAL-GU'),
  ('TR_Trames',          'MAL-TR'),
  ('EN_Enregistrements', 'MAL-EN')
) AS t(name, code)
ON CONFLICT DO NOTHING;

-- 8. Sous-dossiers types sous Manager_Sante_Securite_Travail (code=MSST)
INSERT INTO folders (name, code, level, parent_id)
SELECT name, code, 3, (SELECT id FROM folders WHERE code = 'MSST')
FROM (VALUES
  ('PR_Procedures',      'MSST-PR'),
  ('IN_Instructions',    'MSST-IN'),
  ('GU_Guides',          'MSST-GU'),
  ('TR_Trames',          'MSST-TR'),
  ('EN_Enregistrements', 'MSST-EN')
) AS t(name, code)
ON CONFLICT DO NOTHING;

-- 9. Sous-dossiers types sous Manager_Motiver_Ressources (code=MMR)
INSERT INTO folders (name, code, level, parent_id)
SELECT name, code, 3, (SELECT id FROM folders WHERE code = 'MMR')
FROM (VALUES
  ('FF_Fiches_Fonctions', 'MMR-FF'),
  ('FM_Fiches_Missions',  'MMR-FM'),
  ('PR_Procedures',       'MMR-PR'),
  ('IN_Instructions',     'MMR-IN'),
  ('GU_Guides',           'MMR-GU'),
  ('TR_Trames',           'MMR-TR'),
  ('EN_Enregistrements',  'MMR-EN')
) AS t(name, code)
ON CONFLICT DO NOTHING;

-- 10. Sous-dossiers types sous Piloter_l_Entreprise (code=PE)
INSERT INTO folders (name, code, level, parent_id)
SELECT name, code, 3, (SELECT id FROM folders WHERE code = 'PE')
FROM (VALUES
  ('FF_Fiches_Fonctions', 'PE-FF'),
  ('FM_Fiches_Missions',  'PE-FM'),
  ('PR_Procedures',       'PE-PR'),
  ('IN_Instructions',     'PE-IN'),
  ('GU_Guides',           'PE-GU'),
  ('TR_Trames',           'PE-TR'),
  ('EN_Enregistrements',  'PE-EN')
) AS t(name, code)
ON CONFLICT DO NOTHING;
