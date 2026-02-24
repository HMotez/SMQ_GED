// ============================================================
// pages/Login.jsx — ACTIA ES · Dark Glass Premium · TailwindCSS
// ============================================================
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import logoImg from "../assets/Logo.png";
import {
  LuMail, LuLock, LuEye, LuEyeOff,
  LuCircleAlert, LuShieldCheck, LuArrowRight,
  LuFileText, LuCheck, LuSettings, LuBookOpen,
} from "react-icons/lu";

/* ── Role definitions ─────────────────────────────────────── */
const ROLES = [
  {
    name:  "Admin GED",
    email: "admin@actia.com",
    badge: "Super Admin",
    color: "#f87171",
    icon:  LuSettings,
    perms: ["Créer", "Valider", "Archiver", "Gérer utilisateurs"],
  },
  {
    name:  "Responsable Qualité",
    email: "rq@actia.com",
    badge: "Manager",
    color: "#fbbf24",
    icon:  LuCheck,
    perms: ["Créer", "Valider", "Archiver"],
  },
  {
    name:  "Rédacteur",
    email: "redacteur@actia.com",
    badge: "Éditeur",
    color: "#60a5fa",
    icon:  LuFileText,
    perms: ["Créer", "Modifier", "Soumettre"],
  },
  {
    name:  "Validateur",
    email: "validateur@actia.com",
    badge: "Valideur",
    color: "#4ade80",
    icon:  LuCheck,
    perms: ["Consulter", "Valider docs"],
  },
  {
    name:  "Lecteur",
    email: "lecteur@actia.com",
    badge: "Read-Only",
    color: "#a78bfa",
    icon:  LuBookOpen,
    perms: ["Consulter documents"],
  },
];

/* ── ISO permission matrix ────────────────────────────────── */
const PERMISSIONS = [
  { label: "Créer document",     roles: ["Admin GED", "Resp. Qualité", "Rédacteur"],  icon: LuFileText },
  { label: "Valider document",   roles: ["Admin GED", "Resp. Qualité", "Validateur"], icon: LuCheck },
  { label: "Archiver",           roles: ["Admin GED", "Resp. Qualité"],               icon: LuSettings },
  { label: "Gérer utilisateurs", roles: ["Admin GED"],                                icon: LuShieldCheck },
];

/* ── Keyframe animations ──────────────────────────────────── */
const STYLES = `
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes fadeInUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes blob {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(40px,-30px) scale(1.08); }
    66%     { transform: translate(-25px,35px) scale(0.93); }
  }
  @keyframes floatY {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-7px); }
  }
  @keyframes roleIn {
    from { opacity:0; transform:translateX(18px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes badgePop {
    0%   { transform:scale(0.6); opacity:0; }
    80%  { transform:scale(1.1); }
    100% { transform:scale(1); opacity:1; }
  }

  .anim-fade-up  { animation: fadeInUp 0.55s cubic-bezier(.16,1,.3,1) both; }
  .anim-fade-up2 { animation: fadeInUp 0.55s cubic-bezier(.16,1,.3,1) 0.1s both; }
  .anim-fade-in  { animation: fadeIn 0.25s ease both; }
  .dot-float     { animation: floatY 3s ease-in-out infinite; }
  .blob1         { animation: blob 14s ease-in-out infinite; }
  .blob2         { animation: blob 18s ease-in-out infinite 5s; }
  .blob3         { animation: blob 22s ease-in-out infinite 9s; }

  .role-card {
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease, border-color 0.2s, background 0.2s;
  }
  .role-card:hover { transform: translateY(-3px) scale(1.012); }

  .perm-matrix-card { transition: background 0.2s, border-color 0.2s; }
  .perm-matrix-card:hover {
    background: rgba(255,255,255,0.06) !important;
    border-color: rgba(74,184,63,0.2) !important;
  }

  .perm-chip { transition: transform 0.15s; }
  .perm-chip:hover { transform: scale(1.06); }

  .submit-btn { transition: all 0.2s cubic-bezier(.34,1.56,.64,1); }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(74,184,63,0.48) !important;
  }
  .submit-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }

  /* Custom dark glass input — not expressible purely in Tailwind base classes */
  .dark-input {
    width: 100%;
    padding: 11px 12px 11px 40px;
    border-radius: 10px;
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.9);
    font-size: 13.5px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    font-family: inherit;
    box-sizing: border-box;
  }
  .dark-input::placeholder { color: rgba(168,191,212,0.35); }
  .dark-input:focus {
    border-color: rgba(74,184,63,0.6);
    box-shadow: 0 0 0 3.5px rgba(74,184,63,0.15);
    background: rgba(255,255,255,0.09);
  }
  .dark-input:disabled { opacity: 0.5; }
  .dark-input-pr { padding-right: 44px; }
`;

/* ════════════════════════════════════════════════════════════ */
export default function Login() {
  const navigate  = useNavigate();
  const { login } = useUser();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Veuillez remplir tous les champs."); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-6 overflow-hidden relative"
      style={{
        background: "linear-gradient(145deg,#0a1420 0%,#0f1e30 35%,#1a2f4a 70%,#1e3a55 100%)",
        fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      }}
    >
      <style>{STYLES}</style>

      {/* ── Animated background ───────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Blobs */}
        <div
          className="blob1 absolute rounded-full"
          style={{ width:650,height:650,top:"-20%",left:"-15%",background:"radial-gradient(circle,rgba(74,184,63,0.07) 0%,transparent 70%)" }}
        />
        <div
          className="blob2 absolute rounded-full"
          style={{ width:550,height:550,bottom:"-10%",right:"-10%",background:"radial-gradient(circle,rgba(96,165,250,0.05) 0%,transparent 70%)" }}
        />
        <div
          className="blob3 absolute rounded-full"
          style={{ width:380,height:380,top:"40%",right:"22%",background:"radial-gradient(circle,rgba(74,184,63,0.05) 0%,transparent 70%)" }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.035,
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        {/* Top fade */}
        <div
          className="absolute top-0 left-0 right-0 h-52"
          style={{ background: "linear-gradient(to bottom,rgba(10,20,32,0.5),transparent)" }}
        />
      </div>

      {/* ── Main two-column layout ───────────────────────── */}
      <div
        className="anim-fade-up relative flex gap-5 items-start w-full"
        style={{ zIndex: 1, maxWidth: 1040 }}
      >

        {/* ════════════════════════════════════════════════
            LEFT PANEL — Login Form
        ════════════════════════════════════════════════ */}
        <div
          className="flex-shrink-0 rounded-2xl"
          style={{
            width: 420,
            padding: "40px 36px",
            background: "rgba(255,255,255,0.045)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >

          {/* ── Brand logo ──────────────────────────────── */}
          <div className="mb-8">
            <img
              src={logoImg}
              alt="ACTIA ES"
              className="h-14 w-auto"
              style={{ filter: "drop-shadow(0 4px 16px rgba(74,184,63,0.25))" }}
            />
          </div>

          {/* ── Headline ─────────────────────────────────── */}
          <div className="mb-7">
            <h1
              className="text-white text-[26px] font-black m-0 mb-1.5 leading-tight"
              style={{ letterSpacing: -0.8 }}
            >
              Connexion
            </h1>
            <p className="m-0 text-[13.5px] leading-relaxed" style={{ color: "rgba(168,191,212,0.65)" }}>
              Identifiez-vous pour accéder à la plateforme
            </p>
          </div>

          {/* ── Error alert ──────────────────────────────── */}
          {error && (
            <div
              className="anim-fade-in flex items-start gap-2.5 rounded-xl px-3.5 py-3 mb-5"
              style={{ background: "rgba(248,113,113,0.1)", border: "1.5px solid rgba(248,113,113,0.25)" }}
            >
              <LuCircleAlert size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#f87171" }} />
              <p className="m-0 text-[13px] leading-relaxed" style={{ color: "#f87171" }}>{error}</p>
            </div>
          )}

          {/* ── Form ─────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">

            {/* Email */}
            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-[1px] mb-[7px]"
                style={{ color: "rgba(168,191,212,0.55)" }}
              >
                Email
              </label>
              <div className="relative">
                <LuMail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "rgba(168,191,212,0.4)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@actia.com"
                  autoComplete="email"
                  disabled={loading}
                  className="dark-input"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-[1px] mb-[7px]"
                style={{ color: "rgba(168,191,212,0.55)" }}
              >
                Mot de passe
              </label>
              <div className="relative">
                <LuLock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "rgba(168,191,212,0.4)" }}
                />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="dark-input dark-input-pr"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center p-0.5 bg-transparent border-none cursor-pointer transition-colors duration-150"
                  style={{ color: "rgba(168,191,212,0.4)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(168,191,212,0.9)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(168,191,212,0.4)"}
                >
                  {showPass ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="submit-btn w-full py-3.5 mt-1 rounded-xl font-bold text-[14.5px] border-none flex items-center justify-center gap-2.5"
              style={{
                background: loading
                  ? "rgba(255,255,255,0.07)"
                  : "linear-gradient(135deg,#4ab83f 0%,#3da333 100%)",
                color: loading ? "rgba(168,191,212,0.4)" : "white",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 6px 24px rgba(74,184,63,0.4)",
                fontFamily: "inherit",
                letterSpacing: -0.1,
              }}
            >
              {loading ? (
                <>
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: 16, height: 16,
                      border: "2px solid rgba(168,191,212,0.2)",
                      borderTopColor: "rgba(168,191,212,0.5)",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Connexion en cours…
                </>
              ) : (
                <>Se connecter <LuArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-[12.5px] mt-[18px] mb-0" style={{ color: "rgba(168,191,212,0.5)" }}>
            Pas encore de compte ?{" "}
            <NavLink to="/register" className="font-bold no-underline" style={{ color: "#4ab83f" }}>
              Créer un compte →
            </NavLink>
          </p>

          {/* Security badge */}
          <div
            className="mt-5 flex items-center gap-2.5 rounded-xl px-4 py-2.5"
            style={{ background: "rgba(74,184,63,0.06)", border: "1.5px solid rgba(74,184,63,0.18)" }}
          >
            <LuShieldCheck size={15} className="flex-shrink-0" style={{ color: "#4ab83f" }} />
            <p className="m-0 text-[11px] tracking-[0.1px]" style={{ color: "rgba(168,191,212,0.55)" }}>
              Authentification sécurisée JWT · ISO 9001:2015
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            RIGHT PANEL — Roles & Access
        ════════════════════════════════════════════════ */}
        <div
          className="anim-fade-up2 flex-1 min-w-0 rounded-2xl"
          style={{
            padding: "32px 28px",
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          {/* Panel header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-[3px] h-4 rounded-full flex-shrink-0"
                style={{ background: "linear-gradient(to bottom,#4ab83f,#3da333)" }}
              />
              <p
                className="text-[10px] uppercase tracking-[2px] font-bold m-0"
                style={{ color: "rgba(168,191,212,0.5)" }}
              >
                Rôles &amp; Accès
              </p>
            </div>
            <p className="text-white text-[15px] font-bold m-0 mt-1" style={{ letterSpacing: -0.3 }}>
              Profils d'accès à la plateforme
            </p>
          </div>

          {/* Role cards */}
          <div className="flex flex-col gap-2">
            {ROLES.map((r, idx) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.email}
                  className="role-card flex items-center gap-3 rounded-[13px] px-4 py-3"
                  style={{
                    background: `${r.color}0d`,
                    border: `1px solid ${r.color}28`,
                    animation: `roleIn 0.4s cubic-bezier(.16,1,.3,1) ${0.08 + idx * 0.07}s both`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background  = `${r.color}15`;
                    e.currentTarget.style.borderColor  = `${r.color}45`;
                    e.currentTarget.style.boxShadow    = `0 8px 28px rgba(0,0,0,0.25),0 0 0 1px ${r.color}20`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background  = `${r.color}0d`;
                    e.currentTarget.style.borderColor  = `${r.color}28`;
                    e.currentTarget.style.boxShadow    = "none";
                  }}
                >
                  {/* Role icon */}
                  <div
                    className="w-[38px] h-[38px] rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: `${r.color}15`, border: `1px solid ${r.color}30` }}
                  >
                    <Icon size={17} style={{ color: r.color }} />
                  </div>

                  {/* Role info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-[5px]">
                      <span
                        className="font-bold text-[13px] whitespace-nowrap"
                        style={{ color: r.color, letterSpacing: -0.2 }}
                      >
                        {r.name}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.5px] px-[7px] py-px rounded-full"
                        style={{
                          background: `${r.color}18`,
                          color: r.color,
                          border: `1px solid ${r.color}30`,
                          animation: `badgePop 0.4s cubic-bezier(.34,1.56,.64,1) ${0.2 + idx * 0.07}s both`,
                        }}
                      >
                        {r.badge}
                      </span>
                    </div>

                    {/* Permission chips */}
                    <div className="flex flex-wrap gap-1">
                      {r.perms.map(p => (
                        <span
                          key={p}
                          className="perm-chip text-[10px] font-semibold tracking-[0.2px] px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: `1px solid ${r.color}20`,
                            color: "rgba(168,191,212,0.75)",
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="text-right flex-shrink-0">
                    <p className="m-0 text-[10px] mb-0.5" style={{ color: "rgba(168,191,212,0.4)" }}>Email</p>
                    <p
                      className="m-0 text-[10.5px] font-medium"
                      style={{
                        color: "rgba(168,191,212,0.7)",
                        fontFamily: "'SF Mono','Fira Code',monospace",
                        letterSpacing: -0.2,
                      }}
                    >
                      {r.email}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── ISO Permissions matrix ─────────────────── */}
          <div className="mt-5 pt-[18px]" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-block w-[3px] h-3.5 rounded-full flex-shrink-0"
                style={{ background: "linear-gradient(to bottom,#4ab83f,#3da333)" }}
              />
              <p
                className="text-[10px] uppercase tracking-[2px] font-bold m-0"
                style={{ color: "rgba(168,191,212,0.5)" }}
              >
                Matrice des permissions ISO
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PERMISSIONS.map(({ label, roles, icon }) => (
                <div
                  key={label}
                  className="perm-matrix-card rounded-xl px-3.5 py-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">{icon}</span>
                    <p
                      className="text-[10.5px] font-bold m-0"
                      style={{ color: "rgba(255,255,255,0.85)", letterSpacing: -0.1 }}
                    >
                      {label}
                    </p>
                  </div>
                  <p
                    className="text-[9.5px] m-0 leading-relaxed"
                    style={{ color: "rgba(168,191,212,0.45)" }}
                  >
                    {roles.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}