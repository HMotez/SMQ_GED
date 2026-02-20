// ============================================================
// routes/documentRoutes.js — Carte 4 + Carte 5 + Carte 6 + EF06
// IMPORTANT : routes statiques AVANT /:id pour éviter conflits
// ============================================================

const express = require("express");
const router  = express.Router();
const upload  = require("../upload");
const ctrl    = require("../controllers/documentController");
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

// ── Routes statiques de lecture (avant /:id) — accès libre ──
router.get(  "/statuses",           ctrl.getStatuses);
router.get(  "/stats",              ctrl.getDocumentStats);
router.get(  "/filters",            ctrl.getFilterOptions);
router.get(  "/archive-candidates", ctrl.getArchiveCandidates);
router.get(  "/archive-history",    ctrl.getArchiveHistory);
router.get(  "/archived",           ctrl.getArchivedDocuments);

// Carte 6 — Archivage automatique (Admin GED + Responsable Qualité)
router.post( "/archive-expired",
  loadUser,
  requireRole("Admin GED", "Responsable Qualité"),
  ctrl.archiveExpired
);

// ── CRUD documents ───────────────────────────────────────────
// Création : Rédacteur, Responsable Qualité, Admin GED
router.post( "/",
  loadUser,
  requireRole("Admin GED", "Responsable Qualité", "Rédacteur"),
  upload.single("file"),
  ctrl.createDocument
);

// Lecture : tous
router.get(  "/",           ctrl.getDocuments);
router.get(  "/:id",        ctrl.getDocumentById);
router.get(  "/:id/versions",     ctrl.getDocumentVersions);
router.get(  "/:id/audit-trail",  ctrl.getAuditTrail);  // EF14 — Traçabilité ISO

// Modification : Rédacteur, Responsable Qualité, Admin GED
router.put(  "/:id",
  loadUser,
  requireRole("Admin GED", "Responsable Qualité", "Rédacteur"),
  upload.single("file"),
  ctrl.updateDocument
);

// ── Cycle de vie (Carte 4 + EF06) ───────────────────────────
// Role check granulaire fait DANS changeStatus via canTransition()
router.patch("/:id/status",
  loadUser,
  requireRole("Admin GED", "Responsable Qualité", "Rédacteur", "Validateur"),
  ctrl.changeStatus
);

module.exports = router;
