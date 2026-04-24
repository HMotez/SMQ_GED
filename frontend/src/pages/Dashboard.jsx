// ============================================================
// pages/Dashboard.jsx — ACTIA ES GED — Login-Style Dark Design
// ============================================================
import { useEffect, useState, useCallback, useRef } from "react";
import { NavLink, useNavigate, useMatch, useLocation } from "react-router-dom";
import axios from "axios";
import logoImg from "../assets/Logo.png";
import { useUser } from "../context/UserContext";
import NotificationBell from "../components/NotificationBell";
import DocDetailModal from "../components/DocDetailModal";
import {
  LuShieldCheck, LuList, LuSearch, LuUsers,
  LuClipboardCheck, LuClock, LuCircleAlert, LuCircleCheck,
  LuTriangleAlert, LuRefreshCw, LuArrowRight,
  LuLogOut, LuPlus, LuUser,
  LuHouse, LuLayoutDashboard, LuFileText, LuArchive, LuCpu, LuGitBranch,
} from "react-icons/lu";

import { API } from "../config";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

/* ── Animation styles ──────────────────────────────────── */
const ANIMATION_STYLES = `
  @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .dot-float { animation: floatY 3s ease-in-out infinite; }
  @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.86); } to { opacity: 1; transform: scale(1); } }
  @keyframes shimmerPass { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
  @keyframes pulseGlowDot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.7); } }
  .anim-slide-up { animation: fadeSlideUp 0.55s cubic-bezier(.22,.68,0,1.2) both; }
  .anim-fade-in  { animation: fadeIn 0.45s ease both; }
  .anim-scale-in { animation: scaleIn 0.52s cubic-bezier(.34,1.56,.64,1) both; }
  .chart-row { cursor:pointer; border-radius:10px; padding:6px 10px; margin:-6px -10px; transition:background 0.18s,transform 0.18s; position:relative; overflow:hidden; }
  .chart-row:hover  { background:rgba(255,255,255,0.05); transform:translateX(4px); }
  .chart-row:active { transform:translateX(4px) scale(0.98); }
  .dot-pulse { animation: pulseGlowDot 1.8s ease-in-out infinite; }
`;

const GREEN      = "#4ab83f";

const STATUS_COLORS = {
  "Brouillon":     "#9ca3af",
  "En rédaction":  "#4ade80",
  "En relecture":  "#60a5fa",
  "En validation": "#a5b4fc",
  "Validé":        "#4ade80",
  "Diffusé":       "#2dd4bf",
  "Obsolète":      "#fb923c",
  "Archivé":       "#94a3b8",
};

const STATUS_CFG = {
  "Brouillon":     { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)" },
  "En rédaction":  { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(187,247,208,0.15)" },
  "En relecture":  { bg:"rgba(239,246,255,0.08)", text:"#60a5fa", border:"rgba(191,219,254,0.15)" },
  "En validation": { bg:"rgba(238,242,255,0.08)", text:"#a5b4fc", border:"rgba(199,210,254,0.15)" },
  "Validé":        { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(134,239,172,0.2)"  },
  "Diffusé":       { bg:"rgba(240,253,250,0.08)", text:"#2dd4bf", border:"rgba(153,246,228,0.15)" },
  "Obsolète":      { bg:"rgba(255,247,237,0.08)", text:"#fb923c", border:"rgba(254,215,170,0.15)" },
  "Archivé":       { bg:"rgba(248,250,252,0.06)", text:"#94a3b8", border:"rgba(203,213,225,0.12)" },
};
const ROLE_COLOR = {
  "Admin":        "#f87171",
  "Ing. Qualité": "#2dd4bf",
  "Reviewer":     "#4ade80",
};

const NAV_ITEMS_BY_ROLE = {
  "Admin": [
    { to: "/dashboard",   label: "Tableau de bord",            Icon: LuLayoutDashboard },
    { to: "/list",        label: "Documents",                  Icon: LuFileText        },
    { to: "/validations", label: "Validations",                Icon: LuClipboardCheck  },
    { to: "/archive",     label: "Archivage",                  Icon: LuArchive         },
    { to: "/workflow",    label: "Workflow",                   Icon: LuGitBranch       },
    { to: "/ai",          label: "Assistant IA",               Icon: LuCpu             },
  ],
  "Ing. Qualité": [
    { to: "/dashboard",   label: "Tableau de bord",            Icon: LuLayoutDashboard },
    { to: "/list",        label: "Documents",                  Icon: LuFileText        },
    { to: "/validations", label: "Validations",                Icon: LuClipboardCheck  },
    { to: "/archive",     label: "Archivage",                  Icon: LuArchive         },
    { to: "/workflow",    label: "Workflow",                   Icon: LuGitBranch       },
    { to: "/ai",          label: "Assistant IA",               Icon: LuCpu             },
  ],
  "Reviewer": [
    { to: "/dashboard",   label: "Tableau de bord",            Icon: LuLayoutDashboard },
    { to: "/list",        label: "Documents",                  Icon: LuFileText        },
    { to: "/validations", label: "Validations",                Icon: LuClipboardCheck  },
    { to: "/archive",     label: "Archivage",                  Icon: LuArchive         },
    { to: "/workflow",    label: "Workflow",                   Icon: LuGitBranch       },
    { to: "/ai",          label: "Assistant IA",               Icon: LuCpu             },
  ],
};
const NAV_ITEMS_DEFAULT = NAV_ITEMS_BY_ROLE["Admin"];

/* ── NavItem ─────────────────────────────────────────────── */
function NavItem({ to, label, end, icon }) {
  const ItemIcon = icon;
  const match    = useMatch({ path: to, end: end === true });
  const isActive = !!match;
  return (
    <NavLink to={to} end={end} className="no-underline flex-shrink-0">
      <div
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
        style={{ background: isActive ? "rgba(74,184,63,0.1)" : "transparent" }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
      >
        <ItemIcon size={13} style={{ color: isActive ? "#4ab83f" : "rgba(168,191,212,0.5)", flexShrink: 0 }} />
        <span className="text-[13px] font-medium whitespace-nowrap"
          style={{ color: isActive ? "#ffffff" : "rgba(168,191,212,0.75)" }}>
          {label}
        </span>
        {isActive && (
          <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
            style={{ background: "linear-gradient(90deg,#4ab83f,#3da333)" }} />
        )}
      </div>
    </NavLink>
  );
}

/* ── AdminNavItem ────────────────────────────────────────── */
function AdminNavItem({ to, label, icon }) {
  const ItemIcon = icon;
  const match    = useMatch({ path: to, end: false });
  const isActive = !!match;
  return (
    <NavLink to={to} className="no-underline flex-shrink-0">
      <div
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
        style={{ background: isActive ? "rgba(239,68,68,0.1)" : "transparent" }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
      >
        <ItemIcon size={13} style={{ color: isActive ? "#f87171" : "rgba(168,191,212,0.5)", flexShrink: 0 }} />
        <span className="text-[13px] font-medium whitespace-nowrap"
          style={{ color: isActive ? "#f87171" : "rgba(168,191,212,0.75)" }}>
          {label}
        </span>
        {isActive && (
          <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
            style={{ background: "linear-gradient(90deg,#f87171,#ef4444)" }} />
        )}
      </div>
    </NavLink>
  );
}

/* ── Navbar ───────────────────────────────────────────────── */
function Navbar() {
  const { currentUser, userRole, logout } = useUser();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = async () => { await logout(); navigate("/", { replace: true }); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  const navItems = NAV_ITEMS_BY_ROLE[userRole] || NAV_ITEMS_DEFAULT;

  return (
    <nav className="sticky top-0 z-50 transition-all duration-300">
      <style>{ANIMATION_STYLES}</style>

      {/* Green accent line at top */}
      <div style={{
        height: 2,
        background: "linear-gradient(90deg, transparent 0%, #4ab83f 40%, #3da333 60%, transparent 100%)",
        opacity: scrolled ? 1 : 0.5,
        transition: "opacity 0.3s",
      }} />

      <div
        className="border-b transition-all duration-300"
        style={{
          background: scrolled ? "rgba(8,15,26,0.97)" : "rgba(10,20,32,0.82)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderColor: "rgba(255,255,255,0.07)",
          boxShadow: scrolled
            ? "0 8px 40px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.04)"
            : "none",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-[68px] grid items-center"
          style={{ gridTemplateColumns: "1fr auto 1fr" }}>

          {/* ── Left: Logo + Divider ── */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="no-underline flex items-center flex-shrink-0">
              <img
                src={logoImg}
                alt="ACTIA ES"
                className="actia-logo h-12 w-auto"
              />
            </NavLink>
            <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.09)", flexShrink: 0 }} />
          </div>

          {/* ── Center: Nav links (grid auto = exactly as wide as needed) ── */}
          <div className="flex items-center gap-0.5">
            {navItems.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} end={item.end} icon={item.Icon} />
            ))}
            {userRole === "Admin" && (
              <AdminNavItem to="/admin/users" label="Utilisateurs" icon={LuUsers} />
            )}
          </div>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-2 justify-end mr-3">

            {/* + Nouveau button */}
            <NavLink
              to="/create"
              className="no-underline flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg,#4ab83f,#3da333)",
                boxShadow: "0 4px 18px rgba(74,184,63,0.35)",
              }}
            >
              <LuPlus size={14} /> Nouveau
            </NavLink>

            {/* Divider */}
            <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.09)" }} />

            {/* Bell */}
            <NotificationBell />

            {/* User profile */}
            {currentUser && (
              <div className="flex items-center gap-2.5 pl-1">
                {/* Initials avatar */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(74,184,63,0.15)",
                    border: "1.5px solid rgba(74,184,63,0.35)",
                    color: "#4ab83f",
                  }}>
                  <LuUser size={17} />
                </div>

                {/* Name + Role */}
                <div className="leading-none">
                  <p className="text-[13px] font-semibold text-white m-0 leading-tight">{currentUser.name}</p>
                  <p className="text-[11px] font-semibold m-0 mt-0.5 leading-tight"
                    style={{ color: ROLE_COLOR[userRole] || "#94a3b8" }}>
                    {userRole}
                  </p>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  title="Déconnexion"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 cursor-pointer ml-0.5"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "rgba(168,191,212,0.5)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.12)";
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                    e.currentTarget.style.color = "#f87171";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "rgba(168,191,212,0.5)";
                  }}
                >
                  <LuLogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ── Glass Card ───────────────────────────────────────────── */
function GlassCard({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-2xl border ${className}`} style={{
      background:"rgba(255,255,255,0.04)",
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      borderColor:"rgba(255,255,255,0.1)",
      boxShadow:"0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
      ...style,
    }}>{children}</div>
  );
}

/* ── KPI Card ─────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, accent, pulse, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex-1 min-w-[200px] rounded-2xl border p-6 transition-all duration-200 relative overflow-hidden cursor-pointer"
      style={{
        background:"rgba(255,255,255,0.04)",
        backdropFilter:"blur(20px)",
        borderColor: hov ? `${accent}40` : "rgba(255,255,255,0.08)",
        boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px ${accent}30` : "0 8px 32px rgba(0,0,0,0.2)",
        transform: hov ? "translateY(-3px)" : "none",
      }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background:`linear-gradient(90deg,${accent},transparent)` }} />

      <div className="flex justify-between items-start mb-5 mt-1">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background:`${accent}18`, border:`1px solid ${accent}30` }}>
          <Icon size={20} style={{ color:accent }} />
        </div>
        {pulse && value > 0 && (
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background:`${accent}15`, border:`1px solid ${accent}35` }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background:accent, boxShadow:`0 0 6px ${accent}` }} />
            <span className="text-xs font-bold" style={{ color:accent }}>Actif</span>
          </div>
        )}
      </div>

      <p className="font-black text-5xl m-0 leading-none text-white" style={{ letterSpacing:-2 }}>{value}</p>
      <p className="text-white font-semibold text-base m-0 mt-2" style={{ letterSpacing:-0.2 }}>{label}</p>
      {sub && <p className="text-sm m-0 mt-1" style={{ color:"rgba(168,191,212,0.55)" }}>{sub}</p>}

      {onClick && (
        <div className="flex items-center gap-1 mt-4 text-xs font-semibold transition-opacity" style={{ color:accent, opacity:hov?1:0 }}>
          Voir la liste <LuArrowRight size={11} />
        </div>
      )}
    </div>
  );
}

/* ── Status pill ──────────────────────────────────────────── */
function StatusPill({ name }) {
  const s = STATUS_CFG[name] || { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)" };
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
      style={{ background:s.bg, color:s.text, borderColor:s.border }}>
      {name}
    </span>
  );
}

/* ── Section label ────────────────────────────────────────── */
function SectionLabel({ icon: Icon, title, accent = GREEN }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background:`${accent}18` }}>
        <Icon size={11} style={{ color:accent }} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color:"rgba(168,191,212,0.7)" }}>{title}</p>
    </div>
  );
}

/* ── Alert row ────────────────────────────────────────────── */
function AlertRow({ doc, accent, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all duration-150"
      style={{ background:hov?`${accent}10`:"rgba(255,255,255,0.03)", borderColor:hov?`${accent}35`:"rgba(255,255,255,0.06)" }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:accent, boxShadow:`0 0 6px ${accent}60` }} />
      <div className="flex-1 overflow-hidden">
        <p className="m-0 font-bold text-sm font-mono" style={{ color:"#4ab83f" }}>{doc.doc_code}</p>
        <p className="m-0 mt-0.5 text-sm truncate" style={{ color:"rgba(168,191,212,0.6)" }}>{doc.title}</p>
      </div>
      {doc.days_overdue != null && (
        <span className="text-xs font-bold rounded-md px-2 py-0.5 flex-shrink-0" style={{ color:accent, background:`${accent}15`, border:`1px solid ${accent}30` }}>
          +{doc.days_overdue}j
        </span>
      )}
      {doc.status_name && <StatusPill name={doc.status_name} />}
    </div>
  );
}

const CHART_COLORS = ["#3b82f6","#10b981","#f59e0b","#6d28d9","#ef4444","#0f766e","#4ab83f","#c2410c","#475569","#1d4ed8"];

/* ── useCountUp ────────────────────────────────────────────────────────── */
function useCountUp(target, delay) {
  const d = delay || 0;
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const dur = 950;
    const tick = ts => {
      if (!start) start = ts + d;
      const el = ts - start;
      if (el < 0) { requestAnimationFrame(tick); return; }
      const p = Math.min(el / dur, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, d]);
  return val;
}

/* ── StatusBarChart ─────────────────────────────────────────────── */
function StatusBarRow({ d, i, max, visible }) {
  const navigate = useNavigate();
  const color = STATUS_COLORS[d.name] || "#60a5fa";
  const pct   = (d.count / max) * 100;
  const count = useCountUp(d.count, i * 80);
  const [hov, setHov] = useState(false);
  return (
    <div className="anim-slide-up chart-row" style={{ animationDelay: i * 60 + "ms" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => navigate("/list?statusName=" + encodeURIComponent(d.name))}
    >
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
        <span style={{ color: hov ? "#fff" : "rgba(168,191,212,0.85)", fontSize:12, fontWeight:500, transition:"color 0.2s", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:color, display:"inline-block", flexShrink:0 }} className={hov ? "dot-pulse" : ""} />
          {d.name}
        </span>
        <span style={{ color, fontSize:14, fontWeight:800, minWidth:22, textAlign:"right", transform: hov ? "scale(1.2)" : "scale(1)", transition:"transform 0.2s", display:"inline-block" }}>{count}</span>
      </div>
      <div style={{ height:8, borderRadius:99, background:"rgba(255,255,255,0.06)", overflow:"hidden", position:"relative" }}>
        <div style={{
          height:"100%", borderRadius:99,
          background: "linear-gradient(90deg," + color + "88," + color + ")",
          width: visible ? pct + "%" : "0%",
          transition: "width 0.9s cubic-bezier(.22,.68,0,1.2) " + (i * 80) + "ms",
          boxShadow: hov ? "0 0 18px " + color : "0 0 10px " + color + "66",
          position:"relative", overflow:"hidden",
        }}>
          {visible && <div style={{ position:"absolute", top:0, left:0, height:"100%", width:"50%", background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)", animation: "shimmerPass 1.1s ease " + (0.9 + i * 0.1) + "s both", borderRadius:99 }} />}
        </div>
      </div>
    </div>
  );
}
function StatusBarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:12 }}>
      {data.map((d, i) => <StatusBarRow key={d.name} d={d} i={i} max={max} visible={visible} />)}
    </div>
  );
}

/* ── TypeAreaChart — Gradient area chart like reference image ────── */
const TYPE_COLORS = ["#4ab83f","#f472b6","#60a5fa","#fbbf24","#a78bfa","#2dd4bf","#fb923c","#e879f9"];

const crosshairPlugin = {
  id: "crosshair",
  afterDraw(chart) {
    const active = chart.tooltip?._active ?? [];
    if (!active.length) return;
    const ctx  = chart.ctx;
    const x    = active[0].element.x;
    const { top, bottom } = chart.chartArea;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.lineWidth   = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.restore();
  },
};

function makeTypeGradPlugin(pairs) {
  return {
    id: "typeAreaGrad_" + Math.random(),
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      chart.data.datasets.forEach((ds, i) => {
        const [c1, c2] = pairs[i] || ["rgba(96,165,250,0.5)", "rgba(96,165,250,0)"];
        const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        ds.backgroundColor = grad;
      });
    },
  };
}

function TypeAreaChart({ data, total }) {
  const navigate   = useNavigate();
  const gradRef    = useRef(null);

  if (!data || data.length === 0) return (
    <p style={{ color:"rgba(168,191,212,0.4)", textAlign:"center", padding:"32px 0", fontSize:12 }}>Aucune donnée</p>
  );

  if (!gradRef.current) {
    gradRef.current = makeTypeGradPlugin([
      ["rgba(74,184,63,0.65)",  "rgba(74,184,63,0.02)"],
      ["rgba(244,114,182,0.45)","rgba(244,114,182,0.01)"],
    ]);
  }

  const labels = data.map(d => d.code || d.label || "—");
  const counts = data.map(d => d.count);
  const trend  = counts.map((v, i, arr) => {
    const slice = arr.slice(Math.max(0, i - 1), i + 2);
    return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length * 10) / 10;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: "Documents",
        data: counts,
        borderColor:              "#4ab83f",
        backgroundColor:          "transparent",
        fill:                     true,
        tension:                  0.46,
        borderWidth:              3,
        pointBackgroundColor:     "#fff",
        pointBorderColor:         "#4ab83f",
        pointBorderWidth:         2.5,
        pointRadius:              5,
        pointHoverRadius:         9,
        pointHoverBackgroundColor:"#4ab83f",
      },
      {
        label: "Tendance",
        data: trend,
        borderColor:              "#f472b6",
        backgroundColor:          "transparent",
        fill:                     true,
        tension:                  0.46,
        borderWidth:              2.5,
        pointBackgroundColor:     "#fff",
        pointBorderColor:         "#f472b6",
        pointBorderWidth:         2,
        pointRadius:              4,
        pointHoverRadius:         8,
        pointHoverBackgroundColor:"#f472b6",
      },
    ],
  };

  const opts = {
    animation: { duration: 1500, easing: "easeInOutQuart" },
    plugins: {
      legend: {
        display: true,
        labels: { color:"rgba(168,191,212,0.85)", usePointStyle:true, pointStyleWidth:8, font:{ size:11 }, boxHeight:8 },
      },
      tooltip: {
        mode:            "index",
        intersect:       false,
        backgroundColor: "rgba(6,14,26,0.97)",
        titleColor:      "#fff",
        bodyColor:       "rgba(168,191,212,0.9)",
        borderColor:     "rgba(255,255,255,0.1)",
        borderWidth:     1,
        padding:         14,
        cornerRadius:    12,
        callbacks: {
          title: ([ctx]) => {
            const d = data[ctx.dataIndex];
            return (d ? (d.label || d.code) : ctx.label) || ctx.label;
          },
          label: ctx => "  " + ctx.dataset.label + ": " + ctx.parsed.y + " document" + (ctx.parsed.y !== 1 ? "s" : ""),
        },
      },
    },
    scales: {
      x: {
        grid:   { color:"rgba(255,255,255,0.06)", borderDash:[4,4], drawTicks:false },
        ticks:  { color:"rgba(168,191,212,0.65)", font:{ size:11 }, maxRotation:0, padding:6 },
        border: { display:false },
      },
      y: {
        grid:       { color:"rgba(255,255,255,0.05)", drawTicks:false },
        ticks:      { color:"rgba(168,191,212,0.45)", font:{ size:10 }, stepSize:1, padding:8 },
        border:     { display:false },
        beginAtZero:true,
      },
    },
    responsive:       true,
    maintainAspectRatio: false,
    interaction: { mode:"index", intersect:false },
    onClick: (_e, els) => {
      if (els.length > 0) navigate("/list?typeId=" + encodeURIComponent(data[els[0].index]?.id || ""));
    },
  };

  return (
    <div style={{ height:240, marginTop:8, cursor:"pointer" }}>
      <Line data={chartData} options={opts} plugins={[gradRef.current, crosshairPlugin]} />
    </div>
  );
}

/* ── ProcessBarChart ─────────────────────────────────────────────── */
const PROC_COLORS = ["#38bdf8","#34d399","#fbbf24","#a78bfa","#f472b6","#fb923c","#2dd4bf"];
function ProcessBarRow({ d, i, max, visible }) {
  const navigate = useNavigate();
  const color = PROC_COLORS[i % PROC_COLORS.length];
  const pct   = (d.count / max) * 100;
  const count = useCountUp(d.count, i * 80);
  const [hov, setHov] = useState(false);
  const fmt = s => String(s || "—").replace(/_/g, " ");
  return (
    <div className="anim-slide-up chart-row" style={{ animationDelay: i * 65 + "ms" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => navigate("/list?folderId=" + encodeURIComponent(d.id || ""))}
    >
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, alignItems:"center" }}>
        <span style={{ color: hov ? "#fff" : "rgba(168,191,212,0.85)", fontSize:11, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"78%", transition:"color 0.2s" }} title={fmt(d.name)}>{fmt(d.name)}</span>
        <span style={{ color, fontSize:13, fontWeight:800, flexShrink:0, transform: hov ? "scale(1.15)" : "scale(1)", transition:"transform 0.2s", display:"inline-block" }}>{count}</span>
      </div>
      <div style={{ height:7, borderRadius:99, background:"rgba(255,255,255,0.06)", overflow:"hidden", position:"relative" }}>
        <div style={{
          height:"100%", borderRadius:99,
          background: "linear-gradient(90deg," + color + "77," + color + ")",
          width: visible ? pct + "%" : "0%",
          transition: "width 0.95s cubic-bezier(.22,.68,0,1.2) " + (i * 85) + "ms",
          boxShadow: hov ? "0 0 16px " + color : "0 0 8px " + color + "55",
          position:"relative", overflow:"hidden",
        }}>
          {visible && <div style={{ position:"absolute", top:0, left:0, height:"100%", width:"50%", background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)", animation: "shimmerPass 1.1s ease " + (0.95 + i * 0.1) + "s both", borderRadius:99 }} />}
        </div>
      </div>
    </div>
  );
}
function ProcessBarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 150); return () => clearTimeout(t); }, []);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:12 }}>
      {data.slice(0, 7).map((d, i) => <ProcessBarRow key={d.id || i} d={d} i={i} max={max} visible={visible} />)}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useUser();
  const canValidate = userRole === "Admin" || userRole === "Ing. Qualité" || userRole === "Reviewer";
  const [overview,      setOverview]      = useState(null);
  const [stats,         setStats]         = useState(null);
  const [loadingOv,     setLoadingOv]     = useState(true);
  const [loadingSt,     setLoadingSt]     = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedDoc,   setSelectedDoc]   = useState(null);

  // Auto-open document from email link (?docId=<id>)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docId  = params.get("docId");
    if (docId) setSelectedDoc(Number(docId));
  }, [location.search]);

  const fetchData = useCallback(() => {
    axios.get(`${API}/dashboard/overview`).then(r => setOverview(r.data)).catch(console.error).finally(() => setLoadingOv(false));
    axios.get(`${API}/dashboard/stats`).then(r => setStats(r.data)).catch(console.error).finally(() => setLoadingSt(false));
    setLastRefreshed(new Date());
  }, []);

  useEffect(() => {
    setLoadingOv(true);
    setLoadingSt(true);
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const expired      = overview?.expired      || { count:0, list:[] };
  const inValidation = overview?.in_validation || { count:0, list:[] };
  const overdue      = overview?.overdue       || { count:0, list:[] };
  const recentDocs   = overview?.recent_docs   || [];
  const byStatus     = stats?.by_status  || [];
  const byType       = stats?.by_type    || [];
  const byProcess    = stats?.by_process || [];
  const totalDocs    = byStatus.reduce((s, r) => s + r.count, 0);
  const formatTime   = (d) => d.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });

  return (
    <div className="min-h-screen text-white" style={{ background:"linear-gradient(145deg,#0a1420 0%,#0f1e30 35%,#1a2f4a 70%,#1e3a55 100%)" }}>
      {/* BG orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:0 }}>
        <div className="absolute rounded-full" style={{ width:600,height:600,top:-200,right:-150,background:"radial-gradient(circle,rgba(74,184,63,0.06) 0%,transparent 70%)",filter:"blur(40px)" }} />
        <div className="absolute rounded-full" style={{ width:500,height:500,bottom:-100,left:-100,background:"radial-gradient(circle,rgba(96,165,250,0.05) 0%,transparent 70%)",filter:"blur(60px)" }} />
      </div>

      <div className="relative" style={{ zIndex:1 }}>
        <Navbar />

        {/* ── Page header ─────────────────────────────── */}
        <div className="px-8 pt-12 pb-20">
          <div className="max-w-[1280px] mx-auto flex justify-between items-end flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 border"
                style={{ background:"rgba(74,184,63,0.1)", borderColor:"rgba(74,184,63,0.25)" }}>
                <LuShieldCheck size={11} style={{ color:"#4ab83f" }} />
                <span className="text-sm font-semibold" style={{ color:"#4ab83f" }}>Tableau de bord — Supervision</span>
              </div>
              <h1 className="m-0 text-3xl font-black text-white" style={{ letterSpacing:-1 }}>Supervision Documentaire</h1>
              <p className="m-0 mt-2 text-base" style={{ color:"rgba(168,191,212,0.7)" }}>Vue temps réel · Conformité ISO 9001</p>
            </div>
            <button onClick={() => { setLoadingOv(true); setLoadingSt(true); fetchData(); }} disabled={loadingOv||loadingSt}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-white/20"
              style={{ background:"rgba(255,255,255,0.08)", borderColor:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.85)" }}>
              <LuRefreshCw size={13} style={{ animation:(loadingOv||loadingSt)?"spin 1s linear infinite":"none" }} />
              Actualiser · {formatTime(lastRefreshed)}
            </button>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-8 -mt-12 pb-20 space-y-6">

          {/* KPI Cards */}
          <div className="flex gap-4 flex-wrap">
            {[
              { icon:LuTriangleAlert,  label:"Documents expirés",     value:loadingOv?"…":expired.count,       sub:"date de révision dépassée", accent:expired.count>0?"#f87171":"#4ade80",       pulse:expired.count>0,       onClick:()=>navigate("/list?overdue=true"),  delay:"0ms"   },
              { icon:LuClipboardCheck, label:"En validation",          value:loadingOv?"…":inValidation.count,  sub:"en attente d'approbation",  accent:inValidation.count>0?"#a5b4fc":"#4ade80",  pulse:inValidation.count>0,  onClick:()=>navigate(canValidate?"/validations":"/list?statusName=En%20validation"), delay:"80ms"  },
              { icon:LuCircleAlert,    label:"En retard de révision",  value:loadingOv?"…":overdue.count,       sub:"révision dépassée",         accent:overdue.count>0?"#fb923c":"#4ade80",       pulse:overdue.count>0,       onClick:()=>navigate("/list?overdue=true"),  delay:"160ms" },
              { icon:LuCircleCheck,    label:"Total documents",        value:loadingOv?"…":totalDocs||0,        sub:"dans le système",           accent:"#60a5fa",                                 pulse:false,                 onClick:()=>navigate("/list"),               delay:"240ms" },
            ].map(({ icon, label, value, sub, accent, pulse, onClick, delay }) => (
              <div key={label} className="anim-slide-up flex-1" style={{ animationDelay: delay }}>
                <KpiCard icon={icon} label={label} value={value} sub={sub} accent={accent} pulse={pulse} onClick={onClick} />
              </div>
            ))}
          </div>

          {/* Alerts: Expired + In validation */}
          <div className="grid grid-cols-2 gap-5">
            {/* Expired */}
            <GlassCard className="p-6 anim-slide-up" style={{ animationDelay:"100ms" }}>
              <div className="flex justify-between items-center mb-5">
                <SectionLabel icon={LuTriangleAlert} title="Documents expirés" accent="#f87171" />
                <span className="text-xs font-bold rounded-full px-2.5 py-1" style={{ background:"rgba(248,113,113,0.12)", color:"#f87171", border:"1px solid rgba(248,113,113,0.25)" }}>
                  {expired.count} doc{expired.count!==1?"s":""}
                </span>
              </div>
              {loadingOv ? <p className="text-sm text-center py-8" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</p>
                : expired.list.length === 0 ? <p className="text-sm text-center py-8" style={{ color:"rgba(168,191,212,0.5)" }}>Aucun document expiré</p>
                : <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">{expired.list.map(doc => <AlertRow key={doc.id} doc={doc} accent="#f87171" onClick={() => setSelectedDoc(doc.id)} />)}</div>
              }
              <NavLink to="/list?overdue=true" className="flex items-center gap-1.5 mt-4 text-xs font-semibold no-underline" style={{ color:"#f87171" }}>
                Voir tous <LuArrowRight size={11} />
              </NavLink>
            </GlassCard>

            {/* In validation */}
            <GlassCard className="p-6 anim-slide-up" style={{ animationDelay:"180ms" }}>
              <div className="flex justify-between items-center mb-5">
                <SectionLabel icon={LuClipboardCheck} title="En attente de validation" accent="#a5b4fc" />
                <span className="text-xs font-bold rounded-full px-2.5 py-1" style={{ background:"rgba(165,180,252,0.12)", color:"#a5b4fc", border:"1px solid rgba(165,180,252,0.25)" }}>
                  {inValidation.count} doc{inValidation.count!==1?"s":""}
                </span>
              </div>
              {loadingOv ? <p className="text-sm text-center py-8" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</p>
                : inValidation.list.length === 0 ? <p className="text-sm text-center py-8" style={{ color:"rgba(168,191,212,0.5)" }}>Aucun en attente</p>
                : <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">{inValidation.list.map(doc => <AlertRow key={doc.id} doc={doc} accent="#a5b4fc" onClick={() => setSelectedDoc(doc.id)} />)}</div>
              }
              <NavLink to="/validations" className="flex items-center gap-1.5 mt-4 text-xs font-semibold no-underline" style={{ color:"#a5b4fc" }}>
                Gérer les validations <LuArrowRight size={11} />
              </NavLink>
            </GlassCard>
          </div>

          {/* Recent docs */}
          <GlassCard className="p-6 anim-slide-up" style={{ animationDelay:"220ms" }}>
            <div className="flex justify-between items-center mb-5">
              <SectionLabel icon={LuClock} title="Documents récemment modifiés" accent="#60a5fa" />
              <NavLink to="/list" className="text-xs font-semibold no-underline flex items-center gap-1" style={{ color:"#4ab83f" }}>
                Voir tout <LuArrowRight size={11} />
              </NavLink>
            </div>
            {loadingOv ? <p className="text-sm text-center py-5" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</p>
              : recentDocs.length === 0 ? <p className="text-sm text-center py-5" style={{ color:"rgba(168,191,212,0.5)" }}>Aucun document</p>
              : (
                <div className="grid gap-2" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))" }}>
                  {recentDocs.map(doc => (
                    <div key={doc.id} onClick={() => setSelectedDoc(doc.id)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all"
                      style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.06)" }}
                      onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor="rgba(74,184,63,0.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.06)"; }}>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-sm font-bold" style={{ color:"#4ab83f" }}>{doc.doc_code}</span>
                          <span style={{ color:"rgba(255,255,255,0.15)" }}>·</span>
                          <span className="text-xs" style={{ color:"rgba(168,191,212,0.5)" }}>{doc.current_version}</span>
                        </div>
                        <p className="m-0 text-sm truncate max-w-[220px]" style={{ color:"rgba(168,191,212,0.7)" }}>{doc.title}</p>
                      </div>
                      <StatusPill name={doc.status_name} />
                    </div>
                  ))}
                </div>
              )
            }
          </GlassCard>

                    {/* Charts */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-0.5 h-5 rounded-full" style={{ background:"#4ab83f" }} />
              <h2 className="m-0 text-lg font-black text-white" style={{ letterSpacing:-0.3 }}>Statistiques & Répartitions</h2>
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns:"1fr 1fr 1fr" }}>

              <GlassCard className="p-6 anim-scale-in" style={{ animationDelay:"100ms" }}>
                <SectionLabel icon={LuList} title="Par statut" accent="#60a5fa" />
                {loadingSt
                  ? <p className="text-sm text-center py-5" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</p>
                  : byStatus.length === 0
                    ? <p className="text-sm text-center py-5" style={{ color:"rgba(168,191,212,0.5)" }}>Aucune donnée</p>
                    : <StatusBarChart data={byStatus} />}
              </GlassCard>

              <GlassCard className="p-6 anim-scale-in" style={{ animationDelay:"200ms" }}>
                <SectionLabel icon={LuSearch} title="Par type documentaire" accent="#a78bfa" />
                {loadingSt
                  ? <p className="text-sm text-center py-5" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</p>
                  : byType.length === 0
                    ? <p className="text-sm text-center py-5" style={{ color:"rgba(168,191,212,0.5)" }}>Aucune donnée</p>
                    : <TypeAreaChart data={byType} total={totalDocs} />}
              </GlassCard>

              <GlassCard className="p-6 anim-scale-in" style={{ animationDelay:"300ms" }}>
                <SectionLabel icon={LuUsers} title="Par processus" accent="#2dd4bf" />
                {loadingSt
                  ? <p className="text-sm text-center py-5" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</p>
                  : byProcess.length === 0
                    ? <p className="text-sm text-center py-5" style={{ color:"rgba(168,191,212,0.5)" }}>Aucun processus lié</p>
                    : <ProcessBarChart data={byProcess} />}
              </GlassCard>

            </div>
          </div>

          {/* Overdue section */}
          {overdue.list.length > 0 && (
            <div className="rounded-2xl border p-6" style={{ background:"rgba(251,146,60,0.06)", borderColor:"rgba(251,146,60,0.2)" }}>
              <div className="flex justify-between items-center mb-5">
                <SectionLabel icon={LuCircleAlert} title="Retard de révision — Diffusés expirés" accent="#fb923c" />
                <span className="text-xs font-bold rounded-full px-2.5 py-1" style={{ background:"rgba(251,146,60,0.12)", color:"#fb923c", border:"1px solid rgba(251,146,60,0.25)" }}>
                  {overdue.count} doc{overdue.count!==1?"s":""}
                </span>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))" }}>
                {overdue.list.map(doc => <AlertRow key={doc.id} doc={doc} accent="#fb923c" onClick={() => setSelectedDoc(doc.id)} />)}
              </div>
            </div>
          )}
        </div>

        {selectedDoc && <DocDetailModal docId={selectedDoc} onClose={() => setSelectedDoc(null)} />}

        {/* Footer */}
        <footer className="border-t px-8 py-5" style={{ background:"rgba(10,20,32,0.6)", backdropFilter:"blur(20px)", borderColor:"rgba(255,255,255,0.07)" }}>
          <div className="max-w-[1280px] mx-auto flex justify-between items-center flex-wrap gap-2.5">
            <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>
              © 2025 <span className="font-semibold" style={{ color:"#4ab83f" }}>ACTIA Engineering Services</span> — GED · ISO 9001
            </p>
            <div className="flex gap-5">
              {[{to:"/list",label:"Documents"},{to:"/validations",label:"Validations"},{to:"/archive",label:"Archivage"}].map(({to,label}) => (
                <NavLink key={to} to={to} className="text-xs no-underline transition-colors" style={{ color:"rgba(168,191,212,0.45)" }}
                  onMouseEnter={e => e.currentTarget.style.color="#4ab83f"}
                  onMouseLeave={e => e.currentTarget.style.color="rgba(168,191,212,0.45)"}
                >{label}</NavLink>
              ))}
            </div>
          </div>
        </footer>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}