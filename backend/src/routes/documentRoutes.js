// ============================================================
// routes/documentRoutes.js
// ============================================================

const express = require("express");
const router = express.Router();
const upload = require("../upload");
const ctrl = require("../controllers/documentController");

router.post("/", upload.single("file"), ctrl.createDocument);
router.get("/", ctrl.getDocuments);
router.get("/:id", ctrl.getDocumentById);
router.get("/:id/versions", ctrl.getDocumentVersions);

module.exports = router;
