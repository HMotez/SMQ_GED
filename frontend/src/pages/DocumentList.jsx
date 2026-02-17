import { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

const API = "http://localhost:4000/api";

export default function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [types, setTypes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/documents`),
      axios.get(`${API}/types`),
    ])
      .then(([docs, t]) => {
        setDocuments(docs.data);
        setTypes(t.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openDoc = async (doc) => {
    setSelected(doc);
    setVersions([]);
    try {
      const res = await axios.get(`${API}/documents/${doc.id}/versions`);
      setVersions(res.data);
    } catch {
      /* no versions */
    }
  };

  const closeDoc = () => {
    setSelected(null);
    setVersions([]);
  };

  const filtered = documents.filter((d) => {
    const matchSearch =
      !search ||
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.doc_code?.toLowerCase().includes(search.toLowerCase()) ||
      d.responsible?.toLowerCase().includes(search.toLowerCase());

    const matchType = !filterType || d.type_code === filterType;

    return matchSearch && matchType;
  });

  const statusColor = (name) => {
    const map = {
      Brouillon: { bg: "#3d2b00", color: "#d29922", border: "#6e5c1e" },
      "En validation": { bg: "#0d2d6b", color: "#58a6ff", border: "#1f4fa8" },
      Applicable: { bg: "#04260f", color: "#3fb950", border: "#196c2e" },
      Archivé: { bg: "#1a1a2e", color: "#8b949e", border: "#30363d" },
      Diffusé: { bg: "#1a3a2e", color: "#56d364", border: "#2ea043" },
      Obsolète: { bg: "#3d1a1a", color: "#ff7b72", border: "#6e2020" },
    };
    return map[name] || { bg: "#21262d", color: "#8b949e", border: "#30363d" };
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
      >
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
              background: href === "/list" ? "#1f6feb22" : "transparent",
              color: href === "/list" ? "#58a6ff" : "#484f58",
              fontWeight: href === "/list" ? 600 : 400,
              fontSize: 13,
            }}
          >
            {icon} {label}
          </NavLink>
        ))}

        <div
          style={{
            marginTop: "auto",
            background: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <p
            style={{
              color: "#484f58",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 1,
              margin: "0 0 8px",
            }}
          >
            Total
          </p>
          <p style={{ color: "#e6edf3", fontWeight: 700, fontSize: 24, margin: 0 }}>
            {documents.length}
          </p>
          <p style={{ color: "#484f58", fontSize: 11, margin: "2px 0 0" }}>
            documents
          </p>
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
              Documents
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: "#484f58", marginTop: 2 }}>
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            </p>
          </div>

          <NavLink
            to="/"
            style={{
              padding: "8px 18px",
              background: "#1f6feb",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            + Nouveau
          </NavLink>
        </header>

        <div style={{ flex: 1, padding: "28px 40px" }}>
          {/* Filters */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <input
              placeholder="🔍 Rechercher titre, référence, responsable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 240,
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 8,
                padding: "9px 14px",
                color: "#e6edf3",
                fontSize: 13,
                outline: "none",
              }}
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 8,
                padding: "9px 14px",
                color: "#e6edf3",
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Tous les types</option>
              {types.map((t) => (
                <option key={t.id} value={t.code}>
                  {t.code} — {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#484f58" }}>
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#484f58" }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
              <p>Aucun document trouvé</p>
            </div>
          ) : (
            <div
              style={{
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 130px 130px 110px 100px",
                  padding: "10px 20px",
                  background: "#0d1117",
                  borderBottom: "1px solid #21262d",
                }}
              >
                {["Référence", "Titre", "Responsable", "Type", "Statut", "Revue"].map(
                  (h) => (
                    <span
                      key={h}
                      style={{
                        color: "#484f58",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                      }}
                    >
                      {h}
                    </span>
                  )
                )}
              </div>

              {/* Rows */}
              {filtered.map((doc, i) => {
                const sc = statusColor(doc.status_name);

                return (
                  <div
                    key={doc.id}
                    onClick={() => openDoc(doc)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr 130px 130px 110px 100px",
                      padding: "14px 20px",
                      alignItems: "center",
                      cursor: "pointer",
                      borderBottom:
                        i < filtered.length - 1 ? "1px solid #21262d" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#1c2128")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        color: "#58a6ff",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {doc.doc_code}
                    </span>

                    <div style={{ overflow: "hidden", paddingRight: 12 }}>
                      <p
                        style={{
                          margin: 0,
                          color: "#e6edf3",
                          fontSize: 13,
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {doc.title}
                      </p>
                      {doc.folder_name && (
                        <p style={{ margin: "2px 0 0", color: "#484f58", fontSize: 11 }}>
                          📁 {doc.folder_name}
                        </p>
                      )}
                    </div>

                    <span
                      style={{
                        color: "#8b949e",
                        fontSize: 12,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.responsible || "—"}
                    </span>

                    <span
                      style={{
                        background: "#1f6feb22",
                        color: "#58a6ff",
                        border: "1px solid #1f6feb44",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        width: "fit-content",
                      }}
                    >
                      {doc.type_code}
                    </span>

                    <span
                      style={{
                        background: sc.bg,
                        color: sc.color,
                        border: `1px solid ${sc.border}`,
                        padding: "2px 10px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 600,
                        width: "fit-content",
                      }}
                    >
                      {doc.status_name || "—"}
                    </span>

                    <span style={{ color: "#8b949e", fontSize: 12 }}>
                      {doc.next_review_date
                        ? new Date(doc.next_review_date).toLocaleDateString("fr-FR")
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL */}
      {selected && (
        <div
          onClick={closeDoc}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 16,
              width: "100%",
              maxWidth: 640,
              maxHeight: "85vh",
              overflow: "auto",
              padding: "28px 32px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 24,
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontFamily: "monospace",
                    color: "#58a6ff",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {selected.doc_code}
                </p>
                <h2
                  style={{
                    margin: 0,
                    color: "#e6edf3",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {selected.title}
                </h2>
              </div>

              <button
                onClick={closeDoc}
                style={{
                  background: "none",
                  border: "none",
                  color: "#484f58",
                  fontSize: 20,
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {[
                ["Responsable", selected.responsible || "—"],
                ["Type", `${selected.type_code} — ${selected.type_label}`],
                ["Origine", selected.origin || "—"],
                ["Statut", selected.status_name || "—"],
                ["Version", selected.current_version || "—"],
                ["Processus", selected.folder_name || "—"],
                ["Contexte", selected.context || "—"],
                [
                  "Prochaine revue",
                  selected.next_review_date
                    ? new Date(selected.next_review_date).toLocaleDateString("fr-FR")
                    : "—",
                ],
                [
                  "Créé le",
                  selected.created_at
                    ? new Date(selected.created_at).toLocaleDateString("fr-FR")
                    : "—",
                ],
                ["Créé par", selected.created_by_name || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    background: "#0d1117",
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px",
                      color: "#484f58",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      color: "#e6edf3",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {selected.keywords?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p
                  style={{
                    color: "#484f58",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 8,
                  }}
                >
                  Mots-clés
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selected.keywords.map((k) => (
                    <span
                      key={k}
                      style={{
                        background: "#21262d",
                        color: "#8b949e",
                        border: "1px solid #30363d",
                        padding: "2px 10px",
                        borderRadius: 99,
                        fontSize: 12,
                      }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selected.file_name && (
              <div
                style={{
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>📄</span>
                  <div>
                    <p style={{ margin: 0, color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>
                      {selected.file_name}
                    </p>
                    <p style={{ margin: "2px 0 0", color: "#484f58", fontSize: 11 }}>
                      Fichier document
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={`http://localhost:4000/files/${encodeURIComponent(selected.file_name)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: "#1f6feb",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    👁 Visualiser
                  </a>

                  <a
                    href={`http://localhost:4000/files/${encodeURIComponent(selected.file_name)}`}
                    download={selected.file_name}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: "#21262d",
                      color: "#e6edf3",
                      border: "1px solid #30363d",
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    ⬇ Télécharger
                  </a>
                </div>
              </div>
            )}

            {versions.length > 0 && (
              <div>
                <p
                  style={{
                    color: "#484f58",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 10,
                  }}
                >
                  Historique versions
                </p>

                {versions.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "#0d1117",
                      borderRadius: 6,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontFamily: "monospace", color: "#58a6ff", fontWeight: 700, fontSize: 13 }}>
                      v{v.version_letter}
                    </span>

                    <span style={{ color: "#8b949e", fontSize: 12 }}>{v.file_name}</span>

                    <span style={{ color: "#484f58", fontSize: 11 }}>
                      {v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR") : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={closeDoc}
              style={{
                width: "100%",
                marginTop: 20,
                padding: "10px",
                borderRadius: 8,
                background: "#21262d",
                border: "1px solid #30363d",
                color: "#8b949e",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
