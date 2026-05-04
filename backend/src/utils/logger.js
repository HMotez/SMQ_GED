// ─────────────────────────────────────────────────────────────
// logger.js — Utilitaire de journalisation centralisé
// Écrit dans /logs/errors.log (erreurs) et /logs/app.log (info)
// ─────────────────────────────────────────────────────────────
const fs   = require("fs");
const path = require("path");

const LOG_DIR   = path.join(__dirname, "../../logs");
const ERROR_LOG = path.join(LOG_DIR, "errors.log");
const APP_LOG   = path.join(LOG_DIR, "app.log");

// Crée le dossier logs si absent
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function getTimestamp() { return new Date().toISOString(); }

// Sérialise et appende une entrée JSON dans le fichier cible
function writeToFile(file, level, category, data) {
  const line = JSON.stringify({ timestamp: getTimestamp(), level, category, ...data }) + "\n";
  fs.appendFile(file, line, (err) => { if (err) console.error("Logger write error:", err); });
}

const error    = (category, data = {}) => { console.error(`[${getTimestamp()}] ERROR [${category}]`, JSON.stringify(data)); writeToFile(ERROR_LOG, "ERROR", category, data); };
const info     = (category, data = {}) => { console.log(`[${getTimestamp()}] INFO [${category}]`, JSON.stringify(data)); writeToFile(APP_LOG, "INFO", category, data); };
const warn     = (category, data = {}) => { console.warn(`[${getTimestamp()}] WARN [${category}]`, JSON.stringify(data)); writeToFile(APP_LOG, "WARN", category, data); };
const security = (event,    data = {}) => { console.warn(`[${getTimestamp()}] SECURITY [${event}]`, JSON.stringify(data)); writeToFile(ERROR_LOG, "SECURITY", event, data); };

module.exports = { error, info, warn, security };
