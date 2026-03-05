// =============================================================
// services/emailService.js — Nodemailer transporter + HTML email templates
// Sprint 8 — Kafka + Email notifications
// =============================================================
const nodemailer = require("nodemailer");

// ── Transporter (recreated each call so env changes take effect) ─
function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || "smtp.gmail.com",
    port:   parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function verifyEmailTransporter() {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === "your.email@gmail.com") {
    console.log("[Email] SMTP_USER not configured — email sending disabled.");
    return false;
  }
  try {
    await getTransporter().verify();
    console.log("[Email] SMTP transporter verified successfully.");
    return true;
  } catch (err) {
    console.error("[Email] SMTP verification failed:", err.message);
    return false;
  }
}

// ── Base layout ───────────────────────────────────────────────
function baseHtml(title, content) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#0b1929;padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="color:#4ab83f;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">SMQ GED · ACTIA Engineering</span><br/>
                <span style="color:#ffffff;font-size:20px;font-weight:800;">${title}</span>
              </td>
              <td align="right">
                <div style="width:40px;height:40px;border-radius:10px;background:rgba(74,184,63,0.15);border:1px solid rgba(74,184,63,0.3);display:inline-flex;align-items:center;justify-content:center;">
                  <span style="color:#4ab83f;font-size:20px;">&#128196;</span>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
            Notification automatique — SMQ GED · ISO 9001<br/>
            Ce message a été envoyé automatiquement, ne pas répondre.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function docCard(docCode, title, type) {
  return `
  <div style="background:#f8fafc;border-radius:8px;border-left:4px solid #4ab83f;padding:16px;margin:20px 0;">
    <span style="font-size:10px;font-weight:700;color:#4ab83f;text-transform:uppercase;letter-spacing:1px;">${type || "Document"}</span><br/>
    <span style="font-size:16px;font-weight:700;color:#0b1929;">${title || "—"}</span><br/>
    <span style="font-size:12px;color:#64748b;font-family:monospace;">${docCode || "—"}</span>
  </div>`;
}

// ── Email senders ──────────────────────────────────────────────

async function sendDocumentCreatedEmail({ to, docCode, title, docType, createdBy }) {
  const subject = `[SMQ GED] Nouveau document : ${docCode}`;
  const content = `
    <p style="font-size:14px;color:#374151;">Un nouveau document a été créé dans le système GED.</p>
    ${docCard(docCode, title, docType)}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:8px;">
      <tr>
        <td style="font-size:12px;color:#64748b;padding:4px 0;">Créé par :</td>
        <td style="font-size:12px;color:#0b1929;font-weight:600;">${createdBy || "—"}</td>
      </tr>
    </table>
    <p style="font-size:13px;color:#64748b;margin-top:20px;">
      Connectez-vous à SMQ GED pour consulter ou valider ce document.
    </p>`;
  await sendMail(to, subject, baseHtml("Nouveau document créé", content));
}

async function sendStatusChangedEmail({ to, docCode, title, docType, fromStatus, toStatus, actor }) {
  const statusColors = {
    "En validation": "#f59e0b",
    "Validé":        "#4ab83f",
    "Diffusé":       "#3b82f6",
    "Obsolète":      "#ef4444",
    "Brouillon":     "#94a3b8",
  };
  const color = statusColors[toStatus] || "#4ab83f";
  const subject = `[SMQ GED] Statut modifié : ${docCode} → ${toStatus}`;
  const content = `
    <p style="font-size:14px;color:#374151;">Le statut d'un document a été modifié.</p>
    ${docCard(docCode, title, docType)}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:8px;">
      <tr>
        <td style="font-size:12px;color:#64748b;padding:4px 0;">Ancien statut :</td>
        <td style="font-size:12px;color:#64748b;">${fromStatus || "—"}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#64748b;padding:4px 0;">Nouveau statut :</td>
        <td>
          <span style="font-size:12px;font-weight:700;color:#fff;background:${color};border-radius:4px;padding:2px 10px;">${toStatus}</span>
        </td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#64748b;padding:4px 0;">Par :</td>
        <td style="font-size:12px;color:#0b1929;font-weight:600;">${actor || "—"}</td>
      </tr>
    </table>`;
  await sendMail(to, subject, baseHtml("Changement de statut", content));
}

async function sendNewVersionEmail({ to, docCode, title, docType, version, uploadedBy }) {
  const subject = `[SMQ GED] Nouvelle version : ${docCode}`;
  const content = `
    <p style="font-size:14px;color:#374151;">Une nouvelle version a été ajoutée à un document.</p>
    ${docCard(docCode, title, docType)}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:8px;">
      <tr>
        <td style="font-size:12px;color:#64748b;padding:4px 0;">Version :</td>
        <td>
          <span style="font-size:12px;font-weight:700;color:#fff;background:#4ab83f;border-radius:4px;padding:2px 10px;">v${version}</span>
        </td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#64748b;padding:4px 0;">Ajoutée par :</td>
        <td style="font-size:12px;color:#0b1929;font-weight:600;">${uploadedBy || "—"}</td>
      </tr>
    </table>`;
  await sendMail(to, subject, baseHtml("Nouvelle version ajoutée", content));
}

async function sendExpiringDocumentEmail({ to, docCode, title, docType, reviewDate }) {
  const subject = `[SMQ GED] Document en retard de révision : ${docCode}`;
  const content = `
    <p style="font-size:14px;color:#374151;">Un document dépasse sa date de révision prévue.</p>
    ${docCard(docCode, title, docType)}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:8px;">
      <tr>
        <td style="font-size:12px;color:#64748b;padding:4px 0;">Date de révision :</td>
        <td>
          <span style="font-size:12px;font-weight:700;color:#fff;background:#ef4444;border-radius:4px;padding:2px 10px;">${reviewDate || "—"}</span>
        </td>
      </tr>
    </table>
    <p style="font-size:13px;color:#64748b;margin-top:20px;">
      Veuillez réviser ce document ou mettre à jour sa date de révision.
    </p>`;
  await sendMail(to, subject, baseHtml("Document en retard de révision", content));
}

async function sendInactiveDocumentEmail({ to, docCode, title, docType, lastModified }) {
  const subject = `[SMQ GED] Document inactif : ${docCode}`;
  const content = `
    <p style="font-size:14px;color:#374151;">Ce document n'a pas été modifié depuis plus de 6 mois.</p>
    ${docCard(docCode, title, docType)}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:8px;">
      <tr>
        <td style="font-size:12px;color:#64748b;padding:4px 0;">Dernière modification :</td>
        <td style="font-size:12px;color:#0b1929;font-weight:600;">${lastModified || "—"}</td>
      </tr>
    </table>
    <p style="font-size:13px;color:#64748b;margin-top:20px;">
      Veuillez vérifier si ce document est toujours pertinent ou le passer en statut Obsolète.
    </p>`;
  await sendMail(to, subject, baseHtml("Document inactif (6 mois)", content));
}

// ── Core send helper ──────────────────────────────────────────
async function sendMail(to, subject, html) {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === "your.email@gmail.com") return;
  const recipients = Array.isArray(to) ? to.filter(Boolean).join(",") : to;
  if (!recipients) return;
  try {
    await getTransporter().sendMail({
      from:    process.env.SMTP_FROM || process.env.SMTP_USER,
      to:      recipients,
      subject,
      html,
    });
    console.log(`[Email] Sent "${subject}" to ${recipients}`);
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}":`, err.message);
  }
}

module.exports = {
  verifyEmailTransporter,
  sendDocumentCreatedEmail,
  sendStatusChangedEmail,
  sendNewVersionEmail,
  sendExpiringDocumentEmail,
  sendInactiveDocumentEmail,
};
