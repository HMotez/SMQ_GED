// ============================================================
// pages/ForgotPassword.jsx — ACTIA ES · Dark Glass Premium
// ============================================================
import { useState } from "react";
import { NavLink }  from "react-router-dom";
import logoImg      from "../assets/Logo.png";
import axios        from "axios";
import {
  LuMail, LuArrowLeft, LuShieldCheck,
  LuCircleAlert, LuCircleCheck,
} from "react-icons/lu";

const API = import.meta.env.VITE_API_URL || "/api";

const STYLES = `
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes fadeInUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes blob {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(40px,-30px) scale(1.08); }
    66%     { transform: translate(-25px,35px) scale(0.93); }
  }
  .anim-fade-up { animation: fadeInUp 0.55s cubic-bezier(.16,1,.3,1) both; }
  .anim-fade-in { animation: fadeIn 0.25s ease both; }
  .blob1 { animation: blob 14s ease-in-out infinite; }
  .blob2 { animation: blob 18s ease-in-out infinite 5s; }
  .submit-btn { transition: all 0.2s cubic-bezier(.34,1.56,.64,1); }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(74,184,63,0.48) !important;
  }
  .submit-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
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
`;

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Veuillez saisir votre adresse email."); return; }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur serveur. Veuillez réessayer.");
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

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="blob1 absolute rounded-full" style={{ width:650,height:650,top:"-20%",left:"-15%",background:"radial-gradient(circle,rgba(74,184,63,0.07) 0%,transparent 70%)" }} />
        <div className="blob2 absolute rounded-full" style={{ width:550,height:550,bottom:"-10%",right:"-10%",background:"radial-gradient(circle,rgba(96,165,250,0.05) 0%,transparent 70%)" }} />
        <div className="absolute inset-0" style={{ opacity:0.035,backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",backgroundSize:"52px 52px" }} />
      </div>

      <div
        className="anim-fade-up relative w-full"
        style={{ zIndex:1, maxWidth:420 }}
      >
        <div
          className="rounded-2xl"
          style={{
            padding: "40px 36px",
            background: "rgba(255,255,255,0.045)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Logo */}
          <div className="mb-8">
            <img src={logoImg} alt="ACTIA ES" className="actia-logo h-14 w-auto" />
          </div>

          {sent ? (
            /* ── Success state ──────────────────────────── */
            <div className="anim-fade-in">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
                style={{ background:"rgba(74,184,63,0.12)", border:"1.5px solid rgba(74,184,63,0.25)" }}
              >
                <LuCircleCheck size={28} style={{ color:"#4ab83f" }} />
              </div>
              <h1 className="text-white text-[22px] font-black m-0 mb-2" style={{ letterSpacing:-0.6 }}>
                Email envoyé !
              </h1>
              <p className="m-0 mb-6 text-[13.5px] leading-relaxed" style={{ color:"rgba(168,191,212,0.65)" }}>
                Si l'adresse <strong style={{ color:"rgba(168,191,212,0.9)" }}>{email}</strong> est associée à un compte,
                vous recevrez un lien de réinitialisation valable <strong style={{ color:"rgba(168,191,212,0.9)" }}>1 heure</strong>.
              </p>
              <p className="m-0 mb-6 text-[12px] leading-relaxed" style={{ color:"rgba(168,191,212,0.45)" }}>
                Vérifiez également vos spams si vous ne recevez pas l'email.
              </p>
              <NavLink
                to="/login"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-[14px] no-underline"
                style={{
                  background:"linear-gradient(135deg,#4ab83f 0%,#3da333 100%)",
                  color:"white",
                  boxShadow:"0 6px 24px rgba(74,184,63,0.4)",
                }}
              >
                <LuArrowLeft size={15} /> Retour à la connexion
              </NavLink>
            </div>
          ) : (
            /* ── Form state ─────────────────────────────── */
            <>
              <div className="mb-7">
                <h1 className="text-white text-[24px] font-black m-0 mb-1.5" style={{ letterSpacing:-0.8 }}>
                  Mot de passe oublié
                </h1>
                <p className="m-0 text-[13px] leading-relaxed" style={{ color:"rgba(168,191,212,0.6)" }}>
                  Saisissez votre email pour recevoir un lien de réinitialisation.
                </p>
              </div>

              {error && (
                <div className="anim-fade-in flex items-start gap-2.5 rounded-xl px-3.5 py-3 mb-5"
                  style={{ background:"rgba(248,113,113,0.1)", border:"1.5px solid rgba(248,113,113,0.25)" }}>
                  <LuCircleAlert size={16} className="flex-shrink-0 mt-0.5" style={{ color:"#f87171" }} />
                  <p className="m-0 text-[13px]" style={{ color:"#f87171" }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[1px] mb-[7px]" style={{ color:"rgba(168,191,212,0.55)" }}>
                    Adresse email
                  </label>
                  <div className="relative">
                    <LuMail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:"rgba(168,191,212,0.4)" }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      autoComplete="email"
                      disabled={loading}
                      className="dark-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="submit-btn w-full py-3.5 mt-1 rounded-xl font-bold text-[14.5px] border-none flex items-center justify-center gap-2.5"
                  style={{
                    background: loading ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#4ab83f 0%,#3da333 100%)",
                    color: loading ? "rgba(168,191,212,0.4)" : "white",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 6px 24px rgba(74,184,63,0.4)",
                    fontFamily: "inherit",
                  }}
                >
                  {loading ? (
                    <>
                      <span className="inline-block rounded-full" style={{ width:16,height:16,border:"2px solid rgba(168,191,212,0.2)",borderTopColor:"rgba(168,191,212,0.5)",animation:"spin 0.7s linear infinite" }} />
                      Envoi en cours…
                    </>
                  ) : (
                    <>Envoyer le lien de réinitialisation</>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <NavLink to="/login" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold no-underline" style={{ color:"rgba(168,191,212,0.55)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#4ab83f"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(168,191,212,0.55)"}
                >
                  <LuArrowLeft size={13} /> Retour à la connexion
                </NavLink>
              </div>

              <div className="mt-5 flex items-center gap-2.5 rounded-xl px-4 py-2.5" style={{ background:"rgba(74,184,63,0.06)",border:"1.5px solid rgba(74,184,63,0.18)" }}>
                <LuShieldCheck size={15} className="flex-shrink-0" style={{ color:"#4ab83f" }} />
                <p className="m-0 text-[11px]" style={{ color:"rgba(168,191,212,0.55)" }}>
                  Lien sécurisé · Expire après 1 heure · ISO 9001
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
