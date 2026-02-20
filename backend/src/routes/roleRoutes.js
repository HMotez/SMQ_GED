// ============================================================
// routes/roleRoutes.js — Sprint 2, Carte 2 (EF06)
// ============================================================

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/roleController");
const { loadUser, requireRole } = require("../middleware/roleMiddleware");

// GET /api/roles — liste des rôles avec permissions (public)
router.get("/", ctrl.getRoles);

// GET /api/roles/users — utilisateurs + rôles (public, lecture)
router.get("/users", ctrl.getUsersWithRoles);

// PATCH /api/roles/users/:userId — assigner un rôle (Admin GED uniquement)
router.patch("/users/:userId", loadUser, requireRole("Admin GED"), ctrl.assignRole);

module.exports = router;
