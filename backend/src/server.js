const express       = require("express");
const cors          = require("cors");
const path          = require("path");
const fs            = require("fs");
const os            = require("os");
const { execFile }  = require("child_process");
require("dotenv").config({ path: __dirname + "/../.env" });

// ── LibreOffice executable path ───────────────────────────────
const SOFFICE = process.env.SOFFICE_PATH
  || "C:\\Program Files\\LibreOffice\\program\\soffice.exe";

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

// ── Preview route (affiche le fichier dans le navigateur) ────
app.get("/preview/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier introuvable" });
  }

  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.sendFile(filePath);
});

// ── Download route (force attachment) ────────────────────────
app.get("/download/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier introuvable" });
  }
  res.download(filePath, filename);
});

// ── Conversion route (LibreOffice) ───────────────────────────
// GET /convert/:filename?to=pdf|docx|xlsx|pptx
app.get("/convert/:filename", (req, res) => {
  const filename  = decodeURIComponent(req.params.filename);
  const targetFmt = (req.query.to || "pdf").toLowerCase();
  const srcPath   = path.join(uploadDir, filename);

  const allowed = ["pdf", "docx", "xlsx", "pptx", "doc", "xls", "ppt"];
  if (!allowed.includes(targetFmt)) {
    return res.status(400).json({ error: "Format non supporté" });
  }
  if (!fs.existsSync(srcPath)) {
    return res.status(404).json({ error: "Fichier introuvable" });
  }

  // create a unique temp dir so parallel requests don't collide
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ged-convert-"));

  const srcExt = path.extname(filename).slice(1).toLowerCase();

  // Pick the right PDF import filter based on target format
  let infilter = null;
  if (srcExt === "pdf") {
    if (["docx", "doc", "odt", "rtf"].includes(targetFmt))      infilter = "writer_pdf_import";
    else if (["pptx", "ppt", "odp"].includes(targetFmt))         infilter = "impress_pdf_import";
    else if (["xlsx", "xls", "ods", "csv"].includes(targetFmt)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      return res.status(422).json({ error: "Conversion PDF → Excel non supportée par LibreOffice" });
    }
  }

  const infilterArgs = infilter ? [`--infilter=${infilter}`] : [];

  execFile(
    SOFFICE,
    ["--headless", "--convert-to", targetFmt, "--outdir", tmpDir, ...infilterArgs, srcPath],
    { timeout: 90000 },
    (err) => {
      if (err) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return res.status(500).json({ error: "Conversion échouée : " + err.message });
      }

      // Scan the temp dir — LibreOffice may produce a file with any extension
      const baseName = path.basename(filename, path.extname(filename));
      const produced = fs.readdirSync(tmpDir)
        .find(f => path.parse(f).name === baseName);

      if (!produced) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        const srcFmt = srcExt.toUpperCase();
        const dstFmt = targetFmt.toUpperCase();
        return res.status(422).json({
          error: `Conversion ${srcFmt} → ${dstFmt} non supportée par LibreOffice`,
        });
      }

      const outFile      = path.join(tmpDir, produced);
      const downloadName = `${baseName}.${targetFmt}`;

      res.download(outFile, downloadName, (dlErr) => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        if (dlErr) console.error("Download error:", dlErr);
      });
    }
  );
});

// ── Debug route ──────────────────────────────────────────────
app.get("/debug-path", (_req, res) => {
  res.json({
    uploadDir,
    exists: fs.existsSync(uploadDir),
    files:  fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [],
    env:    process.env.UPLOAD_DIR,
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/authRoutes"));         // Sprint 3 — JWT Auth
app.use("/api/users",         require("./routes/userRoutes"));
app.use("/api/folders",       require("./routes/folderRoutes"));
app.use("/api/types",         require("./routes/typeRoutes"));
app.use("/api/documents",     require("./routes/documentRoutes"));
app.use("/api/processes",     require("./routes/processRoutes"));
app.use("/api/validations", require("./routes/validationRoutes")); // Sprint 2 EF05
app.use("/api/roles",       require("./routes/roleRoutes"));       // Sprint 2 EF06
app.use("/api/dashboard",       require("./routes/dashboardRoutes"));  // Sprint 4 — Tableau de bord
app.use("/api/notifications",   require("./routes/notificationRoutes")); // Sprint 5 — Notifications

// ── Error handler ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("🔥", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(process.env.PORT || 4000, async () => {
  console.log("✅ Server running on port " + (process.env.PORT || 4000));

  // ── Table validations EF05 ─────────────────────────────────
  const { ensureValidationsTable } = require("./controllers/validationController");
    // ── Auth JWT Sprint 3 — colonnes + seed utilisateurs ───────
  const { ensureAuthColumns, seedDefaultUsers } = require("./controllers/authController");
  await ensureAuthColumns();
  await seedDefaultUsers();

await ensureValidationsTable();

  // ── Rôles ISO EF06 ─────────────────────────────────────────
  const { ensureRoles } = require("./controllers/roleController");
  await ensureRoles();

  // ── Archivage automatique EF11 ─────────────────────────────
  // Exécuté au démarrage puis toutes les 24h
  const { runAutoArchiveJob } = require("./controllers/documentController");

  const scheduleAutoArchive = async () => {
    console.log("[AUTO-ARCHIVE] Vérification des documents expirés…");
    await runAutoArchiveJob();
  };

  await scheduleAutoArchive();
  setInterval(scheduleAutoArchive, 24 * 60 * 60 * 1000);

  // ── Notifications intelligentes Sprint 5 ───────────────────
  const {
    ensureNotificationsTable,
    runExpirationNotificationsJob,
  } = require("./controllers/notificationController");

  await ensureNotificationsTable();

  // CRON expirations + inactivité — au démarrage puis toutes les 24h
  const scheduleNotifJob = async () => {
    await runExpirationNotificationsJob();
  };
  await scheduleNotifJob();
  setInterval(scheduleNotifJob, 24 * 60 * 60 * 1000);
});