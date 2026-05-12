// ============================================================
// controllers/userController.js — Gestion des utilisateurs
// Fournit la liste des comptes et le compteur d'inscriptions
// en attente pour le badge "Utilisateurs" du sidebar Admin.
// ============================================================

const pool = require("../db");

// ─────────────────────────────────────────────────────────────
// GET /api/users
// Retourne tous les utilisateurs avec leur rôle.
// Utilisé par la page UserManagement et le sélecteur de validateur.
// Résultat : [{ id, name, email, role }]
// ─────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, r.name as role
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur users" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/users/pending-count
// Nombre de comptes créés via /register mais pas encore activés.
// Un compte est "en attente" si : is_active=false ET requested_role IS NOT NULL.
// Utilisé pour afficher le badge rouge sur "Utilisateurs" dans le sidebar Admin.
// ─────────────────────────────────────────────────────────────
const getPendingCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE is_active = false
         AND requested_role IS NOT NULL`
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur pending-count" });
  }
};

module.exports = { getUsers, getPendingCount };