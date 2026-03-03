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
<<<<<<< HEAD
// Accessible aux visiteurs (Lecteur) et aux rôles authentifiés
router.post(
  "/query",
  loadUser,
=======
// Accessible à tous les rôles authentifiés (vérification interne selon intent)
router.post(
  "/query",
  loadUser,
  requireRole("Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"),
>>>>>>> 1d2558f60f462409d3243bfe5057dd02adcf7580
  ctrl.handleChatQuery
);

// ── Carte 2 : Classification automatique ─────────────────────
<<<<<<< HEAD
// Ing. Qualité et Admin uniquement
router.post(
  "/classify",
  loadUser,
  requireRole("Admin","Ing. Qualité"),
=======
// Accessible aux rédacteurs et au-dessus
router.post(
  "/classify",
  loadUser,
  requireRole("Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur"),
>>>>>>> 1d2558f60f462409d3243bfe5057dd02adcf7580
  ctrl.handleClassification
);

// ── Carte 3 : Extraction automatique des dates ───────────────
<<<<<<< HEAD
// Ing. Qualité et Admin uniquement
router.post(
  "/extract-dates",
  loadUser,
  requireRole("Admin","Ing. Qualité"),
=======
// Accessible aux rédacteurs et au-dessus
router.post(
  "/extract-dates",
  loadUser,
  requireRole("Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur"),
>>>>>>> 1d2558f60f462409d3243bfe5057dd02adcf7580
  ctrl.handleDateExtraction
);

// ── Carte 4 : Analyse amélioration continue ──────────────────
<<<<<<< HEAD
// Admin uniquement
router.get(
  "/improvements",
  loadUser,
  requireRole("Admin","Ing. Qualité"),
=======
// Réservé aux rôles de supervision qualité
router.get(
  "/improvements",
  loadUser,
  requireRole("Admin GED","Responsable Qualité","Ing. Qualité"),
>>>>>>> 1d2558f60f462409d3243bfe5057dd02adcf7580
  ctrl.getImprovements
);

// ── Journalisation requêtes IA ───────────────────────────────
router.get(
  "/logs",
  loadUser,
<<<<<<< HEAD
  requireRole("Admin"),
=======
  requireRole("Admin GED","Responsable Qualité"),
>>>>>>> 1d2558f60f462409d3243bfe5057dd02adcf7580
  ctrl.getQueryLogs
);

module.exports = router;
