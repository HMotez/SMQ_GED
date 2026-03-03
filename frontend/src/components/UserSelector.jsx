// ============================================================
// components/UserSelector.jsx — Role switcher (no login needed)
// Click a role to instantly switch — auto-login behind the scenes
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuLogOut, LuShield, LuUser,
  LuCrown, LuWrench, LuClipboardCheck, LuChevronDown,
} from "react-icons/lu";
import { useUser } from "../context/UserContext";

/* ── 3 quick-access roles ─────────────────────────────────── */
const QUICK_ROLES = [
  {
    name:     "Admin",
    email:    "admin@actia.com",
    password: "Admin123!",
    color:    "#f87171",
    bg:       "rgba(248,113,113,0.12)",
    border:   "rgba(248,113,113,0.28)",
    Icon:     LuCrown,
  },
  {
    name:     "Ing. Qualité",
    email:    "ing@actia.com",
    password: "Ing123!",
    color:    "#2dd4bf",
    bg:       "rgba(45,212,191,0.1)",
    border:   "rgba(45,212,191,0.25)",
    Icon:     LuWrench,
  },
  {
    name:     "Reviewer",
    email:    "reviewer@actia.com",
    password: "Rev123!",
    color:    "#4ade80",
    bg:       "rgba(74,222,128,0.12)",
    border:   "rgba(74,222,128,0.28)",
    Icon:     LuClipboardCheck,
  },
];

const ROLE_STYLE = Object.fromEntries(QUICK_ROLES.map(r => [r.name, { color: r.color, bg: r.bg, border: r.border }]));

export default function UserSelector() {
  const { currentUser, userRole, logout, autoLogin } = useUser();
  const navigate = useNavigate();
  const [switching, setSwitching]   = useState(null); // role name being switched to
  const [open,      setOpen]        = useState(false);

  const s = ROLE_STYLE[userRole] || { color: "#8b949e", bg: "rgba(139,148,158,0.08)", border: "rgba(139,148,158,0.15)" };

  const handleSwitch = async (role) => {
    if (switching || role.name === userRole) { setOpen(false); return; }
    setSwitching(role.name);
    try {
      await autoLogin(role.email, role.password);
      setOpen(false);
      navigate("/", { replace: true });
    } catch {
      /* ignore */
    } finally {
      setSwitching(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  if (!currentUser) return null;

  const currentRoleDef = QUICK_ROLES.find(r => r.name === userRole);
  const CurrentIcon = currentRoleDef?.Icon || LuUser;

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.032)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}>

      {/* ── Current user header ── */}
      <div className="p-3.5">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ab83f", boxShadow: "0 0 6px #4ab83f" }} />
          <p className="m-0 text-[9.5px] font-bold uppercase tracking-[1.4px]"
            style={{ color: "rgba(168,191,212,0.38)" }}>Session active</p>
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: s.bg, border: `1.5px solid ${s.border}`, color: s.color }}>
            <CurrentIcon size={16} />
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="m-0 text-[13px] font-semibold text-white truncate leading-tight">{currentUser.name}</p>
            <p className="m-0 mt-0.5 text-[11px] truncate leading-tight" style={{ color: "rgba(168,191,212,0.42)" }}>
              {currentUser.email}
            </p>
          </div>
        </div>

        {/* Role badge */}
        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[5px] text-[11px] font-bold border"
          style={{ background: s.bg, color: s.color, borderColor: s.border }}>
          <LuShield size={10} />
          {userRole || "Sans rôle"}
        </span>
      </div>

      {/* ── Role switcher ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Toggle button */}
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-[11px] font-semibold transition-all"
          style={{
            background: open ? "rgba(74,184,63,0.07)" : "transparent",
            color: open ? "#4ab83f" : "rgba(168,191,212,0.5)",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
        >
          <span>Changer de rôle</span>
          <LuChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        </button>

        {/* Role options */}
        {open && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingBottom: 6 }}>
            {QUICK_ROLES.map(role => {
              const RIcon = role.Icon;
              const isActive  = role.name === userRole;
              const isLoading = switching === role.name;
              return (
                <button
                  key={role.name}
                  onClick={() => handleSwitch(role)}
                  disabled={!!switching}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-all"
                  style={{
                    background: isActive ? role.bg : "transparent",
                    border: "none",
                    cursor: isActive ? "default" : switching ? "not-allowed" : "pointer",
                    opacity: switching && !isLoading ? 0.45 : 1,
                  }}
                  onMouseEnter={e => { if (!isActive && !switching) e.currentTarget.style.background = role.bg; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Icon / spinner */}
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: role.bg, border: `1px solid ${role.border}` }}>
                    {isLoading ? (
                      <span style={{
                        width: 12, height: 12, display: "inline-block", borderRadius: "50%",
                        border: `2px solid ${role.color}30`, borderTopColor: role.color,
                        animation: "spin 0.7s linear infinite",
                      }} />
                    ) : (
                      <RIcon size={12} style={{ color: role.color }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-[12px] font-semibold truncate" style={{ color: isActive ? role.color : "rgba(220,235,248,0.8)" }}>
                      {role.name}
                    </p>
                  </div>

                  {isActive && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded"
                      style={{ background: role.bg, color: role.color, border: `1px solid ${role.border}` }}>
                      Actif
                    </span>
                  )}
                  {isLoading && (
                    <span className="text-[9px]" style={{ color: role.color }}>…</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Logout ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold transition-all"
          style={{ background: "transparent", border: "none", color: "rgba(168,191,212,0.45)", cursor: "pointer" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(168,191,212,0.45)"; }}>
          <LuLogOut size={12} /> Déconnexion
        </button>
      </div>

      {/* spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
