// ============================================================
// routes/dashboardRoutes.js
// ACTIA ES — GED Sprint 4 — Tableau de bord
// ============================================================

const express = require("express");
const router  = express.Router();

const { loadUser, requireRole } = require("../middleware/roleMiddleware");
const { getOverview, getDashboardStats } = require("../controllers/dashboardController");

// GET /api/dashboard/overview — KPIs synthétiques (Carte 1)
router.get("/overview", loadUser, requireRole("Reviewer"), getOverview);

// GET /api/dashboard/stats — Statistiques & graphiques (Carte 2)
router.get("/stats", loadUser, requireRole("Reviewer"), getDashboardStats);

module.exports = router;
