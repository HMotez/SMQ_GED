// ============================================================
// controllers/folderController.js — Arborescence documentaire ACTIA ES
// La structure des dossiers est hiérarchique sur 4 niveaux :
//   Niveau 1 : Processus stratégique   (ex: CDP — Concevoir/Développer)
//   Niveau 2 : Processus principal     (ex: Faire_Evoluer_Securiser_SI)
//   Niveau 3 : Sous-dossier type       (ex: PR_Procedures, IN_Instructions)
//   Niveau 4 : Sous-dossier spécifique (ex: MA_Manuel — migration 006)
// ============================================================

const pool = require("../db");

// ─────────────────────────────────────────────────────────────
// GET /api/folders/level/:level
// Retourne tous les dossiers d'un niveau donné (1, 2, 3 ou 4).
// Utilisé par le formulaire de création pour afficher les niveaux
// de l'arborescence successivement (drill-down).
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// GET /api/folders/:parentId/children
// Retourne les enfants directs d'un dossier (pour le drill-down).
// Utilisé quand l'utilisateur sélectionne un dossier de niveau N
// pour afficher les sous-dossiers de niveau N+1.
// ─────────────────────────────────────────────────────────────
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