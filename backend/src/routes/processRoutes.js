// ============================================================
// routes/processRoutes.js — Cartographie des processus ACTIA ES
// GET /api/processes — retourne tous les processus (accès public).
// Utilisé par le formulaire de création de document (sélecteur
// "Processus") et le filtre de la liste documentaire.
// ============================================================
const express = require("express");
const router  = express.Router();
const { getProcesses } = require("../controllers/processController");

router.get("/", getProcesses);

module.exports = router;
