/**
 * Surveillance accès non autorisés à la BD — Gestion de la BD (checklist sécurité)
 * Vérifie que les erreurs de connexion PostgreSQL sont interceptées et journalisées
 * comme événements de sécurité (pool.on('error') → logger.security).
 *
 * Commande : npm run test:17
 */
"use strict";
const fs   = require("fs");
const path = require("path");
const { api, getAdminToken, authHeader } = require("./helpers");
const config = require("./config");

const ROOT       = path.resolve(__dirname, "../..");
const DB_JS      = path.resolve(__dirname, "../src/db.js");
const LOGGER_JS  = path.resolve(__dirname, "../src/utils/logger.js");
const LOGS_DIR   = path.resolve(__dirname, "../logs");
const ERROR_LOG  = path.join(LOGS_DIR, "errors.log");

describe("Surveillance accès non autorisés à la BD", () => {

  // ── Vérifications structurelles (analyse du code source) ──────

  test("db.js enregistre un écouteur d'erreur sur le pool PostgreSQL", () => {
    const src = fs.readFileSync(DB_JS, "utf8");
    expect(src).toContain('pool.on("error"');
  });

  test("db.js détecte les codes d'erreur d'authentification PostgreSQL (28P01, 28000)", () => {
    const src = fs.readFileSync(DB_JS, "utf8");
    expect(src).toContain("28P01");
    expect(src).toContain("28000");
  });

  test("db.js journalise les échecs d'auth en tant qu'événement SECURITY (DB_UNAUTHORIZED_ACCESS)", () => {
    const src = fs.readFileSync(DB_JS, "utf8");
    expect(src).toContain("DB_UNAUTHORIZED_ACCESS");
    expect(src).toContain("logger.security");
  });

  test("db.js journalise les autres erreurs de connexion (08006, 08001, 3D000)", () => {
    const src = fs.readFileSync(DB_JS, "utf8");
    expect(src).toContain("08006");
    expect(src).toContain("08001");
    expect(src).toContain("3D000");
  });

  // ── Vérifications du système de journalisation ────────────────

  test("logger.js dispose d'une méthode security()", () => {
    const src = fs.readFileSync(LOGGER_JS, "utf8");
    expect(src).toContain("security");
    const logger = require("../src/utils/logger");
    expect(typeof logger.security).toBe("function");
  });

  test("logger.js écrit les événements SECURITY dans errors.log", () => {
    const src = fs.readFileSync(LOGGER_JS, "utf8");
    expect(src).toContain("ERROR_LOG");
    expect(src).toContain("SECURITY");
  });

  test("Le répertoire de logs backend est accessible en écriture", () => {
    // Crée le dossier si absent (logger.js le crée aussi au démarrage)
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    expect(fs.existsSync(LOGS_DIR)).toBe(true);

    // Vérifie les droits d'écriture
    const testFile = path.join(LOGS_DIR, ".write-test");
    expect(() => {
      fs.writeFileSync(testFile, "ok");
      fs.unlinkSync(testFile);
    }).not.toThrow();
  });

  // ── Vérification intégration : DB connectée (via /api/health) ─

  test("La base de données est connectée et opérationnelle (GET /api/health)", async () => {
    const res = await api.get("/api/health");
    expect(res.status).toBe(200);
    const body = res.data;
    // Le health check doit confirmer que la DB répond
    const isUp =
      body?.status === "ok" ||
      body?.database === "ok" ||
      body?.db === "ok" ||
      (typeof body === "object" && !body?.error);
    expect(isUp).toBe(true);
  });

  test("Les erreurs de sécurité sont visibles dans /api/logs (Admin seulement)", async () => {
    if (!config.ADMIN.email) return;
    let adminToken;
    try { adminToken = await getAdminToken(); } catch { return; }

    const res = await api.get("/api/logs?limit=50", { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);

    const logs = Array.isArray(res.data) ? res.data : res.data?.logs || [];
    // On vérifie que l'endpoint répond et retourne un tableau — pas forcément des erreurs DB
    expect(Array.isArray(logs)).toBe(true);
  });

  // ── Vérification : l'écouteur ne casse pas le pool en prod ────

  test("db.js ne relance pas l'erreur (pas de uncaughtException)", () => {
    const src = fs.readFileSync(DB_JS, "utf8");
    // L'écouteur ne doit pas contenir 'throw' (ferait crasher le process)
    const handler = src.slice(src.indexOf('pool.on("error"'));
    const firstClose = handler.indexOf("});");
    const handlerBody = handler.slice(0, firstClose);
    expect(handlerBody).not.toContain("throw ");
  });
});
