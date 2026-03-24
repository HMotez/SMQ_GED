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

// ── Python3 executable path ───────────────────────────────────
const PYTHON = process.env.PYTHON_PATH || "python3";

// ── Conversion scripts ────────────────────────────────────────
const SCRIPTS_DIR = path.join(__dirname, "scripts");

const app = express();
app.use(cors());
app.use(express.json());

console.log("PORT =", process.env.PORT);

// ── Storage path — pointe vers le disque réel (UPLOAD_DIR) ──
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, "../../storage");

// ── Servir les fichiers uploadés ─────────────────────────────
app.use("/files", express.static(uploadDir));

// ── Servir les assets publics (logo, etc.) ───────────────────
app.use("/public", express.static(path.join(__dirname, "../public")));

// ── Helper: résoudre le chemin complet d'un fichier ─────────
// Supporte : nom seul "file.pdf" OU chemin relatif "folder/sub/file.pdf"
// OU chemin absolu "/app/storage/file.pdf" (anciens documents)
function resolveFilePath(raw) {
  const decoded = decodeURIComponent(raw);
  // Chemin absolu existant → on l'utilise directement
  if (path.isAbsolute(decoded) && fs.existsSync(decoded)) return decoded;
  // Chemin relatif → jointure avec uploadDir
  const rel = path.join(uploadDir, decoded);
  if (fs.existsSync(rel)) return rel;
  // Fallback : juste le nom de fichier (anciens docs stockés à plat)
  const flat = path.join(uploadDir, path.basename(decoded));
  return flat;
}

// ── Files (inline) ───────────────────────────────────────────
app.get("/files/*filepath", (req, res) => {
  const filePath = resolveFilePath(req.params.filepath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable" });
  res.sendFile(filePath);
});

// ── Preview (inline dans le navigateur) ──────────────────────
app.get("/preview/*filepath", (req, res) => {
  const filePath = resolveFilePath(req.params.filepath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable" });
  res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
  res.sendFile(filePath);
});

// ── Download (force téléchargement) ──────────────────────────
app.get("/download/*filepath", (req, res) => {
  const filePath = resolveFilePath(req.params.filepath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable" });
  res.download(filePath, path.basename(filePath));
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

  const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), "ged-convert-"));
  const srcExt  = path.extname(filename).slice(1).toLowerCase();
  const baseName = path.basename(filename, path.extname(filename));

  // ── Helper: send converted file then clean up ──────────────
  const sendFile = (outFile, ext) => {
    if (!fs.existsSync(outFile)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      return res.status(422).json({ error: `Fichier converti introuvable (${ext})` });
    }
    res.download(outFile, `${baseName}.${ext}`, (dlErr) => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (dlErr) console.error("Download error:", dlErr);
    });
  };

  // ── PDF → DOCX : use pdf2docx (Python) for real text extraction ──
  if (srcExt === "pdf" && ["docx", "doc"].includes(targetFmt)) {
    const outFile  = path.join(tmpDir, `${baseName}.docx`);
    const script   = path.join(SCRIPTS_DIR, "pdf_to_docx.py");
    execFile(PYTHON, [script, srcPath, outFile], { timeout: 120000 }, (err, _stdout, stderr) => {
      if (err) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        console.error("pdf_to_docx error:", stderr);
        return res.status(500).json({ error: "Conversion PDF → Word échouée : " + (stderr || err.message) });
      }
      sendFile(outFile, "docx");
    });
    return;
  }

  // ── PDF → XLSX : use pdfplumber (Python) for table extraction ────
  if (srcExt === "pdf" && ["xlsx", "xls"].includes(targetFmt)) {
    const outFile = path.join(tmpDir, `${baseName}.xlsx`);
    const script  = path.join(SCRIPTS_DIR, "pdf_to_xlsx.py");
    execFile(PYTHON, [script, srcPath, outFile], { timeout: 120000 }, (err, _stdout, stderr) => {
      if (err) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        console.error("pdf_to_xlsx error:", stderr);
        return res.status(500).json({ error: "Conversion PDF → Excel échouée : " + (stderr || err.message) });
      }
      sendFile(outFile, "xlsx");
    });
    return;
  }

  // ── All other conversions : LibreOffice ───────────────────────────
  let infilter = null;
  if (srcExt === "pdf") {
    if (["pptx", "ppt", "odp"].includes(targetFmt)) infilter = "impress_pdf_import";
    else                                              infilter = "writer_pdf_import";
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
      const produced = fs.readdirSync(tmpDir).find(f => path.parse(f).name === baseName);
      if (!produced) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return res.status(422).json({
          error: `Conversion ${srcExt.toUpperCase()} → ${targetFmt.toUpperCase()} non supportée`,
        });
      }
      sendFile(path.join(tmpDir, produced), targetFmt);
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
app.use("/api/ai",              require("./routes/aiRoutes"));             // Sprint 6 — Module IA

// ── Error handler ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("🔥", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(process.env.PORT || 4000, async () => {
  console.log("✅ Server running on port " + (process.env.PORT || 4000));

  // ── Rôles ISO EF06 — doit tourner EN PREMIER (seedDefaultUsers en dépend) ──
  const { ensureRoles } = require("./controllers/roleController");
  await ensureRoles();

  // ── Auth JWT Sprint 3 — colonnes + seed utilisateurs ───────
  const { ensureAuthColumns, seedDefaultUsers } = require("./controllers/authController");
  await ensureAuthColumns();
  await seedDefaultUsers();

  // ── Table validations EF05 ─────────────────────────────────
  const { ensureValidationsTable } = require("./controllers/validationController");
  await ensureValidationsTable();

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

  // ── Module IA Sprint 6 — tables IA ─────────────────────────
  const { ensureAITables } = require("./controllers/aiController");
  await ensureAITables();

  // ── Kafka + Email Sprint 8 ────────────────────────────────
  if (process.env.KAFKA_BROKER) {
    const { connectProducer, disconnectProducer } = require("./kafka/producer");
    const { connectConsumer } = require("./kafka/consumer");
    const { verifyEmailTransporter } = require("./services/emailService");
    await verifyEmailTransporter();
    try {
      await connectProducer();
      await connectConsumer();
    } catch (err) {
      console.error("[Kafka] Init failed — continuing without Kafka:", err.message);
    }
    process.on("SIGTERM", async () => {
      await disconnectProducer();
      process.exit(0);
    });
  }
});