// ============================================================
// routes/logRoutes.js — Logs Admin
// ============================================================

const express = require("express");
const router  = express.Router();
const { getLogs } = require("../controllers/logController");
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

// GET /api/logs — réservé Admin
router.get("/", loadUser, requireRole("Admin"), getLogs);

module.exports = router;
