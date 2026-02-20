// ============================================================
// components/UserSelector.jsx — Sprint 3 : JWT Auth
// Affiche l'utilisateur connecté + bouton Déconnexion
// ============================================================
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const ROLE_COLOR = {
  "Admin GED":           { color: "#f78166", bg: "#3d1a1a", border: "#6e2020" },
  "Responsable Qualité": { color: "#d29922", bg: "#1c1a00", border: "#6e5c1e" },
  "Rédacteur":           { color: "#79c0ff", bg: "#1a2238", border: "#388bfd" },
  "Validateur":          { color: "#3fb950", bg: "#04260f", border: "#196c2e" },
  "Lecteur":             { color: "#8b949e", bg: "#1c2128", border: "#30363d" },
};

export default function UserSelector() {
  const { currentUser, userRole, logout } = useUser();
  const navigate = useNavigate();

  const s = ROLE_COLOR[userRole] || { color: "#484f58", bg: "#161b22", border: "#30363d" };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (!currentUser) return null;

  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
      padding: "12px 12px",
    }}>
      <p style={{
        color: "#484f58", fontSize: 10, textTransform: "uppercase",
        letterSpacing: 0.8, margin: "0 0 8px",
      }}>
        Connecté
      </p>

      <div style={{ marginBottom: 10 }}>
        <p style={{
          margin: 0, color: "#e6edf3", fontWeight: 600, fontSize: 12,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          👤 {currentUser.name}
        </p>
        <p style={{ margin: "2px 0 0", color: "#484f58", fontSize: 10,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {currentUser.email}
        </p>
        <span style={{
          display: "inline-block", marginTop: 5,
          background: s.bg, color: s.color, border: `1px solid ${s.border}`,
          borderRadius: 99, padding: "1px 8px", fontSize: 10, fontWeight: 700,
        }}>
          {userRole || "Sans rôle"}
        </span>
      </div>

      <button
        onClick={handleLogout}
        style={{
          width: "100%", padding: "6px 8px", borderRadius: 6,
          background: "transparent", border: "1px solid #30363d",
          color: "#8b949e", fontSize: 11, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#3d1a1a";
          e.currentTarget.style.borderColor = "#6e2020";
          e.currentTarget.style.color = "#ff7b72";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "#30363d";
          e.currentTarget.style.color = "#8b949e";
        }}
      >
        🚪 Déconnexion
      </button>
    </div>
  );
}
