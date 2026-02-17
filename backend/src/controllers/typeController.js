// ============================================================
// controllers/typeController.js
// Extrait de server.js — aucune logique changée
// ============================================================

const pool = require("../db");

const getTypes = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM document_types ORDER BY code ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur types" });
  }
};

module.exports = { getTypes };