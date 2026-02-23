// ============================================================
// controllers/validationController.js
// ACTIA ES — GED Sprint 2, Carte 1 : Table Validations (EF05)
//
// Fonctions :
//   ensureValidationsTable  — crée la table si absente
//   createValidation        — POST /api/validations/document/:docId
//   getDocumentValidations  — GET  /api/validations/document/:docId
//   getAllValidations        — GET  /api/validations
//   getValidationStats      — GET  /api/validations/stats
// ============================================================

const pool = require("../db");
const crypto = require("crypto");

// ─────────────────────────────────────────────────────────────
// Helper: Generate signature hash (SHA-256) for audit trail (EF14)
// ─────────────────────────────────────────────────────────────
const generateSignatureHash = (data) => {
  return crypto.createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
};

// ─────────────────────────────────────────────────────────────
// Auto-création de la table (appelée au démarrage du serveur)
// ─────────────────────────────────────────────────────────────
const ensureValidationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS validations (
      id             SERIAL PRIMARY KEY,
      document_id    INTEGER NOT NULL
                       REFERENCES documents(id) ON DELETE CASCADE,
      validator_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
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
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_validations_document_id
      ON validations(document_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_validations_validator_id
      ON validations(validator_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_validations_decision
      ON validations(decision)
  `);
  // ── Migrations colonnes manquantes (table existante sans ces colonnes) ──
  await pool.query(`ALTER TABLE validations ADD COLUMN IF NOT EXISTS version_letter  VARCHAR(5)`);
  await pool.query(`ALTER TABLE validations ADD COLUMN IF NOT EXISTS signature_hash  VARCHAR(512)`);
  await pool.query(`ALTER TABLE validations ADD COLUMN IF NOT EXISTS is_locked       BOOLEAN DEFAULT TRUE`);
  await pool.query(`ALTER TABLE validations ADD COLUMN IF NOT EXISTS validator_name  VARCHAR(255)`);
  console.log("[EF05] Table validations prête.");

  // ── Table logs (audit trail — EF14) ──────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id          SERIAL PRIMARY KEY,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      action      VARCHAR(100) NOT NULL,
      user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      details     JSONB,
      created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_logs_document_id ON logs(document_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action)
  `);
  console.log("[EF14] Table logs prête.");
};

// ─────────────────────────────────────────────────────────────
// POST /api/validations/document/:docId
// Corps : { validatorId, comment, decision, signatureData? }
// 
// CONTRÔLES ISO EF05:
//   ✓ validatorId obligatoire et ≠ responsable du doc
//   ✓ Une validation ≠ plusieurs fois pour le même validateur
//   ✓ Horodatage automatique
//   ✓ Immutabilité après création
//   ✓ Signature numérique (EF14)
// ─────────────────────────────────────────────────────────────
const createValidation = async (req, res) => {
  const { docId } = req.params;
  const {
    validatorId,
    comment  = "",
    decision = "EN_ATTENTE",
    signatureData = null,  // pour audit trail
  } = req.body;

  // 1. Validation de validatorId (OBLIGATOIRE)
  if (!validatorId) {
    return res.status(400).json({
      error: "validatorId est obligatoire. La validation ISO requiert un validateur nommé.",
      code: "VALIDATOR_REQUIRED",
    });
  }

  // 2. Validation de la décision
  const DECISIONS = ["APPROUVÉ", "REJETÉ", "EN_ATTENTE"];
  if (!DECISIONS.includes(decision)) {
    return res.status(400).json({
      error: `Décision invalide. Valeurs acceptées : ${DECISIONS.join(", ")}`,
      code: "INVALID_DECISION",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 3. Vérifier que le document existe + récupérer son responsable
    const docCheck = await client.query(
      `SELECT d.id, d.title, d.doc_code, d.responsible, d.current_version AS version_letter,
              s.name AS status_name, u.id AS responsible_id
       FROM documents d
       JOIN status s ON s.id = d.status_id
       LEFT JOIN users u ON u.name = d.responsible
       WHERE d.id = $1`,
      [docId]
    );
    if (!docCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Document introuvable.", code: "DOC_NOT_FOUND" });
    }

    const doc = docCheck.rows[0];

    // 4. CONSTRAINT ISO EF05: validateur ≠ rédacteur/responsable
    if (parseInt(validatorId) === parseInt(doc.responsible_id)) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "ISO Constraint violée : Le validateur doit être différent du responsable du document.",
        code: "VALIDATOR_CANNOT_BE_RESPONSIBLE",
        details: {
          document_responsible: doc.responsible,
          attempted_validator_id: validatorId,
        },
      });
    }

    // 5. Vérifier l'existance du validateur
    const validatorCheck = await client.query(
      `SELECT id, name FROM users WHERE id = $1`,
      [validatorId]
    );
    if (!validatorCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: `Validateur introuvable (ID: ${validatorId}).`,
        code: "VALIDATOR_NOT_FOUND",
      });
    }
    const validatorName = validatorCheck.rows[0].name;

    // 6. Vérifier qu'une validation APPROUVÉ du même validateur n'existe pas déjà
    // (optionnel selon règles métier — peut être personnalisé)
    const existingValidation = await client.query(
      `SELECT id, decision FROM validations
       WHERE document_id = $1 AND validator_id = $2 AND decision = 'APPROUVÉ'
       LIMIT 1`,
      [docId, validatorId]
    );
    if (existingValidation.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Ce validateur a déjà approuvé ce document. Une validation ID: " + existingValidation.rows[0].id,
        code: "VALIDATION_ALREADY_EXISTS",
      });
    }

    // 7. Générer signature numérique (EF14)
    const signaturePayload = {
      document_id: docId,
      validator_id: validatorId,
      decision,
      timestamp: new Date().toISOString(),
      version: doc.version_letter,
      ...(signatureData || {}),
    };
    const signatureHash = generateSignatureHash(signaturePayload);

    // 8. Insérer la validation IMMUTABLE (is_locked = TRUE toujours)
    const insertRes = await client.query(
      `INSERT INTO validations
         (document_id, validator_id, validator_name, comment, decision, version_letter, signature_hash, is_locked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING id, document_id, validator_id, validator_name, decision, comment, validated_at, version_letter, signature_hash, is_locked, created_at`,
      [docId, validatorId, validatorName, comment.trim(), decision, doc.version_letter || null, signatureHash]
    );

    const validation = insertRes.rows[0];

    // 9. Enregistrer dans les logs d'audit (EF14)
    await client.query(
      `INSERT INTO logs (document_id, action, user_id, details)
       VALUES ($1, $2, $3, $4)`,
      [
        docId,
        "VALIDATION_CREATED",
        req.currentUser?.id || null,
        JSON.stringify({
          validation_id: validation.id,
          validator_id: validatorId,
          validator_name: validatorName,
          decision,
          comment: comment.trim(),
          signature_hash: signatureHash,
          doc_code: doc.doc_code,
          version: doc.version_letter,
        }),
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "✓ Validation enregistrée (ISO immuable).",
      validation: {
        ...validation,
        immutable: true,
        signed: !!signatureHash,
      },
      document: {
        id: doc.id,
        doc_code: doc.doc_code,
        title: doc.title,
        status_name: doc.status_name,
        responsible: doc.responsible,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[EF05] createValidation error:", err.message);
    return res.status(500).json({ error: "Erreur serveur lors de la validation.", debug: err.message });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/validations/document/:docId
// Toutes les validations d'un document donné (ordre antichronologique)
// ─────────────────────────────────────────────────────────────
const getDocumentValidations = async (req, res) => {
  const { docId } = req.params;
  try {
    // Vérifier que le document existe
    const docCheck = await pool.query(
      `SELECT d.id, d.title, d.doc_code, s.name AS status_name
       FROM documents d
       JOIN status s ON s.id = d.status_id
       WHERE d.id = $1`,
      [docId]
    );
    if (!docCheck.rows.length) {
      return res.status(404).json({ error: "Document introuvable." });
    }

    const validationsRes = await pool.query(
      `SELECT
         v.id,
         v.document_id,
         v.validator_id,
         COALESCE(v.validator_name, u.name, 'Inconnu') AS validator_name,
         v.validated_at,
         v.comment,
         v.decision,
         v.version_letter,
         v.created_at
       FROM validations v
       LEFT JOIN users u ON u.id = v.validator_id
       WHERE v.document_id = $1
       ORDER BY v.validated_at DESC`,
      [docId]
    );

    return res.json({
      document:    docCheck.rows[0],
      validations: validationsRes.rows,
      total:       validationsRes.rows.length,
    });
  } catch (err) {
    console.error("[EF05] getDocumentValidations error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/validations
// Toutes les validations (avec pagination + filtres optionnels)
// Query params : page, limit, decision, validatorId, docId
// ─────────────────────────────────────────────────────────────
const getAllValidations = async (req, res) => {
  const {
    page       = 1,
    limit      = 20,
    decision,
    validatorId,
    docId,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params     = [];

  if (decision && ["APPROUVÉ","REJETÉ","EN_ATTENTE"].includes(decision)) {
    params.push(decision);
    conditions.push(`val.decision = $${params.length}`);
  }
  if (validatorId) {
    params.push(parseInt(validatorId));
    conditions.push(`val.validator_id = $${params.length}`);
  }
  if (docId) {
    params.push(parseInt(docId));
    conditions.push(`val.document_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await pool.query(
      `SELECT
         val.id,
         val.document_id,
         d.doc_code,
         d.title         AS doc_title,
         s.name          AS doc_status,
         val.validator_id,
         COALESCE(val.validator_name, u.name, 'Inconnu') AS validator_name,
         val.validated_at,
         val.comment,
         val.decision,
         val.version_letter,
         val.created_at,
         COUNT(*) OVER()::int AS total_count
       FROM validations val
       JOIN documents   d ON d.id  = val.document_id
       JOIN status      s ON s.id  = d.status_id
       LEFT JOIN users  u ON u.id  = val.validator_id
       ${where}
       ORDER BY val.validated_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    const total = result.rows[0]?.total_count ?? 0;
    return res.json({
      data: result.rows,
      pagination: {
        page:        parseInt(page),
        limit:       parseInt(limit),
        total,
        totalPages:  Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("[EF05] getAllValidations error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/validations/stats
// Comptages par décision + documents "En validation" en attente
// ─────────────────────────────────────────────────────────────
const getValidationStats = async (req, res) => {
  try {
    const [decisionsRes, pendingDocsRes] = await Promise.all([
      pool.query(
        `SELECT decision, COUNT(*)::int AS count
         FROM validations
         GROUP BY decision`
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM documents d
         JOIN status s ON s.id = d.status_id
         WHERE s.name = 'En validation'`
      ),
    ]);

    const counts = { APPROUVÉ: 0, REJETÉ: 0, EN_ATTENTE: 0 };
    decisionsRes.rows.forEach((r) => { counts[r.decision] = r.count; });

    return res.json({
      decisions:           counts,
      total:               Object.values(counts).reduce((a, b) => a + b, 0),
      pending_docs_count:  pendingDocsRes.rows[0]?.count ?? 0,
    });
  } catch (err) {
    console.error("[EF05] getValidationStats error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/validations/pending-docs
// Documents actuellement en statut "En validation"
// ─────────────────────────────────────────────────────────────
const getPendingDocuments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         d.id,
         d.doc_code,
         d.title,
         d.responsible,
         s.name              AS status_name,
         dt.code             AS type_code,
         p.sub_process       AS process_name,
         f.name              AS folder_name,
         d.current_version   AS version_letter,
         d.next_review_date,

         -- Dernière validation enregistrée pour ce doc
         last_v.decision         AS last_decision,
         last_v.validator_name   AS last_validator,
         last_v.validated_at     AS last_validated_at,
         last_v.comment          AS last_comment,

         -- Nombre total de validations pour ce doc
         (SELECT COUNT(*) FROM validations WHERE document_id = d.id)::int AS validation_count

       FROM documents d
       JOIN status             s  ON s.id  = d.status_id
       JOIN document_types     dt ON dt.id = d.type_id
       LEFT JOIN processes     p  ON p.id  = d.process_id
       LEFT JOIN folders       f  ON f.id  = d.folder_id

       -- Dernière validation (subquery)
       LEFT JOIN LATERAL (
         SELECT validator_name, decision, validated_at, comment
         FROM validations
         WHERE document_id = d.id
         ORDER BY validated_at DESC
         LIMIT 1
       ) last_v ON TRUE

       WHERE s.name = 'En validation'
       ORDER BY d.doc_code`,
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[EF05] getPendingDocuments error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────
// hasRequiredApprovals (EF05 + EF14)
// Vérifie qu'un document a au moins une validation APPROUVÉ
// Utilisé dans changeStatus avant transition vers "Validé"
// ─────────────────────────────────────────────────────────────
const hasRequiredApprovals = async (documentId) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS approval_count
       FROM validations
       WHERE document_id = $1 AND decision = 'APPROUVÉ'`,
      [documentId]
    );
    return result.rows[0]?.approval_count > 0;
  } catch (err) {
    console.error("[EF05] hasRequiredApprovals error:", err.message);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────
// getValidationSummary (EF05 + EF14)
// Résumé complet des validations d'un document
// ─────────────────────────────────────────────────────────────
const getValidationSummary = async (req, res) => {
  const { docId } = req.params;
  try {
    // Vérifier que le document existe
    const docCheck = await pool.query(
      `SELECT d.id, d.doc_code, d.title, s.name AS status_name
       FROM documents d
       JOIN status s ON s.id = d.status_id
       WHERE d.id = $1`,
      [docId]
    );
    if (!docCheck.rows.length) {
      return res.status(404).json({ error: "Document introuvable." });
    }

    const doc = docCheck.rows[0];

    // Récupérer les validations avec statistiques
    const validationsRes = await pool.query(
      `SELECT
         decision,
         COUNT(*)::int AS count,
         JSON_AGG(
           JSON_BUILD_OBJECT(
             'id', id,
             'validator_name', validator_name,
             'validated_at', validated_at,
             'comment', comment,
             'signature_hash', signature_hash
           ) ORDER BY validated_at DESC
         ) AS validators
       FROM validations
       WHERE document_id = $1
       GROUP BY decision
       ORDER BY decision DESC`,
      [docId]
    );

    // Compter les approbations
    const approvalCount = validationsRes.rows
      .find(r => r.decision === 'APPROUVÉ')?.count || 0;

    return res.json({
      document: doc,
      summary: {
        total_validations: validationsRes.rows.reduce((sum, r) => sum + r.count, 0),
        approvals: approvalCount,
        rejections: validationsRes.rows.find(r => r.decision === 'REJETÉ')?.count || 0,
        pending: validationsRes.rows.find(r => r.decision === 'EN_ATTENTE')?.count || 0,
        can_transition_to_validated: approvalCount > 0,
      },
      by_decision: validationsRes.rows,
    });
  } catch (err) {
    console.error("[EF05] getValidationSummary error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────
// canTransitionToValidated (EF05)
// Vérifie les conditions ISO pour passer à "Validé"
// Exportée pour utilisation dans documentController
// ─────────────────────────────────────────────────────────────
const canTransitionToValidated = async (documentId) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(CASE WHEN decision = 'APPROUVÉ' THEN 1 END)::int AS approvals,
         COUNT(CASE WHEN decision = 'REJETÉ' THEN 1 END)::int AS rejections,
         COUNT(CASE WHEN decision = 'EN_ATTENTE' THEN 1 END)::int AS pending,
         COUNT(*)::int AS total
       FROM validations
       WHERE document_id = $1`,
      [documentId]
    );

    const stats = result.rows[0];

    // Conditions ISO EF05 :
    // ✓ Au moins une validation APPROUVÉ
    // ✓ Zéro validation REJETÉ
    // ✓ Zéro validation EN_ATTENTE
    const canTransition = stats.approvals > 0 && stats.rejections === 0 && stats.pending === 0;

    return {
      can_transition: canTransition,
      reason: canTransition ? null : getTransitionBlockReason(stats),
      stats,
    };
  } catch (err) {
    console.error("[EF05] canTransitionToValidated error:", err.message);
    return {
      can_transition: false,
      reason: "Erreur lors de la vérification des validations.",
      stats: null,
    };
  }
};

// ─────────────────────────────────────────────────────────────
// Helper: getTransitionBlockReason
// Explique pourquoi la transition vers "Validé" est bloquée
// ─────────────────────────────────────────────────────────────
const getTransitionBlockReason = (stats) => {
  if (stats.total === 0) {
    return "Aucune validation enregistrée. Minimum 1 approbation requise.";
  }
  if (stats.approvals === 0) {
    return `Pas d'approbation. Statuts actuels : ${stats.rejections} rejet(s), ${stats.pending} en attente.`;
  }
  if (stats.rejections > 0) {
    return `Impossible avec ${stats.rejections} rejet(s). Archiver ou corriger le document.`;
  }
  if (stats.pending > 0) {
    return `${stats.pending} validation(s) en attente. Attendre ou finaliser les validations.`;
  }
  return "Conditions ISO non satisfaites.";
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/validations/:validationId — Tentative de modification (EF14)
// BLOQUÉE : Validations sont IMMUABLES après création
// Renvoie une erreur 403 + log d'audit
// ─────────────────────────────────────────────────────────────
const attemptUpdateValidation = async (req, res) => {
  const { validationId } = req.params;
  
  try {
    // Vérifier que la validation existe
    const validationCheck = await pool.query(
      `SELECT id, is_locked, document_id FROM validations WHERE id = $1`,
      [validationId]
    );
    
    if (!validationCheck.rows.length) {
      return res.status(404).json({
        error: "Validation introuvable.",
        code: "VALIDATION_NOT_FOUND",
      });
    }

    const validation = validationCheck.rows[0];

    // Le système gère TOUJOURS les validations comme immuables (is_locked = TRUE)
    // Loger la tentative d'édition (audit trail — EF14)
    await pool.query(
      `INSERT INTO logs (document_id, action, user_id, details)
       VALUES ($1, $2, $3, $4)`,
      [
        validation.document_id,
        "VALIDATION_EDIT_ATTEMPT_BLOCKED",
        req.currentUser?.id || null,
        JSON.stringify({
          validation_id: validationId,
          reason: "Validation immuable - contrainte ISO EF05",
          attempted_changes: req.body,
        }),
      ]
    );

    return res.status(403).json({
      error: "✗ ISO Constraint : Les validations sont immuables après création. Aucune modification n'est autorisée.",
      code: "VALIDATION_IMMUTABLE",
      details: {
        validation_id: validationId,
        is_locked: validation.is_locked,
        reason: "Pour garantir la traçabilité légale et ISO, toute validation est définitive.",
      },
    });
  } catch (err) {
    console.error("[EF14] attemptUpdateValidation error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/validations/:validationId — Tentative de suppression (EF14)
// BLOQUÉE : Validations ne peuvent JAMAIS être supprimées
// ─────────────────────────────────────────────────────────────
const attemptDeleteValidation = async (req, res) => {
  const { validationId } = req.params;
  
  try {
    const validationCheck = await pool.query(
      `SELECT id, document_id FROM validations WHERE id = $1`,
      [validationId]
    );
    
    if (!validationCheck.rows.length) {
      return res.status(404).json({ error: "Validation introuvable." });
    }

    // Loger la tentative de suppression (audit trail)
    await pool.query(
      `INSERT INTO logs (document_id, action, user_id, details)
       VALUES ($1, $2, $3, $4)`,
      [
        validationCheck.rows[0].document_id,
        "VALIDATION_DELETE_ATTEMPT_BLOCKED",
        req.currentUser?.id || null,
        JSON.stringify({
          validation_id: validationId,
          reason: "Archivage légal et traçabilité ISO",
        }),
      ]
    );

    return res.status(403).json({
      error: "✗ ISO Constraint : Les validations ne peuvent jamais être supprimées (archivage légal).",
      code: "VALIDATION_CANNOT_BE_DELETED",
      details: {
        validation_id: validationId,
        reason: "Documentation exhaustive de l'historique est une exigence légale.",
      },
    });
  } catch (err) {
    console.error("[EF14] attemptDeleteValidation error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

module.exports = {
  ensureValidationsTable,
  createValidation,
  getDocumentValidations,
  getAllValidations,
  getValidationStats,
  getPendingDocuments,
  getValidationSummary,
  canTransitionToValidated,
  hasRequiredApprovals,
  attemptUpdateValidation,
  attemptDeleteValidation,
};
