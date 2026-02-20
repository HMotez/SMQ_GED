// ============================================================
// CreateDocument.jsx — ACTIA ES Brand Theme
// ============================================================
import { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext";
import UserSelector from "../components/UserSelector";
import {
  LuHouse, LuFilePlus, LuFileText, LuClipboardCheck, LuArchive,
  LuCircleAlert, LuCircleCheckBig, LuLock, LuUpload,
} from "react-icons/lu";

const API = "http://localhost:4000/api";

/* ── ACTIA colors ─────────────────────────────────────────── */
const NAVY       = "#2e4a6b";
const NAVY_DARK  = "#1e3450";
const NAVY_LIGHT = "#3d5f84";
const GREEN      = "#4ab83f";
const GREEN_DARK = "#3a9a31";
const BG         = "#f0f3f6";
const BORDER     = "#dde4ec";
const MUTED      = "#6b82a0";
const SURFACE    = "#ffffff";

/* ── Nav config ───────────────────────────────────────────── */
const NAV = [
  { icon: LuHouse,           label: "Accueil",          href: "/",            end: true  },
  { icon: LuFilePlus,       label: "Nouveau document", href: "/create",      end: false },
  { icon: LuFileText,       label: "Liste documents",  href: "/list",        end: false },
  { icon: LuClipboardCheck, label: "Validations",      href: "/validations", end: false },
  { icon: LuArchive,        label: "Archivage",        href: "/archive",     end: false },
];

/* ── Small form helpers ───────────────────────────────────── */
const inputStyle = {
  width: "100%", background: BG, border: `1px solid ${BORDER}`,
  borderRadius: 8, padding: "9px 14px", color: NAVY, fontSize: 13,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

function I(props) {
  return (
    <input style={inputStyle} {...props}
      onFocus={(e) => e.target.style.borderColor = GREEN}
      onBlur={(e)  => e.target.style.borderColor = BORDER}
    />
  );
}

function S({ children, disabled, ...props }) {
  return (
    <select
      style={{ ...inputStyle, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1 }}
      disabled={disabled} {...props}>
      {children}
    </select>
  );
}

function F({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", color: MUTED, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "22px 24px", boxShadow: "0 1px 4px rgba(46,74,107,0.06)" }}>
      {children}
    </div>
  );
}

function STitle({ num, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ color: GREEN, fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>{num}</span>
      <h2 style={{ margin: 0, color: NAVY, fontWeight: 700, fontSize: 16 }}>{title}</h2>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  );
}

function Btn({ onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding: "10px 22px", background: NAVY, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(46,74,107,0.25)", transition: "all 0.15s" }}
      onMouseEnter={(e) => e.currentTarget.style.background = NAVY_LIGHT}
      onMouseLeave={(e) => e.currentTarget.style.background = NAVY}>
      {children}
    </button>
  );
}

function BtnGhost({ onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding: "10px 22px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}>
      {children}
    </button>
  );
}

/* ── Main component ───────────────────────────────────────── */
export default function CreateDocument() {
  const { can } = useUser();
  const [types, setTypes] = useState([]);
  const [level1, setLevel1] = useState([]);
  const [level2, setLevel2] = useState([]);
  const [level3, setLevel3] = useState([]);

  const [selectedL1, setSelectedL1] = useState("");
  const [selectedL2, setSelectedL2] = useState("");
  const [selectedL3, setSelectedL3] = useState("");

  const [form, setForm] = useState({
    title: "", responsible: "", nextReviewDate: "",
    typeCode: "", origin: "INTERNE", context: "", keywords: "", userId: "1",
  });

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    Promise.all([axios.get(`${API}/types`), axios.get(`${API}/folders/level/1`)])
      .then(([t, l1]) => { setTypes(t.data); setLevel1(l1.data); })
      .catch(() => setError("Erreur chargement données."));
  }, []);

  useEffect(() => {
    setSelectedL2(""); setSelectedL3(""); setLevel2([]); setLevel3([]);
    if (!selectedL1) return;
    axios.get(`${API}/folders/children/${selectedL1}`).then((r) => setLevel2(r.data));
  }, [selectedL1]);

  useEffect(() => {
    setSelectedL3(""); setLevel3([]);
    if (!selectedL2) return;
    axios.get(`${API}/folders/children/${selectedL2}`).then((r) => setLevel3(r.data));
  }, [selectedL2]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getFolderId  = () => selectedL3 || selectedL2 || selectedL1 || "";
  const getProcessId = () => selectedL3 || selectedL2 || "";

  const getSelectedProcess = () => {
    const id = parseInt(getProcessId());
    return [...level3, ...level2].find((p) => p.id === id);
  };

  const getPreview = () => {
    const p = getSelectedProcess();
    return form.typeCode && p ? `${form.typeCode.toUpperCase()}-${p.code}-XXXX` : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");

    const missing = [];
    if (!form.title)         missing.push("Titre");
    if (!form.responsible)   missing.push("Responsable");
    if (!form.nextReviewDate)missing.push("Date de revue");
    if (!form.typeCode)      missing.push("Type");
    if (!selectedL1)         missing.push("Processus stratégique");
    if (!selectedL2)         missing.push("Processus principal");
    if (!file)               missing.push("Fichier");

    if (missing.length > 0) { setError(`Champs manquants : ${missing.join(" · ")}`); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("responsible", form.responsible);
      fd.append("nextReviewDate", form.nextReviewDate);
      fd.append("typeCode", form.typeCode);
      fd.append("folderId", getFolderId());
      fd.append("processId", getProcessId());
      fd.append("origin", form.origin);
      if (form.context)  fd.append("context", form.context);
      if (form.keywords) fd.append("keywords", form.keywords);
      fd.append("userId", form.userId);
      fd.append("file", file);

      const res = await axios.post(`${API}/documents`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.document.doc_code);
      setForm({ title: "", responsible: "", nextReviewDate: "", typeCode: "", origin: "INTERNE", context: "", keywords: "", userId: "1" });
      setFile(null);
      setSelectedL1(""); setSelectedL2(""); setSelectedL3("");
      setStep(1);
      document.getElementById("fileInput").value = "";
    } catch (err) {
      setError(err.response?.data?.error || "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  const STEPS = [
    { num: "01", label: "Informations", n: 1 },
    { num: "02", label: "Classification", n: 2 },
    { num: "03", label: "Fichier", n: 3 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex" }}>

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside style={{ width: 220, background: NAVY_DARK, borderRight: `1px solid ${NAVY_LIGHT}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>

        {/* ACTIA Logo */}
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${NAVY_LIGHT}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 2, padding: 6, background: NAVY, borderRadius: 8 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[...Array(3)].map((_, j) => (
                    <div key={j} style={{ width: 4, height: 4, borderRadius: 1, background: GREEN, opacity: (i + j) % 2 === 0 ? 1 : 0.5 }} />
                  ))}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: 1.5 }}>ACTIA</span>
                <span style={{ color: GREEN, fontWeight: 700, fontSize: 10, letterSpacing: 1 }}>ES</span>
              </div>
              <p style={{ color: MUTED, fontSize: 9, margin: 0, letterSpacing: 0.5 }}>Engineering Services · GED</p>
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 10px" }}>
          {NAV.map((navItem) => {
            const NavIcon = navItem.icon;
            return (
              <NavLink key={navItem.href} to={navItem.href} end={navItem.end}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 12px", borderRadius: 8, textDecoration: "none",
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? GREEN : "#a8bfd4",
                  background: isActive ? "rgba(74,184,63,0.1)" : "transparent",
                  borderLeft: isActive ? `3px solid ${GREEN}` : "3px solid transparent",
                  transition: "all 0.15s",
                })}>
                <NavIcon size={16} style={{ flexShrink: 0 }} />
                {navItem.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Step navigator */}
        <div style={{ padding: "4px 10px 8px", borderTop: `1px solid ${NAVY_LIGHT}` }}>
          <p style={{ color: MUTED, fontSize: 9, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, margin: "10px 2px 6px" }}>Étapes</p>
          {STEPS.map(({ num, label, n }) => (
            <button key={n} type="button" onClick={() => setStep(n)}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                width: "100%", padding: "8px 12px", borderRadius: 8, marginBottom: 2,
                border: "none", cursor: "pointer", textAlign: "left",
                background: step === n ? "rgba(74,184,63,0.1)" : "transparent",
                color: step === n ? GREEN : "#a8bfd4",
                fontWeight: step === n ? 600 : 400, fontSize: 13,
                borderLeft: step === n ? `3px solid ${GREEN}` : "3px solid transparent",
                transition: "all 0.15s",
              }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                border: `1.5px solid ${step === n ? GREEN : NAVY_LIGHT}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
                color: step === n ? GREEN : "#a8bfd4",
                background: step === n ? "rgba(74,184,63,0.15)" : "transparent",
              }}>
                {num}
              </span>
              {label}
            </button>
          ))}
        </div>

        {/* Preview + status */}
        <div style={{ marginTop: "auto", padding: "12px 10px", borderTop: `1px solid ${NAVY_LIGHT}`, display: "flex", flexDirection: "column", gap: 8 }}>
          {getPreview() && (
            <div style={{ background: "rgba(74,184,63,0.1)", border: "1px solid rgba(74,184,63,0.25)", borderRadius: 10, padding: "10px 12px" }}>
              <p style={{ color: MUTED, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Référence</p>
              <p style={{ color: GREEN, fontFamily: "monospace", fontWeight: 700, fontSize: 12, wordBreak: "break-all", margin: 0 }}>{getPreview()}</p>
            </div>
          )}

          <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${NAVY_LIGHT}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: MUTED, fontSize: 11 }}>Statut</span>
              <span style={{ background: "rgba(217,119,6,0.2)", color: "#fbbf24", fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 600, border: "1px solid rgba(217,119,6,0.3)" }}>
                Brouillon
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: MUTED, fontSize: 11 }}>Version</span>
              <span style={{ background: "rgba(74,184,63,0.15)", color: GREEN, fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 600, border: "1px solid rgba(74,184,63,0.3)" }}>
                —
              </span>
            </div>
          </div>

          <UserSelector />
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <header style={{ padding: "14px 36px", background: SURFACE, borderBottom: `1px solid ${BORDER}`, boxShadow: "0 1px 4px rgba(46,74,107,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ display: "inline-block", width: 3, height: 18, background: GREEN, borderRadius: 99 }} />
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: NAVY }}>Nouveau Document</h1>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: MUTED }}>EF01 · EF02 · EF03 · EF04</p>
          </div>

          {/* Step dots */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[1, 2, 3].map((n) => (
              <button key={n} type="button" onClick={() => setStep(n)}
                style={{ height: 6, width: step === n ? 24 : 6, borderRadius: 99, border: "none", cursor: "pointer", background: step === n ? GREEN : BORDER, transition: "all 0.2s" }}
              />
            ))}
          </div>
        </header>

        <div style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>

          {/* Access denied */}
          {!can("document:create") && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: 32, textAlign: "center", marginBottom: 24 }}>
              <LuLock size={36} style={{ color: "#dc2626", marginBottom: 12 }} />
              <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 16, margin: "0 0 8px" }}>Accès refusé</p>
              <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>
                La création de documents est réservée aux rôles : Rédacteur, Responsable Qualité, Admin GED.<br />
                Sélectionnez un utilisateur autorisé dans la barre latérale.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 10, marginBottom: 24, fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <LuCircleAlert size={15} style={{ flexShrink: 0 }} /><span>{error}</span>
            </div>
          )}

          {/* Success */}
          {message && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d", padding: "12px 16px", borderRadius: 10, marginBottom: 24, fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
              <LuCircleCheckBig size={18} style={{ color: "#15803d", flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Document créé avec succès</p>
                <p style={{ margin: "2px 0 0", fontFamily: "monospace", fontSize: 12, color: GREEN_DARK }}>{message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ maxWidth: 680, opacity: can("document:create") ? 1 : 0.3, pointerEvents: can("document:create") ? "auto" : "none" }}>

            {/* ── Step 1: Informations ── */}
            {step === 1 && (
              <div>
                <STitle num="01" title="Informations document" />
                <Card>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <F label="Titre du document *">
                        <I name="title" value={form.title} onChange={handleChange} placeholder="Ex: Procédure de conception mécanique" />
                      </F>
                    </div>

                    <F label="Responsable *">
                      <I name="responsible" value={form.responsible} onChange={handleChange} placeholder="Nom du responsable" />
                    </F>

                    <F label="Date prochaine revue *">
                      <I type="date" name="nextReviewDate" value={form.nextReviewDate} onChange={handleChange} />
                    </F>

                    <F label="Type documentaire *">
                      <S name="typeCode" value={form.typeCode} onChange={handleChange}>
                        <option value="">-- Choisir --</option>
                        {types.map((t) => (
                          <option key={t.id} value={t.code}>{t.code} — {t.label}</option>
                        ))}
                      </S>
                    </F>

                    <F label="Origine">
                      <S name="origin" value={form.origin} onChange={handleChange}>
                        <option value="INTERNE">Interne</option>
                        <option value="EXTERNE">Externe</option>
                      </S>
                    </F>

                    <F label="Contexte">
                      <S name="context" value={form.context} onChange={handleChange}>
                        <option value="">— Optionnel —</option>
                        <option value="PROCESSUS">Processus</option>
                        <option value="PROJET">Projet</option>
                        <option value="SYSTEME_QUALITE">Système Qualité</option>
                        <option value="SUPPORT">Support</option>
                        <option value="ARCHIVES">Archives</option>
                      </S>
                    </F>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <F label="Mots-clés (séparés par virgule)">
                        <I name="keywords" value={form.keywords} onChange={handleChange} placeholder="qualité, iso, conception..." />
                      </F>
                    </div>
                  </div>
                </Card>

                <div style={{ marginTop: 20 }}>
                  <Btn onClick={() => setStep(2)}>Classification →</Btn>
                </div>
              </div>
            )}

            {/* ── Step 2: Classification ── */}
            {step === 2 && (
              <div>
                <STitle num="02" title="Classification ACTIA ES" />
                <Card>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <F label="Processus stratégique *">
                      <S value={selectedL1} onChange={(e) => setSelectedL1(e.target.value)}>
                        <option value="">-- Choisir --</option>
                        {level1.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </S>
                    </F>

                    <F label="Processus principal *">
                      <S value={selectedL2} disabled={!selectedL1} onChange={(e) => setSelectedL2(e.target.value)}>
                        <option value="">-- Choisir --</option>
                        {level2.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </S>
                    </F>

                    <F label="Sous-processus (optionnel)">
                      <S value={selectedL3} disabled={!selectedL2 || !level3.length} onChange={(e) => setSelectedL3(e.target.value)}>
                        <option value="">-- Choisir --</option>
                        {level3.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </S>
                    </F>

                    {getPreview() && (
                      <div style={{ background: "rgba(74,184,63,0.07)", border: "1px solid rgba(74,184,63,0.3)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, background: "rgba(74,184,63,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: GREEN, fontWeight: 900, fontSize: 18 }}>#</span>
                        </div>
                        <div>
                          <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 2px" }}>Référence générée</p>
                          <p style={{ color: GREEN, fontFamily: "monospace", fontWeight: 700, fontSize: 20, letterSpacing: 2, margin: 0 }}>{getPreview()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <BtnGhost onClick={() => setStep(1)}>← Retour</BtnGhost>
                  <Btn onClick={() => setStep(3)}>Fichier →</Btn>
                </div>
              </div>
            )}

            {/* ── Step 3: File upload ── */}
            {step === 3 && (
              <div>
                <STitle num="03" title="Upload du fichier" />

                <label htmlFor="fileInput"
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    height: 160, borderRadius: 14, marginBottom: 20, cursor: "pointer", transition: "all 0.2s",
                    border: `2px dashed ${file ? GREEN : BORDER}`,
                    background: file ? "rgba(74,184,63,0.06)" : SURFACE,
                  }}>
                  {file ? (
                    <div style={{ textAlign: "center", padding: "0 16px" }}>
                      <LuFileText size={36} style={{ color: GREEN, marginBottom: 6 }} />
                      <p style={{ color: GREEN_DARK, fontWeight: 600, fontSize: 13, margin: 0 }}>{file.name}</p>
                      <p style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>
                        {(file.size / 1024).toFixed(1)} KB · Cliquer pour changer
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "0 16px" }}>
                      <LuUpload size={40} style={{ color: MUTED, marginBottom: 8, opacity: 0.5 }} />
                      <p style={{ color: NAVY, fontWeight: 500, fontSize: 13, margin: 0 }}>Cliquer ou déposer votre fichier</p>
                      <p style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>PDF ou DOCX · Max 50 MB</p>
                    </div>
                  )}
                  <input id="fileInput" type="file" accept=".pdf,.docx"
                    onChange={(e) => setFile(e.target.files[0])} style={{ display: "none" }} />
                </label>

                <Card>
                  <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>Récapitulatif</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      ["Titre",     form.title || "—",    false],
                      ["Type",      form.typeCode || "—", false],
                      ["Origine",   form.origin,          false],
                      ["Référence", getPreview() || "—",  true ],
                      ["Statut",    "Brouillon",          false],
                      ["Version",   "—",                  false],
                      ["Fichier",   file ? file.name : "—", false],
                    ].map(([label, value, hl]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ color: MUTED, fontSize: 12 }}>{label}</span>
                        <span style={{ color: hl ? GREEN : NAVY, fontFamily: hl ? "monospace" : "inherit", fontWeight: hl ? 700 : 400, fontSize: hl ? 14 : 12 }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <BtnGhost onClick={() => setStep(2)}>← Retour</BtnGhost>
                  <button type="submit" disabled={loading}
                    style={{
                      flex: 1, padding: "12px 24px", borderRadius: 9, border: "none",
                      background: loading ? BG : GREEN, color: loading ? MUTED : "#fff",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: 700, fontSize: 14,
                      boxShadow: loading ? "none" : "0 4px 14px rgba(74,184,63,0.4)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = GREEN_DARK; }}
                    onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = GREEN; }}>
                    {loading ? "Enregistrement..." : "Enregistrer le document"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator { filter: opacity(0.5); }
        @media (max-width: 1024px) { aside { display: none !important; } }
        @media (max-width: 640px) {
          main > header { padding: 14px 20px !important; }
          main > div { padding: 20px !important; }
        }
      `}</style>
    </div>
  );
}
