/**
 * Règles 5, 6, 7 — Gestion des sessions
 * 5 : Délai d'expiration (JWT contient exp, max 24h)
 * 6 : Session invalidée après déconnexion (token blacklisté)
 * 7 : Endpoint de déconnexion opérationnel
 *
 * Commande : npm run test:04
 */
"use strict";
const { api, getAdminToken, authHeader, skipIfMissing } = require("./helpers");
const config = require("./config");

// ─── Règle 5 : Session timeout ────────────────────────────────────────────────
describe("Règle 5 — Délai d'expiration de session (JWT)", () => {
  let token;

  beforeAll(async () => {
    if (skipIfMissing(config.ADMIN.email, "TEST_ADMIN_EMAIL")) return;
    token = await getAdminToken();
  });

  test("Token JWT contient un champ 'exp' (expiration)", async () => {
    if (!token) return;
    const [, payload] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    expect(decoded.exp).toBeDefined();
    expect(typeof decoded.exp).toBe("number");
  });

  test("Token expire dans les 24 heures maximum", async () => {
    if (!token) return;
    const [, payload] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    const expiresInHours = (decoded.exp - Math.floor(Date.now() / 1000)) / 3600;
    expect(expiresInHours).toBeGreaterThan(0);
    expect(expiresInHours).toBeLessThanOrEqual(24);
  });

  test("Token avec signature invalide → 401", async () => {
    const fakeToken =
      "eyJhbGciOiJIUzI1NiJ9." +
      Buffer.from(JSON.stringify({ id: 1, exp: Math.floor(Date.now() / 1000) + 3600 }))
        .toString("base64url") +
      ".signature_invalide";
    const res = await api.get("/api/auth/me", { headers: authHeader(fakeToken) });
    expect(res.status).toBe(401);
  });

  test("Requête sans token → 401", async () => {
    const res = await api.get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("Token valide → GET /api/auth/me retourne les infos utilisateur", async () => {
    if (!token) return;
    const res = await api.get("/api/auth/me", { headers: authHeader(token) });
    expect(res.status).toBe(200);
    // /api/auth/me returns { user: { email, ... } }
    expect(res.data.user?.email ?? res.data.email).toBeDefined();
  });
});

// ─── Règle 6 : Session invalidée après logout ─────────────────────────────────
describe("Règle 6 — Session invalidée après déconnexion (blacklist)", () => {
  let token;

  beforeAll(async () => {
    if (skipIfMissing(config.ADMIN.email, "TEST_ADMIN_EMAIL")) return;
    token = await getAdminToken();
  });

  test("Token fonctionne avant logout (200 sur /api/auth/me)", async () => {
    if (!token) return;
    const res = await api.get("/api/auth/me", { headers: authHeader(token) });
    expect(res.status).toBe(200);
  });

  test("Logout retourne 200 et message de confirmation", async () => {
    if (!token) return;
    const res = await api.post("/api/auth/logout", {}, { headers: authHeader(token) });
    expect(res.status).toBe(200);
    expect(res.data.message).toMatch(/d.connexion|session|d.truite/i);
  });

  test("Après logout, le même token est rejeté → 401", async () => {
    if (!token) return;
    const res = await api.get("/api/auth/me", { headers: authHeader(token) });
    expect(res.status).toBe(401);
  });

  test("Le token invalidé ne peut pas appeler d'autres endpoints protégés", async () => {
    if (!token) return;
    // /api/incidents uses loadUser + requireRole("Admin") — properly protected
    const res = await api.get("/api/incidents", { headers: authHeader(token) });
    expect(res.status).toBe(401);
  });
});

// ─── Règle 7 : Bouton de déconnexion (endpoint) ───────────────────────────────
describe("Règle 7 — Endpoint de déconnexion", () => {
  test("POST /api/auth/logout sans token → 200 (déconnexion gracieuse)", async () => {
    const res = await api.post("/api/auth/logout", {});
    expect(res.status).toBe(200);
  });

  test("POST /api/auth/logout avec token valide → 200", async () => {
    if (!config.ADMIN.email) return;
    const tok = await getAdminToken();
    const res = await api.post("/api/auth/logout", {}, { headers: authHeader(tok) });
    expect(res.status).toBe(200);
  });
});

// ─── Contre-tests ─────────────────────────────────────────────────────────────
describe("Contre-tests 04 — Sessions : cas d'échec attendus", () => {
  test("Token avec algorithme 'none' (bypass JWT) → 401", async () => {
    // Tentative de bypass alg:none : header.payload sans signature
    const header  = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ id: 1, role: "Admin", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
    const noneToken = `${header}.${payload}.`;
    const res = await api.get("/api/auth/me", { headers: authHeader(noneToken) });
    expect(res.status).toBe(401);
  });

  test("Token avec payload modifié (rôle falsifié) → 401", async () => {
    if (!config.ADMIN.email) return;
    const tok = await getAdminToken();
    const parts = tok.split(".");
    // Modifier le payload pour s'attribuer un rôle différent
    const fakePayload = Buffer.from(JSON.stringify({ id: 9999, role: "SuperAdmin", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
    const tamperedToken = `${parts[0]}.${fakePayload}.${parts[2]}`;
    const res = await api.get("/api/auth/me", { headers: authHeader(tamperedToken) });
    expect(res.status).toBe(401);
  });

  test("Token expiré (exp = 1 seconde passée) → 401", async () => {
    const header  = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ id: 1, exp: 1 })).toString("base64url"); // exp = epoch 1 = passé
    const fakeExpired = `${header}.${payload}.invalidsignature`;
    const res = await api.get("/api/auth/me", { headers: authHeader(fakeExpired) });
    expect(res.status).toBe(401);
  });

  test("Double logout avec le même token → toujours 200 (idempotent)", async () => {
    if (!config.ADMIN.email) return;
    const tok = await getAdminToken();
    await api.post("/api/auth/logout", {}, { headers: authHeader(tok) });
    const res = await api.post("/api/auth/logout", {}, { headers: authHeader(tok) });
    expect(res.status).toBe(200);
  });
});
