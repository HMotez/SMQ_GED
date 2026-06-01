// ─────────────────────────────────────────────────────────────
// utils/auditLog.js
// RÔLE : Fonction partagée d'écriture dans le journal d'audit DB.
//        Insère une entrée dans la table logs avec :
//          action, user_id, document_id, details (JSONB),
//          severity (info/warning/critical), ip_address, user_agent
//        Utilisé par roleMiddleware (accès refusés), authController
//        (login/logout), documentController (CRUD + transitions),
//        validationController (créations immuables).
//        Ne lance jamais d'exception — une erreur de log ne doit
//        pas bloquer la requête principale.
// ─────────────────────────────────────────────────────────────

const pool = require("../db");

// severity: 'info' | 'warning' | 'critical'
async function auditLog({ action, userId = null, documentId = null, details = {}, severity = "info", req = null }) {
  const ip        = req ? (req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket?.remoteAddress || null) : null;
  const userAgent = req ? (req.headers["user-agent"] || null) : null;

  try {
    await pool.query(
      `INSERT INTO logs (action, user_id, document_id, details, severity, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [action, userId, documentId, JSON.stringify(details), severity, ip, userAgent]
    );
  } catch (err) {
    // Never crash the request because of a logging failure
    console.error("[auditLog] insert error:", err.message);
  }
}

module.exports = { auditLog };
