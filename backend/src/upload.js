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
// Si typeCode est fourni, cherche un sous-dossier {TYPE}_ sous le dossier sélectionné
// ex: folderId=Manager_SST + typeCode=TR → .../Manager_SST/TR_Trames/
async function resolveFolderPath(folderId, typeCode) {
  let resolvedId = parseInt(folderId);

  if (typeCode) {
    const sub = await pool.query(
      `SELECT id FROM folders WHERE parent_id = $1 AND name ILIKE $2 LIMIT 1`,
      [resolvedId, `${typeCode.toUpperCase()}\\_%`]
    );
    if (sub.rows.length) resolvedId = sub.rows[0].id;
  }

  const parts = [];
  let currentId = resolvedId;
  while (currentId) {
    const res = await pool.query(
      "SELECT name, parent_id FROM folders WHERE id = $1",
      [currentId]
    );
    if (!res.rows.length) break;
    parts.unshift(res.rows[0].name);
    currentId = res.rows[0].parent_id;
  }
  return parts.join("/");
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folderId  = req.body.folderId  || req.body.folder_id;
    const typeCode  = req.body.typeCode  || req.body.type_code;
    if (!folderId) return cb(null, baseDir);

    resolveFolderPath(folderId, typeCode)
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
  limits: {
    fileSize: 50 * 1024 * 1024,  // 50MB limit for security
  },
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
