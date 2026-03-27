// =============================================================
// scripts/syncDisk.js — Synchronisation ACTIA ES ↔ PostgreSQL
// Usage (inside container):
//   node /app/scripts/syncDisk.js
// Usage (from host):
//   docker exec smq_backend node /app/scripts/syncDisk.js
// =============================================================
"use strict";

require("dotenv").config({ path: __dirname + "/../.env" });
const fs   = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  host:     process.env.DB_HOST     || "postgres",
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME     || "smq_db",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "",
});

// Storage root: /app/storage inside container (= ACTIA ES disk)
const STORAGE_ROOT = process.env.UPLOAD_DIR || "/app/storage";

// ── Filename parser ───────────────────────────────────────────
// Pattern: {TYPE}{NUMBER}_{Title}_{version}.{ext}
// Examples: TR0002_Trame_vA.pdf  GU0002_Guide_vA2.pdf  IN0001_Instructions_-.pdf
function parseFileName(filename) {
  const base = path.basename(filename, path.extname(filename));
  const m    = base.match(/^([A-Z]{2,3})(\d{3,})_([^_]+)_(.+)$/i);
  if (!m) return null;
  // Normalize version: "-" → "v-", "vA" → "vA", "A" → "vA" (always "v" prefix)
  const rawVer = m[4];
  const version = rawVer === "-" ? "v-" : rawVer.startsWith("v") ? rawVer : `v${rawVer}`;
  return {
    typeCode: m[1].toUpperCase(),
    number:   m[2],
    docCode:  `${m[1].toUpperCase()}${m[2]}`,
    title:    m[3],
    version,
    filename: path.basename(filename),
    ext:      path.extname(filename).toLowerCase(),
  };
}

// ── Version ordering helper ───────────────────────────────────
// "-" < "vA" < "vA1" < "vA2" < "vB" …
function versionRank(v) {
  if (!v || v === "-") return 0;
  // Accepts both "A", "A2" (stored) and "vA", "vA2" (raw from filename)
  const m = v.match(/^v?([A-Z]+)(\d*)$/i);
  if (!m) return 0;
  const letter = m[1].toUpperCase().charCodeAt(0);
  const num    = parseInt(m[2] || "0", 10);
  return letter * 1000 + num;
}

// ── Walk directory recursively ────────────────────────────────
function walkDir(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkDir(full, result);
    } else if (e.isFile()) {
      result.push(full);
    }
  }
  return result;
}

// ── Ensure or get folder in DB (recursive) ───────────────────
async function ensureFolder(client, name, parentId) {
  // Check exists
  const ex = await client.query(
    `SELECT id FROM folders WHERE name = $1 AND parent_id IS NOT DISTINCT FROM $2 LIMIT 1`,
    [name, parentId]
  );
  if (ex.rows.length > 0) return ex.rows[0].id;

  // Compute level
  let level = 1;
  if (parentId) {
    const p = await client.query(`SELECT level FROM folders WHERE id = $1`, [parentId]);
    level   = (p.rows[0]?.level || 0) + 1;
  }

  const ins = await client.query(
    `INSERT INTO folders (name, level, parent_id) VALUES ($1, $2, $3) RETURNING id`,
    [name, level, parentId]
  );
  console.log(`  [folder+] ${name} (level=${level}, parent=${parentId})`);
  return ins.rows[0].id;
}

// ── Get or create type_id ─────────────────────────────────────
async function getTypeId(client, code) {
  const r = await client.query(
    `SELECT id FROM document_types WHERE code = $1`, [code]
  );
  if (r.rows.length > 0) return r.rows[0].id;
  // Insert unknown type
  const ins = await client.query(
    `INSERT INTO document_types (code, label) VALUES ($1, $2) RETURNING id`,
    [code, code]
  );
  return ins.rows[0].id;
}

// ── Get Admin user id ─────────────────────────────────────────
async function getAdminId(client) {
  const r = await client.query(
    `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'Admin' LIMIT 1`
  );
  return r.rows[0]?.id || null;
}

// ── Get status id ─────────────────────────────────────────────
async function getStatusId(client, name) {
  const r = await client.query(`SELECT id FROM status WHERE name = $1`, [name]);
  return r.rows[0]?.id || 1;
}

// =============================================================
// MAIN
// =============================================================
async function main() {
  console.log("=== SMQ GED — Sync Disk → DB ===");
  console.log(`Storage root: ${STORAGE_ROOT}`);

  if (!fs.existsSync(STORAGE_ROOT)) {
    console.error(`❌ Storage root not found: ${STORAGE_ROOT}`);
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const adminId       = await getAdminId(client);
    const statusDiffuse = await getStatusId(client, "Diffusé");
    const statusBrouil  = await getStatusId(client, "Brouillon");

    // ── STEP 1: Sync all folders from disk ─────────────────────
    console.log("\n── Étape 1 : Synchronisation des dossiers ──");
    const diskDirs  = [];
    const scanDirs  = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) {
          diskDirs.push(path.join(dir, e.name));
          scanDirs(path.join(dir, e.name));
        }
      }
    };
    scanDirs(STORAGE_ROOT);

    // Build folder ID map: relative path → DB id
    const folderIdMap = {}; // relPath → id

    // Sort by depth (shallow first)
    diskDirs.sort((a, b) => a.split(path.sep).length - b.split(path.sep).length);

    for (const dir of diskDirs) {
      const relPath  = path.relative(STORAGE_ROOT, dir);
      const parts    = relPath.split(path.sep);
      const name     = parts[parts.length - 1];
      const parentRel = parts.slice(0, -1).join(path.sep);
      const parentId  = parentRel ? folderIdMap[parentRel] || null : null;

      const id = await ensureFolder(client, name, parentId);
      folderIdMap[relPath] = id;
    }
    console.log(`✅ ${Object.keys(folderIdMap).length} dossier(s) synchronisés.`);

    // ── STEP 2: Scan all PDF files ──────────────────────────────
    console.log("\n── Étape 2 : Scan des fichiers PDF ──");
    const allFiles = walkDir(STORAGE_ROOT).filter(f =>
      [".pdf",".docx",".xlsx",".pptx",".doc",".xls"].includes(
        path.extname(f).toLowerCase()
      )
    );

    // Group by docCode
    const groups = {}; // docCode → [{ parsed, relPath, dirRel, folderId }]
    for (const f of allFiles) {
      const parsed = parseFileName(path.basename(f));
      if (!parsed) {
        console.warn(`  [skip] Nom non reconnu: ${path.basename(f)}`);
        continue;
      }
      const relPath = path.relative(STORAGE_ROOT, f).replace(/\\/g, "/");
      const dirRel  = path.relative(STORAGE_ROOT, path.dirname(f)).replace(/\\/g, "/");
      const folderId = folderIdMap[dirRel.replace(/\//g, path.sep)] || null;

      if (!groups[parsed.docCode]) groups[parsed.docCode] = [];
      groups[parsed.docCode].push({ parsed, relPath, dirRel, folderId });
    }
    console.log(`✅ ${allFiles.length} fichier(s), ${Object.keys(groups).length} document(s) distinct(s).`);

    // ── STEP 3: Remove DB docs with no disk file ────────────────
    console.log("\n── Étape 3 : Nettoyage des docs sans fichier physique ──");
    const diskDocCodes = Object.keys(groups);

    // Get all current doc_codes in DB
    const dbDocs = await client.query(`SELECT id, doc_code, file_path FROM documents`);
    let deleted = 0;
    for (const row of dbDocs.rows) {
      // Check if this doc's file_path exists on disk, OR its doc_code base matches a disk doc
      const baseCode = row.doc_code?.match(/^([A-Z]{2,3}\d{3,})/i)?.[1];
      const hasFile  = row.file_path && fs.existsSync(path.join(STORAGE_ROOT, row.file_path));
      const hasGroup = baseCode && diskDocCodes.includes(baseCode);

      if (!hasFile && !hasGroup) {
        await client.query(`DELETE FROM documents WHERE id = $1`, [row.id]);
        console.log(`  [del] ${row.doc_code} (fichier introuvable sur disque)`);
        deleted++;
      }
    }
    console.log(`✅ ${deleted} document(s) supprimé(s) de la DB.`);

    // ── STEP 4: Insert/update documents ────────────────────────
    console.log("\n── Étape 4 : Insertion/mise à jour des documents ──");
    let inserted = 0, updated = 0;

    for (const [docCode, files] of Object.entries(groups)) {
      // Sort versions to find latest
      files.sort((a, b) =>
        versionRank(b.parsed.version) - versionRank(a.parsed.version)
      );
      const latest   = files[0];
      const typeId   = await getTypeId(client, latest.parsed.typeCode);
      const folderId = latest.folderId;
      const title    = latest.parsed.title;
      const version  = latest.parsed.version;
      const hasRealVersion = version !== "-";
      const statusId = hasRealVersion ? statusDiffuse : statusBrouil;

      // File size
      const fullPath = path.join(STORAGE_ROOT, latest.relPath);
      let fileSize = null;
      try { fileSize = fs.statSync(fullPath).size; } catch(_) {}

      // Check if doc exists (by docCode base match)
      const ex = await client.query(
        `SELECT id FROM documents WHERE doc_code = $1 OR doc_code LIKE $2 LIMIT 1`,
        [docCode, `${docCode}%`]
      );

      if (ex.rows.length > 0) {
        // Update existing
        await client.query(`
          UPDATE documents SET
            doc_code        = $1,
            title           = $2,
            current_version = $3,
            status_id       = $4,
            folder_id       = $5,
            type_id         = $6,
            file_path       = $7,
            file_name       = $8,
            file_size       = $9,
            mime_type       = 'application/pdf',
            updated_at      = NOW()
          WHERE id = $10
        `, [
          docCode, title, version, statusId, folderId, typeId,
          latest.relPath, latest.parsed.filename, fileSize,
          ex.rows[0].id
        ]);
        console.log(`  [upd] ${docCode} → ${latest.relPath}`);
        updated++;
      } else {
        // Insert new
        await client.query(`
          INSERT INTO documents (
            doc_code, title, responsible, status_id, current_version,
            folder_id, type_id, origin, file_path, file_name, file_size,
            mime_type, created_by
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,'INTERNE',$8,$9,$10,'application/pdf',$11)
        `, [
          docCode, title, "Moetez", statusId, version,
          folderId, typeId, latest.relPath, latest.parsed.filename, fileSize, adminId
        ]);
        console.log(`  [ins] ${docCode} → ${latest.relPath}`);
        inserted++;
      }

      // ── Versions: insert each file as a version ──────────────
      const docRow = await client.query(
        `SELECT id FROM documents WHERE doc_code = $1`, [docCode]
      );
      const docId = docRow.rows[0]?.id;
      if (!docId) continue;

      for (const f of files) {
        const vEx = await client.query(
          `SELECT id FROM versions WHERE document_id = $1 AND version_letter = $2`,
          [docId, f.parsed.version]
        );
        if (vEx.rows.length === 0) {
          await client.query(`
            INSERT INTO versions (document_id, version_letter, file_path, file_name, mime_type, change_summary)
            VALUES ($1,$2,$3,$4,'application/pdf',$5)
          `, [docId, f.parsed.version, f.relPath, f.parsed.filename,
              f.parsed.version === "-" ? "Version initiale" : `Version ${f.parsed.version}`]);
        }
      }
    }

    // ── STEP 5: Update doc_code sequences ──────────────────────
    console.log("\n── Étape 5 : Mise à jour des séquences ──");
    const typeCounts = {};
    for (const docCode of Object.keys(groups)) {
      const m = docCode.match(/^([A-Z]{2,3})(\d+)$/i);
      if (!m) continue;
      const t = m[1].toUpperCase();
      const n = parseInt(m[2], 10);
      typeCounts[t] = Math.max(typeCounts[t] || 0, n);
    }
    for (const [typeCode, lastNum] of Object.entries(typeCounts)) {
      await client.query(`
        INSERT INTO doc_code_sequences (type_code, process_code, last_number)
        VALUES ($1, 'GLOBAL', $2)
        ON CONFLICT (type_code, process_code)
        DO UPDATE SET last_number = GREATEST(doc_code_sequences.last_number, EXCLUDED.last_number)
      `, [typeCode, lastNum]);
    }

    await client.query("COMMIT");

    // ── STEP 6: Report ─────────────────────────────────────────
    console.log("\n── Résultat final ──");
    const report = await client.query(`
      SELECT
        d.doc_code,
        d.title,
        dt.code  AS type,
        s.name   AS status,
        d.current_version AS version,
        f.name   AS folder,
        d.file_path
      FROM documents d
      JOIN status         s  ON s.id  = d.status_id
      JOIN document_types dt ON dt.id = d.type_id
      LEFT JOIN folders   f  ON f.id  = d.folder_id
      ORDER BY dt.code, d.doc_code
    `);

    console.log("\n doc_code | type | status | version | folder | file_path");
    console.log(" ---------+------+--------+---------+--------+----------");
    for (const r of report.rows) {
      console.log(` ${r.doc_code.padEnd(8)} | ${r.type.padEnd(4)} | ${(r.status||"").padEnd(18)} | ${(r.version||"").padEnd(7)} | ${(r.folder||"").padEnd(30)} | ${r.file_path}`);
    }

    console.log(`\n✅ Sync terminé: +${inserted} insérés, ~${updated} mis à jour, -${deleted} supprimés.`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Erreur:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
