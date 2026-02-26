// ============================================================
// routes/userRoutes.js
// ============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/userController");

router.get("/pending-count", ctrl.getPendingCount);
router.get("/",              ctrl.getUsers);

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