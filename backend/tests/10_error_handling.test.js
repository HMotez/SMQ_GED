/**
 * Règles 15, 16 — Gestion des erreurs
 * 15 : Messages d'erreurs génériques (pas de stack trace, pas de chemin)
 * 16 : Toutes les exceptions sont gérées (pas de crash serveur)
 *
 * Commande : npm run test:10
 */
"use strict";
const { api } = require("./helpers");

describe("Règle 15 — Messages d'erreur génériques (pas d'infos internes)", () => {
  test("Route inexistante → 404 avec message générique (pas de stack trace)", async () => {
    const res = await api.get("/api/route_qui_nexiste_pas_xyz");
    expect(res.status).toBe(404);
    const body = JSON.stringify(res.data);
    expect(body).not.toMatch(/Error:\s+\w+.*at\s+\w+/);
    expect(body).not.toMatch(/node_modules/);
  });

  test("Réponse d'erreur ne contient pas de chemin de fichier serveur", async () => {
    const res = await api.get("/api/endpoint_inexistant");
    const body = JSON.stringify(res.data);
    expect(body).not.toMatch(/\/app\/|\/home\/|C:\\Users|\/src\//);
    expect(body).not.toMatch(/controllers\/|middleware\/|\.js:\d+/);
  });

  test("Réponse d'erreur ne contient pas d'informations sur la base de données", async () => {
    const res = await api.post("/api/auth/login", { email: "'; DROP TABLE users;--", password: "x" });
    const body = JSON.stringify(res.data);
    expect(body).not.toMatch(/pg|postgres|sql|query|column|relation/i);
    expect(body).not.toMatch(/PG\d+|ERROR.*syntax/i);
  });

  test("Réponse d'erreur ne révèle pas la version Node.js", async () => {
    const res = await api.get("/api/inexistant");
    const body = JSON.stringify(res.data);
    expect(body).not.toMatch(/node\s+v?\d+\.\d+/i);
  });
});

describe("Règle 16 — Toutes les exceptions sont gérées (pas de crash 500)", () => {
  test("JSON malformé dans le body → 400 (pas 500)", async () => {
    const res = await api.post("/api/auth/login", "{invalid json{{", {
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).not.toBe(500);
  });

  test("Paramètres de type incorrect (number au lieu de string) → géré (pas 500)", async () => {
    const res = await api.post("/api/auth/login", { email: 12345, password: true });
    expect(res.status).not.toBe(500);
  });

  test("Body très long (>1MB) → géré proprement (413 ou 400, pas 500)", async () => {
    const bigBody = { email: "a".repeat(1_100_000), password: "b" };
    const res = await api.post("/api/auth/login", bigBody);
    expect([400, 413]).toContain(res.status);
  });

  test("Méthode HTTP non supportée (DELETE sur /api/auth/login) → 404 ou 405", async () => {
    const res = await api.delete("/api/auth/login");
    expect([404, 405]).toContain(res.status);
  });

  test("En-tête Content-Type absent → géré sans crash", async () => {
    const res = await api.post("/api/auth/login", null, {
      headers: { "Content-Type": "" },
    });
    expect(res.status).not.toBe(500);
  });

  test("Serveur répond toujours après des requêtes invalides (health check)", async () => {
    // Envoyer plusieurs requêtes invalides
    await Promise.all([
      api.get("/api/inexistant1"),
      api.post("/api/auth/login", "{}{{"),
      api.get("/api/inexistant2"),
    ]);
    // Le serveur doit toujours répondre
    const res = await api.get("/api/health");
    expect(res.status).toBe(200);
  });
});

// ─── Contre-tests ─────────────────────────────────────────────────────────────
describe("Contre-tests 10 — Gestion des erreurs : résilience et conformité", () => {
  test("Toutes les réponses d'erreur sont en JSON (pas de HTML d'erreur Express)", async () => {
    const res = await api.get("/api/route_inexistante_xyz");
    const ct = res.headers["content-type"] || "";
    expect(ct).toMatch(/application\/json/i);
    expect(ct).not.toMatch(/text\/html/i);
  });

  test("Réponse d'erreur 404 contient un champ 'error' lisible", async () => {
    const res = await api.get("/api/route_inexistante_abc");
    expect(res.status).toBe(404);
    expect(res.data).toHaveProperty("error");
    expect(typeof res.data.error).toBe("string");
  });

  test("Méthode PATCH non supportée sur /api/auth/login → 404 ou 405 (pas 500)", async () => {
    const res = await api.patch("/api/auth/login", {});
    expect([404, 405]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  test("Requête valide après une rafale d'erreurs → serveur toujours opérationnel", async () => {
    await Promise.all(
      Array.from({ length: 10 }, () => api.post("/api/auth/login", "{{{bad json", {
        headers: { "Content-Type": "application/json" },
      }))
    );
    const res = await api.get("/api/health");
    expect(res.status).toBe(200);
  });

  test("Corps de réponse d'erreur ne dépasse pas 1 Ko (pas de verbosité excessive)", async () => {
    const res = await api.get("/api/route_xyz_inexistante");
    const bodySize = JSON.stringify(res.data).length;
    expect(bodySize).toBeLessThan(1024);
  });
});
