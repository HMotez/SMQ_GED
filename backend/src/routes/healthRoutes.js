// ============================================================
// routes/healthRoutes.js — Supervision des performances
// GET /api/health — répond avec un snapshot système :
//   • uptime process + OS
//   • CPU load average (1m / 5m / 15m) et nombre de cœurs
//   • Mémoire système (total / libre / %) + heap Node.js
//   • Latence PostgreSQL (SELECT 1) et statut DB (ok / error)
// Utilisé par le tableau de bord Admin et les outils de monitoring
// (Prometheus, Grafana, healthcheck Docker).
// ============================================================
const express = require("express");
const os      = require("os");
const pool = require("../db");

const router = express.Router();

// GET /api/health — supervision continue des performances
router.get("/", async (req, res) => {
  const start = Date.now();

  // DB latency
  let dbStatus = "ok";
  let dbLatencyMs = null;
  try {
    const t0 = Date.now();
    await pool.query("SELECT 1");
    dbLatencyMs = Date.now() - t0;
  } catch {
    dbStatus = "error";
  }

  const memTotal  = os.totalmem();
  const memFree   = os.freemem();
  const memUsedPct = (((memTotal - memFree) / memTotal) * 100).toFixed(1);

  const proc = process.memoryUsage();

  res.json({
    status:  dbStatus === "ok" ? "healthy" : "degraded",
    uptime:  {
      process_s: Math.floor(process.uptime()),
      system_s:  Math.floor(os.uptime()),
    },
    cpu: {
      load_avg_1m:  os.loadavg()[0].toFixed(2),
      load_avg_5m:  os.loadavg()[1].toFixed(2),
      load_avg_15m: os.loadavg()[2].toFixed(2),
      cores:        os.cpus().length,
    },
    memory: {
      system_total_mb:  (memTotal  / 1024 / 1024).toFixed(0),
      system_free_mb:   (memFree   / 1024 / 1024).toFixed(0),
      system_used_pct:  `${memUsedPct}%`,
      process_heap_mb:  (proc.heapUsed  / 1024 / 1024).toFixed(1),
      process_rss_mb:   (proc.rss       / 1024 / 1024).toFixed(1),
    },
    database: {
      status:     dbStatus,
      latency_ms: dbLatencyMs,
    },
    response_ms: Date.now() - start,
    timestamp:   new Date().toISOString(),
  });
});

module.exports = router;
