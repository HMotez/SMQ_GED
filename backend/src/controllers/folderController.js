// ============================================================
// controllers/folderController.js
// Extrait de server.js — aucune logique changée
// ============================================================

const pool = require("../db");

const getFoldersByLevel = async (req, res) => {
  try {
    const { level } = req.params;
    const result = await pool.query(
      "SELECT * FROM folders WHERE level=$1 ORDER BY name ASC",
      [level]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur folders level" });
  }
};

const getFolderChildren = async (req, res) => {
  try {
    const { parentId } = req.params;
    const result = await pool.query(
      "SELECT * FROM folders WHERE parent_id=$1 ORDER BY name ASC",
      [parentId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur folders children" });
  }
};

module.exports = { getFoldersByLevel, getFolderChildren };