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
// Accessible à tous les rôles authentifiés (vérification interne selon intent)
router.post(
  "/query",
  loadUser,
  requireRole("Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"),
  ctrl.handleChatQuery
);

// ── Carte 2 : Classification automatique ─────────────────────
// Accessible aux rédacteurs et au-dessus
router.post(
  "/classify",
  loadUser,
  requireRole("Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur"),
  ctrl.handleClassification
);

// ── Carte 3 : Extraction automatique des dates ───────────────
// Accessible aux rédacteurs et au-dessus
router.post(
  "/extract-dates",
  loadUser,
  requireRole("Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur"),
  ctrl.handleDateExtraction
);

// ── Carte 4 : Analyse amélioration continue ──────────────────
// Réservé aux rôles de supervision qualité
router.get(
  "/improvements",
  loadUser,
  requireRole("Admin GED","Responsable Qualité","Ing. Qualité"),
  ctrl.getImprovements
);

// ── Journalisation requêtes IA ───────────────────────────────
router.get(
  "/logs",
  loadUser,
  requireRole("Admin GED","Responsable Qualité"),
  ctrl.getQueryLogs
);

module.exports = router;
