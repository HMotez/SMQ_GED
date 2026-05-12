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

// ─── Contre-tests ─────────────────────────────────────────────────────────────
describe("Contre-tests 06 — Security Headers : headers dangereux absents", () => {
  test("X-Powered-By absent (Express ne se révèle pas)", () => {
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("Header Server ne révèle pas la version Express ou Node.js", () => {
    const server = headers["server"] || "";
    expect(server).not.toMatch(/express\/\d+/i);
    expect(server).not.toMatch(/node\.js\/\d+/i);
  });

  test("CSP script-src ne contient pas 'unsafe-inline' ni 'unsafe-eval' (scripts non-autorisés)", () => {
    const csp = headers["content-security-policy"];
    if (!csp) return;
    // Extraire uniquement la directive script-src (unsafe-inline acceptable dans style-src pour CSS)
    const scriptSrc = csp.match(/script-src\s+([^;]+)/i)?.[1] || "";
    expect(scriptSrc).not.toMatch(/unsafe-inline/i);
    expect(scriptSrc).not.toMatch(/unsafe-eval/i);
  });

  test("X-Frame-Options n'est pas ALLOWALL (clickjacking non autorisé)", () => {
    const xfo = headers["x-frame-options"];
    expect(xfo).not.toMatch(/allowall/i);
    expect(xfo).not.toBe("ALLOW-FROM *");
  });

  test("HSTS max-age n'est pas inférieur à 1 an (31536000)", () => {
    const hsts = headers["strict-transport-security"];
    if (!hsts) return;
    const match = hsts.match(/max-age=(\d+)/);
    if (match) {
      expect(parseInt(match[1])).toBeGreaterThanOrEqual(31536000);
    }
  });
});
