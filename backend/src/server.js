const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
require("dotenv").config({ path: __dirname + "/../.env" });

const app = express();
app.use(cors());
app.use(express.json());

console.log("PORT =", process.env.PORT);

// ── Storage path ─────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(__dirname, "..", process.env.UPLOAD_DIR)
  : path.resolve(__dirname, "../../storage");

// ── Servir les fichiers uploadés ─────────────────────────────
app.use("/files", express.static(uploadDir));

// ── Download route (gère les noms avec espaces/accents) ──────
app.get("/files/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier introuvable" });
  }

  res.sendFile(filePath);
});

// ── Debug route ──────────────────────────────────────────────
app.get("/debug-path", (req, res) => {
  res.json({
    uploadDir,
    exists: fs.existsSync(uploadDir),
    files:  fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [],
    env:    process.env.UPLOAD_DIR,
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use("/api/users",     require("./routes/userRoutes"));
app.use("/api/folders",   require("./routes/folderRoutes"));
app.use("/api/types",     require("./routes/typeRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("🔥", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(process.env.PORT || 4000, () => {
  console.log("✅ Server running on port " + (process.env.PORT || 4000));
});