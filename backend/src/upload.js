const multer = require("multer");
const fs     = require("fs");
const path   = require("path");
const pool   = require("./db");
require("dotenv").config();

// ── Base directory — pointe vers le disque réel via UPLOAD_DIR ──
// En local (dev) : process.env.UPLOAD_DIR ou ../../storage
// En Docker      : /app/storage (mappé via volume dans docker-compose)
const baseDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, "../../storage");

if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

// ── Construit le chemin complet sur disque à partir du folder_id ──
// Remonte la chaîne parent_id → construit ex:
//   01_PROCESSUS_STRATEGIQUE/Concevoir_Developper_Produits/PR_Procedures
async function resolveFolderPath(folderId) {
  const parts = [];
  let currentId = parseInt(folderId);
  while (currentId) {
    const res = await pool.query(
      "SELECT name, parent_id FROM folders WHERE id = $1",
      [currentId]
    );
    if (!res.rows.length) break;
    parts.unshift(res.rows[0].name);
    currentId = res.rows[0].parent_id;
  }
  return parts.join("/"); // chemin relatif uniquement ex: "01_PS/CDP/PR_Procedures"
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folderId = req.body.folderId || req.body.folder_id;
    if (!folderId) return cb(null, baseDir);

    resolveFolderPath(folderId)
      .then(relPath => {
        const destPath = relPath ? path.join(baseDir, relPath) : baseDir;
        fs.mkdirSync(destPath, { recursive: true });
        cb(null, destPath);
      })
      .catch(() => cb(null, baseDir));
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "_" + safeName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowed.includes(file.mimetype)) return cb(new Error("Only PDF/DOCX/XLSX"));
    cb(null, true);
  },
});

module.exports = { upload, baseDir, resolveFolderPath };
