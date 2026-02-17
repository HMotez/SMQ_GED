// ============================================================
// controllers/documentController.js
// ACTIA ES — GED Sprint 1
// Adapté exactement à smq_db :
//   - table "status" (pas "statuses")
//   - versions.version_letter (pas version_label)
//   - users.name (pas fullname)
//   - documents.process_id FK vers processes
// ============================================================

const pool = require("../db");
const path = require("path");
const fs   = require("fs");

// ─────────────────────────────────────────────────────────────
// POST /api/documents — Créer un document
// ─────────────────────────────────────────────────────────────
const createDocument = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      title,
      responsible,
      nextReviewDate,
      folderId,
      typeCode,
      userId,
      processId,
      origin     = "INTERNE",
      context,
      projectRef,
      keywords,
    } = req.body;

    // 1. Validation champs obligatoires
    const missing = [];
    if (!title)          missing.push("title");
    if (!responsible)    missing.push("responsible");
    if (!nextReviewDate) missing.push("nextReviewDate");
    if (!folderId)       missing.push("folderId");
    if (!typeCode)       missing.push("typeCode");
    if (!req.file)       missing.push("file");

    if (missing.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Champs obligatoires manquants",
        missingFields: missing,
      });
    }

    // 2. Vérifier le dossier + récupérer son code
    const folderResult = await client.query(
      "SELECT id, name, code FROM folders WHERE id = $1",
      [folderId]
    );
    if (!folderResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Dossier introuvable." });
    }
    const folderCode = folderResult.rows[0].code;
    if (!folderCode) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Ce dossier n'a pas de code — impossible de générer le doc_code." });
    }

    // 3. Vérifier le type documentaire
    const typeResult = await client.query(
      "SELECT id FROM document_types WHERE code = $1",
      [typeCode.toUpperCase()]
    );
    if (!typeResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: `Type inconnu : "${typeCode}". Valides : PR, IN, GU, MN, TR, EN, FM, FF, PT, EX`,
      });
    }
    const typeId = typeResult.rows[0].id;

    // 4. Valider origin
    if (!["INTERNE", "EXTERNE"].includes(origin.toUpperCase())) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Origin invalide : INTERNE ou EXTERNE." });
    }

    // 5. Générer doc_code atomique — jamais réutilisé (EF02)
    const seqResult = await client.query(
      `INSERT INTO doc_code_sequences (type_code, process_code, last_number)
       VALUES ($1, $2, 1)
       ON CONFLICT (type_code, process_code)
       DO UPDATE SET last_number = doc_code_sequences.last_number + 1
       RETURNING last_number`,
      [typeCode.toUpperCase(), folderCode]
    );
    const num     = seqResult.rows[0].last_number;
    const docCode = `${typeCode.toUpperCase()}-${folderCode}-${String(num).padStart(4, "0")}`;

    // 5b. Renommer fichier avec doc_code — EF02 (visible dans nom fichier)
    const fileExt     = path.extname(req.file.originalname);
    const newFileName = `${docCode}${fileExt}`;
    const newFilePath = path.join(path.dirname(req.file.path), newFileName);
    fs.renameSync(req.file.path, newFilePath);
    req.file.path         = newFilePath;
    req.file.originalname = newFileName;

    // 6. Keywords array
    const keywordsArray = keywords
      ? keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : null;

    // 7. Status = Brouillon (id=1), version initiale = "-"
    const statusId       = 1;
    const initialVersion = "-";

    // 8. Insérer le document
    const docInsert = await client.query(
      `INSERT INTO documents
         (doc_code, title, responsible, next_review_date,
          status_id, current_version, folder_id, type_id,
          process_id, created_by,
          origin, context, project_ref, keywords,
          file_path, file_name, file_size, mime_type)
       VALUES
         ($1,$2,$3,$4,
          $5,$6,$7,$8,
          $9,$10,
          $11,$12,$13,$14,
          $15,$16,$17,$18)
       RETURNING *`,
      [
        docCode, title, responsible, nextReviewDate,
        statusId, initialVersion, folderId, typeId,
        processId || null, userId || null,
        origin.toUpperCase(), context || null, projectRef || null, keywordsArray,
        req.file.path, req.file.originalname, req.file.size, req.file.mimetype,
      ]
    );
    const document = docInsert.rows[0];

    // 9. Version initiale "-" (EF04)
    await client.query(
      `INSERT INTO versions
         (document_id, version_letter, file_path, file_name, file_size, mime_type, change_summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        document.id, initialVersion,
        req.file.path, req.file.originalname, req.file.size, req.file.mimetype,
        "Version initiale",
      ]
    );

    // 10. Log CREATE (EF14)
    await client.query(
      `INSERT INTO logs (document_id, action, user_id, details)
       VALUES ($1,$2,$3,$4)`,
      [
        document.id, "CREATE_DOCUMENT", userId || null,
        JSON.stringify({ doc_code: docCode, typeCode, origin, folderCode }),
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Document créé avec succès",
      document: {
        id: document.id, doc_code: document.doc_code,
        title: document.title, responsible: document.responsible,
        origin: document.origin, context: document.context,
        keywords: document.keywords, next_review_date: document.next_review_date,
        status_id: document.status_id, current_version: document.current_version,
        folder_id: document.folder_id, type_id: document.type_id,
        process_id: document.process_id, file_name: document.file_name,
        created_by: document.created_by, created_at: document.created_at,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("🔥 ERROR createDocument:", err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/documents — Liste avec filtres (EF13)
// ─────────────────────────────────────────────────────────────
const getDocuments = async (req, res) => {
  try {
    const { folderId, typeId, statusId, keyword, origin } = req.query;
    const conditions = [];
    const params = [];
    let p = 1;

    if (folderId) { conditions.push(`d.folder_id = $${p++}`); params.push(folderId); }
    if (typeId)   { conditions.push(`d.type_id = $${p++}`);   params.push(typeId); }
    if (statusId) { conditions.push(`d.status_id = $${p++}`); params.push(statusId); }
    if (origin)   { conditions.push(`d.origin = $${p++}`);    params.push(origin.toUpperCase()); }
    if (keyword)  {
      conditions.push(`(d.title ILIKE $${p} OR d.doc_code ILIKE $${p})`);
      params.push(`%${keyword}%`);
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT
         d.id, d.doc_code, d.title, d.responsible,
         d.current_version, d.next_review_date, d.created_at,
         d.origin, d.context, d.keywords, d.file_name,
         f.name  AS folder_name,  f.code   AS folder_code,
         dt.code AS type_code,    dt.label AS type_label,
         s.name  AS status_name,
         u.name  AS created_by_name
       FROM documents d
       JOIN folders        f  ON f.id  = d.folder_id
       JOIN document_types dt ON dt.id = d.type_id
       JOIN status         s  ON s.id  = d.status_id
       LEFT JOIN users     u  ON u.id  = d.created_by
       ${where}
       ORDER BY d.created_at DESC`,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("🔥 ERROR getDocuments:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/documents/:id
// ─────────────────────────────────────────────────────────────
const getDocumentById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         d.*,
         f.name  AS folder_name,   f.code  AS folder_code,
         dt.code AS type_code,     dt.label AS type_label,
         s.name  AS status_name,
         u.name  AS created_by_name,
         p.code  AS process_code,
         p.strategic_process, p.main_process, p.sub_process
       FROM documents d
       JOIN folders        f  ON f.id  = d.folder_id
       JOIN document_types dt ON dt.id = d.type_id
       JOIN status         s  ON s.id  = d.status_id
       LEFT JOIN users     u  ON u.id  = d.created_by
       LEFT JOIN processes p  ON p.id  = d.process_id
       WHERE d.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: "Document introuvable" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("🔥 ERROR getDocumentById:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/documents/:id/versions (EF04)
// ─────────────────────────────────────────────────────────────
const getDocumentVersions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM versions WHERE document_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("🔥 ERROR getDocumentVersions:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { createDocument, getDocuments, getDocumentById, getDocumentVersions };