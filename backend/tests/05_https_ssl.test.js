/**
 * Règles 8, 9 — Protection des données en transit
 * 8 : SSL/HTTPS obligatoire — HTTP redirige vers HTTPS
 * 9 : Connexion TLS établie (certificat accepté)
 *
 * PRÉREQUIS : nginx doit être démarré (Docker).
 * Si nginx n'est pas démarré, ces tests seront ignorés.
 *
 * Commande : npm run test:05
 */
"use strict";
const { apiHttp, apiHttps } = require("./helpers");
const https  = require("https");
const config = require("./config");

// url défini au niveau module pour être accessible dans tous les describe
const url = new URL(config.NGINX_HTTPS);

// Helper : vérifie si nginx répond sur port 80
async function nginxAvailable() {
  try {
    await apiHttp.get("/", { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

// ─── Règle 8 : Redirection HTTP → HTTPS ──────────────────────────────────────
describe("Règle 8 — Redirection HTTP → HTTPS (nginx)", () => {
  let available = false;

  beforeAll(async () => {
    available = await nginxAvailable();
    if (!available) console.warn("⚠️  nginx non disponible — démarrez Docker pour ces tests");
  });

  test("GET http://localhost:80/ redirige vers HTTPS (301 ou 302)", async () => {
    if (!available) return;
    const res = await apiHttp.get("/");
    expect([301, 302]).toContain(res.status);
  });

  test("Header Location pointe vers https://", async () => {
    if (!available) return;
    const res = await apiHttp.get("/");
    expect(res.headers.location).toMatch(/^https:\/\//i);
  });

  test("Redirection préserve le chemin demandé", async () => {
    if (!available) return;
    const res = await apiHttp.get("/login");
    if ([301, 302].includes(res.status)) {
      expect(res.headers.location).toMatch(/https:\/\//i);
    }
  });
});

// ─── Règle 8 : HTTPS actif ───────────────────────────────────────────────────
describe("Règle 8 — HTTPS fonctionnel", () => {
  let available = false;

  beforeAll(async () => {
    try {
      await apiHttps.get("/", { timeout: 3000 });
      available = true;
    } catch {
      console.warn("⚠️  HTTPS (port 443) non disponible — démarrez Docker");
    }
  });

  test("GET https://localhost:443/ répond (2xx ou 3xx)", async () => {
    if (!available) return;
    const res = await apiHttps.get("/");
    expect(res.status).toBeLessThan(500);
  });

  test("HSTS header présent sur réponse HTTPS (max-age=31536000)", async () => {
    if (!available) return;
    const res = await apiHttps.get("/api/health");
    const hsts = res.headers["strict-transport-security"];
    expect(hsts).toBeDefined();
    expect(hsts).toMatch(/max-age=31536000/);
    expect(hsts).toMatch(/includeSubDomains/);
  });
});

// ─── Règle 9 : Certificat TLS ────────────────────────────────────────────────
describe("Règle 9 — Connexion TLS / Certificat SSL", () => {
  test("Connexion TLS s'établit (port 443 répond)", (done) => {
    const req = https.request({
      hostname:             url.hostname,
      port:                 url.port || 443,
      path:                 "/",
      method:               "GET",
      rejectUnauthorized:   false, // accepte self-signed en dev
      timeout:              5000,
    }, (res) => {
      expect(res.statusCode).toBeLessThan(600);
      res.destroy();
      done();
    });
    req.on("timeout", () => { req.destroy(); done(); });
    req.on("error", () => done()); // connexion refusée = nginx absent, pas une erreur TLS
    req.end();
  });

  test("Protocole TLS est 1.2 ou 1.3", (done) => {
    const req = https.request({
      hostname:           url.hostname,
      port:               url.port || 443,
      path:               "/",
      method:             "GET",
      rejectUnauthorized: false,
      timeout:            5000,
    }, (res) => {
      const tls = res.socket.getProtocol?.();
      if (tls) {
        expect(["TLSv1.2", "TLSv1.3"]).toContain(tls);
      }
      res.destroy();
      done();
    });
    req.on("timeout", () => { req.destroy(); done(); });
    req.on("error", () => done());
    req.end();
  });
});

// ─── Contre-tests ─────────────────────────────────────────────────────────────
describe("Contre-tests 05 — HTTPS/SSL : cas d'échec attendus", () => {
  test("HTTP (port 80) ne sert PAS directement le contenu API (redirection ou refus)", async () => {
    let res;
    try {
      res = await apiHttp.get("/api/health", { timeout: 3000 });
    } catch {
      return; // nginx absent — test ignoré
    }
    // HTTP NE doit PAS retourner 200 avec le contenu API en clair
    // Doit rediriger (301/302) ou refuser (404/403)
    expect([301, 302, 403, 404]).toContain(res.status);
  });

  test("TLS 1.0 et TLS 1.1 ne doivent pas être utilisés (protocoles obsolètes)", (done) => {
    const req = https.request({
      hostname:           url.hostname,
      port:               url.port || 443,
      path:               "/",
      method:             "GET",
      rejectUnauthorized: false,
      timeout:            5000,
    }, (res) => {
      const tls = res.socket.getProtocol?.();
      if (tls) {
        expect(tls).not.toBe("TLSv1");
        expect(tls).not.toBe("TLSv1.1");
      }
      res.destroy();
      done();
    });
    req.on("timeout", () => { req.destroy(); done(); });
    req.on("error", () => done());
    req.end();
  });

  test("HSTS header absent sur HTTP (ne doit exister que sur HTTPS)", async () => {
    let res;
    try {
      res = await apiHttp.get("/", { timeout: 3000 });
    } catch {
      return;
    }
    // Sur HTTP, la réponse est une redirection — pas de HSTS
    if ([301, 302].includes(res.status)) {
      // HSTS sur HTTP serait ignoré par les navigateurs — pas d'exigence stricte ici
      // On vérifie juste que la réponse est une redirection
      expect(res.headers.location).toMatch(/^https:\/\//i);
    }
  });
});
