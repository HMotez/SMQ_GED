import { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

const API = "http://localhost:4000/api";

export default function CreateDocument() {
  const [types, setTypes] = useState([]);
  const [level1, setLevel1] = useState([]);
  const [level2, setLevel2] = useState([]);
  const [level3, setLevel3] = useState([]);

  const [selectedL1, setSelectedL1] = useState("");
  const [selectedL2, setSelectedL2] = useState("");
  const [selectedL3, setSelectedL3] = useState("");

  const [form, setForm] = useState({
    title: "",
    responsible: "",
    nextReviewDate: "",
    typeCode: "",
    origin: "INTERNE",
    context: "",
    keywords: "",
    userId: "1",
  });

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/types`),
      axios.get(`${API}/folders/level/1`),
    ])
      .then(([t, l1]) => {
        setTypes(t.data);
        setLevel1(l1.data);
      })
      .catch(() => setError("Erreur chargement données."));
  }, []);

  useEffect(() => {
    setSelectedL2("");
    setSelectedL3("");
    setLevel2([]);
    setLevel3([]);

    if (!selectedL1) return;

    axios
      .get(`${API}/folders/children/${selectedL1}`)
      .then((r) => setLevel2(r.data));
  }, [selectedL1]);

  useEffect(() => {
    setSelectedL3("");
    setLevel3([]);

    if (!selectedL2) return;

    axios
      .get(`${API}/folders/children/${selectedL2}`)
      .then((r) => setLevel3(r.data));
  }, [selectedL2]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const getFolderId = () => selectedL3 || selectedL2 || selectedL1 || "";
  const getProcessId = () => selectedL3 || selectedL2 || "";

  const getSelectedProcess = () => {
    const id = parseInt(getProcessId());
    return [...level3, ...level2].find((p) => p.id === id);
  };

  const getPreview = () => {
    const p = getSelectedProcess();
    return form.typeCode && p
      ? `${form.typeCode.toUpperCase()}-${p.code}-XXXX`
      : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const missing = [];
    if (!form.title) missing.push("Titre");
    if (!form.responsible) missing.push("Responsable");
    if (!form.nextReviewDate) missing.push("Date de revue");
    if (!form.typeCode) missing.push("Type");
    if (!selectedL1) missing.push("Processus stratégique");
    if (!selectedL2) missing.push("Processus principal");
    if (!file) missing.push("Fichier");

    if (missing.length > 0) {
      setError(`Champs manquants : ${missing.join(" · ")}`);
      return;
    }

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

      if (form.context) fd.append("context", form.context);
      if (form.keywords) fd.append("keywords", form.keywords);

      fd.append("userId", form.userId);
      fd.append("file", file);

      const res = await axios.post(`${API}/documents`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.document.doc_code);

      setForm({
        title: "",
        responsible: "",
        nextReviewDate: "",
        typeCode: "",
        origin: "INTERNE",
        context: "",
        keywords: "",
        userId: "1",
      });

      setFile(null);
      setSelectedL1("");
      setSelectedL2("");
      setSelectedL3("");
      setStep(1);

      document.getElementById("fileInput").value = "";
    } catch (err) {
      setError(err.response?.data?.error || "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        color: "#e6edf3",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        display: "flex",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: 220,
          background: "#010409",
          borderRight: "1px solid #21262d",
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
        className="hidden lg:flex"
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "#1f6feb",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>
              GED
            </span>
          </div>
          <div>
            <p
              style={{
                color: "#e6edf3",
                fontWeight: 700,
                fontSize: 13,
                margin: 0,
              }}
            >
              ACTIA ES
            </p>
            <p style={{ color: "#484f58", fontSize: 11, margin: 0 }}>
              Documentation
            </p>
          </div>
        </div>

        {/* NAVIGATION FIXED */}
        {[
          ["📄", "Nouveau document", "/"],
          ["📋", "Liste documents", "/list"],
        ].map(([icon, label, href]) => (
          <NavLink
            key={href}
            to={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 8,
              marginBottom: 4,
              textDecoration: "none",
              background: href === "/" ? "#1f6feb22" : "transparent",
              color: href === "/" ? "#58a6ff" : "#484f58",
              fontWeight: href === "/" ? 600 : 400,
              fontSize: 13,
            }}
          >
            {icon} {label}
          </NavLink>
        ))}

        {/* Steps nav */}
        {[
          ["1", "Informations", 1],
          ["2", "Classification", 2],
          ["3", "Fichier", 3],
        ].map(([num, label, n]) => (
          <button
            key={n}
            onClick={() => setStep(n)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 8,
              marginBottom: 4,
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              background: step === n ? "#1f6feb22" : "transparent",
              color: step === n ? "#58a6ff" : "#484f58",
              fontWeight: step === n ? 600 : 400,
              fontSize: 13,
              transition: "all 0.15s",
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: `1.5px solid ${step === n ? "#58a6ff" : "#30363d"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                color: step === n ? "#58a6ff" : "#484f58",
              }}
            >
              {num}
            </span>
            {label}
          </button>
        ))}

        <div style={{ marginTop: "auto" }}>
          {getPreview() && (
            <div
              style={{
                background: "#1f6feb11",
                border: "1px solid #1f6feb33",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 12,
              }}
            >
              <p
                style={{
                  color: "#484f58",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                Référence
              </p>
              <p
                style={{
                  color: "#58a6ff",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: 13,
                  wordBreak: "break-all",
                  margin: 0,
                }}
              >
                {getPreview()}
              </p>
            </div>
          )}

          <div
            style={{
              background: "#161b22",
              border: "1px solid #21262d",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span style={{ color: "#484f58", fontSize: 11 }}>Statut</span>
              <span
                style={{
                  background: "#3d2b00",
                  color: "#d29922",
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 99,
                  fontWeight: 600,
                  border: "1px solid #6e5c1e",
                }}
              >
                Brouillon
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#484f58", fontSize: 11 }}>Version</span>
              <span
                style={{
                  background: "#0d419d22",
                  color: "#58a6ff",
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 99,
                  fontWeight: 600,
                  border: "1px solid #1f6feb44",
                }}
              >
                —
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 40px",
            borderBottom: "1px solid #21262d",
            background: "#010409",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              Nouveau Document
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: "#484f58", marginTop: 2 }}>
              EF01 · EF02 · EF03 · EF04
            </p>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setStep(n)}
                style={{
                  height: 6,
                  width: step === n ? 24 : 6,
                  borderRadius: 99,
                  border: "none",
                  cursor: "pointer",
                  background: step === n ? "#1f6feb" : "#21262d",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        </header>

        <div style={{ flex: 1, padding: "36px 40px", overflowY: "auto" }}>
          {error && (
            <div
              style={{
                background: "#490202",
                border: "1px solid #6e2020",
                color: "#ff7b72",
                padding: "12px 16px",
                borderRadius: 10,
                marginBottom: 24,
                fontSize: 13,
                display: "flex",
                gap: 8,
              }}
            >
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div
              style={{
                background: "#04260f",
                border: "1px solid #196c2e",
                color: "#3fb950",
                padding: "12px 16px",
                borderRadius: 10,
                marginBottom: 24,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 18 }}>✓</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  Document créé avec succès
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#2ea043",
                  }}
                >
                  {message}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ maxWidth: 680 }}>
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
                          <option key={t.id} value={t.code}>
                            {t.code} — {t.label}
                          </option>
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

            {step === 2 && (
              <div>
                <STitle num="02" title="Classification ACTIA ES" />
                <Card>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <F label="Processus stratégique *">
                      <S value={selectedL1} onChange={(e) => setSelectedL1(e.target.value)}>
                        <option value="">-- Choisir --</option>
                        {level1.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </S>
                    </F>

                    <F label="Processus principal *">
                      <S value={selectedL2} disabled={!selectedL1} onChange={(e) => setSelectedL2(e.target.value)}>
                        <option value="">-- Choisir --</option>
                        {level2.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </S>
                    </F>

                    <F label="Sous-processus (optionnel)">
                      <S value={selectedL3} disabled={!selectedL2 || !level3.length} onChange={(e) => setSelectedL3(e.target.value)}>
                        <option value="">-- Choisir --</option>
                        {level3.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </S>
                    </F>

                    {getPreview() && (
                      <div
                        style={{
                          background: "#1f6feb11",
                          border: "1px solid #1f6feb33",
                          borderRadius: 10,
                          padding: "14px 18px",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: "#1f6feb22",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ color: "#58a6ff", fontWeight: 900, fontSize: 18 }}>#</span>
                        </div>

                        <div>
                          <p
                            style={{
                              color: "#484f58",
                              fontSize: 10,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                              margin: "0 0 2px",
                            }}
                          >
                            Référence générée
                          </p>
                          <p
                            style={{
                              color: "#58a6ff",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: 22,
                              letterSpacing: 2,
                              margin: 0,
                            }}
                          >
                            {getPreview()}
                          </p>
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

            {step === 3 && (
              <div>
                <STitle num="03" title="Upload du fichier" />

                <label
                  htmlFor="fileInput"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 160,
                    borderRadius: 12,
                    border: `2px dashed ${file ? "#2ea043" : "#30363d"}`,
                    background: file ? "#04260f" : "#0d1117",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    marginBottom: 20,
                  }}
                >
                  {file ? (
                    <div style={{ textAlign: "center", padding: "0 16px" }}>
                      <p style={{ fontSize: 36, margin: "0 0 6px" }}>📄</p>
                      <p style={{ color: "#3fb950", fontWeight: 600, fontSize: 13, margin: 0 }}>{file.name}</p>
                      <p style={{ color: "#484f58", fontSize: 11, marginTop: 4 }}>
                        {(file.size / 1024).toFixed(1)} KB · Cliquer pour changer
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "0 16px" }}>
                      <p style={{ fontSize: 40, margin: "0 0 8px", opacity: 0.3 }}>📁</p>
                      <p style={{ color: "#8b949e", fontWeight: 500, fontSize: 13, margin: 0 }}>
                        Cliquer ou déposer votre fichier
                      </p>
                      <p style={{ color: "#484f58", fontSize: 11, marginTop: 4 }}>
                        PDF ou DOCX · Max 50 MB
                      </p>
                    </div>
                  )}

                  <input
                    id="fileInput"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{ display: "none" }}
                  />
                </label>

                <Card>
                  <p style={{ color: "#484f58", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
                    Récapitulatif
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      ["Titre", form.title || "—", false],
                      ["Type", form.typeCode || "—", false],
                      ["Origine", form.origin, false],
                      ["Référence", getPreview() || "—", true],
                      ["Statut", "Brouillon", false],
                      ["Version", "—", false],
                      ["Fichier", file ? file.name : "—", false],
                    ].map(([label, value, hl]) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingBottom: 10,
                          borderBottom: "1px solid #21262d",
                        }}
                      >
                        <span style={{ color: "#484f58", fontSize: 12 }}>{label}</span>
                        <span
                          style={{
                            color: hl ? "#58a6ff" : "#8b949e",
                            fontFamily: hl ? "monospace" : "inherit",
                            fontWeight: hl ? 700 : 400,
                            fontSize: hl ? 14 : 12,
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <BtnGhost onClick={() => setStep(2)}>← Retour</BtnGhost>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "12px 24px",
                      borderRadius: 8,
                      background: loading ? "#1f4e8c" : "#1f6feb",
                      color: "#fff",
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      fontSize: 14,
                      letterSpacing: 0.5,
                    }}
                  >
                    {loading ? "Enregistrement..." : "Enregistrer le document"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      <style>{`
        button:hover { opacity: 0.9; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
        @media (max-width: 1024px) { aside { display: none !important; } }
        @media (max-width: 640px) {
          main > header { padding: 14px 20px !important; }
          main > div { padding: 20px !important; }
          [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          [style*="grid-column: 1 / -1"] { grid-column: 1 !important; }
        }
      `}</style>
    </div>
  );
}

/* COMPONENTS */
function STitle({ num, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ color: "#1f6feb", fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>
        {num}
      </span>
      <h2 style={{ margin: 0, color: "#e6edf3", fontWeight: 700, fontSize: 16 }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: 1, background: "#21262d" }} />
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "22px 24px" }}>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "#0d1117",
  border: "1px solid #30363d",
  borderRadius: 8,
  padding: "9px 14px",
  color: "#e6edf3",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

function I(props) {
  return <input style={inputStyle} {...props} />;
}

function S({ children, disabled, ...props }) {
  return (
    <select
      style={{
        ...inputStyle,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </select>
  );
}

function F({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", color: "#8b949e", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Btn({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 22px",
        background: "#21262d",
        border: "1px solid #30363d",
        borderRadius: 8,
        color: "#e6edf3",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function BtnGhost({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 22px",
        background: "transparent",
        border: "1px solid #30363d",
        borderRadius: 8,
        color: "#8b949e",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
