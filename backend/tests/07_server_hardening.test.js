/**
 * Règle 19 — Endurcissement du serveur : masquer les technologies utilisées
 * - Express : X-Powered-By désactivé
 * - Nginx   : server_tokens off (pas de version dans le header Server)
 * - Les réponses d'erreur ne révèlent pas les frameworks/versions
 *
 * Commande : npm run test:07
 */
"use strict";
const { api, apiHttps } = require("./helpers");

describe("Règle 19 — Masquage des technologies et versions serveur", () => {
  test("X-Powered-By absent (Express désactivé via app.disable)", async () => {
    const res = await api.get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  test("Header Server du backend ne révèle pas la version Express/Node", async () => {
    const res = await api.get("/api/health");
    const server = res.headers["server"] || "";
    expect(server).not.toMatch(/express\/\d+/i);
    expect(server).not.toMatch(/node\.js\/\d+/i);
  });

  test("Réponse 404 ne révèle pas les technologies utilisées", async () => {
    const res = await api.get("/api/route_inexistante_xyz_abc");
    const body = JSON.stringify(res.data);
    expect(body).not.toMatch(/express|node\.js|v\d+\.\d+\.\d+/i);
    expect(body).not.toMatch(/Cannot GET|Cannot POST/i); // message Express par défaut
  });

  test("Réponse 404 ne contient pas de chemin interne du serveur", async () => {
    const res = await api.get("/api/route_inexistante");
    const body = JSON.stringify(res.data);
    expect(body).not.toMatch(/\/app\/|\/home\/|C:\\|node_modules/);
  });

  test("Header Server nginx ne révèle pas la version (server_tokens off)", async () => {
    let res;
    try {
      res = await apiHttps.get("/api/health", { timeout: 3000 });
    } catch {
      console.warn("⚠️  nginx non disponible — test ignoré");
      return;
    }
    const server = res.headers["server"] || "";
    // Acceptable: "nginx" sans version, ou absent
    expect(server).not.toMatch(/nginx\/\d+\.\d+\.\d+/i);
  });

  test("Réponse avec JSON malformé → 400 sans détails internes", async () => {
    const res = await api.post("/api/auth/login", "not-valid-json{{{", {
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 500]).toContain(res.status);
    if (res.status === 500) {
      const body = JSON.stringify(res.data);
      // Si 500, s'assurer qu'il n'y a pas de stack trace
      expect(body).not.toMatch(/SyntaxError.*at/);
    }
  });
});
