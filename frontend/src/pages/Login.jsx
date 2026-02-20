// ============================================================
// pages/Login.jsx — ACTIA ES Brand Theme · Inter + Lucide
// ============================================================
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  LuMail, LuLock, LuEye, LuEyeOff,
  LuCircleAlert, LuShieldCheck, LuArrowRight, LuUser,
} from "react-icons/lu";

/* ── ACTIA colors ─────────────────────────────────────────── */
const NAVY      = "#2e4a6b";
const NAVY_DARK = "#1e3450";
const GREEN     = "#4ab83f";
const GREEN_DARK= "#3a9a31";
const BG        = "#f0f3f6";
const BORDER    = "#dde4ec";
const MUTED     = "#6b82a0";
const SURFACE   = "#ffffff";

/* ── Demo accounts ────────────────────────────────────────── */
const DEMO_ACCOUNTS = [
  { role:"Admin GED",           email:"admin@actia.com",      password:"Admin123!", accent:"#ef4444", ring:"rgba(239,68,68,0.25)",   bg:"#fef2f2" },
  { role:"Responsable Qualité", email:"rq@actia.com",         password:"RQ123!",   accent:"#f59e0b", ring:"rgba(245,158,11,0.25)",  bg:"#fffbeb" },
  { role:"Rédacteur",           email:"redacteur@actia.com",  password:"Red123!",  accent:"#3b82f6", ring:"rgba(59,130,246,0.25)",  bg:"#eff6ff" },
  { role:"Validateur",          email:"validateur@actia.com", password:"Val123!",  accent:GREEN,     ring:"rgba(74,184,63,0.25)",   bg:"#f0fdf4" },
  { role:"Lecteur",             email:"lecteur@actia.com",    password:"Lec123!",  accent:MUTED,     ring:"rgba(107,130,160,0.25)", bg:"#f8fafc" },
];

const inputCls = {
  width: "100%", padding: "10px 12px 10px 38px", borderRadius: 8,
  background: BG, border: `1px solid ${BORDER}`,
  color: NAVY, fontSize: 13, outline: "none", transition: "border-color 0.15s",
  fontFamily: "inherit",
};

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
      setError(err.message || "Erreur de connexion.");
    } finally { setLoading(false); }
  };

  const fillDemo = (acc) => { setEmail(acc.email); setPassword(acc.password); setError(""); };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg,${NAVY_DARK} 0%,${NAVY} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>

      {/* Background grid */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0, opacity:0.06 }}>
        {[...Array(8)].map((_,i)=>(
          <div key={i} style={{ position:"absolute", top:`${i*14}%`, left:"-5%", width:"110%", height:1, background:"#fff" }} />
        ))}
        {[...Array(8)].map((_,i)=>(
          <div key={i} style={{ position:"absolute", left:`${i*14}%`, top:"-5%", height:"110%", width:1, background:"#fff" }} />
        ))}
      </div>

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:960, display:"flex", gap:20, alignItems:"flex-start" }}>

        {/* ── Left panel: form ──────────────────────────── */}
        <div style={{ flexShrink:0, width:400, background:SURFACE, borderRadius:18, padding:36, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>

          {/* ACTIA Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
            <div style={{ display:"flex", gap:2, padding:8, background:NAVY_DARK, borderRadius:10 }}>
              {[...Array(3)].map((_,i)=>(
                <div key={i} style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {[...Array(3)].map((_,j)=>(
                    <div key={j} style={{ width:6, height:6, borderRadius:1, background:GREEN, opacity:(i+j)%2===0?1:0.5 }} />
                  ))}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
                <span style={{ color:NAVY, fontWeight:800, fontSize:17, letterSpacing:2 }}>ACTIA</span>
                <span style={{ color:GREEN, fontWeight:700, fontSize:11, letterSpacing:1 }}>ES</span>
              </div>
              <p style={{ color:MUTED, fontSize:10, margin:0, letterSpacing:0.3 }}>Engineering Services · GED</p>
            </div>
          </div>

          <h1 style={{ color:NAVY, fontSize:22, fontWeight:800, margin:"0 0 4px", letterSpacing:-0.5 }}>Connexion</h1>
          <p style={{ color:MUTED, fontSize:13, margin:"0 0 24px" }}>Identifiez-vous pour accéder à la plateforme</p>

          {/* Error */}
          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:18 }}>
              <LuCircleAlert size={17} style={{ color:"#ef4444", flexShrink:0 }} />
              <p style={{ color:"#dc2626", fontSize:13, margin:0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* Email */}
            <div>
              <label style={{ display:"block", color:MUTED, fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>Email</label>
              <div style={{ position:"relative" }}>
                <LuMail size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:MUTED }} />
                <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
                  placeholder="votre@actia.com" autoComplete="email" disabled={loading}
                  style={inputCls}
                  onFocus={(e)=>{ e.target.style.borderColor=GREEN; e.target.style.boxShadow=`0 0 0 3px rgba(74,184,63,0.12)`; }}
                  onBlur={(e)=>{ e.target.style.borderColor=BORDER; e.target.style.boxShadow="none"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display:"block", color:MUTED, fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>Mot de passe</label>
              <div style={{ position:"relative" }}>
                <LuLock size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:MUTED }} />
                <input type={showPass?"text":"password"} value={password} onChange={(e)=>setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" disabled={loading}
                  style={{ ...inputCls, paddingRight:40 }}
                  onFocus={(e)=>{ e.target.style.borderColor=GREEN; e.target.style.boxShadow=`0 0 0 3px rgba(74,184,63,0.12)`; }}
                  onBlur={(e)=>{ e.target.style.borderColor=BORDER; e.target.style.boxShadow="none"; }}
                />
                <button type="button" onClick={()=>setShowPass(s=>!s)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:MUTED, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center" }}>
                  {showPass ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width:"100%", padding:"12px 0", borderRadius:9, fontWeight:700, fontSize:14,
                background: loading ? "#e5e7eb" : GREEN,
                color: loading ? MUTED : "#fff",
                border:"none", cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 14px rgba(74,184,63,0.4)",
                transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                fontFamily:"inherit", letterSpacing:-0.2,
              }}
              onMouseEnter={(e)=>{ if(!loading) e.currentTarget.style.background=GREEN_DARK; }}
              onMouseLeave={(e)=>{ if(!loading) e.currentTarget.style.background=GREEN; }}
            >
              {loading ? (
                <><span style={{ width:16,height:16,border:"2px solid #ccc",borderTopColor:MUTED,borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite" }}/> Connexion en cours…</>
              ) : (
                <>Se connecter <LuArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign:"center", color:MUTED, fontSize:12, marginTop:16 }}>
            Pas encore de compte ?{" "}
            <NavLink to="/register" style={{ color:GREEN, fontWeight:600, textDecoration:"none" }}>Créer un compte →</NavLink>
          </p>

          {/* Security badge */}
          <div style={{ marginTop:20, background:BG, border:`1px solid ${BORDER}`, borderRadius:9, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
            <LuShieldCheck size={15} style={{ color:GREEN, flexShrink:0 }} />
            <p style={{ color:MUTED, fontSize:11, margin:0 }}>Authentification sécurisée JWT · ISO 9001:2015</p>
          </div>

          <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        </div>

        {/* ── Right panel: demo accounts ────────────────── */}
        <div style={{ flex:1, minWidth:0, background:SURFACE, borderRadius:18, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>

          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ display:"inline-block", width:3, height:16, background:GREEN, borderRadius:99 }} />
            <p style={{ color:MUTED, fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, margin:0 }}>Comptes de démonstration</p>
          </div>
          <p style={{ color:MUTED, fontSize:12, margin:"0 0 18px" }}>Cliquez pour remplir automatiquement le formulaire</p>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {DEMO_ACCOUNTS.map((acc) => {
              const sel = email === acc.email;
              return (
                <button key={acc.email} type="button" onClick={()=>fillDemo(acc)}
                  style={{
                    width:"100%", textAlign:"left", padding:"13px 14px", borderRadius:12, cursor:"pointer",
                    background: sel ? acc.bg : BG,
                    border: `1px solid ${sel ? acc.accent+"55" : BORDER}`,
                    boxShadow: sel ? `0 0 0 3px ${acc.ring}` : "none",
                    transition:"all 0.15s", fontFamily:"inherit",
                  }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:9, background: sel ? acc.accent+"22" : "#eef3fa", display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${sel?acc.accent+"44":BORDER}` }}>
                        <LuUser size={15} style={{ color: sel ? acc.accent : NAVY }} />
                      </div>
                      <div>
                        <p style={{ margin:0, fontWeight:700, fontSize:13, color: sel ? acc.accent : NAVY, letterSpacing:-0.2 }}>{acc.role}</p>
                        <p style={{ margin:0, color:MUTED, fontSize:11, fontFamily:"monospace" }}>{acc.email}</p>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ margin:0, color:MUTED, fontSize:10 }}>Mot de passe</p>
                      <p style={{ margin:0, color:NAVY, fontSize:12, fontFamily:"monospace", fontWeight:600 }}>{acc.password}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Permissions grid */}
          <div style={{ marginTop:20, paddingTop:20, borderTop:`1px solid ${BORDER}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <span style={{ display:"inline-block", width:3, height:14, background:GREEN, borderRadius:99 }} />
              <p style={{ color:MUTED, fontSize:10, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, margin:0 }}>Permissions ISO par rôle</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { label:"Créer document",    roles:["Admin GED","Responsable Qualité","Rédacteur"] },
                { label:"Valider document",  roles:["Admin GED","Responsable Qualité","Validateur"] },
                { label:"Archiver",          roles:["Admin GED","Responsable Qualité"] },
                { label:"Gérer utilisateurs",roles:["Admin GED"] },
              ].map(({label,roles}) => (
                <div key={label} style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:9, padding:"10px 12px" }}>
                  <p style={{ color:NAVY, fontSize:10, fontWeight:700, marginBottom:3, letterSpacing:-0.1 }}>{label}</p>
                  <p style={{ color:MUTED, fontSize:10, margin:0, lineHeight:1.5 }}>{roles.join(", ")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
