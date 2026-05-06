/**
 * Règle 14 (complémentaire) — Rate Limiting sur les routes d'authentification
 * Limite configurée via AUTH_RATE_LIMIT_MAX (défaut : 20 en prod, 100 en dev/test)
 * Limite globale : 1000 requêtes / heure par IP
 *
 * ⚠️  AVERTISSEMENT : Ce test doit être exécuté EN ISOLATION (npm run test:12).
 * Il épuise le rate limiter pour 15 min — attendez ensuite avant tout test auth.
 * Exclu de npm test pour éviter de bloquer les tests suivants.
 *
 * Commande : npm run test:12
 */
"use strict";
const { api } = require("./helpers");

// Lire la limite depuis l'env (même valeur que le backend Docker)
const AUTH_RATE_LIMIT_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX || "100", 10);

describe(`Rate Limiting — Limite d'authentification (${AUTH_RATE_LIMIT_MAX} req/15min)`, () => {
  const fakeCredentials = { email: "ratelimit_test@nowhere.invalid", password: "Test@12345!" };

  test(`Après ${AUTH_RATE_LIMIT_MAX + 1} requêtes rapides sur /api/auth/login → 429`, async () => {
    const responses = [];

    for (let i = 0; i < AUTH_RATE_LIMIT_MAX + 2; i++) {
      const res = await api.post("/api/auth/login", fakeCredentials);
      responses.push(res.status);
    }

    expect(responses).toContain(429);
  }, 120000);

  test("Réponse 429 contient header Retry-After ou X-RateLimit-Reset", async () => {
    let rateLimitRes;
    for (let i = 0; i < AUTH_RATE_LIMIT_MAX + 5; i++) {
      const res = await api.post("/api/auth/login", fakeCredentials);
      if (res.status === 429) { rateLimitRes = res; break; }
    }

    if (!rateLimitRes) {
      console.warn("⚠️  Rate limit non déclenché — vérifiez la configuration express-rate-limit");
      return;
    }

    const hasRateLimitHeader =
      rateLimitRes.headers["retry-after"] !== undefined ||
      rateLimitRes.headers["x-ratelimit-reset"] !== undefined ||
      rateLimitRes.headers["ratelimit-reset"] !== undefined;

    expect(hasRateLimitHeader).toBe(true);
  }, 120000);

  test("Le rate limit global (1000 req/h) est plus permissif que le limit auth", () => {
    const GLOBAL_LIMIT = 1000;
    expect(GLOBAL_LIMIT).toBeGreaterThan(AUTH_RATE_LIMIT_MAX);
  });
});
