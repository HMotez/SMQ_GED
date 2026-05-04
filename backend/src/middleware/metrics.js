// ─────────────────────────────────────────────────────────────
// metrics.js — Supervision des performances (Prometheus format)
// Expose /api/metrics pour Prometheus scraping toutes les 15s.
// Métriques : uptime, requêtes HTTP, erreurs 5xx, auth ok/fail,
//             mémoire heap/RSS, charge OS.
// ─────────────────────────────────────────────────────────────
const os = require("os");

// Compteurs en mémoire — remis à zéro au redémarrage du container
const counters = { requests: 0, errors: 0, auth_ok: 0, auth_fail: 0 };
const startTime = Date.now();

// Incrémente le compteur de requêtes à chaque appel entrant
// et comptabilise les erreurs 5xx après que la réponse est envoyée
function metricsMiddleware(req, res, next) {
  counters.requests++;
  res.on("finish", () => { if (res.statusCode >= 500) counters.errors++; });
  next();
}

// Appelé depuis authController après une authentification réussie
function recordAuthSuccess() { counters.auth_ok++; }

// Appelé depuis authController après un échec d'authentification
function recordAuthFailure() { counters.auth_fail++; }

// Génère la réponse texte au format Prometheus (exposition model 0.0.4)
// Content-Type reconnu nativement par Prometheus scraper
function metricsHandler(req, res) {
  const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
  const mem  = process.memoryUsage();
  const load = os.loadavg();

  const lines = [
    `# HELP smq_uptime_seconds Application uptime in seconds`,
    `# TYPE smq_uptime_seconds gauge`,
    `smq_uptime_seconds ${uptimeSec}`,
    `# HELP smq_http_requests_total Total HTTP requests received`,
    `# TYPE smq_http_requests_total counter`,
    `smq_http_requests_total ${counters.requests}`,
    `# HELP smq_http_errors_total Total HTTP 5xx errors`,
    `# TYPE smq_http_errors_total counter`,
    `smq_http_errors_total ${counters.errors}`,
    `# HELP smq_auth_success_total Successful login attempts`,
    `# TYPE smq_auth_success_total counter`,
    `smq_auth_success_total ${counters.auth_ok}`,
    `# HELP smq_auth_failure_total Failed login attempts (wrong password or locked)`,
    `# TYPE smq_auth_failure_total counter`,
    `smq_auth_failure_total ${counters.auth_fail}`,
    `# HELP smq_memory_heap_used_bytes Node.js V8 heap used`,
    `# TYPE smq_memory_heap_used_bytes gauge`,
    `smq_memory_heap_used_bytes ${mem.heapUsed}`,
    `# HELP smq_memory_rss_bytes Node.js resident set size`,
    `# TYPE smq_memory_rss_bytes gauge`,
    `smq_memory_rss_bytes ${mem.rss}`,
    `# HELP smq_os_load_1m OS CPU load average (1 minute)`,
    `# TYPE smq_os_load_1m gauge`,
    `smq_os_load_1m ${load[0].toFixed(4)}`,
    `# HELP smq_os_free_memory_bytes OS free physical memory`,
    `# TYPE smq_os_free_memory_bytes gauge`,
    `smq_os_free_memory_bytes ${os.freemem()}`,
  ];

  res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(lines.join("\n") + "\n");
}

module.exports = { metricsMiddleware, metricsHandler, recordAuthSuccess, recordAuthFailure };
