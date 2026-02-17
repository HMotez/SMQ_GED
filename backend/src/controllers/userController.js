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

module.exports = { getUsers };