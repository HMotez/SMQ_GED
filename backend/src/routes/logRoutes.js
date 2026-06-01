// ============================================================
// routes/logRoutes.js
// RÔLE : Expose le journal d'audit complet de l'application.
//        Accès différencié selon le rôle :
//          - Admin        : voit TOUS les logs (sécurité + documentaires)
//          - Ing. Qualité : voit uniquement les logs documentaires
//                           (CREATE, STATUS_CHANGE, NEW_VERSION, VALIDATION)
//        Chaque log contient : action, user, document, IP, timestamp, severity.
//        Utilisé par la page "Logs" pour la traçabilité ISO 9001.
//
// Endpoints :
//   GET /api/logs         → journal d'audit (filtres : action, user, date, severity)
//   GET /api/logs/actions → liste des types d'actions disponibles pour le filtre
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
