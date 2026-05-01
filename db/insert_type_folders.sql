DO $$
DECLARE
  parent RECORD;
  type_name TEXT;
  type_names TEXT[] := ARRAY[
    'EN_Enregistrements',
    'GU_Guides',
    'IN_Instructions',
    'PR_Procedures',
    'TR_Trames'
  ];
BEGIN
  FOR parent IN
    SELECT id, name FROM folders
    WHERE parent_id IS NOT NULL
    AND name NOT LIKE 'EN_%' AND name NOT LIKE 'GU_%'
    AND name NOT LIKE 'IN_%' AND name NOT LIKE 'PR_%'
    AND name NOT LIKE 'TR_%'
  LOOP
    FOREACH type_name IN ARRAY type_names LOOP
      INSERT INTO folders (name, parent_id)
      VALUES (type_name, parent.id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

SELECT f.id, f.name, p.name AS parent
FROM folders f
JOIN folders p ON f.parent_id = p.id
WHERE f.name IN ('EN_Enregistrements','GU_Guides','IN_Instructions','PR_Procedures','TR_Trames')
ORDER BY p.name, f.name;
