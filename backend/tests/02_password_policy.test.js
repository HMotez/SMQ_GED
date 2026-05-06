/**
 * Règle 2 — Politique de complexité du mot de passe
 * Les mots de passe faibles doivent être rejetés à l'inscription (HTTP 400).
 * Critères : min 12 chars, majuscule, minuscule, chiffre, caractère spécial.
 *
 * Ces tests n'insèrent rien en base (validation avant INSERT).
 * Commande : npm run test:02
 */
"use strict";
const { api } = require("./helpers");

function makePayload(password) {
  return {
    name:          "Test Sécurité",
    email:         `sec_test_${Date.now()}_${Math.random().toString(36).slice(2)}@actia.test`,
    password,
    confirmPassword: password,
    requestedRole: "Reviewer",
  };
}

async function tryRegister(password) {
  return api.post("/api/auth/register", makePayload(password));
}

describe("Règle 2 — Politique de complexité du mot de passe", () => {
  test("Mot de passe trop court (<12 chars) → 400 VALIDATION_ERROR", async () => {
    const res = await tryRegister("Short@1A");
    expect(res.status).toBe(400);
    expect(res.data.code).toBe("VALIDATION_ERROR");
  });

  test("Mot de passe sans majuscule → 400 VALIDATION_ERROR", async () => {
    const res = await tryRegister("nouppercase@2025!");
    expect(res.status).toBe(400);
    expect(res.data.code).toBe("VALIDATION_ERROR");
  });

  test("Mot de passe sans minuscule → 400 VALIDATION_ERROR", async () => {
    const res = await tryRegister("NOLOWERCASE@2025!");
    expect(res.status).toBe(400);
    expect(res.data.code).toBe("VALIDATION_ERROR");
  });

  test("Mot de passe sans chiffre → 400 VALIDATION_ERROR", async () => {
    const res = await tryRegister("NoDigitsOnly@Abc!");
    expect(res.status).toBe(400);
    expect(res.data.code).toBe("VALIDATION_ERROR");
  });

  test("Mot de passe sans caractère spécial → 400 VALIDATION_ERROR", async () => {
    const res = await tryRegister("NoSpecialChar2025A");
    expect(res.status).toBe(400);
    expect(res.data.code).toBe("VALIDATION_ERROR");
  });

  test("Mot de passe vide → 400", async () => {
    const res = await tryRegister("");
    expect(res.status).toBe(400);
  });

  test("Mot de passe valide (≥12 chars, maj, min, chiffre, spécial) → accepté (201)", async () => {
    const res = await tryRegister("ValidPass@2025!");
    // 201 = compte créé en attente d'activation
    // 409 = email déjà utilisé (improbable avec timestamp)
    expect([201, 409]).toContain(res.status);
    if (res.status === 201) {
      expect(res.data.pending).toBe(true);
    }
  });

  test("Réponse contient la liste des erreurs de validation", async () => {
    const res = await tryRegister("weak");
    expect(res.status).toBe(400);
    expect(Array.isArray(res.data.errors)).toBe(true);
    expect(res.data.errors.length).toBeGreaterThan(0);
  });
});
