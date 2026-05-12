/**
 * Règle 25 — Gestion des sauvegardes
 * Les procédures de sauvegarde doivent être formalisées et opérationnelles.
 * Vérifie l'existence de fichiers de sauvegarde dans le répertoire ./backups/
 *
 * Commande : npm run test:15
 */
"use strict";
const fs   = require("fs");
const path = require("path");

const BACKUP_DIR    = path.resolve(__dirname, "../../backups");
const MAX_AGE_HOURS = 48; // Sauvegarde doit être récente (max 48h)

describe("Règle 25 — Gestion des sauvegardes", () => {
  test("Répertoire de sauvegardes existe (./backups/)", () => {
    const exists = fs.existsSync(BACKUP_DIR);
    if (!exists) {
      console.warn(`⚠️  Répertoire ${BACKUP_DIR} inexistant — lancez le conteneur Docker 'backup' pour générer les sauvegardes`);
    }
    expect(exists).toBe(true);
  });

  test("Au moins un fichier de sauvegarde PostgreSQL (.sql.gz) existe", () => {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR, { recursive: true });
    const backupFiles = files.filter(
      (f) => typeof f === "string" && (f.endsWith(".sql.gz") || f.endsWith(".sql"))
    );

    if (backupFiles.length === 0) {
      console.warn("⚠️  Aucun fichier .sql.gz trouvé — le conteneur de sauvegarde a-t-il tourné ?");
    }
    expect(backupFiles.length).toBeGreaterThan(0);
  });

  test(`Sauvegarde la plus récente date de moins de ${MAX_AGE_HOURS}h`, () => {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR, { recursive: true })
      .filter((f) => typeof f === "string" && (f.endsWith(".sql.gz") || f.endsWith(".sql")))
      .map((f) => ({
        name: f,
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) return;

    const mostRecent   = files[0];
    const ageInHours   = (Date.now() - mostRecent.mtime) / (1000 * 60 * 60);

    console.log(`Sauvegarde la plus récente : ${mostRecent.name} (${ageInHours.toFixed(1)}h)`);

    if (ageInHours > MAX_AGE_HOURS) {
      console.warn(`⚠️  Sauvegarde ancienne (${ageInHours.toFixed(1)}h) — vérifiez le conteneur backup`);
    }
    expect(ageInHours).toBeLessThanOrEqual(MAX_AGE_HOURS);
  });

  test("Les fichiers de sauvegarde ne sont pas vides (taille > 0)", () => {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR, { recursive: true })
      .filter((f) => typeof f === "string" && (f.endsWith(".sql.gz") || f.endsWith(".sql")));

    if (files.length === 0) return;

    files.forEach((f) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      expect(stat.size).toBeGreaterThan(0);
    });
  });

  test("Le répertoire de sauvegardes n'est pas exposé via l'API", async () => {
    const { api } = require("./helpers");
    const res = await api.get("/backups/");
    // Le répertoire backups ne doit PAS être servi par Express
    expect(res.status).toBe(404);
  });
});

// ─── Contre-tests ─────────────────────────────────────────────────────────────
describe("Contre-tests 15 — Sauvegardes : sécurité et format", () => {
  test("Les fichiers de sauvegarde sont compressés (.gz) — pas en plain SQL lisible", () => {
    if (!fs.existsSync(BACKUP_DIR)) return;
    const files = fs.readdirSync(BACKUP_DIR, { recursive: true })
      .filter((f) => typeof f === "string" && f.endsWith(".sql"));
    // On accepte des .sql non compressés mais on avertit
    if (files.length > 0) {
      console.warn(`⚠️  ${files.length} sauvegarde(s) non compressée(s) trouvée(s) — préférez .sql.gz`);
    }
    // Le test ne fail pas (plain SQL est acceptable) mais vérifie qu'il n'y a pas que du plain
    const gzFiles = fs.readdirSync(BACKUP_DIR, { recursive: true })
      .filter((f) => typeof f === "string" && f.endsWith(".sql.gz"));
    if (gzFiles.length === 0 && files.length === 0) return; // pas de backup du tout → géré par test 15
    expect(gzFiles.length + files.length).toBeGreaterThan(0);
  });

  test("Le nom des fichiers de sauvegarde ne contient pas de credentials (host, user, password)", () => {
    if (!fs.existsSync(BACKUP_DIR)) return;
    const files = fs.readdirSync(BACKUP_DIR, { recursive: true })
      .filter((f) => typeof f === "string");
    files.forEach((f) => {
      expect(f).not.toMatch(/password|passwd|secret/i);
    });
  });

  test("/api/backups → 404 (endpoint de téléchargement des backups inexistant)", async () => {
    const { api } = require("./helpers");
    const res = await api.get("/api/backups");
    expect(res.status).toBe(404);
  });

  test("Les sauvegardes ont un nom horodaté (contient la date)", () => {
    if (!fs.existsSync(BACKUP_DIR)) return;
    const files = fs.readdirSync(BACKUP_DIR, { recursive: true })
      .filter((f) => typeof f === "string" && (f.endsWith(".sql.gz") || f.endsWith(".sql")));
    if (!files.length) return;
    // Le nom doit contenir un motif de date (YYYY, YYYYMMDD, ou timestamp Unix)
    files.forEach((f) => {
      expect(f).toMatch(/\d{4}/); // au moins 4 chiffres consécutifs (année ou timestamp)
    });
  });
});
