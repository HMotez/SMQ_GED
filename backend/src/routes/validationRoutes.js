// ============================================================
// routes/validationRoutes.js — Sprint 2, Carte 1 (EF05) + Carte 2 (EF06)
// IMPORTANT : routes statiques AVANT /:id pour éviter conflits
// 
// EF14 — Immutabilité : PUT/DELETE sur validations sont BLOQUÉS
// ============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/validationController");
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

// ── Routes de lecture — accès libre ──────────────────────────
router.get(  "/stats",                  ctrl.getValidationStats);
router.get(  "/pending-docs",           ctrl.getPendingDocuments);
router.get(  "/document/:docId/summary", ctrl.getValidationSummary);  // EF05 + EF14
router.get(  "/document/:docId",        ctrl.getDocumentValidations);
router.get(  "/",                       ctrl.getAllValidations);

// ── Enregistrer une validation (EF05 + EF06) ────────────────────────
// Seuls Reviewer et Admin peuvent valider
// ISO Constraint: validator_id est OBLIGATOIRE et ≠ document responsible
router.post( "/document/:docId",
  loadUser,
  requireRole("Admin", "Reviewer", "Ing. Qualité"),
  ctrl.createValidation
);

// ── Immutabilité des validations (EF14 — Traçabilité ISO) ────────
// Les validations ne peuvent PAS être modifiées après création
router.patch("/:validationId",
  loadUser,
  ctrl.attemptUpdateValidation  // Rejette avec 403
);

router.put( "/:validationId",
  loadUser,
  ctrl.attemptUpdateValidation  // Rejette avec 403
);

router.delete("/:validationId",
  loadUser,
  ctrl.attemptDeleteValidation  // Rejette avec 403
);

module.exports = router;
