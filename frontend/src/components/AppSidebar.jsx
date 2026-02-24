// ============================================================
// components/AppSidebar.jsx — Pure Tailwind CSS · No Emojis
// All icons verified against installed react-icons/lu version
// ============================================================
import { NavLink } from "react-router-dom";
import logoImg from "../assets/Logo.png";
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
  LuCircleUser,
  LuLogOut,
  LuUsers,
} from "react-icons/lu";

export const NAV_ITEMS = [
  { icon: LuHouse,           label: "Accueil",          href: "/",            end: true  },
  { icon: LuLayoutDashboard, label: "Tableau de bord",  href: "/dashboard",   end: false },
  { icon: LuFilePlus,        label: "Nouveau document", href: "/create",      end: false },
  { icon: LuFileText,        label: "Liste documents",  href: "/list",        end: false },
  { icon: LuClipboardCheck,  label: "Validations",      href: "/validations", end: false },
  { icon: LuArchive,         label: "Archivage",        href: "/archive",     end: false },
];

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
        className="h-8 w-auto transition-opacity duration-200 opacity-90 hover:opacity-100"
        style={{ filter: "drop-shadow(0 2px 8px rgba(74,184,63,0.3))" }}
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
          className="h-9 w-auto transition-opacity duration-200 opacity-90 hover:opacity-100"
          style={{ filter: "drop-shadow(0 2px 10px rgba(74,184,63,0.3))" }}
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

/* ── Nav links ────────────────────────────────────────────── */
export function SidebarNav({ badges = {}, user }) {
  const isAdmin = user?.role === "Admin GED";
  return (
    <nav className="px-2 pt-1">
      <SectionLabel>Navigation</SectionLabel>
      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ icon: Icon, label, href, end }) => (
          <NavLink
            key={href}
            to={href}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline text-[13px] transition-all duration-200 border border-transparent ${
                isActive
                  ? "bg-actia-green/15 text-actia-green font-semibold border-actia-green/30 shadow-lg shadow-actia-green/10"
                  : "text-[#a8bfd4]/70 font-normal hover:bg-white/[0.05] hover:text-white/90 hover:border-white/[0.08]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={14} className={`flex-shrink-0 ${isActive ? "text-actia-green" : "text-[#a8bfd4]/50"}`} />
                <span className="flex-1 leading-none">{label}</span>
                {badges[href] > 0 && (
                  <span className="bg-red-500 text-white rounded-full px-1.5 py-px text-[10px] font-bold min-w-[18px] text-center leading-none shadow-lg shadow-red-500/30">
                    {badges[href]}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Admin-only: Gestion utilisateurs */}
        {isAdmin && (
          <>
            <SectionLabel>Administration</SectionLabel>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline text-[13px] transition-all duration-200 border border-transparent ${
                  isActive
                    ? "bg-red-500/10 text-red-400 font-semibold border-red-500/25"
                    : "text-[#a8bfd4]/70 font-normal hover:bg-white/[0.05] hover:text-white/90 hover:border-white/[0.08]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <LuUsers size={14} className={`flex-shrink-0 ${isActive ? "text-red-400" : "text-[#a8bfd4]/50"}`} />
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
  onLogout,
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

      {/* Bottom */}
      <div className="mt-auto p-2 border-t border-white/[0.06] flex flex-col gap-2">
        {bottomContent}

        {user && (
          <div 
            className="p-3.5 rounded-xl border"
            style={{
              background: "rgba(74,184,63,0.06)",
              border: "1.5px solid rgba(74,184,63,0.15)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border"
                style={{ background: "rgba(74,184,63,0.12)", border: "1.5px solid rgba(74,184,63,0.3)" }}
              >
                <LuCircleUser size={15} className="text-actia-green" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-white/85 truncate">{user.name}</div>
                <div className="text-[10.5px] text-[#a8bfd4]/40 truncate">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span 
                className="text-[10px] font-bold tracking-[0.5px] px-2 py-0.5 rounded-[4px] border"
                style={{ color: "#4ab83f", background: "rgba(74,184,63,0.12)", border: "1.5px solid rgba(74,184,63,0.25)" }}
              >
                {user.role}
              </span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 text-[11px] text-[#a8bfd4]/40 hover:text-red-400 px-1.5 py-1 rounded-md hover:bg-red-500/[0.08] transition-all duration-150 bg-transparent border-none cursor-pointer font-[inherit]"
                  style={{ transition: "all 0.2s ease" }}
                >
                  <LuLogOut size={12} />
                  <span>Déco.</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}