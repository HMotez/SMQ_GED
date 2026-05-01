-- =============================================================
-- Migration 006 — Ajout du dossier MA_Manuel dans tous les
-- processus principaux (même convention que PR, IN, GU, TR, EN)
-- =============================================================

-- CDP-PS (PS_Processus_Strategique)
INSERT INTO folders (name, code, level, parent_id)
SELECT 'MA_Manuel', 'CDP-PS-MA', 4, (SELECT id FROM folders WHERE code = 'CDP-PS')
WHERE EXISTS (SELECT 1 FROM folders WHERE code = 'CDP-PS')
ON CONFLICT DO NOTHING;

-- FESI (Faire_Evoluer_Securiser_SI)
INSERT INTO folders (name, code, level, parent_id)
SELECT 'MA_Manuel', 'FESI-MA', 3, (SELECT id FROM folders WHERE code = 'FESI')
WHERE EXISTS (SELECT 1 FROM folders WHERE code = 'FESI')
ON CONFLICT DO NOTHING;

-- FPS (Fournir_Prestations_Service)
INSERT INTO folders (name, code, level, parent_id)
SELECT 'MA_Manuel', 'FPS-MA', 3, (SELECT id FROM folders WHERE code = 'FPS')
WHERE EXISTS (SELECT 1 FROM folders WHERE code = 'FPS')
ON CONFLICT DO NOTHING;

-- GIET (Gerer_Infrastructure)
INSERT INTO folders (name, code, level, parent_id)
SELECT 'MA_Manuel', 'GIET-MA', 3, (SELECT id FROM folders WHERE code = 'GIET')
WHERE EXISTS (SELECT 1 FROM folders WHERE code = 'GIET')
ON CONFLICT DO NOTHING;

-- MAL (Maitriser_Achats_Logistique)
INSERT INTO folders (name, code, level, parent_id)
SELECT 'MA_Manuel', 'MAL-MA', 3, (SELECT id FROM folders WHERE code = 'MAL')
WHERE EXISTS (SELECT 1 FROM folders WHERE code = 'MAL')
ON CONFLICT DO NOTHING;

-- MSST (Manager_Sante_Securite_Travail)
INSERT INTO folders (name, code, level, parent_id)
SELECT 'MA_Manuel', 'MSST-MA', 3, (SELECT id FROM folders WHERE code = 'MSST')
WHERE EXISTS (SELECT 1 FROM folders WHERE code = 'MSST')
ON CONFLICT DO NOTHING;

-- MMR (Manager_Motiver_Ressources)
INSERT INTO folders (name, code, level, parent_id)
SELECT 'MA_Manuel', 'MMR-MA', 3, (SELECT id FROM folders WHERE code = 'MMR')
WHERE EXISTS (SELECT 1 FROM folders WHERE code = 'MMR')
ON CONFLICT DO NOTHING;

-- PE (Piloter_l_Entreprise)
INSERT INTO folders (name, code, level, parent_id)
SELECT 'MA_Manuel', 'PE-MA', 3, (SELECT id FROM folders WHERE code = 'PE')
WHERE EXISTS (SELECT 1 FROM folders WHERE code = 'PE')
ON CONFLICT DO NOTHING;
