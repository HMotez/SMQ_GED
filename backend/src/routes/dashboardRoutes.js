// ============================================================
// routes/dashboardRoutes.js
// ACTIA ES — GED Sprint 4 — Tableau de bord
// ============================================================

const express = require("express");
const router  = express.Router();

const { loadUser } = require("../middleware/roleMiddleware");
const { getOverview, getDashboardStats } = require("../controllers/dashboardController");

// GET /api/dashboard/overview — KPIs synthétiques (Carte 1)
router.get("/overview", loadUser, getOverview);

// GET /api/dashboard/stats — Statistiques & graphiques (Carte 2)
router.get("/stats", loadUser, getDashboardStats);

module.exports = router;
