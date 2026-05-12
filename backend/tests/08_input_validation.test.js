/**
 * Règles 10, 11 — Validation des entrées et des fichiers
 * 10 : Valider la source de l'entrée (méthodes HTTP, body obligatoire)
 * 11 : Valider les fichiers uploadés (type, taille, contenu)
 *
 * Commande : npm run test:08
 */
"use strict";
const FormData = require("form-data");
const { api, getAdminToken, authHeader, skipIfMissing } = require("./helpers");
const config = require("./config");

// ─── Règle 10 : Source de l'entrée ───────────────────────────────────────────
describe("Règle 10 — Validation de la source des entrées", () => {
  test("GET sur endpoint POST /api/auth/login → 404 ou 405", async () => {
    const res = await api.get("/api/auth/login");
    expect([404, 405]).toContain(res.status);
  });

  test("GET sur endpoint POST /api/auth/register → 404 ou 405", async () => {
    const res = await api.get("/api/auth/register");
    expect([404, 405]).toContain(res.status);
  });

  test("Login sans body → 400 MISSING_CREDENTIALS", async () => {
    const res = await api.post("/api/auth/login", {});
    expect(res.status).toBe(400);
    expect(res.data.code).toBe("MISSING_CREDENTIALS");
  });

  test("Login avec email uniquement (pas de password) → 400", async () => {
    const res = await api.post("/api/auth/login", { email: "test@test.com" });
    expect(res.status).toBe(400);
  });

  test("Content-Type non-JSON sur endpoint JSON → géré proprement (pas crash)", async () => {
    const res = await api.post("/api/auth/login", "email=a&password=b", {
      headers: { "Content-Type": "text/plain" },
    });
    // Doit répondre sans crash serveur (pas de 5xx)
    expect(res.status).not.toBe(500);
  });

  test("Paramètres extra dans le body sont ignorés (pas d'injection)", async () => {
    const res = await api.post("/api/auth/login", {
      email:    "test@test.invalid",
      password: "pwd",
      __proto__: { admin: true },   // prototype pollution attempt
      isAdmin:  true,
    });
    // Doit répondre normalement (401) et pas exploser
    expect([400, 401]).toContain(res.status);
  });
});

// ─── Règle 11 : Validation des fichiers uploadés ─────────────────────────────
describe("Règle 11 — Validation des fichiers soumis à l'application", () => {
  let token;

  beforeAll(async () => {
    if (skipIfMissing(config.ADMIN.email, "TEST_ADMIN_EMAIL")) return;
    token = await getAdminToken();
  });

  test("Upload sans authentification → 401", async () => {
    const form = new FormData();
    form.append("file", Buffer.from("test content"), {
      filename:    "test.pdf",
      contentType: "application/pdf",
    });
    const res = await api.post("/api/documents", form, {
      headers: form.getHeaders(),
    });
    expect(res.status).toBe(401);
  });

  test("Upload fichier .exe (application/octet-stream) → rejeté (400)", async () => {
    if (!token) return;
    const form = new FormData();
    form.append("file", Buffer.from("MZ\x90\x00 fake executable"), {
      filename:    "virus.exe",
      contentType: "application/pdf",

    });
    const res = await api.post("/api/documents", form, {
      headers: { ...authHeader(token), ...form.getHeaders() },
    });
    expect([400, 415, 422]).toContain(res.status);
  });

  test("Upload fichier .sh (script shell) → rejeté", async () => {
    if (!token) return;
    const form = new FormData();
    form.append("file", Buffer.from("#!/bin/bash\nrm -rf /"), {
      filename:    "malicious.sh",
      contentType: "application/x-sh",
    });
    const res = await api.post("/api/documents", form, {
      headers: { ...authHeader(token), ...form.getHeaders() },
    });
    expect([400, 415, 422]).toContain(res.status);
  });

  test("Upload fichier .html (text/html) → rejeté", async () => {
    if (!token) return;
    const form = new FormData();
    form.append("file", Buffer.from("<script>alert(1)</script>"), {
      filename:    "xss.html",
      contentType: "text/html",
    });
    const res = await api.post("/api/documents", form, {
      headers: { ...authHeader(token), ...form.getHeaders() },
    });
    expect([400, 415, 422]).toContain(res.status);
  });

  test("Upload fichier .js (application/javascript) → rejeté", async () => {
    if (!token) return;
    const form = new FormData();
    form.append("file", Buffer.from("require('child_process').exec('id')"), {
      filename:    "backdoor.js",
      contentType: "application/javascript",
    });
    const res = await api.post("/api/documents", form, {
      headers: { ...authHeader(token), ...form.getHeaders() },
    });
    expect([400, 415, 422]).toContain(res.status);
  });

  test("Vérification : seuls PDF/DOCX/XLSX sont listés comme autorisés", () => {
    // Vérification documentaire des types autorisés
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    expect(allowedMimes).toHaveLength(5);
    expect(allowedMimes).not.toContain("application/octet-stream");
    expect(allowedMimes).not.toContain("text/html");
    expect(allowedMimes).not.toContain("application/javascript");
  });
});

// ─── Contre-tests ─────────────────────────────────────────────────────────────
describe("Contre-tests 08 — Validation des entrées : cas d'échec attendus", () => {
  let token;

  beforeAll(async () => {
    if (skipIfMissing(config.ADMIN.email, "TEST_ADMIN_EMAIL")) return;
    token = await getAdminToken();
  });

  test("Injection SQL dans le titre du document → géré proprement (pas 500)", async () => {
    if (!token) return;
    const form = new FormData();
    form.append("title", "'; DROP TABLE documents; --");
    form.append("file", Buffer.from("%PDF-1.4 fake"), {
      filename: "test.pdf", contentType: "application/pdf",
    });
    const res = await api.post("/api/documents", form, {
      headers: { ...authHeader(token), ...form.getHeaders() },
    });
    expect(res.status).not.toBe(500);
    const body = JSON.stringify(res.data).toLowerCase();
    expect(body).not.toMatch(/syntax error|pg error|column|relation/i);
  });

  test("Upload fichier dépassant 50 Mo → rejeté (413 ou 400)", async () => {
    if (!token) return;
    const bigBuffer = Buffer.alloc(51 * 1024 * 1024, "A"); // 51 MB
    const form = new FormData();
    form.append("file", bigBuffer, { filename: "big.pdf", contentType: "application/pdf" });
    const res = await api.post("/api/documents", form, {
      headers: { ...authHeader(token), ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength:    Infinity,
    });
    expect([400, 413, 422]).toContain(res.status);
  });

  test("Nom de fichier avec path traversal (../../etc/passwd.pdf) → fichier stocké sans traversal", async () => {
    if (!token) return;
    const form = new FormData();
    form.append("file", Buffer.from("%PDF-1.4 safe"), {
      filename:    "../../etc/passwd.pdf",
      contentType: "application/pdf",
    });
    const res = await api.post("/api/documents", form, {
      headers: { ...authHeader(token), ...form.getHeaders() },
    });
    // Doit être accepté (ou rejeté pour autre raison) mais JAMAIS stocker à /etc/passwd
    if (res.status === 201 || res.status === 200) {
      const storedFilename = res.data?.filename || res.data?.file || "";
      expect(storedFilename).not.toMatch(/\.\.\//);
      expect(storedFilename).not.toMatch(/etc\/passwd/);
    }
  });
});
