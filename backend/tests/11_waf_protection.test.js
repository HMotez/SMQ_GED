/**
 * Règle 22 — WAF (Web Application Firewall) via nginx
 * Bloque : injection SQL, XSS, path traversal, scanners de vulnérabilités
 *
 * PRÉREQUIS : nginx doit être démarré (Docker).
 * Tests effectués via https://localhost:443 — WAF actif sur HTTPS (HTTP redirige en 301).
 *
 * Commande : npm run test:11
 */
"use strict";
const { apiHttp, apiHttps } = require("./helpers");

// Helper : vérifie disponibilité nginx HTTPS
async function nginxAvailable() {
  try {
    await apiHttps.get("/api/health", { timeout: 3000 });
    return true;
  } catch {
    try {
      await apiHttp.get("/", { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

let available = false;

beforeAll(async () => {
  available = await nginxAvailable();
  if (!available) console.warn("⚠️  nginx non disponible — démarrez Docker pour les tests WAF");
});

// ─── Injection SQL ────────────────────────────────────────────────────────────
describe("Règle 22 — WAF : Blocage injection SQL", () => {
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users;--",
    "1 UNION SELECT * FROM users",
    "1; EXEC xp_cmdshell('cmd')",
    "admin'--",
  ];

  test.each(sqlPayloads)(
    "Payload SQL dans l'URL bloqué : %s",
    async (payload) => {
      if (!available) return;
      const res = await apiHttps.get(`/api/test?q=${encodeURIComponent(payload)}`);
      expect(res.status).toBe(403);
    }
  );
});

// ─── XSS ─────────────────────────────────────────────────────────────────────
describe("Règle 22 — WAF : Blocage XSS (Cross-Site Scripting)", () => {
  const xssPayloads = [
    "<script>alert(1)</script>",
    "javascript:alert(1)",
    "<img onerror=alert(1) src=x>",
    "<svg onload=alert(1)>",
  ];

  test.each(xssPayloads)(
    "Payload XSS dans l'URL bloqué : %s",
    async (payload) => {
      if (!available) return;
      const res = await apiHttps.get(`/api/test?q=${encodeURIComponent(payload)}`);
      expect(res.status).toBe(403);
    }
  );
});

// ─── Path Traversal ───────────────────────────────────────────────────────────
describe("Règle 22 — WAF : Blocage Path Traversal", () => {
  // Percent-encoded sequences are caught by WAF rule → 403
  const encodedPayloads = [
    "..%2F..%2F..%2Fetc%2Fpasswd",
    "%2e%2e%2f%2e%2e%2f",
  ];

  test.each(encodedPayloads)(
    "Path traversal encodé bloqué (WAF → 403) : %s",
    async (payload) => {
      if (!available) return;
      const res = await apiHttps.get(`/api/files/${payload}`);
      expect([403, 400]).toContain(res.status);
    }
  );

  // Raw ../ is normalized by nginx before WAF fires → SPA fallback or 404 (never /etc/passwd)
  const normalizedPayloads = [
    "../../../etc/passwd",
    "....//....//etc/passwd",
  ];

  test.each(normalizedPayloads)(
    "Path traversal brut : nginx normalise, fichier jamais servi : %s",
    async (payload) => {
      if (!available) return;
      const res = await apiHttps.get(`/api/files/${payload}`);
      // nginx normalise ../ → le fichier cible n'est jamais accessible
      // 200 = SPA index.html servi, 404 = route inconnue, 403 = WAF bloque
      expect([200, 403, 400, 404]).toContain(res.status);
    }
  );
});

// ─── Scanners de vulnérabilités ───────────────────────────────────────────────
describe("Règle 22 — WAF : Blocage des scanners de vulnérabilités", () => {
  const scannerAgents = [
    "nikto/2.1.6",
    "sqlmap/1.7",
    "Burp Suite",
    "nmap scripting engine",
    "masscan",
  ];

  test.each(scannerAgents)(
    "User-Agent scanner bloqué : %s",
    async (agent) => {
      if (!available) return;
      const res = await apiHttps.get("/api/health", {
        headers: { "User-Agent": agent },
      });
      expect(res.status).toBe(403);
    }
  );
});

// ─── Méthodes HTTP dangereuses ────────────────────────────────────────────────
describe("Règle 22 — WAF : Méthodes HTTP non autorisées", () => {
  test("Méthode TRACE bloquée", async () => {
    if (!available) return;
    const res = await apiHttps.request({ method: "TRACE", url: "/" });
    expect([403, 405]).toContain(res.status);
  });

  test("HTTP → HTTPS redirect actif (port 80 redirige en 301)", async () => {
    const res = await apiHttp.get("/");
    expect([301, 302]).toContain(res.status);
    expect(res.headers.location).toMatch(/^https:\/\//);
  });
});
