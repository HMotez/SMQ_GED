// ============================================================
// controllers/incidentController.js — Incidents de sécurité
//
// Gère la table security_incidents créée par ensureIncidentsTable().
// Les incidents sont générés automatiquement par incidentDetector.js
// (ex: brute force, accès abusifs) et peuvent aussi être créés
// manuellement par l'Admin via POST /api/incidents.
//
// Sévérité : info | warning | critical
// Statut   : open → in_progress → resolved
//   Quand resolved : resolved_by = Admin, resolved_at = NOW()
//
// Colonnes indexées : status, severity, detected_at DESC
// Jointures : user_id → users (victime), resolved_by → users (admin)
// ============================================================

const pool = require("../db");

async function ensureIncidentsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS security_incidents (
      id           SERIAL PRIMARY KEY,
      type         VARCHAR(50)  NOT NULL,
      severity     VARCHAR(16)  NOT NULL DEFAULT 'warning'
                     CHECK (severity IN ('info','warning','critical')),
      description  TEXT         NOT NULL,
      ip_address   VARCHAR(64),
      user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
      detected_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      status       VARCHAR(20)  NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','in_progress','resolved')),
      resolved_at  TIMESTAMP WITH TIME ZONE,
      resolved_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      notes        TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_incidents_status      ON security_incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_severity    ON security_incidents(severity);
    CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON security_incidents(detected_at DESC);
  `);
  console.log("[Incidents] Table security_incidents vérifiée.");
}

// GET /api/incidents
const getIncidents = async (req, res) => {
  const { status, severity, limit = 100, offset = 0 } = req.query;
  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (status)   { conditions.push(`i.status = $${idx++}`);   params.push(status); }
  if (severity) { conditions.push(`i.severity = $${idx++}`); params.push(severity); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const count = await pool.query(
      `SELECT COUNT(*) FROM security_incidents i ${where}`, params
    );
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(
      `SELECT
         i.*,
         u.name  AS user_name,
         u.email AS user_email,
         r.name  AS resolved_by_name
       FROM security_incidents i
       LEFT JOIN users u ON u.id = i.user_id
       LEFT JOIN users r ON r.id = i.resolved_by
       ${where}
       ORDER BY i.detected_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );
    return res.json({ total: parseInt(count.rows[0].count), incidents: result.rows });
  } catch (err) {
    console.error("[Incidents] getIncidents error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// PUT /api/incidents/:id — mettre à jour le statut
const updateIncident = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const userId = req.currentUser?.id;

  const validStatuses = ["open", "in_progress", "resolved"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Statut invalide. Valeurs : ${validStatuses.join(", ")}` });
  }

  try {
    const result = await pool.query(
      `UPDATE security_incidents
       SET status      = $1,
           notes       = COALESCE($2, notes),
           resolved_by = CASE WHEN $1 = 'resolved' THEN $3 ELSE resolved_by END,
           resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END
       WHERE id = $4
       RETURNING *`,
      [status, notes || null, userId, parseInt(id)]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Incident introuvable." });

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("[Incidents] updateIncident error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// POST /api/incidents — créer manuellement un incident
const createIncident = async (req, res) => {
  const { type, severity = "warning", description, ip_address, user_id } = req.body;
  if (!type || !description)
    return res.status(400).json({ error: "type et description requis." });

  try {
    const result = await pool.query(
      `INSERT INTO security_incidents (type, severity, description, ip_address, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [type, severity, description, ip_address || null, user_id || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[Incidents] createIncident error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

module.exports = { ensureIncidentsTable, getIncidents, updateIncident, createIncident };
