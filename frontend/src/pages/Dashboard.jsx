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
  @keyframes rowSlideIn { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:translateX(0); } }
  .row-slide-in { animation: rowSlideIn 0.4s cubic-bezier(.22,.68,0,1.1) both; }
  @keyframes sectionFadeIn { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  .section-fade-in { animation: sectionFadeIn 0.5s cubic-bezier(.22,.68,0,1.1) both; }
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
    { to: "/",            label: "Accueil",                    Icon: LuHouse,          end: true },
    { to: "/dashboard",   label: "Tableau de bord",            Icon: LuLayoutDashboard },
    { to: "/list",        label: "Documents",                  Icon: LuFileText        },
    { to: "/validations", label: "Validations",                Icon: LuClipboardCheck  },
    { to: "/archive",     label: "Archivage",                  Icon: LuArchive         },
    { to: "/workflow",    label: "Workflow",                   Icon: LuGitBranch       },
    { to: "/ai",          label: "Assistant IA",               Icon: LuCpu             },
  ],
  "Reviewer": [
    { to: "/",            label: "Accueil",                    Icon: LuHouse,          end: true },
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

/* ── Mini SVG ring ────────────────────────────────────────── */
function MiniRing({ pct, accent, size = 52 }) {
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={accent} strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.min(pct, 1))}
        style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)", filter:`drop-shadow(0 0 5px ${accent}90)` }}
      />
    </svg>
  );
}

/* ── KPI Card ─────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, accent, pulse, onClick, ringMax }) {
  const [hov, setHov] = useState(false);
  const num = typeof value === "number" ? value : 0;
  const pct = ringMax > 0 ? num / ringMax : 0;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex-1 min-w-[200px] rounded-2xl border p-5 transition-all duration-200 relative overflow-hidden cursor-pointer"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background:"rgba(255,255,255,0.04)",
        backdropFilter:"blur(20px)",
        borderColor: hov ? `${accent}45` : "rgba(255,255,255,0.08)",
        boxShadow: hov ? `0 20px 56px rgba(0,0,0,0.4), 0 0 0 1px ${accent}30, 0 0 40px ${accent}10` : "0 8px 32px rgba(0,0,0,0.2)",
        transform: hov ? "translateY(-4px)" : "none",
      }}
    >
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background:`linear-gradient(90deg,${accent},${accent}44,transparent)` }} />
      {/* Background glow */}
      <div style={{ position:"absolute", bottom:-30, right:-20, width:100, height:100, borderRadius:"50%", background:`${accent}0e`, filter:"blur(28px)", pointerEvents:"none" }} />

      <div className="flex justify-between items-start mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background:`${accent}16`, border:`1px solid ${accent}30` }}>
          <Icon size={20} style={{ color:accent }} />
        </div>
        <MiniRing pct={pct} accent={accent} />
      </div>

      <p className="font-black text-5xl m-0 leading-none text-white"
        style={{ letterSpacing:-2, textShadow: num>0 ? `0 0 24px ${accent}60` : "none" }}>
        {value}
      </p>
      <p className="text-white font-semibold text-base m-0 mt-2" style={{ letterSpacing:-0.2 }}>{label}</p>
      {sub && <p className="text-sm m-0 mt-1" style={{ color:"rgba(168,191,212,0.5)" }}>{sub}</p>}

      {/* Spacer — pushes badge to bottom so all cards have equal height */}
      <div style={{ flex: 1 }} />

      {pulse && num > 0 ? (
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 mt-3 w-fit"
          style={{ background:`${accent}12`, border:`1px solid ${accent}30` }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block dot-pulse" style={{ background:accent }} />
          <span className="text-xs font-bold" style={{ color:accent }}>Nécessite attention</span>
        </div>
      ) : (
        <div style={{ height: 28, marginTop: 12 }} />
      )}

      {onClick && (
        <div className="flex items-center gap-1 mt-2 text-xs font-semibold transition-opacity" style={{ color:accent, opacity:hov?1:0 }}>
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
function AlertRow({ doc, accent, onClick, index = 0 }) {
  const sc = STATUS_CFG[doc.status_name] || {};
  const rowAccent = sc.text || accent;
  return (
    <div
      onClick={onClick}
      className="row-slide-in group relative flex items-center justify-between rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        padding: "10px 14px 10px 18px",
        background: `linear-gradient(105deg, ${rowAccent}0d 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${rowAccent}25`,
        animationDelay: `${index * 0.07}s`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `linear-gradient(105deg, ${rowAccent}18 0%, rgba(255,255,255,0.04) 100%)`;
        e.currentTarget.style.borderColor = `${rowAccent}45`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `linear-gradient(105deg, ${rowAccent}0d 0%, rgba(255,255,255,0.02) 100%)`;
        e.currentTarget.style.borderColor = `${rowAccent}25`;
      }}
    >
      {/* Left colored bar — always visible */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: `linear-gradient(to bottom, ${rowAccent}, ${rowAccent}55)` }} />
      <div className="flex-1 overflow-hidden min-w-0">
        <p className="m-0 font-bold text-[12px] font-mono leading-tight" style={{ color: rowAccent }}>{doc.doc_code}</p>
        <p className="m-0 mt-0.5 text-sm truncate" style={{ color:"rgba(168,191,212,0.7)" }}>{doc.title}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {doc.days_overdue != null && (
          <span className="text-xs font-black rounded-lg px-2 py-0.5" style={{ color:accent, background:`${accent}18`, border:`1px solid ${accent}35` }}>
            +{doc.days_overdue}j
          </span>
        )}
        {doc.status_name && <StatusPill name={doc.status_name} />}
      </div>
    </div>
  );
}

const CHART_COLORS = ["#3b82f6","#10b981","#f59e0b","#6d28d9","#ef4444","#0f766e","#4ab83f","#c2410c","#475569","#1d4ed8"];

/* ── Custom HTML external tooltip ─────────────────────────────────────── */
function getOrCreateTooltipEl(chart) {
  let el = chart.canvas.parentNode.querySelector(".ged-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.className = "ged-tooltip";
    el.style.cssText = "position:absolute;pointer-events:none;z-index:9999;transition:opacity 0.12s ease,transform 0.12s ease;opacity:0;transform:translateY(6px);";
    chart.canvas.parentNode.style.position = "relative";
    chart.canvas.parentNode.appendChild(el);
  }
  return el;
}

function makeExternalTooltip(getColor, getVal, getLabel) {
  return function({ chart, tooltip }) {
    const el = getOrCreateTooltipEl(chart);
    if (tooltip.opacity === 0) { el.style.opacity = "0"; el.style.transform = "translateY(6px)"; return; }
    const dp = tooltip.dataPoints?.[0];
    if (!dp) return;
    const color  = getColor  ? getColor(dp)  : (dp.dataset?.borderColor || "#4ab83f");
    const val    = getVal    ? getVal(dp)    : (dp.parsed?.y ?? dp.parsed?.x ?? dp.parsed ?? 0);
    const title  = getLabel  ? getLabel(dp)  : (tooltip.title?.[0] || "");
    el.innerHTML = `
      <div style="background:linear-gradient(160deg,rgba(4,10,22,0.99),rgba(8,18,34,0.99));border:1px solid ${color}45;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.75),0 0 0 1px rgba(255,255,255,0.04),0 0 28px ${color}18;overflow:hidden;font-family:inherit;min-width:160px;">
        <div style="height:3px;background:linear-gradient(90deg,${color},${color}55,transparent);"></div>
        <div style="padding:14px 18px 16px;">
          <p style="margin:0 0 12px;font-size:10px;font-weight:800;color:rgba(168,191,212,0.55);text-transform:uppercase;letter-spacing:1.2px;">${title}</p>
          <div style="display:flex;align-items:baseline;gap:7px;margin-bottom:6px;">
            <span style="font-size:42px;font-weight:900;color:${color};line-height:1;font-variant-numeric:tabular-nums;text-shadow:0 0 24px ${color}90;">${val}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:6px;height:6px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};"></div>
            <span style="font-size:12px;font-weight:600;color:rgba(168,191,212,0.55);">document${val !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>`;
    const { offsetLeft: posX, offsetTop: posY } = chart.canvas;
    const cx = tooltip.caretX;
    const cy = tooltip.caretY;
    el.style.opacity   = "1";
    el.style.transform = "translateY(0)";
    el.style.left      = (posX + cx - el.offsetWidth / 2) + "px";
    el.style.top       = (posY + cy - el.offsetHeight - 14) + "px";
  };
}

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

/* ── StatusDoughnutChart ────────────────────────────────────── */
function StatusDoughnutChart({ data }) {
  const navigate = useNavigate();
  const total = data.reduce((s, d) => s + d.count, 0);
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: data.map(d => (STATUS_COLORS[d.name] || "#60a5fa") + "d0"),
      borderColor:     data.map(d =>  STATUS_COLORS[d.name] || "#60a5fa"),
      borderWidth: 2.5,
      hoverOffset: 16,
      hoverBorderWidth: 3,
      cutout: "68%",
    }],
  };
  const externalTooltip = makeExternalTooltip(
    dp => STATUS_COLORS[dp.label] || "#60a5fa",
    dp => dp.parsed ?? 0,
    dp => dp.label
  );

  const opts = {
    animation: { duration: 1200, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false, external: externalTooltip },
    },
    responsive: true,
    maintainAspectRatio: true,
    onClick: (_e, els) => {
      if (els.length > 0) navigate("/list?statusName=" + encodeURIComponent(data[els[0].index].name));
    },
  };
  return (
    <div style={{ display:"flex", gap:20, alignItems:"flex-start", marginTop:12 }}>
      {/* Doughnut */}
      <div style={{ position:"relative", width:170, height:170, flexShrink:0 }}>
        <Doughnut data={chartData} options={opts} />
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center", pointerEvents:"none" }}>
          <div style={{ fontSize:32, fontWeight:900, color:"#4ab83f", lineHeight:1, textShadow:"0 0 20px rgba(74,184,63,0.5)" }}>{total}</div>
          <div style={{ fontSize:10, color:"rgba(168,191,212,0.5)", fontWeight:700, marginTop:4, letterSpacing:1.5, textTransform:"uppercase" }}>docs</div>
        </div>
      </div>
      {/* Legend rows with progress bars */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6, paddingTop:4 }}>
        {data.filter(d => d.count > 0).map((d) => {
          const color = STATUS_COLORS[d.name] || "#60a5fa";
          const pct = total > 0 ? ((d.count / total) * 100) : 0;
          return (
            <div key={d.name}
              onClick={() => navigate("/list?statusName=" + encodeURIComponent(d.name))}
              style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"5px 8px", borderRadius:8,
                background:`${color}08`, border:`1px solid ${color}18`, transition:"all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background=`${color}14`; e.currentTarget.style.borderColor=`${color}35`; }}
              onMouseLeave={e => { e.currentTarget.style.background=`${color}08`; e.currentTarget.style.borderColor=`${color}18`; }}
            >
              {/* Left accent bar */}
              <div style={{ width:3, height:28, borderRadius:2, background:color, flexShrink:0, boxShadow:`0 0 8px ${color}70` }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"rgba(168,191,212,0.85)" }}>{d.name}</span>
                  <span style={{ fontSize:12, fontWeight:900, color, fontFamily:"monospace" }}>{d.count}</span>
                </div>
                <div style={{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color}99,${color})`, borderRadius:2, transition:"width 1s ease" }} />
                </div>
              </div>
              <span style={{ fontSize:10, fontWeight:800, color:`${color}99`, minWidth:32, textAlign:"right" }}>{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── TypeAreaChart — Gradient area chart ────── */
const TYPE_COLORS = ["#4ab83f","#f472b6","#60a5fa","#fbbf24","#a78bfa","#2dd4bf","#fb923c","#e879f9"];

const crosshairPlugin = {
  id: "crosshair",
  afterDraw(chart) {
    const active = chart.tooltip?._active ?? [];
    if (!active.length) return;
    const { ctx, chartArea } = chart;
    const x = active[0].element.x;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.lineWidth   = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  },
};

const lineGlowPlugin = {
  id: "lineGlow",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((ds, di) => {
      const meta = chart.getDatasetMeta(di);
      if (meta.hidden || !meta.data.length) return;
      ctx.save();
      ctx.shadowColor = ds.borderColor || "#4ab83f";
      ctx.shadowBlur  = 14;
      ctx.strokeStyle = ds.borderColor || "#4ab83f";
      ctx.lineWidth   = ds.borderWidth || 3;
      ctx.lineJoin    = "round";
      ctx.lineCap     = "round";
      const path = new Path2D();
      meta.data.forEach((pt, j) => { j === 0 ? path.moveTo(pt.x, pt.y) : path.lineTo(pt.x, pt.y); });
      ctx.stroke(path);
      ctx.restore();
    });
  },
};

function makeTypeGradPlugin(pairs) {
  return {
    id: "typeAreaGrad_" + Math.random(),
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      chart.data.datasets.forEach((ds, i) => {
        const [c1, c2] = pairs[i] || ["rgba(74,184,63,0.55)", "rgba(74,184,63,0)"];
        const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        grad.addColorStop(0, c1);
        grad.addColorStop(0.6, c2.replace("0)", "0.08)"));
        grad.addColorStop(1, c2);
        ds.backgroundColor = grad;
      });
    },
  };
}

function TypeAreaChart({ data }) {
  const navigate = useNavigate();
  const gradRef  = useRef(null);

  if (!data || data.length === 0) return (
    <p style={{ color:"rgba(168,191,212,0.4)", textAlign:"center", padding:"32px 0", fontSize:12 }}>Aucune donnée</p>
  );

  if (!gradRef.current) {
    gradRef.current = makeTypeGradPlugin([["rgba(74,184,63,0.6)", "rgba(74,184,63,0)"]]);
  }

  const labels = data.map(d => d.code || d.label || "—");
  const counts = data.map(d => d.count);

  const chartData = {
    labels,
    datasets: [{
      label:                    "Documents",
      data:                     counts,
      borderColor:              "#4ab83f",
      backgroundColor:          "transparent",
      fill:                     true,
      tension:                  0.42,
      borderWidth:              2.5,
      pointBackgroundColor:     "#0f1e30",
      pointBorderColor:         "#4ab83f",
      pointBorderWidth:         2.5,
      pointRadius:              5,
      pointHoverRadius:         8,
      pointHoverBackgroundColor:"#4ab83f",
      pointHoverBorderColor:    "#fff",
      pointHoverBorderWidth:    2,
    }],
  };

  const externalTooltip = makeExternalTooltip(
    () => "#4ab83f",
    dp => dp.parsed?.y ?? 0,
    dp => { const d = data[dp.dataIndex]; return d ? (d.label || d.code) : dp.label; }
  );

  const opts = {
    animation: { duration: 1400, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: externalTooltip,
        mode: "index", intersect: false,
      },
    },
    scales: {
      x: {
        grid:   { color:"rgba(255,255,255,0.04)", borderDash:[4,6], drawTicks:false },
        ticks:  { color:"rgba(168,191,212,0.6)", font:{ size:11, weight:"600" }, maxRotation:0, padding:8 },
        border: { display:false },
      },
      y: {
        grid:        { color:"rgba(255,255,255,0.04)", drawTicks:false },
        ticks:       { color:"rgba(168,191,212,0.4)", font:{ size:10 }, stepSize:1, padding:10 },
        border:      { display:false },
        beginAtZero: true,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode:"index", intersect:false },
    onClick: (_e, els) => {
      if (els.length > 0) navigate("/list?typeId=" + encodeURIComponent(data[els[0].index]?.id || ""));
    },
  };

  return (
    <div style={{ height:240, marginTop:8, cursor:"pointer" }}>
      <Line data={chartData} options={opts} plugins={[gradRef.current, crosshairPlugin, lineGlowPlugin]} />
    </div>
  );
}

/* ── ProcessHBarChart — Gradient horizontal bar ──────────────── */
const PROC_COLORS = ["#38bdf8","#34d399","#fbbf24","#a78bfa","#f472b6","#fb923c","#2dd4bf"];

const barGradPlugin = {
  id: "barGrad",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const ds = chart.data.datasets[0];
    ds.backgroundColor = ds.data.map((_, i) => {
      const color = PROC_COLORS[i % PROC_COLORS.length];
      const grad = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
      grad.addColorStop(0, color + "55");
      grad.addColorStop(1, color + "ee");
      return grad;
    });
  },
};

const barValuePlugin = {
  id: "barValue",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((ds, di) => {
      chart.getDatasetMeta(di).data.forEach((bar, i) => {
        const val = ds.data[i];
        if (!val) return;
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font      = "bold 11px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(val, bar.x + 6, bar.y);
        ctx.restore();
      });
    });
  },
};

function ProcessHBarChart({ data }) {
  const navigate = useNavigate();
  const sliced = data.slice(0, 8);
  const maxVal = Math.max(...sliced.map(d => d.count), 1);

  const chartData = {
    labels: sliced.map(d => String(d.name || "—").replace(/_/g, " ")),
    datasets: [{
      data:          sliced.map(d => d.count),
      backgroundColor: sliced.map((_, i) => PROC_COLORS[i % PROC_COLORS.length] + "99"),
      borderColor:   sliced.map((_, i) => PROC_COLORS[i % PROC_COLORS.length]),
      borderWidth:   0,
      borderRadius:  8,
      borderSkipped: false,
    }],
  };

  const externalTooltip = makeExternalTooltip(
    dp => PROC_COLORS[dp.dataIndex % PROC_COLORS.length],
    dp => dp.parsed?.x ?? 0,
    dp => sliced[dp.dataIndex]?.name?.replace(/_/g, " ") || dp.label
  );

  const opts = {
    indexAxis: "y",
    animation: { duration: 1300, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false, external: externalTooltip },
    },
    scales: {
      x: {
        grid:        { color:"rgba(255,255,255,0.04)", borderDash:[4,6], drawTicks:false },
        ticks:       { color:"rgba(168,191,212,0.4)", font:{ size:10 }, stepSize:1, padding:6 },
        border:      { display:false },
        beginAtZero: true,
        max:         maxVal + 1,
      },
      y: {
        grid:   { display:false },
        ticks:  { color:"rgba(168,191,212,0.88)", font:{ size:12, weight:"700" }, padding:10 },
        border: { display:false },
      },
    },
    responsive:          true,
    maintainAspectRatio: false,
    interaction: { mode:"index", intersect:false },
    onClick: (_e, els) => {
      if (els.length > 0) navigate("/list?folderId=" + encodeURIComponent(sliced[els[0].index]?.id || ""));
    },
  };

  return (
    <div style={{ height: Math.max(sliced.length * 46, 180), marginTop: 12, cursor:"pointer" }}>
      <Bar data={chartData} options={opts} plugins={[barGradPlugin, barValuePlugin]} />
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
              { icon:LuTriangleAlert,  label:"Documents expirés",     value:loadingOv?"…":expired.count,       sub:"date de révision dépassée", accent:expired.count>0?"#f87171":"#4ade80",       pulse:expired.count>0,       onClick:()=>navigate("/list?overdue=true"),  delay:"0ms",   ringMax: Math.max(expired.count, inValidation.count, overdue.count, totalDocs, 1) },
              { icon:LuClipboardCheck, label:"En validation",          value:loadingOv?"…":inValidation.count,  sub:"en attente d'approbation",  accent:inValidation.count>0?"#a5b4fc":"#4ade80",  pulse:inValidation.count>0,  onClick:()=>navigate(canValidate?"/validations":"/list?statusName=En%20validation"), delay:"80ms",  ringMax: Math.max(expired.count, inValidation.count, overdue.count, totalDocs, 1) },
              { icon:LuCircleAlert,    label:"En retard de révision",  value:loadingOv?"…":overdue.count,       sub:"révision dépassée",         accent:overdue.count>0?"#fb923c":"#4ade80",       pulse:overdue.count>0,       onClick:()=>navigate("/list?overdue=true"),  delay:"160ms", ringMax: Math.max(expired.count, inValidation.count, overdue.count, totalDocs, 1) },
              { icon:LuCircleCheck,    label:"Total documents",        value:loadingOv?"…":totalDocs||0,        sub:"dans le système",           accent:"#60a5fa",                                 pulse:false,                 onClick:()=>navigate("/list"),               delay:"240ms", ringMax: Math.max(totalDocs, 1) },
            ].map(({ icon, label, value, sub, accent, pulse, onClick, delay, ringMax }) => (
              <div key={label} className="anim-slide-up flex-1" style={{ animationDelay: delay, display: "flex", flexDirection: "column" }}>
                <KpiCard icon={icon} label={label} value={value} sub={sub} accent={accent} pulse={pulse} onClick={onClick} ringMax={ringMax} />
              </div>
            ))}
          </div>

          {/* Alerts: Expired + In validation */}
          <div className="grid grid-cols-2 gap-5">
            {/* Expired */}
            <div className="rounded-2xl p-6 section-fade-in" style={{
              background:"linear-gradient(135deg,rgba(15,30,48,0.95) 0%,rgba(20,38,58,0.98) 100%)",
              border:"1px solid rgba(248,113,113,0.2)",
              boxShadow:"0 4px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)",
              animationDelay:"0.1s",
            }}>
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"rgba(248,113,113,0.15)", border:"1px solid rgba(248,113,113,0.3)" }}>
                    <LuTriangleAlert size={13} style={{ color:"#f87171" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest m-0" style={{ color:"rgba(168,191,212,0.8)" }}>Documents expirés</p>
                </div>
                <span className="text-xs font-black rounded-full px-3 py-1" style={{ background:"rgba(248,113,113,0.12)", color:"#f87171", border:"1px solid rgba(248,113,113,0.28)" }}>
                  {expired.count} doc{expired.count!==1?"s":""}
                </span>
              </div>
              {loadingOv
                ? <div className="space-y-2">{[1,2,3].map(n=><div key={n} className="h-12 rounded-xl animate-pulse" style={{background:"rgba(255,255,255,0.04)"}}/>)}</div>
                : expired.list.length === 0
                  ? <p className="text-sm text-center py-8" style={{ color:"rgba(168,191,212,0.5)" }}>Aucun document expiré ✓</p>
                  : <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">{expired.list.map((doc,i) => <AlertRow key={doc.id} doc={doc} accent="#f87171" onClick={() => setSelectedDoc(doc.id)} index={i} />)}</div>
              }
              <NavLink to="/list?overdue=true" className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold no-underline px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ color:"#f87171", background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)" }}>
                Voir tous <LuArrowRight size={11} />
              </NavLink>
            </div>

            {/* In validation */}
            <div className="rounded-2xl p-6 section-fade-in" style={{
              background:"linear-gradient(135deg,rgba(15,30,48,0.95) 0%,rgba(20,38,58,0.98) 100%)",
              border:"1px solid rgba(165,180,252,0.2)",
              boxShadow:"0 4px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)",
              animationDelay:"0.18s",
            }}>
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"rgba(165,180,252,0.15)", border:"1px solid rgba(165,180,252,0.3)" }}>
                    <LuClipboardCheck size={13} style={{ color:"#a5b4fc" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest m-0" style={{ color:"rgba(168,191,212,0.8)" }}>En attente de validation</p>
                </div>
                <span className="text-xs font-black rounded-full px-3 py-1" style={{ background:"rgba(165,180,252,0.12)", color:"#a5b4fc", border:"1px solid rgba(165,180,252,0.28)" }}>
                  {inValidation.count} doc{inValidation.count!==1?"s":""}
                </span>
              </div>
              {loadingOv
                ? <div className="space-y-2">{[1,2,3].map(n=><div key={n} className="h-12 rounded-xl animate-pulse" style={{background:"rgba(255,255,255,0.04)"}}/>)}</div>
                : inValidation.list.length === 0
                  ? <p className="text-sm text-center py-8" style={{ color:"rgba(168,191,212,0.5)" }}>Aucun en attente ✓</p>
                  : <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">{inValidation.list.map((doc,i) => <AlertRow key={doc.id} doc={doc} accent="#a5b4fc" onClick={() => setSelectedDoc(doc.id)} index={i} />)}</div>
              }
              <NavLink to="/validations" className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold no-underline px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ color:"#a5b4fc", background:"rgba(165,180,252,0.1)", border:"1px solid rgba(165,180,252,0.2)" }}>
                Gérer les validations <LuArrowRight size={11} />
              </NavLink>
            </div>
          </div>

          {/* Recent docs */}
          <div className="rounded-2xl p-6 section-fade-in" style={{
            background:"linear-gradient(135deg,rgba(15,30,48,0.95) 0%,rgba(20,38,58,0.98) 100%)",
            border:"1px solid rgba(96,165,250,0.18)",
            boxShadow:"0 4px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)",
            animationDelay:"0.22s",
          }}>
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"rgba(96,165,250,0.15)", border:"1px solid rgba(96,165,250,0.3)" }}>
                  <LuClock size={13} style={{ color:"#60a5fa" }} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest m-0" style={{ color:"rgba(168,191,212,0.8)" }}>Documents récemment modifiés</p>
              </div>
              <NavLink to="/list" className="inline-flex items-center gap-1.5 text-xs font-bold no-underline px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ color:"#4ab83f", background:"rgba(74,184,63,0.1)", border:"1px solid rgba(74,184,63,0.2)" }}>
                Voir tout <LuArrowRight size={11} />
              </NavLink>
            </div>
            {loadingOv
              ? <div className="grid gap-2" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))" }}>{[1,2,3,4,5,6].map(n=><div key={n} className="h-14 rounded-xl animate-pulse" style={{background:"rgba(255,255,255,0.04)"}}/>)}</div>
              : recentDocs.length === 0
                ? <p className="text-sm text-center py-5" style={{ color:"rgba(168,191,212,0.5)" }}>Aucun document</p>
                : (
                  <div className="grid gap-2" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))" }}>
                    {recentDocs.map((doc, i) => {
                      const sc = STATUS_CFG[doc.status_name] || {};
                      return (
                      <div key={doc.id} onClick={() => setSelectedDoc(doc.id)}
                        className="row-slide-in group relative flex items-center justify-between rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                        style={{
                          padding:"10px 14px 10px 18px",
                          background:`linear-gradient(105deg,${sc.text?sc.text+"0d":"rgba(74,184,63,0.05)"} 0%,rgba(255,255,255,0.02) 100%)`,
                          border:`1px solid ${sc.text?sc.text+"25":"rgba(255,255,255,0.07)"}`,
                          animationDelay:`${i*0.05+0.22}s`,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background=`linear-gradient(105deg,${sc.text?sc.text+"18":"rgba(74,184,63,0.1)"} 0%,rgba(255,255,255,0.04) 100%)`;
                          e.currentTarget.style.borderColor=sc.text?`${sc.text}45`:"rgba(74,184,63,0.3)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background=`linear-gradient(105deg,${sc.text?sc.text+"0d":"rgba(74,184,63,0.05)"} 0%,rgba(255,255,255,0.02) 100%)`;
                          e.currentTarget.style.borderColor=sc.text?`${sc.text}25`:"rgba(255,255,255,0.07)";
                        }}
                      >
                        {/* Left status bar — always visible */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px]"
                          style={{ background:`linear-gradient(to bottom,${sc.text||"#4ab83f"},${sc.text||"#4ab83f"}55)` }} />
                        <div className="overflow-hidden flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[12px] font-bold leading-tight" style={{ color:sc.text||"#4ab83f" }}>{doc.doc_code}</span>
                            <span style={{ color:"rgba(255,255,255,0.15)" }}>·</span>
                            <span className="text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>{doc.current_version}</span>
                          </div>
                          <p className="m-0 text-sm truncate max-w-[220px]" style={{ color:"rgba(168,191,212,0.7)" }}>{doc.title}</p>
                        </div>
                        <StatusPill name={doc.status_name} />
                      </div>
                      );
                    })}
                  </div>
                )
            }
          </div>

                    {/* Charts */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"rgba(74,184,63,0.15)", border:"1px solid rgba(74,184,63,0.3)" }}>
                <LuShieldCheck size={14} style={{ color:"#4ab83f" }} />
              </div>
              <h2 className="m-0 text-base font-black text-white tracking-wide uppercase" style={{ letterSpacing:1 }}>Statistiques & Répartitions</h2>
              <div className="flex-1 h-px ml-2" style={{ background:"linear-gradient(90deg,rgba(74,184,63,0.3),transparent)" }} />
            </div>

            {/* Row 1 : Doughnut statut (1/3) + Area chart types (2/3) */}
            <div className="grid gap-5 mb-5" style={{ gridTemplateColumns:"1fr 2fr" }}>

              <div className="rounded-2xl p-6 section-fade-in" style={{
                background:"linear-gradient(135deg,rgba(15,30,48,0.95) 0%,rgba(20,38,58,0.98) 100%)",
                border:"1px solid rgba(96,165,250,0.18)",
                boxShadow:"0 4px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)",
                animationDelay:"0.1s",
              }}>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"rgba(96,165,250,0.15)", border:"1px solid rgba(96,165,250,0.3)" }}>
                    <LuList size={13} style={{ color:"#60a5fa" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest m-0" style={{ color:"rgba(168,191,212,0.8)" }}>Par statut</p>
                </div>
                {loadingSt
                  ? <div className="space-y-2 mt-4">{[1,2,3,4].map(n=><div key={n} className="h-8 rounded-lg animate-pulse" style={{background:"rgba(255,255,255,0.04)"}}/>)}</div>
                  : byStatus.length === 0
                    ? <p className="text-sm text-center py-8" style={{ color:"rgba(168,191,212,0.5)" }}>Aucune donnée</p>
                    : <StatusDoughnutChart data={byStatus} />}
              </div>

              <div className="rounded-2xl p-6 section-fade-in" style={{
                background:"linear-gradient(135deg,rgba(15,30,48,0.95) 0%,rgba(20,38,58,0.98) 100%)",
                border:"1px solid rgba(167,139,250,0.18)",
                boxShadow:"0 4px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)",
                animationDelay:"0.18s",
              }}>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"rgba(167,139,250,0.15)", border:"1px solid rgba(167,139,250,0.3)" }}>
                    <LuSearch size={13} style={{ color:"#a78bfa" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest m-0" style={{ color:"rgba(168,191,212,0.8)" }}>Par type documentaire</p>
                </div>
                {loadingSt
                  ? <div className="mt-4 h-48 rounded-xl animate-pulse" style={{background:"rgba(255,255,255,0.04)"}} />
                  : byType.length === 0
                    ? <p className="text-sm text-center py-8" style={{ color:"rgba(168,191,212,0.5)" }}>Aucune donnée</p>
                    : <TypeAreaChart data={byType} total={totalDocs} />}
              </div>
            </div>

            {/* Row 2 : Processus full-width horizontal bar */}
            <div className="rounded-2xl p-6 section-fade-in" style={{
              background:"linear-gradient(135deg,rgba(15,30,48,0.95) 0%,rgba(20,38,58,0.98) 100%)",
              border:"1px solid rgba(45,212,191,0.18)",
              boxShadow:"0 4px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)",
              animationDelay:"0.26s",
            }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"rgba(45,212,191,0.15)", border:"1px solid rgba(45,212,191,0.3)" }}>
                    <LuUsers size={13} style={{ color:"#2dd4bf" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest m-0" style={{ color:"rgba(168,191,212,0.8)" }}>Par processus</p>
                </div>
                {byProcess.length > 0 && (
                  <span className="text-xs font-black rounded-full px-3 py-1" style={{ background:"rgba(45,212,191,0.1)", color:"#2dd4bf", border:"1px solid rgba(45,212,191,0.25)" }}>
                    {byProcess.length} processus
                  </span>
                )}
              </div>
              {loadingSt
                ? <div className="mt-3 h-40 rounded-xl animate-pulse" style={{background:"rgba(255,255,255,0.04)"}} />
                : byProcess.length === 0
                  ? <p className="text-sm text-center py-5" style={{ color:"rgba(168,191,212,0.5)" }}>Aucun processus lié</p>
                  : <ProcessHBarChart data={byProcess} />}
            </div>
          </div>

          {/* Overdue section */}
          {overdue.list.length > 0 && (
            <div className="rounded-2xl p-6 section-fade-in" style={{
              background:"linear-gradient(135deg,rgba(20,15,10,0.95) 0%,rgba(30,20,10,0.98) 100%)",
              border:"1px solid rgba(251,146,60,0.25)",
              boxShadow:"0 4px 32px rgba(251,146,60,0.08),inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"rgba(251,146,60,0.15)", border:"1px solid rgba(251,146,60,0.3)" }}>
                    <LuCircleAlert size={13} className="animate-pulse" style={{ color:"#fb923c" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest m-0" style={{ color:"rgba(168,191,212,0.8)" }}>Retard de révision — Diffusés expirés</p>
                </div>
                <span className="text-xs font-black rounded-full px-3 py-1" style={{ background:"rgba(251,146,60,0.12)", color:"#fb923c", border:"1px solid rgba(251,146,60,0.28)" }}>
                  {overdue.count} doc{overdue.count!==1?"s":""}
                </span>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))" }}>
                {overdue.list.map((doc,i) => <AlertRow key={doc.id} doc={doc} accent="#fb923c" onClick={() => setSelectedDoc(doc.id)} index={i} />)}
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