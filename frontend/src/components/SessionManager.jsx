// ============================================================
// components/SessionManager.jsx — Gestion automatique de session
//
// Rôle : détecter l'inactivité utilisateur et déclencher
// une déconnexion automatique après 30 minutes sans interaction.
//
// Architecture des timers (deux timers chaînés) :
//   warningTimer  → déclenche à (INACTIVITY - 5 min)
//                   → affiche le modal de décompte
//   logoutTimer   → déclenche à INACTIVITY (30 min)
//                   → appelle logout() + redirect /login
//
// Tout événement utilisateur (souris, clavier, scroll, touch)
// réinitialise les deux timers via resetTimers().
// Exception : si le modal de décompte est visible, les
// événements NE réinitialisent PAS (l'utilisateur doit cliquer
// "Continuer" explicitement pour prolonger la session).
//
// Le composant ne rend rien (return null) tant que le modal
// n'est pas déclenché — il peut être monté en permanence dans App.jsx.
// ============================================================
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

// ─── Constantes de délai ─────────────────────────────────────
const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes d'inactivité
const WARNING_MS    =  5 * 60 * 1000; // avertissement 5 min avant expiration

export default function SessionManager() {
  const { isAuthenticated, logout } = useUser();
  const navigate = useNavigate();

  // ─── État du modal ────────────────────────────────────────
  const [showWarning, setShowWarning] = useState(false);
  const [countdown,   setCountdown]   = useState(300); // 300 secondes = 5 min

  // ─── Refs pour les timers (évite les closures obsolètes) ──
  // Refs au lieu de state pour ne pas déclencher de re-render à chaque tick
  const warningTimer      = useRef(null);
  const logoutTimer       = useRef(null);
  const countdownInterval = useRef(null);

  // ─── Nettoyage de tous les timers actifs ──────────────────
  const clearAllTimers = useCallback(() => {
    clearTimeout(warningTimer.current);
    clearTimeout(logoutTimer.current);
    clearInterval(countdownInterval.current);
  }, []);

  // ─── Déconnexion automatique ──────────────────────────────
  const handleAutoLogout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);
    await logout();
    navigate("/login", { replace: true });
  }, [logout, navigate, clearAllTimers]);

  // ─── Réinitialisation des timers (à chaque activité) ─────
  const resetTimers = useCallback(() => {
    if (!isAuthenticated) return;
    clearAllTimers();
    setShowWarning(false);
    setCountdown(300);

    // Timer 1 : afficher le modal d'avertissement 5 min avant expiration
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(300);
      // Décompte visuel seconde par seconde
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(countdownInterval.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_MS - WARNING_MS);

    // Timer 2 : déconnexion réelle après 30 min d'inactivité
    logoutTimer.current = setTimeout(handleAutoLogout, INACTIVITY_MS);
  }, [isAuthenticated, handleAutoLogout, clearAllTimers]);

  // Permettre à l'utilisateur de prolonger explicitement la session
  const extendSession = useCallback(() => resetTimers(), [resetTimers]);

  // ─── Écoute des événements d'activité ────────────────────
  useEffect(() => {
    // Si non connecté, pas besoin de timers
    if (!isAuthenticated) { clearAllTimers(); setShowWarning(false); return; }

    // Ne pas réinitialiser les timers si le modal de décompte est visible :
    // l'utilisateur doit interagir avec le modal pour prolonger sa session
    const handleActivity = () => { if (!showWarning) resetTimers(); };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    resetTimers(); // Démarrer les timers à la connexion

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearAllTimers();
    };
  }, [isAuthenticated, resetTimers, showWarning, clearAllTimers]);

  // ─── Rien à afficher tant que le modal n'est pas déclenché ─
  if (!showWarning) return null;

  // ─── Formatage du décompte (mm:ss) ───────────────────────
  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, "0");

  // ─── Modal de décompte ────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#0f1f2e",
        border: "1px solid rgba(245,158,11,0.4)",
        borderRadius: 14, padding: "2rem 2.5rem",
        maxWidth: 420, width: "90%", textAlign: "center",
        boxShadow: "0 0 40px rgba(245,158,11,0.15)",
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>⏳</div>
        <h2 style={{ color: "#e8f4e8", marginBottom: 8, fontSize: "1.2rem" }}>
          Session inactive
        </h2>
        <p style={{ color: "rgba(168,191,212,0.8)", marginBottom: 16, fontSize: "0.9rem" }}>
          Vous allez être déconnecté automatiquement dans :
        </p>
        {/* Compte à rebours — rouge si moins d'une minute restante */}
        <div style={{
          fontSize: 42, fontWeight: "bold", color: countdown <= 60 ? "#ef4444" : "#f59e0b",
          marginBottom: 24, fontVariantNumeric: "tabular-nums",
          transition: "color 0.3s",
        }}>
          {mins}:{secs}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {/* Prolonger la session — réinitialise les timers */}
          <button
            onClick={extendSession}
            style={{
              padding: "10px 24px", background: "#4ab83f", color: "#fff",
              border: "none", borderRadius: 8, cursor: "pointer",
              fontWeight: 600, fontSize: "0.95rem",
            }}
          >
            Continuer la session
          </button>
          {/* Déconnexion immédiate */}
          <button
            onClick={handleAutoLogout}
            style={{
              padding: "10px 24px",
              background: "rgba(239,68,68,0.15)", color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8,
              cursor: "pointer", fontSize: "0.95rem",
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
