// ============================================================
// components/NotificationBell.jsx — Sprint 5
// Cloche avec badge non-lu + dropdown panel
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  LuBell, LuCheckCheck, LuClock, LuArrowRight,
  LuClipboardCheck, LuFileWarning, LuFilePlus, LuArchive,
} from "react-icons/lu";

import { API } from "../config";

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

  const badgeCount = unread > 9 ? "9+" : unread;

  return (
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
                    onClick={() => !n.is_read && markRead(n.id)}
                    style={{
                      padding:      "11px 14px",
                      borderBottom: idx < notifications.length - 1
                        ? "1px solid rgba(255,255,255,0.04)" : "none",
                      display:      "flex",
                      gap:          10,
                      alignItems:   "flex-start",
                      cursor:       n.is_read ? "default" : "pointer",
                      background:   n.is_read ? "transparent" : "rgba(255,255,255,0.022)",
                      transition:   "background 0.15s",
                    }}
                    onMouseEnter={e => {
                      if (!n.is_read)
                        e.currentTarget.style.background = "rgba(255,255,255,0.042)";
                    }}
                    onMouseLeave={e => {
                      if (!n.is_read)
                        e.currentTarget.style.background = "rgba(255,255,255,0.022)";
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
  );
}
