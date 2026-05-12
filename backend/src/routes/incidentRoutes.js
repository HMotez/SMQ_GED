// ============================================================
// routes/incidentRoutes.js — Détection et gestion des incidents
// Toutes les routes sont réservées à l'Admin.
//   GET  /api/incidents     — liste des incidents détectés
//   POST /api/incidents     — créer un incident manuellement
//   PUT  /api/incidents/:id — mettre à jour un incident (statut, commentaire)
// Les incidents sont générés automatiquement par incidentDetector.js
// (brute force, accès abusifs) et consultés via la page Admin.
// ============================================================
const express = require("express");
const { loadUser, requireRole } = require("../middleware/roleMiddleware");
const { getIncidents, updateIncident, createIncident } = require("../controllers/incidentController");

const router = express.Router();

router.get(  "/",    loadUser, requireRole("Admin"), getIncidents);
router.post( "/",    loadUser, requireRole("Admin"), createIncident);
router.put(  "/:id", loadUser, requireRole("Admin"), updateIncident);

module.exports = router;
