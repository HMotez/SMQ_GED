// ============================================================
// routes/aiRoutes.js — ACTIA ES GED — Sprint 6 IA
// Carte 1 : POST   /api/ai/query          Chatbot Qualité
// Carte 2 : POST   /api/ai/classify       Classification automatique
// Carte 3 : POST   /api/ai/extract-dates  Extraction dates
// Carte 4 : GET    /api/ai/improvements   Amélioration continue
//           GET    /api/ai/logs           Journalisation requêtes IA
// ============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/aiController");
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

// ── Carte 1 : Chatbot Qualité ────────────────────────────────
// Accessible aux visiteurs (Lecteur) et aux rôles authentifiés
router.post(
  "/query",
  loadUser,
  ctrl.handleChatQuery
);

// ── Carte 2 : Classification automatique ─────────────────────
// Ing. Qualité et Admin uniquement
router.post(
  "/classify",
  loadUser,
  requireRole("Admin","Ing. Qualité"),
  ctrl.handleClassification
);

// ── Carte 3 : Extraction automatique des dates ───────────────
// Ing. Qualité et Admin uniquement
router.post(
  "/extract-dates",
  loadUser,
  requireRole("Admin","Ing. Qualité"),
  ctrl.handleDateExtraction
);

// ── Carte 4 : Analyse amélioration continue ──────────────────
// Admin uniquement
router.get(
  "/improvements",
  loadUser,
  requireRole("Admin","Ing. Qualité"),
  ctrl.getImprovements
);

// ── Journalisation requêtes IA ───────────────────────────────
router.get(
  "/logs",
  loadUser,
  requireRole("Admin"),
  ctrl.getQueryLogs
);

module.exports = router;
