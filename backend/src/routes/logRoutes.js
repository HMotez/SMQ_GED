// ============================================================
// routes/logRoutes.js — Logs Admin
// ============================================================

const express = require("express");
const router  = express.Router();
const { getLogs, getLogActions } = require("../controllers/logController");
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

// GET /api/logs/actions — distinct action types in DB (must be before /)
router.get("/actions", loadUser, requireRole("Admin"), getLogActions);

// GET /api/logs — réservé Admin
router.get("/", loadUser, requireRole("Admin"), getLogs);

module.exports = router;
