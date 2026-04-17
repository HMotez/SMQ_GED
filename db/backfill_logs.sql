-- =============================================================
-- backfill_logs.sql — Génère les logs manquants pour les
-- documents insérés directement via SQL (seed)
-- Exécuter avec :
--   docker exec -i smq_db psql -U postgres -d smq_db < db/backfill_logs.sql
-- =============================================================

BEGIN;

-- CREATE_DOCUMENT pour tous les documents sans log de création
INSERT INTO logs (document_id, action, user_id, details, created_at)
SELECT
  d.id,
  'CREATE_DOCUMENT',
  d.created_by,
  jsonb_build_object(
    'typeCode',   dt.code,
    'origin',     COALESCE(d.origin, 'INTERNE'),
    'folderCode', f.code
  ),
  d.created_at
FROM documents d
LEFT JOIN document_types dt ON dt.id = d.type_id
LEFT JOIN folders        f  ON f.id  = d.folder_id
WHERE NOT EXISTS (
  SELECT 1 FROM logs l
  WHERE l.document_id = d.id AND l.action = 'CREATE_DOCUMENT'
);

-- STATUS_CHANGE vers le statut courant pour les docs non-Brouillon
-- (simule la mise en circulation des docs déjà diffusés/validés)
INSERT INTO logs (document_id, action, user_id, details, created_at)
SELECT
  d.id,
  'STATUS_CHANGE',
  d.created_by,
  jsonb_build_object(
    'from', 'Brouillon',
    'to',   s.name
  ),
  d.created_at + INTERVAL '1 minute'
FROM documents d
JOIN status s ON s.id = d.status_id
WHERE s.name <> 'Brouillon'
  AND NOT EXISTS (
    SELECT 1 FROM logs l
    WHERE l.document_id = d.id AND l.action = 'STATUS_CHANGE'
  );

COMMIT;

SELECT
  action,
  COUNT(*) AS nb
FROM logs
GROUP BY action
ORDER BY nb DESC;
