// ============================================================
// routes/userRoutes.js
// RÔLE : Expose les endpoints de gestion des utilisateurs.
//        Permet à l'Admin de lister tous les comptes et de voir
//        le nombre de comptes en attente d'activation (badge sidebar).
//        L'Ing. Qualité peut consulter la liste pour désigner
//        des relecteurs et validateurs sur les documents.
//
// Endpoints :
//   GET /api/users                → liste tous les utilisateurs (Admin, Ing. Qualité)
//   GET /api/users/pending-count  → nombre de comptes non activés (Admin)
// ============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/userController");
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

router.get("/pending-count", loadUser, requireRole("Admin"), ctrl.getPendingCount);
router.get("/",              loadUser, requireRole("Admin", "Ing. Qualité"), ctrl.getUsers);

module.exports = router;


// ============================================================
// routes/typeRoutes.js  (dans le même fichier pour simplifier)
// ============================================================
// Si tu préfères les séparer, coupe ici en 2 fichiers

// → typeRoutes.js séparé :
// const express = require("express");
// const router  = express.Router();
// const ctrl    = require("../controllers/typeController");
// router.get("/", ctrl.getTypes);
// module.exports = router;