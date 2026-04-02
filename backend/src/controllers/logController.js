// ============================================================
// controllers/logController.js — Consultation des logs (Admin)
// ============================================================

const pool = require("../db");

// ─────────────────────────────────────────────────────────────
// GET /api/logs — Liste paginée avec filtres optionnels
// Query params : action, userId, documentId, from, to, limit, offset
// ─────────────────────────────────────────────────────────────
const getLogs = async (req, res) => {
  const {
    action,
    userId,
    documentId,
    from,
    to,
    limit  = 500,
    offset = 0,
  } = req.query;

  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (action) {
    conditions.push(`l.action ILIKE $${idx++}`);
    params.push(`%${action}%`);
  }
  if (userId) {
    conditions.push(`l.user_id = $${idx++}`);
    params.push(parseInt(userId));
  }
  if (documentId) {
    conditions.push(`l.document_id = $${idx++}`);
    params.push(parseInt(documentId));
  }
  if (from) {
    conditions.push(`l.created_at >= $${idx++}`);
    params.push(from);
  }
  if (to) {
    // Inclure toute la journée "to"
    conditions.push(`l.created_at < ($${idx++}::date + INTERVAL '1 day')`);
    params.push(to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM logs l ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit));
    params.push(parseInt(offset));

    const result = await pool.query(
      `SELECT
         l.id,
         l.action,
         l.created_at,
         l.details,
         l.document_id,
         d.title        AS document_title,
         d.doc_code     AS document_reference,
         l.user_id,
         u.name         AS user_name,
         u.email        AS user_email
       FROM logs l
       LEFT JOIN documents d ON d.id = l.document_id
       LEFT JOIN users     u ON u.id = l.user_id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );

    return res.json({ total, logs: result.rows });
  } catch (err) {
    console.error("[LOGS] getLogs error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

module.exports = { getLogs };
