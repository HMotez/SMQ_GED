// ============================================================
// Archive.jsx — EF11 — ACTIA ES Brand Theme · Inter + Lucide
// ============================================================
import { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext";
import UserSelector from "../components/UserSelector";
import {
  LuHouse, LuFilePlus, LuFileText, LuClipboardCheck, LuArchive,
  LuRefreshCw, LuZap, LuShare2, LuTriangleAlert, LuCircleCheckBig,
  LuFolder, LuInbox, LuLock, LuArrowLeftRight,
} from "react-icons/lu";

const API = "http://localhost:4000/api";

/* ── ACTIA colors ─────────────────────────────────────────── */
const NAVY       = "#2e4a6b";
const NAVY_DARK  = "#1e3450";
const NAVY_LIGHT = "#3d5f84";
const GREEN      = "#4ab83f";
const BG         = "#f0f3f6";
const BORDER     = "#dde4ec";
const MUTED      = "#6b82a0";
const SURFACE    = "#ffffff";

// ── Status config ─────────────────────────────────────────────
const STATUS_CFG = {
  "Diffusé":  { bg: "#f0fdfa", text: "#0d9488", border: "#5eead4", Icon: LuShare2        },
  "Obsolète": { bg: "#fff7ed", text: "#c2410c", border: "#fdba74", Icon: LuTriangleAlert },
  "Archivé":  { bg: "#f8fafc", text: "#475569", border: "#cbd5e1", Icon: LuArchive       },
};

const statusCfg = (name) =>
  STATUS_CFG[name] || { bg: BG, text: MUTED, border: BORDER, Icon: LuFileText };

// ── Nav config ─────────────────────────────────────────────────
const NAV = [
  { icon: LuHouse,           label: "Accueil",          href: "/",            end: true  },
  { icon: LuFilePlus,       label: "Nouveau document", href: "/create",      end: false },
  { icon: LuFileText,       label: "Liste documents",  href: "/list",        end: false },
  { icon: LuClipboardCheck, label: "Validations",      href: "/validations", end: false },
  { icon: LuArchive,        label: "Archivage",        href: "/archive",     end: false },
];

// ── Sub-components ────────────────────────────────────────────
function StatusBadge({ name }) {
  const s = statusCfg(name);
  const SI = s.Icon;
  return (
    <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <SI size={11} /> {name}
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

function Section({ title, subtitle, accentColor = GREEN, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ display: "inline-block", width: 3, height: 16, background: accentColor, borderRadius: 99 }} />
        <p style={{ margin: 0, color: NAVY, fontWeight: 600, fontSize: 13 }}>{title}</p>
      </div>
      <p style={{ margin: "0 0 12px 13px", color: MUTED, fontSize: 11 }}>{subtitle}</p>
      {children}
    </div>
  );
}

function DocTable({ docs, action, showDaysOverdue = false, showArchivedAt = false }) {
  const lastCol = showDaysOverdue ? "Retard (j)" : showArchivedAt ? "Archivé" : "Révision";
  const COLS = "150px 1fr 120px 110px 120px 130px";

  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(46,74,107,0.06)" }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: COLS, padding: "10px 20px", background: BG, borderBottom: `1px solid ${BORDER}` }}>
        {["Référence","Titre","Responsable","Type","Statut", lastCol].map((h) => (
          <span key={h} style={{ color: MUTED, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {docs.map((doc, i) => (
        <div key={doc.id}
          style={{ display: "grid", gridTemplateColumns: COLS, padding: "11px 20px", alignItems: "center", borderBottom: i < docs.length - 1 ? `1px solid ${BG}` : "none" }}>

          <span style={{ fontFamily: "monospace", color: GREEN, fontWeight: 700, fontSize: 11 }}>{doc.doc_code}</span>

          <div style={{ overflow: "hidden", paddingRight: 12 }}>
            <p style={{ margin: 0, color: NAVY, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</p>
            {doc.folder_name && (
              <p style={{ margin: 0, color: MUTED, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <LuFolder size={10} /> {doc.folder_name}
              </p>
            )}
          </div>

          <span style={{ color: MUTED, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.responsible || "—"}</span>

          <span style={{ background: "#eef2ff", color: "#4338ca", border: "1px solid #a5b4fc", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, width: "fit-content" }}>
            {doc.type_code}
          </span>

          <StatusBadge name={doc.status_name} />

          <div>
            {showDaysOverdue ? (
              <span>
                <span style={{ color: "#c2410c", fontWeight: 700, fontSize: 13 }}>+{doc.days_overdue ?? 0} j</span>
                <p style={{ margin: "2px 0 0", color: MUTED, fontSize: 10 }}>
                  {doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—"}
                </p>
              </span>
            ) : action ? (
              action(doc)
            ) : (
              <span style={{ color: MUTED, fontSize: 11 }}>
                {doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—"}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function Archive() {
  const { can } = useUser();

  const [candidates, setCandidates] = useState([]);
  const [archived,   setArchived]   = useState([]);
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [running,    setRunning]    = useState(false);
  const [lastRun,    setLastRun]    = useState(null);
  const [activeTab,  setActiveTab]  = useState("candidates");

  const load = async () => {
    setLoading(true);
    try {
      const [cand, arch, hist] = await Promise.all([
        axios.get(`${API}/documents/archive-candidates`),
        axios.get(`${API}/documents/archived`),
        axios.get(`${API}/documents/archive-history`),
      ]);
      setCandidates(cand.data);
      setArchived(arch.data);
      setHistory(hist.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAutoArchive = async () => {
    setRunning(true);
    try {
      const res = await axios.post(`${API}/documents/archive-expired`);
      setLastRun(res.data);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'archivage automatique.");
    } finally {
      setRunning(false);
    }
  };

  const handleManualArchive = async (doc) => {
    if (!window.confirm(`Archiver définitivement "${doc.doc_code} — ${doc.title}" ?\nCette action est irréversible (aucune suppression, historique conservé).`))
      return;
    try {
      await axios.patch(`${API}/documents/${doc.id}/status`, { newStatus: "Archivé" });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'archivage.");
    }
  };

  const expiredDiffuse = candidates.filter((d) => d.status_name === "Diffusé");
  const obsoletes      = candidates.filter((d) => d.status_name === "Obsolète");

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

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex" }}>

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
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
                display: "flex", alignItems: "center", gap: 9,
                padding: "9px 12px", borderRadius: 8, textDecoration: "none",
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? GREEN : "#a8bfd4",
                background: isActive ? "rgba(74,184,63,0.1)" : "transparent",
                borderLeft: isActive ? `3px solid ${GREEN}` : "3px solid transparent",
                transition: "all 0.15s",
              })}
            >
              <NavIcon size={16} style={{ flexShrink: 0 }} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Summary stats */}
        <div style={{ marginTop: "auto", padding: "12px 10px", borderTop: `1px solid ${NAVY_LIGHT}`, display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "À archiver",  value: expiredDiffuse.length, accent: "#c2410c", bg: "rgba(194,65,12,0.1)",   border: "rgba(194,65,12,0.25)"  },
            { label: "Obsolètes",   value: obsoletes.length,      accent: "#d97706", bg: "rgba(217,119,6,0.1)",   border: "rgba(217,119,6,0.25)"  },
            { label: "Archivés",    value: archived.length,       accent: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
          ].map(({ label, value, accent, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: MUTED, fontSize: 11 }}>{label}</span>
              <span style={{ color: accent, fontWeight: 700, fontSize: 15 }}>{value}</span>
            </div>
          ))}
          <UserSelector />
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <header style={{ padding: "14px 36px", background: SURFACE, borderBottom: `1px solid ${BORDER}`, boxShadow: "0 1px 4px rgba(46,74,107,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ display: "inline-block", width: 3, height: 18, background: GREEN, borderRadius: 99 }} />
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: NAVY, letterSpacing: -0.3 }}>Archivage automatique</h1>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: MUTED }}>
              EF11 — Gestion des documents obsolètes · Aucune suppression définitive
            </p>
          </div>

          {can("archive:manage") ? (
            <button
              onClick={handleAutoArchive}
              disabled={running || expiredDiffuse.length === 0}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none",
                cursor: expiredDiffuse.length > 0 && !running ? "pointer" : "not-allowed",
                background: expiredDiffuse.length > 0 ? "#dc2626" : BG,
                color: expiredDiffuse.length > 0 ? "#fff" : MUTED,
                boxShadow: expiredDiffuse.length > 0 ? "0 4px 14px rgba(220,38,38,0.3)" : "none",
                opacity: running ? 0.6 : 1, transition: "all 0.15s", fontFamily: "inherit",
              }}>
              <LuZap size={15} />
              {running ? "Archivage en cours…" : `Archiver les ${expiredDiffuse.length} expiré(s)`}
            </button>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: BG, border: `1px solid ${BORDER}`, color: MUTED }}>
              <LuLock size={13} /> Archivage réservé à Admin GED / Responsable Qualité
            </span>
          )}
        </header>

        <div style={{ flex: 1, padding: "24px 36px", overflowY: "auto" }}>

          {/* Last run result */}
          {lastRun && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 12 }}>
              <LuCircleCheckBig size={20} style={{ color: "#15803d", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: 0, color: "#15803d", fontWeight: 600, fontSize: 13 }}>{lastRun.message}</p>
                {lastRun.documents?.length > 0 && (
                  <p style={{ margin: "4px 0 0", color: "#16a34a", fontSize: 11 }}>{lastRun.documents.join(" · ")}</p>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <StatCard
              Icon={LuShare2} label="Diffusés expirés"
              value={expiredDiffuse.length}
              accent={expiredDiffuse.length > 0 ? "#c2410c" : GREEN}
              bg={expiredDiffuse.length > 0 ? "#fff7ed" : "#f0fdf4"}
              border={expiredDiffuse.length > 0 ? "#fdba74" : "#86efac"}
            />
            <StatCard
              Icon={LuTriangleAlert} label="En attente archivage"
              value={obsoletes.length}
              accent={obsoletes.length > 0 ? "#d97706" : GREEN}
              bg={obsoletes.length > 0 ? "#fffbeb" : "#f0fdf4"}
              border={obsoletes.length > 0 ? "#fcd34d" : "#86efac"}
            />
            <StatCard Icon={LuArchive}     label="Archivés (total)" value={archived.length} accent="#475569" bg="#f8fafc" border="#cbd5e1" />
            <StatCard Icon={LuLock}        label="Aucune suppression" value="EF11" accent={GREEN} bg="#f0fdf4" border="#86efac" />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {tabBtn("candidates", LuTriangleAlert, "Candidats",      expiredDiffuse.length + obsoletes.length)}
            {tabBtn("archived",   LuArchive,       "Archivés",       archived.length)}
            {tabBtn("history",    LuRefreshCw,     "Historique EF11", history.length)}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: MUTED, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <LuRefreshCw size={32} style={{ color: BORDER, animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13 }}>Chargement…</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              {/* Candidates tab */}
              {activeTab === "candidates" && (
                <div>
                  {expiredDiffuse.length === 0 && obsoletes.length === 0 ? (
                    <Empty Icon={LuCircleCheckBig} message="Aucun document en attente d'archivage." />
                  ) : (
                    <>
                      {expiredDiffuse.length > 0 && (
                        <Section
                          title="Documents Diffusés expirés — à archiver"
                          subtitle={`${expiredDiffuse.length} document(s) dont la date de révision est dépassée`}
                          accentColor="#c2410c"
                        >
                          <DocTable
                            docs={expiredDiffuse}
                            showDaysOverdue
                            action={() => (
                              <span style={{ color: "#c2410c", fontSize: 11 }}>→ sera passé en Obsolète</span>
                            )}
                          />
                        </Section>
                      )}

                      {obsoletes.length > 0 && (
                        <Section
                          title="Documents Obsolètes — en attente d'archivage définitif"
                          subtitle={`${obsoletes.length} document(s) à archiver manuellement`}
                          accentColor="#d97706"
                        >
                          <DocTable
                            docs={obsoletes}
                            action={(doc) => can("archive:manage") ? (
                              <button
                                onClick={() => handleManualArchive(doc)}
                                style={{ display: "flex", alignItems: "center", gap: 5, background: BG, border: `1px solid ${BORDER}`, color: NAVY, borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = NAVY; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = BG; e.currentTarget.style.color = NAVY; }}>
                                <LuArchive size={12} /> Archiver
                              </button>
                            ) : (
                              <span style={{ display: "flex", alignItems: "center", gap: 4, color: MUTED, fontSize: 11 }}>
                                <LuLock size={11} /> Non autorisé
                              </span>
                            )}
                          />
                        </Section>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Archived tab */}
              {activeTab === "archived" && (
                <div>
                  {archived.length === 0 ? (
                    <Empty Icon={LuArchive} message="Aucun document archivé." />
                  ) : (
                    <Section
                      title="Documents archivés — historique conservé"
                      subtitle="Aucun document supprimé définitivement — conformité EF11"
                      accentColor="#475569"
                    >
                      <DocTable docs={archived} showArchivedAt />
                    </Section>
                  )}
                </div>
              )}

              {/* History tab */}
              {activeTab === "history" && (
                <div>
                  {history.length === 0 ? (
                    <Empty Icon={LuInbox} message="Aucune action d'archivage enregistrée." />
                  ) : (
                    <Section
                      title="Journal d'archivage (EF11)"
                      subtitle="Toutes les opérations : archivage auto, versions remplacées, changements de statut"
                      accentColor={GREEN}
                    >
                      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(46,74,107,0.06)" }}>
                        {history.map((entry, i) => {
                          const details = (() => {
                            try { return JSON.parse(entry.details); } catch { return {}; }
                          })();
                          const actionMeta = {
                            AUTO_ARCHIVE:       { color: "#c2410c", Icon: LuZap,         label: "Archivage auto"     },
                            VERSION_SUPERSEDED: { color: "#d97706", Icon: LuRefreshCw,    label: "Version remplacée"  },
                            STATUS_CHANGE:      { color: "#4338ca", Icon: LuArrowLeftRight,label: "Changement statut" },
                          }[entry.action] || { color: MUTED, Icon: LuFileText, label: entry.action };
                          const ActionIcon = actionMeta.Icon;

                          return (
                            <div key={entry.id}
                              style={{ display: "grid", gridTemplateColumns: "120px 130px 1fr 1fr 140px", padding: "11px 20px", alignItems: "center", borderBottom: i < history.length - 1 ? `1px solid ${BG}` : "none" }}>

                              <span style={{ color: MUTED, fontSize: 11 }}>
                                {entry.created_at
                                  ? new Date(entry.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" })
                                  : "—"}
                              </span>

                              <span style={{ color: actionMeta.color, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                                <ActionIcon size={13} /> {actionMeta.label}
                              </span>

                              <div>
                                <p style={{ margin: 0, color: GREEN, fontFamily: "monospace", fontWeight: 700, fontSize: 11 }}>{entry.doc_code}</p>
                                <p style={{ margin: 0, color: MUTED, fontSize: 11 }}>{entry.title}</p>
                              </div>

                              <span style={{ color: MUTED, fontSize: 11 }}>
                                {details.from && details.to
                                  ? <>{details.from} <span style={{ color: actionMeta.color }}>→</span> {details.to}</>
                                  : details.reason || details.change_summary || "—"}
                              </span>

                              <span style={{ color: MUTED, fontSize: 11 }}>{entry.user_name || "Système"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </Section>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
