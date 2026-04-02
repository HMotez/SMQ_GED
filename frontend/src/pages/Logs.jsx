// ============================================================
// pages/Logs.jsx — Consultation et export des logs (Admin)
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import AppSidebar from "../components/AppSidebar";
import { API } from "../config";
import {
  LuRefreshCw, LuDownload, LuFileText, LuFilter, LuX, LuChevronDown,
} from "react-icons/lu";

// ── Known action types ────────────────────────────────────────
const ACTION_OPTIONS = [
  { value: "",                              label: "Toutes les actions" },
  { value: "CREATE_DOCUMENT",              label: "Création document" },
  { value: "NEW_VERSION",                  label: "Nouvelle version" },
  { value: "VERSION_SUPERSEDED",           label: "Version remplacée" },
  { value: "STATUS_CHANGE",                label: "Changement de statut" },
  { value: "AUTO_ARCHIVE",                 label: "Archivage automatique" },
  { value: "VALIDATION_CREATED",           label: "Validation créée" },
  { value: "VALIDATION_EDIT_ATTEMPT_BLOCKED",   label: "Modification validation bloquée" },
  { value: "VALIDATION_DELETE_ATTEMPT_BLOCKED", label: "Suppression validation bloquée" },
];

// ── Helpers ──────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function actionLabel(action) {
  const found = ACTION_OPTIONS.find(o => o.value === action);
  return found ? found.label : action;
}

function actionColor(action) {
  if (action?.includes("CREATE"))     return { color: "#4ab83f", bg: "rgba(74,184,63,0.12)",   border: "rgba(74,184,63,0.25)"   };
  if (action?.includes("STATUS"))     return { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.25)"  };
  if (action?.includes("VERSION"))    return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)"  };
  if (action?.includes("ARCHIVE"))    return { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" };
  if (action?.includes("VALIDATION")) return { color: "#2dd4bf", bg: "rgba(45,212,191,0.12)",  border: "rgba(45,212,191,0.25)"  };
  if (action?.includes("BLOCKED"))    return { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" };
  return { color: "#a8bfd4", bg: "rgba(168,191,212,0.08)", border: "rgba(168,191,212,0.15)" };
}

// ── Smart details renderer ────────────────────────────────────
function ActionDetails({ action, details }) {
  if (!details) return <span style={{ color: "rgba(168,191,212,0.25)" }}>—</span>;
  const d = typeof details === "string" ? JSON.parse(details) : details;

  // STATUS_CHANGE: from → to
  if (action === "STATUS_CHANGE") {
    return (
      <span className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 flex-wrap">
          <StatusPill label={d.from} />
          <span style={{ color: "rgba(168,191,212,0.35)", fontSize: 10 }}>→</span>
          <StatusPill label={d.to} />
        </span>
        {d.user_role && (
          <span className="text-[10px]" style={{ color: "rgba(168,191,212,0.35)" }}>
            Rôle : {d.user_role}
          </span>
        )}
      </span>
    );
  }

  // NEW_VERSION: vX → vY + résumé
  if (action === "NEW_VERSION") {
    return (
      <span className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <VersionPill v={d.from || "—"} />
          <span style={{ color: "rgba(168,191,212,0.35)", fontSize: 10 }}>→</span>
          <VersionPill v={d.to || "—"} />
        </span>
        {d.change_summary && (
          <span className="text-[10px] italic" style={{ color: "rgba(168,191,212,0.5)" }}>
            {d.change_summary}
          </span>
        )}
      </span>
    );
  }

  // VERSION_SUPERSEDED
  if (action === "VERSION_SUPERSEDED") {
    return (
      <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(245,158,11,0.8)" }}>
        Version remplacée : <VersionPill v={d.superseded_version || "—"} />
      </span>
    );
  }

  // CREATE_DOCUMENT
  if (action === "CREATE_DOCUMENT") {
    return (
      <span className="flex flex-col gap-0.5 text-[11px]">
        {d.typeCode && <span><Tag color="#4ab83f">{d.typeCode}</Tag></span>}
        {d.origin   && <span style={{ color: "rgba(168,191,212,0.45)" }}>Origine : {d.origin}</span>}
        {d.folderCode && <span style={{ color: "rgba(168,191,212,0.45)" }}>Dossier : {d.folderCode}</span>}
      </span>
    );
  }

  // AUTO_ARCHIVE
  if (action === "AUTO_ARCHIVE") {
    return (
      <span className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <StatusPill label={d.from} />
          <span style={{ color: "rgba(168,191,212,0.35)", fontSize: 10 }}>→</span>
          <StatusPill label={d.to} />
        </span>
        {d.reason && (
          <span className="text-[10px] italic" style={{ color: "rgba(167,139,250,0.6)" }}>
            {d.reason}
          </span>
        )}
      </span>
    );
  }

  // VALIDATION_CREATED
  if (action === "VALIDATION_CREATED") {
    const decisionColor = d.decision === "APPROUVÉ" ? "#4ab83f"
      : d.decision === "REJETÉ" ? "#f87171"
      : "#f59e0b";
    return (
      <span className="flex flex-col gap-0.5 text-[11px]">
        {d.decision && (
          <span className="font-bold" style={{ color: decisionColor }}>{d.decision}</span>
        )}
        {d.validator_name && (
          <span style={{ color: "rgba(168,191,212,0.5)" }}>Validateur : {d.validator_name}</span>
        )}
        {d.comment && (
          <span className="italic" style={{ color: "rgba(168,191,212,0.45)" }}>"{d.comment}"</span>
        )}
      </span>
    );
  }

  // BLOCKED actions
  if (action?.includes("BLOCKED")) {
    return (
      <span className="text-[11px]" style={{ color: "#f87171" }}>
        Tentative bloquée — opération non autorisée
      </span>
    );
  }

  // Fallback: show key: value pairs
  return (
    <span className="flex flex-col gap-0.5 text-[10.5px]" style={{ color: "rgba(168,191,212,0.5)" }}>
      {Object.entries(d).slice(0, 4).map(([k, v]) => (
        <span key={k}>
          <span style={{ color: "rgba(168,191,212,0.35)" }}>{k}: </span>
          {typeof v === "object" ? JSON.stringify(v) : String(v)}
        </span>
      ))}
    </span>
  );
}

function StatusPill({ label }) {
  if (!label) return null;
  const colors = {
    "Brouillon":     "#a8bfd4",
    "En rédaction":  "#60a5fa",
    "En validation": "#f59e0b",
    "Validé":        "#4ab83f",
    "Diffusé":       "#2dd4bf",
    "En révision":   "#f87171",
    "Obsolète":      "#a78bfa",
    "Archivé":       "#6b7280",
  };
  const c = colors[label] || "#a8bfd4";
  return (
    <span className="text-[10px] font-semibold px-1.5 py-px rounded-full"
      style={{ color: c, background: `${c}18`, border: `1px solid ${c}30` }}>
      {label}
    </span>
  );
}

function VersionPill({ v }) {
  return (
    <span className="text-[10px] font-bold font-mono px-1.5 py-px rounded"
      style={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
      {v}
    </span>
  );
}

function Tag({ color, children }) {
  return (
    <span className="text-[10px] font-bold px-1.5 py-px rounded"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

// ── Format details as readable text for CSV ───────────────────
function formatDetailsText(action, details) {
  if (!details) return "";
  const d = typeof details === "string" ? JSON.parse(details) : details;

  if (action === "STATUS_CHANGE") {
    const parts = [`${d.from || "?"} >> ${d.to || "?"}`];
    if (d.user_role) parts.push(`Role: ${d.user_role}`);
    return parts.join(" | ");
  }
  if (action === "NEW_VERSION") {
    const parts = [`v${d.from || "?"} >> v${d.to || "?"}`];
    if (d.change_summary) parts.push(`Resume: ${d.change_summary}`);
    return parts.join(" | ");
  }
  if (action === "VERSION_SUPERSEDED") {
    return `Version remplacee: ${d.superseded_version || "?"}`;
  }
  if (action === "CREATE_DOCUMENT") {
    const parts = [];
    if (d.typeCode)    parts.push(`Type: ${d.typeCode}`);
    if (d.origin)      parts.push(`Origine: ${d.origin}`);
    if (d.folderCode)  parts.push(`Dossier: ${d.folderCode}`);
    return parts.join(" | ");
  }
  if (action === "AUTO_ARCHIVE") {
    const parts = [`${d.from || "?"} >> ${d.to || "?"}`];
    if (d.reason) parts.push(d.reason);
    return parts.join(" | ");
  }
  if (action === "VALIDATION_CREATED") {
    const parts = [];
    if (d.decision)       parts.push(`Décision: ${d.decision}`);
    if (d.validator_name) parts.push(`Validateur: ${d.validator_name}`);
    if (d.comment)        parts.push(`Commentaire: ${d.comment}`);
    return parts.join(" | ");
  }
  if (action?.includes("BLOCKED")) {
    return "Tentative bloquée — opération non autorisée";
  }
  // Fallback: flatten key: value
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
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

// ── PDF export ────────────────────────────────────────────────
async function exportPDF(logs) {
  const { default: jsPDF }     = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc  = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W    = doc.internal.pageSize.getWidth();   // 297
  const H    = doc.internal.pageSize.getHeight();  // 210
  const MARGIN = 12;

  // ══════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════

  // Dark background
  doc.setFillColor(8, 18, 36);
  doc.rect(0, 0, W, 32, "F");

  // Green left accent bar
  doc.setFillColor(74, 184, 63);
  doc.rect(0, 0, 4, 32, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Journal des Activités", MARGIN + 4, 12);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(74, 184, 63);
  doc.text("SMQ GED — Système de Gestion Électronique des Documents", MARGIN + 4, 19);

  // Date + count badge (right side)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 190, 215);
  doc.text(`Exporté le : ${fmtDate(new Date().toISOString())}`, W - MARGIN, 12, { align: "right" });

  // Count pill
  doc.setFillColor(74, 184, 63);
  doc.roundedRect(W - MARGIN - 38, 17, 38, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`${logs.length} entrée${logs.length > 1 ? "s" : ""}`, W - MARGIN - 19, 23, { align: "center" });

  // Green separator line
  doc.setDrawColor(74, 184, 63);
  doc.setLineWidth(0.6);
  doc.line(0, 32, W, 32);

  // ══════════════════════════════════════════════
  // TABLE
  // ══════════════════════════════════════════════

  // Column widths — total usable: 297 - 2*12 = 273mm
  // #(14) + Date(34) + Action(42) + Réf(32) + Titre(52) + User(26) + Détails(auto≈73)
  const COL_W = { 0: 14, 1: 34, 2: 42, 3: 32, 4: 52, 5: 26 };

  autoTable(doc, {
    startY: 36,
    margin: { left: MARGIN, right: MARGIN, bottom: 16 },
    rowPageBreak: "auto",
    showHead: "everyPage",

    head: [[
      { content: "#",               styles: { halign: "center" } },
      { content: "Date & Heure",    styles: { halign: "left"   } },
      { content: "Type d'action",   styles: { halign: "left"   } },
      { content: "Réf. document",   styles: { halign: "left"   } },
      { content: "Titre document",  styles: { halign: "left"   } },
      { content: "Utilisateur",     styles: { halign: "left"   } },
      { content: "Détails de l'action", styles: { halign: "left" } },
    ]],

    body: logs.map(r => [
      String(r.id),
      fmtDate(r.created_at),
      actionLabel(r.action),
      r.document_reference || "—",
      r.document_title     || "—",
      r.user_name          || "Système",
      formatDetailsText(r.action, r.details) || "—",
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

      const row    = logs[data.row.index];
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
      // Réf. document — bold, dark blue-gray
      if (data.column.index === 3) {
        data.cell.styles.textColor  = [30, 60, 110];
        data.cell.styles.fontStyle  = "bold";
        data.cell.styles.fontSize   = 7.5;
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
        const action = logs[data.row.index]?.action;
        const color  = ACTION_COLORS[action] || [160, 175, 195];
        doc.setFillColor(...color);
        doc.rect(data.cell.x, data.cell.y, 2, data.cell.height, "F");
      }
    },

    // ── Page header/footer on every page ─────────────────────
    didDrawPage(data) {
      const pageNum   = data.pageNumber;
      const pageTotal = doc.internal.getNumberOfPages();

      // Re-draw header on pages > 1
      if (pageNum > 1) {
        doc.setFillColor(8, 18, 36);
        doc.rect(0, 0, W, 14, "F");
        doc.setFillColor(74, 184, 63);
        doc.rect(0, 0, 4, 14, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("Journal des Activités — SMQ GED", MARGIN + 4, 9);
        doc.setDrawColor(74, 184, 63);
        doc.setLineWidth(0.4);
        doc.line(0, 14, W, 14);
      }

      // Footer band
      doc.setFillColor(240, 244, 250);
      doc.rect(0, H - 12, W, 12, "F");
      doc.setDrawColor(74, 184, 63);
      doc.setLineWidth(0.3);
      doc.line(0, H - 12, W, H - 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 120, 155);
      doc.text(
        `SMQ GED — Journal des activités  ·  Exporté le ${fmtDate(new Date().toISOString())}`,
        MARGIN, H - 5
      );
      doc.setFont("helvetica", "bold");
      doc.setTextColor(74, 184, 63);
      doc.text(`Page ${pageNum} / ${pageTotal}`, W - MARGIN, H - 5, { align: "right" });
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
  const [filterFrom,   setFilterFrom]   = useState("");
  const [filterTo,     setFilterTo]     = useState("");


  // Redirect non-admin
  useEffect(() => {
    if (userRole && userRole !== "Admin") navigate("/", { replace: true });
  }, [userRole, navigate]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterAction) params.set("action",   filterAction);
      if (filterUser)   params.set("userName", filterUser);
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
  }, [token, filterAction, filterUser, filterFrom, filterTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleExport = async () => {
    if (logs.length === 0) return;
    await exportPDF(logs);
  };

  const clearFilters = () => {
    setFilterAction("");
    setFilterUser("");
    setFilterFrom("");
    setFilterTo("");
  };

  const hasFilters = filterAction || filterUser || filterFrom || filterTo;


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
              Consultation et export des logs système — Admin uniquement
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
                  {ACTION_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
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
                  filterAction && `Action : "${actionLabel(filterAction)}"`,
                  filterUser   && `Utilisateur : "${filterUser}"`,
                  filterFrom   && `Du ${filterFrom}`,
                  filterTo     && `Au ${filterTo}`,
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
              gridTemplateColumns: "52px 148px 160px 1fr 140px 1fr",
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
                  gridTemplateColumns: "52px 148px 160px 1fr 140px 1fr",
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

                {/* Document */}
                <span className="pt-1">
                  {row.document_title ? (
                    <span className="flex flex-col gap-px">
                      <span className="text-[11px] font-bold font-mono" style={{ color: "rgba(168,191,212,0.4)" }}>
                        {row.document_reference}
                      </span>
                      <span className="text-xs" style={{ color: "rgba(220,235,248,0.75)" }}>
                        {row.document_title}
                      </span>
                    </span>
                  ) : (
                    <span style={{ color: "rgba(168,191,212,0.2)" }}>—</span>
                  )}
                </span>

                {/* User */}
                <span className="text-xs pt-1" style={{ color: "rgba(168,191,212,0.65)" }}>
                  {row.user_name || (
                    <span className="italic" style={{ color: "rgba(168,191,212,0.25)" }}>Système</span>
                  )}
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
