// ============================================================
// components/LoginModal.jsx — Auth prompt modal with role quick-login
// ============================================================
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  LuX, LuSettings, LuWrench, LuCheck, LuArrowRight,
  LuLock, LuShieldCheck, LuUserPlus,
} from "react-icons/lu";

const ROLES = [
  {
    name:     "Admin",
    email:    "admin@test.com",
    password: "Admin123!",
    badge:    "Administrateur",
    color:    "#f87171",
    icon:     LuSettings,
    perms:    ["Créer", "Valider", "Archiver", "Utilisateurs"],
  },
  {
    name:     "Ing. Qualité",
    email:    "ing@test.com",
    password: "Ing123!",
    badge:    "Ingénieur",
    color:    "#2dd4bf",
    icon:     LuWrench,
    perms:    ["Créer", "Modifier", "Soumettre"],
  },
  {
    name:     "Reviewer",
    email:    "reviewer@test.com",
    password: "Rev123!",
    badge:    "Réviseur",
    color:    "#4ade80",
    icon:     LuCheck,
    perms:    ["Consulter", "Valider docs"],
  },
];

const STYLES = `
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  .modal-overlay { animation: fadeIn 0.18s ease both; }
  .modal-box     { animation: slideUp 0.28s cubic-bezier(.16,1,.3,1) both; }
  .modal-role-card {
    transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s, border-color 0.15s, background 0.15s;
    cursor: pointer;
  }
  .modal-role-card:hover  { transform: translateY(-3px) scale(1.01); }
  .modal-role-card:active { transform: scale(0.98); }
  .modal-role-card-info {
    transition: border-color 0.15s, background 0.15s;
    cursor: default;
  }
`;

export default function LoginModal({ onClose, message = "Connectez-vous pour accéder à cette fonctionnalité.", infoOnly = false }) {
  const navigate       = useNavigate();
  const { login }      = useUser();
  const [quickLoading, setQuickLoading] = useState(null);
  const [error,        setError]        = useState("");

  const handleQuickLogin = async (role) => {
    setError("");
    setQuickLoading(role.name);
    try {
      await login(role.email, role.password);
      onClose();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Connexion échouée.");
    } finally {
      setQuickLoading(null);
    }
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{STYLES}</style>

      <div
        className="modal-box w-full rounded-2xl"
        style={{
          maxWidth: 500,
          background: "#0b1929",
          border: "1px solid rgba(255,255,255,0.13)",
          boxShadow: "0 48px 120px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08)",
          padding: "32px 28px",
          fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        }}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"rgba(74,184,63,0.12)", border:"1px solid rgba(74,184,63,0.25)" }}>
                <LuLock size={13} style={{ color:"#4ab83f" }} />
              </div>
              <p className="m-0 text-[10px] uppercase tracking-[1.5px] font-bold" style={{ color:"#4ab83f" }}>
                Authentification requise
              </p>
            </div>
            <h2 className="m-0 text-[20px] font-black text-white" style={{ letterSpacing:-0.5 }}>
              Choisissez votre rôle
            </h2>
            <p className="m-0 mt-1 text-[12.5px] leading-relaxed" style={{ color:"rgba(168,191,212,0.55)" }}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg border-none flex-shrink-0 mt-0.5"
            style={{ background:"rgba(255,255,255,0.06)", cursor:"pointer", color:"rgba(168,191,212,0.6)" }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.1)"; e.currentTarget.style.color="rgba(255,255,255,0.9)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.color="rgba(168,191,212,0.6)"; }}
          >
            <LuX size={15} />
          </button>
        </div>

        {/* ── Error ──────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-4" style={{ background:"rgba(248,113,113,0.08)", border:"1.5px solid rgba(248,113,113,0.2)" }}>
            <p className="m-0 text-[12px]" style={{ color:"#f87171" }}>{error}</p>
          </div>
        )}

        {/* ── Role cards ─────────────────────────────── */}
        <div className="flex flex-col gap-2.5 mb-5">
          {ROLES.map((r) => {
            const Icon      = r.icon;
            const isLogging = quickLoading === r.name;
            return (
              <div
                key={r.name}
                className={infoOnly ? "modal-role-card-info flex items-center gap-3 rounded-xl px-4 py-3" : "modal-role-card flex items-center gap-3 rounded-xl px-4 py-3"}
                onClick={infoOnly ? undefined : () => !quickLoading && handleQuickLogin(r)}
                style={{
                  background: `${r.color}0a`,
                  border:     `1px solid ${isLogging ? r.color : `${r.color}22`}`,
                  opacity:    !infoOnly && quickLoading && !isLogging ? 0.45 : 1,
                  boxShadow:  isLogging ? `0 0 0 2px ${r.color}35` : "none",
                }}
                onMouseEnter={infoOnly ? undefined : e => {
                  if (quickLoading) return;
                  e.currentTarget.style.background  = `${r.color}12`;
                  e.currentTarget.style.borderColor = `${r.color}40`;
                  e.currentTarget.style.boxShadow   = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${r.color}18`;
                }}
                onMouseLeave={infoOnly ? undefined : e => {
                  if (isLogging) return;
                  e.currentTarget.style.background  = `${r.color}0a`;
                  e.currentTarget.style.borderColor = `${r.color}22`;
                  e.currentTarget.style.boxShadow   = "none";
                }}
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:`${r.color}15`, border:`1px solid ${r.color}30` }}
                >
                  {isLogging ? (
                    <span style={{ width:16,height:16,display:"inline-block",borderRadius:"50%",border:`2px solid ${r.color}30`,borderTopColor:r.color,animation:"spin 0.7s linear infinite" }} />
                  ) : (
                    <Icon size={16} style={{ color:r.color }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[13.5px]" style={{ color:r.color }}>{r.name}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.5px] px-2 py-0.5 rounded-full" style={{ background:`${r.color}18`, color:r.color, border:`1px solid ${r.color}30` }}>
                      {isLogging ? "Connexion…" : r.badge}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.perms.map(p => (
                      <span key={p} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background:"rgba(255,255,255,0.05)", color:"rgba(168,191,212,0.6)" }}>{p}</span>
                    ))}
                  </div>
                </div>

                {/* Arrow — hidden in info-only mode */}
                {!infoOnly && (
                  <span className="flex-shrink-0" style={{ color: isLogging ? r.color : "rgba(168,191,212,0.3)" }}>
                    {isLogging ? (
                      <span className="text-[11px] font-semibold">…</span>
                    ) : (
                      <LuArrowRight size={14} />
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div className="pt-4" style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-center gap-4 flex-wrap mb-3">
            <NavLink
              to="/login"
              onClick={onClose}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold no-underline"
              style={{ color:"rgba(168,191,212,0.7)" }}
              onMouseEnter={e => e.currentTarget.style.color="#4ab83f"}
              onMouseLeave={e => e.currentTarget.style.color="rgba(168,191,212,0.7)"}
            >
              <LuLock size={12} /> Connexion manuelle
            </NavLink>
            <span style={{ color:"rgba(255,255,255,0.12)" }}>·</span>
            <NavLink
              to="/register"
              onClick={onClose}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold no-underline"
              style={{ color:"rgba(168,191,212,0.7)" }}
              onMouseEnter={e => e.currentTarget.style.color="#4ab83f"}
              onMouseLeave={e => e.currentTarget.style.color="rgba(168,191,212,0.7)"}
            >
              <LuUserPlus size={12} /> Créer un compte
            </NavLink>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <LuShieldCheck size={11} style={{ color:"rgba(74,184,63,0.45)" }} />
            <p className="m-0 text-[10.5px]" style={{ color:"rgba(168,191,212,0.28)" }}>
              Authentification JWT sécurisée · ISO 9001
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
