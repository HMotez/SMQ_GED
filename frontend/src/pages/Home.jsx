// ============================================================
// pages/Home.jsx — ACTIA ES GED · Login-Style Premium Dark Design
// ============================================================

import { useEffect, useState } from "react";
import { NavLink, useNavigate, useMatch } from "react-router-dom";
import axios from "axios";
import logoImg from "../assets/Logo.png";
import { useUser } from "../context/UserContext";
import UserSelector from "../components/UserSelector";
import NotificationBell from "../components/NotificationBell";
import {
  LuFileText, LuFilePlus, LuList, LuClipboardCheck, LuArchive,
  LuClock, LuCircleCheck, LuCircleAlert, LuShare2, LuTriangleAlert,
  LuPencil, LuPenLine, LuEye, LuCircleCheckBig,
  LuRefreshCw, LuShieldCheck, LuSearch, LuUsers,
  LuPlus, LuArrowRight, LuLogOut, LuInbox, LuUser, LuZap, LuAward,
  LuHouse, LuLayoutDashboard, LuBell, LuCpu,
  LuCrown, LuWrench, LuChevronDown, LuShield, LuLock,
} from "react-icons/lu";
import { API } from "../config";
import LoginModal from "../components/LoginModal";
import DocDetailModal from "../components/DocDetailModal";

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
  "Admin":        "#f87171",
  "Ing. Qualité": "#2dd4bf",
  "Reviewer":     "#4ade80",
};

/* ── Nav items per role ───────────────────────────────────── */
const NAV_ITEMS_BY_ROLE = {
  "Admin": [
    { to: "/",            label: "Accueil",         end: true, Icon: LuHouse          },
    { to: "/dashboard",   label: "Tableau de bord",            Icon: LuLayoutDashboard },
    { to: "/list",        label: "Documents",                  Icon: LuFileText        },
    { to: "/validations", label: "Validations",                Icon: LuClipboardCheck  },
    { to: "/archive",     label: "Archivage",                  Icon: LuArchive         },
    { to: "/ai",          label: "Assistant IA",               Icon: LuCpu             },
  ],
  "Ing. Qualité": [
    { to: "/",            label: "Accueil",         end: true, Icon: LuHouse          },
    { to: "/dashboard",   label: "Tableau de bord",            Icon: LuLayoutDashboard },
    { to: "/list",        label: "Documents",                  Icon: LuFileText        },
    { to: "/validations", label: "Validations",                Icon: LuClipboardCheck  },
    { to: "/archive",     label: "Archivage",                  Icon: LuArchive         },
    { to: "/ai",          label: "Assistant IA",               Icon: LuCpu             },
  ],
  "Reviewer": [
    { to: "/",            label: "Accueil",         end: true, Icon: LuHouse          },
    { to: "/dashboard",   label: "Tableau de bord",            Icon: LuLayoutDashboard },
    { to: "/list",        label: "Documents",                  Icon: LuFileText        },
    { to: "/validations", label: "Validations",                Icon: LuClipboardCheck  },
    { to: "/archive",     label: "Archivage",                  Icon: LuArchive         },
    { to: "/ai",          label: "Assistant IA",               Icon: LuCpu             },
  ],
};
// Fallback for unknown/old roles — show full Admin nav
const NAV_ITEMS_DEFAULT = NAV_ITEMS_BY_ROLE["Admin"];

/* ── Quick-access roles (for switcher) ───────────────────── */
const QUICK_ROLES = [
  { name:"Admin",        email:"admin@test.com",    password:"Admin123!", color:"#f87171", Icon: LuCrown         },
  { name:"Ing. Qualité", email:"ing@test.com",      password:"Ing123!",   color:"#2dd4bf", Icon: LuWrench        },
  { name:"Reviewer",     email:"reviewer@test.com", password:"Rev123!",   color:"#4ade80", Icon: LuClipboardCheck },
];

/* ── Animation styles ─────────────────────────────────── */
const ANIMATION_STYLES = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes floatY {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-6px); }
  }
  .dot-float { animation: floatY 3s ease-in-out infinite; }
`;

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

/* ── AdminNavItem (red accent for Admin GED) ─────────────── */
function AdminNavItem({ to, label, icon, badge = 0 }) {
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
        {badge > 0 && (
          <span
            className="flex items-center justify-center rounded-full text-white font-bold"
            style={{
              minWidth: 17, height: 17,
              fontSize: 10,
              background: "linear-gradient(135deg,#ef4444,#dc2626)",
              boxShadow: "0 0 8px rgba(239,68,68,0.6)",
              padding: "0 4px",
            }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
        {isActive && (
          <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
            style={{ background: "linear-gradient(90deg,#f87171,#ef4444)" }} />
        )}
      </div>
    </NavLink>
  );
}

/* ── NavRoleSwitcher — dropdown for user/role in top nav ──── */
function NavRoleSwitcher() {
  const { currentUser, userRole, logout, autoLogin } = useUser();
  const navigate  = useNavigate();
  const [open,     setOpen]     = useState(false);
  const [switching,setSwitching]= useState(null);

  const roleColor = ROLE_COLOR[userRole] || "#94a3b8";
  const RoleIcon  = QUICK_ROLES.find(r => r.name === userRole)?.Icon || LuUser;

  const handleSwitch = async (role) => {
    if (switching || role.name === userRole) { setOpen(false); return; }
    setSwitching(role.name);
    try {
      await autoLogin(role.email, role.password);
      setOpen(false);
      navigate("/", { replace: true });
    } catch { /* ignore */ }
    finally { setSwitching(null); }
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  /* ── Not logged in: Connexion + S'inscrire buttons ── */
  if (!currentUser) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.06)",
            borderColor: "rgba(255,255,255,0.12)",
            color: "rgba(220,235,248,0.85)",
            cursor: "pointer",
          }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; }}
        >
          <LuUser size={13} /> Connexion
        </button>
        <button
          onClick={() => navigate("/register")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all duration-200"
          style={{
            background: "linear-gradient(135deg,#4ab83f,#3da333)",
            borderColor: "transparent",
            color: "#ffffff",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(74,184,63,0.3)",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(74,184,63,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 14px rgba(74,184,63,0.3)"; }}
        >
          S'inscrire
        </button>
      </div>
    );
  }

  /* ── Logged in: avatar + role + switcher dropdown ── */
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200"
        style={{
          background: open ? `${roleColor}12` : "rgba(255,255,255,0.05)",
          borderColor: open ? `${roleColor}40` : "rgba(255,255,255,0.1)",
          cursor: "pointer",
        }}
        onMouseEnter={e => { if(!open){ e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.18)"; }}}
        onMouseLeave={e => { if(!open){ e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; }}}
      >
        {/* Role icon */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background:`${roleColor}18`, border:`1.5px solid ${roleColor}35`, color:roleColor }}>
          <RoleIcon size={14} />
        </div>
        {/* Name + role */}
        <div className="leading-none text-left">
          <p className="text-[12.5px] font-semibold text-white m-0 leading-tight truncate max-w-[100px]">{currentUser.name}</p>
          <p className="text-[10.5px] font-bold m-0 mt-0.5 leading-tight" style={{ color:roleColor }}>{userRole}</p>
        </div>
        <LuChevronDown size={12} style={{ color:"rgba(168,191,212,0.45)", transform:open?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s", flexShrink:0 }} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border overflow-hidden"
          style={{ background:"#0d1f30", borderColor:"rgba(255,255,255,0.12)", boxShadow:"0 24px 60px rgba(0,0,0,0.6)", zIndex:100 }}>

          {/* Current user header */}
          <div className="px-4 pt-3.5 pb-3 border-b" style={{ borderColor:"rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:`${roleColor}18`, border:`1.5px solid ${roleColor}35` }}>
                <RoleIcon size={17} style={{ color:roleColor }} />
              </div>
              <div className="overflow-hidden">
                <p className="m-0 text-[13px] font-semibold text-white truncate">{currentUser.name}</p>
                <p className="m-0 text-[10.5px] truncate" style={{ color:"rgba(168,191,212,0.45)", fontFamily:"monospace" }}>{currentUser.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 mt-2.5 rounded-lg px-2 py-[4px] text-[11px] font-bold border"
              style={{ background:`${roleColor}15`, color:roleColor, borderColor:`${roleColor}35` }}>
              <LuShield size={10} /> {userRole}
            </span>
          </div>

          {/* Roles — informational only */}
          <p className="text-[10px] uppercase tracking-[1.5px] font-bold px-4 pt-3 pb-1.5 m-0" style={{ color:"rgba(168,191,212,0.4)" }}>Rôles disponibles</p>
          {QUICK_ROLES.map(role => {
            const RI       = role.Icon;
            const isActive = role.name === userRole;
            return (
              <div key={role.name}
                className="w-full flex items-center gap-3 px-4 py-2.5"
                style={{ background: isActive ? `${role.color}10` : "transparent" }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background:`${role.color}18`, border:`1px solid ${role.color}35` }}>
                  <RI size={12} style={{ color:role.color }} />
                </div>
                <p className="m-0 flex-1 text-[12.5px] font-semibold" style={{ color:isActive?role.color:"rgba(220,235,248,0.8)" }}>{role.name}</p>
                {isActive && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background:`${role.color}18`, color:role.color, border:`1px solid ${role.color}30` }}>Actif</span>}
              </div>
            );
          })}

          {/* Logout */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", margin:"4px 0 0" }}>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-[12.5px] font-semibold border-none transition-all"
              style={{ background:"transparent", color:"rgba(168,191,212,0.5)", cursor:"pointer" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.08)"; e.currentTarget.style.color="#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(168,191,212,0.5)"; }}>
              <LuLogOut size={13} /> Déconnexion
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Close on outside click */}
      {open && <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />}
      {open && <div className="relative z-[100]" />}
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────────── */
function Navbar({ onOpenLogin = () => {} }) {
  const { userRole, can, currentUser } = useUser();
  const [scrolled,     setScrolled]     = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending user requests count (Admin only)
  useEffect(() => {
    if (userRole !== "Admin") return;
    const fetchPending = () => {
      axios.get(`${API}/users/pending-count`)
        .then(r => setPendingCount(r.data.count))
        .catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [userRole]);

  // Fetch pending user requests count (Admin GED only)
  useEffect(() => {
    if (userRole !== "Admin GED") return;
    const fetchPending = () => {
      axios.get(`${API}/users/pending-count`)
        .then(r => setPendingCount(r.data.count))
        .catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [userRole]);

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
        <div className="max-w-[1400px] mx-auto px-6 h-[68px] flex items-center justify-between gap-4">

          {/* ── Left: Logo ── */}
          <NavLink to="/" className="no-underline flex items-center flex-shrink-0">
            <img
              src={logoImg}
              alt="ACTIA ES"
              className="h-12 w-auto transition-opacity duration-200 opacity-90 hover:opacity-100"
              style={{ filter: "drop-shadow(0 2px 16px rgba(74,184,63,0.45))" }}
            />
          </NavLink>

          {/* ── Center: Role-based nav links ── */}
          <div className="flex items-center gap-0.5 flex-1 justify-center">
            {currentUser ? (
              <>
                {navItems.map((item) => (
                  <NavItem key={item.to} to={item.to} label={item.label} end={item.end} icon={item.Icon} />
                ))}
                {userRole === "Admin" && (
                  <AdminNavItem to="/admin/users" label="Utilisateurs" icon={LuUsers} badge={pendingCount} />
                )}
              </>
            ) : (
              /* Visitor — Lecteur-level nav (read-only access) */
              <>
                <NavItem to="/"            label="Accueil"         end={true} icon={LuHouse}          />
                <NavItem to="/dashboard"   label="Tableau de bord"           icon={LuLayoutDashboard} />
                <NavItem to="/list"        label="Documents"                 icon={LuFileText}        />
                <NavItem to="/validations" label="Validations"               icon={LuClipboardCheck}  />
                <NavItem to="/archive"     label="Archivage"                 icon={LuArchive}         />
                <NavItem to="/ai"          label="Assistant IA"              icon={LuCpu}             />
              </>
            )}
          </div>

          {/* ── Right: Actions + Role switcher ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* + Nouveau (only if can create) */}
            {can("document:create") && (
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
            )}

            <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.09)" }} />
            <NotificationBell />

            {/* Role switcher dropdown */}
            <NavRoleSwitcher />
          </div>
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
function StatCard({ icon, label, value, sub, accent = "#60a5fa", onClick }) {
  const StatIcon = icon;
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
          <StatIcon size={17} style={{ color: accent }} />
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
function FeatureCard({ icon, title, desc, accent = "#60a5fa" }) {
  const FeatIcon = icon;
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
        <FeatIcon size={20} style={{ color: accent }} />
      </div>
      <p className="text-white font-semibold text-sm m-0 mb-1.5" style={{ letterSpacing: -0.2 }}>{title}</p>
      <p className="text-sm m-0 leading-relaxed" style={{ color: "rgba(168,191,212,0.6)" }}>{desc}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const { currentUser, login } = useUser();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [demoLoading,    setDemoLoading]    = useState(null);

  const [stats, setStats]               = useState(null);
  const [recentDocs, setRecentDocs]     = useState([]);
  const [pending, setPending]           = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedDoc, setSelectedDoc]   = useState(null);

  /* Quick-login from the public demo section */
  const handleDemoLogin = async (role) => {
    setDemoLoading(role.name);
    try {
      await login(role.email, role.password);
      navigate("/", { replace: true });
    } catch { /* silently ignore */ }
    finally { setDemoLoading(null); }
  };

  useEffect(() => {
    if (!currentUser) { setLoadingStats(false); return; }
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
  }, [currentUser]);

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
        <Navbar onOpenLogin={() => setShowLoginModal(true)} />

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
                ISO 9001 — Système en ligne
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
                onClick={() => currentUser ? navigate("/create") : setShowLoginModal(true)}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #4ab83f, #3da333)",
                  boxShadow: "0 8px 30px rgba(74,184,63,0.4)",
                  fontSize: 15,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <LuFilePlus size={16} /> Nouveau document
              </button>
              <button
                onClick={() => currentUser ? navigate("/list") : setShowLoginModal(true)}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(10px)",
                  fontSize: 15,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Voir les documents <LuArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {currentUser ? (
        <>
        {/* ── STATS ROW ─────────────────────────────── */}
        <div className="max-w-[1280px] mx-auto px-8 -mt-14 mb-8">
          <div className="flex gap-3.5 flex-wrap">
            <StatCard icon={LuFileText}    label="Total documents" value={loadingStats ? "…" : totalDocs} sub="dans le système"     accent="#60a5fa" onClick={() => navigate("/list")}        />
            <StatCard icon={LuClock}       label="En validation"   value={loadingStats ? "…" : pending}   sub="en attente"          accent={pending > 0 ? "#a5b4fc" : "#4ade80"} onClick={() => navigate("/validations")} />
            <StatCard icon={LuCircleCheck} label="Validés"         value={loadingStats ? "…" : validated}  sub="documents approuvés" accent="#4ade80" onClick={() => navigate("/list?statusName=Validé")}        />
            <StatCard icon={LuCircleAlert} label="En retard"       value={loadingStats ? "…" : overdue}    sub="révision dépassée"   accent={overdue > 0 ? "#fb923c" : "#4ade80"} onClick={() => navigate("/list?overdue=true")} />
            <StatCard icon={LuArchive}     label="Archivés"        value={loadingStats ? "…" : archived}   sub="archivage définitif" accent="#94a3b8" onClick={() => navigate("/archive")}    />
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
                    onClick={() => navigate(`/list?statusName=${encodeURIComponent(label)}`)}
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
                  { to:"/create",      icon:LuFilePlus,       label:"Nouveau document",    desc:"Créer et soumettre un document",     accent:"#4ab83f"  },
                  { to:"/list",        icon:LuList,           label:"Liste des documents",  desc:"Rechercher, filtrer, gérer",         accent:"#60a5fa"  },
                  { to:"/validations", icon:LuClipboardCheck, label:"Workflow validation",   desc:"Approuver ou rejeter des documents",  accent:"#a5b4fc"  },
                  { to:"/archive",     icon:LuArchive,        label:"Archivage ISO",        desc:"Gestion du cycle de vie",       accent:"#94a3b8"  },
                ].map(({ to, icon, label, desc, accent }) => {
                  const ActionIcon = icon;
                  const iconEl = <ActionIcon size={16} style={{ color: accent }} />;
                  return (
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
                          {iconEl}
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
                  );
                })}
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
                      onClick={() => setSelectedDoc(doc.id)}
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
                  Conformité ISO 9001
                </h2>
                <div className="w-1 h-8 rounded-full" style={{ background: "linear-gradient(to bottom, rgba(74,184,63,0.2), #4ab83f)" }} />
              </div>
              <p className="text-sm m-0 mt-2" style={{ color: "rgba(168,191,212,0.6)" }}>Système de gestion documentaire certifié — Traçabilité, sécurité et archivage normalisés</p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <FeatureCard icon={LuRefreshCw}      accent="#60a5fa" title="Cycle de vie ISO"        desc="Maîtrise complète du cycle documentaire conforme à la norme ISO 9001. Chaque document suit un workflow structuré garantissant la revue, l'approbation et la mise en circulation selon les exigences qualité en vigueur." />
              <FeatureCard icon={LuCircleCheckBig} accent="#4ade80" title="Validation"            desc="Processus d'approbation formalisé avec séparation stricte des responsabilités. Chaque décision est horodatée, signée numériquement et conservée dans un registre immuable pour assurer la conformité réglementaire." />
              <FeatureCard icon={LuShieldCheck}    accent="#a78bfa" title="Traçabilité"           desc="Journal d'audit exhaustif et infalsifiable pour chaque document. Toutes les actions — création, modification, approbation et archivage — sont enregistrées avec horodatage et identité de l'auteur." />
              <FeatureCard icon={LuArchive}        accent="#fbbf24" title="Archivage"             desc="Conservation sécurisée et pérenne des documents selon les exigences légales et normatives. L'archivage définitif garantit l'intégrité des données et la disponibilité permanente des versions historiques." />
              <FeatureCard icon={LuSearch}         accent="#2dd4bf" title="Recherche avancée"     desc="Accès rapide et ciblé à l'ensemble du référentiel documentaire grâce à des filtres multicritères. Recherche par type, statut, référence ou processus, avec consultation selon les habilitations attribuées." />
              <FeatureCard icon={LuUsers}          accent="#fb923c" title="Gestion des rôles"     desc="Contrôle d'accès granulaire fondé sur trois profils : Admin (accès complet), Ing. Qualité (rédaction et soumission) et Reviewer (validation). Chaque rôle dispose de permissions spécifiques garantissant la sécurité des données et la conformité aux politiques de gouvernance documentaire." />
            </div>
          </div>

          {/* User profile — Admin only, informational */}
          {currentUser?.role === "Admin" && (
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(248,113,113,0.12)", border:"1.5px solid rgba(248,113,113,0.25)" }}>
                <LuCrown size={22} style={{ color:"#f87171" }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-0.5 h-4 rounded-full" style={{ background: "#4ab83f" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color: "rgba(168,191,212,0.7)" }}>Profil utilisateur</p>
                </div>
                <p className="m-0 text-white font-bold text-xl" style={{ letterSpacing: -0.3 }}>{currentUser.name}</p>
                <p className="m-0 mt-1 text-sm flex items-center gap-1.5" style={{ color: "rgba(168,191,212,0.6)" }}>
                  <span className="font-bold" style={{ color: "#f87171" }}>{currentUser.role}</span>
                  <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                  {currentUser.email || "—"}
                </p>
              </div>
            </div>
          </GlassCard>
          )}
        </div>
        </>
        ) : (
        /* ════════════════════════════════════════════
           PUBLIC VIEW — not authenticated
        ════════════════════════════════════════════ */
        <>
          {/* ── Features ───────────────────────────── */}
          <div className="max-w-[1280px] mx-auto px-8 pb-10">
            <div className="text-center mb-7">
              <p className="text-xs uppercase tracking-widest font-semibold mb-3 flex items-center justify-center gap-1.5" style={{ color:"rgba(168,191,212,0.5)" }}>
                <LuAward size={12} style={{ color:"#4ab83f" }} /> Fonctionnalités clés
              </p>
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-1 h-8 rounded-full" style={{ background:"linear-gradient(to bottom,#4ab83f,rgba(74,184,63,0.2))" }} />
                <h2 className="m-0 text-3xl font-black text-white" style={{ letterSpacing:-1, textShadow:"0 4px 20px rgba(74,184,63,0.3)" }}>
                  Conformité ISO 9001
                </h2>
                <div className="w-1 h-8 rounded-full" style={{ background:"linear-gradient(to bottom,rgba(74,184,63,0.2),#4ab83f)" }} />
              </div>
              <p className="text-sm m-0 mt-2" style={{ color:"rgba(168,191,212,0.6)" }}>
                Système de gestion documentaire certifié — Traçabilité, sécurité et archivage normalisés
              </p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <FeatureCard icon={LuRefreshCw}      accent="#60a5fa" title="Cycle de vie ISO"        desc="Maîtrise complète du cycle documentaire conforme à la norme ISO 9001. Chaque document suit un workflow structuré garantissant la revue, l'approbation et la mise en circulation selon les exigences qualité en vigueur." />
              <FeatureCard icon={LuCircleCheckBig} accent="#4ade80" title="Validation"            desc="Processus d'approbation formalisé avec séparation stricte des responsabilités. Chaque décision est horodatée, signée numériquement et conservée dans un registre immuable pour assurer la conformité réglementaire." />
              <FeatureCard icon={LuShieldCheck}    accent="#a78bfa" title="Traçabilité"           desc="Journal d'audit exhaustif et infalsifiable pour chaque document. Toutes les actions — création, modification, approbation et archivage — sont enregistrées avec horodatage et identité de l'auteur." />
              <FeatureCard icon={LuArchive}        accent="#fbbf24" title="Archivage"             desc="Conservation sécurisée et pérenne des documents selon les exigences légales et normatives. L'archivage définitif garantit l'intégrité des données et la disponibilité permanente des versions historiques." />
              <FeatureCard icon={LuSearch}         accent="#2dd4bf" title="Recherche avancée"     desc="Accès rapide et ciblé à l'ensemble du référentiel documentaire grâce à des filtres multicritères. Recherche par type, statut, référence ou processus, avec consultation selon les habilitations attribuées." />
              <FeatureCard icon={LuUsers}          accent="#fb923c" title="Gestion des rôles"     desc="Contrôle d'accès granulaire fondé sur trois profils : Admin (accès complet), Ing. Qualité (rédaction et soumission) et Reviewer (validation). Chaque rôle dispose de permissions spécifiques garantissant la sécurité des données et la conformité aux politiques de gouvernance documentaire." />
            </div>
          </div>

          {/* ── Module links for visitors (Lecteur access) ─── */}
          <div className="max-w-[1280px] mx-auto px-8 pb-10">
            <div className="text-center mb-7">
              <p className="text-xs uppercase tracking-widest font-semibold mb-3 flex items-center justify-center gap-1.5" style={{ color:"rgba(168,191,212,0.5)" }}>
                <LuList size={12} style={{ color:"#4ab83f" }} /> Accès direct
              </p>
              <h2 className="m-0 text-2xl font-black text-white" style={{ letterSpacing:-0.7 }}>Modules disponibles</h2>
              <p className="text-sm m-0 mt-2" style={{ color:"rgba(168,191,212,0.6)" }}>
                Consultez les documents, validations et archives en mode lecture
              </p>
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(500px,1fr))" }}>

              {/* Documents */}
              <NavLink to="/list" className="no-underline rounded-2xl border flex items-center gap-4 px-6 py-5 transition-all duration-200"
                style={{ background:"rgba(255,255,255,0.025)", borderColor:"rgba(96,165,250,0.15)" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(96,165,250,0.06)"; e.currentTarget.style.borderColor="rgba(96,165,250,0.3)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor="rgba(96,165,250,0.15)"; e.currentTarget.style.transform="translateY(0)"; }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(96,165,250,0.12)", border:"1px solid rgba(96,165,250,0.2)" }}>
                  <LuFileText size={22} style={{ color:"#60a5fa" }} />
                </div>
                <div className="flex-1">
                  <p className="m-0 text-base font-bold text-white" style={{ letterSpacing:-0.2 }}>Liste des Documents</p>
                  <p className="m-0 text-[12px] mt-0.5" style={{ color:"rgba(168,191,212,0.6)" }}>Consulter les documents qualité ISO — lecture seule</p>
                </div>
                <LuArrowRight size={16} style={{ color:"rgba(96,165,250,0.5)", flexShrink:0 }} />
              </NavLink>

              {/* Validations */}
              <NavLink to="/validations" className="no-underline rounded-2xl border flex items-center gap-4 px-6 py-5 transition-all duration-200"
                style={{ background:"rgba(255,255,255,0.025)", borderColor:"rgba(165,180,252,0.15)" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(165,180,252,0.06)"; e.currentTarget.style.borderColor="rgba(165,180,252,0.3)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor="rgba(165,180,252,0.15)"; e.currentTarget.style.transform="translateY(0)"; }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(165,180,252,0.12)", border:"1px solid rgba(165,180,252,0.2)" }}>
                  <LuClipboardCheck size={22} style={{ color:"#a5b4fc" }} />
                </div>
                <div className="flex-1">
                  <p className="m-0 text-base font-bold text-white" style={{ letterSpacing:-0.2 }}>Workflow de Validation</p>
                  <p className="m-0 text-[12px] mt-0.5" style={{ color:"rgba(168,191,212,0.6)" }}>Suivre les cycles de validation — lecture seule</p>
                </div>
                <LuArrowRight size={16} style={{ color:"rgba(165,180,252,0.5)", flexShrink:0 }} />
              </NavLink>

              {/* Archivage */}
              <NavLink to="/archive" className="no-underline rounded-2xl border flex items-center gap-4 px-6 py-5 transition-all duration-200"
                style={{ background:"rgba(255,255,255,0.025)", borderColor:"rgba(251,191,36,0.15)" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(251,191,36,0.06)"; e.currentTarget.style.borderColor="rgba(251,191,36,0.3)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor="rgba(251,191,36,0.15)"; e.currentTarget.style.transform="translateY(0)"; }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.2)" }}>
                  <LuArchive size={22} style={{ color:"#fbbf24" }} />
                </div>
                <div className="flex-1">
                  <p className="m-0 text-base font-bold text-white" style={{ letterSpacing:-0.2 }}>Archivage</p>
                  <p className="m-0 text-[12px] mt-0.5" style={{ color:"rgba(168,191,212,0.6)" }}>Consulter les documents archivés — lecture seule</p>
                </div>
                <LuArrowRight size={16} style={{ color:"rgba(251,191,36,0.5)", flexShrink:0 }} />
              </NavLink>

              {/* Assistant IA */}
              <NavLink to="/ai" className="no-underline rounded-2xl border flex items-center gap-4 px-6 py-5 transition-all duration-200"
                style={{ background:"rgba(255,255,255,0.025)", borderColor:"rgba(74,184,63,0.15)" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(74,184,63,0.06)"; e.currentTarget.style.borderColor="rgba(74,184,63,0.3)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor="rgba(74,184,63,0.15)"; e.currentTarget.style.transform="translateY(0)"; }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(74,184,63,0.12)", border:"1px solid rgba(74,184,63,0.2)" }}>
                  <LuCpu size={22} style={{ color:"#4ab83f" }} />
                </div>
                <div className="flex-1">
                  <p className="m-0 text-base font-bold text-white" style={{ letterSpacing:-0.2 }}>Assistant IA</p>
                  <p className="m-0 text-[12px] mt-0.5" style={{ color:"rgba(168,191,212,0.6)" }}>Interroger la base documentaire en langage naturel</p>
                </div>
                <LuArrowRight size={16} style={{ color:"rgba(74,184,63,0.5)", flexShrink:0 }} />
              </NavLink>

            </div>
          </div>

          {/* ── Demo role cards ─────────────────────── */}
          <div className="max-w-[960px] mx-auto px-8 pb-20">
            <div
              className="rounded-3xl p-8"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background:"rgba(74,184,63,0.08)", border:"1.5px solid rgba(74,184,63,0.2)" }}>
                  <LuShield size={12} style={{ color:"#4ab83f" }} />
                  <span className="text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color:"#4ab83f" }}>Rôles disponibles</span>
                </div>
                <h2 className="m-0 mb-2 text-[24px] font-black text-white" style={{ letterSpacing:-0.7 }}>Accès par profil</h2>
                <p className="m-0 text-[13px]" style={{ color:"rgba(168,191,212,0.55)" }}>
                  Connectez-vous avec votre compte pour accéder aux fonctionnalités de votre rôle
                </p>
              </div>

              {/* Role cards — informational only */}
              <div className="grid gap-4" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))" }}>
                {QUICK_ROLES.map(role => {
                  const RI   = role.Icon;
                  const desc = role.name === "Admin"
                    ? "Accès administrateur complet — gestion des documents, utilisateurs et archivage."
                    : role.name === "Ing. Qualité"
                    ? "Rédaction et soumission de documents qualité dans le workflow ISO."
                    : "Relecture et validation des documents soumis pour approbation.";
                  return (
                    <div
                      key={role.name}
                      className="rounded-2xl p-5"
                      style={{
                        background: `${role.color}0a`,
                        border: `1.5px solid ${role.color}25`,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      }}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background:`${role.color}15`, border:`1.5px solid ${role.color}30` }}>
                        <RI size={22} style={{ color:role.color }} />
                      </div>
                      <p className="m-0 mb-1 font-black text-[18px]" style={{ color:role.color, letterSpacing:-0.4 }}>{role.name}</p>
                      <p className="m-0 text-[12px] leading-relaxed" style={{ color:"rgba(168,191,212,0.55)" }}>{desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Footer links */}
              <p className="text-center m-0 mt-7 text-[12.5px]" style={{ color:"rgba(168,191,212,0.4)" }}>
                Vous avez un compte ?{" "}
                <NavLink to="/login" style={{ color:"#4ab83f", fontWeight:700, textDecoration:"none" }}>
                  Se connecter →
                </NavLink>
                {"  ·  "}
                <NavLink to="/register" style={{ color:"rgba(168,191,212,0.65)", fontWeight:600, textDecoration:"none" }}>
                  Créer un compte
                </NavLink>
              </p>
            </div>
          </div>
        </>
        )}

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
              {" "}— GED · ISO 9001
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

      {/* ── Login Modal ─────────────────────────────── */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          message="Connectez-vous pour accéder à cette fonctionnalité."
          infoOnly
        />
      )}

      {/* ── Document Detail Modal ────────────────────── */}
      {selectedDoc && <DocDetailModal docId={selectedDoc} onClose={() => setSelectedDoc(null)} />}
    </div>
  );
}