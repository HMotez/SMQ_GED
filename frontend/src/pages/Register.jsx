// ============================================================
// pages/Register.jsx — ACTIA ES · Dark Glass Premium · TailwindCSS
// ============================================================
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import logoImg from "../assets/Logo.png";
import {
  LuEye, LuEyeOff, LuCircleCheckBig, LuCircleAlert,
  LuCrown, LuChartBar, LuPenLine, LuBadgeCheck, LuBookOpen,
  LuShieldCheck, LuArrowRight, LuUser, LuMail, LuLock, LuCheck, LuX,
} from "react-icons/lu";

/* ── Role definitions ─────────────────────────────────────── */
const ROLES = [
  {
    value: "Admin GED",
    emoji: "",
    badge: "Super Admin",
    color: "#f87171",
    Icon:  LuCrown,
    perms: ["Accès total", "Gérer utilisateurs", "Toutes transitions", "Archivage"],
  },
  {
    value: "Responsable Qualité",
    emoji: "",
    badge: "Manager",
    color: "#fbbf24",
    Icon:  LuChartBar,
    perms: ["Créer / modifier docs", "Valider", "Archiver", "Distribuer"],
  },
  {
    value: "Rédacteur",
    emoji: "",
    badge: "Éditeur",
    color: "#60a5fa",
    Icon:  LuPenLine,
    perms: ["Créer documents", "Modifier", "Brouillon → En validation"],
  },
  {
    value: "Validateur",
    emoji: "",
    badge: "Valideur",
    color: "#4ade80",
    Icon:  LuBadgeCheck,
    perms: ["Valider documents", "En validation → Validé", "Lecture seule sinon"],
  },
  {
    value: "Lecteur",
    emoji: "",
    badge: "Read-Only",
    color: "#a78bfa",
    Icon:  LuBookOpen,
    perms: ["Lecture seule", "Consulter documents", "Pas d'actions d'écriture"],
  },
];

/* ── Animations ───────────────────────────────────────────── */
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

  .role-card-btn {
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease, border-color 0.2s, background 0.2s;
  }
  .role-card-btn:hover { transform: translateY(-2px) scale(1.008); }

  .submit-btn { transition: all 0.2s cubic-bezier(.34,1.56,.64,1); }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(74,184,63,0.48) !important;
  }
  .submit-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }

  .perm-chip { transition: transform 0.15s; }
  .perm-chip:hover { transform: scale(1.06); }

  /* Dark glass input */
  .dark-input {
    width: 100%;
    padding: 11px 14px;
    border-radius: 10px;
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.9);
    font-size: 13.5px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    font-family: inherit;
    box-sizing: border-box;
    appearance: none;
  }
  .dark-input::placeholder { color: rgba(168,191,212,0.35); }
  .dark-input:focus {
    border-color: rgba(74,184,63,0.6);
    box-shadow: 0 0 0 3.5px rgba(74,184,63,0.15);
    background: rgba(255,255,255,0.09);
  }
  .dark-input:disabled { opacity: 0.5; cursor: not-allowed; }
  .dark-input-active {
    border-color: rgba(74,184,63,0.55) !important;
    box-shadow: 0 0 0 3.5px rgba(74,184,63,0.13) !important;
    background: rgba(255,255,255,0.09) !important;
  }
  .dark-input-error {
    border-color: rgba(248,113,113,0.6) !important;
    box-shadow: 0 0 0 3.5px rgba(248,113,113,0.13) !important;
  }
  .dark-input-pr { padding-right: 44px; }

  select.dark-input option { background: #0d1f30; color: rgba(255,255,255,0.85); }
`;

/* ── Password strength bar ────────────────────────────────── */
function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6)           score++;
  if (password.length >= 10)          score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;

  const levels = [
    { label: "Trop court",  color: "#f87171", pct: "20%"  },
    { label: "Faible",      color: "#fb923c", pct: "35%"  },
    { label: "Moyen",       color: "#fbbf24", pct: "55%"  },
    { label: "Bon",         color: "#4ab83f", pct: "78%"  },
    { label: "Excellent",   color: "#3da333", pct: "100%" },
  ];
  const lvl = levels[Math.min(score, 4)];

  return (
    <div className="mt-1.5">
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: lvl.pct, background: lvl.color }}
        />
      </div>
      <p className="mt-1 text-[10px] font-bold m-0" style={{ color: lvl.color }}>{lvl.label}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function Register() {
  const navigate  = useNavigate();
  const { login } = useUser();

  const [form, setForm] = useState({ name:"", email:"", password:"", confirmPassword:"", role:"" });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [success,  setSuccess]  = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectedRole = ROLES.find(r => r.value === form.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim())                          return setError("Le nom complet est requis.");
    if (!form.email.trim())                         return setError("L'email est requis.");
    if (!form.password)                             return setError("Le mot de passe est requis.");
    if (!form.role)                                 return setError("Sélectionnez un rôle.");
    if (form.password.length < 6)                   return setError("Le mot de passe doit contenir au moins 6 caractères.");
    if (form.password !== form.confirmPassword)     return setError("Les mots de passe ne correspondent pas.");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name: form.name.trim(), email: form.email.trim(),
          password: form.password, confirmPassword: form.confirmPassword, role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création du compte.");
      setSuccess(true);
      await login(form.email.trim(), form.password);
      setTimeout(() => navigate("/", { replace: true }), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const SelectedRoleIcon = selectedRole?.Icon ?? null;

  /* Helpers for input class */
  const inputCls = (active) =>
    `dark-input${active ? " dark-input-active" : ""}`;

  const confirmCls = () => {
    if (!form.confirmPassword) return "dark-input dark-input-pr";
    if (form.password === form.confirmPassword) return "dark-input dark-input-pr dark-input-active";
    return "dark-input dark-input-pr dark-input-error";
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

      {/* ── Background blobs + grid ─────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="blob1 absolute rounded-full"
          style={{ width:650,height:650,top:"-20%",left:"-15%",background:"radial-gradient(circle,rgba(74,184,63,0.07) 0%,transparent 70%)" }} />
        <div className="blob2 absolute rounded-full"
          style={{ width:550,height:550,bottom:"-10%",right:"-10%",background:"radial-gradient(circle,rgba(96,165,250,0.05) 0%,transparent 70%)" }} />
        <div className="blob3 absolute rounded-full"
          style={{ width:380,height:380,top:"40%",right:"22%",background:"radial-gradient(circle,rgba(74,184,63,0.05) 0%,transparent 70%)" }} />
        <div className="absolute inset-0" style={{ opacity:0.035, backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"52px 52px" }} />
        <div className="absolute top-0 left-0 right-0 h-52" style={{ background:"linear-gradient(to bottom,rgba(10,20,32,0.5),transparent)" }} />
      </div>

      {/* ── Main two-column layout ───────────────────────── */}
      <div className="anim-fade-up relative flex gap-5 items-start w-full" style={{ zIndex:1, maxWidth:1040 }}>

        {/* ════════════════════════════════════════════════
            LEFT PANEL — Register Form
        ════════════════════════════════════════════════ */}
        <div
          className="flex-shrink-0 rounded-2xl"
          style={{
            width: 430,
            padding: "36px 32px",
            background: "rgba(255,255,255,0.045)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Brand logo */}
          <div className="mb-7">
            <img
              src={logoImg}
              alt="ACTIA ES"
              className="h-14 w-auto"
              style={{ filter: "drop-shadow(0 4px 16px rgba(74,184,63,0.25))" }}
            />
          </div>

          {/* Headline */}
          <h1 className="text-white text-[24px] font-black m-0 mb-1.5" style={{ letterSpacing:-0.7 }}>
            Créer un compte
          </h1>
          <p className="m-0 text-[13px] mb-6" style={{ color:"rgba(168,191,212,0.65)" }}>
            Rejoignez la plateforme documentaire ACTIA ES
          </p>

          {/* Success banner */}
          {success && (
            <div className="anim-fade-in flex items-center gap-2.5 rounded-xl px-4 py-3 mb-5 border"
              style={{ background:"rgba(74,222,128,0.08)", borderColor:"rgba(74,222,128,0.25)" }}>
              <LuCircleCheckBig size={18} className="flex-shrink-0" style={{ color:"#4ade80" }} />
              <p className="m-0 text-[13px] font-semibold" style={{ color:"#4ade80" }}>Compte créé ! Connexion en cours…</p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="anim-fade-in flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5 border"
              style={{ background:"rgba(248,113,113,0.1)", borderColor:"rgba(248,113,113,0.25)" }}>
              <LuCircleAlert size={16} className="flex-shrink-0 mt-0.5" style={{ color:"#f87171" }} />
              <p className="m-0 text-[13px]" style={{ color:"#f87171" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Full name */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-[1px] mb-1.5 flex items-center gap-1.5"
                style={{ color:"rgba(168,191,212,0.55)" }}>
                <LuUser size={13} />
                Nom complet
              </label>
              <input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="Jean Dupont"
                autoComplete="name"
                disabled={loading || success}
                className={inputCls(!!form.name)}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-[1px] mb-1.5 flex items-center gap-1.5"
                style={{ color:"rgba(168,191,212,0.55)" }}>
                <LuMail size={13} />
                Email professionnel
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="prenom.nom@actia.com"
                autoComplete="email"
                disabled={loading || success}
                className={inputCls(!!form.email)}
              />
            </div>

            {/* Role select */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-[1px] mb-1.5 flex items-center gap-1.5"
                style={{ color:"rgba(168,191,212,0.55)" }}>
                <LuBadgeCheck size={13} />
                Rôle ISO
              </label>
              <select
                value={form.role}
                onChange={e => set("role", e.target.value)}
                disabled={loading || success}
                className={inputCls(!!form.role)}
                style={selectedRole ? {
                  borderColor: `${selectedRole.color}55`,
                  boxShadow:   `0 0 0 3.5px ${selectedRole.color}18`,
                  background:  `${selectedRole.color}12`,
                  color:        selectedRole.color,
                  fontWeight:   700,
                } : {}}
              >
                <option value="">— Sélectionner un rôle —</option>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.emoji} {r.value}</option>
                ))}
              </select>

              {/* Permissions preview */}
              {selectedRole && (
                <div className="anim-fade-in mt-2 px-3.5 py-2.5 rounded-xl border"
                  style={{ background:`${selectedRole.color}0d`, borderColor:`${selectedRole.color}28` }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    {SelectedRoleIcon && <SelectedRoleIcon size={12} style={{ color:selectedRole.color }} />}
                    <p className="m-0 text-[11px] font-bold" style={{ color:selectedRole.color }}>
                      Permissions {selectedRole.value}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedRole.perms.map(p => (
                      <span key={p} className="perm-chip px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${selectedRole.color}25`, color:"rgba(168,191,212,0.8)" }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Password */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-[1px] mb-1.5"
                style={{ color:"rgba(168,191,212,0.55)" }}>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  placeholder="Min. 6 caractères"
                  autoComplete="new-password"
                  disabled={loading || success}
                  className={`${inputCls(!!form.password)} dark-input-pr`}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center p-0.5 bg-transparent border-none cursor-pointer transition-colors duration-150"
                  style={{ color:"rgba(168,191,212,0.4)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(168,191,212,0.9)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(168,191,212,0.4)"}>
                  {showPass ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-[1px] mb-1.5 flex items-center gap-1.5"
                style={{ color:"rgba(168,191,212,0.55)" }}>
                <LuLock size={13} />
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConf ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={e => set("confirmPassword", e.target.value)}
                  placeholder="Répéter le mot de passe"
                  autoComplete="new-password"
                  disabled={loading || success}
                  className={confirmCls()}
                />
                <button type="button" onClick={() => setShowConf(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center p-0.5 bg-transparent border-none cursor-pointer transition-colors duration-150"
                  style={{ color:"rgba(168,191,212,0.4)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(168,191,212,0.9)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(168,191,212,0.4)"}>
                  {showConf ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="anim-fade-in text-[10px] mt-1 font-bold m-0 flex items-center gap-1" style={{ color:"#f87171" }}>
                  <LuX size={12} /> Les mots de passe ne correspondent pas
                </p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="anim-fade-in text-[10px] mt-1 font-bold m-0 flex items-center gap-1" style={{ color:"#4ade80" }}>
                  <LuCheck size={12} /> Mots de passe identiques
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="submit-btn w-full py-3 rounded-xl font-bold text-[14.5px] flex items-center justify-center gap-2.5 mt-1 border-none"
              style={{
                background: loading || success
                  ? "rgba(255,255,255,0.07)"
                  : "linear-gradient(135deg,#4ab83f 0%,#3da333 100%)",
                color:  loading || success ? "rgba(168,191,212,0.4)" : "white",
                cursor: loading || success ? "not-allowed" : "pointer",
                boxShadow: loading || success ? "none" : "0 6px 24px rgba(74,184,63,0.4)",
                fontFamily: "inherit",
                letterSpacing: -0.1,
              }}
            >
              {loading ? (
                <>
                  <span className="inline-block rounded-full" style={{ width:16,height:16,border:"2px solid rgba(168,191,212,0.2)",borderTopColor:"rgba(168,191,212,0.5)",animation:"spin 0.7s linear infinite" }} />
                  Création en cours…
                </>
              ) : success ? (
                <><LuCircleCheckBig size={16} /> Compte créé !</>
              ) : (
                <>Créer mon compte <LuArrowRight size={16} /></>
              )}
            </button>

            <p className="text-center text-[12.5px] mt-1 mb-0" style={{ color:"rgba(168,191,212,0.5)" }}>
              Déjà un compte ?{" "}
              <NavLink to="/login" className="font-bold no-underline" style={{ color:"#4ab83f" }}>
                Se connecter →
              </NavLink>
            </p>
          </form>
        </div>

        {/* ════════════════════════════════════════════════
            RIGHT PANEL — Role showcase
        ════════════════════════════════════════════════ */}
        <div className="anim-fade-up2 flex-1 min-w-0 flex flex-col gap-4">

          {/* Role cards */}
          <div
            className="rounded-2xl"
            style={{
              padding: "28px 24px",
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
                <span className="inline-block w-[3px] h-4 rounded-full flex-shrink-0"
                  style={{ background:"linear-gradient(to bottom,#4ab83f,#3da333)" }} />
                <p className="text-[10px] uppercase tracking-[2px] font-bold m-0"
                  style={{ color:"rgba(168,191,212,0.5)" }}>Rôles disponibles</p>
              </div>
              <p className="text-white text-[14px] font-semibold m-0 mt-1 ml-[13px]">
                Cliquez pour sélectionner votre rôle
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {ROLES.map((r, idx) => {
                const active = form.role === r.value;
                const RoleIcon = r.Icon;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set("role", active ? "" : r.value)}
                    className="role-card-btn w-full text-left rounded-xl px-4 py-3 border-none cursor-pointer"
                    style={{
                      background:   active ? `${r.color}12` : "rgba(255,255,255,0.03)",
                      border:       `1px solid ${active ? r.color + "40" : "rgba(255,255,255,0.07)"}`,
                      boxShadow:    active ? `0 4px 20px ${r.color}18, 0 0 0 1px ${r.color}20` : "none",
                      fontFamily:   "inherit",
                      animation:    `roleIn 0.4s cubic-bezier(.16,1,.3,1) ${0.08 + idx * 0.07}s both`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        {/* Role icon */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 transition-all"
                          style={{ background:active?`${r.color}18`:"rgba(255,255,255,0.05)", borderColor:active?`${r.color}33`:"rgba(255,255,255,0.1)" }}>
                          <RoleIcon size={14} style={{ color:active?r.color:"rgba(168,191,212,0.4)" }} />
                        </div>
                        <span className="font-bold text-[13px]" style={{ color:active?r.color:"rgba(255,255,255,0.8)" }}>
                          {r.emoji} {r.value}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: `${r.color}15`,
                            color: r.color,
                            border: `1px solid ${r.color}28`,
                            animation: `badgePop 0.4s cubic-bezier(.34,1.56,.64,1) ${0.2 + idx * 0.07}s both`,
                          }}
                        >
                          {r.badge}
                        </span>
                        {active && (
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background:`${r.color}15`, color:r.color, border:`1px solid ${r.color}35` }}>
                            <LuCheck size={10} /> Sélectionné
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Permission chips */}
                    <div className="flex flex-wrap gap-1">
                      {r.perms.map(p => (
                        <span key={p} className="perm-chip text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background:  active ? `${r.color}12` : "rgba(255,255,255,0.05)",
                            color:       active ? r.color         : "rgba(168,191,212,0.5)",
                            border:      `1px solid ${active ? r.color + "28" : "rgba(255,255,255,0.07)"}`,
                            fontWeight:  active ? 600 : 400,
                          }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ISO notice */}
          <div
            className="rounded-2xl px-5 py-4"
            style={{ background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-[3px] h-3.5 rounded-full flex-shrink-0"
                style={{ background:"#fbbf24" }} />
              <p className="text-[11px] font-bold m-0" style={{ color:"#fbbf24" }}>
                ⚖️ ISO 9001:2015 — Séparation des rôles
              </p>
            </div>
            <p className="text-[11.5px] m-0 leading-relaxed" style={{ color:"rgba(251,191,36,0.75)" }}>
              Selon la norme, le <strong style={{ color:"#fbbf24" }}>Rédacteur</strong> et le{" "}
              <strong style={{ color:"#fbbf24" }}>Validateur</strong> doivent être des personnes différentes.
              Un rédacteur ne peut pas valider ses propres documents.
            </p>
          </div>

          {/* Security badge */}
          <div
            className="rounded-2xl px-5 py-3.5 flex items-center gap-3"
            style={{ background:"rgba(74,184,63,0.06)", border:"1px solid rgba(74,184,63,0.18)" }}
          >
            <LuShieldCheck size={16} className="flex-shrink-0" style={{ color:"#4ab83f" }} />
            <p className="text-[11px] m-0 flex items-center gap-1" style={{ color:"rgba(168,191,212,0.55)" }}>
              <LuLock size={13} /> Authentification sécurisée JWT · ISO 9001:2015 · Données chiffrées
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}