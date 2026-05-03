// ============================================================
// middleware/roleMiddleware.js
// ACTIA ES — GED · Séparation des rôles (EF06)
//
// Trois rôles :
//   Admin        — accès total + gestion utilisateurs
//   Ing. Qualité — créer, modifier, soumettre documents
//   Reviewer     — relecture et validation des documents
// ============================================================

const pool = require("../db");
const { verifyToken, isTokenBlacklisted } = require("../controllers/authController");
const { auditLog } = require("../utils/auditLog");

// ─────────────────────────────────────────────────────────────
// Permissions par rôle
// ─────────────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  "Admin": [
    "document:read", "document:create", "document:update",
    "document:status", "validation:create",
    "archive:manage", "user:manage",
  ],
  "Ing. Qualité": [
    "document:read", "document:create", "document:update",
    "document:status", "validation:create", "audit:read",
  ],
  "Reviewer": [
    "document:read", "validation:create",
  ],
  "Visiteur": [
    "ai:archived",
  ],
};

// Transitions autorisées par rôle (EF06 — Ing. Qualité ≠ Reviewer)
const TRANSITION_ROLE_MAP = {
  "Brouillon→En rédaction":                ["Admin", "Ing. Qualité"],
  "En rédaction→Appel en relecture":        ["Admin", "Ing. Qualité"],
  "Appel en relecture→En relecture":        ["Admin", "Ing. Qualité", "Reviewer"],
  "En relecture→En correction":             ["Admin", "Reviewer", "Ing. Qualité"],
  "En relecture→En validation":             ["Admin", "Reviewer", "Ing. Qualité"],
  "En correction→Appel en relecture":       ["Admin", "Ing. Qualité"],
  "En validation→Validé":                   ["Admin", "Ing. Qualité"],
  "En validation→En correction":            ["Admin", "Reviewer", "Ing. Qualité"],
  "Validé→Approuvé":                        ["Admin", "Ing. Qualité"],
  "Approuvé→Diffusé":                       ["Admin", "Ing. Qualité"],
  "Diffusé→Obsolète":                       ["Admin", "Ing. Qualité"],
  "Obsolète→Archivé":                       ["Admin", "Ing. Qualité"],
};

// ─────────────────────────────────────────────────────────────
// loadUser — Sprint 3: vérifie JWT Bearer, fallback x-user-id
// Ne bloque pas : si absent/invalide, req.currentUser = null
// ─────────────────────────────────────────────────────────────
const loadUser = async (req, _res, next) => {
  // 1. Essayer JWT Bearer token (Sprint 3)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      // Rejeter les tokens invalidés après déconnexion
      if (await isTokenBlacklisted(token)) {
        req.currentUser = null;
        return next();
      }
      const payload = verifyToken(token);
      req.currentUser = {
        id:    payload.sub,
        name:  payload.name,
        email: payload.email,
        role:  payload.role,
      };
      return next();
    } catch {
      // Token invalide / expiré → tomber sur x-user-id
    }
  }

  // 2. Fallback : x-user-id header (backward compat Sprint 2)
  const userId = req.headers["x-user-id"];
  if (!userId) {
    req.currentUser = null;
    return next();
  }
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, r.name AS role
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [parseInt(userId, 10)]
    );
    req.currentUser = result.rows[0] || null;
  } catch {
    req.currentUser = null;
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// requireRole — bloque si user absent ou rôle insuffisant
// Usage : router.post("/", loadUser, requireRole("Ing. Qualité","Admin"), ctrl.fn)
// ─────────────────────────────────────────────────────────────
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.currentUser) {
    auditLog({ action: "ACCESS_DENIED_401", severity: "warning",
      details: { path: req.originalUrl, method: req.method }, req });
    return res.status(401).json({
      error: "Authentification requise. Sélectionnez un utilisateur.",
      code:  "NO_USER",
    });
  }
  const role = req.currentUser.role;
  if (!allowedRoles.includes(role)) {
    auditLog({ action: "ACCESS_DENIED_403", userId: req.currentUser.id, severity: "warning",
      details: { path: req.originalUrl, method: req.method, role, required: allowedRoles }, req });
    return res.status(403).json({
      error: `Accès refusé. Votre rôle (${role}) ne permet pas cette action.`,
      code:  "FORBIDDEN",
      required: allowedRoles,
      yourRole: role,
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// canTransition — vérifie si le rôle actuel peut faire la transition
// Utilisé dans changeStatus controller
// ─────────────────────────────────────────────────────────────
const canTransition = (currentStatus, newStatus, role) => {
  const key = `${currentStatus}→${newStatus}`;
  const allowed = TRANSITION_ROLE_MAP[key];
  if (!allowed) return false;          // transition inconnue
  return allowed.includes(role);
};

// ─────────────────────────────────────────────────────────────
// hasPermission — vérifie une permission pour un rôle
// ─────────────────────────────────────────────────────────────
const hasPermission = (role, permission) => {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
};

module.exports = {
  loadUser,
  requireRole,
  canTransition,
  hasPermission,
  ROLE_PERMISSIONS,
  TRANSITION_ROLE_MAP,
};
