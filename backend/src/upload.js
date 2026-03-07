const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const uploadDir = process.env.UPLOAD_DIR || "../storage";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "_" + safeName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/msword",                                                        // .doc
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",        // .xlsx
      "application/vnd.ms-excel",                                                  // .xls
    ];
    if (!allowed.includes(file.mimetype)) return cb(new Error("Only PDF/DOCX/XLSX"));
    cb(null, true);
  },
});

module.exports = upload;
