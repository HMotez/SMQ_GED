// ============================================================
// components/ThemeToggle.jsx — Bouton bascule clair / sombre
// Lit isDark et toggleTheme depuis ThemeContext (stocké dans
// localStorage sous la clé "ged_theme").
// Props : compact=true → affiche seulement l'icône (usage sidebar),
//         compact=false (défaut) → icône + libellé "Mode clair/sombre".
// ============================================================
import { LuSun, LuMoon } from "react-icons/lu";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ compact = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      className={[
        "flex items-center gap-2 rounded-xl border transition-all duration-200 cursor-pointer",
        compact ? "p-2" : "w-full px-3 py-2",
        isDark
          ? "bg-white/[0.04] border-white/[0.08] text-[rgba(168,191,212,0.55)] hover:bg-[rgba(251,191,36,0.1)] hover:border-[rgba(251,191,36,0.3)] hover:text-[#fbbf24]"
          : "bg-black/[0.05] border-black/[0.1] text-[rgba(51,65,85,0.65)] hover:bg-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.3)] hover:text-[#6366f1]",
      ].join(" ")}
    >
      {isDark
        ? <LuSun  size={14} className="shrink-0" />
        : <LuMoon size={14} className="shrink-0" />}
      {!compact && (
        <span className="text-xs font-semibold">
          {isDark ? "Mode clair" : "Mode sombre"}
        </span>
      )}
    </button>
  );
}
