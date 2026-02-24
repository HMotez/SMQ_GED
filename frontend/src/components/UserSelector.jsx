// ============================================================
// components/UserSelector.jsx — Premium dark profile card
// ============================================================
import { useNavigate } from "react-router-dom";
import { LuLogOut, LuShield, LuUser } from "react-icons/lu";
import { useUser } from "../context/UserContext";

const ROLE_STYLE = {
  "Admin GED":           { color: "#f78166", bg: "rgba(247,129,102,0.1)",  border: "rgba(247,129,102,0.25)" },
  "Responsable Qualité": { color: "#d29922", bg: "rgba(210,153,34,0.1)",   border: "rgba(210,153,34,0.25)"  },
  "Rédacteur":           { color: "#79c0ff", bg: "rgba(121,192,255,0.1)",  border: "rgba(121,192,255,0.25)" },
  "Validateur":          { color: "#4ab83f", bg: "rgba(74,184,63,0.1)",    border: "rgba(74,184,63,0.25)"   },
  "Lecteur":             { color: "#8b949e", bg: "rgba(139,148,158,0.1)",  border: "rgba(139,148,158,0.2)"  },
};

export default function UserSelector() {
  const { currentUser, userRole, logout } = useUser();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const s = ROLE_STYLE[userRole] || { color: "#8b949e", bg: "rgba(139,148,158,0.08)", border: "rgba(139,148,158,0.15)" };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="rounded-2xl p-4 border"
      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>

      {/* ── Header status ── */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ab83f", boxShadow: "0 0 6px rgba(74,184,63,0.7)" }} />
        <p className="m-0 text-[10px] font-bold uppercase tracking-[1.2px]"
          style={{ color: "rgba(168,191,212,0.4)" }}>Connecté</p>
      </div>

      {/* ── Avatar + info ── */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: s.bg, border: `1.5px solid ${s.border}`, color: s.color }}>
          <LuUser size={18} />
        </div>
        <div className="overflow-hidden flex-1">
          <p className="m-0 text-sm font-semibold text-white truncate leading-tight">{currentUser.name}</p>
          <p className="m-0 mt-0.5 text-[11px] truncate" style={{ color: "rgba(168,191,212,0.45)" }}>
            {currentUser.email}
          </p>
        </div>
      </div>

      {/* ── Role badge ── */}
      <div className="mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border"
          style={{ background: s.bg, color: s.color, borderColor: s.border }}>
          <LuShield size={10} />
          {userRole || "Sans rôle"}
        </span>
      </div>

      {/* ── Logout button ── */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all"
        style={{ background: "transparent", borderColor: "rgba(255,255,255,0.08)", color: "rgba(168,191,212,0.55)", cursor: "pointer" }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(239,68,68,0.08)";
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
          e.currentTarget.style.color = "#f87171";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(168,191,212,0.55)";
        }}>
        <LuLogOut size={12} /> Déconnexion
      </button>
    </div>
  );
}
