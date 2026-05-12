// ============================================================
// routes/folderRoutes.js — Hiérarchie documentaire ACTIA ES
// Accès public (pas d'authentification requise).
//
//   GET /api/folders/level/:level
//     Retourne les dossiers d'un niveau donné (0 = racine, 1, 2, 3).
//     Utilisé par le formulaire de création pour le drill-down
//     "Processus stratégique → Processus principal → Sous-dossier".
//
//   GET /api/folders/children/:parentId
//     Retourne les enfants directs d'un dossier (utilisé pour
//     peupler dynamiquement le sélecteur après chaque choix).
// ============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/folderController");

// GET /api/folders/level/:level  — dossiers par niveau
router.get("/level/:level",       ctrl.getFoldersByLevel);
// GET /api/folders/children/:parentId  — enfants d'un dossier
router.get("/children/:parentId", ctrl.getFolderChildren);

module.exports = router;