// ============================================================
// controllers/notificationController.js — Sprint 5 + Sprint 8
// Notifications Intelligentes : table, triggers, CRON, API + Kafka
// ============================================================
"use strict";

const pool = require("../db");
const { publishEvent } = require("../kafka/producer");
const emailService = require("../services/emailService");

// ── Helper: get emails of active users by role ─────────────────
async function emailsByRoles(roles) {
  if (!roles || !roles.length) return [];
  const placeholders = roles.map((_, i) => `$${i + 1}`).join(",");
  const result = await pool.query(
    `SELECT u.email FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE r.name IN (${placeholders}) AND u.is_active = true AND u.email IS NOT NULL`,
    roles
  );
  const emails = result.rows.map(r => r.email);
  // Always include ADMIN_NOTIFY_EMAIL from env (guaranteed delivery)
  const adminEnv = process.env.ADMIN_NOTIFY_EMAIL;
  if (adminEnv && !emails.includes(adminEnv)) emails.push(adminEnv);
  return emails;
}
async function allActiveEmails() {
  const result = await pool.query(
    `SELECT email FROM users WHERE is_active = true AND email IS NOT NULL`
  );
  const emails = result.rows.map(r => r.email);
  const adminEnv = process.env.ADMIN_NOTIFY_EMAIL;
  if (adminEnv && !emails.includes(adminEnv)) emails.push(adminEnv);
  return emails;
}

// ─────────────────────────────────────────────────────────────
// ensureNotificationsTable — crée la table au démarrage
// ─────────────────────────────────────────────────────────────
async function ensureNotificationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
      message     TEXT NOT NULL,
      type        VARCHAR(50) NOT NULL DEFAULT 'validation',
      is_read     BOOLEAN DEFAULT false,
      created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifications(user_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(user_id, is_read)
  `);
  console.log("[Notif] Table notifications vérifiée.");
}

// ─────────────────────────────────────────────────────────────
// createNotification — insère une notification pour un user
// ─────────────────────────────────────────────────────────────
async function createNotification(userId, documentId, message, type) {
  await pool.query(
    `INSERT INTO notifications (user_id, document_id, message, type)
     VALUES ($1, $2, $3, $4)`,
    [userId, documentId || null, message, type]
  );
}

// ─────────────────────────────────────────────────────────────
// createNotificationsForRoles
// Envoie à tous les users actifs ayant l'un des rôles donnés.
// Anti-doublon : ignore si une notif non-lue du même type+doc existe déjà.
// ─────────────────────────────────────────────────────────────
async function createNotificationsForRoles(roles, documentId, message, type) {
  if (!roles || !roles.length) return;

  const placeholders = roles.map((_, i) => `$${i + 1}`).join(",");
  const usersResult = await pool.query(
    `SELECT u.id
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE r.name IN (${placeholders}) AND u.is_active = true`,
    roles
  );

  for (const { id: userId } of usersResult.rows) {
    // Skip duplicate unread notification
    const dup = await pool.query(
      `SELECT id FROM notifications
       WHERE user_id = $1
         AND document_id IS NOT DISTINCT FROM $2
         AND type = $3
         AND is_read = false`,
      [userId, documentId || null, type]
    );
    if (dup.rows.length > 0) continue;

    await createNotification(userId, documentId, message, type);
  }
}

// ─────────────────────────────────────────────────────────────
// triggerStatusNotification
// Appelé après changeStatus() — envoie selon la nouvelle étape
// ─────────────────────────────────────────────────────────────
async function triggerStatusNotification(docId, docCode, docTitle, fromStatus, toStatus, actorName, actorRole) {
  const actor = actorName
    ? `${actorName}${actorRole ? ` (${actorRole})` : ""}`
    : "le système";

  try {
    if (toStatus === "Appel en relecture") {
      await createNotificationsForRoles(
        ["Admin", "Ing. Qualité", "Reviewer"],
        docId,
        `[${docCode}] "${docTitle}" — appel en relecture émis par ${actor}. Une nouvelle version est disponible pour relecture.`,
        "validation"
      );
    } else if (toStatus === "En correction") {
      await createNotificationsForRoles(
        ["Admin", "Ing. Qualité"],
        docId,
        `[${docCode}] "${docTitle}" — corrections requises suite à la relecture par ${actor}. Veuillez soumettre une nouvelle version.`,
        "validation"
      );
    } else if (toStatus === "En validation") {
      await createNotificationsForRoles(
        ["Admin", "Ing. Qualité", "Reviewer"],
        docId,
        `[${docCode}] "${docTitle}" soumis en validation par ${actor}. Statut précédent : ${fromStatus}. Votre approbation est requise.`,
        "validation"
      );
    } else if (toStatus === "Validé") {
      await createNotificationsForRoles(
        ["Admin"],
        docId,
        `[${docCode}] "${docTitle}" approuvé et validé par ${actor}. Le document est prêt pour diffusion.`,
        "validation"
      );
    } else if (toStatus === "Diffusé") {
      const allUsers = await pool.query(
        `SELECT id FROM users WHERE is_active = true`
      );
      for (const { id: userId } of allUsers.rows) {
        const dup = await pool.query(
          `SELECT id FROM notifications
           WHERE user_id = $1 AND document_id = $2 AND type = 'version' AND is_read = false`,
          [userId, docId]
        );
        if (dup.rows.length === 0) {
          await createNotification(
            userId, docId,
            `[${docCode}] "${docTitle}" diffusé par ${actor} — disponible à la consultation.`,
            "version"
          );
        }
      }
    } else if (toStatus === "Obsolète") {
      await createNotificationsForRoles(
        ["Admin"],
        docId,
        `[${docCode}] "${docTitle}" marqué Obsolète par ${actor}. Ce document ne doit plus être utilisé.`,
        "expiration"
      );
    }
    console.log(`[Notif] Trigger statut ${fromStatus} → ${toStatus} (doc ${docCode})`);

    // ── Direct email (no Kafka dependency) ───────────────────
    try {
      let emailTo = [];
      if (toStatus === "En validation" || toStatus === "Appel en relecture") {
        emailTo = await emailsByRoles(["Admin", "Ing. Qualité", "Reviewer"]);
      } else if (toStatus === "En correction") {
        emailTo = await emailsByRoles(["Admin", "Ing. Qualité"]);
      } else if (toStatus === "Validé" || toStatus === "Obsolète") {
        emailTo = await emailsByRoles(["Admin"]);
      } else if (toStatus === "Diffusé") {
        emailTo = await allActiveEmails();
      } else {
        emailTo = await emailsByRoles(["Admin"]);
      }
      if (emailTo.length > 0) {
        await emailService.sendStatusChangedEmail({
          to: emailTo,
          docId, docCode, title: docTitle, fromStatus, toStatus, actor,
        });
      }
    } catch (emailErr) {
      console.error("[Notif] Direct email error:", emailErr.message);
    }

    // Fire-and-forget Kafka event
    publishEvent("smq.document.status_changed", {
      docId, docCode, title: docTitle, fromStatus, toStatus, actor,
    }, docId).catch(() => {});
  } catch (err) {
    console.error("[Notif] triggerStatusNotification error:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// triggerNewVersionNotification
// Appelé après updateDocument() — nouvelle version créée
// ─────────────────────────────────────────────────────────────
async function triggerNewVersionNotification(docId, docCode, docTitle, version, prevVersion, changeSummary, actorName, actorRole) {
  const actor = actorName
    ? `${actorName}${actorRole ? ` (${actorRole})` : ""}`
    : "le système";
  const fromTo = prevVersion && prevVersion !== "-"
    ? ` (v${prevVersion} → v${version})`
    : ` (v${version})`;
  const summary = changeSummary ? ` Résumé : "${changeSummary}".` : "";

  try {
    await createNotificationsForRoles(
      ["Admin", "Ing. Qualité"],
      docId,
      `[${docCode}] "${docTitle}" — nouvelle version${fromTo} créée par ${actor}.${summary}`,
      "version"
    );
    console.log(`[Notif] Trigger nouvelle version v${version} → ${docCode}`);

    // ── Direct email ─────────────────────────────────────────
    try {
      const emailTo = await emailsByRoles(["Admin", "Ing. Qualité"]);
      if (emailTo.length > 0) {
        await emailService.sendNewVersionEmail({
          to: emailTo,
          docId, docCode, title: docTitle, version, uploadedBy: actorName,
        });
      }
    } catch (emailErr) {
      console.error("[Notif] Direct email (version) error:", emailErr.message);
    }

    // Fire-and-forget Kafka event
    publishEvent("smq.document.version_added", {
      docId, docCode, title: docTitle, version, uploadedBy: actorName,
    }, docId).catch(() => {});
  } catch (err) {
    console.error("[Notif] triggerNewVersionNotification error:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// runExpirationNotificationsJob — CRON (toutes les 24h)
// 1. Documents dont la date de révision est dépassée → expiration
// 2. Documents inactifs depuis 6 mois (Validé/Diffusé) → archivage suggéré
// ─────────────────────────────────────────────────────────────
async function runExpirationNotificationsJob() {
  console.log("[Notif-CRON] Vérification expiration et inactivité…");
  try {
    // helper — format date as DD/MM/YYYY
    const fmtDate = (d) => {
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
    };

    // 1. Documents expirés (next_review_date dépassé)
    const expired = await pool.query(
      `SELECT d.id, d.doc_code, d.title, d.next_review_date
       FROM documents d
       JOIN status s ON s.id = d.status_id
       WHERE d.next_review_date IS NOT NULL
         AND d.next_review_date < NOW()
         AND s.name NOT IN ('Archivé', 'Obsolète')`
    );

    for (const doc of expired.rows) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(doc.next_review_date).getTime()) / 86400000
      );
      await createNotificationsForRoles(
        ["Admin"],
        doc.id,
        `[${doc.doc_code}] "${doc.title}" — date de révision dépassée depuis ${daysOverdue} jour(s) (prévue le ${fmtDate(doc.next_review_date)}). Une révision est requise.`,
        "expiration"
      );
    }
    if (expired.rows.length) {
      // Send ONE consolidated digest email for all expired documents
      const adminEmails = await emailsByRoles(["Admin", "Ing. Qualité"]);
      const expiredList = expired.rows.map(d =>
        `• [${d.doc_code}] ${d.title} — prévu le ${fmtDate(d.next_review_date)} (+${Math.floor((Date.now() - new Date(d.next_review_date).getTime()) / 86400000)}j)`
      ).join("\n");

      await emailService.sendExpirationDigestEmail({
        to: adminEmails,
        docs: expired.rows.map(d => ({
          docCode:    d.doc_code,
          title:      d.title,
          docType:    d.status_name || "—",
          reviewDate: fmtDate(d.next_review_date),
          daysOverdue: Math.floor((Date.now() - new Date(d.next_review_date).getTime()) / 86400000),
        })),
      }).catch(err => console.error("[Notif-CRON] Digest email expiration failed:", err.message));

      console.log(`[Notif-CRON] ${expired.rows.length} document(s) expirés — digest email envoyé:\n${expiredList}`);

      // Also publish to Kafka (best-effort, non-blocking)
      for (const doc of expired.rows) {
        publishEvent("smq.document.expiring", {
          docCode: doc.doc_code, title: doc.title,
          reviewDate: fmtDate(doc.next_review_date),
        }, doc.id).catch(() => {});
      }
    }

    // 2. Documents inactifs depuis 6 mois (Validé ou Diffusé)
    const inactive = await pool.query(
      `SELECT d.id, d.doc_code, d.title, d.updated_at, s.name AS status_name
       FROM documents d
       JOIN status s ON s.id = d.status_id
       WHERE s.name IN ('Validé', 'Diffusé')
         AND d.updated_at < NOW() - INTERVAL '6 months'`
    );

    for (const doc of inactive.rows) {
      await createNotificationsForRoles(
        ["Admin"],
        doc.id,
        `[${doc.doc_code}] "${doc.title}" (${doc.status_name}) — aucune modification depuis plus de 6 mois (dernière activité : ${fmtDate(doc.updated_at)}). Archivage recommandé.`,
        "inactivite"
      );
    }

    if (inactive.rows.length) {
      const adminEmails = await emailsByRoles(["Admin", "Ing. Qualité"]);
      for (const doc of inactive.rows) {
        await emailService.sendInactiveDocumentEmail({
          to: adminEmails,
          docCode:      doc.doc_code,
          title:        doc.title,
          docType:      doc.status_name,
          lastModified: fmtDate(doc.updated_at),
        }).catch(err => console.error(`[Notif-CRON] Email inactivité failed for ${doc.doc_code}:`, err.message));
      }

      console.log(`[Notif-CRON] ${inactive.rows.length} document(s) inactifs — emails envoyés.`);

      for (const doc of inactive.rows) {
        publishEvent("smq.document.inactive", {
          docCode: doc.doc_code, title: doc.title,
          lastModified: fmtDate(doc.updated_at),
        }, doc.id).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[Notif-CRON] error:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/notifications — notifications de l'utilisateur connecté
// ─────────────────────────────────────────────────────────────
async function getUserNotifications(req, res) {
  const userId = req.currentUser?.id;
  if (!userId) return res.status(401).json({ error: "Non authentifié.", code: "NO_USER" });

  try {
    const result = await pool.query(
      `SELECT n.id, n.message, n.type, n.is_read, n.created_at,
              n.document_id, d.doc_code, d.title AS doc_title
       FROM notifications n
       LEFT JOIN documents d ON d.id = n.document_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[Notif] getUserNotifications error:", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/notifications/unread-count
// ─────────────────────────────────────────────────────────────
async function getUnreadCount(req, res) {
  const userId = req.currentUser?.id;
  if (!userId) return res.status(401).json({ error: "Non authentifié.", code: "NO_USER" });

  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read — marquer une notif comme lue
// ─────────────────────────────────────────────────────────────
async function markAsRead(req, res) {
  const userId  = req.currentUser?.id;
  const notifId = parseInt(req.params.id, 10);
  if (!userId) return res.status(401).json({ error: "Non authentifié.", code: "NO_USER" });

  try {
    await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE id = $1 AND user_id = $2`,
      [notifId, userId]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/notifications/read-all — tout marquer comme lu
// ─────────────────────────────────────────────────────────────
async function markAllAsRead(req, res) {
  const userId = req.currentUser?.id;
  if (!userId) return res.status(401).json({ error: "Non authentifié.", code: "NO_USER" });

  try {
    await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/notifications/trigger-expiration — Admin only
// Déclenche manuellement le job d'expiration (pour test)
// ─────────────────────────────────────────────────────────────
async function triggerExpirationJob(req, res) {
  const role = req.currentUser?.role;
  if (role !== "Admin") return res.status(403).json({ error: "Réservé aux administrateurs." });
  try {
    await runExpirationNotificationsJob();
    return res.json({ success: true, message: "Job d'expiration exécuté avec succès." });
  } catch (err) {
    return res.status(500).json({ error: "Erreur lors de l'exécution du job.", detail: err.message });
  }
}

module.exports = {
  ensureNotificationsTable,
  createNotification,
  createNotificationsForRoles,
  triggerStatusNotification,
  triggerNewVersionNotification,
  runExpirationNotificationsJob,
  triggerExpirationJob,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
