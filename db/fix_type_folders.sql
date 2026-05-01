-- 1. Remove all wrongly inserted type folders (level defaulted to 1)
DELETE FROM folders
WHERE name IN ('EN_Enregistrements','GU_Guides','IN_Instructions','PR_Procedures','TR_Trames');

-- 2. Re-insert under level-2 folders (no sub-processes) at level 3
--    These are: Maitriser_Achats_Logistique(7), Manager_Sante_Securite_Travail(8),
--               Manager_Motiver_Ressources(9), Piloter_l_Entreprise(10),
--               Faire_Evoluer_Securiser_SI(4), Fournir_Prestations_Service(5),
--               Gerer_Infrastructure_Environnement_Travail(6)
INSERT INTO folders (name, code, level, parent_id)
SELECT t.name, p.code || '-' || t.code, 3, p.id
FROM folders p
CROSS JOIN (VALUES
  ('EN_Enregistrements','EN'),
  ('GU_Guides','GU'),
  ('IN_Instructions','IN'),
  ('PR_Procedures','PR'),
  ('TR_Trames','TR')
) AS t(name, code)
WHERE p.level = 2
ON CONFLICT DO NOTHING;

-- 3. Re-insert under level-3 folders at level 4
INSERT INTO folders (name, code, level, parent_id)
SELECT t.name, p.code || '-' || t.code, 4, p.id
FROM folders p
CROSS JOIN (VALUES
  ('EN_Enregistrements','EN'),
  ('GU_Guides','GU'),
  ('IN_Instructions','IN'),
  ('PR_Procedures','PR'),
  ('TR_Trames','TR')
) AS t(name, code)
WHERE p.level = 3
ON CONFLICT DO NOTHING;

-- 4. Verify
SELECT f.level, f.name, p.name AS parent
FROM folders f
LEFT JOIN folders p ON f.parent_id = p.id
WHERE f.name IN ('EN_Enregistrements','GU_Guides','IN_Instructions','PR_Procedures','TR_Trames')
ORDER BY f.level, p.name, f.name;
