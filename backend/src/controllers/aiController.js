// ============================================================
// controllers/aiController.js — ACTIA ES GED — Sprint 6 IA
// Carte 1 : Chatbot Qualité      POST /api/ai/query
// Carte 2 : Classification auto  POST /api/ai/classify
// Carte 3 : Extraction dates     POST /api/ai/extract-dates
// Carte 4 : Amélioration continue GET /api/ai/improvements
//           Logs requêtes IA      GET /api/ai/logs
// ============================================================
"use strict";

const pool = require("../db");

// ─────────────────────────────────────────────────────────────
// ensureAITables — crée les tables IA au démarrage
// ─────────────────────────────────────────────────────────────
async function ensureAITables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_query_logs (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
      query_text   TEXT    NOT NULL,
      intent       VARCHAR(80),
      result_count INTEGER DEFAULT 0,
      created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON ai_query_logs(user_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_query_logs(created_at DESC)
  `);
  console.log("[IA] Tables IA vérifiées.");
}

// ─────────────────────────────────────────────────────────────
// ─── CARTE 1 : CHATBOT QUALITÉ ────────────────────────────
// ─────────────────────────────────────────────────────────────

// NLP — Table d'intentions avec patterns français
const INTENT_PATTERNS = [
  // Documents expirés / périmés
  {
    regex: /expir|périm|dépass|échéan/i,
    intent: "expired_docs",
    label: "Documents expirés",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Documents en validation
  {
    regex: /en\s+validation|attente.*valid|valid.*attente/i,
    intent: "validation_pending",
    label: "Documents en validation",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Dernière version d'un document spécifique
  {
    regex: /derni[eè]re\s+version|version.*derni[eè]re|version.*actuelle|actuelle.*version/i,
    intent: "latest_version",
    label: "Dernière version",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Documents obsolètes
  {
    regex: /obsol[eè]te/i,
    intent: "obsolete_docs",
    label: "Documents obsolètes",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Documents archivés
  {
    regex: /archiv/i,
    intent: "archived_docs",
    label: "Documents archivés",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité"],
  },
  // Documents en retard
  {
    regex: /retard|en\s+retard|hors\s+d[eé]lai|d[eé]lai.*d[eé]pass/i,
    intent: "overdue_docs",
    label: "Documents en retard",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Documents diffusés / actifs
  {
    regex: /diffus[eé]|actif|en\s+vigueur/i,
    intent: "published_docs",
    label: "Documents diffusés",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Documents en relecture (FIX: just "relecture" — catches "en cours de relecture")
  {
    regex: /relecture/i,
    intent: "in_relecture",
    label: "Documents en relecture",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Documents en brouillon / rédaction (FIX: drop "en " prefix — catches "en cours de rédaction")
  {
    regex: /brouillon|r[eé]daction/i,
    intent: "draft_docs",
    label: "Documents en cours de rédaction",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur"],
  },
  // Révisions à venir dans les 30 jours
  {
    regex: /r[eé]vision.*(30|proch|bient[oô]t|venir|semaine|mois)|proch.*(r[eé]vision|r[eé]vis)|bient[oô]t.*expir|expir.*(bient[oô]t|proch)/i,
    intent: "upcoming_reviews",
    label: "Révisions imminentes",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Comment valider / procédure de validation (AVANT by_type pour éviter conflit)
  {
    regex: /comment\s+valid|valider\s+un\s+doc|[eé]tapes\s+(de\s+)?valid|proc[eé]dure\s+(de\s+)?valid/i,
    intent: "how_to_validate",
    label: "Procédure de validation",
    roles: ["*"],
  },
  // Documents par dossier (MOVED before statistics)
  {
    regex: /\bdossier|\br[eé]pertoire|\bclasseur/i,
    intent: "by_folder",
    label: "Documents par dossier",
    roles: ["*"],
  },
  // Recherche par processus (MOVED before statistics)
  {
    regex: /processus|process|proc\./i,
    intent: "by_process",
    label: "Documents par processus",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Recherche par type documentaire
  // FIX: removed "EN","IN","AU","PL" — they match common French words ("en","in","au","pl")
  // Type codes are already detected via extractEntities() DB lookup
  {
    regex: /\b(PR|MN|RA|FM|SP|FO)\b|proc[eé]dure|instruction|manuel|formulaire|rapport|type\s+documentaire|par\s+type/i,
    intent: "by_type",
    label: "Documents par type",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Statistiques / combien (AFTER specific "par X" patterns)
  {
    regex: /combien|nombre|total|statistique|r[eé]partition/i,
    intent: "statistics",
    label: "Statistiques",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Recherche par responsable / auteur
  {
    regex: /responsable|auteur|r[eé]dig[eé]\s+par|cr[eé][eé]\s+par/i,
    intent: "by_responsible",
    label: "Documents par responsable",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Documents récents
  {
    regex: /r[eé]cent|nouveau|dernier|nouveaux|cr[eé][eé]?\s+r[eé]cemment/i,
    intent: "recent_docs",
    label: "Documents récents",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité","Rédacteur","Validateur","Lecteur"],
  },
  // Documents validés / approuvés
  // FIX: removed \b word boundaries — JS regex \b fails on accented chars like "é"
  {
    regex: /valid[eé]|approuv[eé]/i,
    intent: "validated_docs",
    label: "Documents validés",
    roles: ["*"],
  },
  // Lister / donner la liste des documents
  {
    regex: /\b(donner|lister|afficher|montrer)\b|liste\s+d[eu]\s+doc|tous\s+les\s+doc|noms?\s+des\s+doc/i,
    intent: "list_all",
    label: "Liste des documents",
    roles: ["*"],
  },
  // Documents jamais consultés (FIX: .* allows "jamais été consultés")
  {
    regex: /jamais.*consult[eé]|non\s+consult[eé]|pas\s+consult[eé]|jamais\s+ouvert/i,
    intent: "never_viewed",
    label: "Jamais consultés",
    roles: ["Admin GED","Responsable Qualité","Ing. Qualité"],
  },
  // Mes documents (créés par l'utilisateur connecté)
  {
    regex: /\bmes\s+doc|\bmes\s+fichiers|\bmes\s+documents|cr[eé][eé]s?\s+par\s+moi/i,
    intent: "my_docs",
    label: "Mes documents",
    roles: ["*"],
  },
  // Dates de création / révision / expiration
  {
    regex: /dates?\s+de\s+cr[eé]ation|dates?\s+cr[eé]ation|dates?\s+de\s+r[eé]vision|toutes?\s+les\s+dates?|extraire.*dates?|dates?\s+des\s+doc|prochaine\s+r[eé]vision|quand.*cr[eé][eé]|cr[eé][eé].*quand/i,
    intent: "dates_overview",
    label: "Dates des documents",
    roles: ["*"],
  },
  // Aide générale
  {
    regex: /^(aide|help|bonjour|salut|bonsoir|qu['']est.ce|comment\s+[çc]a\s+marche|que\s+peux.tu)/i,
    intent: "help",
    label: "Aide",
    roles: ["*"],
  },
];

// ─── Cache des types documentaires (chargé depuis la DB) ─────
let _typeCache    = null;
let _typeCacheTime = 0;
async function loadTypeCache() {
  const now = Date.now();
  if (_typeCache && now - _typeCacheTime < 600_000) return _typeCache;
  const r = await pool.query(`SELECT code, label FROM document_types ORDER BY code`);
  _typeCache     = r.rows;
  _typeCacheTime = now;
  return _typeCache;
}

// ─── Extraction d'entités depuis la requête ──────────────────
async function extractEntities(query) {
  const entities = {};
  const qLower   = query.toLowerCase();

  // Code document (ex: PR-PS0028-0004 ou PR0001)
  const codeMatch = query.match(/\b([A-Z]{2,3}-[A-Z0-9]+-\d{4,}|[A-Z]{2,3}\d{4,})\b/i);
  if (codeMatch) entities.doc_code = codeMatch[1].toUpperCase();

  // Mot-clé processus
  const processKw = query.match(/\b(SMQ|RH|PROD|MAINT|ACHAT|QUALIT[EÉ]|FINANC|LOGIST|R&D)\b/i);
  if (processKw) entities.process_keyword = processKw[1].toUpperCase();

  // Nom de personne (après "de", "du", "par", "responsable")
  const nameMatch = query.match(/(?:de|du|par|responsable\s+(?:est)?)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)?)/i);
  if (nameMatch) entities.person_name = nameMatch[1];

  // Type documentaire — détection dynamique depuis la DB
  try {
    const types = await loadTypeCache();
    // 1. Correspondance exacte sur le code (ex: "PR", "IN")
    const byCode = types.find(t => new RegExp(`\\b${t.code}\\b`, "i").test(query));
    if (byCode) {
      entities.type_code  = byCode.code;
      entities.type_label = byCode.label;
    } else {
      // 2. Correspondance sur les mots du libellé (ex: "procédure", "instruction")
      const byLabel = types.find(t => {
        const words = t.label.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
        return words.some(w => qLower.includes(w));
      });
      if (byLabel) {
        entities.type_code  = byLabel.code;
        entities.type_label = byLabel.label;
      }
    }
  } catch (_) { /* DB indisponible — pas bloquant */ }

  return entities;
}

// ─── Détection d'intention ────────────────────────────────────
function detectIntent(query) {
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.regex.test(query)) {
      return pattern;
    }
  }
  // Fallback: recherche textuelle
  return { intent: "text_search", label: "Recherche textuelle", roles: ["*"] };
}

// ─── Construction de la requête SQL selon l'intention ─────────
async function buildSQLForIntent(intent, entities, role) {
  const BASE_SELECT = `
    SELECT
      d.id, d.doc_code, d.title, d.responsible,
      d.current_version, d.next_review_date, d.created_at,
      s.name  AS status_name,
      f.name  AS folder_name,
      dt.code AS type_code, dt.label AS type_label,
      COALESCE(p.sub_process, 'Non défini') AS process_name
    FROM documents d
    JOIN status         s  ON s.id  = d.status_id
    JOIN folders        f  ON f.id  = d.folder_id
    JOIN document_types dt ON dt.id = d.type_id
    LEFT JOIN processes p  ON p.id  = d.process_id
  `;

  switch (intent) {
    case "expired_docs":
      return {
        sql: BASE_SELECT + `
          WHERE d.next_review_date IS NOT NULL
            AND d.next_review_date < CURRENT_DATE
          ORDER BY d.next_review_date ASC
          LIMIT 20
        `,
        params: [],
        message: "Voici les documents dont la date de révision est dépassée.",
      };

    case "validation_pending":
      return {
        sql: BASE_SELECT + `
          WHERE s.name = 'En validation'
          ORDER BY d.created_at DESC
          LIMIT 20
        `,
        params: [],
        message: "Voici les documents actuellement en cours de validation.",
      };

    case "latest_version":
      if (entities.doc_code) {
        return {
          sql: `
            SELECT
              d.id, d.doc_code, d.title, d.responsible,
              d.current_version, d.next_review_date, d.created_at,
              s.name  AS status_name, f.name AS folder_name,
              dt.code AS type_code, dt.label AS type_label,
              COALESCE(p.sub_process,'Non défini') AS process_name,
              (SELECT v.version_letter FROM versions v
               WHERE v.document_id = d.id
               ORDER BY v.created_at DESC LIMIT 1) AS version_letter,
              (SELECT COUNT(*) FROM versions v
               WHERE v.document_id = d.id)::int       AS version_count
            FROM documents d
            JOIN status         s  ON s.id  = d.status_id
            JOIN folders        f  ON f.id  = d.folder_id
            JOIN document_types dt ON dt.id = d.type_id
            LEFT JOIN processes p  ON p.id  = d.process_id
            WHERE d.doc_code ILIKE $1
               OR d.title    ILIKE $1
            ORDER BY d.created_at DESC
            LIMIT 5
          `,
          params: [`%${entities.doc_code}%`],
          message: null, // LLM génère la réponse avec le numéro de version
        };
      }
      return {
        sql: `
          SELECT
            d.id, d.doc_code, d.title, d.responsible,
            d.current_version, d.next_review_date, d.created_at,
            s.name  AS status_name, f.name AS folder_name,
            dt.code AS type_code, dt.label AS type_label,
            COALESCE(p.sub_process,'Non défini') AS process_name,
            (SELECT v.version_letter FROM versions v
             WHERE v.document_id = d.id
             ORDER BY v.created_at DESC LIMIT 1) AS version_letter,
            (SELECT COUNT(*) FROM versions v
             WHERE v.document_id = d.id)::int       AS version_count
          FROM documents d
          JOIN status         s  ON s.id  = d.status_id
          JOIN folders        f  ON f.id  = d.folder_id
          JOIN document_types dt ON dt.id = d.type_id
          LEFT JOIN processes p  ON p.id  = d.process_id
          WHERE s.name IN ('Diffusé','Validé')
          ORDER BY d.created_at DESC
          LIMIT 10
        `,
        params: [],
        message: null,
      };

    case "obsolete_docs":
      return {
        sql: BASE_SELECT + `
          WHERE s.name = 'Obsolète'
          ORDER BY d.next_review_date ASC
          LIMIT 20
        `,
        params: [],
        message: "Voici les documents marqués comme obsolètes.",
      };

    case "archived_docs":
      if (!["Admin GED","Responsable Qualité","Ing. Qualité"].includes(role)) {
        return { error: "Vous n'avez pas les droits pour consulter les documents archivés.", code: 403 };
      }
      return {
        sql: BASE_SELECT + `
          WHERE s.name = 'Archivé'
          ORDER BY d.created_at DESC
          LIMIT 20
        `,
        params: [],
        message: "Voici les documents archivés.",
      };

    case "overdue_docs":
      return {
        sql: `
          SELECT
            d.id, d.doc_code, d.title, d.responsible,
            d.current_version, d.next_review_date, d.created_at,
            s.name  AS status_name, f.name AS folder_name,
            dt.code AS type_code, dt.label AS type_label,
            COALESCE(p.sub_process,'Non défini') AS process_name,
            EXTRACT(DAY FROM AGE(CURRENT_DATE, d.next_review_date))::int AS days_overdue
          FROM documents d
          JOIN status         s  ON s.id  = d.status_id
          JOIN folders        f  ON f.id  = d.folder_id
          JOIN document_types dt ON dt.id = d.type_id
          LEFT JOIN processes p  ON p.id  = d.process_id
          WHERE d.next_review_date IS NOT NULL
            AND d.next_review_date < CURRENT_DATE
          ORDER BY days_overdue DESC
          LIMIT 20
        `,
        params: [],
        message: "Voici les documents en retard de révision.",
      };

    case "published_docs":
      return {
        sql: BASE_SELECT + `
          WHERE s.name = 'Diffusé'
          ORDER BY d.next_review_date ASC
          LIMIT 20
        `,
        params: [],
        message: "Voici les documents actuellement en vigueur (diffusés).",
      };

    case "in_relecture":
      return {
        sql: BASE_SELECT + `
          WHERE s.name = 'En relecture'
          ORDER BY d.created_at DESC
          LIMIT 20
        `,
        params: [],
        message: "Voici les documents actuellement en cours de relecture.",
      };

    case "upcoming_reviews":
      return {
        sql: BASE_SELECT + `
          WHERE d.next_review_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
            AND s.name NOT IN ('Archivé','Obsolète')
          ORDER BY d.next_review_date ASC
          LIMIT 20
        `,
        params: [],
        message: "Voici les documents dont la révision est prévue dans les 30 prochains jours.",
      };

    case "draft_docs":
      return {
        sql: BASE_SELECT + `
          WHERE s.name IN ('Brouillon','En rédaction','En relecture')
          ORDER BY d.created_at DESC
          LIMIT 20
        `,
        params: [],
        message: "Voici les documents en cours de rédaction ou relecture.",
      };

    case "by_type": {
      if (entities.type_code) {
        return {
          sql: BASE_SELECT + `
            WHERE dt.code = $1
            ORDER BY d.created_at DESC
            LIMIT 20
          `,
          params: [entities.type_code],
          message: null, // LLM génère la réponse
        };
      }
      if (entities.type_label) {
        return {
          sql: BASE_SELECT + `
            WHERE dt.label ILIKE $1
            ORDER BY d.created_at DESC
            LIMIT 20
          `,
          params: [`%${entities.type_label}%`],
          message: null,
        };
      }
      // Aucun type identifié → stats par type
      const typeResult = await pool.query(`
        SELECT dt.label AS name, dt.code, COUNT(*) AS count
        FROM documents d
        JOIN document_types dt ON dt.id = d.type_id
        GROUP BY dt.label, dt.code
        ORDER BY count DESC
      `);
      return {
        statistics: typeResult.rows,
        message: "Voici la répartition des documents par type documentaire.",
        is_stats: true,
        stats_label: "Type documentaire",
      };
    }

    case "statistics": {
      const countResult = await pool.query(`
        SELECT s.name, COUNT(*) AS count
        FROM documents d
        JOIN status s ON s.id = d.status_id
        GROUP BY s.name
        ORDER BY count DESC
      `);
      return {
        statistics: countResult.rows,
        message: "Voici les statistiques des documents par statut.",
        is_stats: true,
        stats_label: "Statut",
      };
    }

    case "by_responsible": {
      const name = entities.person_name;
      if (name) {
        return {
          sql: BASE_SELECT + `
            WHERE d.responsible ILIKE $1
            ORDER BY d.created_at DESC
            LIMIT 20
          `,
          params: [`%${name}%`],
          message: `Voici les documents dont le responsable correspond à "${name}".`,
        };
      }
      const respResult = await pool.query(`
        SELECT d.responsible AS name, COUNT(*) AS count
        FROM documents d
        GROUP BY d.responsible
        ORDER BY count DESC
        LIMIT 15
      `);
      return {
        statistics: respResult.rows,
        message: "Voici la répartition des documents par responsable.",
        is_stats: true,
        stats_label: "Responsable",
      };
    }

    case "by_process": {
      const kw = entities.process_keyword;
      if (kw) {
        return {
          sql: BASE_SELECT + `
            WHERE p.sub_process ILIKE $1
               OR p.main_process ILIKE $1
            ORDER BY d.created_at DESC
            LIMIT 20
          `,
          params: [`%${kw}%`],
          message: `Voici les documents liés au processus "${kw}".`,
        };
      }
      const procResult = await pool.query(`
        SELECT COALESCE(p.sub_process, 'Non défini') AS name, COUNT(*) AS count
        FROM documents d
        LEFT JOIN processes p ON p.id = d.process_id
        GROUP BY p.sub_process
        ORDER BY count DESC
        LIMIT 15
      `);
      return {
        statistics: procResult.rows,
        message: "Voici la répartition des documents par processus.",
        is_stats: true,
        stats_label: "Processus",
      };
    }

    case "recent_docs":
      return {
        sql: BASE_SELECT + `
          ORDER BY d.created_at DESC
          LIMIT 15
        `,
        params: [],
        message: "Voici les 15 documents créés récemment.",
      };

    case "validated_docs":
      return {
        sql: BASE_SELECT + `
          WHERE s.name IN ('Validé','Approuvé')
          ORDER BY d.created_at DESC
          LIMIT 20
        `,
        params: [],
        message: "Voici les documents validés.",
      };

    case "list_all":
      return {
        sql: BASE_SELECT + `
          ORDER BY d.created_at DESC
          LIMIT 25
        `,
        params: [],
        message: "Voici la liste des documents du système.",
      };

    case "how_to_validate":
      return {
        sql: BASE_SELECT + `
          WHERE s.name = 'En validation'
          ORDER BY d.created_at DESC
          LIMIT 10
        `,
        params: [],
        message: "Le processus de validation se déroule en 3 étapes : (1) Le Rédacteur soumet le document, (2) le Validateur l'examine et peut l'approuver ou le rejeter, (3) le Responsable Qualité décide de le diffuser. Les documents actuellement en validation sont listés ci-dessous.",
      };

    case "never_viewed":
      return {
        sql: BASE_SELECT + `
          WHERE d.id NOT IN (
            SELECT DISTINCT document_id FROM logs WHERE document_id IS NOT NULL
          )
          ORDER BY d.created_at DESC
          LIMIT 20
        `,
        params: [],
        message: "Voici les documents qui n'ont jamais été consultés.",
      };

    case "my_docs": {
      const uid = entities._userId;
      if (!uid) {
        return {
          sql: BASE_SELECT + `ORDER BY d.created_at DESC LIMIT 20`,
          params: [],
          message: "Voici les documents du système.",
        };
      }
      return {
        sql: BASE_SELECT + `
          WHERE d.created_by = $1
          ORDER BY d.created_at DESC
          LIMIT 20
        `,
        params: [uid],
        message: "Voici vos documents créés dans le système.",
      };
    }

    case "by_folder": {
      const statsResult = await pool.query(`
        SELECT f.name AS name, COUNT(*) AS count
        FROM documents d
        JOIN folders f ON f.id = d.folder_id
        GROUP BY f.name
        ORDER BY count DESC
        LIMIT 15
      `);
      return {
        statistics: statsResult.rows,
        message: "Voici la répartition des documents par dossier.",
        is_stats: true,
        stats_label: "Dossier",
      };
    }

    case "dates_overview":
      return {
        sql: `
          SELECT
            d.doc_code, d.title, d.responsible,
            d.created_at::date       AS creation_date,
            d.next_review_date       AS revision_date,
            s.name                   AS status_name,
            dt.code                  AS type_code,
            COALESCE(p.sub_process,'Non défini') AS process_name
          FROM documents d
          JOIN status         s  ON s.id  = d.status_id
          JOIN document_types dt ON dt.id = d.type_id
          LEFT JOIN processes p  ON p.id  = d.process_id
          ORDER BY d.created_at DESC
          LIMIT 20
        `,
        params: [],
        message: "Voici les dates de création et de prochaine révision des documents.",
      };

    case "help":
      return {
        sql: null,
        params: [],
        message: "Je peux répondre à vos questions sur le GED ACTIA ES : documents expirés, en validation, archivés, statistiques, dates de création/révision, recherche par code ou type, processus, responsable, et bien plus. Posez votre question en français.",
      };

    default: {
      const searchTerm = entities.doc_code || entities.type_code || entities.process_keyword || entities.person_name;
      if (!searchTerm) {
        // Pas de mot-clé identifié : on passe tous les docs au LLM pour qu'il réponde librement
        return {
          sql: BASE_SELECT + `ORDER BY d.created_at DESC LIMIT 30`,
          params: [],
          message: null, // LLM génère la réponse
        };
      }
      return {
        sql: BASE_SELECT + `
          WHERE d.title                           ILIKE $1
             OR d.doc_code                        ILIKE $1
             OR d.responsible                     ILIKE $1
             OR array_to_string(d.keywords, ' ')  ILIKE $1
          ORDER BY d.created_at DESC
          LIMIT 20
        `,
        params: [`%${searchTerm}%`],
        message: null, // LLM génère la réponse
      };
    }
  }
}

// ─────────────────────────────────────────────────────────────
// GEMINI LLM — Helpers (Google AI — OpenAI-compatible endpoint)
// ─────────────────────────────────────────────────────────────
const https = require("https");

async function callGeminiLLM(systemPrompt, userQuery) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") return null;

  const body = JSON.stringify({
    model: "gemini-2.0-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userQuery },
    ],
    max_tokens: 700,
    temperature: 0.2,
    stream: false,
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: "generativelanguage.googleapis.com",
      path:     "/v1beta/openai/chat/completions",
      method:   "POST",
      headers: {
        "Authorization": `Bearer ${GEMINI_API_KEY}`,
        "Content-Type":  "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { console.error("[IA][Gemini]", parsed.error.message); resolve(null); return; }
          resolve(parsed.choices?.[0]?.message?.content?.trim() || null);
        } catch { resolve(null); }
      });
    });
    req.on("error", (e) => { console.error("[IA][Gemini] Réseau:", e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

async function fetchDBSnapshot() {
  const results = await Promise.allSettled([
    pool.query(`SELECT s.name, COUNT(*) as count FROM documents d JOIN status s ON s.id=d.status_id GROUP BY s.name ORDER BY count DESC`),
    pool.query(`SELECT COUNT(*) as count FROM documents d JOIN status s ON s.id=d.status_id WHERE d.next_review_date < CURRENT_DATE AND s.name NOT IN ('Archivé','Obsolète')`),
    pool.query(`SELECT d.doc_code, d.title FROM documents d JOIN status s ON s.id=d.status_id WHERE s.name='En validation' LIMIT 5`),
    pool.query(`SELECT d.doc_code, d.title, d.created_at::date as date FROM documents d ORDER BY d.created_at DESC LIMIT 6`),
    pool.query(`SELECT COUNT(*) as count FROM documents`),
    pool.query(`SELECT dt.label, dt.code, COUNT(*) as count FROM documents d JOIN document_types dt ON dt.id=d.type_id GROUP BY dt.label, dt.code ORDER BY count DESC`),
    pool.query(`SELECT COALESCE(p.sub_process,'Non défini') AS process_name, COUNT(*) as count FROM documents d LEFT JOIN processes p ON p.id=d.process_id GROUP BY process_name ORDER BY count DESC LIMIT 8`),
  ]);
  return {
    byStatus: results[0].value?.rows || [],
    expiredCount: parseInt(results[1].value?.rows[0]?.count || 0),
    pendingValidation: results[2].value?.rows || [],
    recentDocs: results[3].value?.rows || [],
    totalDocs: parseInt(results[4].value?.rows[0]?.count || 0),
    byType: results[5].value?.rows || [],
    byProcess: results[6].value?.rows || [],
  };
}

function buildSystemPrompt(snapshot, role, sqlResults, sqlMessage) {
  const statsStr   = snapshot.byStatus.map(s => `${s.name}: ${s.count}`).join(" | ");
  const typeStr    = snapshot.byType?.map(t => `${t.label||t.code}: ${t.count}`).join(" | ") || "";
  const processStr = snapshot.byProcess?.map(p => `${p.process_name}: ${p.count}`).join(" | ") || "";
  const recentStr  = snapshot.recentDocs.map(d => `${d.doc_code} (${d.date})`).join(", ");
  const pendingStr = snapshot.pendingValidation.map(d => `${d.doc_code} — ${d.title}`).join("; ") || "Aucun";

  const sqlSummary = sqlResults.length > 0
    ? `Résultats SQL trouvés (${sqlResults.length} doc(s)) :\n` + sqlResults.slice(0,15).map(d => {
        const created  = d.creation_date || (d.created_at       ? new Date(d.created_at).toLocaleDateString("fr-FR")       : null);
        const revision = d.revision_date || (d.next_review_date ? new Date(d.next_review_date).toLocaleDateString("fr-FR") : null);
        const version = d.version_letter
          ? `v${d.version_letter}${d.version_count ? ` (${d.version_count} version(s))` : ""}`
          : (d.current_version ? `v${d.current_version}` : null);
        return `  - ${d.doc_code||""} « ${d.title||""} » [${d.status_name||d.folder_name||d.type_code||""}]`
          + (version    ? ` | Version: ${version}`      : "")
          + (created    ? ` | Créé: ${created}`         : "")
          + (revision   ? ` | Révision: ${revision}`    : "")
          + (d.responsible ? ` | Resp: ${d.responsible}` : "");
      }).join("\n")
    : sqlMessage || "";

  return `Tu es l'Assistant IA du Système de Gestion Électronique de Documents (GED) d'ACTIA ES, entreprise spécialisée en électronique automobile. Tu assistes les équipes qualité dans le pilotage documentaire ISO 9001.

═══════════════════════════════════════════════
ÉTAT DE LA BASE DOCUMENTAIRE — DONNÉES TEMPS RÉEL
═══════════════════════════════════════════════
• Total documents    : ${snapshot.totalDocs}
• Répartition statuts: ${statsStr}
${typeStr    ? `• Par type           : ${typeStr}`    : ""}
${processStr ? `• Par processus      : ${processStr}` : ""}
• Documents expirés  : ${snapshot.expiredCount} (révision dépassée)
• En validation      : ${pendingStr}
• Créés récemment    : ${recentStr}
${sqlSummary ? `\n═══════════════════════════════════════════════\nRÉSULTATS DE LA REQUÊTE\n═══════════════════════════════════════════════\n${sqlSummary}` : ""}

PROFIL UTILISATEUR : ${role}

═══════════════════════════════════════════════
CONSIGNES DE RÉPONSE
═══════════════════════════════════════════════
1. Réponds EXCLUSIVEMENT en français, avec un ton professionnel et structuré
2. Base-toi UNIQUEMENT sur les données réelles ci-dessus — ne génère aucune donnée fictive
3. Si des documents sont listés dans "RÉSULTATS DE LA REQUÊTE", exploite-les intégralement (codes, titres, statuts, responsables, dates)
4. Structure ta réponse : commence par un résumé concis, puis les détails si nécessaire
5. Cite toujours les codes documentaires (ex: FM0001, PR0002) quand disponibles
6. Pour les questions de statistiques, fournis des chiffres précis et une analyse courte
7. Si la question dépasse le périmètre du GED ou que les données sont insuffisantes, indique-le clairement et professionnellement
8. Évite les formules creuses — chaque phrase doit apporter de la valeur`;
}

// ─────────────────────────────────────────────────────────────
// POST /api/ai/query — Chatbot Qualité (Hybride NLP + Gemini LLM)
// ─────────────────────────────────────────────────────────────
async function handleChatQuery(req, res) {
  const { query } = req.body;
  const user = req.currentUser;

  if (!query || query.trim().length < 3) {
    return res.status(400).json({ error: "La requête est trop courte." });
  }

  const trimmedQuery = query.trim();
  const entities     = await extractEntities(trimmedQuery);
  entities._userId   = user?.id;  // utilisé par l'intent "my_docs"
  const role         = user?.role || "Lecteur";

  let intentPattern = detectIntent(trimmedQuery);
  // Si recherche libre mais qu'un type DB a été identifié → forcer by_type
  if (intentPattern.intent === "text_search" && entities.type_code) {
    intentPattern = { intent: "by_type", label: "Documents par type", roles: ["*"] };
  }

  if (intentPattern.roles && !intentPattern.roles.includes("*") && !intentPattern.roles.includes(role)) {
    return res.status(403).json({ error: `Votre rôle (${role}) ne permet pas d'accéder à cette information.` });
  }

  try {
    const built = await buildSQLForIntent(intentPattern.intent, entities, role);
    if (built.error) return res.status(built.code || 400).json({ error: built.error });

    let rows = [];
    let statistics = null;

    if (built.is_stats) {
      statistics = built.statistics;
    } else if (built.sql) {
      const result = await pool.query(built.sql, built.params);
      rows = result.rows;
    }

    // ── Gemini LLM : génère un message naturel basé sur les résultats SQL ──
    let finalMessage = built.message;
    const useLLM = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";

    if (useLLM) {
      const snapshot = await fetchDBSnapshot();
      const systemPrompt = buildSystemPrompt(snapshot, role, rows, built.message);
      const llmMsg = await callGeminiLLM(systemPrompt, trimmedQuery);
      if (llmMsg) finalMessage = llmMsg;
    }

    // Journalisation
    if (user?.id) {
      await pool.query(
        `INSERT INTO ai_query_logs (user_id, query_text, intent, result_count) VALUES ($1,$2,$3,$4)`,
        [user.id, trimmedQuery, intentPattern.intent, rows.length]
      ).catch(() => {});
    }

    return res.json({
      intent:       intentPattern.intent,
      intent_label: useLLM ? "Gemini AI" : intentPattern.label,
      message:      finalMessage,
      result_count: statistics ? statistics.length : rows.length,
      documents:    rows,
      statistics:   statistics || null,
      stats_label:  built.stats_label || "Statut",
      llm_powered:  useLLM,
    });
  } catch (err) {
    console.error("[IA][Chatbot] Erreur:", err.message);
    return res.status(500).json({ error: "Erreur lors du traitement de la requête IA." });
  }
}

// ─────────────────────────────────────────────────────────────
// ─── CARTE 2 : CLASSIFICATION AUTOMATIQUE ────────────────
// ─────────────────────────────────────────────────────────────

// Dictionnaire de classification documentaire
const TYPE_KEYWORDS = {
  PR: ["procédure","procedure","comment faire","mode opératoire","processus de","étape","déroulement","séquence d'actions","marche à suivre"],
  IN: ["instruction","mode d'emploi","consigne","directive","prescription","recommandation opérationnelle"],
  MN: ["manuel","guide","référentiel","handbook","politique qualité","politique de","document directeur"],
  PL: ["plan","planning","planification","programme","calendrier","roadmap","feuille de route","échéancier"],
  RA: ["rapport","compte rendu","bilan","synthèse","résultat","rapport d'audit","rapport de","analyse de"],
  FM: ["formulaire","fiche","enregistrement","relevé","grille","checklist","liste de contrôle","questionnaire"],
  SP: ["spécification","cahier des charges","exigence","requirement","norme","standard","critère","contrainte technique"],
  FO: ["formation","sensibilisation","habilitation","compétence","programme de formation","support de cours"],
  AU: ["audit","inspection","contrôle","vérification","surveillance","revue","évaluation qualité"],
  EN: ["enregistrement","archive","preuve","registre","traçabilité","historique","journal"],
};

const PROCESS_KEYWORDS = {
  "SMQ - Système de management":     ["smq","management","qualité","amélioration continue","système","politique","objectif qualité","manuel qualité"],
  "RH - Ressources humaines":        ["rh","ressources humaines","personnel","recrutement","formation","compétence","évaluation","onboarding"],
  "PROD - Production":               ["production","fabrication","assemblage","manufacturing","ligne de production","contrôle production"],
  "MAINT - Maintenance":             ["maintenance","entretien","réparation","curatif","préventif","panne","équipement"],
  "ACHAT - Achats & fournisseurs":   ["achat","fournisseur","commande","approvisionnement","sous-traitance","homologation","sélection fournisseur"],
  "QUALITÉ - Contrôle qualité":      ["contrôle qualité","inspection","non-conformité","nc","action corrective","action préventive","acar"],
  "LOGISTIQUE - Logistique":         ["logistique","stockage","expédition","réception","transport","entreposage","inventaire"],
  "R&D - Développement":             ["r&d","recherche","développement","innovation","prototype","conception","design","cahier des charges technique"],
  "FINANCE - Finance":               ["finance","comptabilité","budget","dépense","coût","facturation","trésorerie"],
  "IT - Informatique":               ["informatique","it","système d'information","logiciel","réseau","sécurité informatique","cybersécurité"],
};

const DOMAIN_KEYWORDS = {
  "ISO 9001": ["iso 9001","management qualité","smq","non-conformité","amélioration continue","audit qualité","satisfaction client"],
  "ISO 14001": ["iso 14001","environnement","impact environnemental","déchets","énergie","empreinte carbone"],
  "ISO 45001": ["iso 45001","sst","santé sécurité","risque professionnel","accident","epi","habilitation sécurité"],
  "Technique": ["technique","technologie","engineering","mécanique","électrique","électronique","software"],
  "Commercial": ["client","vente","commande","devis","contrat","satisfaction","réclamation client"],
  "Administratif": ["administratif","procédure admin","règlement","politique","organisation","gouvernance"],
};

function computeScore(text, keywords) {
  const lowerText = text.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lowerText.includes(kw.toLowerCase())) {
      score += kw.split(/\s+/).length; // score proportionnel à la longueur du keyword
    }
  }
  return score;
}

function classifyDocument(title, context, keywords) {
  const fullText = `${title || ""} ${context || ""} ${keywords || ""}`;

  // Score par type
  const typeScores = Object.entries(TYPE_KEYWORDS).map(([code, kws]) => ({
    code,
    score: computeScore(fullText, kws),
  })).sort((a, b) => b.score - a.score);

  // Score par processus
  const processScores = Object.entries(PROCESS_KEYWORDS).map(([name, kws]) => ({
    name,
    score: computeScore(fullText, kws),
  })).sort((a, b) => b.score - a.score);

  // Score par domaine
  const domainScores = Object.entries(DOMAIN_KEYWORDS).map(([name, kws]) => ({
    name,
    score: computeScore(fullText, kws),
  })).sort((a, b) => b.score - a.score);

  const topType    = typeScores.find(t => t.score > 0);
  const topProcess = processScores.find(p => p.score > 0);
  const topDomain  = domainScores.find(d => d.score > 0);

  return {
    suggested_type:    topType    ? { code: topType.code, confidence: Math.min(topType.score * 15, 95) }    : null,
    suggested_process: topProcess ? { name: topProcess.name, confidence: Math.min(topProcess.score * 12, 90) } : null,
    suggested_domain:  topDomain  ? { name: topDomain.name, confidence: Math.min(topDomain.score * 12, 90) }  : null,
    all_type_scores:    typeScores.slice(0, 5),
    all_process_scores: processScores.slice(0, 5),
    needs_human_validation: true,
  };
}

// ─────────────────────────────────────────────────────────────
// POST /api/ai/classify — Classification automatique
// ─────────────────────────────────────────────────────────────
async function handleClassification(req, res) {
  const { title, context, keywords, filename } = req.body;

  if (!title && !context && !filename) {
    return res.status(400).json({ error: "Au moins un champ (title, context ou filename) est requis." });
  }

  try {
    // Enrichir avec le type de fichier via le filename
    let enrichedContext = context || "";
    if (filename) {
      const ext = filename.split(".").pop().toLowerCase();
      const extMap = {
        pdf: "document pdf",
        doc: "document word",
        docx: "document word",
        xls: "tableur excel",
        xlsx: "tableur excel",
        ppt: "présentation powerpoint",
        pptx: "présentation powerpoint",
      };
      enrichedContext += ` ${extMap[ext] || ""}`;
    }

    const result = classifyDocument(title, enrichedContext, keywords);

    // Récupérer la liste des types disponibles pour aide à la validation
    const typesResult = await pool.query(
      "SELECT id, code, label FROM document_types ORDER BY code"
    );
    const processesResult = await pool.query(
      "SELECT id, main_process, sub_process FROM processes ORDER BY main_process, sub_process LIMIT 50"
    );

    return res.json({
      ...result,
      available_types:     typesResult.rows,
      available_processes: processesResult.rows,
      message: result.suggested_type
        ? `Type suggéré : ${result.suggested_type.code} (confiance ${result.suggested_type.confidence}%). Validation humaine obligatoire.`
        : "Aucune suggestion automatique. Veuillez choisir manuellement le type et le processus.",
    });
  } catch (err) {
    console.error("[IA][Classification] Erreur:", err.message);
    return res.status(500).json({ error: "Erreur lors de la classification." });
  }
}

// ─────────────────────────────────────────────────────────────
// ─── CARTE 3 : EXTRACTION AUTOMATIQUE DES DATES ──────────
// ─────────────────────────────────────────────────────────────

const MONTHS_FR = {
  janvier:1, février:2, mars:3, avril:4, mai:5, juin:6,
  juillet:7, août:8, septembre:9, octobre:10, novembre:11, décembre:12,
  jan:1, fév:2, mar:3, avr:4, jui:6, juil:7, aoû:8, sep:9, oct:10, nov:11, déc:12,
};

function parseDate(match) {
  // Format DD/MM/YYYY ou DD-MM-YYYY
  const dmySlash = match.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmySlash) {
    const [, d, m, y] = dmySlash;
    return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
  }
  // Format YYYY-MM-DD
  const iso = match.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return match;
  // Format DD MMMM YYYY
  const longFr = match.match(/^(\d{1,2})\s+([a-zéûôêùàâ]+)\s+(\d{4})$/i);
  if (longFr) {
    const [, d, mName, y] = longFr;
    const mNum = MONTHS_FR[mName.toLowerCase()];
    if (mNum) return `${y}-${String(mNum).padStart(2,"0")}-${d.padStart(2,"0")}`;
  }
  return null;
}

function extractDatesFromText(text) {
  if (!text) return [];
  const found = [];
  const seen = new Set();

  // Patterns regex
  const PATTERNS = [
    // DD/MM/YYYY ou DD-MM-YYYY
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/g,
    // YYYY-MM-DD (ISO)
    /\b(\d{4}-\d{2}-\d{2})\b/g,
    // DD MMMM YYYY (français)
    /\b(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})\b/gi,
    // DD MMM YYYY abrégés
    /\b(\d{1,2}\s+(?:jan|fév|mar|avr|jui|juil|aoû|sep|oct|nov|déc)\.?\s+\d{4})\b/gi,
  ];

  // Contextes pour typer la date
  const DATE_CONTEXTS = [
    { pattern: /cr[eé][eé]|[eé]tabli|date\s+de\s+cr[eé]ation|[eé]mis\s+le/i, type: "creation_date",  label: "Date de création" },
    { pattern: /r[eé]vis[eé]|r[eé]vision|mise\s+à\s+jour|modifi[eé]/i,        type: "revision_date",  label: "Date de révision" },
    { pattern: /valid[eé]|approv[eé]|validation\s+le/i,                         type: "validation_date",label: "Date de validation" },
    { pattern: /expir|p[eé]rim[eé]|[eé]ch[eé]ance|validit[eé]\s+jusqu/i,       type: "expiry_date",    label: "Date d'expiration" },
    { pattern: /applic|entr[eé]e\s+en\s+vigueur|effectif/i,                     type: "effective_date", label: "Date d'application" },
  ];

  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1] || match[0];
      const iso = parseDate(raw.trim());
      if (iso && !seen.has(iso)) {
        seen.add(iso);
        // Chercher le contexte autour de la date (50 chars avant)
        const before = text.slice(Math.max(0, match.index - 60), match.index);
        let dateType = "unknown";
        let dateLabel = "Date détectée";
        for (const ctx of DATE_CONTEXTS) {
          if (ctx.pattern.test(before)) {
            dateType = ctx.type;
            dateLabel = ctx.label;
            break;
          }
        }
        found.push({ raw, iso, type: dateType, label: dateLabel, context: before.trim().slice(-40) });
      }
    }
  }

  return found.sort((a, b) => a.iso.localeCompare(b.iso));
}

// ─────────────────────────────────────────────────────────────
// POST /api/ai/extract-dates — Extraction automatique des dates
// ─────────────────────────────────────────────────────────────
async function handleDateExtraction(req, res) {
  const { text, title, filename, document_id } = req.body;

  if (!text && !title && !filename) {
    return res.status(400).json({ error: "Aucun contenu à analyser." });
  }

  try {
    const fullText = [title, filename, text].filter(Boolean).join(" — ");
    const dates = extractDatesFromText(fullText);

    // Essayer de typer intelligemment si peu de contexte
    const result = {
      extracted_dates: dates,
      suggested_fields: {
        creation_date:  dates.find(d => d.type === "creation_date")?.iso  || null,
        revision_date:  dates.find(d => d.type === "revision_date")?.iso  || null,
        expiry_date:    dates.find(d => d.type === "expiry_date")?.iso    || null,
        effective_date: dates.find(d => d.type === "effective_date")?.iso || null,
      },
      needs_human_validation: true,
      message: dates.length > 0
        ? `${dates.length} date(s) détectée(s). Validation humaine obligatoire avant enregistrement.`
        : "Aucune date détectée automatiquement. Saisie manuelle requise.",
    };

    // Si un document_id est fourni, récupérer les dates existantes pour comparaison
    if (document_id) {
      const docResult = await pool.query(
        "SELECT next_review_date, created_at FROM documents WHERE id = $1",
        [parseInt(document_id)]
      );
      if (docResult.rows.length) {
        result.existing_dates = {
          created_at:       docResult.rows[0].created_at,
          next_review_date: docResult.rows[0].next_review_date,
        };
      }
    }

    return res.json(result);
  } catch (err) {
    console.error("[IA][Dates] Erreur:", err.message);
    return res.status(500).json({ error: "Erreur lors de l'extraction des dates." });
  }
}

// ─────────────────────────────────────────────────────────────
// ─── CARTE 4 : ANALYSE AMÉLIORATION CONTINUE ─────────────
// ─────────────────────────────────────────────────────────────

// Seuils de recommandation
const THRESHOLDS = {
  OBSOLETE_RATIO:       0.30,  // >30% docs obsolètes par processus → alerte
  UNUSED_DAYS:          60,    // >60 jours sans consultation → doc inactif
  SLOW_VALIDATION_DAYS: 14,    // >14 jours moyen de validation → lenteur
  MAX_VERSIONS:         6,     // >6 versions → révision de gouvernance
  MIN_DOCS_PROCESS:     3,     // processus significatif si ≥3 docs
};

async function computeImprovements() {
  const recommendations = [];

  // ── 1. Processus avec trop d'obsolètes ──────────────────────
  const obsResult = await pool.query(`
    SELECT
      COALESCE(p.sub_process, 'Non défini') AS process_name,
      COUNT(*)                               AS total,
      SUM(CASE WHEN s.name = 'Obsolète' THEN 1 ELSE 0 END)  AS obsolete_count,
      SUM(CASE WHEN s.name = 'Archivé'  THEN 1 ELSE 0 END)  AS archived_count
    FROM documents d
    LEFT JOIN processes p ON p.id = d.process_id
    JOIN status s ON s.id = d.status_id
    GROUP BY p.sub_process
    HAVING COUNT(*) >= $1
    ORDER BY (SUM(CASE WHEN s.name = 'Obsolète' THEN 1 ELSE 0 END)::float / COUNT(*)) DESC
  `, [THRESHOLDS.MIN_DOCS_PROCESS]);

  for (const row of obsResult.rows) {
    const ratio = parseInt(row.obsolete_count) / parseInt(row.total);
    if (ratio > THRESHOLDS.OBSOLETE_RATIO) {
      recommendations.push({
        id:         `obs-${row.process_name}`,
        category:   "Obsolescence",
        priority:   ratio > 0.5 ? "CRITIQUE" : "HAUTE",
        icon:       "warning",
        title:      `Trop de documents obsolètes — ${row.process_name}`,
        detail:     `${row.obsolete_count}/${row.total} documents sont obsolètes (${Math.round(ratio * 100)}%). Archivez ou révisez ces documents.`,
        action:     "Archiver les documents obsolètes ou lancer une révision.",
        metric:     { value: Math.round(ratio * 100), unit: "%" },
        process:    row.process_name,
        docs_count: parseInt(row.total),
      });
    }
  }

  // ── 2. Documents jamais consultés (hors archivés/obsolètes) ─
  const unusedResult = await pool.query(`
    SELECT
      d.id, d.doc_code, d.title, d.responsible,
      d.created_at, s.name AS status_name,
      COALESCE(p.sub_process,'Non défini') AS process_name
    FROM documents d
    JOIN status s ON s.id = d.status_id
    LEFT JOIN processes p ON p.id = d.process_id
    WHERE s.name NOT IN ('Archivé','Obsolète','Brouillon')
      AND d.created_at < NOW() - INTERVAL '${THRESHOLDS.UNUSED_DAYS} days'
      AND NOT EXISTS (
        SELECT 1 FROM logs l
        WHERE l.document_id = d.id
          AND l.created_at > NOW() - INTERVAL '${THRESHOLDS.UNUSED_DAYS} days'
      )
    ORDER BY d.created_at ASC
    LIMIT 15
  `);

  if (unusedResult.rows.length > 0) {
    recommendations.push({
      id:         "unused-docs",
      category:   "Activité",
      priority:   unusedResult.rows.length > 10 ? "HAUTE" : "MOYENNE",
      icon:       "eye-off",
      title:      `${unusedResult.rows.length} document(s) jamais consulté(s) depuis ${THRESHOLDS.UNUSED_DAYS} jours`,
      detail:     `Ces documents actifs n'ont reçu aucune consultation récente. Vérifiez leur pertinence et leur diffusion.`,
      action:     "Revoir la diffusion ou archiver les documents non pertinents.",
      metric:     { value: unusedResult.rows.length, unit: "docs" },
      documents:  unusedResult.rows,
    });
  }

  // ── 3. Validation trop lente ─────────────────────────────────
  const slowResult = await pool.query(`
    SELECT
      COALESCE(p.sub_process,'Non défini') AS process_name,
      COUNT(*) AS total_validated,
      ROUND(AVG(
        EXTRACT(DAY FROM (
          SELECT MIN(l2.created_at)
          FROM logs l2
          WHERE l2.document_id = d.id
            AND l2.action ILIKE '%validé%'
        ) - d.created_at)
      ))::int AS avg_days_to_validation
    FROM documents d
    LEFT JOIN processes p ON p.id = d.process_id
    JOIN status s ON s.id = d.status_id
    WHERE s.name IN ('Validé','Diffusé','Obsolète','Archivé')
    GROUP BY p.sub_process
    HAVING COUNT(*) >= 2
       AND ROUND(AVG(
             EXTRACT(DAY FROM (
               SELECT MIN(l2.created_at)
               FROM logs l2
               WHERE l2.document_id = d.id
                 AND l2.action ILIKE '%validé%'
             ) - d.created_at)
           )) > $1
    ORDER BY avg_days_to_validation DESC
    LIMIT 10
  `, [THRESHOLDS.SLOW_VALIDATION_DAYS]);

  for (const row of slowResult.rows) {
    if (row.avg_days_to_validation && row.avg_days_to_validation > THRESHOLDS.SLOW_VALIDATION_DAYS) {
      recommendations.push({
        id:         `slow-${row.process_name}`,
        category:   "Délais",
        priority:   row.avg_days_to_validation > 30 ? "HAUTE" : "MOYENNE",
        icon:       "clock",
        title:      `Validation lente — ${row.process_name}`,
        detail:     `Délai moyen de validation : ${row.avg_days_to_validation} jours (seuil recommandé : ${THRESHOLDS.SLOW_VALIDATION_DAYS} jours).`,
        action:     "Analyser les goulots d'étranglement dans le circuit de validation.",
        metric:     { value: row.avg_days_to_validation, unit: "jours" },
        process:    row.process_name,
      });
    }
  }

  // ── 4. Documents avec trop de versions ──────────────────────
  const versionsResult = await pool.query(`
    SELECT
      d.id, d.doc_code, d.title, d.responsible,
      d.current_version,
      COUNT(v.id) AS version_count,
      s.name AS status_name,
      COALESCE(p.sub_process,'Non défini') AS process_name
    FROM documents d
    LEFT JOIN versions v  ON v.document_id = d.id
    JOIN  status      s  ON s.id = d.status_id
    LEFT JOIN processes p ON p.id = d.process_id
    GROUP BY d.id, d.doc_code, d.title, d.responsible, d.current_version,
             s.name, p.sub_process
    HAVING COUNT(v.id) > $1
    ORDER BY version_count DESC
    LIMIT 10
  `, [THRESHOLDS.MAX_VERSIONS]);

  if (versionsResult.rows.length > 0) {
    recommendations.push({
      id:         "too-many-versions",
      category:   "Gouvernance",
      priority:   "MOYENNE",
      icon:       "layers",
      title:      `${versionsResult.rows.length} document(s) avec plus de ${THRESHOLDS.MAX_VERSIONS} versions`,
      detail:     `Un grand nombre de versions peut indiquer un manque de stabilité des exigences ou une gestion documentaire à améliorer.`,
      action:     "Consolider les versions et revoir les cycles de révision.",
      metric:     { value: versionsResult.rows.length, unit: "docs" },
      documents:  versionsResult.rows,
    });
  }

  // ── 5. KPIs globaux ─────────────────────────────────────────
  const kpisResult = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN s.name = 'Brouillon'     THEN 1 ELSE 0 END) AS brouillon,
      SUM(CASE WHEN s.name = 'En validation' THEN 1 ELSE 0 END) AS en_validation,
      SUM(CASE WHEN s.name = 'Validé'        THEN 1 ELSE 0 END) AS valide,
      SUM(CASE WHEN s.name = 'Diffusé'       THEN 1 ELSE 0 END) AS diffuse,
      SUM(CASE WHEN s.name = 'Obsolète'      THEN 1 ELSE 0 END) AS obsolete,
      SUM(CASE WHEN s.name = 'Archivé'       THEN 1 ELSE 0 END) AS archive,
      SUM(CASE WHEN d.next_review_date < CURRENT_DATE
               AND s.name NOT IN ('Archivé','Obsolète')
               THEN 1 ELSE 0 END) AS expired_count
    FROM documents d
    JOIN status s ON s.id = d.status_id
  `);

  const kpis = kpisResult.rows[0];
  const total = parseInt(kpis.total) || 1;

  const healthScore = Math.max(0, Math.round(
    100 -
    (parseInt(kpis.expired_count) / total * 40) -
    (parseInt(kpis.obsolete)      / total * 20) -
    (parseInt(kpis.brouillon)     / total * 10)
  ));

  // Trier par priorité
  const PRIORITY_ORDER = { CRITIQUE: 0, HAUTE: 1, MOYENNE: 2, BASSE: 3 };
  recommendations.sort((a, b) => (PRIORITY_ORDER[a.priority] || 3) - (PRIORITY_ORDER[b.priority] || 3));

  return {
    health_score: healthScore,
    health_label: healthScore >= 80 ? "Bon" : healthScore >= 60 ? "Moyen" : "À améliorer",
    kpis: {
      total:         parseInt(kpis.total),
      brouillon:     parseInt(kpis.brouillon),
      en_validation: parseInt(kpis.en_validation),
      valide:        parseInt(kpis.valide),
      diffuse:       parseInt(kpis.diffuse),
      obsolete:      parseInt(kpis.obsolete),
      archive:       parseInt(kpis.archive),
      expired:       parseInt(kpis.expired_count),
    },
    recommendations,
    total_recommendations: recommendations.length,
    generated_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
// GET /api/ai/improvements — Analyse amélioration continue
// ─────────────────────────────────────────────────────────────
async function getImprovements(req, res) {
  const user = req.currentUser;
  const role = user?.role;

  if (!["Admin GED","Responsable Qualité","Ing. Qualité"].includes(role)) {
    return res.status(403).json({
      error: "Réservé aux Responsables Qualité et Admin GED.",
    });
  }

  try {
    const result = await computeImprovements();
    return res.json(result);
  } catch (err) {
    console.error("[IA][Improvements] Erreur:", err.message);
    return res.status(500).json({ error: "Erreur lors de l'analyse d'amélioration continue." });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/ai/logs — Journalisation des requêtes IA
// ─────────────────────────────────────────────────────────────
async function getQueryLogs(req, res) {
  const user = req.currentUser;
  const role = user?.role;

  if (!["Admin GED","Responsable Qualité"].includes(role)) {
    return res.status(403).json({ error: "Accès réservé à l'administration." });
  }

  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await pool.query(`
      SELECT
        l.id, l.query_text, l.intent, l.result_count, l.created_at,
        u.name AS user_name, u.email AS user_email
      FROM ai_query_logs l
      LEFT JOIN users u ON u.id = l.user_id
      ORDER BY l.created_at DESC
      LIMIT $1
    `, [limit]);

    return res.json({
      logs: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    console.error("[IA][Logs] Erreur:", err.message);
    return res.status(500).json({ error: "Erreur lors de la récupération des logs." });
  }
}

module.exports = {
  ensureAITables,
  handleChatQuery,
  handleClassification,
  handleDateExtraction,
  getImprovements,
  getQueryLogs,
};
