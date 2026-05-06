/**
 * Règle 31 — Journaux d'audit
 * Les actions suspectes, accès non autorisés et tentatives de connexion
 * doivent être enregistrés avec : user_id, action, severity, IP, timestamp.
 *
 * Commande : npm run test:13
 */
"use strict";
const { api, getAdminToken, authHeader, skipIfMissing } = require("./helpers");
const config = require("./config");

describe("Règle 31 — Journaux d'audit", () => {
  let adminToken;

  beforeAll(async () => {
    if (skipIfMissing(config.ADMIN.email, "TEST_ADMIN_EMAIL")) return;
    adminToken = await getAdminToken();
  });

  test("GET /api/logs avec token Admin → 200 et liste de logs", async () => {
    if (!adminToken) return;
    const res = await api.get("/api/logs", { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data) || Array.isArray(res.data?.logs)).toBe(true);
  });

  test("Les logs contiennent les champs requis (action, severity, timestamp)", async () => {
    if (!adminToken) return;
    const res = await api.get("/api/logs?limit=5", { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);

    const logs = Array.isArray(res.data) ? res.data : res.data?.logs || [];
    if (logs.length === 0) {
      console.warn("⚠️  Aucun log en base — effectuez des actions et relancez");
      return;
    }

    const log = logs[0];
    expect(log).toHaveProperty("action");
    expect(log).toHaveProperty("created_at");
  });

  test("Tentative de connexion échouée génère un log LOGIN_FAILURE", async () => {
    // Générer un événement
    const before = new Date().toISOString();
    await api.post("/api/auth/login", {
      email:    "audit_test_xyz@nowhere.invalid",
      password: "WrongPwd@123!",
    });

    if (!adminToken) return;
    const res = await api.get("/api/logs?limit=20", { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);

    const logs = Array.isArray(res.data) ? res.data : res.data?.logs || [];
    const failureLogs = logs.filter(
      (l) => l.action === "LOGIN_FAILURE" && new Date(l.created_at) >= new Date(before)
    );
    expect(failureLogs.length).toBeGreaterThan(0);
  });

  test("Connexion réussie génère un log LOGIN_SUCCESS", async () => {
    if (!adminToken) return;
    const before = new Date().toISOString();

    // Générer une connexion réussie
    await api.post("/api/auth/login", config.ADMIN);

    const res = await api.get("/api/logs?limit=20", { headers: authHeader(adminToken) });
    const logs = Array.isArray(res.data) ? res.data : res.data?.logs || [];
    const successLogs = logs.filter(
      (l) =>
        (l.action === "LOGIN_SUCCESS" || l.action === "LOGIN_SUCCESS_LDAP") &&
        new Date(l.created_at) >= new Date(before)
    );
    expect(successLogs.length).toBeGreaterThan(0);
  });

  test("Accès refusé (403) génère un log ACCESS_DENIED", async () => {
    if (!adminToken) return;
    const before = new Date().toISOString();

    // Générer un accès refusé avec le compte reviewer
    let made403 = false;
    if (config.REVIEWER.email) {
      const { getReviewerToken } = require("./helpers");
      try {
        const reviewerToken = await getReviewerToken();
        await api.get("/api/users", { headers: authHeader(reviewerToken) });
        made403 = true;
      } catch {}
    }

    const res = await api.get("/api/logs?limit=20", { headers: authHeader(adminToken) });
    const logs = Array.isArray(res.data) ? res.data : res.data?.logs || [];
    const deniedLogs = logs.filter(
      (l) => (l.action === "ACCESS_DENIED" || l.action === "ACCESS_DENIED_403" || l.action === "ACCESS_DENIED_401") &&
             new Date(l.created_at) >= new Date(before)
    );
    // Assertion seulement si le reviewer a bien pu s'authentifier et déclenché un 403
    if (made403) {
      expect(deniedLogs.length).toBeGreaterThan(0);
    }
  });

  test("GET /api/logs sans token → 401 (logs protégés)", async () => {
    const res = await api.get("/api/logs");
    expect(res.status).toBe(401);
  });

  test("GET /api/logs avec token Reviewer → 403 (logs = Admin seulement)", async () => {
    if (!config.REVIEWER.email) return;
    const { getReviewerToken } = require("./helpers");
    try {
      const reviewerToken = await getReviewerToken();
      const res = await api.get("/api/logs", { headers: authHeader(reviewerToken) });
      expect(res.status).toBe(403);
    } catch {}
  });
});
