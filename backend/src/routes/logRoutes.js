// ============================================================
// routes/logRoutes.js — Logs Admin + Ing. Qualité
// ============================================================

const express = require("express");
const router  = express.Router();
const { getLogs, getLogActions } = require("../controllers/logController");
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

// GET /api/logs/actions — types d'actions distincts (filtré selon rôle)
router.get("/actions", loadUser, requireRole("Admin", "Ing. Qualité"), getLogActions);

// GET /api/logs — Admin : tous les logs | Ing. Qualité : logs documentaires uniquement
router.get("/", loadUser, requireRole("Admin", "Ing. Qualité"), getLogs);

module.exports = router;
