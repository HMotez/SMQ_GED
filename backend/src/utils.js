// ============================================================
// utils.js — Génération du code documentaire
//
// generateDocCode(typeCode, folderId) produit un identifiant unique
// au format :  {typeCode}-{folderCode}-{NNNN}
//   Ex: PR-PS-0001  (Procédure n°1 dans le dossier Processus)
//
// Algorithme :
//   1. Lit le code du dossier cible (colonne "code" de la table folders)
//   2. Compte les documents existants dans ce dossier pour ce type
//   3. N = count + 1, formaté sur 4 chiffres avec zéro gauche
// ============================================================
const pool = require("./db");

async function generateDocCode(typeCode, folderId) {
  // 1️⃣ Récupérer le code du dossier
  const folderResult = await pool.query(
    "SELECT code FROM folders WHERE id=$1",
    [folderId]
  );

  if (!folderResult.rows.length || !folderResult.rows[0].code) {
    throw new Error("Le dossier n'a pas de code défini");
  }

  const folderCode = folderResult.rows[0].code;

  // 2️⃣ Compter les documents existants dans ce dossier + type
  const countResult = await pool.query(
    `SELECT COUNT(*) 
     FROM documents 
     WHERE folder_id=$1 AND type_id = (
       SELECT id FROM document_types WHERE code=$2
     )`,
    [folderId, typeCode]
  );

  const count = parseInt(countResult.rows[0].count) + 1;

  // 3️⃣ Générer numéro sur 4 chiffres
  const paddedNumber = String(count).padStart(4, "0");

  // 4️⃣ Format final
  // Exemple: PR-PS-0001
  return `${typeCode}-${folderCode}-${paddedNumber}`;
}

module.exports = { generateDocCode };
