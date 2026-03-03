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
const { verifyToken } = require("../controllers/authController");

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
    "document:status",
  ],
  "Reviewer": [
    "document:read", "validation:create",
  ],
};

// Transitions autorisées par rôle (EF06 — Ing. Qualité ≠ Reviewer)
const TRANSITION_ROLE_MAP = {
  "Brouillon→En rédaction":     ["Admin", "Ing. Qualité"],
  "En rédaction→En relecture":  ["Admin", "Ing. Qualité"],
  "En relecture→En validation": ["Admin", "Ing. Qualité"],
  "En validation→Validé":       ["Admin", "Reviewer"],
  "Validé→Diffusé":             ["Admin"],
  "Diffusé→Obsolète":           ["Admin"],
  "Obsolète→Archivé":           ["Admin"],
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
    return res.status(401).json({
      error: "Authentification requise. Sélectionnez un utilisateur.",
      code:  "NO_USER",
    });
  }
  const role = req.currentUser.role;
  if (!allowedRoles.includes(role)) {
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
