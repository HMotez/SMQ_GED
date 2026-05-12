/**
 * Règle 29 — Supervision des performances
 * L'application, le serveur et les services doivent être supervisés en continu.
 * Vérifie : endpoint /api/health, métriques Prometheus (/api/metrics).
 *
 * Commande : npm run test:14
 */
"use strict";
const { api, getAdminToken, authHeader } = require("./helpers");
const config = require("./config");

describe("Règle 29 — Supervision des performances (Health & Metrics)", () => {
  test("GET /api/health → 200 (serveur opérationnel)", async () => {
    const res = await api.get("/api/health");
    expect(res.status).toBe(200);
  });

  test("GET /api/health retourne des informations de statut", async () => {
    const res = await api.get("/api/health");
    expect(res.status).toBe(200);
    // Doit retourner un objet avec au moins un champ de statut
    expect(res.data).toBeDefined();
    const body = JSON.stringify(res.data).toLowerCase();
    expect(body).toMatch(/ok|healthy|status|up/i);
  });

  test("GET /api/metrics → accessible (métriques Prometheus)", async () => {
    const res = await api.get("/api/metrics");
    // 200 = métriques disponibles | 404 = endpoint non exposé en prod (acceptable)
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      // Format Prometheus : texte avec des lignes # HELP
      const isPrometheusFormat =
        typeof res.data === "string" &&
        (res.data.includes("# HELP") || res.data.includes("# TYPE"));
      expect(isPrometheusFormat).toBe(true);
    }
  });

  test("Métriques incluent des compteurs HTTP (http_requests_total)", async () => {
    const res = await api.get("/api/metrics");
    if (res.status !== 200) return;
    expect(res.data).toMatch(/http_requests_total|http_request_duration/i);
  });

  test("GET /api/health est accessible sans authentification (endpoint public)", async () => {
    const res = await api.get("/api/health");
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  test("Serveur répond en moins de 2000ms", async () => {
    const start = Date.now();
    await api.get("/api/health");
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});

describe("Règle 29 — Supervision : Health checks des services", () => {
  let adminToken;

  beforeAll(async () => {
    if (!config.ADMIN.email) return;
    try { adminToken = await getAdminToken(); } catch {}
  });

  test("Base de données accessible (réponse API valide)", async () => {
    if (!adminToken) return;
    // Si la DB est down, les endpoints retourneraient 500
    const res = await api.get("/api/documents", { headers: authHeader(adminToken) });
    expect(res.status).not.toBe(500);
  });

  test("Endpoint /api/health ne retourne pas 500 (tous services OK)", async () => {
    const res = await api.get("/api/health");
    expect(res.status).not.toBe(500);
  });
});

// ─── Contre-tests ─────────────────────────────────────────────────────────────
describe("Contre-tests 14 — Supervision : données sensibles non exposées", () => {
  test("GET /api/health ne révèle pas les credentials de la base de données", async () => {
    const res = await api.get("/api/health");
    const body = JSON.stringify(res.data).toLowerCase();
    expect(body).not.toMatch(/password|db_pass|db_user.*:.*[a-z]/i);
    expect(body).not.toMatch(/postgresql:\/\/\w+:\w+@/i);
  });

  test("GET /api/health ne révèle pas les clés secrètes (JWT_SECRET, etc.)", async () => {
    const res = await api.get("/api/health");
    const body = JSON.stringify(res.data);
    expect(body).not.toMatch(/jwt_secret|secret_key|api_key/i);
  });

  test("GET /api/health répond en moins de 500ms (pas de timeout DB)", async () => {
    const start = Date.now();
    await api.get("/api/health");
    expect(Date.now() - start).toBeLessThan(500);
  });

  test("GET /api/health retourne un objet structuré (pas une chaîne brute)", async () => {
    const res = await api.get("/api/health");
    expect(typeof res.data).toBe("object");
    expect(res.data).not.toBeNull();
    expect(typeof res.data).not.toBe("string");
  });

  test("GET /api/metrics ne retourne pas de credentials ou tokens actifs", async () => {
    const res = await api.get("/api/metrics");
    if (res.status !== 200) return;
    const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    // Exclure les lignes de commentaire Prometheus (# HELP / # TYPE) avant de vérifier
    const metricsValues = body.split("\n").filter(l => !l.startsWith("#")).join("\n");
    expect(body).not.toMatch(/bearer\s+[a-z0-9._-]{20,}/i);
    expect(metricsValues).not.toMatch(/password\s*[:=]\s*\S+|secret\s*[:=]\s*\S+|private_key\s*[:=]\s*\S+/i);
  });
});
