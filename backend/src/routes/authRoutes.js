// ============================================================
// routes/authRoutes.js — Sprint 3, Carte 1
// ============================================================
"use strict";

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/authController");

// POST /api/auth/login    → { token, user }
router.post("/login",    ctrl.login);

// POST /api/auth/register → { token, user } (auto-login)
router.post("/register", ctrl.register);

// GET  /api/auth/me       → { user } (vérifie Bearer token)
router.get("/me",        ctrl.me);

// POST /api/auth/logout   → 200 (JWT stateless)
router.post("/logout",   ctrl.logout);

module.exports = router;
