/**
 * Règle 3 — Protection contre les attaques Brute Force
 * Après 3 tentatives échouées → compte bloqué 15 minutes (HTTP 429)
 *
 * PRÉREQUIS : TEST_LOCKABLE_EMAIL doit être un compte ACTIF dans la base.
 * RESET APRÈS LE TEST (si vous n'attendez pas 15 min) :
 *   psql -U smq_app -d smq_db -c "UPDATE users SET login_attempts=0, locked_until=NULL WHERE email='reviewer@actia.ged';"
 *
 * Commande : npm run test:01
 */
"use strict";
const { api, skipIfMissing } = require("./helpers");
const config = require("./config");

const WRONG_PWD = "WrongPassXXX!000";

describe("Règle 3 — Brute Force Protection", () => {
  const email   = config.LOCKABLE.email;
  const correct = config.LOCKABLE.password;

  beforeAll(() => {
    skipIfMissing(email, "TEST_LOCKABLE_EMAIL");
  });

  test("1ère tentative erronée → 401 INVALID_CREDENTIALS", async () => {
    if (!email) return;
    const res = await api.post("/api/auth/login", { email, password: WRONG_PWD });
    expect(res.status).toBe(401);
    expect(res.data.code).toBe("INVALID_CREDENTIALS");
  });

  test("2ème tentative erronée → 401 (compteur incrémenté)", async () => {
    if (!email) return;
    const res = await api.post("/api/auth/login", { email, password: WRONG_PWD });
    expect(res.status).toBe(401);
    expect(res.data.code).toBe("INVALID_CREDENTIALS");
  });

  test("3ème tentative erronée → compte verrouillé (429 ACCOUNT_LOCKED)", async () => {
    if (!email) return;
    const res = await api.post("/api/auth/login", { email, password: WRONG_PWD });
    expect(res.status).toBe(429);
    expect(res.data.code).toBe("ACCOUNT_LOCKED");
    expect(res.data.error).toMatch(/bloqu|verrou|minute/i);
  });

  test("Bon mot de passe après verrouillage → toujours bloqué (429)", async () => {
    if (!email) return;
    const res = await api.post("/api/auth/login", { email, password: correct });
    expect(res.status).toBe(429);
    expect(res.data.code).toBe("ACCOUNT_LOCKED");
  });

  test("Message de verrouillage indique la durée restante en minutes", async () => {
    if (!email) return;
    const res = await api.post("/api/auth/login", { email, password: WRONG_PWD });
    expect(res.status).toBe(429);
    expect(res.data.error).toMatch(/\d+\s*minute/i);
  });
});
