-- Migration 008: Remove 'v' prefix from all version identifiers
-- versions.version_letter: "v-" → "-", "vA" → "A", "vA1" → "A1"
UPDATE versions
SET version_letter = SUBSTRING(version_letter FROM 2)
WHERE version_letter LIKE 'v%';

-- documents.current_version: same
UPDATE documents
SET current_version = SUBSTRING(current_version FROM 2)
WHERE current_version LIKE 'v%';

-- documents.validated_version (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'validated_version'
  ) THEN
    UPDATE documents
    SET validated_version = SUBSTRING(validated_version FROM 2)
    WHERE validated_version LIKE 'v%';
  END IF;
END $$;

-- documents.doc_code: "_vA" → "_A", "_vA1" → "_A1"
UPDATE documents
SET doc_code = REGEXP_REPLACE(doc_code, '_v([A-Z][0-9]*)', '_\1')
WHERE doc_code ~ '_v[A-Z]';
