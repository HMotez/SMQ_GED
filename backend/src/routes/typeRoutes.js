// ============================================================
// routes/typeRoutes.js
// ============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/typeController");

router.get("/", ctrl.getTypes);

module.exports = router;