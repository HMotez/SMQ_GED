// ============================================================
// routes/authRoutes.js
// RÔLE : Définit les endpoints d'authentification JWT.
//        Gère la connexion, l'inscription, la déconnexion,
//        la récupération et la réinitialisation du mot de passe.
//        Ces routes sont soumises au rate-limiting strict (20 req/15min)
//        pour protéger contre le brute force.
//
// Endpoints :
//   POST /api/auth/login            → connexion + retourne JWT
//   POST /api/auth/register         → inscription (en attente d'activation)
//   GET  /api/auth/me               → vérifie le token actuel
//   POST /api/auth/logout           → invalide le token (blacklist)
//   POST /api/auth/forgot-password  → envoie email de réinitialisation
//   POST /api/auth/reset-password   → change le mot de passe via token
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

// POST /api/auth/forgot-password  → envoie email avec lien reset
router.post("/forgot-password", ctrl.forgotPassword);

// POST /api/auth/reset-password   → { token, password, confirmPassword }
router.post("/reset-password",  ctrl.resetPassword);

module.exports = router;
