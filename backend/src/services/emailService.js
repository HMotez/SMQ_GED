// =============================================================
// services/emailService.js — Nodemailer + Rich HTML email templates
// =============================================================
const nodemailer = require("nodemailer");

const LOGO_URL = "https://i.imgur.com/LCbKPmV.png";

function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || "smtp.gmail.com",
    port:   parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
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

// ── Inline SVG icons (email-safe, no emoji) ────────────────────
const SVG = {
  pencil:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  bell:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  eye:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  wrench:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  check:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  clock:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  send:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  ban:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
  archive:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  file:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  warning:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  version:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  building: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/><path d="M15 9h.01"/><path d="M15 15h.01"/></svg>`,
};


// ── Status config ──────────────────────────────────────────────
const STATUS_CFG = {
  "Brouillon":          { color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1", svgKey: "pencil",  grad: "135deg,#334155,#475569" },
  "En rédaction":       { color: "#b45309", bg: "#fffbeb", border: "#fde68a", svgKey: "pencil",  grad: "135deg,#92400e,#b45309" },
  "Appel en relecture": { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa", svgKey: "bell",    grad: "135deg,#9a3412,#c2410c" },
  "En relecture":       { color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe", svgKey: "eye",     grad: "135deg,#4c1d95,#6d28d9" },
  "En correction":      { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca", svgKey: "wrench",  grad: "135deg,#7f1d1d,#b91c1c" },
  "En validation":      { color: "#d97706", bg: "#fffbeb", border: "#fde68a", svgKey: "clock",   grad: "135deg,#78350f,#d97706" },
  "Validé":             { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", svgKey: "check",   grad: "135deg,#14532d,#15803d" },
  "Diffusé":            { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", svgKey: "send",    grad: "135deg,#1e3a8a,#1d4ed8" },
  "Obsolète":           { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", svgKey: "ban",     grad: "135deg,#7f1d1d,#dc2626" },
  "Archivé":            { color: "#475569", bg: "#f8fafc", border: "#e2e8f0", svgKey: "archive", grad: "135deg,#1e293b,#475569" },
};

const STATUS_CONTEXT = {
  "Appel en relecture": {
    headline: "Un document vous est soumis pour relecture.",
    detail:   "Veuillez examiner le document et rendre votre avis dans les meilleurs délais.",
  },
  "En relecture": {
    headline: "La relecture du document est en cours.",
    detail:   "Les relecteurs ont été notifiés. Aucune action immédiate requise.",
  },
  "En correction": {
    headline: "Des corrections sont requises sur ce document.",
    detail:   "Suite à la relecture, des points doivent être corrigés avant toute validation. Veuillez soumettre une version révisée.",
  },
  "En validation": {
    headline: "Un document est en attente de votre validation.",
    detail:   "Rendez-vous sur la page Validations pour approuver ou rejeter ce document.",
  },
  "Validé": {
    headline: "Le document a été approuvé et validé avec succès.",
    detail:   "Il est désormais prêt pour diffusion. L'administrateur peut procéder à la mise en circulation.",
  },
  "Diffusé": {
    headline: "Un nouveau document est disponible.",
    detail:   "Ce document vient d'être diffusé officiellement dans le système GED. Il est désormais accessible à tous les utilisateurs.",
  },
  "Obsolète": {
    headline: "Ce document a été marqué comme obsolète.",
    detail:   "Il ne doit plus être utilisé dans les processus en cours. Assurez-vous de mettre à jour les références.",
  },
  "Archivé": {
    headline: "Ce document a été archivé.",
    detail:   "Conservé à titre d'historique conformément aux exigences ISO 9001.",
  },
};

// helper — inline SVG wrapped with a color
function coloredSvg(svgKey, color, size) {
  const s = size || 16;
  const raw = SVG[svgKey] || SVG.file;
  return raw
    .replace(/width="18"/g, `width="${s}"`)
    .replace(/height="18"/g, `height="${s}"`)
    .replace('stroke="currentColor"', `stroke="${color}"`);
}

// helper — SVG icon box for email header (white icon on semi-transparent bg)
function headerIconBox(svgKey) {
  const svg = coloredSvg(svgKey, "#ffffff", 22);
  return `<div style="width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.25);text-align:center;vertical-align:middle;display:inline-block;">
    <table cellpadding="0" cellspacing="0" width="52" height="52"><tr><td align="center" valign="middle">${svg}</td></tr></table>
  </div>`;
}

// ── Status pill badge ──────────────────────────────────────────
function statusPill(name) {
  const c = STATUS_CFG[name] || { color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1", svgKey: "file" };
  const svg = coloredSvg(c.svgKey, c.color, 12);
  return `<span style="display:inline-block;background:${c.bg};color:${c.color};border:1.5px solid ${c.border};font-size:11px;font-weight:700;border-radius:20px;padding:4px 12px;letter-spacing:0.3px;vertical-align:middle;">${svg}&nbsp;${name}</span>`;
}

// ── Status arrow transition ────────────────────────────────────
function statusArrow(from, to) {
  const cFrom = STATUS_CFG[from] || { color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1", svgKey: "file" };
  const cTo   = STATUS_CFG[to]   || { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", svgKey: "check" };
  const svgFrom = coloredSvg(cFrom.svgKey, cFrom.color, 13);
  const svgTo   = coloredSvg(cTo.svgKey,   cTo.color,   13);
  return `
  <table cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr valign="middle">
      <td style="background:${cFrom.bg};border:1.5px solid ${cFrom.border};border-radius:24px;padding:7px 16px;">
        <span style="font-size:12px;font-weight:600;color:${cFrom.color};vertical-align:middle;">${svgFrom}&nbsp;${from || "—"}</span>
      </td>
      <td style="padding:0 14px;font-size:22px;color:#94a3b8;">&rarr;</td>
      <td style="background:${cTo.bg};border:2px solid ${cTo.border};border-radius:24px;padding:7px 16px;box-shadow:0 2px 8px ${cTo.border}80;">
        <span style="font-size:12px;font-weight:800;color:${cTo.color};vertical-align:middle;">${svgTo}&nbsp;${to || "—"}</span>
      </td>
    </tr>
  </table>`;
}

// ── Base layout ────────────────────────────────────────────────
function baseHtml(title, accent, headerGrad, svgKey, content) {
  const grad   = headerGrad || "135deg,#1e3450 0%,#2e4a6b 60%,#3d5f84 100%";
  const ac     = accent     || "#4ab83f";
  const iconHtml = headerIconBox(svgKey || "file");
  const footerSvg = coloredSvg("building", "#ffffff", 16);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#e8edf4;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#e8edf4;padding:40px 0;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(30,52,80,0.18);">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(${grad});padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:20px 32px 0;">
        <img src="${LOGO_URL}" alt="ACTIA" height="34" style="display:block;height:34px;width:auto;" />
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr valign="middle">
        <td style="padding:18px 32px 28px;">
          <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.4px;line-height:1.25;">${title}</div>
        </td>
        <td align="right" style="padding:18px 32px 28px 0;vertical-align:middle;">
          ${iconHtml}
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Accent stripe -->
  <tr><td style="height:4px;background:linear-gradient(90deg,${ac},${ac}99);font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- BODY -->
  <tr><td style="padding:32px 36px 28px;background:#ffffff;">
    ${content}
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 36px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;" /></td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:20px 36px 28px;background:#f8fafc;border-radius:0 0 16px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr valign="middle">
        <td>
          <div style="display:inline-block;background:linear-gradient(135deg,#1e3450,#2e4a6b);border-radius:6px;padding:2px 10px;margin-bottom:8px;">
            <span style="font-size:9px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.5px;">ISO 9001 &middot; GED</span>
          </div>
          <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;">Ce message est envoyé automatiquement par le système SMQ GED.</p>
          <p style="margin:0;font-size:11px;color:#94a3b8;">Merci de ne pas répondre directement à cet e-mail.</p>
        </td>
        <td align="right" style="padding-left:16px;vertical-align:middle;width:44px;">
          <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#1e3450,#3d5f84);text-align:center;vertical-align:middle;display:inline-block;">
            <table cellpadding="0" cellspacing="0" width="36" height="36"><tr><td align="center" valign="middle">${footerSvg}</td></tr></table>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Section label ──────────────────────────────────────────────
function sectionLabel(text, color) {
  const c = color || "#1e3450";
  return `<div style="display:inline-block;background:${c}15;border-left:3px solid ${c};padding:4px 12px;border-radius:0 6px 6px 0;margin-bottom:10px;">
    <span style="font-size:11px;font-weight:800;color:${c};text-transform:uppercase;letter-spacing:1px;">${text}</span>
  </div>`;
}

// ── Document card ──────────────────────────────────────────────
function docCard(docCode, title, type, accent) {
  const ac = accent || "#4ab83f";
  return `
  <div style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:12px;border:1px solid #e2e8f0;border-left:5px solid ${ac};padding:18px 22px;margin:20px 0;box-shadow:0 2px 8px rgba(30,52,80,0.07);">
    <div style="font-size:10px;font-weight:700;color:${ac};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">${type || "Document"}</div>
    <div style="font-size:17px;font-weight:800;color:#1e3450;line-height:1.3;margin-bottom:8px;">${title || "—"}</div>
    <div style="display:inline-block;background:#ffffff;border:1px solid #cbd5e1;border-radius:6px;padding:3px 10px;">
      <code style="font-size:12px;color:#475569;font-family:monospace;">${docCode || "—"}</code>
    </div>
  </div>`;
}

// ── Info table ─────────────────────────────────────────────────
function infoRow(label, value) {
  return `
  <tr>
    <td style="padding:9px 14px 9px 0;font-size:12px;color:#64748b;width:40%;border-bottom:1px solid #f1f5f9;vertical-align:top;">${label}</td>
    <td style="padding:9px 0;font-size:12px;color:#1e3450;font-weight:600;border-bottom:1px solid #f1f5f9;vertical-align:top;">${value || "—"}</td>
  </tr>`;
}

function infoTable(...rows) {
  return `
  <div style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;padding:4px 16px;margin:16px 0;">
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      ${rows.join("")}
    </table>
  </div>`;
}

// ── Alert box ──────────────────────────────────────────────────
function alertBox(message, color) {
  const c   = color || "#4ab83f";
  const txt = c.includes("ef4444") || c.includes("dc2626") || c.includes("b91c1c")
    ? "#991b1b"
    : c.includes("f59e0b") || c.includes("d97706")
      ? "#78350f"
      : c.includes("1d4ed8") || c.includes("2563eb")
        ? "#1e40af"
        : "#14532d";
  return `
  <div style="background:${c}14;border:1.5px solid ${c}44;border-radius:10px;padding:14px 18px;margin:20px 0;">
    <p style="margin:0;font-size:13px;color:${txt};font-weight:600;line-height:1.6;">${message}</p>
  </div>`;
}

// ── CTA button ─────────────────────────────────────────────────
function ctaButton(label, accent, path) {
  const ac   = accent || "#4ab83f";
  const base = (process.env.APP_URL || "http://localhost").replace(/\/$/, "");
  const url  = path ? `${base}${path}` : base;
  return `
  <div style="text-align:center;margin:24px 0 8px;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${ac},${ac}cc);color:#ffffff;font-size:13px;font-weight:700;padding:12px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 14px ${ac}44;">
      ${label || "Consulter dans SMQ GED"} &rarr;
    </a>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// Email senders
// ═══════════════════════════════════════════════════════════════

async function sendDocumentCreatedEmail({ to, docId, docCode, title, docType, createdBy }) {
  const accent = "#4ab83f";
  const subject = `[SMQ GED] Nouveau document créé — ${docCode}`;
  const docPath = docId ? `/list?docId=${docId}` : "/dashboard";
  const content = `
    ${sectionLabel("Création de document", accent)}
    <p style="margin:8px 0 0;font-size:15px;color:#374151;line-height:1.6;">
      Un nouveau document vient d'être enregistré dans le système GED ACTIA.
    </p>
    ${docCard(docCode, title, docType, accent)}
    ${infoTable(
      infoRow("Créé par",        `<strong style="color:#1e3450;">${createdBy || "—"}</strong>`),
      infoRow("Date de création", new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" }))
    )}
    ${alertBox("Connectez-vous à <strong>SMQ GED</strong> pour consulter, compléter ou soumettre ce document au flux de validation.", accent)}
    ${ctaButton("Voir le document", accent, docPath)}`;
  await sendMail(to, subject, baseHtml("Nouveau document créé", accent, "135deg,#14532d 0%,#15803d 60%,#16a34a 100%", "file", content));
}

const STATUS_ROUTE = {
  "Appel en relecture": "/workflow",
  "En relecture":       "/workflow",
  "En correction":      "/workflow",
  "En validation":      "/validations",
  "Validé":             "/list",
  "Diffusé":            "/list",
  "Obsolète":           "/list",
  "Archivé":            "/archive",
};

async function sendStatusChangedEmail({ to, docId, docCode, title, docType, fromStatus, toStatus, actor }) {
  const cfg     = STATUS_CFG[toStatus] || { color: "#4ab83f", bg: "#f0fdf4", border: "#bbf7d0", svgKey: "check", grad: "135deg,#14532d,#15803d" };
  const ctx     = STATUS_CONTEXT[toStatus] || {};
  const accent  = cfg.color;
  const subject = `[SMQ GED] ${docCode} — Statut : ${toStatus}`;
  const docPath = docId ? `/list?docId=${docId}` : (STATUS_ROUTE[toStatus] || "/dashboard");
  const content = `
    ${sectionLabel("Changement de statut", accent)}
    <p style="margin:8px 0 0;font-size:15px;color:#374151;line-height:1.6;">
      ${ctx.headline || "Le statut du document a été modifié."}
    </p>
    ${docCard(docCode, title, docType, accent)}
    ${statusArrow(fromStatus, toStatus)}
    ${infoTable(
      infoRow("Effectué par", `<strong style="color:#1e3450;">${actor || "—"}</strong>`),
      infoRow("Date",         new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" }))
    )}
    ${ctx.detail ? alertBox(ctx.detail, accent) : ""}
    ${ctaButton("Voir dans SMQ GED", accent, docPath)}`;
  await sendMail(to, subject, baseHtml(`Statut : ${toStatus}`, accent, cfg.grad, cfg.svgKey, content));
}

async function sendNewVersionEmail({ to, docId, docCode, title, docType, version, uploadedBy }) {
  const accent  = "#1d4ed8";
  const subject = `[SMQ GED] Nouvelle version — ${docCode} v${version}`;
  const docPath = docId ? `/list?docId=${docId}` : "/dashboard";
  const content = `
    ${sectionLabel("Mise à jour de version", accent)}
    <p style="margin:8px 0 0;font-size:15px;color:#374151;line-height:1.6;">
      Une nouvelle version a été publiée. Veuillez en prendre connaissance.
    </p>
    ${docCard(docCode, title, docType, accent)}
    ${infoTable(
      infoRow("Nouvelle version", `<span style="display:inline-block;background:#eff6ff;color:#1d4ed8;border:1.5px solid #bfdbfe;font-size:13px;font-weight:800;border-radius:8px;padding:2px 14px;">v${version}</span>`),
      infoRow("Publiée par",      `<strong style="color:#1e3450;">${uploadedBy || "—"}</strong>`),
      infoRow("Date",             new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" }))
    )}
    ${alertBox("Si vous êtes relecteur ou validateur, vérifiez que les modifications sont conformes aux exigences en vigueur.", accent)}
    ${ctaButton("Consulter la version", accent, docPath)}`;
  await sendMail(to, subject, baseHtml(`Nouvelle version v${version}`, accent, "135deg,#1e3a8a 0%,#1d4ed8 60%,#3b82f6 100%", "version", content));
}

async function sendExpiringDocumentEmail({ to, docId, docCode, title, docType, reviewDate }) {
  const accent  = "#dc2626";
  const subject = `[SMQ GED] ACTION REQUISE — Révision en retard : ${docCode}`;
  const docPath = docId ? `/list?docId=${docId}` : "/dashboard";
  const content = `
    ${sectionLabel("Alerte — Révision en retard", accent)}
    <p style="margin:8px 0 0;font-size:15px;color:#374151;line-height:1.6;">
      Ce document a dépassé sa date de révision planifiée. Une action est requise pour assurer la conformité ISO 9001.
    </p>
    ${docCard(docCode, title, docType, accent)}
    ${infoTable(
      infoRow("Date de révision prévue", `<span style="display:inline-block;background:#fef2f2;color:#dc2626;border:1.5px solid #fecaca;font-size:12px;font-weight:700;border-radius:8px;padding:2px 12px;">${reviewDate || "—"}</span>`),
      infoRow("Statut actuel",           statusPill(docType || "—"))
    )}
    ${alertBox("Ce document doit impérativement être révisé ou passé en statut <strong>Obsolète</strong> pour rester conforme au référentiel qualité.", accent)}
    ${ctaButton("Traiter maintenant", accent, docPath)}`;
  await sendMail(to, subject, baseHtml("Révision en retard", accent, "135deg,#7f1d1d 0%,#b91c1c 60%,#dc2626 100%", "warning", content));
}

async function sendInactiveDocumentEmail({ to, docId, docCode, title, docType, lastModified }) {
  const accent  = "#d97706";
  const subject = `[SMQ GED] Document inactif depuis 6 mois — ${docCode}`;
  const docPath = docId ? `/list?docId=${docId}` : "/dashboard";
  const content = `
    ${sectionLabel("Avertissement — Document inactif", accent)}
    <p style="margin:8px 0 0;font-size:15px;color:#374151;line-height:1.6;">
      Ce document n'a fait l'objet d'aucune modification depuis plus de 6 mois. Une action est recommandée.
    </p>
    ${docCard(docCode, title, docType, accent)}
    ${infoTable(
      infoRow("Dernière modification", `<strong style="color:#1e3450;">${lastModified || "—"}</strong>`),
      infoRow("Inactif depuis",        "+ de 6 mois")
    )}
    ${alertBox("Veuillez vérifier si ce document est toujours applicable. S'il est obsolète, merci de le marquer comme tel dans le système GED.", accent)}
    ${ctaButton("Vérifier le document", accent, docPath)}`;
  await sendMail(to, subject, baseHtml("Document inactif (6 mois)", accent, "135deg,#78350f 0%,#d97706 60%,#f59e0b 100%", "clock", content));
}

// ── Core send ──────────────────────────────────────────────────
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
    console.error(`[Email] Failed "${subject}":`, err.message);
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
