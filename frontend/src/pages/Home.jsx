// ============================================================
// pages/Home.jsx
// RÔLE : Page d'accueil publique de l'application GED.
//        Point d'entrée pour les utilisateurs non connectés.
//        Affiche les statistiques globales des documents en temps
//        réel, une animation typewriter du nom de l'app, et un
//        accès rapide aux fonctionnalités selon le rôle connecté.
//        Contient le LoginModal intégré pour connexion rapide
//        sans redirection vers /login.
// ============================================================

import { useEffect, useState, useRef, useCallback } from "react";
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
  LuHouse, LuLayoutDashboard, LuBell, LuCpu, LuGitBranch,
  LuCrown, LuWrench, LuChevronDown, LuShield, LuLock,
} from "react-icons/lu";
import { API } from "../config";
import LoginModal from "../components/LoginModal";
import DocDetailModal from "../components/DocDetailModal";

/* ── Hero typewriter hook ────────────────────────────────── */
function useHeroTypewriter() {
  const LINE1 = "Gestion Électronique";
  const LINE2 = "des Documents";
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  // phase: 0=typing line1  1=pause  2=typing line2  3=hold then instant reset
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let timer;
    if (phase === 0) {
      if (t1.length < LINE1.length) {
        timer = setTimeout(() => setT1(LINE1.slice(0, t1.length + 1)), 52);
      } else {
        timer = setTimeout(() => setPhase(1), 200);
      }
    } else if (phase === 1) {
      timer = setTimeout(() => setPhase(2), 100);
    } else if (phase === 2) {
      if (t2.length < LINE2.length) {
        timer = setTimeout(() => setT2(LINE2.slice(0, t2.length + 1)), 62);
      } else {
        timer = setTimeout(() => setPhase(3), 2200);
      }
    } else if (phase === 3) {
      setT1("");
      setT2("");
      timer = setTimeout(() => setPhase(0), 500);
    }
    return () => clearTimeout(timer);
  }, [phase, t1, t2]);

  const typingLine1 = phase === 0;
  const typingLine2 = phase === 2;

  return { t1, t2, typingLine1, typingLine2 };
}

/* ── Status & Role config ────────────────────────────────── */
const STATUS_CFG = {
  "Brouillon":         { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)", Icon: LuPencil         },
  "En rédaction":      { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(187,247,208,0.15)", Icon: LuPenLine        },
  "Appel en relecture":{ bg:"rgba(255,247,205,0.08)", text:"#fbbf24", border:"rgba(252,211,77,0.2)",   Icon: LuEye            },
  "En relecture":      { bg:"rgba(239,246,255,0.08)", text:"#60a5fa", border:"rgba(191,219,254,0.15)", Icon: LuEye            },
  "En correction":     { bg:"rgba(255,237,213,0.08)", text:"#f97316", border:"rgba(253,186,116,0.2)",  Icon: LuRefreshCw      },
  "En validation":     { bg:"rgba(238,242,255,0.08)", text:"#a5b4fc", border:"rgba(199,210,254,0.15)", Icon: LuClipboardCheck },
  "Validé":            { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(134,239,172,0.2)",  Icon: LuCircleCheckBig },
  "Diffusé":           { bg:"rgba(240,253,250,0.08)", text:"#2dd4bf", border:"rgba(153,246,228,0.15)", Icon: LuShare2         },
  "Obsolète":          { bg:"rgba(255,247,237,0.08)", text:"#fb923c", border:"rgba(254,215,170,0.15)", Icon: LuTriangleAlert  },
  "Archivé":           { bg:"rgba(248,250,252,0.06)", text:"#94a3b8", border:"rgba(203,213,225,0.12)", Icon: LuArchive        },
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
    { to: "/workflow",    label: "Workflow",                   Icon: LuGitBranch       },
    { to: "/ai",          label: "Assistant IA",               Icon: LuCpu             },
  ],
  "Ing. Qualité": [
    { to: "/",            label: "Accueil",         end: true, Icon: LuHouse          },
    { to: "/dashboard",   label: "Tableau de bord",            Icon: LuLayoutDashboard },
    { to: "/list",        label: "Documents",                  Icon: LuFileText        },
    { to: "/validations", label: "Validations",                Icon: LuClipboardCheck  },
    { to: "/archive",     label: "Archivage",                  Icon: LuArchive         },
    { to: "/workflow",    label: "Workflow",                   Icon: LuGitBranch       },
    { to: "/ai",          label: "Assistant IA",               Icon: LuCpu             },
  ],
  "Reviewer": [
    { to: "/",            label: "Accueil",         end: true, Icon: LuHouse          },
    { to: "/list",        label: "Documents",                  Icon: LuFileText        },
    { to: "/validations", label: "Validations",                Icon: LuClipboardCheck  },
    { to: "/archive",     label: "Archivage",                  Icon: LuArchive         },
    { to: "/workflow",    label: "Workflow",                   Icon: LuGitBranch       },
    { to: "/ai",          label: "Assistant IA",               Icon: LuCpu             },
  ],
};
NAV_ITEMS_BY_ROLE["Visiteur"] = [
  { to: "/",         label: "Accueil",      end: true, Icon: LuHouse      },
  { to: "/workflow", label: "Workflow",                Icon: LuGitBranch  },
  { to: "/archive",  label: "Docs archivés",           Icon: LuArchive    },
  { to: "/ai",       label: "Assistant IA",            Icon: LuCpu        },
];

// Fallback for unauthenticated — same as Visiteur
const NAV_ITEMS_DEFAULT = NAV_ITEMS_BY_ROLE["Visiteur"];

/* ── Quick-access roles (for switcher) ───────────────────── */
const QUICK_ROLES = [
  { name:"Admin",        email:"admin@test.com",    password:"Admin123!", color:"#f87171", Icon: LuCrown         },
  { name:"Ing. Qualité", email:"ing@test.com",      password:"Ing123!",   color:"#2dd4bf", Icon: LuWrench        },
  { name:"Reviewer",     email:"reviewer@test.com", password:"Rev123!",   color:"#4ade80", Icon: LuClipboardCheck },
];

/* ── Animation styles ─────────────────────────────────── */
const ANIMATION_STYLES = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .dot-float { animation: floatY 3s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
  .dot-pulse { animation: pulse 2s ease-in-out infinite; }

  @keyframes featShimmer {
    from { transform: translateX(-180%) skewX(-18deg); opacity: 0.55; }
    to   { transform: translateX(380%)  skewX(-18deg); opacity: 0; }
  }
  @keyframes iconGlow {
    0%,100% { box-shadow: 0 0 0px transparent; }
    50%     { box-shadow: 0 0 18px var(--feat-accent, #60a5fa); }
  }
  @keyframes featSlideUp {
    from { opacity: 0; transform: translateY(32px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes tagPulse {
    0%,100% { opacity: 0.7; } 50% { opacity: 1; }
  }
  .feat-shimmer-line { animation: featShimmer 0.65s ease-out forwards; }
  .feat-slide-up     { animation: featSlideUp 0.55s cubic-bezier(.22,.68,0,1.15) both; }

  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heroGlow {
    0%,100% { text-shadow: 0 0 40px rgba(74,184,63,0.4); }
    50%     { text-shadow: 0 0 70px rgba(74,184,63,0.75), 0 0 120px rgba(74,184,63,0.3); }
  }
  .hero-fade-0 { animation: heroFadeUp 0.7s cubic-bezier(.22,.68,0,1.1) 0.05s both; }
  .hero-fade-1 { animation: heroFadeUp 0.7s cubic-bezier(.22,.68,0,1.1) 0.2s  both; }
  .hero-fade-2 { animation: heroFadeUp 0.7s cubic-bezier(.22,.68,0,1.1) 0.38s both; }
  .hero-fade-3 { animation: heroFadeUp 0.7s cubic-bezier(.22,.68,0,1.1) 0.55s both; }
  .hero-glow   { animation: heroGlow 3s ease-in-out infinite; }

  @keyframes sectionFadeIn {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .section-fade-in { animation: sectionFadeIn 0.55s cubic-bezier(.22,.68,0,1.1) both; }

  @keyframes rowSlideIn {
    from { opacity: 0; transform: translateX(-18px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .row-slide-in { animation: rowSlideIn 0.42s cubic-bezier(.22,.68,0,1.1) both; }

  @keyframes progressFill {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  .progress-fill { transform-origin: left; animation: progressFill 1.2s cubic-bezier(.22,.68,0,1.1) both; }

  @keyframes bubbleGlow {
    0%, 100% { box-shadow: 0 0 0px transparent; }
    50%      { box-shadow: 0 0 14px var(--glow-color, rgba(74,184,63,0.35)); }
  }
  .bubble-glow { animation: bubbleGlow 2.8s ease-in-out infinite; }

  @keyframes leftBarGrow {
    from { height: 0%; top: 50%; opacity: 0; }
    to   { height: 100%; top: 0%; opacity: 1; }
  }
  .left-bar-grow { position: absolute; left: 0; width: 3px; border-radius: 4px 0 0 4px;
    animation: leftBarGrow 0.4s cubic-bezier(.22,.68,0,1.1) both; }

  @keyframes shimmerRow {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .shimmer-hover:hover {
    background: linear-gradient(105deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
    background-size: 200% 100%;
    animation: shimmerRow 1.2s ease infinite;
  }
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
              className="actia-logo h-12 w-auto"
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
              /* Visitor — read-only: home, workflow, archived docs, AI */
              <>
                <NavItem to="/"         label="Accueil"       end={true} icon={LuHouse}     />
                <NavItem to="/workflow" label="Workflow"                  icon={LuGitBranch} />
                <NavItem to="/archive"  label="Docs archivés"            icon={LuArchive}   />
                <NavItem to="/ai"       label="Assistant IA"             icon={LuCpu}       />
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

function StatCard({ icon, label, value, sub, accent = "#60a5fa", onClick }) {
  const [hov, setHov] = useState(false);
  const StatIcon = icon;
  const num = typeof value === "number" ? value : 0;
  const maxVal = 100;
  const pct = maxVal > 0 ? num / maxVal : 0;
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex-1 min-w-[150px] rounded-2xl border p-5 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
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

      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <StatIcon size={20} style={{ color: accent }} />
        </div>
        <MiniRing pct={pct} accent={accent} />
      </div>
      
      <p className="font-black text-4xl m-0 leading-none text-white" style={{ letterSpacing: -1, textShadow: num>0 ? `0 0 24px ${accent}60` : "none" }}>{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider m-0 mt-2" style={{ color: `${accent}`, opacity:0.8 }}>{label}</p>
      {sub && <p className="text-sm m-0 mt-1" style={{ color: "rgba(168,191,212,0.55)" }}>{sub}</p>}
      
      {onClick && (
        <div className="flex items-center gap-1 mt-2.5 text-xs font-semibold transition-opacity" style={{ color:accent, opacity:hov?1:0 }}>
          Voir <LuArrowRight size={11} />
        </div>
      )}
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

/* ── Feature Card — scroll-reveal + shimmer + expand panel ─ */
function FeatureCard({ icon, title, desc, accent = "#60a5fa", tag, index = 0, href, linkLabel = "En savoir plus", locked = false }) {
  const FeatIcon   = icon;
  const [hov,      setHov]      = useState(false);
  const [visible,  setVisible]  = useState(false);
  const [shimmer,  setShimmer]  = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const handleEnter = () => { setHov(true); setShimmer(true); };
  const handleLeave = () => { setHov(false); setTimeout(() => setShimmer(false), 700); };

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="rounded-2xl border relative overflow-hidden"
      style={{
        width: 280,
        flexShrink: 0,
        background: expanded ? `${accent}0e` : hov ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: expanded ? `${accent}55` : hov ? `${accent}45` : "rgba(255,255,255,0.08)",
        boxShadow: expanded
          ? `0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px ${accent}30, 0 0 60px ${accent}12`
          : hov
            ? `0 20px 50px rgba(0,0,0,0.35), 0 0 0 1px ${accent}25`
            : "0 4px 24px rgba(0,0,0,0.18)",
        transform: visible
          ? hov && !expanded ? "translateY(-5px) scale(1.012)" : "translateY(0) scale(1)"
          : "translateY(32px) scale(0.97)",
        opacity: visible ? 1 : 0,
        transition: `opacity 0.6s ${index * 0.08}s ease, transform 0.5s cubic-bezier(.22,.68,0,1.15), border-color 0.3s, box-shadow 0.3s, background 0.3s`,
      }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-2xl transition-all duration-300"
        style={{ background: expanded || hov
          ? `linear-gradient(90deg, ${accent}, ${accent}88, transparent)`
          : `linear-gradient(90deg, ${accent}55, transparent)`,
        }} />

      {/* Shimmer sweep */}
      {shimmer && !expanded && (
        <div className="feat-shimmer-line absolute inset-0 pointer-events-none"
          style={{ width: "40%", background: `linear-gradient(105deg, transparent, ${accent}18, transparent)`, zIndex: 1 }} />
      )}

      {/* Background glow blob */}
      <div className="absolute bottom-0 right-0 pointer-events-none rounded-full transition-all duration-500"
        style={{
          width: 160, height: 160,
          background: `radial-gradient(circle, ${accent}${expanded ? "22" : hov ? "18" : "0a"} 0%, transparent 70%)`,
          filter: "blur(32px)",
          transform: expanded || hov ? "scale(1.4)" : "scale(1)",
        }} />

      <div className="relative z-10 p-5 flex flex-col">
        {/* Tag */}
        {tag && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest mb-3 self-start"
            style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30`, animation: "tagPulse 3s ease-in-out infinite" }}>
            {tag}
          </span>
        )}

        {/* Icon + title row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
            style={{
              background: expanded ? `${accent}28` : hov ? `${accent}22` : `${accent}14`,
              border: `1.5px solid ${accent}${expanded ? "55" : hov ? "45" : "25"}`,
              boxShadow: expanded || hov ? `0 0 20px ${accent}35` : "none",
              transform: expanded ? "scale(1.08) rotate(-4deg)" : hov ? "scale(1.05) rotate(-2deg)" : "scale(1)",
            }}>
            <FeatIcon size={20} style={{ color: accent, transition: "all 0.3s" }} />
          </div>
          <p className="text-white font-bold text-[15px] m-0 leading-tight flex-1" style={{ letterSpacing: -0.3 }}>
            {title}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px mb-3 rounded-full transition-all duration-500"
          style={{ background: expanded ? `${accent}45` : hov ? `${accent}35` : "rgba(255,255,255,0.06)", width: expanded || hov ? "100%" : "40%" }} />

        {/* Short desc — hidden when expanded */}
        <p className="text-[12.5px] m-0 leading-relaxed transition-all duration-300"
          style={{
            color: "rgba(168,191,212,0.55)",
            maxHeight: expanded ? 0 : 120,
            opacity: expanded ? 0 : 1,
            overflow: "hidden",
            marginBottom: expanded ? 0 : 12,
          }}>
          {desc.slice(0, 80)}…
        </p>

        {/* ── Expanded panel ─────────────────────────── */}
        <div style={{
          maxHeight: expanded ? 400 : 0,
          opacity: expanded ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.5s cubic-bezier(.22,.68,0,1.1), opacity 0.35s ease",
        }}>
          <div className="rounded-xl p-4 mb-3"
            style={{ background: `${accent}0d`, border: `1px solid ${accent}25` }}>
            <p className="text-[13.5px] font-bold leading-[1.75] m-0"
              style={{ color: "rgba(220,235,248,0.95)", letterSpacing: -0.1 }}>
              {desc}
            </p>
          </div>
          {href && (
            locked ? (
              <div className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1.5px solid rgba(255,255,255,0.08)",
                  color: "rgba(168,191,212,0.35)",
                  fontSize: 13, fontWeight: 600,
                }}>
                <LuLock size={13} />
                Connexion requise
              </div>
            ) : (
              <NavLink to={href}
                className="no-underline w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-[13px] transition-all duration-200"
                style={{
                  background: `${accent}30`,
                  color: "#ffffff",
                  border: `1.5px solid ${accent}60`,
                  boxShadow: `0 4px 14px ${accent}25`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${accent}50`;
                  e.currentTarget.style.boxShadow = `0 6px 20px ${accent}40`;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `${accent}30`;
                  e.currentTarget.style.boxShadow = `0 4px 14px ${accent}25`;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {linkLabel} <LuArrowRight size={13} />
              </NavLink>
            )
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold border-none bg-transparent cursor-pointer p-0 transition-all duration-200"
          style={{ color: expanded ? "rgba(168,191,212,0.5)" : accent }}
        >
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300"
            style={{ background: expanded ? "rgba(168,191,212,0.4)" : accent }} />
          {expanded ? "Réduire" : "En savoir plus"}
          <LuArrowRight size={11}
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.3s" }} />
        </button>
      </div>
    </div>
  );
}

/* ── Role config for profile card ───────────────────────── */
const ROLE_CFG = {
  "Admin": {
    color:  "#f87171",
    bg:     "rgba(248,113,113,0.10)",
    border: "rgba(248,113,113,0.28)",
    glow:   "rgba(248,113,113,0.18)",
    Icon:   LuCrown,
    perms:  [
      { label: "Gestion documents",    Icon: LuFileText       },
      { label: "Gestion utilisateurs", Icon: LuUsers          },
      { label: "Archivage",            Icon: LuArchive        },
      { label: "Workflows",            Icon: LuGitBranch      },
      { label: "Journaux d'audit",     Icon: LuShield         },
      { label: "Accès complet",        Icon: LuCrown          },
    ],
  },
  "Ing. Qualité": {
    color:  "#2dd4bf",
    bg:     "rgba(45,212,191,0.08)",
    border: "rgba(45,212,191,0.25)",
    glow:   "rgba(45,212,191,0.15)",
    Icon:   LuWrench,
    perms:  [
      { label: "Créer documents",         Icon: LuFilePlus       },
      { label: "Modifier documents",      Icon: LuPencil         },
      { label: "Soumettre au workflow",   Icon: LuGitBranch      },
      { label: "Journaux documentaires",  Icon: LuShieldCheck    },
      { label: "Assistant IA",            Icon: LuCpu            },
    ],
  },
  "Reviewer": {
    color:  "#4ade80",
    bg:     "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.25)",
    glow:   "rgba(74,222,128,0.15)",
    Icon:   LuClipboardCheck,
    perms:  [
      { label: "Consulter documents",    Icon: LuFileText        },
      { label: "Valider / Rejeter",      Icon: LuClipboardCheck  },
      { label: "Ajouter commentaires",   Icon: LuEye             },
      { label: "Recevoir notifications", Icon: LuBell            },
    ],
  },
  "Visiteur": {
    color:  "#a78bfa",
    bg:     "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.25)",
    glow:   "rgba(167,139,250,0.15)",
    Icon:   LuEye,
    perms:  [
      { label: "Consulter documents", Icon: LuFileText  },
      { label: "Consulter archivage", Icon: LuArchive   },
      { label: "Accès en lecture",    Icon: LuLock       },
    ],
  },
};

/* ── UserProfileCard ─────────────────────────────────────── */
function UserProfileCard({ user }) {
  const cfg      = ROLE_CFG[user.role] || ROLE_CFG["Admin"];
  const RoleIcon = cfg.Icon;
  const [visible, setVisible] = useState(false);
  const [hov,     setHov]     = useState(false);
  const [hovPerm, setHovPerm] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="rounded-2xl border relative overflow-hidden transition-all duration-500"
      style={{
        background:   hov ? `rgba(255,255,255,0.055)` : "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor:  hov ? cfg.border : "rgba(255,255,255,0.08)",
        boxShadow:    hov
          ? `0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.color}20, 0 0 60px ${cfg.glow}`
          : "0 8px 32px rgba(0,0,0,0.2)",
        opacity:   visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(.22,.68,0,1.15), border-color 0.3s, box-shadow 0.3s, background 0.3s",
      }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl transition-all duration-500"
        style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}55, transparent)`,
                 opacity: hov ? 1 : 0.5 }} />

      {/* Animated background glow */}
      <div className="absolute top-0 right-0 pointer-events-none rounded-full transition-all duration-700"
        style={{
          width: 300, height: 300,
          background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 65%)`,
          filter: "blur(40px)",
          transform: hov ? "translate(20%, -20%) scale(1.3)" : "translate(30%, -30%) scale(1)",
        }} />

      <div className="relative z-10 p-6">
        <div className="flex items-start gap-5 flex-wrap">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-400"
              style={{
                background: cfg.bg,
                border: `2px solid ${cfg.border}`,
                boxShadow: hov ? `0 0 28px ${cfg.glow}` : "none",
                transform: hov ? "scale(1.08) rotate(-4deg)" : "scale(1) rotate(0deg)",
              }}
            >
              <RoleIcon size={28} style={{ color: cfg.color }} />
            </div>
            {/* Online dot */}
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a1420]"
              style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}`, animation: "pulse 2s ease-in-out infinite" }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background: "#4ab83f" }} />
              <p className="text-[10px] font-bold uppercase tracking-[1.8px] m-0" style={{ color: "rgba(168,191,212,0.5)" }}>
                Profil utilisateur
              </p>
            </div>
            <p className="m-0 text-white font-black text-2xl leading-tight" style={{ letterSpacing: -0.5 }}>
              {user.name}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
              >
                <RoleIcon size={10} /> {user.role}
              </span>
              <span className="text-[12px]" style={{ color: "rgba(168,191,212,0.4)" }}>·</span>
              <span className="text-[12px]" style={{ color: "rgba(168,191,212,0.55)" }}>{user.email}</span>
            </div>
          </div>

          {/* Session badge */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border self-start"
            style={{ background: "rgba(74,184,63,0.08)", borderColor: "rgba(74,184,63,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ab83f", boxShadow: "0 0 6px #4ab83f", animation: "pulse 2s ease-in-out infinite" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#4ab83f" }}>Session active</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px my-5 rounded-full transition-all duration-500"
          style={{ background: hov ? `linear-gradient(90deg, ${cfg.color}30, rgba(255,255,255,0.06), transparent)` : "rgba(255,255,255,0.06)" }} />

        {/* Permissions */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[1.5px] mb-3 m-0" style={{ color: "rgba(168,191,212,0.4)" }}>
            Permissions accordées
          </p>
          <div className="flex flex-wrap gap-2">
            {cfg.perms.map(({ label, Icon: PermIcon }, i) => (
              <div
                key={label}
                onMouseEnter={() => setHovPerm(i)}
                onMouseLeave={() => setHovPerm(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-default transition-all duration-200"
                style={{
                  background:   hovPerm === i ? cfg.bg     : "rgba(255,255,255,0.04)",
                  borderColor:  hovPerm === i ? cfg.border : "rgba(255,255,255,0.08)",
                  transform:    hovPerm === i ? "translateY(-2px) scale(1.03)" : "translateY(0) scale(1)",
                  boxShadow:    hovPerm === i ? `0 4px 14px ${cfg.glow}` : "none",
                  opacity: visible ? 1 : 0,
                  transition: `opacity 0.5s ${i * 0.06 + 0.3}s ease, transform 0.2s, border-color 0.2s, background 0.2s`,
                }}
              >
                <PermIcon size={12} style={{ color: hovPerm === i ? cfg.color : "rgba(168,191,212,0.45)", transition: "color 0.2s" }} />
                <span className="text-[11.5px] font-semibold whitespace-nowrap"
                  style={{ color: hovPerm === i ? cfg.color : "rgba(168,191,212,0.65)", transition: "color 0.2s" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Features data (shared between auth + public views) ─── */
const FEATURES = [
  {
    icon:      LuRefreshCw,
    accent:    "#60a5fa",
    tag:       "ISO 9001:2015",
    title:     "Cycle de vie documentaire",
    desc:      "Pilotage intégral du cycle documentaire — de la rédaction à l'obsolescence. Chaque étape est formalisée, tracée et soumise aux contrôles qualité définis par le référentiel ISO 9001:2015.",
    href:      "/workflow",
    linkLabel: "Voir le workflow",
    public:    true,
  },
  {
    icon:      LuCircleCheckBig,
    accent:    "#4ade80",
    tag:       "Workflow",
    title:     "Validation multi-niveaux",
    desc:      "Circuit d'approbation avec séparation stricte des responsabilités. Chaque décision est horodatée, consignée dans un registre certifié et opposable lors d'un audit de conformité réglementaire.",
    href:      "/validations",
    linkLabel: "Accéder aux validations",
  },
  {
    icon:      LuShieldCheck,
    accent:    "#a78bfa",
    tag:       "Audit Trail",
    title:     "Traçabilité totale",
    desc:      "Journal d'audit inviolable enregistrant chaque interaction — création, révision, diffusion, archivage. Identité de l'auteur et horodatage systématique garantissent une traçabilité forensique complète.",
    href:      "/admin/logs",
    linkLabel: "Consulter les journaux",
  },
  {
    icon:      LuArchive,
    accent:    "#fbbf24",
    tag:       "Conservation",
    title:     "Archivage normalisé",
    desc:      "Conservation sécurisée selon les durées légales et normatives. Versionnage intégral avec accès permanent à l'historique complet des révisions, métadonnées et preuves d'approbation.",
    href:      "/archive",
    linkLabel: "Parcourir les archives",
    public:    true,
  },
  {
    icon:      LuSearch,
    accent:    "#2dd4bf",
    tag:       "Référentiel",
    title:     "Recherche avancée",
    desc:      "Moteur multicritères offrant un accès instantané au référentiel qualité. Filtrage par type, statut, processus ou habilitation — résultats en temps réel, consultation selon les droits attribués.",
    href:      "/list",
    linkLabel: "Explorer les documents",
  },
  {
    icon:      LuUsers,
    accent:    "#fb923c",
    tag:       "RBAC",
    title:     "Contrôle d'accès granulaire",
    desc:      "Gouvernance fondée sur trois profils distincts : Admin, Ingénieur Qualité et Reviewer. Permissions spécifiques par rôle, alignées sur les politiques de sécurité de l'information et la norme ISO 27001.",
    href:      "/admin/users",
    linkLabel: "Gérer les utilisateurs",
  },
];

/* AnimatedBackground is now in App.jsx (global) — removed from here */
function _AnimatedBackgroundUnused() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Colour palette ──────────────────────────────────────
    const COLORS = [
      "rgba(74,184,63,",   // green
      "rgba(96,165,250,",  // blue
      "rgba(165,180,252,", // indigo
      "rgba(45,212,191,",  // teal
      "rgba(251,191,36,",  // amber (rare)
    ];
    const randomColor = (alpha = 1) =>
      COLORS[Math.floor(Math.random() * COLORS.length)] + alpha + ")";

    // ── PARTICLES ───────────────────────────────────────────
    const NUM_PARTICLES = 120;
    const particles = Array.from({ length: NUM_PARTICLES }, () => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      vx:   (Math.random() - 0.5) * 0.6,
      vy:   (Math.random() - 0.5) * 0.6,
      r:    Math.random() * 2.2 + 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.04 + 0.01,
    }));

    // ── METEORS ─────────────────────────────────────────────
    const NUM_METEORS = 5;
    const meteors = Array.from({ length: NUM_METEORS }, () => createMeteor(W, H));
    function createMeteor(W, H) {
      const angle = Math.PI / 5 + Math.random() * (Math.PI / 6);
      const speed = 8 + Math.random() * 8;
      return {
        x:     Math.random() * W * 1.5 - W * 0.25,
        y:     -20 - Math.random() * 200,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed,
        len:   80 + Math.random() * 120,
        alpha: 0,
        life:  0,
        maxLife: 60 + Math.random() * 40,
        color: COLORS[Math.floor(Math.random() * 3)],
        width: 1.5 + Math.random() * 1,
        delay: Math.random() * 300,
      };
    }

    // ── WAVE LINES ──────────────────────────────────────────
    const NUM_WAVES = 4;
    const waves = Array.from({ length: NUM_WAVES }, (_, i) => ({
      amplitude: 30 + i * 18,
      frequency: 0.003 + i * 0.001,
      speed:     0.008 + i * 0.004,
      phase:     (i * Math.PI) / 2,
      y:         H * 0.55 + i * 60,
      color:     COLORS[i % COLORS.length],
      alpha:     0.04 + i * 0.01,
      width:     1 + i * 0.3,
    }));

    // ── RIPPLES ─────────────────────────────────────────────
    const ripples = [];
    function addRipple(x, y) {
      ripples.push({ x, y, r: 0, maxR: 120 + Math.random() * 80, alpha: 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)], speed: 2 + Math.random() * 2 });
    }
    const rippleInterval = setInterval(() => {
      if (ripples.length < 6)
        addRipple(Math.random() * W, Math.random() * H);
    }, 2200);

    // ── ENERGY BEAMS ────────────────────────────────────────
    const beams = Array.from({ length: 3 }, (_, i) => ({
      x1: Math.random() * W, y1: Math.random() * H,
      x2: Math.random() * W, y2: Math.random() * H,
      vx1:(Math.random()-0.5)*0.4, vy1:(Math.random()-0.5)*0.4,
      vx2:(Math.random()-0.5)*0.4, vy2:(Math.random()-0.5)*0.4,
      color: COLORS[i % COLORS.length],
      alpha: 0.06 + Math.random() * 0.06,
      width: 1,
    }));

    let frame = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // ── Base gradient ────────────────────────────────────
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0,   "#0a1420");
      bg.addColorStop(0.35,"#0f1e30");
      bg.addColorStop(0.7, "#1a2f4a");
      bg.addColorStop(1,   "#1e3a55");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── Waves ───────────────────────────────────────────
      waves.forEach(w => {
        w.phase += w.speed;
        ctx.beginPath();
        ctx.moveTo(0, w.y);
        for (let x = 0; x <= W; x += 4) {
          ctx.lineTo(x, w.y + Math.sin(x * w.frequency + w.phase) * w.amplitude);
        }
        ctx.strokeStyle = w.color + w.alpha + ")";
        ctx.lineWidth   = w.width;
        ctx.stroke();
      });

      // ── Energy beams ────────────────────────────────────
      beams.forEach(b => {
        b.x1 += b.vx1; b.y1 += b.vy1;
        b.x2 += b.vx2; b.y2 += b.vy2;
        if (b.x1 < 0 || b.x1 > W) b.vx1 *= -1;
        if (b.y1 < 0 || b.y1 > H) b.vy1 *= -1;
        if (b.x2 < 0 || b.x2 > W) b.vx2 *= -1;
        if (b.y2 < 0 || b.y2 > H) b.vy2 *= -1;
        const grad = ctx.createLinearGradient(b.x1, b.y1, b.x2, b.y2);
        grad.addColorStop(0,   b.color + "0)");
        grad.addColorStop(0.5, b.color + b.alpha + ")");
        grad.addColorStop(1,   b.color + "0)");
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = b.width;
        ctx.stroke();
      });

      // ── Ripples ─────────────────────────────────────────
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r     += rp.speed;
        rp.alpha -= 0.008;
        if (rp.alpha <= 0 || rp.r >= rp.maxR) { ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = rp.color + rp.alpha + ")";
        ctx.lineWidth   = 1;
        ctx.stroke();
        // Inner glow ring
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = rp.color + (rp.alpha * 0.4) + ")";
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }

      // ── Particles + constellation lines ─────────────────
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particles.forEach((p, idx) => {
        // Mouse attraction
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          p.vx += (dx / dist) * 0.06;
          p.vy += (dy / dist) * 0.06;
        }
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        // Pulse alpha
        p.pulse += p.pulseSpeed;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + a + ")";
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        grd.addColorStop(0, p.color + (a * 0.4) + ")");
        grd.addColorStop(1, p.color + "0)");
        ctx.fillStyle = grd;
        ctx.fill();

        // Constellation lines
        for (let j = idx + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx2 = p.x - q.x, dy2 = p.y - q.y;
          const d2  = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            const lineAlpha = (1 - d2 / 110) * 0.18;
            ctx.strokeStyle = p.color + lineAlpha + ")";
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }

        // Mouse-particle lines
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mx, my);
          const la = (1 - dist / 150) * 0.35;
          ctx.strokeStyle = p.color + la + ")";
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      });

      // ── Meteors ─────────────────────────────────────────
      meteors.forEach((m, idx) => {
        if (m.delay > 0) { m.delay--; return; }
        m.life++;
        m.x += m.vx;
        m.y += m.vy;
        if (m.life < 10) m.alpha = m.life / 10;
        else if (m.life > m.maxLife - 10) m.alpha = (m.maxLife - m.life) / 10;
        else m.alpha = 1;

        const tx = m.x - m.vx * (m.len / (Math.sqrt(m.vx*m.vx+m.vy*m.vy)));
        const ty = m.y - m.vy * (m.len / (Math.sqrt(m.vx*m.vx+m.vy*m.vy)));
        const mg = ctx.createLinearGradient(tx, ty, m.x, m.y);
        mg.addColorStop(0, m.color + "0)");
        mg.addColorStop(0.7, m.color + (m.alpha * 0.6) + ")");
        mg.addColorStop(1,   m.color + (m.alpha * 0.9) + ")");
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = mg;
        ctx.lineWidth   = m.width;
        ctx.lineCap     = "round";
        ctx.stroke();

        // Head glow
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.width * 2, 0, Math.PI * 2);
        const hg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.width * 4);
        hg.addColorStop(0, m.color + (m.alpha * 0.9) + ")");
        hg.addColorStop(1, m.color + "0)");
        ctx.fillStyle = hg;
        ctx.fill();

        if (m.life >= m.maxLife || m.x > W + 100 || m.y > H + 100) {
          meteors[idx] = { ...createMeteor(W, H), delay: 60 + Math.random() * 180 };
        }
      });

      // ── Mouse cursor glow ────────────────────────────────
      if (mx > 0 && mx < W) {
        const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 80);
        mg.addColorStop(0, "rgba(74,184,63,0.12)");
        mg.addColorStop(0.5,"rgba(96,165,250,0.06)");
        mg.addColorStop(1, "rgba(74,184,63,0)");
        ctx.beginPath();
        ctx.arc(mx, my, 80, 0, Math.PI * 2);
        ctx.fillStyle = mg;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(rippleInterval);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const { currentUser, login } = useUser();

  const role      = currentUser?.role || null;
  const isVisitor = role === "Visiteur" || role === "Lecteur";
  const isAdmin   = role === "Admin";
  const canCreate = currentUser && !isVisitor;
  const canValidate = role === "Admin" || role === "Ing. Qualité" || role === "Reviewer";
  const canArchive  = role === "Admin" || role === "Ing. Qualité";

  const { t1: heroT1, t2: heroT2, typingLine1, typingLine2 } = useHeroTypewriter();

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

  const ISO_STEPS = ["Brouillon","En rédaction","Appel en relecture","En relecture","En correction","En validation","Validé","Diffusé","Obsolète","Archivé"];

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "transparent" }}
    >
      {/* ══ ANIMATED BACKGROUND — rendered globally in App.jsx ══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, display:"none" }}>
        <style>{`
          @keyframes orbFloat1 {
            0%,100%{ transform:translate(0,0) scale(1); }
            25%    { transform:translate(80px,-60px) scale(1.10); }
            50%    { transform:translate(30px,70px) scale(0.93); }
            75%    { transform:translate(-50px,-20px) scale(1.05); }
          }
          @keyframes orbFloat2 {
            0%,100%{ transform:translate(0,0) scale(1); }
            30%    { transform:translate(-80px,40px) scale(1.14); }
            60%    { transform:translate(60px,-70px) scale(0.90); }
            80%    { transform:translate(-20px,30px) scale(1.07); }
          }
          @keyframes orbFloat3 {
            0%,100%{ transform:translate(-50%,0) scale(1); }
            33%    { transform:translate(-50%,60px) scale(1.08); }
            66%    { transform:translate(-50%,-40px) scale(0.94); }
          }
          @keyframes orbFloat4 {
            0%,100%{ transform:translate(0,0) scale(1); }
            40%    { transform:translate(50px,80px) scale(1.12); }
            70%    { transform:translate(-60px,20px) scale(0.88); }
          }
          @keyframes particleDrift {
            0%  { transform:translateY(0) translateX(0); opacity:0; }
            8%  { opacity:1; }
            92% { opacity:0.7; }
            100%{ transform:translateY(-140px) translateX(40px); opacity:0; }
          }
          @keyframes particleDriftR {
            0%  { transform:translateY(0) translateX(0); opacity:0; }
            8%  { opacity:1; }
            92% { opacity:0.7; }
            100%{ transform:translateY(-110px) translateX(-35px); opacity:0; }
          }
          @keyframes gridPulse {
            0%,100%{ opacity:0.022; }
            50%    { opacity:0.042; }
          }
          @keyframes scanLine {
            0%  { transform:translateY(-4px); opacity:0; }
            3%  { opacity:1; }
            97% { opacity:0.5; }
            100%{ transform:translateY(100vh); opacity:0; }
          }
          @keyframes scanLineH {
            0%  { transform:translateX(-4px); opacity:0; }
            3%  { opacity:0.6; }
            97% { opacity:0.2; }
            100%{ transform:translateX(100vw); opacity:0; }
          }
          @keyframes ringPulse {
            0%  { transform:translate(-50%,-50%) scale(0.6); opacity:0.5; }
            100%{ transform:translate(-50%,-50%) scale(2.4); opacity:0; }
          }
          @keyframes hexRotate {
            0%  { transform:rotate(0deg); }
            100%{ transform:rotate(360deg); }
          }
          @keyframes hexRotateR {
            0%  { transform:rotate(0deg); }
            100%{ transform:rotate(-360deg); }
          }
          @keyframes starTwinkle {
            0%,100%{ opacity:0.15; transform:scale(1); }
            50%    { opacity:0.9;  transform:scale(1.6); }
          }
          @keyframes aurораShift {
            0%,100%{ background-position:0% 50%; }
            50%    { background-position:100% 50%; }
          }
          @keyframes noiseFloat {
            0%,100%{ transform:translateY(0) skewX(0deg); }
            25%    { transform:translateY(-8px) skewX(0.5deg); }
            75%    { transform:translateY(6px) skewX(-0.3deg); }
          }
          @keyframes cornerGlow {
            0%,100%{ opacity:0.4; }
            50%    { opacity:0.9; }
          }
        `}</style>

        {/* ── Aurora gradient layer ── */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(135deg, rgba(74,184,63,0.04) 0%, transparent 40%, rgba(96,165,250,0.04) 70%, rgba(165,180,252,0.03) 100%)",
          backgroundSize:"400% 400%",
          animation:"aurораShift 20s ease infinite",
        }} />

        {/* ── 4 big floating orbs ── */}
        <div style={{ position:"absolute", width:800, height:800, top:-250, right:-200,
          background:"radial-gradient(circle, rgba(74,184,63,0.13) 0%, transparent 60%)",
          filter:"blur(60px)", borderRadius:"50%", animation:"orbFloat1 20s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:700, height:700, bottom:-180, left:-160,
          background:"radial-gradient(circle, rgba(96,165,250,0.11) 0%, transparent 60%)",
          filter:"blur(65px)", borderRadius:"50%", animation:"orbFloat2 25s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:500, height:500, top:"38%", left:"50%",
          background:"radial-gradient(circle, rgba(165,180,252,0.08) 0%, transparent 65%)",
          filter:"blur(70px)", borderRadius:"50%", animation:"orbFloat3 30s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:450, height:450, top:"15%", left:"25%",
          background:"radial-gradient(circle, rgba(45,212,191,0.07) 0%, transparent 65%)",
          filter:"blur(55px)", borderRadius:"50%", animation:"orbFloat4 22s ease-in-out infinite 3s" }} />

        {/* ── Animated grid ── */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`linear-gradient(rgba(74,184,63,0.07) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(74,184,63,0.07) 1px, transparent 1px)`,
          backgroundSize:"70px 70px",
          animation:"gridPulse 7s ease-in-out infinite",
        }} />

        {/* ── Smaller dot grid ── */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`radial-gradient(circle, rgba(96,165,250,0.15) 1px, transparent 1px)`,
          backgroundSize:"35px 35px",
          animation:"gridPulse 9s ease-in-out infinite 2s",
        }} />

        {/* ── Vertical scan line ── */}
        <div style={{
          position:"absolute", left:0, right:0, height:2,
          background:"linear-gradient(90deg, transparent 0%, rgba(74,184,63,0.5) 30%, rgba(96,165,250,0.4) 60%, transparent 100%)",
          animation:"scanLine 12s linear infinite", filter:"blur(1px)",
        }} />

        {/* ── Second scan line (offset) ── */}
        <div style={{
          position:"absolute", left:0, right:0, height:1,
          background:"linear-gradient(90deg, transparent, rgba(165,180,252,0.4), transparent)",
          animation:"scanLine 12s linear infinite 6s", filter:"blur(0.5px)",
        }} />

        {/* ── Horizontal scan line ── */}
        <div style={{
          position:"absolute", top:0, bottom:0, width:1,
          background:"linear-gradient(180deg, transparent, rgba(74,184,63,0.25), transparent)",
          animation:"scanLineH 18s linear infinite 4s",
        }} />

        {/* ── Pulsing rings (center) ── */}
        {[0,1,2].map(i => (
          <div key={i} style={{
            position:"absolute", top:"35%", left:"50%",
            width:300, height:300, borderRadius:"50%",
            border:"1px solid rgba(74,184,63,0.15)",
            animation:`ringPulse 5s ease-out infinite ${i * 1.65}s`,
          }} />
        ))}

        {/* ── Pulsing rings (top-right) ── */}
        {[0,1].map(i => (
          <div key={i} style={{
            position:"absolute", top:"8%", right:"12%",
            width:200, height:200, borderRadius:"50%",
            border:"1px solid rgba(96,165,250,0.12)",
            animation:`ringPulse 6s ease-out infinite ${i * 3}s`,
          }} />
        ))}

        {/* ── Rotating hexagon-like rings ── */}
        <div style={{
          position:"absolute", top:"20%", right:"8%",
          width:180, height:180,
          border:"1px solid rgba(74,184,63,0.08)",
          borderRadius:"30%",
          animation:"hexRotate 30s linear infinite",
        }} />
        <div style={{
          position:"absolute", top:"22%", right:"9%",
          width:140, height:140,
          border:"1px solid rgba(96,165,250,0.06)",
          borderRadius:"30%",
          animation:"hexRotateR 20s linear infinite",
        }} />
        <div style={{
          position:"absolute", bottom:"20%", left:"6%",
          width:160, height:160,
          border:"1px solid rgba(165,180,252,0.07)",
          borderRadius:"30%",
          animation:"hexRotate 25s linear infinite 5s",
        }} />

        {/* ── Corner glow accents ── */}
        <div style={{
          position:"absolute", top:0, left:0, width:300, height:300,
          background:"radial-gradient(circle at 0% 0%, rgba(74,184,63,0.08) 0%, transparent 70%)",
          animation:"cornerGlow 5s ease-in-out infinite",
        }} />
        <div style={{
          position:"absolute", bottom:0, right:0, width:350, height:350,
          background:"radial-gradient(circle at 100% 100%, rgba(96,165,250,0.07) 0%, transparent 70%)",
          animation:"cornerGlow 7s ease-in-out infinite 2s",
        }} />
        <div style={{
          position:"absolute", top:0, right:0, width:250, height:250,
          background:"radial-gradient(circle at 100% 0%, rgba(165,180,252,0.06) 0%, transparent 70%)",
          animation:"cornerGlow 6s ease-in-out infinite 4s",
        }} />

        {/* ── Twinkling stars ── */}
        {[
          {l:"5%",  t:"12%", s:2}, {l:"15%", t:"28%", s:1.5}, {l:"25%", t:"8%",  s:2.5},
          {l:"38%", t:"18%", s:1}, {l:"52%", t:"6%",  s:2},   {l:"62%", t:"22%", s:1.5},
          {l:"73%", t:"10%", s:2}, {l:"83%", t:"30%", s:1},   {l:"92%", t:"15%", s:2.5},
          {l:"8%",  t:"45%", s:1}, {l:"18%", t:"60%", s:1.5}, {l:"48%", t:"50%", s:1},
          {l:"78%", t:"42%", s:2}, {l:"88%", t:"55%", s:1.5}, {l:"55%", t:"35%", s:1},
          {l:"33%", t:"72%", s:2}, {l:"68%", t:"68%", s:1},   {l:"95%", t:"38%", s:1.5},
        ].map((s, i) => (
          <div key={i} style={{
            position:"absolute", left:s.l, top:s.t,
            width:s.s, height:s.s, borderRadius:"50%",
            background:"white",
            animation:`starTwinkle ${2.5 + (i % 4) * 0.7}s ease-in-out infinite ${(i * 0.4) % 3}s`,
          }} />
        ))}

        {/* ── Floating particles (bottom→up, left drift) ── */}
        {[
          {l:"8%",  t:"82%", sz:3, d:"0s",   dur:"7s",   c:"rgba(74,184,63,0.8)"},
          {l:"16%", t:"75%", sz:2, d:"1.8s", dur:"9s",   c:"rgba(96,165,250,0.7)"},
          {l:"24%", t:"88%", sz:4, d:"3.2s", dur:"8s",   c:"rgba(74,184,63,0.6)"},
          {l:"32%", t:"70%", sz:2, d:"0.5s", dur:"11s",  c:"rgba(165,180,252,0.7)"},
          {l:"41%", t:"85%", sz:3, d:"2.5s", dur:"7.5s", c:"rgba(45,212,191,0.7)"},
          {l:"50%", t:"78%", sz:2, d:"4.2s", dur:"9.5s", c:"rgba(74,184,63,0.8)"},
          {l:"58%", t:"90%", sz:3, d:"1.2s", dur:"8.5s", c:"rgba(96,165,250,0.6)"},
          {l:"66%", t:"72%", sz:2, d:"3.8s", dur:"10s",  c:"rgba(165,180,252,0.8)"},
          {l:"74%", t:"86%", sz:4, d:"5.5s", dur:"6.5s", c:"rgba(74,184,63,0.7)"},
          {l:"82%", t:"68%", sz:2, d:"2.2s", dur:"12s",  c:"rgba(45,212,191,0.6)"},
          {l:"90%", t:"80%", sz:3, d:"0.9s", dur:"8s",   c:"rgba(96,165,250,0.8)"},
          {l:"96%", t:"74%", sz:2, d:"4.8s", dur:"10s",  c:"rgba(165,180,252,0.6)"},
          {l:"12%", t:"55%", sz:2, d:"6s",   dur:"9s",   c:"rgba(74,184,63,0.5)"},
          {l:"44%", t:"60%", sz:3, d:"7s",   dur:"7s",   c:"rgba(96,165,250,0.5)"},
          {l:"70%", t:"52%", sz:2, d:"1.5s", dur:"11s",  c:"rgba(165,180,252,0.5)"},
          {l:"85%", t:"45%", sz:2, d:"8s",   dur:"8.5s", c:"rgba(45,212,191,0.5)"},
        ].map((p, i) => (
          <div key={i} style={{
            position:"absolute", left:p.l, top:p.t,
            width:p.sz, height:p.sz, borderRadius:"50%",
            background:p.c,
            animation:`${i % 2 === 0 ? "particleDrift" : "particleDriftR"} ${p.dur} ${p.d} ease-in-out infinite`,
            boxShadow:`0 0 ${p.sz * 3}px ${p.c}`,
          }} />
        ))}

        {/* ── Noise/static overlay ── */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat:"repeat",
          backgroundSize:"200px 200px",
          opacity:0.025,
          animation:"noiseFloat 8s ease-in-out infinite",
          mixBlendMode:"overlay",
        }} />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar onOpenLogin={() => setShowLoginModal(true)} />

        {/* ── HERO ──────────────────────────────────── */}
        <section className="px-8 pt-20 pb-28 text-center">
          <div className="max-w-[860px] mx-auto">

            {/* Badge */}
            <div
              className="hero-fade-0 inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-7 border"
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
              className="hero-fade-1 m-0 mb-5 font-black text-white"
              style={{
                fontSize: "clamp(28px, 4.5vw, 52px)",
                lineHeight: 1.15,
                letterSpacing: -1.5,
                textShadow: "0 4px 30px rgba(0,0,0,0.4)",
                minHeight: "calc(clamp(28px, 4.5vw, 52px) * 1.15 * 2)",
              }}
            >
              <span className="block" style={{ minHeight: "1.15em" }}>
                {heroT1}
                <span className={
                  typingLine1
                    ? "inline-block font-thin ml-px text-white/80 animate-tw-blink"
                    : "hidden"
                }>|</span>
              </span>
              <span className="hero-glow block" style={{ color: "#4ab83f", minHeight: "1.15em" }}>
                {heroT2}
                <span className={
                  typingLine2
                    ? "inline-block font-thin ml-px text-actia-green animate-tw-blink"
                    : "hidden"
                }>|</span>
              </span>
            </h1>

            <p
              className="hero-fade-2 text-lg max-w-[520px] mx-auto leading-relaxed m-0 mb-10"
              style={{ color: "rgba(168,191,212,0.8)" }}
            >
              Plateforme centralisée de gestion documentaire pour ACTIA Engineering Services.
              Conformité ISO, traçabilité complète et workflow de validation.
            </p>

            <div className="hero-fade-3 flex justify-center gap-3 flex-wrap">
              {canCreate && (
                <button
                  onClick={() => navigate("/create")}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #4ab83f, #3da333)",
                    boxShadow: "0 8px 30px rgba(74,184,63,0.4)",
                    fontSize: 15, border: "none", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <LuFilePlus size={16} /> Nouveau document
                </button>
              )}
              {!currentUser && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #4ab83f, #3da333)",
                    boxShadow: "0 8px 30px rgba(74,184,63,0.4)",
                    fontSize: 15, border: "none", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <LuFilePlus size={16} /> Nouveau document
                </button>
              )}
              <NavLink
                to={currentUser ? "/list" : "/archive"}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 no-underline"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(10px)",
                  fontSize: 15, fontFamily: "inherit",
                }}
              >
                Voir les documents <LuArrowRight size={14} />
              </NavLink>
            </div>
          </div>
        </section>

        {currentUser ? (
        <>
        {/* ── STATS ROW ─────────────────────────────── */}
        <div className="max-w-[1280px] mx-auto px-8 -mt-14 mb-8">
          <div className="flex gap-3.5 flex-wrap">
            <StatCard icon={LuFileText}    label="Total documents" value={loadingStats ? "…" : totalDocs} sub="dans le système"     accent="#60a5fa" onClick={() => navigate("/list")}        />
            <StatCard icon={LuClock}       label="En validation"   value={loadingStats ? "…" : pending}   sub="en attente"          accent={pending > 0 ? "#a5b4fc" : "#4ade80"} onClick={() => navigate(canValidate ? "/validations" : "/list?statusName=En%20validation")} />
            <StatCard icon={LuCircleCheck} label="Validés"         value={loadingStats ? "…" : validated}  sub="documents approuvés" accent="#4ade80" onClick={() => navigate("/list?statusName=Validé")} />
            <StatCard icon={LuCircleAlert} label="En retard"       value={loadingStats ? "…" : overdue}    sub="révision dépassée"   accent={overdue > 0 ? "#fb923c" : "#4ade80"} onClick={() => navigate("/list?overdue=true")} />
            <StatCard icon={LuArchive}     label="Archivés"        value={loadingStats ? "…" : archived}   sub="archivage définitif" accent="#94a3b8" onClick={() => navigate("/archive")}    />
          </div>
        </div>

        {/* ── MAIN CONTENT ──────────────────────────── */}
        <div className="max-w-[1280px] mx-auto px-8 pb-20 space-y-6">

          {/* ISO Pipeline */}
          <div
            className="rounded-2xl p-6 section-fade-in"
            style={{
              background: "linear-gradient(135deg, rgba(15,30,48,0.95) 0%, rgba(20,38,58,0.98) 100%)",
              border: "1px solid rgba(74,184,63,0.18)",
              boxShadow: "0 4px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
              animationDelay: "0.05s",
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,184,63,0.15)", border: "1px solid rgba(74,184,63,0.3)" }}>
                <LuRefreshCw size={14} className="animate-spin" style={{ color: "#4ab83f", animationDuration: "3s" }} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest m-0" style={{ color: "rgba(168,191,212,0.8)" }}>Pipeline ISO — Répartition par statut</p>
              <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: "rgba(74,184,63,0.1)", border: "1px solid rgba(74,184,63,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ab83f" }} />
                <span className="text-xs font-bold" style={{ color: "#4ab83f" }}>{totalDocs} docs</span>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {ISO_STEPS.map((label, i) => {
                const s   = STATUS_CFG[label] || {};
                const SI  = s.Icon || LuFileText;
                const cnt = byStatus[label] || 0;
                const pct = totalDocs > 0 ? Math.round((cnt / totalDocs) * 100) : 0;
                return (
                  <div
                    key={label}
                    onClick={() => {
                      if (label === "Archivé" || label === "Obsolète") navigate("/archive");
                      else if (label === "En validation") navigate(canValidate ? "/validations" : `/list?statusName=En%20validation`);
                      else navigate(`/list?statusName=${encodeURIComponent(label)}`);
                    }}
                    className="feat-slide-up flex-1 min-w-[90px] cursor-pointer group"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <div
                      className="relative rounded-xl overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.06]"
                      style={{
                        background: cnt > 0
                          ? `linear-gradient(160deg, ${s.text}18 0%, ${s.text}08 60%, rgba(0,0,0,0.15) 100%)`
                          : "rgba(255,255,255,0.03)",
                        border: `1px solid ${cnt > 0 ? s.border : "rgba(255,255,255,0.06)"}`,
                        boxShadow: cnt > 0 ? `0 0 20px ${s.text}18` : "none",
                      }}
                    >
                      {/* Animated top accent line */}
                      <div className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: cnt > 0 ? `linear-gradient(90deg, transparent, ${s.text}, transparent)` : "transparent" }} />
                      <div className="px-3 pt-4 pb-3 text-center">
                        {/* Icon circle */}
                        <div className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                          style={{ background: `${s.text}20`, border: `1.5px solid ${s.text}40` }}>
                          <SI size={16} style={{ color: s.text, opacity: cnt > 0 ? 1 : 0.4 }} />
                        </div>
                        <p className="m-0 font-black text-3xl leading-none"
                          style={{ color: cnt > 0 ? "#ffffff" : "rgba(255,255,255,0.2)", letterSpacing: -1 }}>{cnt}</p>
                        {/* Progress bar — always visible */}
                        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: pct > 0 ? `${pct}%` : "0%", background: `linear-gradient(90deg, ${s.text}80, ${s.text})`, minWidth: pct > 0 ? "6px" : "0" }} />
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] mt-1.5 text-center font-semibold m-0" style={{ color: "rgba(168,191,212,0.6)" }}>{label}</p>
                    <p className="text-[11px] m-0 mt-0.5 text-center font-black" style={{ color: cnt > 0 ? s.text : "rgba(255,255,255,0.18)" }}>{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions + Recent docs */}
          <div className="grid grid-cols-2 gap-6">

            {/* Quick actions */}
            <div
              className="rounded-2xl p-6 section-fade-in"
              style={{
                background: "linear-gradient(135deg, rgba(15,30,48,0.95) 0%, rgba(20,38,58,0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 4px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                animationDelay: "0.15s",
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,184,63,0.15)", border: "1px solid rgba(74,184,63,0.3)" }}>
                  <LuZap size={13} className="animate-bounce" style={{ color: "#4ab83f", animationDuration: "2s" }} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest m-0" style={{ color: "rgba(168,191,212,0.8)" }}>Actions rapides</p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  canCreate    && { to:"/create",      icon:LuFilePlus,       label:"Nouveau document",    desc:"Créer et soumettre un document",    accent:"#4ab83f" },
                               { to:"/list",        icon:LuList,           label:"Liste des documents",  desc:"Rechercher, filtrer, gérer",        accent:"#60a5fa" },
                  canValidate  && { to:"/validations", icon:LuClipboardCheck, label:"Workflow validation",  desc:"Approuver ou rejeter des documents", accent:"#a5b4fc" },
                               { to:"/archive",     icon:LuArchive,        label:"Archivage ISO",        desc:"Consulter les documents archivés",   accent:"#94a3b8" },
                  isAdmin      && { to:"/admin/users", icon:LuUsers,          label:"Gestion utilisateurs", desc:"Gérer les comptes et les rôles",     accent:"#f59e0b" },
                ].filter(Boolean).map(({ to, icon, label, desc, accent }, idx) => {
                  const ActionIcon = icon;
                  return (
                  <NavLink key={to} to={to} className="no-underline group row-slide-in" style={{ animationDelay: `${idx * 0.08 + 0.2}s` }}>
                    {({ isActive }) => (
                      <div
                        className="relative flex items-center gap-3 py-3 pr-4 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group-hover:-translate-y-0.5 group-hover:shadow-xl"
                        style={{
                          paddingLeft: "16px",
                          background: isActive
                            ? `linear-gradient(105deg, ${accent}18 0%, ${accent}08 100%)`
                            : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isActive ? `${accent}35` : "rgba(255,255,255,0.07)"}`,
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = `linear-gradient(105deg, ${accent}12 0%, ${accent}05 100%)`;
                            e.currentTarget.style.borderColor = `${accent}30`;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                          }
                        }}
                      >
                        {/* Left accent bar — always visible */}
                        <div
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all duration-300 group-hover:top-0 group-hover:bottom-0"
                          style={{ background: `linear-gradient(to bottom, ${accent}, ${accent}55)`, opacity: isActive ? 1 : 0.45 }}
                        />
                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                          style={{ background: `${accent}22`, border: `1.5px solid ${accent}45` }}
                        >
                          <ActionIcon size={15} style={{ color: accent }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="m-0 font-semibold text-sm text-white" style={{ letterSpacing: -0.2 }}>{label}</p>
                          <p className="m-0 mt-0.5 text-xs truncate" style={{ color: "rgba(168,191,212,0.5)" }}>{desc}</p>
                        </div>
                        <LuArrowRight
                          size={13}
                          className="flex-shrink-0 transition-all duration-300 group-hover:translate-x-1"
                          style={{ color: isActive ? accent : "rgba(168,191,212,0.2)" }}
                        />
                      </div>
                    )}
                  </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Recent docs */}
            <div
              className="rounded-2xl p-6 section-fade-in"
              style={{
                background: "linear-gradient(135deg, rgba(15,30,48,0.95) 0%, rgba(20,38,58,0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 4px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                animationDelay: "0.25s",
              }}
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,184,63,0.15)", border: "1px solid rgba(74,184,63,0.3)" }}>
                    <LuClock size={13} style={{ color: "#4ab83f" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest m-0" style={{ color: "rgba(168,191,212,0.8)" }}>Documents récents</p>
                </div>
                <NavLink to="/list" className="no-underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-80"
                  style={{ background: "rgba(74,184,63,0.1)", border: "1px solid rgba(74,184,63,0.2)", color: "#4ab83f", fontSize: 11, fontWeight: 700 }}>
                  Voir tout <LuArrowRight size={11} />
                </NavLink>
              </div>

              {loadingStats ? (
                <div className="space-y-2">
                  {[1,2,3].map(n => (
                    <div key={n} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                  ))}
                </div>
              ) : recentDocs.length === 0 ? (
                <div className="text-center py-8">
                  <LuInbox size={36} className="mx-auto mb-3" style={{ color: "rgba(168,191,212,0.25)" }} />
                  <p className="text-sm m-0 mb-3" style={{ color: "rgba(168,191,212,0.5)" }}>Aucun document créé</p>
                  <NavLink to="/create" className="inline-flex items-center gap-1.5 text-sm no-underline font-semibold" style={{ color: "#4ab83f" }}>
                    <LuFilePlus size={13} /> Créer le premier
                  </NavLink>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentDocs.map((doc, i) => {
                    const sc = STATUS_CFG[doc.status_name] || {};
                    return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc.id)}
                      className="group row-slide-in relative flex items-center justify-between rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg"
                      style={{
                        padding: "10px 14px 10px 18px",
                        background: `linear-gradient(105deg, ${sc.text ? sc.text + "0d" : "rgba(74,184,63,0.05)"} 0%, rgba(255,255,255,0.02) 100%)`,
                        border: `1px solid ${sc.text ? sc.text + "25" : "rgba(255,255,255,0.07)"}`,
                        animationDelay: `${i * 0.07 + 0.3}s`,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = `linear-gradient(105deg, ${sc.text ? sc.text + "18" : "rgba(74,184,63,0.1)"} 0%, rgba(255,255,255,0.04) 100%)`;
                        e.currentTarget.style.borderColor = sc.text ? `${sc.text}45` : "rgba(74,184,63,0.3)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = `linear-gradient(105deg, ${sc.text ? sc.text + "0d" : "rgba(74,184,63,0.05)"} 0%, rgba(255,255,255,0.02) 100%)`;
                        e.currentTarget.style.borderColor = sc.text ? `${sc.text}25` : "rgba(255,255,255,0.07)";
                      }}
                    >
                      {/* Left colored bar — always visible */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300"
                        style={{ background: `linear-gradient(to bottom, ${sc.text || "#4ab83f"}, ${sc.text || "#4ab83f"}55)` }} />
                      <div className="overflow-hidden flex-1 min-w-0">
                        <p className="m-0 font-bold text-[12px] font-mono leading-tight" style={{ color: sc.text || "#4ab83f" }}>{doc.doc_code}</p>
                        <p className="m-0 mt-0.5 text-sm truncate" style={{ color: "rgba(168,191,212,0.7)", maxWidth: "200px" }}>{doc.title}</p>
                      </div>
                      <StatusPill name={doc.status_name} />
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                  Conformité ISO 9001 &amp; ISO 27001
                </h2>
                <div className="w-1 h-8 rounded-full" style={{ background: "linear-gradient(to bottom, rgba(74,184,63,0.2), #4ab83f)" }} />
              </div>
              <p className="text-sm m-0 mt-2" style={{ color: "rgba(168,191,212,0.6)" }}>Système de gestion documentaire certifié — Traçabilité, sécurité et archivage normalisés</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {FEATURES.map((f, i) => (
                <FeatureCard key={f.title} {...f} index={i} locked={!currentUser && !f.public} />
              ))}
            </div>
          </div>

          {/* User profile — all roles */}
          {currentUser && <UserProfileCard user={currentUser} />}
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
                  Conformité ISO 9001 &amp; ISO 27001
                </h2>
                <div className="w-1 h-8 rounded-full" style={{ background:"linear-gradient(to bottom,rgba(74,184,63,0.2),#4ab83f)" }} />
              </div>
              <p className="text-sm m-0 mt-2" style={{ color:"rgba(168,191,212,0.6)" }}>
                Système de gestion documentaire certifié — Traçabilité, sécurité et archivage normalisés
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {FEATURES.map((f, i) => (
                <FeatureCard key={f.title} {...f} index={i} locked={!currentUser && !f.public} />
              ))}
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

              {/* Documents — visitors see archived only */}
              <NavLink to="/archive" className="no-underline rounded-2xl border flex items-center gap-4 px-6 py-5 transition-all duration-200"
                style={{ background:"rgba(255,255,255,0.025)", borderColor:"rgba(96,165,250,0.15)" }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(96,165,250,0.06)"; e.currentTarget.style.borderColor="rgba(96,165,250,0.3)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor="rgba(96,165,250,0.15)"; e.currentTarget.style.transform="translateY(0)"; }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(96,165,250,0.12)", border:"1px solid rgba(96,165,250,0.2)" }}>
                  <LuFileText size={22} style={{ color:"#60a5fa" }} />
                </div>
                <div className="flex-1">
                  <p className="m-0 text-base font-bold text-white" style={{ letterSpacing:-0.2 }}>Liste des Documents</p>
                  <p className="m-0 text-[12px] mt-0.5" style={{ color:"rgba(168,191,212,0.6)" }}>Consulter les documents archivés — lecture seule</p>
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

              {/* Role cards — animated grid */}
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
                      className="group rounded-2xl p-5 relative overflow-hidden cursor-default
                        transition-all duration-300
                        hover:-translate-y-1 hover:scale-[1.02]"
                      style={{
                        background: `${role.color}0a`,
                        border: `1.5px solid ${role.color}25`,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.3), 0 0 30px ${role.color}22`; e.currentTarget.style.borderColor = `${role.color}55`; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"; e.currentTarget.style.borderColor = `${role.color}25`; }}
                    >
                      {/* top accent bar */}
                      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-50 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background:`linear-gradient(90deg,${role.color},${role.color}55,transparent)` }} />
                      {/* bg glow blob */}
                      <div className="absolute top-0 right-0 pointer-events-none rounded-full transition-all duration-700
                        translate-x-[30%] -translate-y-[30%] group-hover:translate-x-[15%] group-hover:-translate-y-[15%] group-hover:scale-125"
                        style={{ width:180, height:180, background:`radial-gradient(circle,${role.color}18 0%,transparent 65%)`, filter:"blur(30px)" }} />

                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative z-10
                        transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6"
                        style={{ background:`${role.color}15`, border:`1.5px solid ${role.color}30` }}>
                        <RI size={22} style={{ color:role.color }} />
                      </div>
                      <p className="m-0 mb-1 font-black text-[18px] relative z-10" style={{ color:role.color, letterSpacing:-0.4 }}>{role.name}</p>
                      <p className="m-0 text-[12px] leading-relaxed relative z-10 transition-colors duration-300"
                        style={{ color:"rgba(168,191,212,0.55)" }}>{desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Visiteur card — full animated UserProfileCard style */}
              <div
                className="group mt-4 rounded-2xl border relative overflow-hidden cursor-default
                  transition-all duration-500
                  hover:border-[rgba(167,139,250,0.5)]"
                style={{ background:"rgba(167,139,250,0.04)", borderColor:"rgba(167,139,250,0.25)", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.4), 0 0 60px rgba(167,139,250,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)"; }}
              >
                {/* Accent bar */}
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-50 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background:"linear-gradient(90deg,#a78bfa,#a78bfa55,transparent)" }} />

                {/* Animated bg glow blob */}
                <div className="absolute top-0 right-0 pointer-events-none rounded-full
                  transition-all duration-700
                  translate-x-[30%] -translate-y-[30%]
                  group-hover:translate-x-[20%] group-hover:-translate-y-[20%] group-hover:scale-[1.3]"
                  style={{ width:300, height:300, background:"radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 65%)", filter:"blur(40px)" }} />

                <div className="relative z-10 p-6">
                  <div className="flex items-start gap-5 flex-wrap">
                    {/* Avatar */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0
                        transition-all duration-400
                        group-hover:scale-[1.08] group-hover:-rotate-[4deg]
                        group-hover:shadow-[0_0_28px_rgba(167,139,250,0.5)]"
                      style={{ background:"rgba(167,139,250,0.12)", border:"2px solid rgba(167,139,250,0.3)" }}
                    >
                      <LuEye size={28} style={{ color:"#a78bfa" }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background:"#a78bfa" }} />
                        <p className="text-[10px] font-bold uppercase tracking-[1.8px] m-0" style={{ color:"rgba(168,191,212,0.5)" }}>Profil visiteur</p>
                      </div>
                      <p className="m-0 text-white font-black text-2xl leading-tight" style={{ letterSpacing:-0.5 }}>Visiteur</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                          style={{ background:"rgba(167,139,250,0.1)", color:"#a78bfa", borderColor:"rgba(167,139,250,0.28)" }}>
                          <LuEye size={10} /> Visiteur
                        </span>
                        <span className="text-[12px]" style={{ color:"rgba(168,191,212,0.4)" }}>·</span>
                        <span className="text-[12px]" style={{ color:"rgba(168,191,212,0.55)" }}>Aucun compte requis</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border self-start"
                      style={{ background:"rgba(167,139,250,0.08)", borderColor:"rgba(167,139,250,0.2)" }}>
                      <span className="w-1.5 h-1.5 rounded-full dot-pulse" style={{ background:"#a78bfa", boxShadow:"0 0 6px #a78bfa" }} />
                      <span className="text-[11px] font-semibold" style={{ color:"#a78bfa" }}>Accès public</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px my-5 rounded-full transition-all duration-500 opacity-40 group-hover:opacity-100"
                    style={{ background:"linear-gradient(90deg,rgba(167,139,250,0.4),rgba(255,255,255,0.06),transparent)" }} />

                  {/* Permissions */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[1.5px] mb-3 m-0" style={{ color:"rgba(168,191,212,0.4)" }}>
                      Permissions accordées
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ROLE_CFG["Visiteur"].perms.map(({ label, Icon: PI }) => (
                        <div key={label}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border
                            transition-all duration-200 cursor-default
                            hover:-translate-y-0.5 hover:scale-[1.03]
                            hover:border-[rgba(167,139,250,0.3)] hover:bg-[rgba(167,139,250,0.08)]"
                          style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.08)" }}>
                          <PI size={12} style={{ color:"#a78bfa" }} />
                          <span className="text-[11.5px] font-semibold" style={{ color:"rgba(168,191,212,0.65)" }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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