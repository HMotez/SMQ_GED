/**
 * Règle 12 — En-têtes de sécurité HTTP (CSP, X-XSS-Protection, etc.)
 * Vérifie que tous les headers de sécurité sont présents sur les réponses API.
 *
 * Commande : npm run test:06
 */
"use strict";
const { api } = require("./helpers");

let headers = {};

beforeAll(async () => {
  const res = await api.get("/api/health");
  headers = res.headers;
});

describe("Règle 12 — En-têtes de sécurité HTTP", () => {
  test("X-XSS-Protection: 1; mode=block", () => {
    expect(headers["x-xss-protection"]).toBe("1; mode=block");
  });

  test("X-Content-Type-Options: nosniff (anti-MIME sniffing)", () => {
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });

  test("X-Frame-Options: DENY sur les routes API (anti-clickjacking)", () => {
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  test("Content-Security-Policy présent avec default-src 'self'", () => {
    const csp = headers["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toMatch(/default-src\s+'self'/i);
  });

  test("CSP contient frame-ancestors 'none' (routes API)", () => {
    const csp = headers["content-security-policy"];
    expect(csp).toMatch(/frame-ancestors\s+'none'/i);
  });

  test("CSP contient script-src 'self' (pas de scripts externes)", () => {
    const csp = headers["content-security-policy"];
    expect(csp).toMatch(/script-src\s+'self'/i);
  });

  test("Strict-Transport-Security (HSTS) avec max-age=31536000 (1 an)", () => {
    const hsts = headers["strict-transport-security"];
    expect(hsts).toBeDefined();
    expect(hsts).toMatch(/max-age=31536000/);
    expect(hsts).toMatch(/includeSubDomains/);
  });

  test("Referrer-Policy présent (contrôle fuites de référant)", () => {
    expect(headers["referrer-policy"]).toBeDefined();
    expect(headers["referrer-policy"]).toMatch(/strict-origin/i);
  });

  test("Permissions-Policy présent (désactive géoloc, micro, caméra)", () => {
    const pp = headers["permissions-policy"];
    expect(pp).toBeDefined();
    expect(pp).toMatch(/geolocation=\(\)/);
    expect(pp).toMatch(/microphone=\(\)/);
    expect(pp).toMatch(/camera=\(\)/);
  });

  test("Routes de fichiers : X-Frame-Options = SAMEORIGIN (pas DENY)", async () => {
    const res = await api.get("/preview/test.pdf");
    // 404 ou 200, mais header doit être SAMEORIGIN
    if (res.headers["x-frame-options"]) {
      expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    }
  });
});
