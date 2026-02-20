// ============================================================
// Validations.jsx — ACTIA ES Brand Theme · Inter + Lucide
// ============================================================
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext";
import UserSelector from "../components/UserSelector";
import {
  LuHouse, LuFilePlus, LuFileText, LuClipboardCheck, LuArchive,
  LuRefreshCw, LuCircleCheck, LuCircleX, LuClock,
  LuPencil, LuPenLine, LuEye, LuCircleCheckBig, LuShare2, LuTriangleAlert,
  LuUser, LuInbox, LuLock,
} from "react-icons/lu";

const API = "http://localhost:4000/api";

/* ── ACTIA colors ─────────────────────────────────────────── */
const NAVY       = "#2e4a6b";
const NAVY_DARK  = "#1e3450";
const NAVY_LIGHT = "#3d5f84";
const GREEN      = "#4ab83f";
const GREEN_DARK = "#3a9a31";
const BG         = "#f0f3f6";
const BORDER     = "#dde4ec";
const MUTED      = "#6b82a0";
const SURFACE    = "#ffffff";

// ── Status config — Lucide icon components ───────────────────
const STATUS_CFG = {
  "Brouillon":     { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1", Icon: LuPencil        },
  "En rédaction":  { bg: "#f0fdf4", text: "#16a34a", border: "#86efac", Icon: LuPenLine       },
  "En relecture":  { bg: "#eff6ff", text: "#2563eb", border: "#93c5fd", Icon: LuEye           },
  "En validation": { bg: "#eef2ff", text: "#4338ca", border: "#a5b4fc", Icon: LuClipboardCheck},
  "Validé":        { bg: "#f0fdf4", text: "#15803d", border: "#86efac", Icon: LuCircleCheckBig  },
  "Diffusé":       { bg: "#f0fdfa", text: "#0d9488", border: "#5eead4", Icon: LuShare2        },
  "Obsolète":      { bg: "#fff7ed", text: "#c2410c", border: "#fdba74", Icon: LuTriangleAlert },
  "Archivé":       { bg: "#f8fafc", text: "#475569", border: "#cbd5e1", Icon: LuArchive       },
};

const DECISION_CFG = {
  "APPROUVÉ":   { bg: "#f0fdf4", text: "#15803d", border: "#86efac", Icon: LuCircleCheck, label: "Approuvé"   },
  "REJETÉ":     { bg: "#fef2f2", text: "#dc2626", border: "#fca5a5", Icon: LuCircleX,     label: "Rejeté"     },
  "EN_ATTENTE": { bg: "#eef2ff", text: "#4338ca", border: "#a5b4fc", Icon: LuClock,       label: "En attente" },
};

// ── Nav config ───────────────────────────────────────────────
const NAV = [
  { icon: LuHouse,           label: "Accueil",          href: "/",            end: true  },
  { icon: LuFilePlus,       label: "Nouveau document", href: "/create",      end: false },
  { icon: LuFileText,       label: "Liste documents",  href: "/list",        end: false },
  { icon: LuClipboardCheck, label: "Validations",      href: "/validations", end: false },
  { icon: LuArchive,        label: "Archivage",        href: "/archive",     end: false },
];

// ── Sub-components ──────────────────────────────────────────
function StatusBadge({ name }) {
  const s = STATUS_CFG[name] || { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1", Icon: LuFileText };
  const SI = s.Icon;
  return (
    <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
      <SI size={11} /> {name}
    </span>
  );
}

function DecisionBadge({ decision }) {
  const d = DECISION_CFG[decision] || DECISION_CFG["EN_ATTENTE"];
  const DI = d.Icon;
  return (
    <span style={{ background: d.bg, color: d.text, border: `1px solid ${d.border}`, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <DI size={11} /> {d.label}
    </span>
  );
}

function StatCard({ Icon, label, value, accent = NAVY, bg = SURFACE, border = BORDER }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", flex: 1, minWidth: 120 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Icon size={13} style={{ color: accent }} />
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, margin: 0 }}>{label}</p>
      </div>
      <p style={{ color: accent, fontWeight: 800, fontSize: 28, margin: 0, letterSpacing: -0.5 }}>{value}</p>
    </div>
  );
}

function Empty({ Icon = LuInbox, message }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 0", color: MUTED }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <Icon size={40} style={{ color: BORDER }} />
      </div>
      <p style={{ fontSize: 13, margin: 0 }}>{message}</p>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────
function Sidebar({ pendingCount }) {
  return (
    <aside style={{ width: 220, background: NAVY_DARK, borderRight: `1px solid ${NAVY_LIGHT}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>

      {/* ACTIA Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${NAVY_LIGHT}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 2, padding: 6, background: NAVY, borderRadius: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[...Array(3)].map((_, j) => (
                  <div key={j} style={{ width: 4, height: 4, borderRadius: 1, background: GREEN, opacity: (i + j) % 2 === 0 ? 1 : 0.5 }} />
                ))}
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: 1.5 }}>ACTIA</span>
              <span style={{ color: GREEN, fontWeight: 700, fontSize: 10, letterSpacing: 1 }}>ES</span>
            </div>
            <p style={{ color: MUTED, fontSize: 9, margin: 0, letterSpacing: 0.3 }}>Engineering Services · GED</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 10px" }}>
        {NAV.map(({ icon: NavIcon, label, href, end }) => (
          <NavLink
            key={href} to={href} end={end}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 12px", borderRadius: 8, textDecoration: "none",
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              color: isActive ? GREEN : "#a8bfd4",
              background: isActive ? "rgba(74,184,63,0.1)" : "transparent",
              borderLeft: isActive ? `3px solid ${GREEN}` : "3px solid transparent",
              transition: "all 0.15s",
            })}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <NavIcon size={16} style={{ flexShrink: 0 }} />
              {label}
            </span>
            {href === "/validations" && pendingCount > 0 && (
              <span style={{ background: "#f59e0b", color: "#fff", borderRadius: 99, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom stats */}
      <div style={{ marginTop: "auto", padding: "12px 10px", borderTop: `1px solid ${NAVY_LIGHT}`, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ background: "rgba(74,184,63,0.1)", border: `1px solid rgba(74,184,63,0.25)`, borderRadius: 10, padding: "10px 12px" }}>
          <p style={{ color: MUTED, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 2px" }}>EF05 — Validations</p>
          <p style={{ color: GREEN, fontWeight: 800, fontSize: 20, margin: 0, letterSpacing: -0.5 }}>{pendingCount} en attente</p>
        </div>
        <UserSelector />
      </div>
    </aside>
  );
}

// ── Validation modal ─────────────────────────────────────────
function ValidationModal({ doc, users, canValidate = false, onClose, onValidationAdded }) {
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ validatorId: "", comment: "", decision: "EN_ATTENTE" });
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/validations/document/${doc.id}`);
      setHistory(res.data.validations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [doc.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setSubmitting(true);
    try {
      const payload = {
        validatorId:   form.validatorId ? parseInt(form.validatorId) : undefined,
        validatorName: form.validatorId ? users.find(u => u.id === parseInt(form.validatorId))?.name || "" : "",
        comment:  form.comment,
        decision: form.decision,
      };
      await axios.post(`${API}/validations/document/${doc.id}`, payload);
      setSuccess("Validation enregistrée avec succès.");
      setForm({ validatorId: "", comment: "", decision: "EN_ATTENTE" });
      await loadHistory();
      onValidationAdded();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    background: BG, border: `1px solid ${BORDER}`,
    color: NAVY, fontSize: 13, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  // Decision options with Lucide icons
  const DECISION_OPTS = [
    { value: "APPROUVÉ",   Icon: LuCircleCheck, label: "Approuvé",   cfg: DECISION_CFG["APPROUVÉ"]   },
    { value: "REJETÉ",     Icon: LuCircleX,     label: "Rejeté",     cfg: DECISION_CFG["REJETÉ"]     },
    { value: "EN_ATTENTE", Icon: LuClock,       label: "En attente", cfg: DECISION_CFG["EN_ATTENTE"] },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, boxShadow: "0 25px 80px rgba(0,0,0,0.3)", width: "min(860px,95vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Modal header */}
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: "monospace", color: GREEN, fontWeight: 700, fontSize: 13 }}>{doc.doc_code}</span>
              <StatusBadge name={doc.status_name} />
              {doc.version_letter && doc.version_letter !== "-" && (
                <span style={{ background: BG, border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>
                  v.{doc.version_letter}
                </span>
              )}
            </div>
            <p style={{ margin: 0, color: NAVY, fontWeight: 600, fontSize: 15 }}>{doc.title}</p>
            <p style={{ margin: "4px 0 0", color: MUTED, fontSize: 11 }}>{doc.responsible} · {doc.process_name || "—"} · {doc.type_code}</p>
          </div>
          <button onClick={onClose} style={{ color: MUTED, background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 4, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left: form */}
          <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${BORDER}`, padding: "20px", overflowY: "auto" }}>
            <p style={{ color: NAVY, fontWeight: 600, fontSize: 13, marginBottom: 16 }}>Nouvelle validation</p>

            {!canValidate && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <LuLock size={14} style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ margin: "0 0 3px", color: "#dc2626", fontSize: 11, fontWeight: 600 }}>Accès refusé</p>
                  <p style={{ margin: 0, color: MUTED, fontSize: 11 }}>
                    Seuls Validateur, Responsable Qualité et Admin GED peuvent enregistrer une validation.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, opacity: canValidate ? 1 : 0.4, pointerEvents: canValidate ? "auto" : "none" }}>

              {/* Validator */}
              <div>
                <label style={{ display: "block", color: MUTED, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Validateur</label>
                <select value={form.validatorId} onChange={(e) => setForm(f => ({ ...f, validatorId: e.target.value }))}
                  style={inputStyle}>
                  <option value="">— Sélectionner —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              {/* Decision */}
              <div>
                <label style={{ display: "block", color: MUTED, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Décision *</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {DECISION_OPTS.map(({ value, Icon: OptIcon, label, cfg }) => (
                    <button type="button" key={value}
                      onClick={() => setForm(f => ({ ...f, decision: value }))}
                      style={{
                        padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        textAlign: "left", display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                        background: form.decision === value ? cfg.bg : BG,
                        color: form.decision === value ? cfg.text : MUTED,
                        border: `1px solid ${form.decision === value ? cfg.border : BORDER}`,
                        transition: "all 0.15s", fontFamily: "inherit",
                      }}>
                      <OptIcon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label style={{ display: "block", color: MUTED, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Commentaire</label>
                <textarea rows={4} value={form.comment} onChange={(e) => setForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Observations, motif de rejet, conditions d'approbation…"
                  style={{ ...inputStyle, resize: "vertical", fontSize: 12 }}
                />
              </div>

              {error && (
                <p style={{ margin: 0, color: "#dc2626", fontSize: 11, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px" }}>{error}</p>
              )}
              {success && (
                <p style={{ margin: 0, color: "#15803d", fontSize: 11, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "8px 12px" }}>{success}</p>
              )}

              <button type="submit" disabled={submitting}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 8, fontWeight: 700, fontSize: 13,
                  background: submitting ? BG : GREEN, color: submitting ? MUTED : "#fff",
                  border: "none", cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: submitting ? "none" : "0 4px 12px rgba(74,184,63,0.35)",
                  transition: "all 0.15s", fontFamily: "inherit",
                }}>
                {submitting ? "Enregistrement…" : "Enregistrer la validation"}
              </button>
            </form>
          </div>

          {/* Right: history */}
          <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
            <p style={{ color: NAVY, fontWeight: 600, fontSize: 13, marginBottom: 16 }}>
              Historique des validations
              {history.length > 0 && <span style={{ color: MUTED, fontWeight: 400, marginLeft: 8 }}>({history.length})</span>}
            </p>

            {loading ? (
              <p style={{ color: MUTED, fontSize: 13 }}>Chargement…</p>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: MUTED }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <LuClipboardCheck size={32} style={{ color: BORDER }} />
                </div>
                <p style={{ fontSize: 13, margin: 0 }}>Aucune validation enregistrée.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {history.map((v) => (
                  <div key={v.id} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <DecisionBadge decision={v.decision} />
                        {v.version_letter && <span style={{ color: MUTED, fontSize: 11 }}>v.{v.version_letter}</span>}
                      </div>
                      <span style={{ color: MUTED, fontSize: 11 }}>
                        {new Date(v.validated_at).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <LuUser size={13} style={{ color: MUTED, flexShrink: 0 }} />
                      <span style={{ color: NAVY_LIGHT, fontSize: 13, fontWeight: 600 }}>{v.validator_name}</span>
                    </div>
                    {v.comment && (
                      <p style={{ margin: 0, color: MUTED, fontSize: 11, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", lineHeight: 1.6 }}>
                        {v.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
export default function Validations() {
  const { can } = useUser();

  const [pendingDocs, setPendingDocs] = useState([]);
  const [allHistory,  setAllHistory]  = useState([]);
  const [stats,       setStats]       = useState(null);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("pending");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, hist, statsRes, usersRes] = await Promise.all([
        axios.get(`${API}/validations/pending-docs`),
        axios.get(`${API}/validations?limit=50`),
        axios.get(`${API}/validations/stats`),
        axios.get(`${API}/users`),
      ]);
      setPendingDocs(pending.data);
      setAllHistory(hist.data.data || []);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabBtn = (id, TabIcon, label, count) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
        background: activeTab === id ? NAVY : SURFACE,
        color: activeTab === id ? "#fff" : MUTED,
        border: `1px solid ${activeTab === id ? NAVY : BORDER}`,
        boxShadow: activeTab === id ? "0 2px 8px rgba(46,74,107,0.3)" : "none",
        transition: "all 0.15s", fontFamily: "inherit",
      }}>
      <TabIcon size={14} />
      {label}
      {count > 0 && (
        <span style={{ borderRadius: 99, padding: "1px 8px", fontSize: 11, fontWeight: 700, background: activeTab === id ? "rgba(255,255,255,0.2)" : BG, color: activeTab === id ? "#fff" : MUTED }}>
          {count}
        </span>
      )}
    </button>
  );

  const PENDING_COLS = "160px 1fr 120px 100px 110px 140px 110px";
  const HISTORY_COLS = "130px 160px 1fr 130px 120px 1fr";

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex" }}>
      <Sidebar pendingCount={pendingDocs.length} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <header style={{ padding: "14px 36px", background: SURFACE, borderBottom: `1px solid ${BORDER}`, boxShadow: "0 1px 4px rgba(46,74,107,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ display: "inline-block", width: 3, height: 18, background: GREEN, borderRadius: 99 }} />
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: NAVY, letterSpacing: -0.3 }}>Validations ISO</h1>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: MUTED }}>
              EF05 — Enregistrement des décisions de validation · Traçabilité complète
            </p>
          </div>
          <button onClick={load}
            style={{ display: "flex", alignItems: "center", gap: 6, background: SURFACE, border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}>
            <LuRefreshCw size={14} /> Actualiser
          </button>
        </header>

        <div style={{ flex: 1, padding: "24px 36px", overflowY: "auto" }}>

          {/* Stats */}
          {stats && (
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              <StatCard
                Icon={LuClock} label="Docs en validation"
                value={stats.pending_docs_count}
                accent={stats.pending_docs_count > 0 ? "#4338ca" : GREEN}
                bg={stats.pending_docs_count > 0 ? "#eef2ff" : "#f0fdf4"}
                border={stats.pending_docs_count > 0 ? "#a5b4fc" : "#86efac"}
              />
              <StatCard
                Icon={LuCircleCheck} label="Approuvées"
                value={stats.decisions?.["APPROUVÉ"] ?? 0}
                accent={GREEN_DARK} bg="#f0fdf4" border="#86efac"
              />
              <StatCard
                Icon={LuCircleX} label="Rejetées"
                value={stats.decisions?.["REJETÉ"] ?? 0}
                accent="#dc2626" bg="#fef2f2" border="#fca5a5"
              />
              <StatCard
                Icon={LuClipboardCheck} label="Total validations"
                value={stats.total ?? 0}
                accent={NAVY}
              />
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {tabBtn("pending", LuClock,         "Documents en attente", pendingDocs.length)}
            {tabBtn("history", LuClipboardCheck, "Historique complet",   allHistory.length)}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: MUTED, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <LuRefreshCw size={32} style={{ color: BORDER, animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13 }}>Chargement…</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              {/* Pending tab */}
              {activeTab === "pending" && (
                <div>
                  {pendingDocs.length === 0 ? (
                    <Empty Icon={LuCircleCheckBig} message="Aucun document en attente de validation." />
                  ) : (
                    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(46,74,107,0.06)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: PENDING_COLS, padding: "10px 20px", background: BG, borderBottom: `1px solid ${BORDER}` }}>
                        {["Référence","Titre","Responsable","Type","Version","Dernière décision","Action"].map(h => (
                          <span key={h} style={{ color: MUTED, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</span>
                        ))}
                      </div>

                      {pendingDocs.map((doc, i) => (
                        <div key={doc.id}
                          style={{ display: "grid", gridTemplateColumns: PENDING_COLS, padding: "12px 20px", alignItems: "center", borderBottom: i < pendingDocs.length - 1 ? `1px solid ${BG}` : "none" }}>

                          <span style={{ fontFamily: "monospace", color: GREEN, fontWeight: 700, fontSize: 12 }}>{doc.doc_code}</span>

                          <div style={{ overflow: "hidden", paddingRight: 12 }}>
                            <p style={{ margin: 0, color: NAVY, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</p>
                            {doc.process_name && <p style={{ margin: 0, color: MUTED, fontSize: 11 }}>{doc.process_name}</p>}
                          </div>

                          <span style={{ color: MUTED, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.responsible || "—"}</span>

                          <span style={{ background: "#eef2ff", color: "#4338ca", border: "1px solid #a5b4fc", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, width: "fit-content" }}>
                            {doc.type_code}
                          </span>

                          <span style={{ color: MUTED, fontSize: 12 }}>
                            {doc.version_letter && doc.version_letter !== "-" ? `v.${doc.version_letter}` : "—"}
                          </span>

                          <div>
                            {doc.last_decision
                              ? <DecisionBadge decision={doc.last_decision} />
                              : <span style={{ color: MUTED, fontSize: 12 }}>Aucune</span>}
                          </div>

                          <button onClick={() => setSelectedDoc(doc)}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, background: GREEN, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, boxShadow: "0 2px 8px rgba(74,184,63,0.3)", whiteSpace: "nowrap", fontFamily: "inherit" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = GREEN_DARK}
                            onMouseLeave={(e) => e.currentTarget.style.background = GREEN}>
                            <LuClipboardCheck size={13} /> Valider
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* History tab */}
              {activeTab === "history" && (
                <div>
                  {allHistory.length === 0 ? (
                    <Empty Icon={LuInbox} message="Aucune validation enregistrée." />
                  ) : (
                    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(46,74,107,0.06)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: HISTORY_COLS, padding: "10px 20px", background: BG, borderBottom: `1px solid ${BORDER}` }}>
                        {["Date","Référence","Titre doc","Validateur","Décision","Commentaire"].map(h => (
                          <span key={h} style={{ color: MUTED, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</span>
                        ))}
                      </div>

                      {allHistory.map((v, i) => (
                        <div key={v.id}
                          style={{ display: "grid", gridTemplateColumns: HISTORY_COLS, padding: "10px 20px", alignItems: "center", borderBottom: i < allHistory.length - 1 ? `1px solid ${BG}` : "none" }}>

                          <span style={{ color: MUTED, fontSize: 11 }}>
                            {new Date(v.validated_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" })}
                            <br />
                            <span style={{ fontSize: 10 }}>
                              {new Date(v.validated_at).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}
                            </span>
                          </span>

                          <span style={{ fontFamily: "monospace", color: GREEN, fontWeight: 700, fontSize: 11 }}>{v.doc_code}</span>

                          <span style={{ color: NAVY, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{v.doc_title}</span>

                          <span style={{ display: "flex", alignItems: "center", gap: 5, color: NAVY_LIGHT, fontSize: 11 }}>
                            <LuUser size={12} style={{ flexShrink: 0 }} /> {v.validator_name}
                          </span>

                          <DecisionBadge decision={v.decision} />

                          <span style={{ color: MUTED, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.comment || "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedDoc && (
        <ValidationModal
          doc={selectedDoc}
          users={users}
          canValidate={can("validation:create")}
          onClose={() => setSelectedDoc(null)}
          onValidationAdded={load}
        />
      )}
    </div>
  );
}
