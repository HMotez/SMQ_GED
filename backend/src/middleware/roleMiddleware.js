// ============================================================
// middleware/roleMiddleware.js
// ACTIA ES — GED Sprint 2, Carte 2 : Séparation des rôles (EF06)
//
// Rôles définis :
//   Admin GED           — accès total
//   Responsable Qualité — gestion workflow complet
//   Ing. Qualité        — créer, modifier, soumettre, valider
//   Rédacteur           — création / édition / premières étapes
//   Validateur          — validation uniquement (En validation → Validé)
//   Lecteur             — lecture seule
// ============================================================

const pool = require("../db");
const { verifyToken } = require("../controllers/authController");

// ─────────────────────────────────────────────────────────────
// Permissions par rôle
// ─────────────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  "Admin GED": [
    "document:read", "document:create", "document:update",
    "document:status", "validation:create",
    "archive:manage", "user:manage",
  ],
  "Responsable Qualité": [
    "document:read", "document:create", "document:update",
    "document:status", "validation:create", "archive:manage",
  ],
  "Ing. Qualité": [
    "document:read", "document:create", "document:update",
    "document:status", "validation:create",
  ],
  "Rédacteur": [
    "document:read", "document:create", "document:update",
    "document:status",
  ],
  "Validateur": [
    "document:read", "validation:create",
  ],
  "Lecteur": [
    "document:read",
  ],
};

// Transitions autorisées par rôle (EF06 — Rédacteur ≠ Validateur)
const TRANSITION_ROLE_MAP = {
  "Brouillon→En rédaction":     ["Admin GED", "Responsable Qualité", "Ing. Qualité", "Rédacteur"],
  "En rédaction→En relecture":  ["Admin GED", "Responsable Qualité", "Ing. Qualité", "Rédacteur"],
  "En relecture→En validation": ["Admin GED", "Responsable Qualité", "Ing. Qualité", "Rédacteur"],
  "En validation→Validé":       ["Admin GED", "Responsable Qualité", "Ing. Qualité", "Validateur"],
  "Validé→Diffusé":             ["Admin GED", "Responsable Qualité"],
  "Diffusé→Obsolète":           ["Admin GED", "Responsable Qualité"],
  "Obsolète→Archivé":           ["Admin GED", "Responsable Qualité"],
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
// Usage : router.post("/", loadUser, requireRole("Rédacteur","Admin GED"), ctrl.fn)
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
