/**
 * Règle 4 — Messages d'erreur génériques (anti-énumération de comptes)
 * Le même message d'erreur doit être retourné que l'email existe ou non.
 * Cela empêche un attaquant de deviner quels emails sont enregistrés.
 *
 * Commande : npm run test:03
 */
"use strict";
const { api } = require("./helpers");
const config  = require("./config");

const GENERIC_MSG  = "Email ou mot de passe incorrect.";
const GENERIC_CODE = "INVALID_CREDENTIALS";

describe("Règle 4 — Messages d'erreur génériques (anti-énumération)", () => {
  test("Email inexistant → message générique (pas 'utilisateur introuvable')", async () => {
    
    const res = await api.post("/api/auth/login", {
      email:    "email_qui_nexiste_pas_xyz999@nowhere.invalid",
      password: "SomePassword@123!",
    });
    expect(res.status).toBe(401);
    expect(res.data.error).toBe(GENERIC_MSG);
    expect(res.data.code).toBe(GENERIC_CODE);
  });

  test("Email valide + mauvais mot de passe → même message générique", async () => {
    if (!config.ADMIN.email) return;
    const res = await api.post("/api/auth/login", {
      email:    config.ADMIN.email,
      password: "MauvaisMotDePasse@999!",
    });
    // 401 = wrong password | 429 = already locked from test:01
    if (res.status === 401) {
      expect(res.data.error).toBe(GENERIC_MSG);
      expect(res.data.code).toBe(GENERIC_CODE);
    } else {
      // Compte peut être verrouillé par test:01 — comportement attendu
      expect(res.status).toBe(429);
    }
  });

  test("Message d'erreur ne révèle pas si l'email existe ou non", async () => {
    const res = await api.post("/api/auth/login", {
      email:    "email_inconnu_abc123@test.invalid",
      password: "AnyPassword@123!",
    });
    const body = JSON.stringify(res.data).toLowerCase();
    // Ne doit pas contenir ces indices
    expect(body).not.toMatch(/introuvable|not found|no user|n.existe pas/i);
    expect(body).not.toMatch(/email.*invalide|invalid.*email/i);
  });

  test("Réponse d'erreur ne contient pas de stack trace", async () => {
    const res = await api.post("/api/auth/login", {
      email:    "test@test.invalid",
      password: "pwd",
    });
    const body = JSON.stringify(res.data);
    expect(body).not.toMatch(/Error:|at\s+\w+\s*\(/);
    expect(body).not.toMatch(/node_modules/);
  });

  test("Réponse d'erreur ne contient pas de chemin de fichier serveur", async () => {
    const res = await api.post("/api/auth/login", {
      email:    "test@test.invalid",
      password: "AnyPassword@!",
    });
    const body = JSON.stringify(res.data);
    expect(body).not.toMatch(/\/app\/|\/src\/|controllers\/|\.js:\d+/);
  });

  test("Body vide sur login → 400 (credentials requis)", async () => {
    const res = await api.post("/api/auth/login", {});
    expect(res.status).toBe(400);
  });
});

// ─── Contre-tests ─────────────────────────────────────────────────────────────
describe("Contre-tests 03 — Messages génériques : cas d'échec attendus", () => {
  test("Login valide (bon email + bon mot de passe) → 200 avec token (système opérationnel)", async () => {
    if (!config.ADMIN.email || !config.ADMIN.password) return;
    const res = await api.post("/api/auth/login", config.ADMIN);
    // 200 = connexion réussie | 429 = compte verrouillé (test:01 l'a verrouillé)
    if (res.status === 200) {
      expect(res.data).toHaveProperty("token");
      expect(typeof res.data.token).toBe("string");
    } else {
      expect(res.status).toBe(429); // acceptable : verrouillé par test:01
    }
  });

  test("Injection SQL dans le champ email → réponse générique, pas d'erreur SQL exposée", async () => {
    const res = await api.post("/api/auth/login", {
      email:    "'; SELECT * FROM users; --",
      password: "AnyPassword@123!",
    });
    const body = JSON.stringify(res.data).toLowerCase();
    expect([400, 401]).toContain(res.status);
    expect(body).not.toMatch(/syntax error|pg error|column|relation|operator/i);
  });

  test("Login avec champs null → 400, pas de crash 500", async () => {
    const res = await api.post("/api/auth/login", { email: null, password: null });
    expect([400, 401]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  test("Réponse de succès (200) contient token mais PAS le mot de passe en clair", async () => {
    if (!config.ADMIN.email || !config.ADMIN.password) return;
    const res = await api.post("/api/auth/login", config.ADMIN);
    if (res.status !== 200) return;
    const body = JSON.stringify(res.data);
    expect(body).not.toMatch(/password|pwd|motdepasse/i);
  });
});
