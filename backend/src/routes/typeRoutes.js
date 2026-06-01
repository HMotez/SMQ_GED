// ============================================================
// routes/typeRoutes.js
// RÔLE : Expose la liste des types documentaires ISO 9001.
//        Les types définissent la nature du document et son code :
//          PR=Procédure, IN=Instruction, GU=Guide, MN=Manuel,
//          TR=Trame, EN=Enregistrement, FM=Fiche Mission, etc.
//        Utilisé par le formulaire de création pour peupler
//        le sélecteur "Type de document" (accès public, pas d'auth).
//
// Endpoints :
//   GET /api/types → liste tous les types documentaires
// ============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/typeController");

router.get("/", ctrl.getTypes);

module.exports = router;