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
