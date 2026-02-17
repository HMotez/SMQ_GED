// ============================================================
// routes/folderRoutes.js
// ============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/folderController");

router.get("/level/:level",       ctrl.getFoldersByLevel);
router.get("/children/:parentId", ctrl.getFolderChildren);

module.exports = router;