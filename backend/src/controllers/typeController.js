// ============================================================
// controllers/typeController.js — Types documentaires ISO 9001
// Les types définissent la nature du document et son code :
//   PR = Procédure     IN = Instruction      GU = Guide
//   MN = Manuel        TR = Trame            EN = Enregistrement
//   FM = Formulaire    FF = Fiche de Fonction  PT = Plan de test
//   EX = Exemple
// Le code du type est utilisé dans la génération du doc_code
// (ex: PR0001_Procedure_- pour une Procédure).
// ============================================================

const pool = require("../db");

// ─────────────────────────────────────────────────────────────
// GET /api/types
// Retourne tous les types documentaires triés par code.
// Utilisé par le formulaire de création pour peupler le
// sélecteur "Type de document".
// ─────────────────────────────────────────────────────────────
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