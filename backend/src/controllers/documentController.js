// ============================================================
// controllers/documentController.js
// ACTIA ES — GED Sprint 1 + Carte 4 (Cycle de Vie ISO) + Carte 5 (Recherche & Filtres)
// Adapté exactement à smq_db :
//   - table "status" (pas "statuses")
//   - versions.version_letter (pas version_label)
//   - users.name (pas fullname)
//   - documents.process_id FK vers processes
// ============================================================

const pool = require("../db");
const path = require("path");
const fs   = require("fs");
const { baseDir } = require("../upload");
const { canTransition } = require("../middleware/roleMiddleware");
const { canTransitionToValidated } = require("./validationController");
const {
  triggerStatusNotification,
  triggerNewVersionNotification,
} = require("./notificationController");
const { publishEvent } = require("../kafka/producer");

// ─────────────────────────────────────────────────────────────
// Machine à états ISO — Carte 4
// Transitions autorisées : aucun saut de statut illégal
// ─────────────────────────────────────────────────────────────
const ALLOWED_TRANSITIONS = {
  "Brouillon":           ["En rédaction"],
  "En rédaction":        ["Appel en relecture"],
  "Appel en relecture":  ["En relecture"],
  "En relecture":        ["En correction", "En validation"],
  "En correction":       ["Appel en relecture"],
  "En validation":       ["Validé", "En correction"],
  "Validé":              ["Diffusé", "En rédaction"],
  "Diffusé":             ["Obsolète"],
  "Obsolète":            ["Archivé"],
  "Archivé":             [],           // état terminal
};

// Statuts qui bloquent toute modification de fichier/version
const LOCKED_STATUSES = ["Validé", "Diffusé", "Obsolète", "Archivé"];

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
      origin          = "INTERNE",
      context,
      projectRef,
      keywords,
      sharepoint_link,
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

    // 5. Générer doc_code AES — format {TYPE}{NNNN}_{TitleSlug}_{version} ex: FF0001_Procedure_-
    const seqResult = await client.query(
      `INSERT INTO doc_code_sequences (type_code, process_code, last_number)
       VALUES ($1, 'GLOBAL', 1)
       ON CONFLICT (type_code, process_code)
       DO UPDATE SET last_number = doc_code_sequences.last_number + 1
       RETURNING last_number`,
      [typeCode.toUpperCase()]
    );
    const num       = seqResult.rows[0].last_number;
    const titleSlug = title
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim().split(/\s+/)[0]
      .replace(/^(.)/, c => c.toUpperCase());
    // doc_code inclut la version initiale "-"
    const docCode = `${typeCode.toUpperCase()}${String(num).padStart(4, "0")}_${titleSlug}_-`;

    // 5b. Renommer fichier avec doc_code — EF02
    const fileExt     = path.extname(req.file.originalname);
    const newFileName = `${docCode}${fileExt}`;
    const newFilePath = path.join(path.dirname(req.file.path), newFileName);
    fs.renameSync(req.file.path, newFilePath);
    req.file.path         = newFilePath;
    req.file.originalname = newFileName;
    // Stocker le chemin RELATIF par rapport au baseDir (ex: 01_PS/CDP/PR_Procedures/PR0001.pdf)
    req.file.relativePath = path.relative(baseDir, newFilePath);

    // 6. Keywords array
    const keywordsArray = keywords
      ? keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : null;

    // 7. Status = Brouillon (id=1), version initiale = "v-"
    const statusId       = 1;
    const initialVersion = "v-";

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
        req.file.relativePath, req.file.originalname, req.file.size, req.file.mimetype,
      ]
    );
    const document = docInsert.rows[0];

    // 9. Version initiale "-" (EF04)
    await client.query(
      `INSERT INTO versions
         (document_id, version_letter, file_path, file_name, file_size, mime_type, change_summary, sharepoint_link)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        document.id, initialVersion,
        req.file.relativePath, req.file.originalname, req.file.size, req.file.mimetype,
        "Version initiale", sharepoint_link || null,
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

    // Fire-and-forget Kafka event (after COMMIT — never blocks the response)
    publishEvent("smq.document.created", {
      docId:     document.id,
      docCode:   document.doc_code,
      title:     document.title,
      createdBy: req.currentUser?.name || undefined,
    }, document.id).catch(() => {});

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
// GET /api/documents — Liste avec filtres multicritères + pagination (Carte 5)
// Query params:
//   keyword     — full-text (titre, doc_code, responsable, mots-clés)
//   docCode     — recherche par référence exacte/partielle
//   typeId      — filtre type
//   statusId    — filtre statut
//   processId   — filtre processus
//   responsible — filtre responsable (ILIKE)
//   origin      — INTERNE|EXTERNE
//   folderId    — filtre dossier
//   overdue     — "true" → documents dont next_review_date < aujourd'hui
//   page        — numéro de page (défaut 1)
//   limit       — taille de page (défaut 15, max 100)
// ─────────────────────────────────────────────────────────────
const getDocuments = async (req, res) => {
  try {
    const {
      folderId, typeId, statusId, statusName, keyword, origin,
      processId, responsible, docCode,
      overdue,
      page  = "1",
      limit = "15",
    } = req.query;

    const conditions = [];
    const params     = [];
    let   p          = 1;

    if (folderId)    {
      // Match the folder itself and all its direct children (one level deep)
      conditions.push(`d.folder_id IN (SELECT id FROM folders WHERE id = $${p} OR parent_id = $${p})`);
      params.push(parseInt(folderId, 10));
      p++;
    }
    if (typeId)      { conditions.push(`d.type_id = $${p++}`);              params.push(typeId); }
    if (statusId)    { conditions.push(`d.status_id = $${p++}`);            params.push(statusId); }
    // Filtre par nom de statut (Carte 5 — frontend envoie le nom)
    if (statusName)  { conditions.push(`s.name = $${p++}`);                 params.push(statusName); }
    if (origin)      { conditions.push(`d.origin = $${p++}`);               params.push(origin.toUpperCase()); }
    if (processId)   { conditions.push(`d.process_id = $${p++}`);           params.push(processId); }

    if (responsible) {
      conditions.push(`d.responsible ILIKE $${p++}`);
      params.push(`%${responsible}%`);
    }
    if (docCode) {
      conditions.push(`d.doc_code ILIKE $${p++}`);
      params.push(`%${docCode}%`);
    }
    if (overdue === "true") {
      conditions.push(`d.next_review_date < CURRENT_DATE`);
    }
    if (keyword) {
      conditions.push(
        `(d.title       ILIKE $${p}
          OR d.doc_code ILIKE $${p}
          OR d.responsible ILIKE $${p}
          OR EXISTS (SELECT 1 FROM unnest(d.keywords) k WHERE k ILIKE $${p}))`
      );
      params.push(`%${keyword}%`);
      p++;
    }

    const where    = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const offset   = (pageNum - 1) * limitNum;

    const result = await pool.query(
      `SELECT
         d.id, d.doc_code, d.title, d.responsible,
         d.current_version, d.next_review_date, d.created_at,
         d.origin, d.context, d.keywords, d.file_name, d.file_path,
         f.name  AS folder_name,   f.code  AS folder_code,
         dt.code AS type_code,     dt.label AS type_label,
         s.name  AS status_name,   s.id    AS status_id,
         u.name  AS created_by_name,
         pr.id   AS process_id,    pr.sub_process AS process_name,
         COALESCE(pr.strategic_process, f1.name, f2.name) AS strategic_process,
         COALESCE(pr.main_process,      f2.name)          AS main_process,
         CASE WHEN d.next_review_date IS NOT NULL
                   AND d.next_review_date < CURRENT_DATE
              THEN true ELSE false END   AS is_overdue,
         COUNT(*) OVER()                AS total_count
       FROM documents d
       JOIN folders        f  ON f.id  = d.folder_id
       LEFT JOIN folders   f2 ON f2.id = f.parent_id
       LEFT JOIN folders   f1 ON f1.id = f2.parent_id
       JOIN document_types dt ON dt.id = d.type_id
       JOIN status         s  ON s.id  = d.status_id
       LEFT JOIN users     u  ON u.id  = d.created_by
       LEFT JOIN processes pr ON pr.id = d.process_id
       ${where}
       ORDER BY d.next_review_date ASC NULLS LAST, d.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limitNum, offset]
    );

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const data  = result.rows.map(({ total_count, ...doc }) => doc);

    return res.json({
      data,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
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
         COALESCE(p.strategic_process, f1.name, f2.name) AS strategic_process,
         COALESCE(p.main_process,      f2.name)          AS main_process,
         COALESCE(p.sub_process,       f.name)           AS sub_process
       FROM documents d
       JOIN folders        f  ON f.id  = d.folder_id
       LEFT JOIN folders   f2 ON f2.id = f.parent_id
       LEFT JOIN folders   f1 ON f1.id = f2.parent_id
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

// ─────────────────────────────────────────────────────────────
// PUT /api/documents/:id — Nouvelle version (versioning automatique)
// ─────────────────────────────────────────────────────────────
const updateDocument = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const docId = parseInt(req.params.id, 10);
    const { change_summary, userId, sharepoint_link } = req.body;

    // 1. Récupérer le document avec son statut
    const docResult = await client.query(
      `SELECT d.*, s.name AS status_name, d.validated_version
       FROM documents d
       JOIN status s ON s.id = d.status_id
       WHERE d.id = $1`,
      [docId]
    );
    if (!docResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Document introuvable" });
    }
    const doc = docResult.rows[0];

    // 2. Bloquer si statut verrouillé (Validé, Diffusé, Obsolète, Archivé)
    if (LOCKED_STATUSES.includes(doc.status_name)) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: `Modification impossible : le document est en statut "${doc.status_name}".`,
      });
    }

    // 3. Résumé obligatoire
    if (!change_summary?.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Le résumé des changements est obligatoire." });
    }

    // 4. Fichier obligatoire
    if (!req.file) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Un nouveau fichier est requis pour créer une version." });
    }

    // 5. Incrémenter la version (convention: v- → vA → vA1 → vA2 → vB …)
    //    v-  → vA         (première version)
    //    vA  → vA1        (première correction)
    //    vA1 → vA2 → vA9 (corrections du même cycle)
    //    vA9 (validé) → vB (nouveau cycle)
    //    vB  → vB1 → vB2…
    const cur          = doc.current_version;
    const validatedVer = doc.validated_version; // null if never validated
    let next;
    if (!cur || cur === "-" || cur === "v-") {
      next = "vA";
    } else if (/^v([A-Z])$/i.test(cur)) {
      // Lettre seule ex: "vA" → "vA1"
      const letter = cur.slice(1).toUpperCase();
      next = `v${letter}1`;
    } else {
      const match = cur.match(/^v([A-Z])(\d+)$/i);
      if (!match) {
        next = "vA";
      } else {
        const [, letter, num] = match;
        const L = letter.toUpperCase();
        if (validatedVer && cur === validatedVer) {
          // Version actuelle = validée → nouveau cycle (lettre suivante)
          const nextCode = L.charCodeAt(0) + 1;
          if (nextCode > 90) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Nombre maximum de versions atteint." });
          }
          next = `v${String.fromCharCode(nextCode)}`;
        } else {
          const n = parseInt(num, 10);
          if (n < 9) {
            next = `v${L}${n + 1}`;
          } else {
            const nextCode = L.charCodeAt(0) + 1;
            if (nextCode > 90) {
              await client.query("ROLLBACK");
              return res.status(400).json({ error: "Nombre maximum de versions atteint." });
            }
            next = `v${String.fromCharCode(nextCode)}`;
          }
        }
      }
    }

    // 6. Calculer le nouveau doc_code (remplace le suffixe version)
    //    GU0002_Guide_v-  →  GU0002_Guide_vA
    //    GU0002_Guide_vA  →  GU0002_Guide_vA1
    //    GU0002_Guide_vA1 →  GU0002_Guide_vA2
    const baseCode   = doc.doc_code.replace(/_(?:v-|v[A-Z]\d*|-)$/, "");
    const newDocCode = `${baseCode}_${next}`;

    // 6b. Déplacer vers le bon dossier selon folder_id du document
    const { resolveFolderPath } = require("../upload");
    const folderRel = await resolveFolderPath(doc.folder_id);
    const targetDir = path.join(baseDir, folderRel || "");
    fs.mkdirSync(targetDir, { recursive: true });

    const fileExt        = path.extname(req.file.originalname);
    const newFileName    = `${newDocCode}${fileExt}`;
    const newFilePath    = path.join(targetDir, newFileName);
    fs.renameSync(req.file.path, newFilePath);
    // Chemin relatif par rapport au baseDir
    const newRelFilePath = path.relative(baseDir, newFilePath).replace(/\\/g, "/");

    // 7. Mettre à jour le document (doc_code, version courante + fichier + sharepoint_link)
    await client.query(
      `UPDATE documents
       SET doc_code = $1,
           current_version = $2,
           file_path = $3, file_name = $4,
           file_size = $5, mime_type = $6,
           sharepoint_link = $7
       WHERE id = $8`,
      [newDocCode, next, newRelFilePath, newFileName, req.file.size, req.file.mimetype, sharepoint_link || null, docId]
    );

    // 8. Insérer la nouvelle version dans la table versions
    await client.query(
      `INSERT INTO versions
         (document_id, version_letter, file_path, file_name, file_size, mime_type, change_summary, sharepoint_link)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [docId, next, newRelFilePath, newFileName, req.file.size, req.file.mimetype, change_summary.trim(), sharepoint_link || null]
    );

    // Back-propagate sharepoint_link to v- entry if it has none
    if (sharepoint_link) {
      await client.query(
        `UPDATE versions SET sharepoint_link = $1
         WHERE document_id = $2 AND version_letter IN ('v-', '-')
           AND (sharepoint_link IS NULL OR sharepoint_link = '')`,
        [sharepoint_link, docId]
      );
    }

    // 9a. Log VERSION_SUPERSEDED pour la version remplacée — EF11 (Archivage si version remplacée)
    if (cur !== "-") {
      await client.query(
        `INSERT INTO logs (document_id, action, user_id, details)
         VALUES ($1,$2,$3,$4)`,
        [docId, "VERSION_SUPERSEDED", userId || null,
         JSON.stringify({
           superseded_version: cur,
           new_version:        next,
           doc_code:           doc.doc_code,
           reason:             "Remplacée par une nouvelle version",
         })]
      );
    }

    // 9b. Log NEW_VERSION
    await client.query(
      `INSERT INTO logs (document_id, action, user_id, details)
       VALUES ($1,$2,$3,$4)`,
      [docId, "NEW_VERSION", userId || null,
       JSON.stringify({ from: cur, to: next, change_summary: change_summary.trim() })]
    );

    await client.query("COMMIT");

    // Déclencher les notifications (fire-and-forget)
    triggerNewVersionNotification(
      docId, doc.doc_code, doc.title, next, cur,
      change_summary.trim(), req.currentUser?.name, req.currentUser?.role
    ).catch(err => console.error("[Notif] newVersion error:", err.message));

    return res.status(200).json({ message: `Version ${next} créée avec succès`, version: next });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("🔥 ERROR updateDocument:", err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/documents/:id/status — Changer le statut (Carte 4)
// Machine à états ISO : contrôle des transitions autorisées
// ─────────────────────────────────────────────────────────────
const changeStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const docId = parseInt(req.params.id, 10);
    const { newStatus, userId } = req.body;

    if (!newStatus?.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "newStatus est obligatoire." });
    }

    // 1. Récupérer le document + statut actuel
    const docResult = await client.query(
      `SELECT d.id, d.doc_code, d.title, d.current_version, s.name AS status_name
       FROM documents d
       JOIN status s ON s.id = d.status_id
       WHERE d.id = $1`,
      [docId]
    );
    if (!docResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Document introuvable." });
    }
    const doc = docResult.rows[0];
    const currentStatus = doc.status_name;

    // 2. État terminal : Archivé bloque tout
    if (currentStatus === "Archivé") {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "Document archivé — aucune modification de statut possible.",
      });
    }

    // 3. Vérifier la transition dans la machine à états
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      await client.query("ROLLBACK");
      const allowedStr = allowed.length ? allowed.join(", ") : "aucune (état terminal)";
      return res.status(400).json({
        error: `Transition interdite : "${currentStatus}" → "${newStatus}". Transitions autorisées : ${allowedStr}.`,
      });
    }

    // 3b. Vérifier que le rôle autorise cette transition (EF06)
    const userRole = req.currentUser?.role;
    if (userRole && !canTransition(currentStatus, newStatus, userRole)) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: `Votre rôle (${userRole}) ne peut pas effectuer la transition "${currentStatus}" → "${newStatus}".`,
        code:  "ROLE_TRANSITION_FORBIDDEN",
        yourRole: userRole,
      });
    }

    // 3c. CONSTRAINT ISO EF05: Si transition vers "Validé", vérifier qu'une approbation existe
    if (newStatus === "Validé") {

      // Vérification : seule la décision la plus récente compte
      const valCheck = await client.query(
        `SELECT decision AS latest_decision
         FROM validations
         WHERE document_id = $1
         ORDER BY id DESC
         LIMIT 1`,
        [docId]
      );
      const latestDecision = valCheck.rows[0]?.latest_decision;
      if (!latestDecision || latestDecision !== 'APPROUVÉ') {
        await client.query("ROLLBACK");
        const reason = latestDecision === 'REJETÉ'
          ? "La dernière décision est un rejet — approuvez le document avant de le valider."
          : latestDecision === 'EN_ATTENTE'
            ? "Une décision est en attente — elle doit être traitée avant validation."
            : "Aucune approbation enregistrée. Minimum 1 approbation requise.";
        return res.status(403).json({
          error: `✗ Impossible de valider ce document : ${reason}`,
          code: "VALIDATION_REQUIREMENTS_NOT_MET",
        });
      }
    }

    // 5. Récupérer l'id du nouveau statut
    const statusResult = await client.query(
      "SELECT id FROM status WHERE name = $1",
      [newStatus]
    );
    if (!statusResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Statut inconnu : "${newStatus}".` });
    }
    const newStatusId = statusResult.rows[0].id;

    // 6. Mettre à jour le statut du document
    await client.query(
      "UPDATE documents SET status_id = $1 WHERE id = $2",
      [newStatusId, docId]
    );

    // 6b. Enregistrer la version validée (pour le cycle de versioning A→B)
    if (newStatus === "Validé") {
      await client.query(
        "UPDATE documents SET validated_version = current_version WHERE id = $1",
        [docId]
      );
    }

    // 7. Log enrichi de la transition (EF14 — Enhanced audit trail)
    await client.query(
      `INSERT INTO logs (document_id, action, user_id, details)
       VALUES ($1, $2, $3, $4)`,
      [
        docId, "STATUS_CHANGE", userId || null,
        JSON.stringify({
          from: currentStatus,
          to: newStatus,
          doc_code: doc.doc_code,
          user_role: userRole || "SYSTEM",
          timestamp: new Date().toISOString(),
          ISO_transition: true,
        }),
      ]
    );

    await client.query("COMMIT");

    // Déclencher les notifications (fire-and-forget)
    triggerStatusNotification(
      docId, doc.doc_code, doc.title, currentStatus, newStatus,
      req.currentUser?.name, req.currentUser?.role
    ).catch(err => console.error("[Notif] changeStatus error:", err.message));

    return res.json({
      message: `✓ Statut mis à jour : "${currentStatus}" → "${newStatus}"`,
      previousStatus: currentStatus,
      newStatus,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("🔥 ERROR changeStatus:", err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/statuses — Liste des statuts ISO + transitions (Carte 4)
// ─────────────────────────────────────────────────────────────
const getStatuses = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name FROM status ORDER BY
         CASE name
           WHEN 'Brouillon'     THEN 1
           WHEN 'En rédaction'  THEN 2
           WHEN 'En relecture'  THEN 3
           WHEN 'En validation' THEN 4
           WHEN 'Validé'        THEN 5
           WHEN 'Diffusé'       THEN 6
           WHEN 'Obsolète'      THEN 7
           WHEN 'Archivé'       THEN 8
           ELSE 99
         END`
    );
    const statuses = result.rows.map((s) => ({
      ...s,
      allowedTransitions: ALLOWED_TRANSITIONS[s.name] || [],
      isLocked: LOCKED_STATUSES.includes(s.name),
      isTerminal: s.name === "Archivé",
    }));
    return res.json(statuses);
  } catch (err) {
    console.error("🔥 ERROR getStatuses:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/documents/stats — Statistiques globales (Carte 5)
// Compte par statut + nombre de documents en retard
// ─────────────────────────────────────────────────────────────
const getDocumentStats = async (_req, res) => {
  try {
    const [byStatus, overdue, total] = await Promise.all([
      pool.query(
        `SELECT s.name AS status_name, COUNT(*) AS count
         FROM documents d
         JOIN status s ON s.id = d.status_id
         GROUP BY s.name`
      ),
      pool.query(
        `SELECT COUNT(*) AS count
         FROM documents
         WHERE next_review_date IS NOT NULL
           AND next_review_date < CURRENT_DATE`
      ),
      pool.query(`SELECT COUNT(*) AS count FROM documents`),
    ]);

    const statusCounts = {};
    byStatus.rows.forEach((r) => {
      statusCounts[r.status_name] = parseInt(r.count, 10);
    });

    return res.json({
      total:      parseInt(total.rows[0].count,   10),
      overdue:    parseInt(overdue.rows[0].count, 10),
      byStatus:   statusCounts,
    });
  } catch (err) {
    console.error("🔥 ERROR getDocumentStats:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/documents/filters — Valeurs disponibles pour les filtres (Carte 5)
// Retourne: responsables distincts, processus, types
// ─────────────────────────────────────────────────────────────
const getFilterOptions = async (_req, res) => {
  try {
    const [responsables, processes] = await Promise.all([
      pool.query(
        `SELECT DISTINCT responsible
         FROM documents
         WHERE responsible IS NOT NULL AND responsible <> ''
         ORDER BY responsible`
      ),
      pool.query(
        `SELECT DISTINCT
           p.id,
           p.code,
           p.strategic_process,
           p.main_process,
           p.sub_process,
           COALESCE(p.sub_process, p.main_process, p.strategic_process, p.code, CAST(p.id AS VARCHAR)) AS display_name,
           COALESCE(p.main_process, p.strategic_process, p.code, 'Sans catégorie')                     AS group_name
         FROM processes p
         INNER JOIN documents d ON d.process_id = p.id
         ORDER BY group_name, display_name`
      ),
    ]);

    return res.json({
      responsables: responsables.rows.map((r) => r.responsible),
      processes:    processes.rows,
    });
  } catch (err) {
    console.error("🔥 ERROR getFilterOptions:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ═════════════════════════════════════════════════════════════
// CARTE 6 — ARCHIVAGE AUTOMATIQUE (EF11)
// ═════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// GET /api/documents/archive-candidates
// Documents éligibles à l'archivage automatique :
//   - Diffusé  + next_review_date < today  → à passer Obsolète
//   - Obsolète (déjà en attente d'archivage définitif)
// ─────────────────────────────────────────────────────────────
const getArchiveCandidates = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         d.id, d.doc_code, d.title, d.responsible,
         d.current_version, d.next_review_date, d.created_at,
         s.name  AS status_name,
         f.name  AS folder_name,
         dt.code AS type_code,
         EXTRACT(DAY FROM AGE(CURRENT_DATE, d.next_review_date))::int AS days_overdue
       FROM documents d
       JOIN status         s  ON s.id  = d.status_id
       JOIN folders        f  ON f.id  = d.folder_id
       JOIN document_types dt ON dt.id = d.type_id
       WHERE (
         (s.name = 'Diffusé'  AND d.next_review_date IS NOT NULL AND d.next_review_date < CURRENT_DATE)
         OR s.name = 'Obsolète'
       )
       ORDER BY
         CASE s.name WHEN 'Diffusé' THEN 1 WHEN 'Obsolète' THEN 2 ELSE 3 END,
         d.next_review_date ASC NULLS LAST`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("🔥 ERROR getArchiveCandidates:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/documents/archive-expired — EF11
// Archivage automatique par lot :
//   Diffusé + date dépassée → Obsolète
// Aucun document supprimé (soft-archive uniquement)
// ─────────────────────────────────────────────────────────────
const archiveExpired = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { userId } = req.body;

    // 1. Trouver tous les documents Diffusé avec date dépassée
    const candidates = await client.query(
      `SELECT d.id, d.doc_code, d.next_review_date
       FROM documents d
       JOIN status s ON s.id = d.status_id
       WHERE s.name = 'Diffusé'
         AND d.next_review_date IS NOT NULL
         AND d.next_review_date < CURRENT_DATE`
    );

    if (candidates.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.json({
        message: "Aucun document Diffusé expiré à archiver.",
        count: 0,
        documents: [],
      });
    }

    // 2. Récupérer l'id du statut "Obsolète"
    const { rows: [obsoleteRow] } = await client.query(
      "SELECT id FROM status WHERE name = 'Obsolète'"
    );
    if (!obsoleteRow) {
      await client.query("ROLLBACK");
      return res.status(500).json({ error: "Statut 'Obsolète' introuvable en base." });
    }

    // 3. Passer chaque document en Obsolète + log
    const ids = candidates.rows.map((r) => r.id);
    await client.query(
      "UPDATE documents SET status_id = $1 WHERE id = ANY($2)",
      [obsoleteRow.id, ids]
    );

    for (const doc of candidates.rows) {
      await client.query(
        `INSERT INTO logs (document_id, action, user_id, details)
         VALUES ($1, $2, $3, $4)`,
        [
          doc.id,
          "AUTO_ARCHIVE",
          userId || null,
          JSON.stringify({
            from:             "Diffusé",
            to:               "Obsolète",
            doc_code:         doc.doc_code,
            next_review_date: doc.next_review_date,
            reason:           "Date de révision dépassée — archivage automatique EF11",
          }),
        ]
      );
    }

    await client.query("COMMIT");
    return res.json({
      message: `${candidates.rows.length} document(s) marqué(s) Obsolète automatiquement.`,
      count:     candidates.rows.length,
      documents: candidates.rows.map((r) => r.doc_code),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("🔥 ERROR archiveExpired:", err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/documents/archive-history — EF11
// Historique complet des opérations d'archivage :
//   AUTO_ARCHIVE, VERSION_SUPERSEDED, STATUS_CHANGE (→ Obsolète/Archivé)
// Aucun enregistrement jamais supprimé.
// ─────────────────────────────────────────────────────────────
const getArchiveHistory = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         l.id,
         l.action,
         l.details,
         l.created_at,
         d.doc_code,
         d.title,
         u.name AS user_name
       FROM logs l
       JOIN documents d ON d.id = l.document_id
       LEFT JOIN users u ON u.id = l.user_id
       WHERE l.action IN ('AUTO_ARCHIVE', 'VERSION_SUPERSEDED', 'STATUS_CHANGE')
       ORDER BY l.created_at DESC
       LIMIT 200`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("🔥 ERROR getArchiveHistory:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/documents/archived — Liste des documents Archivés
// Historique conservé — aucune suppression définitive (EF11)
// ─────────────────────────────────────────────────────────────
const getArchivedDocuments = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         d.id, d.doc_code, d.title, d.responsible,
         d.current_version, d.next_review_date, d.created_at,
         s.name  AS status_name,
         f.name  AS folder_name,
         dt.code AS type_code, dt.label AS type_label,
         u.name  AS created_by_name
       FROM documents d
       JOIN status         s  ON s.id  = d.status_id
       JOIN folders        f  ON f.id  = d.folder_id
       JOIN document_types dt ON dt.id = d.type_id
       LEFT JOIN users     u  ON u.id  = d.created_by
       WHERE s.name = 'Archivé'
       ORDER BY d.created_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("🔥 ERROR getArchivedDocuments:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// Fonction interne — appelée au démarrage et par setInterval (EF11)
// Même logique que archiveExpired mais sans réponse HTTP
// ─────────────────────────────────────────────────────────────
const runAutoArchiveJob = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const candidates = await client.query(
      `SELECT d.id, d.doc_code, d.next_review_date
       FROM documents d
       JOIN status s ON s.id = d.status_id
       WHERE s.name = 'Diffusé'
         AND d.next_review_date IS NOT NULL
         AND d.next_review_date < CURRENT_DATE`
    );
    if (candidates.rows.length === 0) {
      await client.query("ROLLBACK");
      console.log("[AUTO-ARCHIVE] Aucun document à archiver.");
      return;
    }
    const { rows: [obsoleteRow] } = await client.query(
      "SELECT id FROM status WHERE name = 'Obsolète'"
    );
    const ids = candidates.rows.map((r) => r.id);
    await client.query(
      "UPDATE documents SET status_id = $1 WHERE id = ANY($2)",
      [obsoleteRow.id, ids]
    );
    for (const doc of candidates.rows) {
      await client.query(
        `INSERT INTO logs (document_id, action, user_id, details) VALUES ($1,$2,$3,$4)`,
        [doc.id, "AUTO_ARCHIVE", null,
         JSON.stringify({ from: "Diffusé", to: "Obsolète", doc_code: doc.doc_code,
                          reason: "Date de révision dépassée — archivage automatique EF11" })]
      );
    }
    await client.query("COMMIT");
    console.log(`[AUTO-ARCHIVE] ${candidates.rows.length} document(s) passé(s) en Obsolète : ${candidates.rows.map(r => r.doc_code).join(", ")}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[AUTO-ARCHIVE] Erreur :", err.message);
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/documents/:id/audit-trail (EF14)
// Historique complet : validations + changements de statut + versions
// Pour traçabilité ISO légale
// ─────────────────────────────────────────────────────────────
const getAuditTrail = async (req, res) => {
  try {
    const docId = parseInt(req.params.id, 10);

    // 1. Vérifier que le document existe
    const docCheck = await pool.query(
      `SELECT id, doc_code, title FROM documents WHERE id = $1`,
      [docId]
    );
    if (!docCheck.rows.length) {
      return res.status(404).json({ error: "Document introuvable." });
    }
    const doc = docCheck.rows[0];

    // 2. Récupérer les logs d'audit
    const logs = await pool.query(
      `SELECT
         l.id, l.action, l.user_id, l.details, l.created_at,
         u.name AS user_name
       FROM logs l
       LEFT JOIN users u ON u.id = l.user_id
       WHERE l.document_id = $1
       ORDER BY l.created_at ASC`,
      [docId]
    );

    // 3. Récupérer les validations
    const validations = await pool.query(
      `SELECT
         id, validator_id, validator_name, decision, comment,
         validated_at, version_letter, signature_hash, is_locked, created_at
       FROM validations
       WHERE document_id = $1
       ORDER BY created_at ASC`,
      [docId]
    );

    // 4. Récupérer les versions
    const versions = await pool.query(
      `SELECT
         id, version_letter, file_name, file_path, file_size, change_summary, created_at
       FROM versions
       WHERE document_id = $1
       ORDER BY created_at ASC`,
      [docId]
    );

    // 5. Créer une chronologie unifiée
    const timeline = [];

    // Ajouter les logs
    logs.rows.forEach((log) => {
      const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
      timeline.push({
        timestamp: log.created_at,
        type: "LOG",
        action: log.action,
        user_id: log.user_id,
        user_name: log.user_name || null,
        details: { ...details, user_name: log.user_name || details?.user_name || null },
      });
    });

    // Ajouter les validations
    validations.rows.forEach((val) => {
      timeline.push({
        timestamp: val.validated_at || val.created_at,
        type: "VALIDATION",
        validator_name: val.validator_name,
        decision: val.decision,
        comment: val.comment,
        version: val.version_letter,
        immutable: val.is_locked,
        signed: !!val.signature_hash,
      });
    });

    // Ajouter les versions
    versions.rows.forEach((ver) => {
      timeline.push({
        timestamp: ver.created_at,
        type: "VERSION",
        version_letter: ver.version_letter,
        file_name: ver.file_name,
        file_size: ver.file_size,
        change_summary: ver.change_summary,
      });
    });

    // Trier par timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.json({
      document: doc,
      audit_summary: {
        total_events: timeline.length,
        logs_count: logs.rows.length,
        validations_count: validations.rows.length,
        versions_count: versions.rows.length,
      },
      timeline,
      validations: validations.rows,
      versions: versions.rows,
    });
  } catch (err) {
    console.error("[EF14] getAuditTrail error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/documents/sync-disk — Admin only
// Lance le script syncDisk.js pour synchroniser le disque ACTIA ES → DB
// ─────────────────────────────────────────────────────────────
async function syncDisk(req, res) {
  const { execFile } = require("child_process");
  const scriptPath   = path.join(__dirname, "../../scripts/syncDisk.js");

  if (!fs.existsSync(scriptPath)) {
    return res.status(500).json({ error: "Script syncDisk.js introuvable." });
  }

  execFile("node", [scriptPath], { timeout: 120000, env: process.env }, (err, stdout, stderr) => {
    if (err) {
      console.error("[syncDisk] Error:", stderr || err.message);
      return res.status(500).json({ error: "Sync échoué.", detail: stderr || err.message });
    }
    console.log("[syncDisk] Done:\n" + stdout);
    return res.json({ success: true, log: stdout });
  });
}

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  getDocumentVersions,
  updateDocument,
  changeStatus,
  getStatuses,
  getDocumentStats,
  getFilterOptions,
  // Carte 6 — Archivage EF11
  getArchiveCandidates,
  archiveExpired,
  getArchiveHistory,
  getArchivedDocuments,
  runAutoArchiveJob,
  // EF14 — Audit trail complet
  getAuditTrail,
  // Sync disque ACTIA ES
  syncDisk,
};
