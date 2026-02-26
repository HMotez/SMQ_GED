// ============================================================
// controllers/userController.js
// Extrait de server.js — aucune logique changée
// ============================================================

const pool = require("../db");

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

// GET /api/users/pending-count
// Retourne le nombre d'inscriptions en attente d'activation (Admin GED only)
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