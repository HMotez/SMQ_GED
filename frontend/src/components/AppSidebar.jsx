// ============================================================
// components/AppSidebar.jsx — Pure Tailwind CSS · No Emojis
// All icons verified against installed react-icons/lu version
// ============================================================
import { useEffect, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logoImg from "../assets/Logo.png";
import { useUser } from "../context/UserContext";
import { API } from "../config";
import {
  LuHouse,
  LuFilePlus,
  LuFileText,
  LuClipboardCheck,
  LuArchive,
  LuLayoutDashboard,
  LuClock,
  LuPencil,
  LuSend,
  LuShieldCheck,
  LuPackageOpen,
  LuFolderOpen,
  LuChartBar,
  LuUsers,
  LuBell,
  LuCpu,
  LuCrown,
  LuWrench,
  LuLogOut,
  LuGitBranch,
  LuScrollText,
} from "react-icons/lu";

// Navigation items per role — each role sees only relevant items
const NAV_ITEMS_BY_ROLE = {
  "Admin": [
    { icon: LuHouse,           label: "Accueil",          href: "/",     end: true  },
    { icon: LuLayoutDashboard, label: "Tableau de bord",  href: "/dashboard",     end: false },
    { icon: LuFilePlus,        label: "Nouveau document", href: "/create",        end: false },
    { icon: LuFileText,        label: "Liste documents",  href: "/list",          end: false },
    { icon: LuClipboardCheck,  label: "Validations",      href: "/validations",   end: false },
    { icon: LuArchive,         label: "Archivage",        href: "/archive",       end: false },
    { icon: LuGitBranch,       label: "Workflow",         href: "/workflow",      end: false },
    { icon: LuBell,            label: "Notifications",    href: "/notifications", end: false },
    { icon: LuCpu,             label: "Assistant IA",     href: "/ai",            end: false },
  ],
  "Ing. Qualité": [
    { icon: LuHouse,           label: "Accueil",          href: "/",     end: true  },
    { icon: LuLayoutDashboard, label: "Tableau de bord",  href: "/dashboard",     end: false },
    { icon: LuFilePlus,        label: "Nouveau document", href: "/create",        end: false },
    { icon: LuFileText,        label: "Liste documents",  href: "/list",          end: false },
    { icon: LuClipboardCheck,  label: "Validations",      href: "/validations",   end: false },
    { icon: LuArchive,         label: "Archivage",        href: "/archive",       end: false },
    { icon: LuGitBranch,       label: "Workflow",         href: "/workflow",      end: false },
    { icon: LuBell,            label: "Notifications",    href: "/notifications", end: false },
    { icon: LuCpu,             label: "Assistant IA",     href: "/ai",            end: false },
  ],
  "Reviewer": [
    { icon: LuHouse,           label: "Accueil",          href: "/",     end: true  },
    { icon: LuLayoutDashboard, label: "Tableau de bord",  href: "/dashboard",     end: false },
    { icon: LuFileText,        label: "Liste documents",  href: "/list",          end: false },
    { icon: LuClipboardCheck,  label: "Validations",      href: "/validations",   end: false },
    { icon: LuArchive,         label: "Archivage",        href: "/archive",       end: false },
    { icon: LuGitBranch,       label: "Workflow",         href: "/workflow",      end: false },
    { icon: LuBell,            label: "Notifications",    href: "/notifications", end: false },
    { icon: LuCpu,             label: "Assistant IA",     href: "/ai",            end: false },
  ],
};

// Visitor / Lecteur nav — read-only access (no create/edit)
const NAV_ITEMS_VISITOR = [
  { icon: LuHouse,          label: "Accueil",          href: "/",   end: true  },
  { icon: LuFileText,       label: "Liste documents",  href: "/list",        end: false },
  { icon: LuClipboardCheck, label: "Validations",      href: "/validations", end: false },
  { icon: LuArchive,        label: "Archivage",        href: "/archive",     end: false },
  { icon: LuGitBranch,      label: "Workflow",         href: "/workflow",    end: false },
  { icon: LuCpu,            label: "Assistant IA",     href: "/ai",          end: false },
];

// Fallback for unknown/old roles — show full Admin nav
const NAV_ITEMS_DEFAULT = NAV_ITEMS_BY_ROLE["Admin"];

// Kept for backward-compat (pages that import NAV_ITEMS directly)
export const NAV_ITEMS = NAV_ITEMS_BY_ROLE["Admin"];

/* ── Quick-access roles (role switcher) ──────────────────── */
const QUICK_ROLES = [
  { name:"Admin",        email:"admin@test.com",    password:"Admin123!", color:"#f87171", Icon:LuCrown         },
  { name:"Ing. Qualité", email:"ing@test.com",      password:"Ing123!",   color:"#2dd4bf", Icon:LuWrench        },
  { name:"Reviewer",     email:"reviewer@test.com", password:"Rev123!",   color:"#4ade80", Icon:LuClipboardCheck },
];

const ROLE_STYLE = {
  "Admin":        { color:"#f87171", bg:"rgba(248,113,113,0.12)", border:"rgba(248,113,113,0.25)" },
  "Ing. Qualité": { color:"#2dd4bf", bg:"rgba(45,212,191,0.1)",   border:"rgba(45,212,191,0.22)"  },
  "Reviewer":     { color:"#4ade80", bg:"rgba(74,222,128,0.12)",  border:"rgba(74,222,128,0.25)"  },
};

/* ── SidebarUserPanel ────────────────────────────────────── */
function SidebarUserPanel() {
  const { currentUser, userRole, logout } = useUser();
  const navigate = useNavigate();

  const s = ROLE_STYLE[userRole] || { color:"#8b949e", bg:"rgba(139,148,158,0.08)", border:"rgba(139,148,158,0.2)" };
  const RoleIcon = QUICK_ROLES.find(r => r.name === userRole)?.Icon || LuShieldCheck;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  if (!currentUser) {
    return (
      <div className="mx-2 mb-2">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
          style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:"rgba(168,191,212,0.06)", border:"1.5px solid rgba(168,191,212,0.12)" }}>
            <LuShieldCheck size={15} style={{ color:"rgba(168,191,212,0.35)" }} />
          </div>
          <div className="flex-1 text-left">
            <p className="m-0 text-[12.5px] font-semibold leading-tight" style={{ color:"rgba(220,235,248,0.5)" }}>Visiteur</p>
            <p className="m-0 text-[10px] leading-tight" style={{ color:"rgba(168,191,212,0.3)" }}>Mode lecture seule</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-1 flex flex-col gap-1">
      {/* User info — static, not clickable */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
        style={{ background: s.bg, borderColor: s.border }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
          <RoleIcon size={15} style={{ color: s.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="m-0 text-[12.5px] font-semibold text-white truncate leading-tight">{currentUser.name}</p>
          <p className="m-0 text-[10.5px] font-bold leading-tight" style={{ color: s.color }}>{userRole || "Rôle inconnu"}</p>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11.5px] font-semibold border-none transition-all"
        style={{ background:"transparent", color:"rgba(168,191,212,0.45)", cursor:"pointer", border:"1.5px solid transparent" }}
        onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.08)"; e.currentTarget.style.color="#f87171"; e.currentTarget.style.borderColor="rgba(248,113,113,0.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(168,191,212,0.45)"; e.currentTarget.style.borderColor="transparent"; }}>
        <LuLogOut size={13} /> Déconnexion
      </button>
    </div>
  );
}

const STATUS_ICONS = {
  "Brouillon":     LuPencil,
  "En rédaction":  LuFileText,
  "En validation": LuClipboardCheck,
  "Validé":        LuShieldCheck,
  "Diffusé":       LuSend,
  "Obsolète":      LuPackageOpen,
  "Archivé":       LuFolderOpen,
};

/* ── Logo mark ────────────────────────────────────────────── */
export function LogoMark() {
  return (
    <NavLink to="/" className="no-underline">
      <img
        src={logoImg}
        alt="ACTIA ES"
        className="actia-logo h-12 w-auto"
      />
    </NavLink>
  );
}

/* ── Brand ────────────────────────────────────────────────── */
export function SidebarBrand() {
  return (
    <div 
      className="mx-2 mt-2.5 mb-3 rounded-xl px-4 py-4"
      style={{
        background: "rgba(255,255,255,0.045)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <NavLink to="/" className="no-underline flex items-center justify-center">
        <img
          src={logoImg}
          alt="ACTIA ES"
          className="actia-logo h-12 w-auto"
        />
      </NavLink>
    </div>
  );
}

/* ── Section label ────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-3 pb-2">
      <span
        className="inline-block w-[2.5px] h-3 rounded-full flex-shrink-0"
        style={{ background: "linear-gradient(to bottom,#4ab83f,#3da333)" }}
      />
      <p className="text-[9px] font-bold tracking-[1.6px] uppercase text-[#a8bfd4]/30 m-0">
        {children}
      </p>
    </div>
  );
}

/* ── Notification unread count hook ──────────────────────── */
function useNotifCount() {
  const { token } = useUser();
  const [count, setCount] = useState(0);

  const fetch_ = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, [fetch_]);

  return count;
}

/* ── Nav links ────────────────────────────────────────────── */
export function SidebarNav({ badges = {}, user }) {
  const notifCount = useNotifCount();
  // treat any unknown/old role (e.g. "Admin GED") as Admin for nav display
  const isAdmin = user?.role === "Admin" || (!user && false) || (user && !NAV_ITEMS_BY_ROLE[user?.role]);
  const roleItems = !user ? NAV_ITEMS_VISITOR : (NAV_ITEMS_BY_ROLE[user?.role] || NAV_ITEMS_DEFAULT);
  return (
    <nav className="px-2 pt-1">
      <SectionLabel>Navigation</SectionLabel>
      <div className="flex flex-col gap-0.5">
        {roleItems.map(({ icon: Icon, label, href, end }) => (
          <NavLink
            key={href}
            to={href}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline text-[13px] transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? "text-actia-green font-semibold"
                  : "text-[#a8bfd4]/70 font-normal hover:bg-white/[0.045] hover:text-white/90"
              }`
            }
            style={({ isActive }) => isActive ? {
              background: "rgba(74,184,63,0.12)",
              border: "1.5px solid rgba(74,184,63,0.22)",
              boxShadow: "0 2px 12px rgba(74,184,63,0.08)",
            } : {
              background: "transparent",
              border: "1.5px solid transparent",
            }}
          >
            {({ isActive }) => (
              <>
                {/* Left accent bar */}
                {isActive && (
                  <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
                    style={{ background: "linear-gradient(to bottom, #4ab83f, #3a9a31)" }} />
                )}
                <Icon size={14} className={`flex-shrink-0 ${isActive ? "text-actia-green" : "text-[#a8bfd4]/45"}`} />
                <span className="flex-1 leading-none">{label}</span>
                {(() => {
                  const cnt = href === "/notifications" ? notifCount : (badges[href] ?? 0);
                  return cnt > 0 ? (
                    <span className="bg-red-500 text-white rounded-full px-1.5 py-px text-[10px] font-bold min-w-[18px] text-center leading-none shadow-lg shadow-red-500/30">
                      {cnt > 99 ? "99+" : cnt}
                    </span>
                  ) : null;
                })()}
              </>
            )}
          </NavLink>
        ))}

        {/* Ing. Qualité: Journaux documentaires */}
        {user?.role === "Ing. Qualité" && (
          <>
            <SectionLabel>Qualité</SectionLabel>
            <NavLink
              to="/admin/logs"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline text-[13px] transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? "text-teal-400 font-semibold"
                    : "text-[#a8bfd4]/70 font-normal hover:bg-white/[0.045] hover:text-white/90"
                }`
              }
              style={({ isActive }) => isActive ? {
                background: "rgba(45,212,191,0.1)",
                border: "1.5px solid rgba(45,212,191,0.22)",
              } : {
                background: "transparent",
                border: "1.5px solid transparent",
              }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
                      style={{ background: "linear-gradient(to bottom, #2dd4bf, #14b8a6)" }} />
                  )}
                  <LuScrollText size={14} className={`flex-shrink-0 ${isActive ? "text-teal-400" : "text-[#a8bfd4]/45"}`} />
                  <span className="flex-1 leading-none">Journaux</span>
                </>
              )}
            </NavLink>
          </>
        )}

        {/* Admin-only: Administration */}
        {isAdmin && (
          <>
            <SectionLabel>Administration</SectionLabel>
            <NavLink
              to="/admin/logs"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline text-[13px] transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? "text-red-400 font-semibold"
                    : "text-[#a8bfd4]/70 font-normal hover:bg-white/[0.045] hover:text-white/90"
                }`
              }
              style={({ isActive }) => isActive ? {
                background: "rgba(248,113,113,0.1)",
                border: "1.5px solid rgba(248,113,113,0.22)",
              } : {
                background: "transparent",
                border: "1.5px solid transparent",
              }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
                      style={{ background: "linear-gradient(to bottom, #f87171, #ef4444)" }} />
                  )}
                  <LuScrollText size={14} className={`flex-shrink-0 ${isActive ? "text-red-400" : "text-[#a8bfd4]/45"}`} />
                  <span className="flex-1 leading-none">Journaux</span>
                </>
              )}
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline text-[13px] transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? "text-red-400 font-semibold"
                    : "text-[#a8bfd4]/70 font-normal hover:bg-white/[0.045] hover:text-white/90"
                }`
              }
              style={({ isActive }) => isActive ? {
                background: "rgba(248,113,113,0.1)",
                border: "1.5px solid rgba(248,113,113,0.22)",
              } : {
                background: "transparent",
                border: "1.5px solid transparent",
              }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
                      style={{ background: "linear-gradient(to bottom, #f87171, #ef4444)" }} />
                  )}
                  <LuUsers size={14} className={`flex-shrink-0 ${isActive ? "text-red-400" : "text-[#a8bfd4]/45"}`} />
                  <span className="flex-1 leading-none">Utilisateurs</span>
                  {badges["/admin/users"] > 0 && (
                    <span className="bg-red-500 text-white rounded-full px-1.5 py-px text-[10px] font-bold min-w-[18px] text-center leading-none shadow-lg shadow-red-500/30">
                      {badges["/admin/users"]}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

/* ── Status row ───────────────────────────────────────────── */
function StatusItem({ label, count, highlight }) {
  const Icon = STATUS_ICONS[label] || LuFileText;
  return (
    <div 
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-200 ${highlight ? "" : ""}`}
      style={{
        background: highlight ? "rgba(248,113,113,0.08)" : "transparent",
        border: highlight ? "1.5px solid rgba(248,113,113,0.2)" : "1.5px solid transparent",
      }}
    >
      <Icon size={13} className={`flex-shrink-0 ${highlight ? "text-red-400" : "text-[#a8bfd4]/38"}`} />
      <span className={`flex-1 text-[12.5px] ${highlight ? "text-white/80 font-medium" : "text-[#a8bfd4]/60"}`}>
        {label}
      </span>
      <span className={`text-[12px] font-semibold tabular-nums ${highlight ? "text-red-400" : "text-white/45"}`}>
        {count}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Full AppSidebar
════════════════════════════════════════════════════════════ */
export default function AppSidebar({
  badges = {},
  middleContent,
  bottomContent,
  lateCount,
  statusCounts = [],
  totalDocuments,
  user,
}) {
  return (
    <aside className="w-[230px] bg-[#0b1929] border-r border-white/[0.06] flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto">

      <SidebarBrand />
      <SidebarNav badges={badges} user={user} />

      {/* Late alert */}
      {lateCount > 0 && (
        <div className="px-2 pt-2">
          <div 
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1.5px solid rgba(248,113,113,0.2)",
            }}
          >
            <LuClock size={14} className="text-red-400 flex-shrink-0" />
            <span className="flex-1 text-[12.5px] font-semibold text-red-400">En retard</span>
            <span className="bg-red-500 text-white rounded-full px-2 py-px text-[10px] font-bold leading-none shadow-lg shadow-red-500/30">
              {lateCount}
            </span>
          </div>
        </div>
      )}

      {/* Status breakdown */}
      {statusCounts.length > 0 && (
        <div className="px-2 pt-1">
          <SectionLabel>Par statut</SectionLabel>
          <div className="flex flex-col gap-px">
            {statusCounts.map(({ label, count, highlight }) => (
              <StatusItem key={label} label={label} count={count} highlight={highlight} />
            ))}
          </div>
        </div>
      )}

      {middleContent}

      {/* Total */}
      {totalDocuments !== undefined && (
        <div className="px-2 pt-2">
          <div 
            className="p-4 rounded-xl border"
            style={{
              background: "rgba(74,184,63,0.08)",
              border: "1.5px solid rgba(74,184,63,0.25)",
              boxShadow: "0 4px 16px rgba(74,184,63,0.1), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <LuChartBar size={11} className="text-actia-green/60" />
              <span className="text-[9.5px] font-bold tracking-[1.5px] uppercase text-actia-green/55">Total</span>
            </div>
            <div className="text-[28px] font-black text-actia-green leading-none tabular-nums">
              {totalDocuments}
            </div>
            <div className="text-[11px] text-[#a8bfd4]/45 mt-1">documents</div>
          </div>
        </div>
      )}

      {/* Bottom — role switcher always visible */}
      <div className="mt-auto border-t border-white/[0.06] pt-2 flex flex-col gap-2">
        <SidebarUserPanel />
        {bottomContent && <div className="px-2 pb-2">{bottomContent}</div>}
      </div>
    </aside>
  );
}