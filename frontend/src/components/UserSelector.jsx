// ============================================================
// components/UserSelector.jsx
// RÔLE : Panneau d'information de l'utilisateur connecté affiché
//        en bas du sidebar dans la page Home.
//        Affiche : avatar avec icône de rôle, nom, email, badge rôle
//        et bouton de déconnexion.
//        Composant statique — affiche uniquement les infos,
//        ne permet pas le changement de rôle (RBAC strict).
// ============================================================
import { useNavigate } from "react-router-dom";
import { LuLogOut, LuShield, LuCrown, LuWrench, LuClipboardCheck } from "react-icons/lu";
import { useUser } from "../context/UserContext";

const ROLE_CFG = {
  "Admin":        { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.28)", Icon: LuCrown        },
  "Ing. Qualité": { color: "#2dd4bf", bg: "rgba(45,212,191,0.1)",   border: "rgba(45,212,191,0.25)",  Icon: LuWrench       },
  "Reviewer":     { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.28)",  Icon: LuClipboardCheck },
};

export default function UserSelector() {
  const { currentUser, userRole, logout } = useUser();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const cfg = ROLE_CFG[userRole] || { color: "#8b949e", bg: "rgba(139,148,158,0.08)", border: "rgba(139,148,158,0.15)", Icon: LuShield };
  const RoleIcon = cfg.Icon;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.032)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}>

      {/* ── Current user info (static) ── */}
      <div className="p-3.5">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ab83f", boxShadow: "0 0 6px #4ab83f" }} />
          <p className="m-0 text-[9.5px] font-bold uppercase tracking-[1.4px]"
            style={{ color: "rgba(168,191,212,0.38)" }}>Session active</p>
        </div>

        {/* Avatar + name + email */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, color: cfg.color }}>
            <RoleIcon size={16} />
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
          style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
          <LuShield size={10} />
          {userRole || "Sans rôle"}
        </span>
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
    </div>
  );
}
