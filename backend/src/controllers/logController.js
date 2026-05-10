// ============================================================
// controllers/logController.js — Journaux d'audit (Admin + Ing. Qualité)
// ============================================================

// Actions exclues du journal documentaire (toujours, pour tous les rôles)
const SECURITY_ACTIONS = [
  "LOGIN_SUCCESS", "LOGIN_FAILURE", "LOGIN_NEW_IP",
  "LOGOUT", "ACCOUNT_LOCKED",
  "ACCESS_DENIED_401", "ACCESS_DENIED_403",
];

const pool = require("../db");

// ─────────────────────────────────────────────────────────────
// ensureAuditColumns — ajoute ip_address, user_agent, severity
// si absents (migration non-destructive au démarrage)
// ─────────────────────────────────────────────────────────────
async function ensureAuditColumns() {
  await pool.query(`
    ALTER TABLE logs
      ADD COLUMN IF NOT EXISTS ip_address  VARCHAR(64),
      ADD COLUMN IF NOT EXISTS user_agent  TEXT,
      ADD COLUMN IF NOT EXISTS severity    VARCHAR(16) NOT NULL DEFAULT 'info'
        CHECK (severity IN ('info','warning','critical'));
  `);
  // Index pour filtrer rapidement par sévérité et par date (analyse forensique)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_logs_severity   ON logs(severity)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_logs_action     ON logs(action)`);
  console.log("[Logs] Colonnes d'audit vérifiées (ip_address, user_agent, severity).");
}

// ─────────────────────────────────────────────────────────────
// GET /api/logs
// Query params : action, userId, userName, documentId,
//                severity, from, to, limit, offset
// ─────────────────────────────────────────────────────────────
const getLogs = async (req, res) => {
  const {
    action,
    userId,
    userName,
    documentId,
    docRef,
    severity,
    from,
    to,
    limit  = 500,
    offset = 0,
  } = req.query;

  const conditions = [];
  const params     = [];
  let   idx        = 1;

  // Admin voit tous les logs ; les autres rôles voient uniquement les logs documentaires
  if (req.currentUser?.role !== "Admin") {
    const placeholders = SECURITY_ACTIONS.map(() => `$${idx++}`).join(", ");
    SECURITY_ACTIONS.forEach(a => params.push(a));
    conditions.push(`l.action NOT IN (${placeholders})`);
  }

  if (action) {
    conditions.push(`l.action ILIKE $${idx++}`);
    params.push(`%${action}%`);
  }
  if (userId) {
    conditions.push(`l.user_id = $${idx++}`);
    params.push(parseInt(userId));
  }
  if (userName) {
    conditions.push(`u.name ILIKE $${idx++}`);
    params.push(`%${userName}%`);
  }
  if (documentId) {
    conditions.push(`l.document_id = $${idx++}`);
    params.push(parseInt(documentId));
  }
  if (docRef) {
    conditions.push(`d.doc_code ILIKE $${idx++}`);
    params.push(`%${docRef}%`);
  }
  if (severity) {
    conditions.push(`l.severity = $${idx++}`);
    params.push(severity);
  }
  if (from) {
    conditions.push(`l.created_at >= $${idx++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`l.created_at < ($${idx++}::date + INTERVAL '1 day')`);
    params.push(to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM logs l
       LEFT JOIN documents d ON d.id = l.document_id
       LEFT JOIN users     u ON u.id = l.user_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit));
    params.push(parseInt(offset));

    const result = await pool.query(
      `SELECT
         l.id,
         l.action,
         l.severity,
         l.created_at,
         l.details,
         l.ip_address,
         l.user_agent,
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

// ─────────────────────────────────────────────────────────────
// GET /api/logs/actions — types d'actions distincts en base
// ─────────────────────────────────────────────────────────────
const getLogActions = async (_req, res) => {
  try {
    const placeholders = SECURITY_ACTIONS.map((_, i) => `$${i + 1}`).join(", ");
    const result = await pool.query(
      `SELECT DISTINCT action FROM logs WHERE action NOT IN (${placeholders}) ORDER BY action`,
      SECURITY_ACTIONS
    );
    return res.json(result.rows.map(r => r.action));
  } catch (err) {
    console.error("[LOGS] getLogActions error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

module.exports = { getLogs, getLogActions, ensureAuditColumns };
