const express       = require("express");
const cors          = require("cors");
const path          = require("path");
const fs            = require("fs");
const os            = require("os");
const { execFile }  = require("child_process");
const rateLimit     = require("express-rate-limit");
require("dotenv").config({ path: __dirname + "/../.env" });

// ── LibreOffice executable path ───────────────────────────────
const SOFFICE = process.env.SOFFICE_PATH
  || "C:\\Program Files\\LibreOffice\\program\\soffice.exe";

// ── Python3 executable path ───────────────────────────────────
const PYTHON = process.env.PYTHON_PATH || "python3";

// ── Conversion scripts ────────────────────────────────────────
const SCRIPTS_DIR = path.join(__dirname, "scripts");

const app = express();
const securityHeaders = require("./middleware/securityHeaders");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// Hide Express/Node.js version (Endurcissement infrastructure)
app.disable("x-powered-by");

app.use(securityHeaders);
app.use(cors());
app.use(express.json());

// ── Rate limiting global : 100 requêtes/heure par IP (Passerelle API) ────────
const globalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Limite : 100 requêtes/heure. Réessayez plus tard.", code: "RATE_LIMIT_EXCEEDED" },
  skip: (req) => req.path.startsWith("/files") || req.path.startsWith("/public"),
});

// ── Rate limiting strict sur les routes d'authentification ───────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives d'authentification. Réessayez dans 15 minutes.", code: "AUTH_RATE_LIMIT_EXCEEDED" },
});

app.use("/api", globalLimiter);
app.use("/api/auth", authLimiter);

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
app.get(/^\/files\/(.+)$/, (req, res) => {
  const filePath = resolveFilePath(req.params[0]);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable" });
  res.sendFile(filePath);
});

// ── Preview (inline dans le navigateur) ──────────────────────
app.get(/^\/preview\/(.+)$/, (req, res) => {
  const filePath = resolveFilePath(req.params[0]);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable" });
  res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
  res.sendFile(filePath);
});

// ── Download (force téléchargement) ──────────────────────────
app.get(/^\/download\/(.+)$/, (req, res) => {
  const filePath = resolveFilePath(req.params[0]);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier introuvable" });
  res.download(filePath, path.basename(filePath));
});

// ── Conversion route (LibreOffice) ───────────────────────────
// GET /convert/<relative-path>?to=pdf|docx|xlsx|pptx
app.get(/^\/convert\/(.+)$/, (req, res, next) => {
  try {
    const filename  = decodeURIComponent(req.params[0]);
    const targetFmt = (req.query.to || "pdf").toLowerCase();
    const srcPath   = path.join(uploadDir, filename);

    const allowed = ["pdf", "docx", "xlsx", "pptx", "doc", "xls", "ppt"];
    if (!allowed.includes(targetFmt)) {
      const err = new Error("Format de conversion non supporté");
      err.statusCode = 400;
      return next(err);
    }
    if (!fs.existsSync(srcPath)) {
      const err = new Error("Fichier source introuvable");
      err.statusCode = 404;
      return next(err);
    }

    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), "ged-convert-"));
    const srcExt  = path.extname(filename).slice(1).toLowerCase();
    const baseName = path.basename(filename, path.extname(filename));

    // ── Helper: send converted file then clean up ──────────────
    const sendFile = (outFile, ext) => {
      if (!fs.existsSync(outFile)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        const err = new Error("Fichier converti non trouvé");
        err.statusCode = 422;
        return next(err);
      }
      res.download(outFile, `${baseName}.${ext}`, (dlErr) => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        if (dlErr && !res.headersSent) next(dlErr);
      });
    };

    // ── PDF → DOCX : use pdf2docx (Python) for real text extraction ──
    if (srcExt === "pdf" && ["docx", "doc"].includes(targetFmt)) {
      const outFile  = path.join(tmpDir, `${baseName}.docx`);
      const script   = path.join(SCRIPTS_DIR, "pdf_to_docx.py");
      execFile(PYTHON, [script, srcPath, outFile], { timeout: 120000 }, (err, _stdout, stderr) => {
        if (err) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
          const error = new Error("Conversion de fichier échouée");
          error.statusCode = 500;
          return next(error);
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
          const error = new Error("Conversion de fichier échouée");
          error.statusCode = 500;
          return next(error);
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
          const error = new Error("Conversion de fichier échouée");
          error.statusCode = 500;
          return next(error);
        }
        const produced = fs.readdirSync(tmpDir).find(f => path.parse(f).name === baseName);
        if (!produced) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
          const error = new Error("Format de conversion non supporté pour cette combinaison");
          error.statusCode = 422;
          return next(error);
        }
        sendFile(path.join(tmpDir, produced), targetFmt);
      }
    );
  } catch (err) {
    next(err);
  }
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
app.use("/api/logs",            require("./routes/logRoutes"));            // Logs Admin
app.use("/api/health",          require("./routes/healthRoutes"));          // Supervision performances
app.use("/api/incidents",       require("./routes/incidentRoutes"));        // Détection des incidents

// ── 404 handler (must come before error handler) ─────────────
app.use(notFoundHandler);

// ── Global error handler (must be LAST) ──────────────────────
app.use(errorHandler);

app.listen(process.env.PORT || 4000, async () => {
  console.log("✅ Server running on port " + (process.env.PORT || 4000));

  // ── Journaux d'audit — colonnes sécurité (ip, user_agent, severity) ──
  const { ensureAuditColumns } = require("./controllers/logController");
  await ensureAuditColumns();

  // ── Rôles ISO EF06 — doit tourner EN PREMIER (seedDefaultUsers en dépend) ──
  const { ensureRoles } = require("./controllers/roleController");
  await ensureRoles();

  // ── Auth JWT Sprint 3 — colonnes + seed utilisateurs ───────
  const {
    ensureAuthColumns, ensureResetTokensTable, ensureTokenBlacklistTable,
    cleanupExpiredBlacklistedTokens, seedDefaultUsers,
  } = require("./controllers/authController");
  await ensureAuthColumns();
  await ensureResetTokensTable();
  await ensureTokenBlacklistTable();
  await seedDefaultUsers();

  // Nettoyage des tokens blacklistés expirés toutes les 6h
  await cleanupExpiredBlacklistedTokens();
  setInterval(cleanupExpiredBlacklistedTokens, 6 * 60 * 60 * 1000);

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

  // ── Détection des incidents de sécurité ───────────────────
  const { ensureIncidentsTable } = require("./controllers/incidentController");
  await ensureIncidentsTable();
  const { startIncidentDetector } = require("./utils/incidentDetector");
  startIncidentDetector();

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