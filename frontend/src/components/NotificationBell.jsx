// ============================================================
// components/NotificationBell.jsx — Sprint 5
// Cloche avec badge non-lu + dropdown panel + document modal
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  LuBell, LuCheckCheck, LuClock, LuArrowRight,
  LuClipboardCheck, LuFileWarning, LuFilePlus, LuArchive,
  LuX, LuCalendar, LuFolder, LuTag, LuUser,
  LuFileText, LuLayers, LuHistory, LuShieldCheck,
} from "react-icons/lu";

import { API, BACKEND } from "../config";

/* ── helpers ─────────────────────────────────────────────── */
function fmtDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });
}
function fmtSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024)    return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} Ko`;
  return `${(bytes/1048576).toFixed(1)} Mo`;
}

const STATUS_STYLE = {
  "Brouillon":     { color:"#94a3b8", bg:"rgba(148,163,184,0.12)", border:"rgba(148,163,184,0.28)" },
  "En rédaction":  { color:"#60a5fa", bg:"rgba(96,165,250,0.12)",  border:"rgba(96,165,250,0.28)"  },
  "En validation": { color:"#fbbf24", bg:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.28)"  },
  "Validé":        { color:"#4ade80", bg:"rgba(74,222,128,0.12)",  border:"rgba(74,222,128,0.28)"  },
  "Diffusé":       { color:"#a78bfa", bg:"rgba(167,139,250,0.12)", border:"rgba(167,139,250,0.28)" },
  "Obsolète":      { color:"#fb923c", bg:"rgba(251,146,60,0.12)",  border:"rgba(251,146,60,0.28)"  },
  "Archivé":       { color:"#64748b", bg:"rgba(100,116,139,0.12)", border:"rgba(100,116,139,0.28)" },
};

function InfoRow({ Icon, label, value, valueStyle }) {
  if (!value) return null;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
      <div style={{ width:26, height:26, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0, marginTop:2, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
        <Icon size={11} style={{ color:"rgba(168,191,212,0.55)" }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em",
          color:"rgba(168,191,212,0.35)", marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:12.5, fontWeight:500, color:"rgba(255,255,255,0.82)", ...valueStyle }}>{value}</div>
      </div>
    </div>
  );
}

/* ── Document Detail Modal ───────────────────────────────── */
function DocumentModal({ doc, loading, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!doc && !loading) return null;

  const statusStyle = doc ? (STATUS_STYLE[doc.status_name] || STATUS_STYLE["Brouillon"]) : null;
  const isOverdue   = doc?.next_review_date && new Date(doc.next_review_date) < new Date();

  return createPortal(
    <div
      style={{ position:"fixed", top:0, right:0, bottom:0, left:0, zIndex:99999,
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
        background:"rgba(0,0,0,0.75)", backdropFilter:"blur(10px)",
        fontFamily:"'Inter',-apple-system,sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col"
        style={{ borderRadius:20, overflow:"hidden", background:"rgba(10,20,32,0.99)",
          border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.07)" }}>

        {/* Close */}
        <button onClick={onClose}
          style={{ position:"absolute", top:14, right:14, width:30, height:30, borderRadius:8, cursor:"pointer",
            background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)",
            display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}
          onMouseEnter={e => e.currentTarget.style.background="rgba(248,113,113,0.18)"}
          onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.07)"}>
          <LuX size={14} style={{ color:"rgba(168,191,212,0.7)" }} />
        </button>

        {/* Spinner */}
        {loading && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 0" }}>
            <span style={{ width:26, height:26, border:"2.5px solid rgba(255,255,255,0.08)",
              borderTopColor:"#4ab83f", borderRadius:"50%", animation:"bellspin 0.7s linear infinite", display:"inline-block" }} />
            <style>{`@keyframes bellspin { to { transform:rotate(360deg); } }`}</style>
          </div>
        )}

        {doc && !loading && (
          <>
            {/* Header */}
            <div style={{ padding:"22px 24px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:10.5, fontWeight:700, padding:"3px 9px", borderRadius:7,
                  background:statusStyle.bg, color:statusStyle.color, border:`1.5px solid ${statusStyle.border}` }}>
                  {doc.status_name}
                </span>
                {doc.current_version && doc.current_version !== "-" && (
                  <span style={{ fontSize:10.5, fontWeight:600, padding:"3px 9px", borderRadius:7,
                    background:"rgba(96,165,250,0.1)", color:"#60a5fa", border:"1.5px solid rgba(96,165,250,0.25)" }}>
                    {doc.current_version}
                  </span>
                )}
                {isOverdue && (
                  <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:10.5, fontWeight:600,
                    padding:"3px 8px", borderRadius:7, background:"rgba(248,113,113,0.1)", color:"#f87171",
                    border:"1.5px solid rgba(248,113,113,0.25)" }}>
                    <LuFileWarning size={10} /> En retard
                  </span>
                )}
              </div>
              <p style={{ margin:0, fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#4ab83f", marginBottom:4 }}>
                {doc.doc_code}
              </p>
              <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:"white", paddingRight:32, lineHeight:1.3 }}>
                {doc.title}
              </h2>
            </div>

            {/* Body */}
            <div style={{ overflowY:"auto", flex:1, padding:"20px 24px", display:"flex", flexDirection:"column", gap:16,
              scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.08) transparent" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <InfoRow Icon={LuTag}      label="Type"           value={doc.type_label || doc.type_code} />
                <InfoRow Icon={LuFolder}   label="Dossier"        value={doc.folder_name} />
                <InfoRow Icon={LuLayers}   label="Version"        value={doc.current_version && doc.current_version !== "-" ? `Version ${doc.current_version}` : "Aucune"} />
                <InfoRow Icon={LuUser}     label="Créé par"       value={doc.created_by_name} />
                <InfoRow Icon={LuCalendar} label="Date de création"     value={fmtDate(doc.created_at)} />
                <InfoRow Icon={LuHistory}  label="Dernière modification" value={fmtDate(doc.updated_at)} />
                <InfoRow Icon={LuCalendar} label="Date de révision"
                  value={doc.next_review_date ? fmtDate(doc.next_review_date) : "—"}
                  valueStyle={isOverdue ? { color:"#f87171" } : {}} />
                <InfoRow Icon={LuFileText}    label="Fichier" value={doc.file_name} />
                <InfoRow Icon={LuShieldCheck} label="Taille"  value={fmtSize(doc.file_size)} />
              </div>

              {/* Process chain */}
              {(doc.strategic_process || doc.main_process || doc.sub_process) && (
                <div style={{ borderRadius:12, padding:14, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ margin:"0 0 10px", fontSize:9, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.1em", color:"rgba(168,191,212,0.35)" }}>Processus</p>
                  <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", fontSize:11 }}>
                    {doc.strategic_process && (
                      <span style={{ padding:"3px 8px", borderRadius:6, background:"rgba(74,184,63,0.1)", color:"#4ab83f", border:"1px solid rgba(74,184,63,0.2)" }}>
                        {doc.strategic_process}
                      </span>
                    )}
                    {doc.main_process && (
                      <><span style={{ color:"rgba(255,255,255,0.2)" }}>›</span>
                      <span style={{ padding:"3px 8px", borderRadius:6, background:"rgba(96,165,250,0.1)", color:"#60a5fa", border:"1px solid rgba(96,165,250,0.2)" }}>
                        {doc.main_process}
                      </span></>
                    )}
                    {doc.sub_process && (
                      <><span style={{ color:"rgba(255,255,255,0.2)" }}>›</span>
                      <span style={{ padding:"3px 8px", borderRadius:6, background:"rgba(167,139,250,0.1)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.2)" }}>
                        {doc.sub_process}
                      </span></>
                    )}
                  </div>
                </div>
              )}

              {doc.description && (
                <div style={{ borderRadius:12, padding:14, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ margin:"0 0 6px", fontSize:9, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.1em", color:"rgba(168,191,212,0.35)" }}>Description</p>
                  <p style={{ margin:0, fontSize:12.5, lineHeight:1.65, color:"rgba(255,255,255,0.62)" }}>
                    {doc.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:"14px 24px", borderTop:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
              <button onClick={onClose}
                style={{ width:"100%", padding:"10px", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer",
                  background:"rgba(255,255,255,0.05)", color:"rgba(168,191,212,0.7)", border:"1px solid rgba(255,255,255,0.09)",
                  fontFamily:"inherit" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.09)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── Config par type de notification ─────────────────────── */
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
};

/* ── timeAgo helper ───────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
}

/* ════════════════════════════════════════════════════════════ */
export default function NotificationBell() {
  const { token } = useUser();
  const navigate = useNavigate();
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [selectedDoc,   setSelectedDoc]   = useState(null);
  const [loadingDoc,    setLoadingDoc]    = useState(false);
  const wrapperRef = useRef(null);

  /* ── Fetch notifications ──────────────────────────────── */
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data);
      setUnread(data.filter(n => !n.is_read).length);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000); // poll 60s
    return () => clearInterval(id);
  }, [fetchNotifications]);

  /* ── Close dropdown on outside click ─────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Mark single as read (optimistic) ────────────────── */
  const markRead = async (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnread(prev => Math.max(0, prev - 1));
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method:  "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
  };

  /* ── Mark all as read (optimistic) ───────────────────── */
  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await fetch(`${API}/notifications/read-all`, {
        method:  "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
  };

  /* ── Open document modal ─────────────────────────────── */
  const openDocModal = async (docId) => {
    setSelectedDoc(null);
    setLoadingDoc(true);
    try {
      const res = await fetch(`${API}/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setSelectedDoc(await res.json());
    } catch { /* ignore */ }
    finally { setLoadingDoc(false); }
  };

  const handleNotifClick = (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.document_id) {
      setOpen(false);
      openDocModal(n.document_id);
    }
  };

  const badgeCount = unread > 9 ? "9+" : unread;

  return (
    <>
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-flex" }}>

      {/* ── Bell button ─────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        style={{
          position:       "relative",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:           36,
          height:          36,
          borderRadius:    10,
          background:      open ? "rgba(74,184,63,0.12)" : "rgba(255,255,255,0.06)",
          border:          `1px solid ${open ? "rgba(74,184,63,0.3)" : "rgba(255,255,255,0.1)"}`,
          cursor:          "pointer",
          transition:      "all 0.2s",
          flexShrink:      0,
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background   = "rgba(255,255,255,0.1)";
            e.currentTarget.style.borderColor  = "rgba(255,255,255,0.18)";
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background   = "rgba(255,255,255,0.06)";
            e.currentTarget.style.borderColor  = "rgba(255,255,255,0.1)";
          }
        }}
      >
        <LuBell size={16} style={{ color: open ? "#4ab83f" : "rgba(168,191,212,0.75)" }} />

        {/* Badge */}
        {unread > 0 && (
          <span style={{
            position:       "absolute",
            top:            -5,
            right:          -5,
            background:     "#f87171",
            color:          "white",
            borderRadius:   "50%",
            minWidth:       17,
            height:         17,
            fontSize:       10,
            fontWeight:     800,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            border:         "2px solid #0a1420",
            padding:        "0 3px",
            lineHeight:     1,
          }}>
            {badgeCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ──────────────────────────────── */}
      {open && (
        <div style={{
          position:       "absolute",
          top:            "calc(100% + 10px)",
          right:          0,
          width:          360,
          maxHeight:      480,
          borderRadius:   16,
          background:     "rgba(10,20,32,0.97)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border:         "1px solid rgba(255,255,255,0.1)",
          boxShadow:      "0 24px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)",
          zIndex:         9999,
          display:        "flex",
          flexDirection:  "column",
          overflow:       "hidden",
          fontFamily:     "'Inter',-apple-system,sans-serif",
        }}>

          {/* Header */}
          <div style={{
            padding:      "13px 16px 11px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "space-between",
            flexShrink:   0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <LuBell size={13} style={{ color: "#4ab83f" }} />
              <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>
                Notifications
              </span>
              {unread > 0 && (
                <span style={{
                  background:  "rgba(248,113,113,0.14)",
                  color:       "#f87171",
                  border:      "1px solid rgba(248,113,113,0.28)",
                  borderRadius: 999,
                  fontSize:    10,
                  fontWeight:  800,
                  padding:     "1px 7px",
                  lineHeight:  1.6,
                }}>
                  {unread} non lue{unread > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background:  "none",
                  border:      "none",
                  cursor:      "pointer",
                  display:     "flex",
                  alignItems:  "center",
                  gap:         4,
                  color:       "#4ab83f",
                  fontSize:    11,
                  fontWeight:  600,
                  padding:     "3px 8px",
                  borderRadius: 6,
                  transition:  "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(74,184,63,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <LuCheckCheck size={11} /> Tout lire
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center" }}>
                <LuBell size={28} style={{ color: "rgba(168,191,212,0.15)", marginBottom: 10 }} />
                <p style={{ color: "rgba(168,191,212,0.35)", fontSize: 12.5, margin: 0 }}>
                  Aucune notification
                </p>
                <p style={{ color: "rgba(168,191,212,0.2)", fontSize: 11, margin: "4px 0 0" }}>
                  Les alertes apparaîtront ici automatiquement
                </p>
              </div>
            ) : (
              notifications.map((n, idx) => {
                const cfg  = TYPE_CFG[n.type] || TYPE_CFG.validation;
                const Icon = cfg.Icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    style={{
                      padding:      "11px 14px",
                      borderBottom: idx < notifications.length - 1
                        ? "1px solid rgba(255,255,255,0.04)" : "none",
                      display:      "flex",
                      gap:          10,
                      alignItems:   "flex-start",
                      cursor:       n.document_id ? "pointer" : "default",
                      background:   n.is_read ? "transparent" : "rgba(255,255,255,0.022)",
                      transition:   "background 0.15s",
                    }}
                    onMouseEnter={e => {
                      if (n.document_id)
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = n.is_read ? "transparent" : "rgba(255,255,255,0.022)";
                    }}
                  >
                    {/* Type icon */}
                    <div style={{
                      width:          30,
                      height:         30,
                      borderRadius:   8,
                      background:     cfg.bg,
                      border:         `1px solid ${cfg.border}`,
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      flexShrink:     0,
                      marginTop:      1,
                    }}>
                      <Icon size={13} style={{ color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin:     0,
                        fontSize:   12,
                        lineHeight: 1.55,
                        color:      n.is_read
                          ? "rgba(168,191,212,0.45)"
                          : "rgba(255,255,255,0.85)",
                      }}>
                        {n.message}
                      </p>
                      <div style={{
                        display:    "flex",
                        alignItems: "center",
                        gap:        5,
                        marginTop:  3,
                      }}>
                        <LuClock size={9} style={{ color: "rgba(168,191,212,0.3)" }} />
                        <span style={{ fontSize: 10, color: "rgba(168,191,212,0.38)" }}>
                          {timeAgo(n.created_at)}
                        </span>
                        {n.doc_code && (
                          <>
                            <span style={{ fontSize: 10, color: "rgba(168,191,212,0.2)" }}>·</span>
                            <span style={{ fontSize: 10, color: cfg.color, fontWeight: 700 }}>
                              {n.doc_code}
                            </span>
                          </>
                        )}
                        <span style={{
                          fontSize:    9,
                          color:       cfg.color,
                          background:  cfg.bg,
                          border:      `1px solid ${cfg.border}`,
                          borderRadius: 4,
                          padding:     "1px 5px",
                          fontWeight:  600,
                          marginLeft:  "auto",
                          flexShrink:  0,
                        }}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <div style={{
                        width:        7,
                        height:       7,
                        borderRadius: "50%",
                        background:   "#4ab83f",
                        flexShrink:   0,
                        marginTop:    5,
                        boxShadow:    "0 0 6px rgba(74,184,63,0.6)",
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer — Voir toutes */}
          <div style={{
            padding:        "10px 14px",
            borderTop:      "1px solid rgba(255,255,255,0.06)",
            flexShrink:     0,
          }}>
            <button
              onClick={() => { setOpen(false); navigate("/notifications"); }}
              style={{
                width:          "100%",
                background:     "rgba(74,184,63,0.07)",
                border:         "1px solid rgba(74,184,63,0.2)",
                borderRadius:   10,
                padding:        "8px 12px",
                cursor:         "pointer",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            6,
                color:          "#4ab83f",
                fontSize:       12,
                fontWeight:     700,
                fontFamily:     "inherit",
                transition:     "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background   = "rgba(74,184,63,0.13)";
                e.currentTarget.style.borderColor  = "rgba(74,184,63,0.35)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background   = "rgba(74,184,63,0.07)";
                e.currentTarget.style.borderColor  = "rgba(74,184,63,0.2)";
              }}
            >
              Voir toutes les notifications
              <LuArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>

    {/* ── Document modal — outside wrapper to avoid stacking context ── */}
    {(loadingDoc || selectedDoc) && (
      <DocumentModal
        doc={selectedDoc}
        loading={loadingDoc}
        onClose={() => { setSelectedDoc(null); setLoadingDoc(false); }}
      />
    )}
    </>
  );
}
