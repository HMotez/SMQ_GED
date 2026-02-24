// ============================================================
// pages/Home.jsx — ACTIA ES GED · Login-Style Premium Dark Design
// ============================================================

import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import logoImg from "../assets/Logo.png";
import { useUser } from "../context/UserContext";
import UserSelector from "../components/UserSelector";
import {
  LuFileText, LuFilePlus, LuList, LuClipboardCheck, LuArchive,
  LuClock, LuCircleCheck, LuCircleAlert, LuShare2, LuTriangleAlert,
  LuPencil, LuPenLine, LuEye, LuCircleCheckBig,
  LuRefreshCw, LuShieldCheck, LuSearch, LuUsers,
  LuPlus, LuArrowRight, LuLogOut, LuInbox, LuUser, LuZap, LuAward,
} from "react-icons/lu";

const API = "http://localhost:4000/api";

/* ── Status & Role config ────────────────────────────────── */
const STATUS_CFG = {
  "Brouillon":     { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)", Icon: LuPencil         },
  "En rédaction":  { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(187,247,208,0.15)", Icon: LuPenLine        },
  "En relecture":  { bg:"rgba(239,246,255,0.08)", text:"#60a5fa", border:"rgba(191,219,254,0.15)", Icon: LuEye            },
  "En validation": { bg:"rgba(238,242,255,0.08)", text:"#a5b4fc", border:"rgba(199,210,254,0.15)", Icon: LuClipboardCheck },
  "Validé":        { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(134,239,172,0.2)",  Icon: LuCircleCheckBig },
  "Diffusé":       { bg:"rgba(240,253,250,0.08)", text:"#2dd4bf", border:"rgba(153,246,228,0.15)", Icon: LuShare2         },
  "Obsolète":      { bg:"rgba(255,247,237,0.08)", text:"#fb923c", border:"rgba(254,215,170,0.15)", Icon: LuTriangleAlert  },
  "Archivé":       { bg:"rgba(248,250,252,0.06)", text:"#94a3b8", border:"rgba(203,213,225,0.12)", Icon: LuArchive        },
};

const ROLE_COLOR = {
  "Admin GED":           "#f87171",
  "Responsable Qualité": "#fbbf24",
  "Rédacteur":           "#60a5fa",
  "Validateur":          "#4ade80",
  "Lecteur":             "#94a3b8",
};

const NAV_ITEMS = [
  { to: "/",            label: "Accueil",         end: true },
  { to: "/dashboard",   label: "Tableau de bord"           },
  { to: "/list",        label: "Documents"                 },
  { to: "/validations", label: "Validations"               },
  { to: "/archive",     label: "Archivage"                 },
];

/* ── Animation styles ─────────────────────────────────── */
const ANIMATION_STYLES = `
  @keyframes floatY {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-6px); }
  }
  .dot-float { animation: floatY 3s ease-in-out infinite; }
`;

/* ── Navbar ─────────────────────────────────────────────── */
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
    <nav
      className="sticky top-0 z-50 border-b transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(10,20,32,0.92)"
          : "rgba(15,30,48,0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
      }}
    >
      <style>{ANIMATION_STYLES}</style>
      <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <NavLink to="/" className="no-underline">
          <img
            src={logoImg}
            alt="ACTIA ES"
            className="h-10 w-auto transition-opacity duration-200 opacity-90 hover:opacity-100"
            style={{ filter: "drop-shadow(0 2px 10px rgba(74,184,63,0.3))" }}
          />
        </NavLink>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg no-underline text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-[#a8bfd4] hover:text-white"
                }`
              }
              style={({ isActive }) => isActive ? {
                background: "rgba(255,255,255,0.1)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
              } : {}}
            >
              {label}
            </NavLink>
          ))}

          <NavLink
            to="/create"
            className="ml-2 px-4 py-2 rounded-xl no-underline text-sm font-semibold flex items-center gap-1.5 text-white transition-all duration-200 hover:-translate-y-px"
            style={{
              background: "linear-gradient(135deg, #4ab83f, #3da333)",
              boxShadow: "0 4px 16px rgba(74,184,63,0.35)",
            }}
          >
            <LuPlus size={14} /> Nouveau
          </NavLink>

          {currentUser && (
            <div
              className="flex items-center gap-2.5 ml-3 pl-3.5"
              style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="text-right">
                <p className="text-white text-sm font-semibold m-0">{currentUser.name}</p>
                <p className="text-xs font-semibold m-0" style={{ color: ROLE_COLOR[userRole] || "#94a3b8" }}>{userRole}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Déconnexion"
                className="flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "#94a3b8",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                  e.currentTarget.style.color = "#f87171";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#94a3b8";
                }}
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

/* ── Glass Card (login-style) ────────────────────────────── */
function GlassCard({ children, className = "", style = {} }) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.1)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Stat Card (dark glass) ──────────────────────────────── */
function StatCard({ Icon, label, value, sub, accent = "#60a5fa", onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex-1 min-w-[150px] rounded-2xl border p-5 transition-all duration-200 cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px ${accent}30, inset 0 1px 0 rgba(255,255,255,0.1)`;
        e.currentTarget.style.borderColor = `${accent}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <Icon size={17} style={{ color: accent }} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color: "rgba(168,191,212,0.6)" }}>{label}</p>
      </div>
      <p className="font-black text-4xl m-0 leading-none text-white" style={{ letterSpacing: -1 }}>{value}</p>
      {sub && <p className="text-sm m-0 mt-1.5" style={{ color: "rgba(168,191,212,0.55)" }}>{sub}</p>}
    </div>
  );
}

/* ── Status Pill (dark) ──────────────────────────────────── */
function StatusPill({ name }) {
  const s = STATUS_CFG[name] || STATUS_CFG["Brouillon"];
  const SI = s.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      <SI size={10} /> {name}
    </span>
  );
}

/* ── Section Label ───────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-0.5 h-4 rounded-full" style={{ background: "#4ab83f" }} />
      <p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color: "rgba(168,191,212,0.7)" }}>{children}</p>
    </div>
  );
}

/* ── Feature Card (dark glass) ───────────────────────────── */
function FeatureCard({ Icon, title, desc, accent = "#60a5fa" }) {
  return (
    <div
      className="flex-1 min-w-[200px] rounded-2xl border p-5 transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = `${accent}35`;
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px ${accent}20`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.15)";
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5"
        style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>
      <p className="text-white font-semibold text-sm m-0 mb-1.5" style={{ letterSpacing: -0.2 }}>{title}</p>
      <p className="text-sm m-0 leading-relaxed" style={{ color: "rgba(168,191,212,0.6)" }}>{desc}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [stats, setStats]               = useState(null);
  const [recentDocs, setRecentDocs]     = useState([]);
  const [pending, setPending]           = useState(0);
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
  const archived  = byStatus["Archivé"]  || 0;
  const validated = byStatus["Validé"]   || 0;

  const ISO_STEPS = ["Brouillon","En rédaction","En relecture","En validation","Validé","Diffusé","Obsolète","Archivé"];

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(145deg, #0a1420 0%, #0f1e30 35%, #1a2f4a 70%, #1e3a55 100%)",
      }}
    >
      {/* Background decorative orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute rounded-full"
          style={{
            width: 600, height: 600,
            top: -200, right: -150,
            background: "radial-gradient(circle, rgba(74,184,63,0.06) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500,
            bottom: -100, left: -100,
            background: "radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar />

        {/* ── HERO ──────────────────────────────────── */}
        <section className="px-8 pt-20 pb-28 text-center">
          <div className="max-w-[860px] mx-auto">

            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-7 border"
              style={{
                background: "rgba(74,184,63,0.1)",
                borderColor: "rgba(74,184,63,0.25)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{
                  background: "#4ab83f",
                  boxShadow: "0 0 8px rgba(74,184,63,0.6)",
                }}
              />
              <span className="text-sm font-semibold" style={{ color: "#4ab83f" }}>
                ISO 9001:2015 — Système en ligne
              </span>
            </div>

            <h1
              className="m-0 mb-5 font-black text-white"
              style={{
                fontSize: "clamp(28px, 4.5vw, 52px)",
                lineHeight: 1.1,
                letterSpacing: -1.5,
                textShadow: "0 4px 30px rgba(0,0,0,0.4)",
              }}
            >
              Gestion Électronique{" "}
              <span
                style={{
                  color: "#4ab83f",
                  textShadow: "0 0 40px rgba(74,184,63,0.4)",
                }}
              >
                des Documents
              </span>
            </h1>

            <p
              className="text-lg max-w-[520px] mx-auto leading-relaxed m-0 mb-10"
              style={{ color: "rgba(168,191,212,0.8)" }}
            >
              Plateforme centralisée de gestion documentaire pour ACTIA Engineering Services.
              Conformité ISO, traçabilité complète et workflow de validation.
            </p>

            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => navigate("/create")}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #4ab83f, #3da333)",
                  boxShadow: "0 8px 30px rgba(74,184,63,0.4)",
                  fontSize: 15,
                }}
              >
                <LuFilePlus size={16} /> Nouveau document
              </button>
              <button
                onClick={() => navigate("/list")}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(10px)",
                  fontSize: 15,
                }}
              >
                Voir les documents <LuArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ── STATS ROW ─────────────────────────────── */}
        <div className="max-w-[1280px] mx-auto px-8 -mt-14 mb-8">
          <div className="flex gap-3.5 flex-wrap">
            <StatCard Icon={LuFileText}    label="Total documents" value={loadingStats ? "…" : totalDocs} sub="dans le système"     accent="#60a5fa" onClick={() => navigate("/list")}        />
            <StatCard Icon={LuClock}       label="En validation"   value={loadingStats ? "…" : pending}   sub="en attente"          accent={pending > 0 ? "#a5b4fc" : "#4ade80"} onClick={() => navigate("/validations")} />
            <StatCard Icon={LuCircleCheck} label="Validés"         value={loadingStats ? "…" : validated}  sub="documents approuvés" accent="#4ade80" onClick={() => navigate("/list")}        />
            <StatCard Icon={LuCircleAlert} label="En retard"       value={loadingStats ? "…" : overdue}    sub="révision dépassée"   accent={overdue > 0 ? "#fb923c" : "#4ade80"} onClick={() => navigate("/list")} />
            <StatCard Icon={LuArchive}     label="Archivés"        value={loadingStats ? "…" : archived}   sub="archivage définitif" accent="#94a3b8" onClick={() => navigate("/archive")}    />
          </div>
        </div>

        {/* ── MAIN CONTENT ──────────────────────────── */}
        <div className="max-w-[1280px] mx-auto px-8 pb-20 space-y-6">

          {/* ISO Pipeline */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <LuRefreshCw size={16} style={{ color: "#4ab83f" }} />
              <p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color: "rgba(168,191,212,0.7)" }}>Pipeline ISO — Répartition par statut</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ISO_STEPS.map((label) => {
                const s   = STATUS_CFG[label] || {};
                const SI  = s.Icon || LuFileText;
                const cnt = byStatus[label] || 0;
                const pct = totalDocs > 0 ? Math.round((cnt / totalDocs) * 100) : 0;
                return (
                  <div
                    key={label}
                    onClick={() => navigate("/list")}
                    className="flex-1 min-w-[80px] cursor-pointer group"
                  >
                    <div
                      className="rounded-xl px-2 py-3 text-center border transition-all duration-200 group-hover:-translate-y-0.5"
                      style={{
                        background: s.bg,
                        borderColor: s.border,
                      }}
                    >
                      <div className="flex justify-center mb-1.5">
                        <SI size={18} style={{ color: s.text }} />
                      </div>
                      <p className="m-0 font-black text-2xl text-white" style={{ letterSpacing: -0.5 }}>{cnt}</p>
                    </div>
                    <p className="text-xs mt-1 text-center leading-tight font-medium m-0" style={{ color: "rgba(168,191,212,0.55)" }}>{label}</p>
                    {totalDocs > 0 && (
                      <p className="text-xs m-0 mt-0.5 text-center font-bold" style={{ color: s.text }}>{pct}%</p>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Quick actions + Recent docs */}
          <div className="grid grid-cols-2 gap-6">

            {/* Quick actions */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <LuZap size={16} style={{ color: "#4ab83f" }} />
                <p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color: "rgba(168,191,212,0.7)" }}>Actions rapides</p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { to:"/create",      Icon:LuFilePlus,       label:"Nouveau document",    desc:"Créer et soumettre un document",     accent:"#4ab83f"  },
                  { to:"/list",        Icon:LuList,           label:"Liste des documents",  desc:"Rechercher, filtrer, gérer",         accent:"#60a5fa"  },
                  { to:"/validations", Icon:LuClipboardCheck, label:"Workflow validation",   desc:"Approuver ou rejeter des documents",  accent:"#a5b4fc"  },
                  { to:"/archive",     Icon:LuArchive,        label:"Archivage ISO",        desc:"Gestion du cycle de vie EF11",       accent:"#94a3b8"  },
                ].map(({ to, Icon, label, desc, accent }) => (
                  <NavLink key={to} to={to} className="no-underline">
                    {({ isActive }) => (
                      <div
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-200 cursor-pointer"
                        style={{
                          background: isActive ? `${accent}12` : "rgba(255,255,255,0.03)",
                          borderColor: isActive ? `${accent}35` : "rgba(255,255,255,0.07)",
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = `${accent}08`;
                            e.currentTarget.style.borderColor = `${accent}25`;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                          }
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                        >
                          <Icon size={16} style={{ color: accent }} />
                        </div>
                        <div>
                          <p className="m-0 font-semibold text-sm text-white" style={{ letterSpacing: -0.2 }}>{label}</p>
                          <p className="m-0 mt-0.5 text-xs" style={{ color: "rgba(168,191,212,0.55)" }}>{desc}</p>
                        </div>
                        <LuArrowRight
                          size={14}
                          className="ml-auto"
                          style={{ color: isActive ? accent : "rgba(168,191,212,0.3)" }}
                        />
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </GlassCard>

            {/* Recent docs */}
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-4 rounded-full" style={{ background: "#4ab83f" }} />
                  <LuClock size={14} style={{ color: "rgba(168,191,212,0.7)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color: "rgba(168,191,212,0.7)" }}>Documents récents</p>
                </div>
                <NavLink
                  to="/list"
                  className="no-underline text-xs font-semibold flex items-center gap-1 transition-colors"
                  style={{ color: "#4ab83f" }}
                >
                  Voir tout <LuArrowRight size={11} />
                </NavLink>
              </div>

              {loadingStats ? (
                <p className="text-center py-8 text-sm" style={{ color: "rgba(168,191,212,0.5)" }}>Chargement…</p>
              ) : recentDocs.length === 0 ? (
                <div className="text-center py-8">
                  <LuInbox size={36} className="mx-auto mb-3" style={{ color: "rgba(168,191,212,0.25)" }} />
                  <p className="text-sm m-0 mb-3" style={{ color: "rgba(168,191,212,0.5)" }}>Aucun document créé</p>
                  <NavLink
                    to="/create"
                    className="inline-flex items-center gap-1.5 text-sm no-underline font-semibold"
                    style={{ color: "#4ab83f" }}
                  >
                    <LuFilePlus size={13} /> Créer le premier
                  </NavLink>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {recentDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => navigate("/list")}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all duration-150"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        borderColor: "rgba(255,255,255,0.06)",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                        e.currentTarget.style.borderColor = "rgba(74,184,63,0.2)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      }}
                    >
                      <div className="overflow-hidden">
                        <p className="m-0 font-bold text-sm font-mono" style={{ color: "#4ab83f" }}>{doc.doc_code}</p>
                        <p className="m-0 mt-0.5 text-sm truncate max-w-[200px]" style={{ color: "rgba(168,191,212,0.65)" }}>{doc.title}</p>
                      </div>
                      <StatusPill name={doc.status_name} />
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Features */}
          <div>
            <div className="text-center mb-7">
              <p
                className="text-xs uppercase tracking-widest font-semibold mb-3 flex items-center justify-center gap-1.5"
                style={{ color: "rgba(168,191,212,0.5)" }}
              >
                <LuAward size={12} style={{ color: "#4ab83f" }} />
                Fonctionnalités
              </p>
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-1 h-8 rounded-full" style={{ background: "linear-gradient(to bottom, #4ab83f, rgba(74,184,63,0.2))" }} />
                <h2
                  className="m-0 text-3xl font-black text-white"
                  style={{ letterSpacing: -1, textShadow: "0 4px 20px rgba(74,184,63,0.3)" }}
                >
                  Conformité ISO 9001:2015
                </h2>
                <div className="w-1 h-8 rounded-full" style={{ background: "linear-gradient(to bottom, rgba(74,184,63,0.2), #4ab83f)" }} />
              </div>
              <p className="text-sm m-0 mt-2" style={{ color: "rgba(168,191,212,0.6)" }}>Système de gestion documentaire certifié — Traçabilité, sécurité et archivage normalisés</p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <FeatureCard Icon={LuRefreshCw}      accent="#60a5fa" title="Cycle de vie ISO"      desc="Workflow complet : Brouillon → Rédaction → Relecture → Validation → Diffusion → Obsolescence → Archivage." />
              <FeatureCard Icon={LuCircleCheckBig} accent="#4ade80" title="Validation EF05/EF06"  desc="Séparation des rôles Rédacteur ≠ Validateur. Signature numérique SHA-256. Immuabilité garantie." />
              <FeatureCard Icon={LuShieldCheck}    accent="#a78bfa" title="Traçabilité EF14"      desc="Audit trail complet et infalsifiable. Chaque action est horodatée et enregistrée avec preuve cryptographique." />
              <FeatureCard Icon={LuArchive}        accent="#fbbf24" title="Archivage EF11"        desc="Archivage automatique des documents expirés. Historique conservé indéfiniment, aucune suppression physique." />
              <FeatureCard Icon={LuSearch}         accent="#2dd4bf" title="Recherche avancée"     desc="Filtres multicritères : type, statut, responsable, mot-clé, processus, date. Pagination côté serveur." />
              <FeatureCard Icon={LuUsers}          accent="#fb923c" title="Gestion des rôles"     desc="5 rôles ISO : Admin GED, Responsable Qualité, Rédacteur, Validateur, Lecteur. Contrôle d'accès granulaire." />
            </div>
          </div>

          {/* User profile */}
          <GlassCard className="p-6">
            <div className="grid grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-0.5 h-4 rounded-full" style={{ background: "#4ab83f" }} />
                  <LuUser size={14} style={{ color: "rgba(168,191,212,0.7)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color: "rgba(168,191,212,0.7)" }}>Profil utilisateur</p>
                </div>
                {currentUser ? (
                  <>
                    <p className="m-0 text-white font-bold text-xl" style={{ letterSpacing: -0.3 }}>{currentUser.name}</p>
                    <p className="m-0 mt-1 text-sm flex items-center gap-1.5" style={{ color: "rgba(168,191,212,0.6)" }}>
                      <LuUser size={12} />
                      <span className="font-semibold" style={{ color: ROLE_COLOR[currentUser.role] || "#60a5fa" }}>{currentUser.role}</span>
                      <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                      {currentUser.email || "—"}
                    </p>
                  </>
                ) : (
                  <p className="m-0 text-sm" style={{ color: "rgba(168,191,212,0.5)" }}>Aucun utilisateur sélectionné.</p>
                )}
              </div>
              <div className="min-w-[200px]">
                <UserSelector />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ── FOOTER ────────────────────────────────── */}
        <footer
          className="border-t px-8 py-5"
          style={{
            background: "rgba(10,20,32,0.6)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="max-w-[1280px] mx-auto flex justify-between items-center flex-wrap gap-2.5">
            <p className="m-0 text-xs" style={{ color: "rgba(168,191,212,0.45)" }}>
              © 2025{" "}
              <span className="font-semibold" style={{ color: "#4ab83f" }}>ACTIA Engineering Services</span>
              {" "}— GED · ISO 9001:2015
            </p>
            <div className="flex gap-5">
              {[{ to:"/list", label:"Documents" }, { to:"/validations", label:"Validations" }, { to:"/archive", label:"Archivage" }].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className="text-xs no-underline transition-colors"
                  style={{ color: "rgba(168,191,212,0.45)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#4ab83f"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(168,191,212,0.45)"; }}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}