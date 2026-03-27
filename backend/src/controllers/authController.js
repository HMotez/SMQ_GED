// ============================================================
// controllers/authController.js — Sprint 3, Carte 1
// JWT Authentication : login, me, logout
// Seeds default users with correct ISO roles on startup
// ============================================================
"use strict";

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const pool   = require("../db");

const JWT_SECRET  = process.env.JWT_SECRET  || "actia-ged-fallback-secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "8h";

// ─────────────────────────────────────────────────────────────
// Default users — seeded at startup
// ─────────────────────────────────────────────────────────────
const DEFAULT_USERS = [
  { name:"Admin",        email:"admin@test.com",       password:"Admin123!", role:"Admin"        },
  { name:"Ing Qualité",  email:"ing@test.com",        password:"Ing123!",   role:"Ing. Qualité" },
  { name:"Reviewer",     email:"reviewer@test.com",   password:"Rev123!",   role:"Reviewer"     },
];

// ─────────────────────────────────────────────────────────────
// ensureAuthColumns — ajoute password_hash à users si absent
// ─────────────────────────────────────────────────────────────
async function ensureAuthColumns() {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
  `);
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS requested_role VARCHAR(100);
  `);
  // Migration : activer les comptes existants qui ont déjà un rôle assigné
  await pool.query(`
    UPDATE users SET is_active = true
    WHERE role_id IS NOT NULL AND (is_active IS NULL OR is_active = false);
  `);
  console.log("[Auth] Colonnes auth vérifiées.");
}

// ─────────────────────────────────────────────────────────────
// seedDefaultUsers — crée les utilisateurs ISO par défaut
// ─────────────────────────────────────────────────────────────
async function seedDefaultUsers() {
  const client = await pool.connect();
  try {
    for (const u of DEFAULT_USERS) {
      // Trouver le role_id
      const roleRow = await client.query(
        "SELECT id FROM roles WHERE name = $1",
        [u.role]
      );
      if (!roleRow.rows.length) continue;
      const roleId = roleRow.rows[0].id;

      // Vérifier si l'email existe déjà
      const exists = await client.query(
        "SELECT id, password_hash FROM users WHERE LOWER(email) = LOWER($1)",
        [u.email]
      );

      if (exists.rows.length > 0) {
        // Mettre à jour si password_hash manquant ou rôle/activation manquants
        if (!exists.rows[0].password_hash) {
          const hash = await bcrypt.hash(u.password, 10);
          await client.query(
            `UPDATE users SET password_hash = $1, role_id = $2, is_active = true
             WHERE id = $3`,
            [hash, roleId, exists.rows[0].id]
          );
          console.log(`[Auth] Mot de passe mis à jour pour : ${u.email}`);
        }
        continue;
      }

      const hash = await bcrypt.hash(u.password, 10);
      await client.query(
        `INSERT INTO users (name, email, password_hash, role_id, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        [u.name, u.email, hash, roleId]
      );
      console.log(`[Auth] Utilisateur créé : ${u.email} (${u.role})`);
    }
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────
// signToken — génère un JWT signé
// ─────────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    {
      sub:   user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email et mot de passe requis.",
      code:  "MISSING_CREDENTIALS",
    });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.is_active, r.name AS role
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect.",
        code:  "INVALID_CREDENTIALS",
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        error: "Compte non configuré. Contactez l'administrateur.",
        code:  "NO_PASSWORD",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: "Votre compte est en attente d'activation par l'administrateur.",
        code:  "ACCOUNT_INACTIVE",
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect.",
        code:  "INVALID_CREDENTIALS",
      });
    }

    // Mise à jour last_login
    await pool.query(
      "UPDATE users SET last_login = NOW() WHERE id = $1",
      [user.id]
    );

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error("[Auth] login error:", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me — vérifie le token et retourne l'utilisateur
// ─────────────────────────────────────────────────────────────
async function me(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant.", code: "NO_TOKEN" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Re-fetch pour avoir les données à jour (rôle peut changer)
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, r.name AS role, u.last_login
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [payload.sub]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable.", code: "USER_NOT_FOUND" });
    }

    return res.json({ user });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expirée. Reconnectez-vous.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Token invalide.", code: "INVALID_TOKEN" });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password, confirmPassword }
// Crée un compte inactif — l'admin attribue le rôle lors de l'activation
// ─────────────────────────────────────────────────────────────
const VALID_ROLES = ["Admin", "Ing. Qualité", "Reviewer"];

async function register(req, res) {
  const { name, email, password, confirmPassword, requestedRole } = req.body;

  // ── Validations ──────────────────────────────────────────
  const errors = [];
  if (!name?.trim())  errors.push("Le nom est requis.");
  if (!email?.trim()) errors.push("L'email est requis.");
  if (!password)      errors.push("Le mot de passe est requis.");
  if (!requestedRole) errors.push("Le rôle souhaité est requis.");

  if (name?.trim().length < 2)
    errors.push("Le nom doit contenir au moins 2 caractères.");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email.trim()))
    errors.push("Format d'email invalide.");

  if (password && password.length < 6)
    errors.push("Le mot de passe doit contenir au moins 6 caractères.");

  if (password && confirmPassword && password !== confirmPassword)
    errors.push("Les mots de passe ne correspondent pas.");

  if (requestedRole && !VALID_ROLES.includes(requestedRole))
    errors.push(`Rôle invalide. Valeurs acceptées : ${VALID_ROLES.join(", ")}.`);

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(" "), errors, code: "VALIDATION_ERROR" });
  }

  try {
    // ── Email unique ────────────────────────────────────────
    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "Cet email est déjà utilisé.",
        code:  "EMAIL_EXISTS",
      });
    }

    // ── Hasher le mot de passe ──────────────────────────────
    const hash = await bcrypt.hash(password, 10);

    // ── Insérer l'utilisateur (inactif, sans rôle assigné) ──
    const insert = await pool.query(
      `INSERT INTO users (name, email, password_hash, requested_role, is_active)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, name, email`,
      [name.trim(), email.trim().toLowerCase(), hash, requestedRole]
    );

    console.log(`[Auth] Nouveau compte en attente d'activation : ${insert.rows[0].email} (rôle demandé: ${requestedRole})`);

    return res.status(201).json({
      message: `Compte créé. Votre accès sera activé par l'administrateur.`,
      pending: true,
    });
  } catch (err) {
    console.error("[Auth] register error:", err);
    return res.status(500).json({ error: "Erreur serveur lors de la création du compte." });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout — stateless JWT : juste un 200
// ─────────────────────────────────────────────────────────────
async function logout(_req, res) {
  return res.json({ message: "Déconnexion réussie." });
}

// ─────────────────────────────────────────────────────────────
// verifyToken — utilitaire pour le middleware
// ─────────────────────────────────────────────────────────────
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  ensureAuthColumns,
  seedDefaultUsers,
  login,
  register,
  me,
  logout,
  verifyToken,
};
