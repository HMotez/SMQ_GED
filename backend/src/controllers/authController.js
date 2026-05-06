// ============================================================
// controllers/authController.js — Sprint 3, Carte 1
// JWT Authentication : login, me, logout
// Seeds default users with correct ISO roles on startup
// ============================================================
"use strict";

const bcrypt       = require("bcryptjs");
const jwt          = require("jsonwebtoken");
const crypto       = require("crypto");
const emailService = require("../services/emailService");
const ldapService  = require("../services/ldapService");
const pool         = require("../db");
const { auditLog }          = require("../utils/auditLog");
const { validatePassword }  = require("../utils/passwordPolicy");
const { recordAuthSuccess, recordAuthFailure } = require("../middleware/metrics");

// ── JWT_SECRET — REQUIRED, no fallback (Endurcissement infra) ──
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET environment variable is required. Set it in .env and restart.");
  process.exit(1);
}
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "8h";

// ── Default users — credentials from .env only ───────────────
// Generate a secure random password if env var not set (first-run only)
function _defaultPwd(envVar, label) {
  if (process.env[envVar]) return process.env[envVar];
  const generated = require("crypto").randomBytes(12).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 14) + "!A1";
  console.warn(`[Auth] ⚠️  ${envVar} not set — generated password for ${label}: ${generated}  (set this in .env!)`);
  return generated;
}
const DEFAULT_USERS = [
  { name:"Admin",       email: process.env.ADMIN_EMAIL    || "admin@actia.ged",    password: _defaultPwd("ADMIN_PASSWORD",    "Admin"),       role:"Admin"        },
  { name:"Ing Qualité", email: process.env.ING_EMAIL      || "ing@actia.ged",      password: _defaultPwd("ING_PASSWORD",      "Ing. Qualité"), role:"Ing. Qualité" },
  { name:"Reviewer",    email: process.env.REVIEWER_EMAIL || "reviewer@actia.ged", password: _defaultPwd("REVIEWER_PASSWORD", "Reviewer"),    role:"Reviewer"     },
];

// ─────────────────────────────────────────────────────────────
// Politique de complexité du mot de passe
// ─────────────────────────────────────────────────────────────
function validatePasswordComplexity(password) {
  const { errors } = validatePassword(password);
  return errors;
}

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
  // Colonne IP de dernière connexion (alerte nouvelle IP)
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(64);
  `);
  // Colonnes anti-brute-force
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
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
const BRUTE_MAX_ATTEMPTS = 3;
const BRUTE_LOCK_MINUTES = 15;
// Message générique — masque les différences valide/invalide (anti-énumération)
const GENERIC_AUTH_ERROR = "Email ou mot de passe incorrect.";

async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({
      error: "Email et mot de passe requis.",
      code:  "MISSING_CREDENTIALS",
    });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.is_active,
              u.login_attempts, u.locked_until, r.name AS role
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()]
    );

    const user = result.rows[0];

    // Utilisateur introuvable — même message que mot de passe incorrect (anti-énumération)
    if (!user || !user.password_hash) {
      await bcrypt.compare(password, "$2b$10$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
      auditLog({ action: "LOGIN_FAILURE", severity: "warning", details: { email, reason: "user_not_found" }, req });
      return res.status(401).json({ error: GENERIC_AUTH_ERROR, code: "INVALID_CREDENTIALS" });
    }

    // Vérification du verrou brute-force
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(429).json({
        error: `Compte temporairement bloqué suite à trop de tentatives. Réessayez dans ${remaining} minute(s).`,
        code:  "ACCOUNT_LOCKED",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: "Votre compte est en attente d'activation par l'administrateur.",
        code:  "ACCOUNT_INACTIVE",
      });
    }

    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "inconnu";

    // ── Vérification du mot de passe : LDAP/AD en priorité, local en repli ──
    let authenticated = false;

    if (ldapService.isEnabled()) {
      const ldapUser = await ldapService.authenticateLdap(email.trim(), password).catch(() => null);
      if (ldapUser) {
        authenticated = true;
        auditLog({ action: "LOGIN_SUCCESS_LDAP", userId: user.id, severity: "info",
          details: { email: user.email, role: user.role, ip: clientIp, method: "LDAP" }, req });
      }
    }

    if (!authenticated) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        const newAttempts = (user.login_attempts || 0) + 1;
        if (newAttempts >= BRUTE_MAX_ATTEMPTS) {
          const lockedUntil = new Date(Date.now() + BRUTE_LOCK_MINUTES * 60 * 1000);
          await pool.query(
            "UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3",
            [newAttempts, lockedUntil, user.id]
          );
          console.warn(`[Auth][BruteForce] Compte bloqué 15min : ${user.email} (IP: ${clientIp})`);
          auditLog({ action: "ACCOUNT_LOCKED", userId: user.id, severity: "critical",
            details: { email: user.email, attempts: newAttempts, locked_until: lockedUntil }, req });
          emailService.sendSecurityAlert({
            to: user.email, type: "account_locked",
            name: user.name, ip: clientIp,
            lockedUntil: lockedUntil.toLocaleString("fr-FR"),
          }).catch(() => {});
          return res.status(429).json({
            error: `Compte bloqué pendant ${BRUTE_LOCK_MINUTES} minutes suite à ${BRUTE_MAX_ATTEMPTS} tentatives échouées.`,
            code:  "ACCOUNT_LOCKED",
          });
        }
        await pool.query(
          "UPDATE users SET login_attempts = $1 WHERE id = $2",
          [newAttempts, user.id]
        );
        auditLog({ action: "LOGIN_FAILURE", userId: user.id, severity: "warning",
          details: { email: user.email, attempt: newAttempts, reason: "wrong_password" }, req });
        recordAuthFailure();
        return res.status(401).json({ error: GENERIC_AUTH_ERROR, code: "INVALID_CREDENTIALS" });
      }
      authenticated = true;
    }

    // ── Connexion réussie ──────────────────────────────────────
    const ipRes = await pool.query("SELECT last_login_ip FROM users WHERE id = $1", [user.id]);
    const lastIp = ipRes.rows[0]?.last_login_ip;
    const newIpLogin = lastIp && lastIp !== clientIp;
    if (newIpLogin) {
      auditLog({ action: "LOGIN_NEW_IP", userId: user.id, severity: "warning",
        details: { email: user.email, current_ip: clientIp, previous_ip: lastIp }, req });
      emailService.sendSecurityAlert({
        to: user.email, type: "new_ip_login",
        name: user.name, ip: clientIp, previousIp: lastIp,
        time: new Date().toLocaleString("fr-FR"),
      }).catch(() => {});
    }

    await pool.query(
      "UPDATE users SET last_login = NOW(), last_login_ip = $1, login_attempts = 0, locked_until = NULL WHERE id = $2",
      [clientIp, user.id]
    );

    auditLog({ action: "LOGIN_SUCCESS", userId: user.id, severity: "info",
      details: { email: user.email, role: user.role, ip: clientIp }, req });
    recordAuthSuccess();

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
    // Vérifier si le token a été invalidé (déconnexion explicite)
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ error: "Session invalidée. Reconnectez-vous.", code: "SESSION_INVALIDATED" });
    }
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

  if (password) {
    const pwdErrors = validatePasswordComplexity(password);
    errors.push(...pwdErrors);
  }

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
// POST /api/auth/logout — invalide le token côté serveur
// ─────────────────────────────────────────────────────────────
async function logout(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.decode(token);
      if (decoded?.exp) {
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(decoded.exp * 1000);
        await pool.query(
          "INSERT INTO token_blacklist (jti, expires_at) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [tokenHash, expiresAt]
        );
      }
    } catch { /* ignore — token malformé */ }
  }
  if (req.currentUser) {
    auditLog({ action: "LOGOUT", userId: req.currentUser.id, severity: "info",
      details: { email: req.currentUser.email }, req });
  }
  return res.json({ message: "Déconnexion réussie. Session détruite." });
}

// ─────────────────────────────────────────────────────────────
// verifyToken — utilitaire pour le middleware
// ─────────────────────────────────────────────────────────────
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// ─────────────────────────────────────────────────────────────
// Token blacklist — invalide les tokens après déconnexion
// ─────────────────────────────────────────────────────────────
async function ensureTokenBlacklistTable() {
  // Créer la table si absente (colonne jti = hash SHA-256 du token)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      jti        VARCHAR(64) NOT NULL PRIMARY KEY,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires
      ON token_blacklist(expires_at)
  `);
  console.log("[Auth] Table token_blacklist vérifiée.");
}

async function isTokenBlacklisted(token) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const result = await pool.query(
    "SELECT jti FROM token_blacklist WHERE jti = $1 AND expires_at > NOW()",
    [hash]
  );
  return result.rows.length > 0;
}

async function cleanupExpiredBlacklistedTokens() {
  const result = await pool.query(
    "DELETE FROM token_blacklist WHERE expires_at <= NOW()"
  );
  if (result.rowCount > 0)
    console.log(`[Auth] ${result.rowCount} token(s) expirés supprimés de la blacklist.`);
}

// ─────────────────────────────────────────────────────────────
// ensureResetTokensTable — crée la table reset_tokens si absente
// ─────────────────────────────────────────────────────────────
async function ensureResetTokensTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reset_tokens (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      VARCHAR(128) NOT NULL UNIQUE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used       BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reset_tokens_token
      ON reset_tokens(token)
  `);
  console.log("[Auth] Table reset_tokens vérifiée.");
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Body: { email }
// Génère un token de réinitialisation et envoie l'email
// ─────────────────────────────────────────────────────────────
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email?.trim()) {
    return res.status(400).json({ error: "Email requis.", code: "MISSING_EMAIL" });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true",
      [email.trim()]
    );

    // Réponse identique que l'email existe ou non (sécurité anti-énumération)
    if (!result.rows.length) {
      return res.json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
    }

    const user = result.rows[0];

    // Invalider les anciens tokens non utilisés pour ce user
    await pool.query(
      "UPDATE reset_tokens SET used = true WHERE user_id = $1 AND used = false",
      [user.id]
    );

    // Générer un token sécurisé (32 octets = 64 hex)
    const rawToken  = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await pool.query(
      "INSERT INTO reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, rawToken, expiresAt]
    );

    // Envoyer l'email
    await emailService.sendPasswordResetEmail({
      to:        user.email,
      name:      user.name,
      token:     rawToken,
      expiresAt,
    });

    console.log(`[Auth] Reset token généré pour : ${user.email}`);
    return res.json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
  } catch (err) {
    console.error("[Auth] forgotPassword error:", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// Body: { token, password, confirmPassword }
// ─────────────────────────────────────────────────────────────
async function resetPassword(req, res) {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ error: "Token, mot de passe et confirmation requis.", code: "MISSING_FIELDS" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Les mots de passe ne correspondent pas.", code: "PASSWORD_MISMATCH" });
  }
  const pwdErrors = validatePasswordComplexity(password);
  if (pwdErrors.length > 0) {
    return res.status(400).json({ error: pwdErrors.join(" "), errors: pwdErrors, code: "PASSWORD_WEAK" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.used
       FROM reset_tokens rt
       WHERE rt.token = $1`,
      [token]
    );

    if (!tokenResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Lien invalide ou expiré.", code: "INVALID_TOKEN" });
    }

    const row = tokenResult.rows[0];

    if (row.used) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Ce lien a déjà été utilisé.", code: "TOKEN_USED" });
    }

    if (new Date(row.expires_at) < new Date()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Lien expiré. Veuillez faire une nouvelle demande.", code: "TOKEN_EXPIRED" });
    }

    // Hasher le nouveau mot de passe
    const hash = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe
    await client.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hash, row.user_id]
    );

    // Invalider le token
    await client.query(
      "UPDATE reset_tokens SET used = true WHERE id = $1",
      [row.id]
    );

    await client.query("COMMIT");

    console.log(`[Auth] Mot de passe réinitialisé pour user_id=${row.user_id}`);
    return res.json({ message: "Mot de passe réinitialisé avec succès. Vous pouvez vous connecter." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[Auth] resetPassword error:", err);
    return res.status(500).json({ error: "Erreur serveur." });
  } finally {
    client.release();
  }
}

module.exports = {
  ensureAuthColumns,
  ensureResetTokensTable,
  ensureTokenBlacklistTable,
  cleanupExpiredBlacklistedTokens,
  isTokenBlacklisted,
  seedDefaultUsers,
  login,
  register,
  me,
  logout,
  forgotPassword,
  resetPassword,
  verifyToken,
  validatePasswordComplexity,
};
