// ============================================================
// routes/dashboardRoutes.js — Sprint 4
// RÔLE : Expose les endpoints du tableau de bord analytique.
//        Fournit les KPIs et statistiques pour les graphiques
//        Chart.js du Dashboard. Accès réservé à Admin et Ing. Qualité.
//
// Endpoints :
//   GET /api/dashboard/overview → KPIs temps réel (compteurs)
//   GET /api/dashboard/stats    → données graphiques (répartitions)
// ============================================================

const express = require("express");
const router  = express.Router();

const { loadUser, requireRole } = require("../middleware/roleMiddleware");
const { getOverview, getDashboardStats } = require("../controllers/dashboardController");

// GET /api/dashboard/overview — KPIs synthétiques (Carte 1)
router.get("/overview", loadUser, requireRole("Admin", "Ing. Qualité", "Reviewer"), getOverview);

// GET /api/dashboard/stats — Statistiques & graphiques (Carte 2)
router.get("/stats", loadUser, requireRole("Admin", "Ing. Qualité", "Reviewer"), getDashboardStats);

module.exports = router;
