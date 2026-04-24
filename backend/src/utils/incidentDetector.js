// Scans the audit logs table every 30 minutes looking for suspicious patterns.
// When a threshold is crossed, auto-creates a security_incident and emails the admin.

const pool         = require("../db");
const emailService = require("../services/emailService");

const WINDOW_MINUTES = 60;  // look-back window for pattern detection
const INTERVAL_MS    = 30 * 60 * 1000;  // run every 30 minutes

const RULES = [
  {
    // 5+ failed logins from the same IP within 60 min
    type:        "BRUTE_FORCE",
    severity:    "critical",
    action:      "LOGIN_FAILURE",
    groupBy:     "ip_address",
    threshold:   5,
    description: (row) =>
      `Tentative de brute-force détectée : ${row.count} échecs de connexion depuis l'IP ${row.group_value} en moins d'une heure.`,
  },
  {
    // 15+ access denied (403) from the same user within 60 min
    type:        "ACCESS_ABUSE",
    severity:    "warning",
    action:      "ACCESS_DENIED_403",
    groupBy:     "user_id",
    threshold:   15,
    description: (row) =>
      `Abus d'accès détecté : ${row.count} refus d'accès (403) pour l'utilisateur ID ${row.group_value} en moins d'une heure.`,
  },
  {
    // Any new-IP login in the last window
    type:        "SUSPICIOUS_LOGIN",
    severity:    "warning",
    action:      "LOGIN_NEW_IP",
    groupBy:     "user_id",
    threshold:   1,
    description: (row) =>
      `Connexion depuis une nouvelle IP pour l'utilisateur ID ${row.group_value}.`,
  },
  {
    // Any account lock event
    type:        "ACCOUNT_LOCKED",
    severity:    "critical",
    action:      "ACCOUNT_LOCKED",
    groupBy:     "user_id",
    threshold:   1,
    description: (row) =>
      `Compte verrouillé (ID ${row.group_value}) après trop de tentatives échouées.`,
  },
];

async function detectIncidents() {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  for (const rule of RULES) {
    try {
      const groupCol = rule.groupBy === "ip_address" ? "l.ip_address" : "l.user_id";

      const result = await pool.query(
        `SELECT ${groupCol} AS group_value,
                COUNT(*)    AS count,
                MAX(l.ip_address) AS ip_address,
                MAX(l.user_id)    AS user_id
         FROM logs l
         WHERE l.action = $1
           AND l.created_at >= $2
           AND ${groupCol} IS NOT NULL
         GROUP BY ${groupCol}
         HAVING COUNT(*) >= $3`,
        [rule.action, windowStart, rule.threshold]
      );

      for (const row of result.rows) {
        // Deduplicate: skip if an open incident of the same type + group exists
        const dup = await pool.query(
          `SELECT id FROM security_incidents
           WHERE type = $1
             AND status != 'resolved'
             AND detected_at >= $2
             AND (ip_address = $3 OR user_id = $4)
           LIMIT 1`,
          [rule.type, windowStart, row.ip_address, row.user_id]
        );
        if (dup.rows.length) continue;

        const description = rule.description(row);

        await pool.query(
          `INSERT INTO security_incidents (type, severity, description, ip_address, user_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [rule.type, rule.severity, description, row.ip_address, row.user_id]
        );

        console.warn(`[IncidentDetector] Incident créé : ${rule.type} — ${description}`);

        // Email alert to admin
        const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
        if (adminEmail) {
          emailService.sendSecurityAlert({
            to:          adminEmail,
            type:        "incident_detected",
            incidentType: rule.type,
            severity:    rule.severity,
            description,
            ip:          row.ip_address || "inconnue",
            time:        new Date().toLocaleString("fr-FR"),
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error(`[IncidentDetector] Erreur règle ${rule.type}:`, err.message);
    }
  }
}

function startIncidentDetector() {
  detectIncidents();
  setInterval(detectIncidents, INTERVAL_MS);
  console.log(`[IncidentDetector] Démarré — vérification toutes les 30 minutes.`);
}

module.exports = { startIncidentDetector, detectIncidents };
