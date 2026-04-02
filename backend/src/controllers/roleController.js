// ============================================================
// controllers/roleController.js
// ACTIA ES — GED Sprint 2, Carte 2 (EF06)
// ============================================================

const pool = require("../db");
const { ROLE_PERMISSIONS, TRANSITION_ROLE_MAP } = require("../middleware/roleMiddleware");

// ─────────────────────────────────────────────────────────────
// ensureRoles — crée les 3 rôles si absents
// Appelé au démarrage du serveur
// ─────────────────────────────────────────────────────────────
const REQUIRED_ROLES = [
  { name: "Admin",        description: "Accès complet — gestion utilisateurs, archivage, workflow" },
  { name: "Ing. Qualité", description: "Création, modification et soumission de documents" },
  { name: "Reviewer",     description: "Relecture et validation des documents" },
];

const ensureRoles = async () => {
  for (const role of REQUIRED_ROLES) {
    // Vérifier si le rôle existe déjà (par nom)
    const existing = await pool.query(
      "SELECT id FROM roles WHERE name = $1",
      [role.name]
    );
    if (existing.rows.length === 0) {
      // Insérer uniquement si la colonne description existe
      try {
        await pool.query(
          "INSERT INTO roles (name, description) VALUES ($1, $2)",
          [role.name, role.description]
        );
      } catch {
        // Colonne description absente — insertion sans description
        await pool.query(
          "INSERT INTO roles (name) VALUES ($1)",
          [role.name]
        );
      }
      console.log(`[EF06] Rôle créé : "${role.name}"`);
    }
  }
  console.log("[EF06] Rôles ISO vérifiés.");
};

// ─────────────────────────────────────────────────────────────
// GET /api/roles — Liste des rôles avec permissions
// ─────────────────────────────────────────────────────────────
const getRoles = async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM roles ORDER BY id"
    );
    const roles = result.rows.map((r) => ({
      ...r,
      permissions:         ROLE_PERMISSIONS[r.name] || [],
      transitionRights:    Object.entries(TRANSITION_ROLE_MAP)
        .filter(([, allowed]) => allowed.includes(r.name))
        .map(([transition]) => transition),
    }));
    return res.json(roles);
  } catch (err) {
    console.error("[EF06] getRoles error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/roles/users — Utilisateurs avec leur rôle
// ─────────────────────────────────────────────────────────────
const getUsersWithRoles = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.is_active, u.requested_role,
              r.id AS role_id, r.name AS role
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       ORDER BY u.is_active ASC, r.name, u.name`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[EF06] getUsersWithRoles error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/roles/users/:userId — Changer le rôle d'un utilisateur
// Corps : { roleId }
// Réservé : Admin GED
// ─────────────────────────────────────────────────────────────
const assignRole = async (req, res) => {
  const { userId } = req.params;
  const { roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({ error: "roleId est obligatoire." });
  }
  try {
    // Vérifier que le rôle existe
    const roleCheck = await pool.query(
      "SELECT id, name FROM roles WHERE id = $1",
      [roleId]
    );
    if (!roleCheck.rows.length) {
      return res.status(404).json({ error: "Rôle introuvable." });
    }
    // Bloquer l'attribution du rôle Admin via cette route
    if (roleCheck.rows[0].name === "Admin") {
      return res.status(403).json({ error: "Impossible d'attribuer le rôle Admin via cette interface." });
    }
    // Vérifier que l'utilisateur existe
    const userCheck = await pool.query(
      "SELECT id, name FROM users WHERE id = $1",
      [userId]
    );
    if (!userCheck.rows.length) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }
    // Assigner le rôle et activer le compte
    await pool.query(
      "UPDATE users SET role_id = $1, is_active = true WHERE id = $2",
      [roleId, userId]
    );
    return res.json({
      message:  `Rôle "${roleCheck.rows[0].name}" assigné à "${userCheck.rows[0].name}" — compte activé.`,
      userId:   parseInt(userId),
      roleId:   parseInt(roleId),
      roleName: roleCheck.rows[0].name,
    });
  } catch (err) {
    console.error("[EF06] assignRole error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/roles/users/:userId — Rejeter et supprimer un compte
// Réservé : Admin GED
// ─────────────────────────────────────────────────────────────
const rejectUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const userCheck = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [userId]
    );
    if (!userCheck.rows.length) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }
    const u = userCheck.rows[0];
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    return res.json({
      message: `Compte de "${u.name}" (${u.email}) rejeté et supprimé.`,
      userId: parseInt(userId),
    });
  } catch (err) {
    console.error("[EF06] rejectUser error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/roles/users/:userId/deactivate — Désactiver un compte actif
// Réservé : Admin GED — ne peut pas se désactiver soi-même ni un autre Admin
// ─────────────────────────────────────────────────────────────
const deactivateUser = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.currentUser?.id;

  if (parseInt(userId) === requesterId) {
    return res.status(403).json({ error: "Vous ne pouvez pas désactiver votre propre compte." });
  }

  try {
    const userCheck = await pool.query(
      `SELECT u.id, u.name, u.email, r.name AS role
       FROM users u LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [userId]
    );
    if (!userCheck.rows.length) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }
    const target = userCheck.rows[0];
    if (target.role === "Admin") {
      return res.status(403).json({ error: "Impossible de désactiver un compte Administrateur." });
    }

    await pool.query(
      "UPDATE users SET is_active = false WHERE id = $1",
      [userId]
    );
    return res.json({
      message: `Compte de "${target.name}" désactivé avec succès.`,
      userId: parseInt(userId),
    });
  } catch (err) {
    console.error("[EF06] deactivateUser error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

module.exports = { ensureRoles, getRoles, getUsersWithRoles, assignRole, rejectUser, deactivateUser };
