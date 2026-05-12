// ============================================================
// controllers/processController.js — Processus ACTIA ES (ISO 9001)
// La table "processes" représente la cartographie des processus :
//   strategic_process → main_process → sub_process
// Utilisée pour associer chaque document à un processus métier
// et filtrer la liste documentaire par processus.
// ============================================================

const pool = require("../db");

// ─────────────────────────────────────────────────────────────
// GET /api/processes
// Retourne tous les processus triés par id.
// Utilisé par le formulaire de création (sélecteur de processus)
// et le filtre de la liste documentaire.
// ─────────────────────────────────────────────────────────────
const getProcesses = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM processes ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur processes" });
  }
};

module.exports = { getProcesses };
