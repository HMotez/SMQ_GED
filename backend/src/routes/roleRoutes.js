// ============================================================
// routes/roleRoutes.js — Sprint 2 EF06
// RÔLE : Gère le cycle de vie des comptes utilisateurs et l'attribution
//        des rôles ISO (Admin, Ing. Qualité, Reviewer).
//        Toutes les actions de modification sont réservées à l'Admin.
//        Flux d'activation :
//          1. Utilisateur s'inscrit avec un rôle souhaité
//          2. Admin voit le compte en attente (badge rouge sidebar)
//          3. Admin assigne un rôle → compte activé
//          4. OU Admin rejette → compte supprimé
//
// Endpoints :
//   GET    /api/roles                          → liste rôles + permissions
//   GET    /api/roles/users                    → utilisateurs + rôles (Admin)
//   PATCH  /api/roles/users/:id                → assigner rôle + activer (Admin)
//   DELETE /api/roles/users/:id                → rejeter compte (Admin)
//   PATCH  /api/roles/users/:id/deactivate     → désactiver compte (Admin)
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

// PATCH /api/roles/users/:userId/deactivate — désactiver un compte actif (Admin uniquement)
router.patch("/users/:userId/deactivate", loadUser, requireRole("Admin"), ctrl.deactivateUser);

module.exports = router;
