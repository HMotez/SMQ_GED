// ============================================================
// CreateDocument.jsx — ACTIA ES · Dark Premium Design
// Custom dropdowns — no white native select popups
// ============================================================
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import AppSidebar from "../components/AppSidebar";
import {
  LuCircleAlert, LuCircleCheckBig, LuLock, LuUpload,
  LuFileText, LuHash, LuTag, LuArrowRight, LuArrowLeft,
  LuPlus, LuChevronDown, LuCheck, LuFolder, LuFilePlus,
} from "react-icons/lu";
import { API } from "../config";

/* ════════════════════════════════════════════════════════════
   CUSTOM DARK DROPDOWN
   Renders a fully-styled dark glass dropdown instead of
   the browser-native <select> which always shows white.
════════════════════════════════════════════════════════════ */
function DarkSelect({ options = [], value, onChange, placeholder = "— Sélectionner —", disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div ref={ref} className="relative w-full" style={{ zIndex: open ? 999 : "auto" }}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all text-left"
        style={{
          background:   disabled ? "rgba(255,255,255,0.02)" : open ? "rgba(74,184,63,0.08)" : "rgba(255,255,255,0.04)",
          borderColor:  disabled ? "rgba(255,255,255,0.06)" : open ? "rgba(74,184,63,0.45)" : "rgba(255,255,255,0.10)",
          color:        disabled ? "rgba(168,191,212,0.3)" : selected ? "rgba(255,255,255,0.9)" : "rgba(168,191,212,0.45)",
          cursor:       disabled ? "not-allowed" : "pointer",
          boxShadow:    open ? "0 0 0 3px rgba(74,184,63,0.12)" : "none",
          fontFamily:   "inherit",
        }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <LuChevronDown
          size={15}
          style={{
            color: "rgba(168,191,212,0.4)",
            flexShrink: 0,
            marginLeft: 8,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden"
          style={{
            background:   "rgba(13,31,48,0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border:       "1px solid rgba(255,255,255,0.12)",
            boxShadow:    "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(74,184,63,0.08)",
            maxHeight:    260,
            overflowY:    "auto",
            zIndex:       9999,
          }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-all border-none"
                style={{
                  background:   isSelected ? "rgba(74,184,63,0.12)" : "transparent",
                  color:        isSelected ? "#4ab83f" : "rgba(168,191,212,0.85)",
                  fontWeight:   isSelected ? 600 : 400,
                  fontFamily:   "inherit",
                  cursor:       "pointer",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.95)"; }}}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(168,191,212,0.85)"; }}}
              >
                <span>{opt.label}</span>
                {isSelected && <LuCheck size={14} style={{ color: "#4ab83f", flexShrink: 0 }} />}
              </button>
            );
          })}
          {options.length === 0 && (
            <div className="px-4 py-3 text-sm" style={{ color: "rgba(168,191,212,0.35)" }}>
              Aucune option disponible
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Dark-themed Label ────────────────────────────────────── */
function Label({ children }) {
  return (
    <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5"
      style={{ color: "rgba(168,191,212,0.6)" }}>
      {children}
    </label>
  );
}

/* ── Dark-themed Input ────────────────────────────────────── */
function I(props) {
  return (
    <input
      {...props}
      className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.10)",
        color: "rgba(255,255,255,0.85)",
        fontFamily: "inherit",
        ...(props.style || {}),
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "rgba(74,184,63,0.5)";
        e.target.style.boxShadow   = "0 0 0 3px rgba(74,184,63,0.12)";
        e.target.style.background  = "rgba(74,184,63,0.06)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "rgba(255,255,255,0.10)";
        e.target.style.boxShadow   = "none";
        e.target.style.background  = "rgba(255,255,255,0.04)";
        props.onBlur?.(e);
      }}
    />
  );
}

/* ── Field wrapper ────────────────────────────────────────── */
function F({ label, children }) {
  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* ── Section title ────────────────────────────────────────── */
function STitle({ num, title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg border"
        style={{ background:"rgba(74,184,63,0.12)", color:"#4ab83f", borderColor:"rgba(74,184,63,0.3)" }}>
        {num}
      </span>
      <h2 className="m-0 text-lg font-bold text-white tracking-tight">{title}</h2>
      <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,0.06)" }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function CreateDocument() {
  const { can, currentUser } = useUser();

  const [types,  setTypes]  = useState([]);
  const [level1, setLevel1] = useState([]);
  const [level2, setLevel2] = useState([]);
  const [level3, setLevel3] = useState([]);
  const [level4, setLevel4] = useState([]);

  const [selectedL1, setSelectedL1] = useState("");
  const [selectedL2, setSelectedL2] = useState("");
  const [selectedL3, setSelectedL3] = useState("");
  const [selectedL4, setSelectedL4] = useState("");

  const [form, setForm] = useState({
    title:"", responsible:"", nextReviewDate:"",
    typeCode:"", origin:"INTERNE", context:"", keywords:"",
  });

  const [file,           setFile]           = useState(null);
  const [sharepointLink, setSharepointLink] = useState("");
  const [message, setMessage] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(1);

  useEffect(() => {
    Promise.all([axios.get(`${API}/types`), axios.get(`${API}/folders/level/1`)])
      .then(([t, l1]) => { setTypes(t.data); setLevel1(l1.data); })
      .catch(() => setError("Erreur lors du chargement des données."));
  }, []);

  useEffect(() => {
    setSelectedL2(""); setSelectedL3(""); setSelectedL4(""); setLevel2([]); setLevel3([]); setLevel4([]);
    if (!selectedL1) return;
    axios.get(`${API}/folders/children/${selectedL1}`).then(r => setLevel2(r.data));
  }, [selectedL1]);

  useEffect(() => {
    setSelectedL3(""); setSelectedL4(""); setLevel3([]); setLevel4([]);
    if (!selectedL2) return;
    axios.get(`${API}/folders/children/${selectedL2}`).then(r => setLevel3(r.data));
  }, [selectedL2]);

  useEffect(() => {
    setSelectedL4(""); setLevel4([]);
    if (!selectedL3) return;
    axios.get(`${API}/folders/children/${selectedL3}`).then(r => setLevel4(r.data));
  }, [selectedL3]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const getFolderId  = () => selectedL4 || selectedL3 || selectedL2 || selectedL1 || "";
  const getProcessId = () => selectedL4 || selectedL3 || selectedL2 || "";

  const getPreview = () => {
    if (!form.typeCode) return null;
    const slug = form.title
      ? (form.title
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9\s]/g, "")
          .trim().split(/\s+/)[0]
          .replace(/^(.)/, c => c.toUpperCase()) || "Doc")
      : "Doc";
    return `${form.typeCode.toUpperCase()}XXXX_${slug}_-`;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setMessage("");

    const missing = [];
    if (!form.title)          missing.push("Titre");
    if (!form.responsible)    missing.push("Responsable");
    if (!form.nextReviewDate) missing.push("Date de revue");
    if (!form.typeCode)       missing.push("Type");
    if (!selectedL1)          missing.push("Processus stratégique");
    if (!selectedL2)          missing.push("Processus principal");
    if (!file)                missing.push("Fichier");
    if (missing.length)       { setError(`Champs obligatoires : ${missing.join(" · ")}`); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title",          form.title);
      fd.append("responsible",    form.responsible);
      fd.append("nextReviewDate", form.nextReviewDate);
      fd.append("typeCode",       form.typeCode);
      fd.append("folderId",       getFolderId());
      fd.append("processId",      getProcessId());
      fd.append("origin",         form.origin);
      if (form.context)   fd.append("context",         form.context);
      if (form.keywords)  fd.append("keywords",        form.keywords);
      if (sharepointLink) fd.append("sharepoint_link", sharepointLink.trim());
      fd.append("userId", currentUser?.id);
      fd.append("file",   file);

      const res = await axios.post(`${API}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage(res.data.document.doc_code);
      setForm({ title:"", responsible:"", nextReviewDate:"", typeCode:"", origin:"INTERNE", context:"", keywords:"" });
      setFile(null); setSharepointLink(""); setSelectedL1(""); setSelectedL2(""); setSelectedL3(""); setStep(1);
      document.getElementById("fileInput").value = "";
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const preview = getPreview();

  /* ── Sidebar step nav ───────────────────────────────────── */
  const STEPS = [
    { num: "01", icon: LuFileText, label: "Informations",   n: 1 },
    { num: "02", icon: LuFolder,   label: "Classification", n: 2 },
    { num: "03", icon: LuUpload,   label: "Fichier",        n: 3 },
  ];

  const sidebarMiddle = (
    <div className="px-3 pt-2 pb-4 flex flex-col gap-1.5">
      <p className="text-[10px] uppercase tracking-[1px] font-bold px-1 mb-2"
        style={{ color:"rgba(168,191,212,0.45)" }}>Étapes de création</p>
      {STEPS.map(({ num, icon: StepIcon, label, n }) => (
        <button key={n} type="button" onClick={() => setStep(n)}
          className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-sm transition-all border-l-4 border-none
            ${step===n
              ? "bg-[rgba(74,184,63,0.12)] text-[#4ab83f] border-l-[#4ab83f] font-semibold"
              : "text-[rgba(168,191,212,0.7)] border-l-transparent hover:bg-[rgba(255,255,255,0.04)]"
            }`}
          style={{ fontFamily:"inherit", cursor:"pointer" }}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
            ${step===n
              ? "border-[#4ab83f] bg-[rgba(74,184,63,0.18)] text-[#4ab83f]"
              : "border-[rgba(255,255,255,0.12)] text-[rgba(168,191,212,0.5)]"
            }`}>{num}</span>
          <div className="flex items-center gap-2">
            <StepIcon size={14} className="text-[rgba(168,191,212,0.5)]" />
            <span>{label}</span>
          </div>
        </button>
      ))}
    </div>
  );

  const sidebarBottom = (
    <>
      {preview && (
        <div className="rounded-xl px-4 py-3.5 border mb-4"
          style={{ background:"rgba(74,184,63,0.08)", borderColor:"rgba(74,184,63,0.25)" }}>
          <p className="text-[10px] uppercase tracking-[1px] mb-1.5 font-semibold"
            style={{ color:"rgba(168,191,212,0.5)" }}>Référence prévisionnelle</p>
          <p className="font-mono font-bold text-lg tracking-wide m-0 text-[#4ab83f]">{preview}</p>
        </div>
      )}
      <div className="rounded-xl px-4 py-3.5 border"
        style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.09)" }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs" style={{ color:"rgba(168,191,212,0.5)" }}>Statut</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ background:"rgba(251,146,60,0.12)", color:"#fb923c", border:"1px solid rgba(251,146,60,0.3)" }}>
            Brouillon
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color:"rgba(168,191,212,0.5)" }}>Version</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ background:"rgba(74,184,63,0.12)", color:"#4ab83f", border:"1px solid rgba(74,184,63,0.3)" }}>
            —
          </span>
        </div>
      </div>
    </>
  );

  /* ── Option helpers ─────────────────────────────────────── */
  const typeOptions = types.map(t => ({ value: t.code, label: `${t.code} — ${t.label}` }));

  const originOptions = [
    { value:"INTERNE", label:"Interne" },
    { value:"EXTERNE", label:"Externe" },
  ];

  const contextOptions = [
    { value:"",                label:"— Optionnel —" },
    { value:"PROCESSUS",       label:"Processus" },
    { value:"PROJET",          label:"Projet" },
    { value:"SYSTEME_QUALITE", label:"Système Qualité" },
    { value:"SUPPORT",         label:"Support" },
  ];

  const level1Options = level1.map(f => ({ value: String(f.id), label: f.name }));
  const level2Options = level2.map(f => ({ value: String(f.id), label: f.name }));
  const level3Options = level3.map(f => ({ value: String(f.id), label: f.name }));

  return (
    <div className="min-h-screen flex"
      style={{ background:"linear-gradient(145deg, #0a1420 0%, #0f1e30 35%, #1a2f4a 70%, #1e3a55 100%)" }}>

      <AppSidebar user={currentUser} middleContent={sidebarMiddle} bottomContent={sidebarBottom} />

      <main className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b"
          style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(20px)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 1px 0 rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"linear-gradient(135deg,rgba(74,184,63,0.18),rgba(74,184,63,0.08))", border:"1.5px solid rgba(74,184,63,0.3)", boxShadow:"0 4px 14px rgba(74,184,63,0.15)" }}>
              <LuFilePlus size={19} style={{ color:"#4ab83f" }} />
            </div>
            <div>
              <h1 className="m-0 font-extrabold text-white" style={{ fontSize:21, letterSpacing:"-0.022em", lineHeight:1.2 }}>Nouveau Document</h1>
              <p className="m-0 text-xs mt-0.5" style={{ color:"rgba(168,191,212,0.48)" }}>
                Création
              </p>
            </div>
          </div>
          {/* Step progress dots */}
          <div className="flex gap-2 items-center">
            {[1,2,3].map(n => (
              <button key={n} type="button" onClick={() => setStep(n)}
                className={`h-1.5 rounded-full transition-all duration-200 border-none cursor-pointer
                  ${step===n ? "w-8 bg-[#4ab83f]" : "w-1.5 bg-[rgba(255,255,255,0.12)]"}`} />
            ))}
          </div>
        </header>

        <div className="flex-1 px-8 py-6 overflow-y-auto">

          {!can("document:create") && (
            <div className="rounded-2xl p-8 text-center border mb-6"
              style={{ background:"rgba(248,113,113,0.08)", borderColor:"rgba(248,113,113,0.25)" }}>
              <LuLock size={40} className="mx-auto mb-4" style={{ color:"#f87171" }} />
              <p className="text-lg font-bold text-[#f87171] m-0 mb-2">Accès refusé</p>
              <p style={{ color:"rgba(168,191,212,0.7)" }}>
                Seuls les rôles Ing. Qualité et Admin peuvent créer des documents.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl px-5 py-3.5 mb-6 border"
              style={{ background:"rgba(248,113,113,0.08)", borderColor:"rgba(248,113,113,0.25)", color:"#f87171" }}>
              <LuCircleAlert size={20} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-center gap-3 rounded-xl px-5 py-3.5 mb-6 border"
              style={{ background:"rgba(74,184,63,0.12)", borderColor:"rgba(74,184,63,0.3)", color:"#4ab83f" }}>
              <LuCircleCheckBig size={22} className="flex-shrink-0" />
              <div>
                <p className="m-0 font-semibold text-base">Document créé avec succès</p>
                <p className="m-0 mt-1 font-mono text-lg tracking-wide">{message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}
            style={{
              opacity: can("document:create") ? 1 : 0.35,
              pointerEvents: can("document:create") ? "auto" : "none",
              maxWidth: 720,
            }}>

            {/* ── STEP 1 ──────────────────────────────────── */}
            {step === 1 && (
              <div>
                <STitle num="01" title="Informations du document" />
                <div className="rounded-2xl border p-6 mb-6"
                  style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)" }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div className="md:col-span-2">
                      <F label="Titre du document *">
                        <I name="title" value={form.title} onChange={handleChange}
                          placeholder="Ex : Procédure de contrôle qualité" />
                      </F>
                    </div>

                    <F label="Responsable *">
                      <I name="responsible" value={form.responsible} onChange={handleChange}
                        placeholder="Nom et prénom" />
                    </F>

                    <F label="Prochaine revue *">
                      <I type="date" name="nextReviewDate" value={form.nextReviewDate} onChange={handleChange} />
                    </F>

                    <F label="Type documentaire *">
                      <DarkSelect
                        options={typeOptions}
                        value={form.typeCode}
                        onChange={v => setForm(f => ({ ...f, typeCode: v }))}
                        placeholder="— Sélectionner un type —"
                      />
                    </F>

                    <F label="Origine">
                      <DarkSelect
                        options={originOptions}
                        value={form.origin}
                        onChange={v => setForm(f => ({ ...f, origin: v }))}
                      />
                    </F>

                    <F label="Contexte">
                      <DarkSelect
                        options={contextOptions}
                        value={form.context}
                        onChange={v => setForm(f => ({ ...f, context: v }))}
                        placeholder="— Optionnel —"
                      />
                    </F>

                    <div className="md:col-span-2">
                      <F label="Mots-clés (séparés par virgule)">
                        <div className="relative">
                          <LuTag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                            style={{ color:"rgba(168,191,212,0.5)" }} />
                          <I name="keywords" value={form.keywords} onChange={handleChange}
                            placeholder="iso9001, audit, conception, ..."
                            style={{ paddingLeft:"2.5rem" }} />
                        </div>
                      </F>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                    style={{ background:"linear-gradient(135deg,#4ab83f,#3da333)", boxShadow:"0 4px 16px rgba(74,184,63,0.35)", fontFamily:"inherit" }}>
                    Suivant : Classification <LuArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 ──────────────────────────────────── */}
            {step === 2 && (
              <div>
                <STitle num="02" title="Classification ACTIA ES" />
                <div className="rounded-2xl border p-6 mb-6"
                  style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)" }}>
                  <div className="flex flex-col gap-5">

                    <F label="Processus stratégique *">
                      <DarkSelect
                        options={level1Options}
                        value={selectedL1}
                        onChange={setSelectedL1}
                        placeholder="— Sélectionner —"
                      />
                    </F>

                    <F label="Processus principal *">
                      <DarkSelect
                        options={level2Options}
                        value={selectedL2}
                        onChange={setSelectedL2}
                        placeholder={selectedL1 ? "— Sélectionner —" : "Sélectionnez d'abord un processus stratégique"}
                        disabled={!selectedL1}
                      />
                    </F>

                    <F label="Sous-processus *">
                      <DarkSelect
                        options={level3Options}
                        value={selectedL3}
                        onChange={setSelectedL3}
                        placeholder={!selectedL2 ? "Sélectionnez d'abord un processus principal" : level3.length === 0 ? "Aucun sous-processus disponible" : "— Sélectionner —"}
                        disabled={!selectedL2 || level3.length === 0}
                      />
                    </F>

                    {level4.length > 0 && (
                      <F label="Dossier document *">
                        <DarkSelect
                          options={level4.map(f => ({ value: String(f.id), label: f.name }))}
                          value={selectedL4}
                          onChange={setSelectedL4}
                          placeholder="— Sélectionner —"
                        />
                      </F>
                    )}

                    {preview && (
                      <div className="mt-3 p-5 rounded-xl flex items-center gap-4 border"
                        style={{ background:"rgba(74,184,63,0.07)", borderColor:"rgba(74,184,63,0.3)" }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center border"
                          style={{ background:"rgba(74,184,63,0.15)", borderColor:"rgba(74,184,63,0.35)" }}>
                          <LuHash size={22} style={{ color:"#4ab83f" }} />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider mb-1" style={{ color:"rgba(168,191,212,0.5)" }}>
                            Référence générée
                          </p>
                          <p className="font-mono font-bold text-2xl tracking-wider m-0 text-[#4ab83f]">{preview}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer border-none"
                    style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.12)", color:"rgba(168,191,212,0.8)", fontFamily:"inherit" }}>
                    <LuArrowLeft size={15} /> Retour
                  </button>
                  <button type="button" onClick={() => setStep(3)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                    style={{ background:"linear-gradient(135deg,#4ab83f,#3da333)", boxShadow:"0 4px 16px rgba(74,184,63,0.35)", fontFamily:"inherit" }}>
                    Suivant : Fichier <LuArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3 ──────────────────────────────────── */}
            {step === 3 && (
              <div>
                <STitle num="03" title="Upload du fichier" />

                <label htmlFor="fileInput"
                  className={`flex flex-col items-center justify-center h-44 rounded-2xl mb-6 cursor-pointer border-2 border-dashed transition-all
                    ${file
                      ? "border-[#4ab83f] bg-[rgba(74,184,63,0.06)]"
                      : "border-[rgba(255,255,255,0.12)] hover:border-[rgba(74,184,63,0.4)] hover:bg-[rgba(74,184,63,0.03)]"
                    }`}>
                  {file ? (
                    <div className="text-center px-6">
                      <LuFileText size={44} className="mx-auto mb-3" style={{ color:"#4ab83f" }} />
                      <p className="text-base font-semibold m-0 text-white">{file.name}</p>
                      <p className="text-xs mt-1.5" style={{ color:"rgba(168,191,212,0.6)" }}>
                        {(file.size/1024/1024).toFixed(2)} Mo · Cliquer pour changer
                      </p>
                    </div>
                  ) : (
                    <div className="text-center px-6">
                      <LuUpload size={44} className="mx-auto mb-3" style={{ color:"rgba(168,191,212,0.4)" }} />
                      <p className="text-base font-medium m-0 text-white">Déposer ou cliquer pour uploader</p>
                      <p className="text-xs mt-1.5" style={{ color:"rgba(168,191,212,0.55)" }}>PDF, Word, Excel · Max 50 Mo</p>
                    </div>
                  )}
                  <input id="fileInput" type="file" accept=".pdf,.doc,.docx,.xlsx,.xls"
                    onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
                </label>

                {/* SharePoint link */}
                <div className="mb-6">
                  <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5"
                    style={{ color:"rgba(168,191,212,0.6)" }}>
                    Lien SharePoint <span style={{ color:"rgba(168,191,212,0.35)", fontWeight:400, textTransform:"none" }}>(optionnel)</span>
                  </label>
                  <input
                    type="url"
                    value={sharepointLink}
                    onChange={e => setSharepointLink(e.target.value)}
                    placeholder="https://mohetn.sharepoint.com/..."
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                    style={{ background:"rgba(255,255,255,0.04)", borderColor: sharepointLink ? "rgba(74,184,63,0.45)" : "rgba(255,255,255,0.10)", color:"rgba(255,255,255,0.85)", fontFamily:"inherit" }}
                  />
                </div>

                {/* Summary */}
                <div className="rounded-2xl border p-6 mb-6"
                  style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)" }}>
                  <p className="text-xs uppercase tracking-wider font-semibold mb-4"
                    style={{ color:"rgba(168,191,212,0.55)" }}>Récapitulatif</p>
                  <div className="space-y-3">
                    {[
                      ["Titre",    form.title    || "—"],
                      ["Type",     form.typeCode || "—"],
                      ["Origine",  form.origin],
                      ["Référence",preview       || "—"],
                      ["Fichier",  file?.name    || "—"],
                    ].map(([label, value], i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b last:border-0"
                        style={{ borderColor:"rgba(255,255,255,0.06)" }}>
                        <span style={{ color:"rgba(168,191,212,0.7)" }}>{label}</span>
                        <span className="font-medium text-white">
                          {label === "Référence" && preview
                            ? <span className="font-mono text-[#4ab83f]">{value}</span>
                            : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border-none"
                    style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(168,191,212,0.8)", fontFamily:"inherit" }}>
                    <LuArrowLeft size={15} /> Retour
                  </button>
                  <button type="submit" disabled={loading}
                    className={`flex-1 py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all border-none
                      ${loading ? "cursor-not-allowed" : "cursor-pointer"}`}
                    style={{
                      background: loading ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#4ab83f,#3da333)",
                      color:      loading ? "rgba(168,191,212,0.5)" : "white",
                      boxShadow:  loading ? "none" : "0 4px 16px rgba(74,184,63,0.35)",
                      fontFamily: "inherit",
                    }}>
                    {loading ? "Enregistrement en cours…" : <><LuPlus size={16} /> Créer le document</>}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator { filter: brightness(0) invert(0.7); }
        input[type="date"] { color-scheme: dark; }

        /* Custom scrollbar for dropdown lists */
        .dark-scroll::-webkit-scrollbar { width: 5px; }
        .dark-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        .dark-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
      `}</style>
    </div>
  );
}