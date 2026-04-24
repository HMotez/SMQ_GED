// Shared helper — writes a security/audit event to the logs table.
// Columns ip_address, user_agent, severity are added at startup by ensureAuditColumns().

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
