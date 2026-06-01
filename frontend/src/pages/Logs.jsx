// ============================================================
// pages/Logs.jsx
// RÔLE : Interface de consultation du journal d'audit ISO 9001.
//        Affiche toutes les actions tracées dans la table logs :
//        créations, changements de statut, validations, connexions,
//        accès refusés, avec filtres par action/user/date/sévérité.
//        Admin : voit tous les logs y compris sécurité.
//        Ing. Qualité : voit uniquement les logs documentaires.
//        Permet l'export en CSV pour archivage légal.
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import AppSidebar from "../components/AppSidebar";
import { API } from "../config";
import actiLogo from "../assets/Logo.png";
import {
  LuRefreshCw, LuDownload, LuFileText, LuFilter, LuX, LuChevronDown,
} from "react-icons/lu";

// ── Label map for known action types ─────────────────────────
const ACTION_LABEL_MAP = {
  CREATE_DOCUMENT:                    "Création document",
  NEW_VERSION:                        "Nouvelle version",
  VERSION_SUPERSEDED:                 "Version remplacée",
  STATUS_CHANGE:                      "Changement de statut",
  AUTO_ARCHIVE:                       "Archivage automatique",
  VALIDATION_CREATED:                 "Validation créée",
  VALIDATION_EDIT_ATTEMPT_BLOCKED:    "Modification validation bloquée",
  VALIDATION_DELETE_ATTEMPT_BLOCKED:  "Suppression validation bloquée",
  // Security
  LOGIN_SUCCESS:                      "Connexion réussie",
  LOGIN_FAILURE:                      "Échec de connexion",
  LOGIN_NEW_IP:                       "Nouvelle IP détectée",
  LOGOUT:                             "Déconnexion",
  ACCOUNT_LOCKED:                     "Compte verrouillé",
  ACCESS_DENIED_401:                  "Accès refusé (401)",
  ACCESS_DENIED_403:                  "Accès refusé (403)",
};

// ── Hardcoded dropdown options (always available, independent of DB) ──
const DROPDOWN_ACTIONS = [
  "CREATE_DOCUMENT",
  "NEW_VERSION",
  "VERSION_SUPERSEDED",
  "STATUS_CHANGE",
];

// ── Helpers ──────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function actionLabel(action) {
  return ACTION_LABEL_MAP[action] || action;
}

function actionColor(action) {
  if (action?.includes("CREATE"))              return { color: "#4ab83f", bg: "rgba(74,184,63,0.12)",   border: "rgba(74,184,63,0.25)"   };
  if (action?.includes("STATUS"))              return { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.25)"  };
  if (action?.includes("VERSION"))             return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)"  };
  if (action?.includes("ARCHIVE"))             return { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" };
  if (action?.includes("VALIDATION"))          return { color: "#2dd4bf", bg: "rgba(45,212,191,0.12)",  border: "rgba(45,212,191,0.25)"  };
  if (action?.includes("BLOCKED"))             return { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" };
  // Security events
  if (action === "LOGIN_SUCCESS")              return { color: "#4ab83f", bg: "rgba(74,184,63,0.12)",   border: "rgba(74,184,63,0.25)"   };
  if (action === "LOGOUT")                     return { color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.2)"  };
  if (action === "LOGIN_FAILURE")              return { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" };
  if (action === "ACCOUNT_LOCKED")             return { color: "#ef4444", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.35)"   };
  if (action === "LOGIN_NEW_IP")               return { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.25)"  };
  if (action === "ACCESS_DENIED_401")          return { color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.25)"  };
  if (action === "ACCESS_DENIED_403")          return { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" };
  return { color: "#a8bfd4", bg: "rgba(168,191,212,0.08)", border: "rgba(168,191,212,0.15)" };
}

// ── Inline text helpers ───────────────────────────────────────
const TX  = { color: "rgba(200,218,235,0.75)", fontSize: 12 };
const TXD = { color: "rgba(168,191,212,0.45)", fontSize: 12 };

function B({ children, color }) {
  return <strong style={{ color: color || "#dce8f5", fontWeight: 700 }}>{children}</strong>;
}
function Em({ children }) {
  return <em style={{ color: "rgba(168,191,212,0.5)", fontStyle: "italic" }}>{children}</em>;
}

const STATUS_COLOR = {
  "Brouillon": "#a8bfd4", "En rédaction": "#4ade80",
  "Appel en relecture": "#fbbf24", "En relecture": "#60a5fa",
  "En correction": "#f97316", "En validation": "#a5b4fc",
  "Validé": "#4ab83f", "Diffusé": "#2dd4bf",
  "Obsolète": "#fb923c", "Archivé": "#6b7280",
};

function Stat({ label }) {
  const c = STATUS_COLOR[label] || "#a8bfd4";
  return <B color={c}>{label || "—"}</B>;
}
function Ver({ v }) {
  return <B color="#f59e0b">{v || "—"}</B>;
}

// ── Smart details renderer — professional sentence format ─────
function ActionDetails({ action, details }) {
  if (!details) return <span style={TXD}>—</span>;
  let d = {};
  try { d = typeof details === "string" ? JSON.parse(details) : details; } catch { return <span style={TXD}>—</span>; }

  const wrap = (children) => (
    <span className="leading-snug" style={TX}>{children}</span>
  );

  if (action === "STATUS_CHANGE") {
    return wrap(<>
      Statut modifié de <Stat label={d.from} /> vers <Stat label={d.to} />
      {d.user_role && d.user_role !== "SYSTEM" && <> — rôle <B color="#a5b4fc">{d.user_role}</B></>}
    </>);
  }

  if (action === "NEW_VERSION") {
    const fromLabel = (!d.from || d.from === "-") ? "Initiale" : d.from;
    return wrap(<>
      Version mise à jour : <Ver v={fromLabel} /> → <Ver v={d.to} />
      {d.change_summary && <> — <Em>{d.change_summary}</Em></>}
    </>);
  }

  if (action === "VERSION_SUPERSEDED") {
    return wrap(<>
      La version <Ver v={d.superseded_version} /> a été remplacée par la version <Ver v={d.new_version} />
      {d.reason && <> — <Em>{d.reason}</Em></>}
    </>);
  }

  if (action === "CREATE_DOCUMENT") {
    return wrap(<>
      Document de type <B color="#4ab83f">{d.typeCode || "—"}</B> créé
      {d.folderCode && <> dans le dossier <B color="#2dd4bf">{d.folderCode}</B></>}
      {d.origin && <> — origine <B color={d.origin === "EXTERNE" ? "#fb923c" : "#60a5fa"}>{d.origin}</B></>}
    </>);
  }

  if (action === "AUTO_ARCHIVE") {
    return wrap(<>
      Archivage automatique : statut passé de <Stat label={d.from} /> à <Stat label={d.to} />
      {d.reason && <> — <Em>{d.reason}</Em></>}
    </>);
  }

  if (action === "VALIDATION_CREATED") {
    const dc = d.decision === "APPROUVÉ" ? "#4ab83f" : d.decision === "REJETÉ" ? "#f87171" : "#f59e0b";
    return wrap(<>
      {d.decision && <>Décision <B color={dc}>{d.decision}</B></>}
      {d.validator_name && <> émise par <B>{d.validator_name}</B></>}
      {d.comment && <> — <Em>"{d.comment}"</Em></>}
    </>);
  }

  if (action?.includes("BLOCKED")) {
    return wrap(<>
      <B color="#f87171">Tentative bloquée</B> — opération non autorisée par le système
    </>);
  }

  if (action === "LOGIN_SUCCESS") {
    return wrap(<>
      <B color="#4ab83f">Connexion réussie</B>
      {d.role && <> — rôle <B color="#a5b4fc">{d.role}</B></>}
      {d.ip   && <> — IP <B color="#94a3b8">{d.ip}</B></>}
      {d.email && <> — <Em>{d.email}</Em></>}
    </>);
  }
  if (action === "LOGIN_FAILURE") {
    return wrap(<>
      <B color="#f87171">Échec de connexion</B>
      {d.attempt != null && <> — tentative <B color="#f87171">#{d.attempt}</B></>}
      {d.reason  && <> — <Em>{d.reason === "wrong_password" ? "mot de passe incorrect" : d.reason === "user_not_found" ? "utilisateur introuvable" : d.reason}</Em></>}
      {d.email   && <> — <Em>{d.email}</Em></>}
    </>);
  }
  if (action === "LOGIN_NEW_IP") {
    return wrap(<>
      <B color="#fbbf24">Connexion depuis une nouvelle IP</B>
      {d.current_ip  && <> — nouvelle IP <B color="#fbbf24">{d.current_ip}</B></>}
      {d.previous_ip && <> (habituelle : <Em>{d.previous_ip}</Em>)</>}
      {d.email       && <> — <Em>{d.email}</Em></>}
    </>);
  }
  if (action === "LOGOUT") {
    return wrap(<>
      <B color="#94a3b8">Déconnexion</B>
      {d.email && <> — <Em>{d.email}</Em></>}
    </>);
  }
  if (action === "ACCOUNT_LOCKED") {
    return wrap(<>
      <B color="#ef4444">Compte verrouillé</B>
      {d.attempts    && <> après <B color="#ef4444">{d.attempts}</B> tentatives</>}
      {d.email       && <> — <Em>{d.email}</Em></>}
      {d.locked_until && <> — jusqu'à <B color="#fb923c">{new Date(d.locked_until).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</B></>}
    </>);
  }
  if (action === "ACCESS_DENIED_401") {
    return wrap(<>
      <B color="#fb923c">Session expirée</B> — authentification requise
      {d.path   && <> — <Em>{d.method ? `${d.method} ` : ""}{d.path}</Em></>}
      {d.ip     && <> — IP <B color="#94a3b8">{d.ip}</B></>}
    </>);
  }
  if (action === "ACCESS_DENIED_403") {
    return wrap(<>
      <B color="#f87171">Accès refusé</B> — permissions insuffisantes
      {d.path && <> — <Em>{d.method ? `${d.method} ` : ""}{d.path}</Em></>}
      {d.role && <> — rôle <B color="#a5b4fc">{d.role}</B></>}
    </>);
  }

  // Fallback: flat readable sentence — skip all technical/backend keys
  const SKIP_KEYS = ["doc_code", "timestamp", "ISO_transition", "ip", "ip_address",
    "user_agent", "path", "method", "email", "current_ip", "previous_ip", "role"];
  const entries = Object.entries(d)
    .filter(([k]) => !SKIP_KEYS.includes(k))
    .slice(0, 4);
  if (!entries.length) return <span style={TXD}>—</span>;
  return wrap(<>
    {entries.map(([k, v], i) => (
      <span key={k}>{i > 0 && " — "}<span style={TXD}>{k} : </span><B>{typeof v === "object" ? JSON.stringify(v) : String(v)}</B></span>
    ))}
  </>);
}

// ── Format details as plain ASCII sentence for PDF (jsPDF/Helvetica = Latin-1 only)
// NO Unicode arrows (→), NO em-dashes (—), NO accented chars outside Latin-1
function formatDetailsText(action, details) {
  if (!details) return "-";
  let d = {};
  try { d = typeof details === "string" ? JSON.parse(details) : details; } catch { return "-"; }

  if (action === "STATUS_CHANGE") {
    let s = `Statut modifie de "${d.from || "?"}" vers "${d.to || "?"}"`;
    if (d.user_role && d.user_role !== "SYSTEM") s += ` | Role : ${d.user_role}`;
    return s;
  }
  if (action === "NEW_VERSION") {
    const fromLabel = (!d.from || d.from === "-") ? "Initiale" : d.from;
    let s = `Version mise a jour : ${fromLabel} >> ${d.to || "?"}`;
    if (d.change_summary) s += ` | ${d.change_summary}`;
    return s;
  }
  if (action === "VERSION_SUPERSEDED") {
    return `Version ${d.superseded_version || "?"} remplacee par ${d.new_version || "?"}`;
  }
  if (action === "CREATE_DOCUMENT") {
    let s = `Document de type "${d.typeCode || "?"}" cree`;
    if (d.folderCode) s += ` dans le dossier ${d.folderCode}`;
    if (d.origin)     s += ` | Origine : ${d.origin}`;
    return s;
  }
  if (action === "AUTO_ARCHIVE") {
    let s = `Archivage automatique : "${d.from || "?"}" >> "${d.to || "?"}"`;
    if (d.reason) s += ` | ${d.reason}`;
    return s;
  }
  if (action === "VALIDATION_CREATED") {
    let s = d.decision ? `Decision : ${d.decision}` : "";
    if (d.validator_name) s += ` | Validateur : ${d.validator_name}`;
    if (d.comment)        s += ` | "${d.comment}"`;
    return s || "-";
  }
  if (action?.includes("BLOCKED")) {
    return "Tentative d'operation non autorisee bloquee par le systeme";
  }
  if (action === "LOGIN_SUCCESS") {
    let s = "Connexion reussie";
    if (d.role)  s += ` | Role : ${d.role}`;
    if (d.ip)    s += ` | IP : ${d.ip}`;
    if (d.email) s += ` | ${d.email}`;
    return s;
  }
  if (action === "LOGIN_FAILURE") {
    let s = "Echec de connexion";
    if (d.attempt != null) s += ` | Tentative #${d.attempt}`;
    if (d.reason)          s += ` | ${d.reason}`;
    if (d.email)           s += ` | ${d.email}`;
    return s;
  }
  if (action === "LOGIN_NEW_IP") {
    let s = "Connexion depuis une nouvelle IP";
    if (d.current_ip)  s += ` | Nouvelle IP : ${d.current_ip}`;
    if (d.previous_ip) s += ` | Habituelle : ${d.previous_ip}`;
    if (d.email)       s += ` | ${d.email}`;
    return s;
  }
  if (action === "LOGOUT") {
    return `Deconnexion${d.email ? ` | ${d.email}` : ""}`;
  }
  if (action === "ACCOUNT_LOCKED") {
    let s = "Compte verrouille";
    if (d.attempts)     s += ` apres ${d.attempts} tentatives`;
    if (d.email)        s += ` | ${d.email}`;
    if (d.locked_until) s += ` | Jusqu'a : ${new Date(d.locked_until).toLocaleTimeString("fr-FR")}`;
    return s;
  }
  if (action === "ACCESS_DENIED_401") {
    let s = "Session expiree - authentification requise";
    if (d.method && d.path) s += ` | ${d.method} ${d.path}`;
    if (d.ip)               s += ` | IP : ${d.ip}`;
    return s;
  }
  if (action === "ACCESS_DENIED_403") {
    let s = "Acces refuse - permissions insuffisantes";
    if (d.method && d.path) s += ` | ${d.method} ${d.path}`;
    if (d.role)             s += ` | Role : ${d.role}`;
    return s;
  }
  // Fallback
  return Object.entries(d)
    .filter(([k]) => !["doc_code", "timestamp", "ISO_transition"].includes(k))
    .map(([k, v]) => `${k} : ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" | ");
}

// ── Action color map (RGB) ────────────────────────────────────
const ACTION_COLORS = {
  CREATE_DOCUMENT:                    [52, 168, 83],
  STATUS_CHANGE:                      [66, 133, 244],
  NEW_VERSION:                        [251, 188, 4],
  VERSION_SUPERSEDED:                 [255, 143, 0],
  AUTO_ARCHIVE:                       [156, 102, 234],
  VALIDATION_CREATED:                 [0, 172, 193],
  VALIDATION_EDIT_ATTEMPT_BLOCKED:    [234, 67, 53],
  VALIDATION_DELETE_ATTEMPT_BLOCKED:  [234, 67, 53],
};

// ── Resolve the doc_code at the time of the action
// CREATE_DOCUMENT stores the original code (e.g. GU0002_Guide_-) in details.doc_code
// All other actions can derive it from the base code + the version at that moment
function resolveDocRef(row) {
  try {
    const d = typeof row.details === "string" ? JSON.parse(row.details) : (row.details || {});
    // All actions that store doc_code in details use the code at the time of the action
    if (d.doc_code) return d.doc_code;
    // NEW_VERSION stores from/to but not doc_code — reconstruct the "before" code
    if (row.action === "NEW_VERSION" && d.from && row.document_reference) {
      return row.document_reference.replace(/_[^_]+$/, `_${d.from}`);
    }
  } catch {}
  return row.document_reference;
}

// ── Resolve best user label for PDF (user_name → user_role in details → "Système")
function resolveUser(row) {
  if (row.user_name) return row.user_name;
  try {
    const d = typeof row.details === "string" ? JSON.parse(row.details) : (row.details || {});
    if (d.user_name) return d.user_name;
    if (d.user_role && d.user_role !== "SYSTEM") return d.user_role;
  } catch { /* ignore */ }
  return "Systeme";
}

// ── PDF export ────────────────────────────────────────────────
async function exportPDF(logs, meta = {}) {
  const { default: jsPDF }     = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  // Chronological order for PDF: oldest (creation) first
  const sortedLogs = [...logs].reverse();

  const doc    = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W      = doc.internal.pageSize.getWidth();   // 297
  const H      = doc.internal.pageSize.getHeight();  // 210
  const MARGIN = 12;
  const G      = [74, 184, 63]; // brand green

  // ── Load ACTIA logo ────────────────────────────────────────
  const logoEl = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = actiLogo;
  });

  // ══════════════════════════════════════════════
  // HEADER — single dark band (0 → 30mm)
  // ══════════════════════════════════════════════
  const HEADER_H = 30;
  const isFiltered = !!(meta.filterAction || meta.filterUser || meta.filterDocRef || meta.filterFrom || meta.filterTo);

  // Dark navy background
  doc.setFillColor(6, 13, 26);
  doc.rect(0, 0, W, HEADER_H, "F");

  // Left green accent bar
  doc.setFillColor(...G);
  doc.rect(0, 0, 5, HEADER_H, "F");

  // ACTIA logo — right side
  const LH = 16, LW = 50;
  doc.addImage(logoEl, "PNG", W - MARGIN - LW, (HEADER_H - LH) / 2, LW, LH);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text("JOURNAL DES ACTIVITES", MARGIN + 6, 11);

  // Subtitle — bold green
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...G);
  doc.text("SMQ GED  |  Systeme de Gestion Electronique des Documents", MARGIN + 6, 19);

  // Meta line — bold muted blue-gray
  const filterHint = [
    meta.filterDocRef && `Ref : ${meta.filterDocRef}`,
    meta.filterAction && `Action : ${actionLabel(meta.filterAction)}`,
    meta.filterUser   && `Utilisateur : ${meta.filterUser}`,
    meta.filterFrom   && `Du ${meta.filterFrom}`,
    meta.filterTo     && `Au ${meta.filterTo}`,
  ].filter(Boolean).join("  |  ");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 135, 170);
  doc.text(
    `Exporte le ${fmtDate(new Date().toISOString())}  |  ${logs.length} entree${logs.length > 1 ? "s" : ""}${filterHint ? `  |  ${filterHint}` : ""}  |  ${meta.exportedBy || "Admin"}`,
    MARGIN + 6, 26
  );

  // Bottom green line
  doc.setDrawColor(...G);
  doc.setLineWidth(0.7);
  doc.line(0, HEADER_H, W, HEADER_H);

  // ══════════════════════════════════════════════
  // TABLE
  // ══════════════════════════════════════════════

  // Column widths — total usable: 297 - 2*12 = 273mm
  // #(12) + Date(32) + Action(40) + Ref(50) + Titre(40) + User(24) + Details(auto=75)
  const COL_W = { 0: 12, 1: 32, 2: 40, 3: 50, 4: 40, 5: 30 };

  autoTable(doc, {
    startY: HEADER_H + 4,
    margin: { left: MARGIN, right: MARGIN, bottom: 14 },
    rowPageBreak: "auto",
    showHead: "everyPage",

    head: [[
      { content: "#",               styles: { halign: "center" } },
      { content: "Date & Heure",    styles: { halign: "left"   } },
      { content: "Type d'action",   styles: { halign: "left"   } },
      { content: "Ref. document",   styles: { halign: "left"   } },
      { content: "Titre document",  styles: { halign: "left"   } },
      { content: "Utilisateur",     styles: { halign: "left"   } },
      { content: "Details de l'action", styles: { halign: "left" } },
    ]],

    body: sortedLogs.map((r, i) => [
      String(i + 1),
      fmtDate(r.created_at),
      actionLabel(r.action),
      resolveDocRef(r) || "-",
      r.document_title     || "-",
      resolveUser(r),
      formatDetailsText(r.action, r.details) || "-",
    ]),

    // ── Header row style ─────────────────────────────────────
    headStyles: {
      fillColor:   [10, 22, 48],
      textColor:   [74, 184, 63],
      fontStyle:   "bold",
      fontSize:    9,
      cellPadding: { top: 6, bottom: 6, left: 5, right: 4 },
      lineColor:   [74, 184, 63],
      lineWidth:   { bottom: 0.6, top: 0, left: 0, right: 0 },
      overflow:    "ellipsize",
    },

    // ── Body rows ────────────────────────────────────────────
    bodyStyles: {
      fontSize:    8.5,
      fontStyle:   "normal",
      cellPadding: { top: 4.5, bottom: 4.5, left: 5, right: 4 },
      textColor:   [15, 30, 50],
      lineColor:   [210, 222, 238],
      lineWidth:   { bottom: 0.25, top: 0, left: 0, right: 0 },
      overflow:    "linebreak",
      minCellHeight: 10,
    },

    alternateRowStyles: {
      fillColor: [244, 248, 255],
    },

    // ── Per-cell styling ─────────────────────────────────────
    didParseCell(data) {
      if (data.section !== "body") return;

      const row    = sortedLogs[data.row.index];
      const action = row?.action;
      const color  = ACTION_COLORS[action] || [100, 120, 150];

      // # column — dark gray, centered, no wrap
      if (data.column.index === 0) {
        data.cell.styles.textColor  = [100, 120, 145];
        data.cell.styles.halign     = "center";
        data.cell.styles.fontSize   = 8;
        data.cell.styles.fontStyle  = "bold";
        data.cell.styles.overflow   = "hidden";
      }
      // Date column — dark, readable
      if (data.column.index === 1) {
        data.cell.styles.textColor  = [40, 60, 90];
        data.cell.styles.fontSize   = 8;
      }
      // Action column — bold + colored text
      if (data.column.index === 2) {
        data.cell.styles.textColor  = color;
        data.cell.styles.fontStyle  = "bold";
        data.cell.styles.fontSize   = 8.5;
      }
      // Réf. document — bold, dark blue-gray, no wrap
      if (data.column.index === 3) {
        data.cell.styles.textColor  = [30, 60, 110];
        data.cell.styles.fontStyle  = "bold";
        data.cell.styles.fontSize   = 7.5;
        data.cell.styles.overflow   = "ellipsize";
      }
      // Titre document — black bold
      if (data.column.index === 4) {
        data.cell.styles.textColor  = [5, 15, 30];
        data.cell.styles.fontStyle  = "bold";
        data.cell.styles.fontSize   = 8.5;
      }
      // Utilisateur — dark, italic when Système
      if (data.column.index === 5) {
        data.cell.styles.textColor  = [30, 55, 90];
        data.cell.styles.fontSize   = 8;
        data.cell.styles.fontStyle  = row?.user_name ? "bold" : "italic";
      }
      // Détails — dark, bold
      if (data.column.index === 6) {
        data.cell.styles.textColor  = [10, 30, 60];
        data.cell.styles.fontSize   = 8;
        data.cell.styles.fontStyle  = "bold";
      }
    },

    // ── Draw left accent bar on Action cells ─────────────────
    didDrawCell(data) {
      if (data.section === "body" && data.column.index === 2) {
        const action = sortedLogs[data.row.index]?.action;
        const color  = ACTION_COLORS[action] || [160, 175, 195];
        doc.setFillColor(...color);
        doc.rect(data.cell.x, data.cell.y, 2, data.cell.height, "F");
      }
    },

    // ── Page header/footer on every page ─────────────────────
    didDrawPage(data) {
      const pageNum   = data.pageNumber;
      const pageTotal = doc.internal.getNumberOfPages();

      // Re-draw mini header on pages > 1
      if (pageNum > 1) {
        const MH = 13;
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, W, MH, "F");
        doc.setFillColor(...G);
        doc.rect(0, 0, 6, MH, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text("JOURNAL DES ACTIVITES", MARGIN + 8, 6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...G);
        doc.text("SMQ GED  |  ACTIA Engineering Services", MARGIN + 8, 11);
        doc.setDrawColor(...G);
        doc.setLineWidth(1);
        doc.line(0, MH, W, MH);
      }

      // Footer
      const FH = 9;
      doc.setFillColor(15, 23, 42);
      doc.rect(0, H - FH, W, FH, "F");
      doc.setDrawColor(...G);
      doc.setLineWidth(0.8);
      doc.line(0, H - FH, W, H - FH);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("SMQ GED  |  ACTIA Engineering Services", MARGIN, H - 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...G);
      doc.text(`Page ${pageNum} / ${pageTotal}`, W - MARGIN, H - 3, { align: "right" });
    },

    columnStyles: {
      0: { cellWidth: COL_W[0] },
      1: { cellWidth: COL_W[1] },
      2: { cellWidth: COL_W[2] },
      3: { cellWidth: COL_W[3] },
      4: { cellWidth: COL_W[4] },
      5: { cellWidth: COL_W[5] },
      6: { cellWidth: "auto"   },
    },
  });

  doc.save(`journal_activites_${today()}.pdf`);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── STYLES ────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeInUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin      { to { transform: rotate(360deg); } }
  .log-row { transition: background 0.15s; }
  .log-row:hover { background: rgba(255,255,255,0.03) !important; }
  .export-btn { transition: all 0.18s; border: 1.5px solid; cursor: pointer; font-family: inherit; }
  .export-btn:hover { filter: brightness(1.15); }
  .export-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: none; }
  .filter-input {
    background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.85); border-radius: 8px; padding: 7px 12px;
    font-size: 13px; outline: none; font-family: inherit; width: 100%;
    transition: border-color 0.2s;
  }
  .filter-input:focus { border-color: rgba(74,184,63,0.5); }
  .filter-input::placeholder { color: rgba(168,191,212,0.35); }
  .filter-select {
    background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.85); border-radius: 8px; padding: 7px 12px;
    font-size: 13px; outline: none; font-family: inherit;
    transition: border-color 0.2s; appearance: none; cursor: pointer;
  }
  .filter-select:focus { border-color: rgba(74,184,63,0.5); }
  .filter-select option { background: #0d1f30; }
`;

// ════════════════════════════════════════════════════════════
export default function Logs() {
  const { token, userRole, currentUser } = useUser();
  const navigate = useNavigate();

  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterUser,   setFilterUser]   = useState("");
  const [filterDocRef, setFilterDocRef] = useState("");
  const [filterFrom,   setFilterFrom]   = useState("");
  const [filterTo,     setFilterTo]     = useState("");

  const availableActions = DROPDOWN_ACTIONS;

  // Redirect if rôle non autorisé
  useEffect(() => {
    if (userRole && userRole !== "Admin" && userRole !== "Ing. Qualité")
      navigate("/", { replace: true });
  }, [userRole, navigate]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterAction) params.set("action",   filterAction);
      if (filterUser)   params.set("userName", filterUser);
      if (filterDocRef) params.set("docRef",   filterDocRef);
      if (filterFrom)   params.set("from",     filterFrom);
      if (filterTo)     params.set("to",       filterTo);

      const res = await fetch(`${API}/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, filterAction, filterUser, filterDocRef, filterFrom, filterTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleExport = async () => {
    if (logs.length === 0) return;
    await exportPDF(logs, {
      filterAction, filterUser, filterDocRef, filterFrom, filterTo,
      exportedBy: currentUser?.name || "Admin",
    });
  };

  const clearFilters = () => {
    setFilterAction("");
    setFilterUser("");
    setFilterDocRef("");
    setFilterFrom("");
    setFilterTo("");
  };

  const hasFilters = filterAction || filterUser || filterDocRef || filterFrom || filterTo;


  return (
    <div className="flex min-h-screen" style={{ background: "#0a1420", color: "#dce8f5" }}>
      <style>{STYLES}</style>
      <AppSidebar user={currentUser ? { ...currentUser, role: userRole } : null} />

      <main className="flex-1 flex flex-col min-w-0 px-8 py-8 overflow-x-hidden">

        {/* Header */}
        <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-white m-0 leading-tight">Journal des activités</h1>
            <p className="text-sm mt-1 m-0" style={{ color: "rgba(168,191,212,0.5)" }}>
              {userRole === "Admin"
                ? "Tous les événements système — Administration"
                : "Activités documentaires — Ingénieur Qualité"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="export-btn flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold"
              style={{ color: "#f87171", background: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.3)" }}
              onClick={handleExport}
              disabled={logs.length === 0}
            >
              <LuDownload size={13} /> PDF
            </button>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="export-btn flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold"
              style={{ color: "rgba(168,191,212,0.7)", background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
            >
              <LuRefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl p-5 mb-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-3" style={{ color: "rgba(168,191,212,0.5)", fontSize: 12 }}>
            <LuFilter size={12} />
            <span className="font-semibold tracking-wide uppercase text-[10px]">Filtres</span>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>

            {/* Action dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "rgba(168,191,212,0.5)" }}>Type d'action</label>
              <div className="relative">
                <select
                  className="filter-select w-full pr-8"
                  value={filterAction}
                  onChange={e => setFilterAction(e.target.value)}
                >
                  <option value="">Toutes les actions</option>
                  {availableActions.map(a => (
                    <option key={a} value={a}>{actionLabel(a)}</option>
                  ))}
                </select>
                <LuChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(168,191,212,0.4)" }} />
              </div>
            </div>

            {/* User filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "rgba(168,191,212,0.5)" }}>Utilisateur</label>
              <input
                className="filter-input"
                placeholder="Nom ou email…"
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
              />
            </div>

            {/* Document reference filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "rgba(168,191,212,0.5)" }}>Référence document</label>
              <input
                className="filter-input"
                placeholder="Ex : TR0003, FPS-TR…"
                value={filterDocRef}
                onChange={e => setFilterDocRef(e.target.value)}
              />
            </div>

            {/* Date from */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "rgba(168,191,212,0.5)" }}>Du</label>
              <input type="date" className="filter-input" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
            </div>

            {/* Date to */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "rgba(168,191,212,0.5)" }}>Au</label>
              <input type="date" className="filter-input" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
            </div>

          </div>

          {hasFilters && (
            <div className="flex items-center justify-between mt-4 pt-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-xs" style={{ color: "rgba(168,191,212,0.4)" }}>
                {[
                  filterAction  && `Action : "${actionLabel(filterAction)}"`,
                  filterUser    && `Utilisateur : "${filterUser}"`,
                  filterDocRef  && `Réf. : "${filterDocRef}"`,
                  filterFrom    && `Du ${filterFrom}`,
                  filterTo      && `Au ${filterTo}`,
                ].filter(Boolean).join("  ·  ")}
              </span>
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none"
                style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1.5px solid rgba(248,113,113,0.2)" }}>
                <LuX size={11} /> Réinitialiser
              </button>
            </div>
          )}
        </div>

        {/* Count */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-bold" style={{ color: "#4ab83f" }}>{total}</span>
          <span className="text-sm" style={{ color: "rgba(168,191,212,0.45)" }}>
            entrée{total !== 1 ? "s" : ""} {hasFilters ? "filtrée" : "au total"}
            {logs.length < total && ` — affichage des ${logs.length} premières`}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl px-5 py-4 mb-5 text-sm font-semibold"
            style={{ background: "rgba(248,113,113,0.1)", border: "1.5px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
            Erreur : {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl overflow-hidden flex-1"
          style={{ border: "1.5px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>

          {/* Header row */}
          <div className="grid px-5 py-3 text-[10px] font-bold tracking-widest uppercase"
            style={{
              gridTemplateColumns: "48px 145px 155px 210px 115px 1fr",
              color: "rgba(168,191,212,0.4)",
              borderBottom: "1.5px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.15)",
            }}>
            <span>#</span>
            <span>Date</span>
            <span>Action</span>
            <span>Document</span>
            <span>Utilisateur</span>
            <span>Détails action</span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div style={{ width: 32, height: 32, border: "2.5px solid rgba(74,184,63,0.2)", borderTopColor: "#4ab83f", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          )}

          {/* Empty */}
          {!loading && logs.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <LuFileText size={36} style={{ color: "rgba(168,191,212,0.15)" }} />
              <p className="text-sm m-0" style={{ color: "rgba(168,191,212,0.35)" }}>Aucun log trouvé</p>
            </div>
          )}

          {/* Rows */}
          {!loading && logs.map((row, i) => {
            const ac = actionColor(row.action);
            return (
              <div
                key={row.id}
                className="log-row grid px-5 py-3 items-start"
                style={{
                  gridTemplateColumns: "48px 145px 155px 210px 115px 1fr",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  animation: `fadeInUp 0.3s ${Math.min(i * 0.02, 0.3)}s both`,
                }}
              >
                {/* ID */}
                <span className="text-xs tabular-nums pt-1" style={{ color: "rgba(168,191,212,0.3)" }}>
                  {row.id}
                </span>

                {/* Date */}
                <span className="text-xs pt-1" style={{ color: "rgba(168,191,212,0.55)" }}>
                  {fmtDate(row.created_at)}
                </span>

                {/* Action badge */}
                <span className="pt-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-block"
                    style={{ color: ac.color, background: ac.bg, border: `1px solid ${ac.border}` }}>
                    {actionLabel(row.action)}
                  </span>
                </span>

                {/* Document — single line: badge + title inline */}
                <div className="pt-0.5 min-w-0 flex flex-col gap-0.5">
                  {row.document_reference ? (
                    <>
                      <button
                        onClick={() => setFilterDocRef(row.document_reference)}
                        className="no-underline border-none bg-transparent p-0 text-left cursor-pointer"
                        title={`Voir tous les logs de ${resolveDocRef(row)}`}
                      >
                        <span
                          className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md whitespace-nowrap transition-all"
                          style={{ color: "#4ab83f", background: "rgba(74,184,63,0.1)", border: "1px solid rgba(74,184,63,0.25)", display: "inline-block" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(74,184,63,0.2)"; e.currentTarget.style.borderColor = "rgba(74,184,63,0.5)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(74,184,63,0.1)"; e.currentTarget.style.borderColor = "rgba(74,184,63,0.25)"; }}
                        >
                          {resolveDocRef(row)}
                        </span>
                      </button>
                      {row.document_title && (
                        <span className="text-[11px] truncate" style={{ color: "rgba(200,218,235,0.55)" }}
                          title={row.document_title}>
                          {row.document_title}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ color: "rgba(168,191,212,0.2)" }}>—</span>
                  )}
                </div>

                {/* User */}
                <span className="text-xs pt-1" style={{ color: row.user_name ? "rgba(168,191,212,0.65)" : "rgba(168,191,212,0.45)" }}>
                  {resolveUser(row)}
                </span>

                {/* Smart details */}
                <span className="pt-0.5">
                  <ActionDetails action={row.action} details={row.details} />
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
