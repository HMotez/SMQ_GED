// ============================================================
// routes/roleRoutes.js — Sprint 2, Carte 2 (EF06)
// ============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/roleController");
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

// GET /api/roles — liste des rôles avec permissions (public)
router.get("/", ctrl.getRoles);

// GET /api/roles/users — utilisateurs + rôles (Admin uniquement)
router.get("/users", loadUser, requireRole("Admin"), ctrl.getUsersWithRoles);

// PATCH /api/roles/users/:userId — assigner un rôle + activer (Admin uniquement)
router.patch("/users/:userId", loadUser, requireRole("Admin"), ctrl.assignRole);

// DELETE /api/roles/users/:userId — rejeter un compte (Admin uniquement)
router.delete("/users/:userId", loadUser, requireRole("Admin"), ctrl.rejectUser);

module.exports = router;
