// ============================================================
// context/ThemeContext.jsx
// RÔLE : Contexte React gérant le thème visuel de l'application.
//        Persiste le choix dans localStorage (clé "ged_theme").
//        Synchronise la classe CSS "dark" sur <html> pour que
//        Tailwind CSS applique automatiquement les variantes dark:.
//        Par défaut : mode sombre (dark).
//        Expose :
//          theme       : "dark" | "light"
//          isDark      : boolean (raccourci)
//          toggleTheme : bascule entre les deux modes
//        Usage : const { isDark, toggleTheme } = useTheme();
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
