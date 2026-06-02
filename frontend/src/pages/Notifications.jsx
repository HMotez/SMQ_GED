// ============================================================
// pages/Notifications.jsx — Sprint 5
// RÔLE : Centre de notifications personnel de l'utilisateur.
//        Affiche toutes les notifications reçues groupées par type :
//          - validation  : document soumis/approuvé/rejeté
//          - expiration  : date de révision dépassée
//          - version     : nouvelle version uploadée
//          - inactivite  : document sans activité depuis longtemps
//          - designation : désigné comme relecteur/validateur
//        Cliquer sur une notification ouvre le détail du document.
//        Permet de marquer comme lu individuellement ou tout à la fois.
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import AppSidebar from "../components/AppSidebar";
import {
  LuBell, LuCheckCheck, LuClock, LuRefreshCw,
  LuClipboardCheck, LuFileWarning, LuFilePlus, LuArchive,
  LuCircleCheckBig, LuCircleAlert,
  LuX, LuCalendar, LuFolder, LuTag, LuUser,
  LuFileText, LuLayers, LuHistory, LuShieldCheck, LuTriangleAlert, LuEye,
} from "react-icons/lu";

import { API } from "../config";

/* ── Config par type ─────────────────────────────────────── */
const TYPE_CFG = {
  validation: {
    color:  "#4ade80",
    bg:     "rgba(74,222,128,0.1)",
    border: "rgba(74,222,128,0.25)",
    Icon:   LuClipboardCheck,
    label:  "Validation",
  },
  expiration: {
    color:  "#f87171",
    bg:     "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.25)",
    Icon:   LuFileWarning,
    label:  "Expiration",
  },
  version: {
    color:  "#60a5fa",
    bg:     "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.25)",
    Icon:   LuFilePlus,
    label:  "Nouvelle version",
  },
  inactivite: {
    color:  "#fbbf24",
    bg:     "rgba(251,191,36,0.1)",
    border: "rgba(251,191,36,0.25)",
    Icon:   LuArchive,
    label:  "Inactivité",
  },
  designation: {
    color:  "#a78bfa",
    bg:     "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.25)",
    Icon:   LuEye,
    label:  "Désignation",
  },
};

const STATUS_STYLE = {
  "Brouillon":     { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.28)" },
  "En rédaction":  { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.28)"  },
  "En validation": { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.28)"  },
  "Validé":        { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.28)"  },
  "Diffusé":       { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.28)" },
  "Obsolète":      { color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.28)"  },
  "Archivé":       { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.28)" },
};

const FILTER_TABS = [
  { key: "all",        label: "Toutes"     },
  { key: "unread",     label: "Non lues"   },
  { key: "validation", label: "Validation" },
  { key: "expiration", label: "Expiration" },
  { key: "version",    label: "Version"    },
  { key: "inactivite", label: "Inactivité" },
];

const FILTER_TABS_REVIEWER = [
  { key: "all",         label: "Toutes"      },
  { key: "unread",      label: "Non lues"    },
  { key: "validation",  label: "Validation"  },
  { key: "designation", label: "Désignation" },
];

function filterForReviewer(notifications) {
  const seen = new Set();
  return notifications.filter(n => {
    if (n.type === "designation") return true;
    if (n.type === "validation" && n.doc_status === "En validation") {
      // One notification per document (latest first — API returns DESC)
      if (seen.has(n.document_id)) return false;
      seen.add(n.document_id);
      return true;
    }
    return false;
  });
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Il y a ${d}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function fmtDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
}

/* ── Toast ───────────────────────────────────────────────── */
function Toast({ msg, type }) {
  if (!msg) return null;
  const ok = type === "success";
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl"
      style={{
        background:     ok ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
        borderColor:    ok ? "rgba(74,222,128,0.3)"  : "rgba(248,113,113,0.3)",
        backdropFilter: "blur(16px)",
        maxWidth: 380,
        fontFamily: "'Inter',-apple-system,sans-serif",
      }}>
      {ok
        ? <LuCircleCheckBig size={16} style={{ color:"#4ade80", flexShrink:0 }} />
        : <LuCircleAlert    size={16} style={{ color:"#f87171", flexShrink:0 }} />}
      <span className="text-[13px] font-semibold" style={{ color: ok ? "#4ade80" : "#f87171" }}>{msg}</span>
    </div>
  );
}

/* ── InfoRow helper ──────────────────────────────────────── */
function InfoRow({ Icon, label, value, valueStyle }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Icon size={12} style={{ color: "var(--ged-tx2)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
          style={{ color: "var(--ged-tx3)" }}>{label}</div>
        <div className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.82)", ...valueStyle }}>
          {value}
        </div>
      </div>
    </div>
  );
}

/* ── Document Detail Modal ───────────────────────────────── */
function DocumentModal({ doc, loading, onClose }) {
  if (!doc && !loading) return null;

  const statusStyle = doc ? (STATUS_STYLE[doc.status_name] || STATUS_STYLE["Brouillon"]) : null;
  const isOverdue   = doc?.next_review_date && new Date(doc.next_review_date) < new Date();

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.3)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background:    "linear-gradient(160deg,rgba(18,32,58,0.96) 0%,rgba(12,22,40,0.96) 100%)",
          border:        "1px solid rgba(255,255,255,0.14)",
          boxShadow:     "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)",
          fontFamily:    "'Inter',-apple-system,sans-serif",
        }}
      >
        {/* ── Close button ── */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer z-10"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid var(--ged-border-md)" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.15)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
        >
          <LuX size={14} style={{ color: "var(--ged-tx2)" }} />
        </button>

        {/* ── Loading state ── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span style={{ width: 28, height: 28, border: "2.5px solid rgba(255,255,255,0.1)", borderTopColor: "#4ab83f", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {doc && !loading && (
          <>
            {/* ── Modal header ── */}
            <div className="px-6 pt-6 pb-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {/* Status badge */}
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: statusStyle.bg, color: statusStyle.color, border: `1.5px solid ${statusStyle.border}` }}>
                  {doc.status_name}
                </span>
                {/* Version badge */}
                {doc.current_version && doc.current_version !== "-" && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1.5px solid rgba(96,165,250,0.25)" }}>
                    {doc.current_version}
                  </span>
                )}
                {/* Overdue warning */}
                {isOverdue && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
                    style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1.5px solid rgba(248,113,113,0.25)" }}>
                    <LuFileWarning size={10} /> En retard
                  </span>
                )}
              </div>

              <p className="text-[11px] font-bold tracking-widest uppercase m-0 mb-1"
                style={{ color: "#4ab83f" }}>{doc.doc_code}</p>
              <h2 className="text-[18px] font-black text-white m-0 pr-8 leading-snug">
                {doc.title}
              </h2>
            </div>

            {/* ── Modal body ── */}
            <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <InfoRow Icon={LuTag}         label="Type"           value={doc.type_label || doc.type_code} />
                <InfoRow Icon={LuFolder}      label="Dossier"        value={doc.folder_name} />
                <InfoRow Icon={LuLayers}      label="Version actuelle" value={doc.current_version && doc.current_version !== "-" ? `Version ${doc.current_version}` : doc.current_version === "-" ? "Initiale" : "Aucune"} />
                <InfoRow Icon={LuUser}        label="Créé par"       value={doc.created_by_name} />
                <InfoRow Icon={LuCalendar}    label="Date de création" value={fmtDate(doc.created_at)} />
                <InfoRow Icon={LuHistory}     label="Dernière modification" value={fmtDate(doc.updated_at)} />
                <InfoRow
                  Icon={LuCalendar}
                  label="Date de révision"
                  value={doc.next_review_date ? fmtDate(doc.next_review_date) : "—"}
                  valueStyle={isOverdue ? { color: "#f87171" } : {}}
                />
                <InfoRow Icon={LuFileText}    label="Fichier"        value={doc.file_name} />
                <InfoRow Icon={LuShieldCheck} label="Taille"         value={fmtSize(doc.file_size)} />
              </div>

              {/* Process chain */}
              {(doc.strategic_process || doc.main_process || doc.sub_process) && (
                <div className="rounded-xl p-4"
                  style={{ background: "var(--ged-header)", border: "1px solid var(--ged-border-sm)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3 m-0"
                    style={{ color: "var(--ged-tx3)" }}>Processus</p>
                  <div className="flex items-center gap-2 flex-wrap text-[12px]"
                    style={{ color: "rgba(255,255,255,0.7)" }}>
                    {doc.strategic_process && (
                      <span className="px-2 py-1 rounded-md"
                        style={{ background: "rgba(74,184,63,0.1)", color: "#4ab83f", border: "1px solid rgba(74,184,63,0.2)" }}>
                        {doc.strategic_process}
                      </span>
                    )}
                    {doc.main_process && (
                      <>
                        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
                        <span className="px-2 py-1 rounded-md"
                          style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}>
                          {doc.main_process}
                        </span>
                      </>
                    )}
                    {doc.sub_process && (
                      <>
                        <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
                        <span className="px-2 py-1 rounded-md"
                          style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}>
                          {doc.sub_process}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {doc.description && (
                <div className="rounded-xl p-4"
                  style={{ background: "var(--ged-header)", border: "1px solid var(--ged-border-sm)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2 m-0"
                    style={{ color: "var(--ged-tx3)" }}>Description</p>
                  <p className="text-[13px] leading-relaxed m-0"
                    style={{ color: "rgba(255,255,255,0.65)" }}>
                    {doc.description}
                  </p>
                </div>
              )}
            </div>

            {/* ── Modal footer ── */}
            <div className="px-6 py-4 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", color: "var(--ged-tx2)", border: "1px solid rgba(255,255,255,0.09)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function Notifications() {
  const { currentUser, token, logout } = useUser();
  const navigate   = useNavigate();
  const userRole  = currentUser?.role;
  const isReviewer = userRole === "Reviewer";

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [filter,        setFilter]        = useState("all");
  const [toast,         setToast]         = useState({ msg: "", type: "" });
  const [triggerLoading, setTriggerLoading] = useState(false);

  // Expired documents section (Admin / Ing. Qualité)
  const [expiredDocs,      setExpiredDocs]      = useState([]);
  const [loadingExpired,   setLoadingExpired]   = useState(true);
  const [expiredExpanded,  setExpiredExpanded]  = useState(true);

  // Documents en validation section (Reviewer)
  const [validationDocs,     setValidationDocs]     = useState([]);
  const [loadingValidation,  setLoadingValidation]  = useState(false);
  const [validationExpanded, setValidationExpanded] = useState(true);

  // Document modal state
  const [selectedDoc,  setSelectedDoc]  = useState(null);
  const [loadingDoc,   setLoadingDoc]   = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  /* ── Fetch notifications ────────────────────────────────── */
  const fetchNotifications = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      showToast("Impossible de charger les notifications.", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  /* ── Fetch expired documents ────────────────────────────── */
  const fetchExpiredDocs = useCallback(async () => {
    setLoadingExpired(true);
    try {
      const res = await fetch(`${API}/documents?overdue=true&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExpiredDocs(Array.isArray(data) ? data : (data.data || []));
    } catch {
      setExpiredDocs([]);
    } finally {
      setLoadingExpired(false);
    }
  }, [token]);

  useEffect(() => { fetchExpiredDocs(); }, [fetchExpiredDocs]);

  /* ── Fetch documents en validation (Reviewer only) ──────── */
  const fetchValidationDocs = useCallback(async () => {
    if (!isReviewer) return;
    setLoadingValidation(true);
    try {
      const res = await fetch(`${API}/documents?statusName=En%20validation&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setValidationDocs(Array.isArray(data) ? data : (data.data || []));
    } catch {
      setValidationDocs([]);
    } finally {
      setLoadingValidation(false);
    }
  }, [token, isReviewer]);

  useEffect(() => { fetchValidationDocs(); }, [fetchValidationDocs]);

  /* ── Trigger expiration job (Admin only) ────────────────── */
  const triggerExpirationJob = async () => {
    setTriggerLoading(true);
    try {
      const res = await fetch(`${API}/notifications/trigger-expiration`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Job exécuté. Notifications générées.", "success");
        setTimeout(() => { fetchNotifications(); fetchExpiredDocs(); }, 800);
      } else {
        showToast(data.error || "Erreur lors de l'exécution.", "error");
      }
    } catch {
      showToast("Impossible de contacter le serveur.", "error");
    } finally {
      setTriggerLoading(false);
    }
  };

  /* ── Open document modal ────────────────────────────────── */
  const openDocModal = async (docId) => {
    setSelectedDoc(null);
    setLoadingDoc(true);
    try {
      const res = await fetch(`${API}/documents/${docId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      setSelectedDoc(await res.json());
    } catch {
      showToast("Impossible de charger les détails du document.", "error");
    } finally {
      setLoadingDoc(false);
    }
  };

  /* ── Row click: mark read + open modal ──────────────────── */
  const handleRowClick = (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.document_id) openDocModal(n.document_id);
  };

  /* ── Mark single as read ────────────────────────────────── */
  const markRead = async (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
  };

  /* ── Mark all as read ───────────────────────────────────── */
  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Toutes les notifications marquées comme lues.");
    } catch {
      showToast("Erreur lors de la mise à jour.", "error");
    }
  };

  /* ── Base list (filtered by role for Reviewer) ─────────── */
  const baseNotifications = isReviewer
    ? filterForReviewer(notifications)
    : notifications;

  /* ── Filtered list ──────────────────────────────────────── */
  const filtered = baseNotifications.filter(n => {
    if (filter === "all")    return true;
    if (filter === "unread") return !n.is_read;
    return n.type === filter;
  });

  const unreadTotal = baseNotifications.filter(n => !n.is_read).length;

  const filterTabs = isReviewer ? FILTER_TABS_REVIEWER : FILTER_TABS;

  const tabCount = (key) => {
    if (key === "all")    return baseNotifications.length;
    if (key === "unread") return unreadTotal;
    return baseNotifications.filter(n => n.type === key).length;
  };

  return (
    <div className="flex min-h-screen"
      style={{ background: "transparent", fontFamily: "'Inter',-apple-system,sans-serif" }}>

      <AppSidebar user={currentUser} onLogout={logout} />

      <main className="flex-1 min-w-0 p-6 overflow-y-auto">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"linear-gradient(135deg,rgba(74,184,63,0.18),rgba(74,184,63,0.08))", border:"1.5px solid rgba(74,184,63,0.3)", boxShadow:"0 4px 14px rgba(74,184,63,0.15)" }}>
              <LuBell size={19} style={{ color: "#4ab83f" }} />
            </div>
            <div>
              <h1 className="m-0 font-extrabold" style={{ fontSize:21, letterSpacing:"-0.022em", lineHeight:1.2, color:"var(--ged-tx1)" }}>
                Notifications
              </h1>
              <p className="m-0 text-[12px] mt-0.5" style={{ color: "rgba(168,191,212,0.48)" }}>
                Alertes automatiques du système documentaire
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userRole === "Admin" && (
              <button
                onClick={triggerExpirationJob}
                disabled={triggerLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border cursor-pointer"
                style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
                <LuFileWarning size={13} className={triggerLoading ? "animate-spin" : ""} />
                {triggerLoading ? "Exécution…" : "Tester expiration"}
              </button>
            )}
            <button
              onClick={() => { fetchNotifications(); fetchExpiredDocs(); fetchValidationDocs(); }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border cursor-pointer"
              style={{ background: "rgba(255,255,255,0.05)", color: "var(--ged-tx2)", border: "1px solid var(--ged-border-md)" }}>
              <LuRefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Actualiser
            </button>
            {unreadTotal > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border cursor-pointer"
                style={{ background: "rgba(74,184,63,0.1)", color: "#4ab83f", border: "1px solid rgba(74,184,63,0.25)" }}>
                <LuCheckCheck size={13} />
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* ── Stats strip ────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {(isReviewer ? [
            { label: "Total",        value: baseNotifications.length,                                           color: "#60a5fa" },
            { label: "Non lues",     value: unreadTotal,                                                        color: "#f87171", highlight: unreadTotal > 0 },
            { label: "Validation",   value: baseNotifications.filter(n => n.type === "validation").length,      color: "#4ade80" },
            { label: "Désignation",  value: baseNotifications.filter(n => n.type === "designation").length,     color: "#a78bfa" },
          ] : [
            { label: "Total",      value: baseNotifications.length,                                             color: "#60a5fa" },
            { label: "Non lues",   value: unreadTotal,                                                          color: "#f87171", highlight: unreadTotal > 0 },
            { label: "Validation", value: baseNotifications.filter(n => n.type === "validation").length,        color: "#4ade80" },
            { label: "Expiration", value: baseNotifications.filter(n => n.type === "expiration").length,        color: "#fbbf24" },
          ]).map(stat => (
            <div key={stat.label} className="px-4 py-3 rounded-xl border"
              style={{
                background:  stat.highlight ? "rgba(248,113,113,0.07)" : "var(--ged-card)",
                borderColor: stat.highlight ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.07)",
              }}>
              <div className="text-[22px] font-black tabular-nums" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--ged-tx2)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Documents en validation (Reviewer) ─────────── */}
        {isReviewer && (
          <div className="mb-5 rounded-2xl overflow-hidden border"
            style={{ border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.03)" }}>
            <button
              className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer"
              style={{ background: "transparent" }}
              onClick={() => setValidationExpanded(v => !v)}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
                  <LuClipboardCheck size={14} style={{ color: "#fbbf24" }} />
                </div>
                <span className="text-[13px] font-bold" style={{ color: "#fbbf24" }}>
                  Documents en attente de validation
                </span>
                {!loadingValidation && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
                    {validationDocs.length}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold" style={{ color: "rgba(251,191,36,0.5)" }}>
                {validationExpanded ? "Réduire ▲" : "Afficher ▼"}
              </span>
            </button>

            {validationExpanded && (
              loadingValidation ? (
                <div className="flex items-center justify-center py-8">
                  <span style={{ width: 22, height: 22, border: "2px solid rgba(251,191,36,0.15)", borderTopColor: "#fbbf24", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                </div>
              ) : validationDocs.length === 0 ? (
                <div className="flex items-center justify-center py-8 gap-2"
                  style={{ borderTop: "1px solid rgba(251,191,36,0.1)" }}>
                  <LuCircleCheckBig size={16} style={{ color: "rgba(74,222,128,0.5)" }} />
                  <p className="text-[13px] font-semibold m-0" style={{ color: "var(--ged-tx3)" }}>
                    Aucun document en attente
                  </p>
                </div>
              ) : (
                <div style={{ borderTop: "1px solid rgba(251,191,36,0.1)" }}>
                  {validationDocs.map((doc, idx) => {
                    const daysWaiting = doc.updated_at
                      ? Math.floor((Date.now() - new Date(doc.updated_at).getTime()) / 86400000)
                      : null;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => navigate("/validations")}
                        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors duration-150"
                        style={{ borderBottom: idx < validationDocs.length - 1 ? "1px solid rgba(251,191,36,0.07)" : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(251,191,36,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                          <LuClipboardCheck size={14} style={{ color: "#fbbf24" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-[12px] font-bold" style={{ color: "#fbbf24" }}>{doc.doc_code}</span>
                            <span className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{doc.title}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ged-tx2)" }}>
                              <LuCalendar size={10} /> Soumis le : {fmtDate(doc.updated_at)}
                            </span>
                            {doc.responsible && (
                              <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ged-tx3)" }}>
                                <LuUser size={10} /> {doc.responsible}
                              </span>
                            )}
                          </div>
                        </div>
                        {daysWaiting !== null && daysWaiting > 0 && (
                          <span className="text-[11px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
                            style={{ background: daysWaiting > 3 ? "rgba(248,113,113,0.15)" : "rgba(251,191,36,0.15)", color: daysWaiting > 3 ? "#f87171" : "#fbbf24", border: `1px solid ${daysWaiting > 3 ? "rgba(248,113,113,0.25)" : "rgba(251,191,36,0.25)"}` }}>
                            {daysWaiting}j
                          </span>
                        )}
                        <span className="text-[11px] flex-shrink-0" style={{ color: "rgba(251,191,36,0.4)" }}>→</span>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}

        {/* ── Documents expirés (Admin / Ing. Qualité) ───────── */}
        {!isReviewer && (
          <div className="mb-5 rounded-2xl overflow-hidden border"
            style={{ border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.04)" }}>
            <button
              className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer"
              style={{ background: "transparent" }}
              onClick={() => setExpiredExpanded(v => !v)}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)" }}>
                  <LuTriangleAlert size={14} style={{ color: "#f87171" }} />
                </div>
                <span className="text-[13px] font-bold" style={{ color: "#f87171" }}>
                  Documents expirés
                </span>
                {!loadingExpired && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" }}>
                    {expiredDocs.length}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold" style={{ color: "rgba(248,113,113,0.5)" }}>
                {expiredExpanded ? "Réduire ▲" : "Afficher ▼"}
              </span>
            </button>

            {expiredExpanded && (
              loadingExpired ? (
                <div className="flex items-center justify-center py-8">
                  <span style={{ width: 22, height: 22, border: "2px solid rgba(248,113,113,0.15)", borderTopColor: "#f87171", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                </div>
              ) : expiredDocs.length === 0 ? (
                <div className="flex items-center justify-center py-8 gap-2"
                  style={{ borderTop: "1px solid rgba(248,113,113,0.1)" }}>
                  <LuCircleCheckBig size={16} style={{ color: "rgba(74,222,128,0.5)" }} />
                  <p className="text-[13px] font-semibold m-0" style={{ color: "var(--ged-tx3)" }}>
                    Aucun document expiré
                  </p>
                </div>
              ) : (
                <div style={{ borderTop: "1px solid rgba(248,113,113,0.1)" }}>
                  {expiredDocs.map((doc, idx) => {
                    const daysOverdue = doc.next_review_date
                      ? Math.floor((Date.now() - new Date(doc.next_review_date).getTime()) / 86400000)
                      : null;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => openDocModal(doc.id)}
                        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors duration-150"
                        style={{ borderBottom: idx < expiredDocs.length - 1 ? "1px solid rgba(248,113,113,0.07)" : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.07)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
                          <LuFileWarning size={14} style={{ color: "#f87171" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-[12px] font-bold" style={{ color: "#f87171" }}>{doc.doc_code}</span>
                            <span className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{doc.title}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ged-tx2)" }}>
                              <LuCalendar size={10} /> Révision : {fmtDate(doc.next_review_date)}
                            </span>
                            {doc.status_name && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                                style={{ background: (STATUS_STYLE[doc.status_name] || STATUS_STYLE["Brouillon"]).bg, color: (STATUS_STYLE[doc.status_name] || STATUS_STYLE["Brouillon"]).color, border: `1px solid ${(STATUS_STYLE[doc.status_name] || STATUS_STYLE["Brouillon"]).border}` }}>
                                {doc.status_name}
                              </span>
                            )}
                            {doc.responsible && (
                              <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ged-tx3)" }}>
                                <LuUser size={10} /> {doc.responsible}
                              </span>
                            )}
                          </div>
                        </div>
                        {daysOverdue !== null && (
                          <div className="flex-shrink-0 text-right">
                            <span className="text-[11px] font-bold px-2 py-1 rounded-lg"
                              style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" }}>
                              +{daysOverdue}j
                            </span>
                          </div>
                        )}
                        <span className="text-[11px] flex-shrink-0" style={{ color: "rgba(248,113,113,0.4)" }}>→</span>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}

        {/* ── Filter tabs ────────────────────────────────── */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {filterTabs.map(tab => {
            const count  = tabCount(tab.key);
            const active = filter === tab.key;
            const cfg    = tab.key !== "all" && tab.key !== "unread" ? TYPE_CFG[tab.key] : null;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer transition-all duration-150"
                style={{
                  background:  active ? (cfg ? cfg.bg : "rgba(74,184,63,0.12)")    : "var(--ged-card)",
                  borderColor: active ? (cfg ? cfg.border : "rgba(74,184,63,0.3)") : "rgba(255,255,255,0.08)",
                  color:       active ? (cfg ? cfg.color : "#4ab83f") : "rgba(168,191,212,0.55)",
                }}>
                {tab.label}
                {count > 0 && (
                  <span className="px-1.5 py-px rounded-full text-[10px] font-bold"
                    style={{
                      background: active ? (cfg ? `${cfg.color}20` : "rgba(74,184,63,0.15)") : "rgba(255,255,255,0.08)",
                      color:      active ? (cfg ? cfg.color : "#4ab83f") : "rgba(168,191,212,0.5)",
                    }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── List ───────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span style={{ width: 28, height: 28, border: "2.5px solid rgba(255,255,255,0.1)", borderTopColor: "#4ab83f", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border"
            style={{ border: "1px solid var(--ged-border-sm)", background: "rgba(255,255,255,0.02)" }}>
            <LuBell size={36} style={{ color: "rgba(168,191,212,0.12)", marginBottom: 12 }} />
            <p className="text-[14px] font-semibold m-0" style={{ color: "var(--ged-tx3)" }}>
              Aucune notification
            </p>
            <p className="text-[12px] mt-1 m-0" style={{ color: "rgba(168,191,212,0.2)" }}>
              {filter === "all" ? "Les alertes apparaîtront ici automatiquement" : "Aucun résultat pour ce filtre"}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
            {filtered.map((n, idx) => {
              const cfg      = TYPE_CFG[n.type] || TYPE_CFG.validation;
              const Icon     = cfg.Icon;
              const hasDoc   = !!n.document_id;
              return (
                <div
                  key={n.id}
                  onClick={() => handleRowClick(n)}
                  className="flex items-start gap-4 px-5 py-4 transition-colors duration-150"
                  style={{
                    borderBottom: idx < filtered.length - 1 ? "1px solid var(--ged-border-sm)" : "none",
                    background:   n.is_read ? "transparent" : "rgba(255,255,255,0.022)",
                    cursor:       hasDoc ? "pointer" : "default",
                  }}
                  onMouseEnter={e => { if (hasDoc) e.currentTarget.style.background = "rgba(255,255,255,0.045)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? "transparent" : "rgba(255,255,255,0.022)"; }}
                >
                  {/* Type icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] leading-relaxed m-0 mb-1.5"
                      style={{ color: n.is_read ? "rgba(168,191,212,0.45)" : "rgba(255,255,255,0.88)" }}>
                      {n.message}
                    </p>
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Type badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                      {/* Doc code */}
                      {n.doc_code && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                          style={{ background: "var(--ged-card-md)", color: "var(--ged-tx2)", border: "1px solid var(--ged-border-md)" }}>
                          {n.doc_code}
                        </span>
                      )}
                      {/* Doc title */}
                      {n.doc_title && (
                        <span className="text-[11px]" style={{ color: "var(--ged-tx3)" }}>
                          {n.doc_title}
                        </span>
                      )}
                      {/* View hint */}
                      {hasDoc && (
                        <span className="text-[10px] font-semibold ml-1"
                          style={{ color: "rgba(74,184,63,0.6)" }}>
                          Cliquer pour voir le document →
                        </span>
                      )}
                      {/* Time */}
                      <span className="flex items-center gap-1 text-[10.5px] ml-auto" style={{ color: "var(--ged-tx3)" }}>
                        <LuClock size={10} />
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Read/Unread indicator */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-1">
                    {n.is_read ? (
                      <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
                    ) : (
                      <div className="w-2 h-2 rounded-full" style={{ background: "#4ab83f", boxShadow: "0 0 6px rgba(74,184,63,0.6)" }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Document modal ───────────────────────────────── */}
      {(loadingDoc || selectedDoc) && (
        <DocumentModal
          doc={selectedDoc}
          loading={loadingDoc}
          onClose={() => { setSelectedDoc(null); setLoadingDoc(false); }}
        />
      )}

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
