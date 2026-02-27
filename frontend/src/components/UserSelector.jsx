// ============================================================
// components/UserSelector.jsx — Premium dark profile card
// ============================================================
import { useNavigate } from "react-router-dom";
import { LuLogOut, LuShield, LuUser } from "react-icons/lu";
import { useUser } from "../context/UserContext";

/* Role colors aligned with the rest of the application */
const ROLE_STYLE = {
  "Admin GED":           { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.28)" },
  "Responsable Qualité": { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.28)"  },
  "Ing. Qualité":        { color: "#2dd4bf", bg: "rgba(45,212,191,0.1)",   border: "rgba(45,212,191,0.25)"  },
  "Rédacteur":           { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.28)"  },
  "Validateur":          { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.28)"  },
  "Lecteur":             { color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.22)" },
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
    <div className="rounded-2xl p-3.5 border"
      style={{
        background: "rgba(255,255,255,0.032)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}>

      {/* ── Header status ── */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-1.5 h-1.5 rounded-full animate-pulse-glow" style={{ background: "#4ab83f" }} />
        <p className="m-0 text-[9.5px] font-bold uppercase tracking-[1.4px]"
          style={{ color: "rgba(168,191,212,0.38)" }}>Session active</p>
      </div>

      {/* ── Avatar + info ── */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: s.bg,
            border: `1.5px solid ${s.border}`,
            color: s.color,
            boxShadow: `0 4px 14px ${s.bg}`,
          }}>
          <LuUser size={16} />
        </div>
        <div className="overflow-hidden flex-1 min-w-0">
          <p className="m-0 text-[13px] font-semibold text-white truncate leading-tight">{currentUser.name}</p>
          <p className="m-0 mt-0.5 text-[11px] truncate leading-tight" style={{ color: "rgba(168,191,212,0.42)" }}>
            {currentUser.email}
          </p>
        </div>
      </div>

      {/* ── Role badge ── */}
      <div className="mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[5px] text-[11px] font-bold border"
          style={{ background: s.bg, color: s.color, borderColor: s.border }}>
          <LuShield size={10} />
          {userRole || "Sans rôle"}
        </span>
      </div>

      {/* ── Logout button ── */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold border transition-all duration-200"
        style={{ background: "transparent", borderColor: "rgba(255,255,255,0.08)", color: "rgba(168,191,212,0.5)", cursor: "pointer" }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(248,113,113,0.08)";
          e.currentTarget.style.borderColor = "rgba(248,113,113,0.28)";
          e.currentTarget.style.color = "#f87171";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(168,191,212,0.5)";
        }}>
        <LuLogOut size={12} /> Déconnexion
      </button>
    </div>
  );
}
