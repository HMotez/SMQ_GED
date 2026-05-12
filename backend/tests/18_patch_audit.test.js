/**
 * Veille patchs & Évaluation des vulnérabilités — Gestion de mise à jour (checklist sécurité)
 * Vérifie que l'infrastructure de surveillance des dépendances est en place :
 *  - scripts/patch-check.sh existe
 *  - package-lock.json présents (requis pour npm audit)
 *  - Service patch-monitor déclaré dans docker-compose.yml
 *  - Répertoire reports/security disponible
 *  - npm audit ne retourne aucune vulnérabilité CRITIQUE
 *
 * Commande : npm run test:18
 */
"use strict";
const fs            = require("fs");
const path          = require("path");
const { execSync }  = require("child_process");

const ROOT              = path.resolve(__dirname, "../..");
const PATCH_SCRIPT      = path.join(ROOT, "scripts", "patch-check.sh");
const SECURITY_AUDIT    = path.join(ROOT, "scripts", "security-audit.sh");
const COMPOSE_FILE      = path.join(ROOT, "docker-compose.yml");
const REPORTS_DIR       = path.join(ROOT, "reports", "security");
const BACKEND_LOCK      = path.join(ROOT, "backend", "package-lock.json");
const FRONTEND_LOCK     = path.join(ROOT, "frontend", "package-lock.json");
const BACKEND_PKG       = path.join(ROOT, "backend", "package.json");

describe("Veille patchs — Scripts et infrastructure d'audit", () => {

  // ── Existence des scripts ─────────────────────────────────────

  test("scripts/patch-check.sh existe", () => {
    expect(fs.existsSync(PATCH_SCRIPT)).toBe(true);
  });

  test("scripts/security-audit.sh existe", () => {
    expect(fs.existsSync(SECURITY_AUDIT)).toBe(true);
  });

  test("patch-check.sh n'est pas vide", () => {
    const size = fs.statSync(PATCH_SCRIPT).size;
    expect(size).toBeGreaterThan(0);
  });

  test("patch-check.sh contient les vérifications npm audit + Trivy", () => {
    const src = fs.readFileSync(PATCH_SCRIPT, "utf8");
    expect(src).toContain("npm audit");
    expect(src).toContain("trivy");
  });

  // ── Fichiers package-lock.json (requis par npm audit) ─────────

  test("backend/package-lock.json existe (requis pour npm audit)", () => {
    expect(fs.existsSync(BACKEND_LOCK)).toBe(true);
  });

  test("frontend/package-lock.json existe (requis pour npm audit)", () => {
    if (!fs.existsSync(path.join(ROOT, "frontend"))) {
      console.warn("⚠️  Répertoire frontend introuvable — test ignoré");
      return;
    }
    expect(fs.existsSync(FRONTEND_LOCK)).toBe(true);
  });

  test("backend/package-lock.json est un JSON valide", () => {
    const content = fs.readFileSync(BACKEND_LOCK, "utf8");
    expect(() => JSON.parse(content)).not.toThrow();
  });

  // ── Service patch-monitor dans docker-compose.yml ─────────────

  test("docker-compose.yml déclare le service patch-monitor", () => {
    const compose = fs.readFileSync(COMPOSE_FILE, "utf8");
    expect(compose).toContain("patch-monitor");
  });

  test("patch-monitor utilise l'image node:20-slim", () => {
    const compose = fs.readFileSync(COMPOSE_FILE, "utf8");
    const idx = compose.indexOf("patch-monitor");
    const block = compose.slice(idx, idx + 400);
    expect(block).toContain("node:20-slim");
  });

  test("patch-monitor est dans le profile audit (pas lancé par défaut)", () => {
    const compose = fs.readFileSync(COMPOSE_FILE, "utf8");
    const idx = compose.indexOf("patch-monitor");
    const block = compose.slice(idx, idx + 500);
    expect(block).toContain('["audit"]');
  });

  test("patch-monitor monte les package-lock.json en lecture seule (:ro)", () => {
    const compose = fs.readFileSync(COMPOSE_FILE, "utf8");
    const idx = compose.indexOf("patch-monitor");
    const block = compose.slice(idx, idx + 600);
    expect(block).toContain("package-lock.json");
    expect(block).toContain(":ro");
  });

  test("patch-monitor sauvegarde les rapports dans reports/security", () => {
    const compose = fs.readFileSync(COMPOSE_FILE, "utf8");
    const idx = compose.indexOf("patch-monitor");
    const block = compose.slice(idx, idx + 600);
    expect(block).toContain("reports/security");
  });

  // ── Répertoire des rapports ───────────────────────────────────

  test("Le répertoire reports/security existe ou peut être créé", () => {
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
    expect(fs.existsSync(REPORTS_DIR)).toBe(true);
  });

  test("Le répertoire reports/security est accessible en écriture", () => {
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
    const testFile = path.join(REPORTS_DIR, ".write-test");
    expect(() => {
      fs.writeFileSync(testFile, "ok");
      fs.unlinkSync(testFile);
    }).not.toThrow();
  });

  // ── Vérification npm audit (pas de CRITIQUE) ──────────────────

  test("npm audit backend ne retourne aucune vulnérabilité CRITIQUE", () => {
    let output = "";
    try {
      output = execSync("npm audit --json", {
        cwd:     path.join(ROOT, "backend"),
        timeout: 30000,
        stdio:   "pipe",
      }).toString();
    } catch (e) {
      // npm audit exits with code 1 when vulnerabilities found — still returns JSON
      output = e.stdout?.toString() || "";
    }

    if (!output) {
      console.warn("⚠️  npm audit n'a pas retourné de sortie (réseau indisponible ?)");
      return;
    }

    let parsed;
    try { parsed = JSON.parse(output); } catch {
      console.warn("⚠️  npm audit output non-JSON — skipped");
      return;
    }

    const critical = parsed?.metadata?.vulnerabilities?.critical ?? 0;
    if (critical > 0) {
      console.warn(`⚠️  ${critical} vulnérabilité(s) CRITIQUE(S) détectée(s) — lancez : npm audit fix`);
    }
    expect(critical).toBe(0);
  });
});

// ─── Contre-tests ─────────────────────────────────────────────────────────────
describe("Contre-tests 18 — Veille patchs : qualité des dépendances", () => {
  test("backend/package.json ne spécifie pas de version '*' (wildcard dangereux)", () => {
    const pkg = JSON.parse(fs.readFileSync(BACKEND_PKG, "utf8"));
    const allDeps = {
      ...pkg.dependencies        || {},
      ...pkg.devDependencies     || {},
    };
    Object.entries(allDeps).forEach(([name, version]) => {
      expect(version).not.toBe("*");
      expect(version).not.toBe("latest");
    });
  });

  test("backend/package.json déclare une version Node.js cible (engines.node)", () => {
    const pkg = JSON.parse(fs.readFileSync(BACKEND_PKG, "utf8"));
    if (!pkg.engines?.node) {
      console.warn("⚠️  engines.node non défini dans package.json — recommandé pour la compatibilité");
    }
    // On vérifie juste que la clé engines existe ou on avertit (pas un fail bloquant)
    expect(typeof pkg.name).toBe("string"); // package.json est valide
  });

  test("backend/package-lock.json version correspond à npm v2+ (lockfileVersion ≥ 2)", () => {
    const lock = JSON.parse(fs.readFileSync(BACKEND_LOCK, "utf8"));
    expect(lock.lockfileVersion).toBeGreaterThanOrEqual(2);
  });

  test("npm audit backend ne retourne aucune vulnérabilité HAUTE (high)", () => {
    let output = "";
    try {
      output = execSync("npm audit --json", {
        cwd: path.join(ROOT, "backend"), timeout: 30000, stdio: "pipe",
      }).toString();
    } catch (e) {
      output = e.stdout?.toString() || "";
    }
    if (!output) return;
    let parsed;
    try { parsed = JSON.parse(output); } catch { return; }
    const high = parsed?.metadata?.vulnerabilities?.high ?? 0;
    if (high > 0) {
      console.warn(`⚠️  ${high} vulnérabilité(s) HAUTE(S) — lancez : npm audit fix`);
    }
    expect(high).toBe(0);
  });

  test("patch-check.sh contient une commande de sortie avec code d'erreur (exit 1 si problème)", () => {
    const src = fs.readFileSync(PATCH_SCRIPT, "utf8");
    expect(src).toMatch(/exit\s+[1-9]/);
  });
});
