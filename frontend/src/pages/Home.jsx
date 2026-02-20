// ============================================================
// pages/Home.jsx — ACTIA ES GED — Inter + Lucide icons
// ============================================================
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";
import UserSelector from "../components/UserSelector";
import {
  LuFileText, LuFilePlus, LuList, LuClipboardCheck, LuArchive,
  LuClock, LuCircleCheck, LuCircleAlert, LuShare2, LuTriangleAlert,
  LuPencil, LuPenLine, LuEye, LuCircleCheckBig,
  LuRefreshCw, LuShieldCheck, LuSearch, LuUsers,
  LuPlus, LuArrowRight, LuLogOut, LuInbox,
  LuUser,
} from "react-icons/lu";

const API = "http://localhost:4000/api";

/* ── ACTIA brand palette ─────────────────────────────────── */
const NAVY       = "#2e4a6b";
const NAVY_DARK  = "#1e3450";
const NAVY_LIGHT = "#3d5f84";
const GREEN      = "#4ab83f";
const GREEN_DARK = "#3a9a31";
const BG         = "#f0f3f6";
const BORDER     = "#dde4ec";
const MUTED      = "#6b82a0";
const SURFACE    = "#ffffff";

/* ── Status config — Lucide icon components ─────────────── */
const STATUS_CFG = {
  "Brouillon":     { bg:"#f3f4f6", text:"#6b7280", border:"#d1d5db",  Icon: LuPencil       },
  "En rédaction":  { bg:"#f0fdf4", text:"#166534", border:"#bbf7d0",  Icon: LuPenLine      },
  "En relecture":  { bg:"#eff6ff", text:"#1d4ed8", border:"#bfdbfe",  Icon: LuEye          },
  "En validation": { bg:"#eef2ff", text:"#3730a3", border:"#c7d2fe",  Icon: LuClipboardCheck},
  "Validé":        { bg:"#f0fdf4", text:"#15803d", border:"#86efac",  Icon: LuCircleCheckBig },
  "Diffusé":       { bg:"#f0fdfa", text:"#0f766e", border:"#99f6e4",  Icon: LuShare2       },
  "Obsolète":      { bg:"#fff7ed", text:"#c2410c", border:"#fed7aa",  Icon: LuTriangleAlert},
  "Archivé":       { bg:"#f8fafc", text:"#475569", border:"#cbd5e1",  Icon: LuArchive      },
};

const ROLE_COLOR = {
  "Admin GED":           "#ef4444",
  "Responsable Qualité": "#f59e0b",
  "Rédacteur":           "#3b82f6",
  "Validateur":          GREEN,
  "Lecteur":             MUTED,
};

/* ── Navbar ─────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/",            label: "Accueil",    end: true  },
  { to: "/list",        label: "Documents"             },
  { to: "/validations", label: "Validations"           },
  { to: "/archive",     label: "Archivage"             },
];

function Navbar() {
  const { currentUser, userRole, logout } = useUser();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = async () => { await logout(); navigate("/login", { replace: true }); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: NAVY_DARK,
      borderBottom: `1px solid ${NAVY_LIGHT}`,
      boxShadow: scrolled ? "0 4px 20px rgba(30,52,80,0.4)" : "0 2px 8px rgba(30,52,80,0.2)",
      transition: "box-shadow 0.25s",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <NavLink to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 2, padding: 6, background: NAVY, borderRadius: 8, border: `1px solid ${NAVY_LIGHT}` }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[...Array(4)].map((_, j) => (
                  <div key={j} style={{ width: 4, height: 4, borderRadius: 1, background: GREEN, opacity: (i+j)%2===0?1:0.5 }} />
                ))}
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 2, textTransform: "uppercase" }}>ACTIA</span>
              <span style={{ color: GREEN, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>ES</span>
            </div>
            <span style={{ color: MUTED, fontSize: 10, letterSpacing: 0.3 }}>GED · ISO 9001:2015</span>
          </div>
        </NavLink>

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              padding: "6px 14px", borderRadius: 7, textDecoration: "none",
              fontSize: 13, fontWeight: 500,
              color:      isActive ? "#fff"  : "#a8bfd4",
              background: isActive ? NAVY_LIGHT : "transparent",
              borderBottom: isActive ? `2px solid ${GREEN}` : "2px solid transparent",
              transition: "all 0.15s",
            })}>
              {label}
            </NavLink>
          ))}

          <NavLink to="/create" style={({ isActive }) => ({
            marginLeft: 10, padding: "8px 16px", borderRadius: 8,
            textDecoration: "none", fontSize: 13, fontWeight: 600,
            background: isActive ? GREEN_DARK : GREEN,
            color: "#fff",
            boxShadow: "0 2px 8px rgba(74,184,63,0.4)",
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.15s",
          })}>
            <LuPlus size={14} /> Nouveau
          </NavLink>

          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 14, paddingLeft: 14, borderLeft: `1px solid ${NAVY_LIGHT}` }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#e8f0f8", fontSize: 12, fontWeight: 600, margin: 0 }}>{currentUser.name}</p>
                <p style={{ color: ROLE_COLOR[userRole] || MUTED, fontSize: 10, fontWeight: 600, margin: 0 }}>{userRole}</p>
              </div>
              <button onClick={handleLogout} title="Déconnexion" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 34, borderRadius: 8,
                background: "transparent", border: `1px solid ${NAVY_LIGHT}`,
                color: MUTED, cursor: "pointer", transition: "all 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#3d1a1a"; e.currentTarget.style.color = "#ff7b72"; e.currentTarget.style.borderColor = "#6e2020"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = NAVY_LIGHT; }}
              >
                <LuLogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ── Stat card ───────────────────────────────────────────── */
function StatCard({ Icon, label, value, sub, accent = NAVY, accentBg = "#eef3fa", onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: SURFACE, border: `1px solid ${hovered && onClick ? accent : BORDER}`,
        borderRadius: 14, padding: "20px 22px", flex: 1, minWidth: 160,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        transform: hovered && onClick ? "translateY(-2px)" : "none",
        boxShadow: hovered && onClick ? `0 8px 24px rgba(46,74,107,0.14)` : "0 1px 4px rgba(46,74,107,0.06)",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${accent}18` }}>
          <Icon size={17} style={{ color: accent }} />
        </div>
        <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, margin: 0, fontWeight: 600 }}>{label}</p>
      </div>
      <p style={{ color: accent, fontWeight: 800, fontSize: 34, margin: 0, lineHeight: 1, letterSpacing: -1 }}>{value}</p>
      {sub && <p style={{ color: MUTED, fontSize: 11, margin: "6px 0 0" }}>{sub}</p>}
    </div>
  );
}

/* ── Feature card ────────────────────────────────────────── */
function FeatureCard({ Icon, title, desc, accent = NAVY, iconBg = "#eef3fa" }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: SURFACE, border: `1px solid ${hovered ? accent + "55" : BORDER}`,
        borderRadius: 14, padding: "22px", flex: 1, minWidth: 200,
        transition: "all 0.2s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 8px 24px rgba(46,74,107,0.12)" : "0 1px 4px rgba(46,74,107,0.06)",
      }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, border: `1px solid ${accent}18` }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
      <p style={{ color: NAVY, fontWeight: 600, fontSize: 14, margin: "0 0 6px", letterSpacing: -0.2 }}>{title}</p>
      <p style={{ color: MUTED, fontSize: 12, margin: 0, lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

/* ── Status pill ─────────────────────────────────────────── */
function StatusPill({ name }) {
  const s = STATUS_CFG[name] || { bg:"#f3f4f6", text:"#6b7280", border:"#d1d5db", Icon: LuFileText };
  const SI = s.Icon;
  return (
    <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
      <SI size={11} /> {name}
    </span>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [stats,        setStats]        = useState(null);
  const [recentDocs,   setRecentDocs]   = useState([]);
  const [pending,      setPending]      = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/documents/stats`),
      axios.get(`${API}/documents?page=1&limit=5`),
      axios.get(`${API}/validations/stats`),
    ])
      .then(([s, d, v]) => {
        setStats(s.data);
        setRecentDocs(d.data.data || []);
        setPending(v.data.pending_docs_count || 0);
      })
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }, []);

  const byStatus  = stats?.byStatus || {};
  const totalDocs = stats?.total    || 0;
  const overdue   = stats?.overdue  || 0;
  const archived  = byStatus["Archivé"] || 0;
  const validated = byStatus["Validé"]  || 0;

  const ISO_STEPS = ["Brouillon","En rédaction","En relecture","En validation","Validé","Diffusé","Obsolète","Archivé"];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: NAVY }}>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────── */}
      <section style={{ background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 60%, ${NAVY_LIGHT} 100%)`, padding: "60px 32px 80px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(74,184,63,0.15)", border: "1px solid rgba(74,184,63,0.4)", borderRadius: 99, padding: "5px 16px", marginBottom: 24 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
            <span style={{ color: GREEN, fontSize: 12, fontWeight: 600, letterSpacing: 0.3 }}>ISO 9001:2015 — Système en ligne</span>
          </div>

          <h1 style={{ margin: "0 0 16px", fontSize: "clamp(26px,4vw,46px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: -1, color: "#fff" }}>
            Gestion Électronique{" "}
            <span style={{ color: GREEN }}>des Documents</span>
          </h1>

          <p style={{ color: "#a8bfd4", fontSize: 16, maxWidth: 520, lineHeight: 1.7, margin: "0 0 32px", fontWeight: 400 }}>
            Plateforme centralisée de gestion documentaire pour ACTIA Engineering Services. Conformité ISO, traçabilité complète et workflow de validation.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => navigate("/create")} className="btn-primary" style={{ fontSize: 14, padding: "12px 28px", gap: 8 }}>
              <LuFilePlus size={16} /> Nouveau document
            </button>
            <button onClick={() => navigate("/list")} className="btn-secondary" style={{ fontSize: 14, padding: "12px 28px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", gap: 8 }}
              onMouseEnter={(e) => { e.currentTarget.style.background="rgba(255,255,255,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background="rgba(255,255,255,0.1)"; }}
            >
              Voir les documents <LuArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats row (overlapping hero) ─────────────── */}
      <div style={{ maxWidth: 1280, margin: "-36px auto 0", padding: "0 32px 0" }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <StatCard Icon={LuFileText}    label="Total documents"   value={loadingStats?"…":totalDocs} sub="dans le système"      onClick={() => navigate("/list")}        accent={NAVY}        accentBg="#eef3fa" />
          <StatCard Icon={LuClock}       label="En validation"     value={loadingStats?"…":pending}   sub="en attente"           onClick={() => navigate("/validations")} accent={pending>0?"#4338ca":GREEN} accentBg={pending>0?"#eef2ff":"#f0fdf4"} />
          <StatCard Icon={LuCircleCheck} label="Validés"           value={loadingStats?"…":validated} sub="documents approuvés"  onClick={() => navigate("/list")}        accent="#15803d"     accentBg="#f0fdf4" />
          <StatCard Icon={LuCircleAlert} label="En retard"         value={loadingStats?"…":overdue}   sub="révision dépassée"    onClick={() => navigate("/list")}        accent={overdue>0?"#c2410c":"#15803d"} accentBg={overdue>0?"#fff7ed":"#f0fdf4"} />
          <StatCard Icon={LuArchive}     label="Archivés"          value={loadingStats?"…":archived}  sub="archivage définitif"  onClick={() => navigate("/archive")}     accent={MUTED}       accentBg="#f8fafc" />
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px 80px" }}>

        {/* ── Pipeline ISO ──────────────────────────── */}
        <div className="card" style={{ marginBottom: 28 }}>
          <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, margin: "0 0 18px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 3, height: 14, background: GREEN, borderRadius: 99 }} />
            Pipeline ISO — Répartition par statut
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ISO_STEPS.map((label) => {
              const s   = STATUS_CFG[label] || {};
              const SI  = s.Icon || LuFileText;
              const cnt = byStatus[label] || 0;
              const pct = totalDocs > 0 ? Math.round((cnt / totalDocs) * 100) : 0;
              return (
                <div key={label} onClick={() => navigate("/list")} style={{ flex: 1, minWidth: 88, cursor: "pointer" }}>
                  <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "12px 8px", textAlign: "center", transition: "box-shadow 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow="0 4px 12px rgba(46,74,107,0.12)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow="none"}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                      <SI size={20} style={{ color: s.text }} />
                    </div>
                    <p style={{ margin: 0, color: s.text, fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>{cnt}</p>
                  </div>
                  <p style={{ color: MUTED, fontSize: 10, margin: "4px 0 0", textAlign: "center", lineHeight: 1.3, fontWeight: 500 }}>{label}</p>
                  {totalDocs > 0 && <p style={{ color: s.text, fontSize: 10, margin: "1px 0 0", textAlign: "center", fontWeight: 600 }}>{pct}%</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Quick actions + Recent docs ───────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>

          {/* Quick actions */}
          <div className="card">
            <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 3, height: 14, background: GREEN, borderRadius: 99 }} />
              Actions rapides
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { to:"/create",      Icon:LuFilePlus,      label:"Nouveau document",   desc:"Créer et soumettre un document",    accent:NAVY,      bg:"#eef3fa" },
                { to:"/list",        Icon:LuList,          label:"Liste des documents", desc:"Rechercher, filtrer, gérer",         accent:"#1d4ed8", bg:"#eff6ff" },
                { to:"/validations", Icon:LuClipboardCheck,label:"Workflow validation",  desc:"Approuver ou rejeter des documents", accent:GREEN,     bg:"#f0fdf4" },
                { to:"/archive",     Icon:LuArchive,       label:"Archivage ISO",       desc:"Gestion du cycle de vie EF11",       accent:MUTED,     bg:"#f8fafc" },
              ].map(({ to, Icon, label, desc, accent, bg }) => (
                <NavLink key={to} to={to} style={{ textDecoration: "none" }}>
                  {({ isActive }) => (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 10,
                      background: isActive ? bg : "#fafbfc",
                      border: `1px solid ${isActive ? accent + "55" : BORDER}`,
                      transition: "all 0.15s", cursor: "pointer",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background=bg; e.currentTarget.style.borderColor=accent+"55"; }}
                      onMouseLeave={(e) => { if(!isActive){e.currentTarget.style.background="#fafbfc"; e.currentTarget.style.borderColor=BORDER;} }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: isActive?bg:"#eef3fa", border:`1px solid ${accent}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Icon size={17} style={{ color: isActive ? accent : NAVY }} />
                      </div>
                      <div>
                        <p style={{ margin:0, color:isActive?accent:NAVY, fontWeight:600, fontSize:13, letterSpacing:-0.2 }}>{label}</p>
                        <p style={{ margin:"2px 0 0", color:MUTED, fontSize:11 }}>{desc}</p>
                      </div>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Recent documents */}
          <div className="card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <p style={{ color:MUTED, fontSize:11, textTransform:"uppercase", letterSpacing:1, fontWeight:600, margin:0, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ display:"inline-block", width:3, height:14, background:GREEN, borderRadius:99 }} />
                Documents récents
              </p>
              <NavLink to="/list" style={{ color:GREEN, fontSize:11, textDecoration:"none", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                Voir tout <LuArrowRight size={12} />
              </NavLink>
            </div>

            {loadingStats ? (
              <p style={{ color:MUTED, fontSize:13, textAlign:"center", padding:"30px 0" }}>Chargement…</p>
            ) : recentDocs.length === 0 ? (
              <div style={{ textAlign:"center", padding:"30px 0" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
                  <LuInbox size={36} style={{ color: BORDER }} />
                </div>
                <p style={{ color:MUTED, fontSize:12, margin:"0 0 10px" }}>Aucun document créé</p>
                <NavLink to="/create" style={{ display:"inline-flex", alignItems:"center", gap:5, color:GREEN, fontSize:12, textDecoration:"none", fontWeight:600 }}>
                  <LuFilePlus size={13} /> Créer le premier
                </NavLink>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {recentDocs.map((doc) => (
                  <div key={doc.id} onClick={() => navigate("/list")}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:8, background:"#fafbfc", border:`1px solid ${BORDER}`, cursor:"pointer", transition:"background 0.12s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background="#eef3fa"}
                    onMouseLeave={(e) => e.currentTarget.style.background="#fafbfc"}
                  >
                    <div style={{ overflow:"hidden" }}>
                      <p style={{ margin:0, color:GREEN, fontWeight:700, fontSize:12, fontFamily:"monospace" }}>{doc.doc_code}</p>
                      <p style={{ margin:"2px 0 0", color:MUTED, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:210 }}>{doc.title}</p>
                    </div>
                    <StatusPill name={doc.status_name} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Features ──────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <p style={{ color:MUTED, fontSize:11, textTransform:"uppercase", letterSpacing:1.5, fontWeight:600, marginBottom:8 }}>Fonctionnalités</p>
            <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:NAVY, letterSpacing:-0.5 }}>Conformité ISO 9001:2015</h2>
          </div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            <FeatureCard Icon={LuRefreshCw}     title="Cycle de vie ISO"      desc="Workflow complet : Brouillon → Rédaction → Relecture → Validation → Diffusion → Obsolescence → Archivage." accent={NAVY}     iconBg="#eef3fa" />
            <FeatureCard Icon={LuCircleCheckBig}  title="Validation EF05/EF06"  desc="Séparation des rôles Rédacteur ≠ Validateur. Signature numérique SHA-256. Immuabilité garantie."            accent="#15803d" iconBg="#f0fdf4" />
            <FeatureCard Icon={LuShieldCheck}   title="Traçabilité EF14"      desc="Audit trail complet et infalsifiable. Chaque action est horodatée et enregistrée avec preuve cryptographique." accent="#6d28d9" iconBg="#f5f3ff" />
            <FeatureCard Icon={LuArchive}       title="Archivage EF11"        desc="Archivage automatique des documents expirés. Historique conservé indéfiniment, aucune suppression physique."  accent="#b45309" iconBg="#fffbeb" />
            <FeatureCard Icon={LuSearch}        title="Recherche avancée"     desc="Filtres multicritères : type, statut, responsable, mot-clé, processus, date. Pagination côté serveur."       accent="#0f766e" iconBg="#f0fdfa" />
            <FeatureCard Icon={LuUsers}         title="Gestion des rôles"     desc="5 rôles ISO : Admin GED, Responsable Qualité, Rédacteur, Validateur, Lecteur. Contrôle d'accès granulaire."  accent="#c2410c" iconBg="#fff7ed" />
          </div>
        </div>

        {/* ── User profile ──────────────────────────── */}
        <div className="card" style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:24, alignItems:"center" }}>
          <div>
            <p style={{ color:MUTED, fontSize:11, textTransform:"uppercase", letterSpacing:1, fontWeight:600, margin:"0 0 6px", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ display:"inline-block", width:3, height:14, background:GREEN, borderRadius:99 }} />
              Profil utilisateur
            </p>
            {currentUser ? (
              <>
                <p style={{ margin:0, color:NAVY, fontWeight:700, fontSize:18, letterSpacing:-0.3 }}>{currentUser.name}</p>
                <p style={{ margin:"3px 0 0", color:MUTED, fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
                  <LuUser size={12} />
                  <span style={{ color:ROLE_COLOR[currentUser.role]||NAVY, fontWeight:600 }}>{currentUser.role}</span>
                  <span style={{ color: BORDER }}>·</span>
                  {currentUser.email||"—"}
                </p>
              </>
            ) : (
              <p style={{ margin:0, color:MUTED, fontSize:13 }}>Aucun utilisateur sélectionné.</p>
            )}
          </div>
          <div style={{ minWidth: 200 }}><UserSelector /></div>
        </div>

      </div>

      {/* ── Footer ──────────────────────────────────── */}
      <footer style={{ borderTop:`1px solid ${BORDER}`, background: NAVY_DARK, padding:"18px 32px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
          <p style={{ margin:0, color:"#6b82a0", fontSize:11 }}>
            © 2025 <span style={{ color:GREEN, fontWeight:600 }}>ACTIA Engineering Services</span> — GED · ISO 9001:2015
          </p>
          <div style={{ display:"flex", gap:20 }}>
            {[{to:"/list",label:"Documents"},{to:"/validations",label:"Validations"},{to:"/archive",label:"Archivage"}].map(({to,label})=>(
              <NavLink key={to} to={to} style={{ color:"#6b82a0", fontSize:11, textDecoration:"none", transition:"color 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.color=GREEN}
                onMouseLeave={(e) => e.currentTarget.style.color="#6b82a0"}
              >{label}</NavLink>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
