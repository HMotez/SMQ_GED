// ============================================================
// controllers/roleController.js
// ACTIA ES — GED Sprint 2, Carte 2 (EF06)
// ============================================================

const pool = require("../db");
const { ROLE_PERMISSIONS, TRANSITION_ROLE_MAP } = require("../middleware/roleMiddleware");

// ─────────────────────────────────────────────────────────────
// ensureRoles — crée les 5 rôles ISO si absents
// Appelé au démarrage du serveur
// ─────────────────────────────────────────────────────────────
const REQUIRED_ROLES = [
  { name: "Admin GED",          description: "Accès complet à toutes les fonctionnalités" },
  { name: "Responsable Qualité",description: "Gestion du workflow documentaire complet" },
  { name: "Ing. Qualité",       description: "Création, modification, soumission et validation de documents" },
  { name: "Rédacteur",          description: "Création et édition de documents" },
  { name: "Validateur",         description: "Validation des documents (En validation → Validé)" },
  { name: "Lecteur",            description: "Lecture seule — aucune modification" },
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

module.exports = { ensureRoles, getRoles, getUsersWithRoles, assignRole, rejectUser };
