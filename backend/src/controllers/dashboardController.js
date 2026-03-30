// ============================================================
// controllers/dashboardController.js
// ACTIA ES — GED Sprint 4 — Tableau de bord & Supervision
// Carte 1: /api/dashboard/overview  — KPIs temps réel
// Carte 2: /api/dashboard/stats     — Graphiques & répartitions
// ============================================================

const pool = require("../db");

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard/overview — Vue synthétique (Carte 1)
// Retourne :
//   - Documents expirés (next_review_date < today, non archivés)
//   - Documents en validation (status = "En validation")
//   - Documents en retard de révision (date dépassée, hors Archivé/Obsolète)
//   - Documents récemment modifiés (10 derniers par activité)
// ─────────────────────────────────────────────────────────────
const getOverview = async (_req, res) => {
  try {
    const [expiredRes, inValRes, overdueRes, recentRes] = await Promise.all([

      // 1. Documents expirés — next_review_date dépassée, tous statuts
      pool.query(`
        SELECT
          COUNT(*) AS count,
          COALESCE(
            json_agg(json_build_object(
              'id',               d.id,
              'doc_code',         d.doc_code,
              'title',            d.title,
              'responsible',      d.responsible,
              'next_review_date', d.next_review_date,
              'status_name',      s.name
            ) ORDER BY d.next_review_date ASC),
            '[]'::json
          ) AS list
        FROM documents d
        JOIN status s ON s.id = d.status_id
        WHERE d.next_review_date IS NOT NULL
          AND d.next_review_date < CURRENT_DATE
      `),

      // 2. Documents en validation
      pool.query(`
        SELECT
          COUNT(*) AS count,
          COALESCE(
            json_agg(json_build_object(
              'id',               d.id,
              'doc_code',         d.doc_code,
              'title',            d.title,
              'responsible',      d.responsible,
              'next_review_date', d.next_review_date
            ) ORDER BY d.created_at DESC),
            '[]'::json
          ) AS list
        FROM documents d
        JOIN status s ON s.id = d.status_id
        WHERE s.name = 'En validation'
      `),

      // 3. Documents en retard de révision — tous statuts (même logique que list?overdue=true)
      pool.query(`
        SELECT
          COUNT(*) AS count,
          COALESCE(
            json_agg(json_build_object(
              'id',               d.id,
              'doc_code',         d.doc_code,
              'title',            d.title,
              'responsible',      d.responsible,
              'next_review_date', d.next_review_date,
              'status_name',      s.name,
              'days_overdue',     EXTRACT(DAY FROM AGE(CURRENT_DATE, d.next_review_date))::int
            ) ORDER BY d.next_review_date ASC),
            '[]'::json
          ) AS list
        FROM documents d
        JOIN status s ON s.id = d.status_id
        WHERE d.next_review_date IS NOT NULL
          AND d.next_review_date < CURRENT_DATE
      `),

      // 4. Documents récemment modifiés — 10 derniers par activité
      pool.query(`
        SELECT
          d.id, d.doc_code, d.title, d.responsible,
          d.current_version, d.next_review_date,
          s.name  AS status_name,
          f.name  AS folder_name,
          dt.code AS type_code, dt.label AS type_label,
          COALESCE(
            (SELECT MAX(l.created_at) FROM logs l WHERE l.document_id = d.id),
            d.created_at
          ) AS last_activity
        FROM documents d
        JOIN status         s  ON s.id  = d.status_id
        JOIN folders        f  ON f.id  = d.folder_id
        JOIN document_types dt ON dt.id = d.type_id
        ORDER BY last_activity DESC
        LIMIT 10
      `),
    ]);

    return res.json({
      expired: {
        count: parseInt(expiredRes.rows[0].count, 10),
        list:  expiredRes.rows[0].list || [],
      },
      in_validation: {
        count: parseInt(inValRes.rows[0].count, 10),
        list:  inValRes.rows[0].list || [],
      },
      overdue: {
        count: parseInt(overdueRes.rows[0].count, 10),
        list:  overdueRes.rows[0].list || [],
      },
      recent_docs: recentRes.rows,
    });
  } catch (err) {
    console.error("🔥 ERROR getOverview:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard/stats — Statistiques & Graphiques (Carte 2)
// Retourne :
//   - Répartition par statut
//   - Répartition par type documentaire
//   - Répartition par processus (top 10)
// ─────────────────────────────────────────────────────────────
const getDashboardStats = async (_req, res) => {
  try {
    const [byStatusRes, byTypeRes, byProcessRes] = await Promise.all([

      // Répartition par statut
      pool.query(`
        SELECT s.name AS name, COUNT(*) AS count
        FROM documents d
        JOIN status s ON s.id = d.status_id
        GROUP BY s.name
        ORDER BY
          CASE s.name
            WHEN 'Brouillon'     THEN 1
            WHEN 'En rédaction'  THEN 2
            WHEN 'En relecture'  THEN 3
            WHEN 'En validation' THEN 4
            WHEN 'Validé'        THEN 5
            WHEN 'Diffusé'       THEN 6
            WHEN 'Obsolète'      THEN 7
            WHEN 'Archivé'       THEN 8
            ELSE 99
          END
      `),

      // Répartition par type documentaire
      pool.query(`
        SELECT dt.code, dt.label, COUNT(*) AS count
        FROM documents d
        JOIN document_types dt ON dt.id = d.type_id
        GROUP BY dt.code, dt.label
        ORDER BY count DESC
      `),

      // Répartition par processus (top 10) — via dossier parent
      pool.query(`
        SELECT
          COALESCE(fp.name, f.name, 'Non assigné') AS name,
          COUNT(*) AS count
        FROM documents d
        LEFT JOIN folders f  ON f.id  = d.process_id
        LEFT JOIN folders fp ON fp.id = f.parent_id
        GROUP BY fp.name, f.name
        ORDER BY count DESC
        LIMIT 10
      `),
    ]);

    return res.json({
      by_status: byStatusRes.rows.map(r => ({
        name:  r.name,
        count: parseInt(r.count, 10),
      })),
      by_type: byTypeRes.rows.map(r => ({
        code:  r.code,
        label: r.label,
        count: parseInt(r.count, 10),
      })),
      by_process: byProcessRes.rows.map(r => ({
        name:  r.name,
        id:    r.id,
        count: parseInt(r.count, 10),
      })),
    });
  } catch (err) {
    console.error("🔥 ERROR getDashboardStats:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getOverview, getDashboardStats };
