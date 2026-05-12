// ============================================================
// context/ThemeContext.jsx — Gestion du thème clair/sombre
// Persiste le choix dans localStorage (clé "ged_theme").
// Ajoute/supprime la classe "dark" sur <html> pour Tailwind.
// Usage : const { isDark, toggleTheme } = useTheme();
// ============================================================
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Initialisation : lire la préférence sauvegardée, défaut = dark
  const [theme, setTheme] = useState(
    () => localStorage.getItem("ged_theme") || "dark"
  );

  // Synchronise la classe CSS et localStorage à chaque changement de thème
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("ged_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  return (
    // Expose theme, isDark (booléen pratique) et toggleTheme à toute l'app
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook personnalisé — évite d'importer useContext partout
export const useTheme = () => useContext(ThemeContext);
