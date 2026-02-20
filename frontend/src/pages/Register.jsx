// ============================================================
// pages/Register.jsx — Sprint 3 : Création de compte
// Inscription avec sélection de rôle ISO — ACTIA ES Theme
// ============================================================
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  LuEye, LuEyeOff, LuCircleCheckBig, LuCircleAlert,
  LuCrown, LuChartBar, LuPenLine, LuBadgeCheck, LuBookOpen,
} from "react-icons/lu";

// ── ACTIA ES brand palette ─────────────────────────────────
const NAVY      = "#2e4a6b";
const NAVY_DARK = "#1e3450";
const NAVY_LIGHT= "#3d5f84";
const GREEN     = "#4ab83f";
const GREEN_DARK= "#3a9a31";
const BG        = "#f0f3f6";
const BORDER    = "#dde4ec";
const MUTED     = "#6b82a0";
const SURFACE   = "#ffffff";

// ── Role definitions — Lucide icon components ──────────────
const ROLES = [
  {
    value: "Admin GED",
    color: "#c0392b", bg: "#fdf2f2", border: "#f5c6cb",
    Icon: LuCrown,
    perms: ["Accès total", "Gérer utilisateurs", "Toutes transitions", "Archivage"],
  },
  {
    value: "Responsable Qualité",
    color: "#b7860b", bg: "#fffbf0", border: "#fde68a",
    Icon: LuChartBar,
    perms: ["Créer / modifier docs", "Valider", "Archiver", "Distribuer"],
  },
  {
    value: "Rédacteur",
    color: "#1a5fa8", bg: "#f0f6ff", border: "#bfdbfe",
    Icon: LuPenLine,
    perms: ["Créer documents", "Modifier", "Brouillon → En validation"],
  },
  {
    value: "Validateur",
    color: "#2d7a3a", bg: "#f0fdf4", border: "#bbf7d0",
    Icon: LuBadgeCheck,
    perms: ["Valider documents", "En validation → Validé", "Lecture seule sinon"],
  },
  {
    value: "Lecteur",
    color: "#4b6280", bg: "#f4f6f9", border: "#cbd5e1",
    Icon: LuBookOpen,
    perms: ["Lecture seule", "Consulter documents", "Pas d'actions d'écriture"],
  },
];

// ── Password strength indicator ────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6)  score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Trop court",  color: "#ef4444", pct: 20  },
    { label: "Faible",      color: "#f97316", pct: 35  },
    { label: "Moyen",       color: "#f59e0b", pct: 55  },
    { label: "Bon",         color: GREEN,     pct: 78  },
    { label: "Excellent",   color: GREEN_DARK,pct: 100 },
  ];
  const lvl = levels[Math.min(score, 4)];

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ height: 4, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: `${lvl.pct}%`, height: "100%",
          background: lvl.color, borderRadius: 2,
          transition: "width 0.3s, background 0.3s",
        }} />
      </div>
      <p style={{ marginTop: 3, fontSize: 10, fontWeight: 700, color: lvl.color }}>{lvl.label}</p>
    </div>
  );
}

// ── ACTIA logo mark (3×3 green dot grid) ──────────────────
function LogoMark() {
  return (
    <div style={{ display: "flex", gap: 3, padding: 8, background: NAVY, borderRadius: 10 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {[...Array(3)].map((_, j) => (
            <div key={j} style={{
              width: 5, height: 5, borderRadius: 1,
              background: GREEN,
              opacity: (i + j) % 2 === 0 ? 1 : 0.45,
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const navigate  = useNavigate();
  const { login } = useUser();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "" });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [success,  setSuccess]  = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedRole = ROLES.find((r) => r.value === form.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim())    return setError("Le nom complet est requis.");
    if (!form.email.trim())   return setError("L'email est requis.");
    if (!form.password)       return setError("Le mot de passe est requis.");
    if (!form.role)           return setError("Sélectionnez un rôle.");
    if (form.password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");
    if (form.password !== form.confirmPassword) return setError("Les mots de passe ne correspondent pas.");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:            form.name.trim(),
          email:           form.email.trim(),
          password:        form.password,
          confirmPassword: form.confirmPassword,
          role:            form.role,
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

  // Icon component for the currently selected role (used in permissions preview)
  const SelectedRoleIcon = selectedRole?.Icon ?? null;

  // ── Input base style ───────────────────────────────────
  const inputBase = (filled) => ({
    width: "100%", padding: "10px 14px", borderRadius: 8,
    background: BG,
    border: `1.5px solid ${filled ? GREEN : BORDER}`,
    color: NAVY_DARK, fontSize: 14, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
    fontFamily: "inherit",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY} 50%, ${NAVY_LIGHT} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: "28px 20px",
    }}>
      {/* Grid overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(${NAVY_LIGHT}22 1px, transparent 1px), linear-gradient(90deg, ${NAVY_LIGHT}22 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />
      {/* Glow accents */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${GREEN}18 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", bottom: "-15%", left: "-5%",  width: 380, height: 380, borderRadius: "50%", background: `radial-gradient(circle, ${NAVY_LIGHT}30 0%, transparent 70%)` }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 980, display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* ── Left panel: form ─────────────────────────────── */}
        <div style={{
          flex: "0 0 430px",
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 18,
          padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(30,52,80,0.22)",
        }}>
          {/* ACTIA header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <LogoMark />
            <div>
              <p style={{ margin: 0, color: NAVY_DARK, fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>ACTIA ES</p>
              <p style={{ margin: 0, color: MUTED, fontSize: 11 }}>Plateforme GED · ISO 9001</p>
            </div>
          </div>

          <h1 style={{ margin: "0 0 4px", color: NAVY_DARK, fontSize: 22, fontWeight: 700 }}>Créer un compte</h1>
          <p style={{ margin: "0 0 24px", color: MUTED, fontSize: 13 }}>
            Rejoignez la plateforme documentaire ACTIA ES
          </p>

          {/* Success banner */}
          {success && (
            <div style={{ background: "#f0fdf4", border: `1px solid ${GREEN}`, borderRadius: 8, padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <LuCircleCheckBig size={18} style={{ color: GREEN_DARK, flexShrink: 0 }} />
              <p style={{ color: GREEN_DARK, margin: 0, fontSize: 13, fontWeight: 600 }}>
                Compte créé ! Connexion en cours…
              </p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div style={{ background: "#fdf2f2", border: "1px solid #f5c6cb", borderRadius: 8, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <LuCircleAlert size={16} style={{ color: "#c0392b", flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: "#c0392b", margin: 0, fontSize: 13 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Full name */}
            <div>
              <label style={{ color: MUTED, fontSize: 10, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Nom complet
              </label>
              <input
                value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="Jean Dupont" autoComplete="name" disabled={loading || success}
                style={inputBase(form.name)}
                onFocus={(e) => { e.target.style.borderColor = GREEN; e.target.style.boxShadow = `0 0 0 3px ${GREEN}20`; }}
                onBlur={(e)  => { e.target.style.borderColor = form.name ? GREEN : BORDER; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ color: MUTED, fontSize: 10, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Email professionnel
              </label>
              <input
                type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                placeholder="prenom.nom@actia.com" autoComplete="email" disabled={loading || success}
                style={inputBase(form.email)}
                onFocus={(e) => { e.target.style.borderColor = GREEN; e.target.style.boxShadow = `0 0 0 3px ${GREEN}20`; }}
                onBlur={(e)  => { e.target.style.borderColor = form.email ? GREEN : BORDER; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Role select */}
            <div>
              <label style={{ color: MUTED, fontSize: 10, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Rôle ISO
              </label>
              <select
                value={form.role} onChange={(e) => set("role", e.target.value)}
                disabled={loading || success}
                style={{
                  ...inputBase(form.role), cursor: "pointer", appearance: "none",
                  background: selectedRole ? selectedRole.bg : BG,
                  borderColor: selectedRole ? selectedRole.border : (form.role ? GREEN : BORDER),
                  color: selectedRole ? selectedRole.color : MUTED,
                  fontWeight: selectedRole ? 700 : 400,
                }}
              >
                <option value="" style={{ background: SURFACE, color: MUTED, fontWeight: 400 }}>
                  — Sélectionner un rôle —
                </option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value} style={{ background: SURFACE, color: NAVY_DARK, fontWeight: 500 }}>
                    {r.value}
                  </option>
                ))}
              </select>
              {/* Inline permissions preview */}
              {selectedRole && (
                <div style={{ marginTop: 8, padding: "8px 12px", background: selectedRole.bg, border: `1px solid ${selectedRole.border}`, borderRadius: 6 }}>
                  <p style={{ margin: "0 0 5px", color: selectedRole.color, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                    {SelectedRoleIcon && <SelectedRoleIcon size={12} />} Permissions {selectedRole.value}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {selectedRole.perms.map((p) => (
                      <span key={p} style={{ background: SURFACE, color: selectedRole.color, border: `1px solid ${selectedRole.border}`, borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 600 }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ color: MUTED, fontSize: 10, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password} onChange={(e) => set("password", e.target.value)}
                  placeholder="Min. 6 caractères" autoComplete="new-password" disabled={loading || success}
                  style={{ ...inputBase(form.password), paddingRight: 44 }}
                  onFocus={(e) => { e.target.style.borderColor = GREEN; e.target.style.boxShadow = `0 0 0 3px ${GREEN}20`; }}
                  onBlur={(e)  => { e.target.style.borderColor = form.password ? GREEN : BORDER; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center" }}>
                  {showPass ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ color: MUTED, fontSize: 10, fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Confirmer le mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConf ? "text" : "password"}
                  value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="Répéter le mot de passe" autoComplete="new-password" disabled={loading || success}
                  style={{
                    ...inputBase(form.confirmPassword),
                    paddingRight: 44,
                    borderColor: form.confirmPassword
                      ? (form.password === form.confirmPassword ? GREEN : "#ef4444")
                      : BORDER,
                  }}
                  onFocus={(e) => { e.target.style.borderColor = GREEN; e.target.style.boxShadow = `0 0 0 3px ${GREEN}20`; }}
                  onBlur={(e)  => {
                    e.target.style.boxShadow = "none";
                    if (form.confirmPassword) {
                      e.target.style.borderColor = form.password === form.confirmPassword ? GREEN : "#ef4444";
                    } else {
                      e.target.style.borderColor = BORDER;
                    }
                  }}
                />
                <button type="button" onClick={() => setShowConf((s) => !s)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center" }}>
                  {showConf ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p style={{ color: "#ef4444", fontSize: 10, margin: "3px 0 0", fontWeight: 700 }}>✗ Les mots de passe ne correspondent pas</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p style={{ color: GREEN_DARK, fontSize: 10, margin: "3px 0 0", fontWeight: 700 }}>✓ Mots de passe identiques</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading || success}
              style={{
                width: "100%", padding: "12px",
                background: (loading || success) ? BG : GREEN,
                border: `1px solid ${(loading || success) ? BORDER : GREEN_DARK}`,
                borderRadius: 8,
                color: (loading || success) ? MUTED : "#fff",
                fontSize: 14, fontWeight: 700,
                cursor: (loading || success) ? "not-allowed" : "pointer",
                boxShadow: (loading || success) ? "none" : `0 4px 14px ${GREEN}44`,
                transition: "all 0.2s", marginTop: 4,
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { if (!loading && !success) e.currentTarget.style.background = GREEN_DARK; }}
              onMouseLeave={(e) => { if (!loading && !success) e.currentTarget.style.background = GREEN; }}
            >
              {loading ? "Création en cours…" : success ? "Compte créé !" : "Créer mon compte →"}
            </button>

            {/* Login link */}
            <p style={{ margin: 0, textAlign: "center", color: MUTED, fontSize: 12 }}>
              Déjà un compte ?{" "}
              <NavLink to="/login" style={{ color: GREEN, textDecoration: "none", fontWeight: 700 }}>
                Se connecter
              </NavLink>
            </p>
          </form>
        </div>

        {/* ── Right panel: role cards ───────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>

          <div style={{
            background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: "22px",
            boxShadow: "0 8px 32px rgba(30,52,80,0.12)",
            marginBottom: 4,
          }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 3, height: 18, background: GREEN, borderRadius: 2 }} />
              <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, margin: 0 }}>
                Rôles disponibles
              </p>
            </div>
            <p style={{ color: MUTED, fontSize: 12, margin: "0 0 16px" }}>
              Cliquez sur un rôle pour le sélectionner dans le formulaire
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ROLES.map((r) => {
                const active = form.role === r.value;
                const RoleIcon = r.Icon;
                return (
                  <button
                    key={r.value} type="button"
                    onClick={() => set("role", active ? "" : r.value)}
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: active ? r.bg : BG,
                      border: `1.5px solid ${active ? r.border : BORDER}`,
                      borderRadius: 10, cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s", boxShadow: active ? `0 2px 8px ${r.border}44` : "none",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = r.bg; e.currentTarget.style.borderColor = r.border; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = BG; e.currentTarget.style.borderColor = BORDER; } }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: active ? r.border + "55" : BORDER + "88", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <RoleIcon size={14} style={{ color: active ? r.color : MUTED }} />
                        </div>
                        <span style={{ color: active ? r.color : NAVY_DARK, fontWeight: 700, fontSize: 13 }}>{r.value}</span>
                      </div>
                      {active && (
                        <span style={{ color: r.color, fontSize: 10, fontWeight: 700, background: SURFACE, border: `1px solid ${r.border}`, borderRadius: 99, padding: "2px 9px" }}>
                          ✓ Sélectionné
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {r.perms.map((p) => (
                        <span key={p} style={{
                          background: active ? SURFACE : "#e8ecf1",
                          color: active ? r.color : MUTED,
                          border: `1px solid ${active ? r.border : BORDER}`,
                          borderRadius: 4, padding: "1px 7px", fontSize: 10,
                          fontWeight: active ? 600 : 400,
                          transition: "all 0.15s",
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
          <div style={{
            background: "#fffbf0", border: "1px solid #fde68a",
            borderRadius: 12, padding: "14px 16px",
            boxShadow: "0 4px 16px rgba(30,52,80,0.08)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <div style={{ width: 3, height: 14, background: "#b7860b", borderRadius: 2 }} />
              <p style={{ color: "#b7860b", fontSize: 11, fontWeight: 700, margin: 0 }}>
                ISO 9001:2015 — Séparation des rôles
              </p>
            </div>
            <p style={{ color: "#6b5c2e", fontSize: 11, margin: 0, lineHeight: 1.65 }}>
              Selon la norme, le <strong style={{ color: "#8a6d0b" }}>Rédacteur</strong> et le{" "}
              <strong style={{ color: "#8a6d0b" }}>Validateur</strong> doivent être des personnes différentes.
              Un rédacteur ne peut pas valider ses propres documents.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
