/**
 * Règles 13, 14 — Contrôle d'accès
 * 13 : Principe du moindre privilège (RBAC — 3 rôles)
 * 14 : Contrôle d'accès vérifié sur chaque route
 *
 * Commande : npm run test:09
 */
"use strict";
const { api, getAdminToken, getReviewerToken, authHeader, skipIfMissing } = require("./helpers");
const config = require("./config");

// ─── Règle 14 : Authentification requise sur toutes les routes ────────────────
describe("Règle 14 — Authentification obligatoire sur routes protégées", () => {
  const protectedRoutes = [
    "/api/users",
    "/api/logs",
    "/api/notifications",
    "/api/incidents",
  ];

  test.each(protectedRoutes)(
    "GET %s sans token → 401",
    async (route) => {
      const res = await api.get(route);
      expect(res.status).toBe(401);
    }
  );

  test("Token Bearer invalide (mauvaise signature) → 401", async () => {
    const res = await api.get("/api/logs", {
      headers: authHeader("token.invalide.ici"),
    });
    expect(res.status).toBe(401);
  });

  test("Header Authorization mal formé (pas Bearer) → 401", async () => {
    const res = await api.get("/api/logs", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    expect(res.status).toBe(401);
  });
});

// ─── Règle 13 : Moindre privilège — Reviewer ne peut pas tout faire ───────────
describe("Règle 13 — Principe du moindre privilège (RBAC)", () => {
  let reviewerToken;
  let adminToken;

  beforeAll(async () => {
    if (!config.REVIEWER.email || !config.ADMIN.email) return;
    try {
      reviewerToken = await getReviewerToken();
      adminToken    = await getAdminToken();
    } catch (e) {
      console.warn("⚠️  Impossible d'obtenir les tokens:", e.message);
    }
  });

  test("Reviewer : GET /api/documents → 200 (lecture autorisée)", async () => {
    if (!reviewerToken) return;
    const res = await api.get("/api/documents", { headers: authHeader(reviewerToken) });
    expect(res.status).toBe(200);
  });

  test("Reviewer : GET /api/users → 403 (gestion utilisateurs = Admin seulement)", async () => {
    if (!reviewerToken) return;
    const res = await api.get("/api/users", { headers: authHeader(reviewerToken) });
    expect(res.status).toBe(403);
  });

  test("Reviewer : GET /api/logs → 403 (journaux d'audit = Admin seulement)", async () => {
    if (!reviewerToken) return;
    const res = await api.get("/api/logs", { headers: authHeader(reviewerToken) });
    expect(res.status).toBe(403);
  });

  test("Reviewer : POST /api/documents/archive-expired → 403 (Admin seulement)", async () => {
    if (!reviewerToken) return;
    const res = await api.post("/api/documents/archive-expired", {}, {
      headers: authHeader(reviewerToken),
    });
    expect(res.status).toBe(403);
  });

  test("Admin : GET /api/users → 200 (accès autorisé)", async () => {
    if (!adminToken) return;
    const res = await api.get("/api/users", { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);
  });

  test("Admin : GET /api/logs → 200 (accès autorisé)", async () => {
    if (!adminToken) return;
    const res = await api.get("/api/logs", { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);
  });

  test("Réponse 403 ne révèle pas de détails sur la permission manquante", async () => {
    if (!reviewerToken) return;
    const res = await api.get("/api/users", { headers: authHeader(reviewerToken) });
    expect(res.status).toBe(403);
    const body = JSON.stringify(res.data);
    // Ne doit pas révéler la structure interne
    expect(body).not.toMatch(/sql|query|database|table|column/i);
  });
});

// ─── Contre-tests ─────────────────────────────────────────────────────────────
describe("Contre-tests 09 — Contrôle d'accès : cas d'échec attendus", () => {
  let reviewerToken;
  let adminToken;

  beforeAll(async () => {
    if (!config.REVIEWER.email || !config.ADMIN.email) return;
    try {
      reviewerToken = await getReviewerToken();
      adminToken    = await getAdminToken();
    } catch {}
  });

  test("Visiteur non connecté → toutes les routes protégées retournent 401", async () => {
    const routes = ["/api/users", "/api/logs", "/api/incidents", "/api/notifications", "/api/dashboard/overview"];
    for (const route of routes) {
      const res = await api.get(route);
      expect(res.status).toBe(401);
    }
  });

  test("Reviewer ne peut pas accéder aux incidents (Admin seulement)", async () => {
    if (!reviewerToken) return;
    const res = await api.get("/api/incidents", { headers: authHeader(reviewerToken) });
    expect(res.status).toBe(403);
  });

  test("Reviewer ne peut pas créer un incident manuellement (Admin seulement)", async () => {
    if (!reviewerToken) return;
    const res = await api.post("/api/incidents", {
      type: "TEST", severity: "info", description: "test",
    }, { headers: authHeader(reviewerToken) });
    expect(res.status).toBe(403);
  });

  test("Token valide d'un rôle ne peut pas escalader vers Admin (PATCH /api/roles/users/:id)", async () => {
    if (!reviewerToken) return;
    const res = await api.patch("/api/roles/users/1", { role: "Admin" }, {
      headers: authHeader(reviewerToken),
    });
    expect(res.status).toBe(403);
  });

  test("Admin authentifié peut accéder aux routes Admin (pas de faux positif 403)", async () => {
    if (!adminToken) return;
    const res = await api.get("/api/incidents", { headers: authHeader(adminToken) });
    expect(res.status).toBe(200);
  });
});
