// ============================================================
// Validations.jsx — ACTIA ES · DocumentList-style layout
// ============================================================
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import AppSidebar from "../components/AppSidebar";
import DownloadMenu from "../components/DownloadMenu";
import {
  LuRefreshCw, LuCircleCheck, LuCircleX, LuClock,
  LuPencil, LuPenLine, LuEye, LuCircleCheckBig, LuShare2, LuTriangleAlert,
  LuUser, LuInbox, LuLock, LuClipboardCheck, LuArchive, LuFile, LuFileText,
  LuExternalLink, LuX, LuCalendar, LuTag, LuFolder, LuHistory, LuArrowLeftRight, LuZap,
} from "react-icons/lu";
import { API, BACKEND } from "../config";

const STATUS_CFG = {
  "Brouillon":           { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)", Icon:LuPencil         },
  "En rédaction":        { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(187,247,208,0.15)", Icon:LuPenLine        },
  "Appel en relecture":  { bg:"rgba(255,247,205,0.08)", text:"#fbbf24", border:"rgba(252,211,77,0.2)",   Icon:LuEye            },
  "En relecture":        { bg:"rgba(239,246,255,0.08)", text:"#60a5fa", border:"rgba(191,219,254,0.15)", Icon:LuEye            },
  "En correction":       { bg:"rgba(255,237,213,0.08)", text:"#f97316", border:"rgba(253,186,116,0.2)",  Icon:LuPenLine        },
  "En validation":       { bg:"rgba(238,242,255,0.08)", text:"#a5b4fc", border:"rgba(199,210,254,0.15)", Icon:LuClipboardCheck },
  "Validé":              { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(134,239,172,0.2)",  Icon:LuCircleCheckBig },
  "Diffusé":             { bg:"rgba(240,253,250,0.08)", text:"#2dd4bf", border:"rgba(153,246,228,0.15)", Icon:LuShare2         },
  "Obsolète":            { bg:"rgba(255,247,237,0.08)", text:"#fb923c", border:"rgba(254,215,170,0.15)", Icon:LuTriangleAlert  },
  "Archivé":             { bg:"rgba(248,250,252,0.06)", text:"#94a3b8", border:"rgba(203,213,225,0.12)", Icon:LuArchive        },
};

const DECISION_CFG = {
  "APPROUVÉ":   { bg:"rgba(240,253,244,0.12)", text:"#4ade80", border:"rgba(134,239,172,0.25)", Icon:LuCircleCheck, label:"Approuvé"   },
  "REJETÉ":     { bg:"rgba(254,242,242,0.12)", text:"#f87171", border:"rgba(252,165,165,0.25)", Icon:LuCircleX,     label:"Rejeté"     },
  "EN_ATTENTE": { bg:"rgba(238,242,255,0.12)", text:"#a5b4fc", border:"rgba(165,180,252,0.25)", Icon:LuClock,       label:"En attente" },
};

function StatusBadge({ name }) {
  const s = STATUS_CFG[name] || { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)", Icon:LuFileText };
  const SI = s.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap"
      style={{ background:s.bg, color:s.text, borderColor:s.border }}>
      <SI size={11} /> {name}
    </span>
  );
}

function DecisionBadge({ decision }) {
  const d = DECISION_CFG[decision] || DECISION_CFG["EN_ATTENTE"];
  const DI = d.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border"
      style={{ background:d.bg, color:d.text, borderColor:d.border }}>
      <DI size={11} /> {d.label}
    </span>
  );
}

function StatCard({ Icon, label, value, accent }) {
  return (
    <div className="flex-1 min-w-[120px] rounded-2xl px-5 py-4 border"
      style={{ background:"rgba(255,255,255,0.04)", borderColor:`${accent}25`, backdropFilter:"blur(10px)" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} style={{ color:accent }} />
        <p className="m-0 text-[11px] uppercase tracking-[0.8px] font-bold" style={{ color:"rgba(168,191,212,0.5)" }}>{label}</p>
      </div>
      <p className="m-0 font-black text-3xl text-white" style={{ letterSpacing:-0.5 }}>{value}</p>
    </div>
  );
}

const statusCfg = (name) => STATUS_CFG[name] || { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)", Icon:LuFileText };

/* ── Document Detail Modal ─────────────────────────────────── */
function DocDetailModal({ docId, onClose }) {
  const [doc,       setDoc]       = useState(null);
  const [versions,  setVersions]  = useState([]);
  const [valHist,   setValHist]   = useState([]);
  const [timeline,  setTimeline]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("apercu");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile,  setPreviewFile]  = useState(null);

  useEffect(() => {
    setActiveTab("apercu");
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [docRes, verRes, valRes, auditRes] = await Promise.all([
          axios.get(`${API}/documents/${docId}`),
          axios.get(`${API}/documents/${docId}/versions`),
          axios.get(`${API}/validations/document/${docId}`).catch(() => ({ data: { validations: [] } })),
          axios.get(`${API}/documents/${docId}/audit-trail`).catch(() => ({ data: { timeline: [] } })),
        ]);
        setDoc(docRes.data);
        setVersions(verRes.data || []);
        setValHist(valRes.data?.validations || []);
        setTimeline(auditRes.data?.timeline || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [docId]);


  const s  = doc ? statusCfg(doc.status_name) : null;
  const SI = s?.Icon;

  const TABS = [
    { id:"apercu",       label:"Aperçu",       count:null            },
    { id:"versions",     label:"Versions",     count:versions.length  },
    { id:"validations",  label:"Validations",  count:valHist.length   },
    { id:"consultation", label:"Consultation", count:timeline.length  },
  ];

  const dcfgMap = {
    "APPROUVÉ":   { bg:"rgba(240,253,244,0.12)", text:"#4ade80", border:"rgba(134,239,172,0.25)", Icon:LuCircleCheck, label:"Approuvé"   },
    "APPROUVé":   { bg:"rgba(240,253,244,0.12)", text:"#4ade80", border:"rgba(134,239,172,0.25)", Icon:LuCircleCheck, label:"Approuvé"   },
    "REJETÉ":     { bg:"rgba(254,242,242,0.12)", text:"#f87171", border:"rgba(252,165,165,0.25)", Icon:LuCircleX,     label:"Rejeté"     },
    "REJETé":     { bg:"rgba(254,242,242,0.12)", text:"#f87171", border:"rgba(252,165,165,0.25)", Icon:LuCircleX,     label:"Rejeté"     },
    "EN_ATTENTE": { bg:"rgba(238,242,255,0.12)", text:"#a5b4fc", border:"rgba(165,180,252,0.25)", Icon:LuClock,       label:"En attente" },
  };

  return (
    <>
    <div onClick={onClose} className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background:"rgba(5,12,20,0.88)", backdropFilter:"blur(12px)" }}>
      <div onClick={e => e.stopPropagation()}
        className="rounded-2xl border w-[min(960px,96vw)] max-h-[90vh] flex flex-col overflow-hidden"
        style={{ background:"linear-gradient(160deg,#0d1f30 0%,#0a1622 100%)", borderColor:"rgba(255,255,255,0.1)", boxShadow:"0 50px 120px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)" }}>

        {/* ── Header ────────────────────────────────────────── */}
        <div className="px-7 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: s ? s.bg : "rgba(74,184,63,0.1)", border:`1.5px solid ${s ? s.border : "rgba(74,184,63,0.25)"}`, boxShadow:`0 6px 20px ${s ? s.text : "#4ab83f"}18` }}>
                {SI && <SI size={20} style={{ color: s.text }} />}
              </div>
              <div>
                {doc ? (
                  <>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-black text-sm tracking-wide" style={{ color:"#4ab83f" }}>{doc.doc_code}</span>
                      <StatusBadge name={doc.status_name} />
                      {doc.current_version && doc.current_version !== "-" && (
                        <span className="rounded-md px-2 py-0.5 text-xs font-bold border"
                          style={{ background:"rgba(165,180,252,0.1)", borderColor:"rgba(165,180,252,0.25)", color:"#a5b4fc" }}>
                          v{doc.current_version}
                        </span>
                      )}
                    </div>
                    <h2 className="m-0 text-white font-bold" style={{ fontSize:20, letterSpacing:-0.3 }}>{doc.title}</h2>
                  </>
                ) : loading ? (
                  <div className="h-8 w-56 rounded-lg animate-pulse" style={{ background:"rgba(255,255,255,0.06)" }} />
                ) : null}
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
              style={{ color:"rgba(168,191,212,0.5)", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.1)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.3)"; e.currentTarget.style.color="#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; e.currentTarget.style.color="rgba(168,191,212,0.5)"; }}>
              <LuX size={16} />
            </button>
          </div>

          {/* Tab bar */}
          {!loading && doc && (
            <div className="flex items-end gap-0.5">
              {TABS.map(tab => (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all"
                  style={{
                    color: activeTab === tab.id ? "#fff" : "rgba(168,191,212,0.45)",
                    borderBottomColor: activeTab === tab.id ? "#4ab83f" : "transparent",
                    background: activeTab === tab.id ? "rgba(74,184,63,0.06)" : "transparent",
                    cursor:"pointer",
                  }}>
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <span className="rounded-full px-1.5 py-px text-[10px] font-black"
                      style={{
                        background: activeTab === tab.id ? "rgba(74,184,63,0.2)" : "rgba(255,255,255,0.06)",
                        color: activeTab === tab.id ? "#4ab83f" : "rgba(168,191,212,0.35)",
                      }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height:1, background:"rgba(255,255,255,0.07)", flexShrink:0 }} />

        {/* ── Content ───────────────────────────────────────── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3 py-16">
            <LuRefreshCw size={22} className="animate-spin" style={{ color:"rgba(74,184,63,0.5)" }} />
            <span className="text-sm" style={{ color:"rgba(168,191,212,0.4)" }}>Chargement…</span>
          </div>
        ) : !doc ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color:"rgba(168,191,212,0.4)" }}>Document introuvable.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-7 py-6">

            {/* ── Aperçu ─────────────────────────────────── */}
            {activeTab === "apercu" && (
              <div className="flex flex-col gap-5">
                <div className="grid gap-3" style={{ gridTemplateColumns:"repeat(3, 1fr)" }}>
                  {[
                    { Icon:LuUser,     label:"Responsable",       value:doc.responsible || "—" },
                    { Icon:LuTag,      label:"Type",              value:doc.type_code ? `${doc.type_code}${doc.type_label ? " — " + doc.type_label : ""}` : "—" },
                    { Icon:LuFolder,   label:"Processus",         value:doc.folder_name || "—" },
                    { Icon:LuCalendar, label:"Créé le",           value:doc.created_at ? new Date(doc.created_at).toLocaleDateString("fr-FR") : "—" },
                    { Icon:LuCalendar, label:"Prochaine révision",value:doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—" },
                    { Icon:LuFileText, label:"Origine",           value:doc.origin || "INTERNE" },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="rounded-xl px-4 py-3 border"
                      style={{ background:"rgba(255,255,255,0.025)", borderColor:"rgba(255,255,255,0.07)" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={11} style={{ color:"rgba(168,191,212,0.4)" }} />
                        <p className="m-0 text-[10px] uppercase tracking-wider font-bold" style={{ color:"rgba(168,191,212,0.35)" }}>{label}</p>
                      </div>
                      <p className="m-0 text-sm font-medium text-white truncate" title={value}>{value}</p>
                    </div>
                  ))}
                </div>

                {(doc.context || doc.description) && (
                  <div className="rounded-xl px-4 py-3.5 border"
                    style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.06)" }}>
                    <p className="m-0 text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color:"rgba(168,191,212,0.35)" }}>Description / Contexte</p>
                    <p className="m-0 text-sm leading-relaxed" style={{ color:"rgba(168,191,212,0.65)" }}>{doc.context || doc.description}</p>
                  </div>
                )}

                {doc.keywords?.length > 0 && (
                  <div>
                    <p className="m-0 text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color:"rgba(168,191,212,0.35)" }}>Mots-clés</p>
                    <div className="flex flex-wrap gap-2">
                      {doc.keywords.map(k => (
                        <span key={k} className="px-2.5 py-0.5 rounded-full text-xs border font-medium"
                          style={{ background:"rgba(74,184,63,0.08)", color:"#4ab83f", borderColor:"rgba(74,184,63,0.2)" }}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ── Versions ───────────────────────────────── */}
            {activeTab === "versions" && (
              <div className="flex flex-col gap-3">
                {versions.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <LuHistory size={32} style={{ color:"rgba(168,191,212,0.15)" }} />
                    <p className="text-sm m-0" style={{ color:"rgba(168,191,212,0.4)" }}>Aucune version enregistrée.</p>
                  </div>
                ) : versions.map((v, idx) => {
                  const isLockedDoc = ["Validé","Diffusé","Obsolète","Archivé"].includes(doc?.status_name);
                  const isFirst = v.version_letter === "-";
                  const isCurrent = idx === versions.length - 1;
                  const canInteract = !isLockedDoc || isFirst || isCurrent;
                  return (
                  <div key={v.id} className="rounded-xl border overflow-hidden"
                    style={{ background:"rgba(255,255,255,0.02)", borderColor: idx === versions.length - 1 ? "rgba(74,184,63,0.2)" : "rgba(255,255,255,0.07)" }}>
                    <div className="px-5 py-4 flex items-center gap-4">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 w-16">
                        <span className="rounded-xl px-3 py-1 text-sm font-black border"
                          style={{ background: idx === versions.length-1 ? "rgba(74,184,63,0.15)" : "rgba(255,255,255,0.05)", color: idx === versions.length-1 ? "#4ab83f" : "rgba(168,191,212,0.5)", borderColor: idx === versions.length-1 ? "rgba(74,184,63,0.3)" : "rgba(255,255,255,0.08)" }}>
                          v{v.version_letter}
                        </span>
                        {idx === versions.length-1 && (
                          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color:"#4ab83f" }}>Actuelle</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-semibold text-white">{v.change_summary || "Version initiale"}</p>
                        <p className="m-0 text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color:"rgba(168,191,212,0.45)" }}>
                          {v.created_by_name && <span className="flex items-center gap-1"><LuUser size={10} />{v.created_by_name} ·</span>}
                          <span className="flex items-center gap-1"><LuCalendar size={10} />{v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}) : "—"}</span>
                          {v.file_size > 0 && <span>· {(v.file_size/1024).toFixed(0)} Ko</span>}
                        </p>
                      </div>
                      {v.file_path && canInteract && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => { setPreviewFile(v.file_path.split("/").pop() || v.file_path); setPreviewOpen(true); }}
                            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border font-semibold transition-all"
                            style={{ background:"rgba(96,165,250,0.06)", borderColor:"rgba(96,165,250,0.2)", color:"#60a5fa", cursor:"pointer" }}
                            onMouseEnter={e => { e.currentTarget.style.background="rgba(96,165,250,0.15)"; e.currentTarget.style.borderColor="rgba(96,165,250,0.4)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background="rgba(96,165,250,0.06)"; e.currentTarget.style.borderColor="rgba(96,165,250,0.2)"; }}>
                            <LuEye size={14} /> Consulter
                          </button>
                          <DownloadMenu filename={v.file_path.split("/").pop() || v.file_path} />
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* ── Validations ────────────────────────────── */}
            {activeTab === "validations" && (
              <div className="flex flex-col gap-3">
                {valHist.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <LuCircleCheck size={32} style={{ color:"rgba(168,191,212,0.15)" }} />
                    <p className="text-sm m-0" style={{ color:"rgba(168,191,212,0.4)" }}>Aucune décision de validation enregistrée.</p>
                  </div>
                ) : valHist.map(v => {
                  const dc = dcfgMap[v.decision] || dcfgMap["EN_ATTENTE"];
                  const DI = dc.Icon;
                  return (
                    <div key={v.id} className="rounded-xl border px-5 py-4"
                      style={{ background:"rgba(255,255,255,0.02)", borderColor:dc.border }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                            style={{ background:dc.bg, color:dc.text, borderColor:dc.border }}>
                            <DI size={11} /> {dc.label}
                          </span>
                          {v.version_letter && v.version_letter !== "-" && (
                            <span className="text-xs px-2 py-0.5 rounded-md border font-mono font-bold"
                              style={{ background:"rgba(255,255,255,0.04)", color:"rgba(168,191,212,0.5)", borderColor:"rgba(255,255,255,0.08)" }}>
                              v{v.version_letter}
                            </span>
                          )}
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color:"rgba(168,191,212,0.4)" }}>
                          {v.validated_at ? new Date(v.validated_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background:"rgba(168,191,212,0.08)", border:"1px solid rgba(168,191,212,0.12)" }}>
                          <LuUser size={13} style={{ color:"rgba(168,191,212,0.5)" }} />
                        </div>
                        <span className="text-sm font-semibold text-white">{v.validator_name}</span>
                      </div>
                      {v.comment && (
                        <div className="rounded-lg px-3 py-2.5 border mt-1"
                          style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.06)" }}>
                          <p className="m-0 text-xs leading-relaxed italic" style={{ color:"rgba(168,191,212,0.6)" }}>"{v.comment}"</p>
                        </div>
                      )}
                      {v.signature_hash && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <LuLock size={10} style={{ color:"rgba(74,184,63,0.55)" }} />
                          <span className="text-[10px] font-mono" style={{ color:"rgba(74,184,63,0.45)" }}>{v.signature_hash.slice(0,40)}…</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Consultation ───────────────────────────── */}
            {activeTab === "consultation" && (
              <div>
                {timeline.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <LuFileText size={32} style={{ color:"rgba(168,191,212,0.15)" }} />
                    <p className="text-sm m-0" style={{ color:"rgba(168,191,212,0.4)" }}>Aucune activité enregistrée pour ce document.</p>
                  </div>
                ) : (
                  <div className="relative pl-2">
                    <div className="absolute left-[28px] top-5 bottom-5 w-px"
                      style={{ background:"linear-gradient(to bottom, rgba(74,184,63,0.4) 0%, rgba(148,163,184,0.1) 100%)" }} />
                    <div className="flex flex-col">
                      {timeline.map((event, idx) => {
                        let cfg;
                        if (event.type === "VALIDATION") {
                          cfg = dcfgMap[event.decision] || { text:"#a5b4fc", Icon:LuClock, label:"Validation" };
                        } else if (event.type === "VERSION") {
                          cfg = { text:"#4ab83f", Icon:LuHistory, label:"Nouvelle version" };
                        } else {
                          cfg = ({
                            STATUS_CHANGE:      { text:"#a5b4fc", Icon:LuArrowLeftRight, label:"Changement de statut" },
                            AUTO_ARCHIVE:       { text:"#94a3b8", Icon:LuArchive,         label:"Archivage automatique" },
                            VERSION_SUPERSEDED: { text:"#fb923c", Icon:LuHistory,         label:"Version remplacée" },
                            DOCUMENT_CREATED:   { text:"#4ab83f", Icon:LuZap,             label:"Création" },
                          })[event.action] || { text:"#94a3b8", Icon:LuFileText, label: event.action || "Activité" };
                        }
                        const EI = cfg.Icon;
                        const details = event.details || {};
                        return (
                          <div key={idx} className="flex gap-4 py-3">
                            <div className="flex-shrink-0 w-14 flex justify-center">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
                                style={{ background:`${cfg.text}12`, borderColor:`${cfg.text}25`, position:"relative", zIndex:1 }}>
                                <EI size={16} style={{ color:cfg.text }} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-sm font-bold" style={{ color:cfg.text }}>{cfg.label}</span>
                                <span className="text-[11px] flex-shrink-0" style={{ color:"rgba(168,191,212,0.35)" }}>
                                  {event.timestamp ? new Date(event.timestamp).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}
                                </span>
                              </div>
                              {event.type === "LOG" && details.from && details.to && (
                                <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.5)" }}>
                                  <span style={{ color:"rgba(168,191,212,0.38)" }}>{details.from}</span>
                                  {" "}<span style={{ color:cfg.text }}>→</span>{" "}
                                  <span className="font-semibold text-white">{details.to}</span>
                                </p>
                              )}
                              {event.type === "VALIDATION" && (
                                <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.5)" }}>
                                  Par <span className="font-semibold text-white">{event.validator_name}</span>
                                  {event.version && <span style={{ color:"rgba(168,191,212,0.35)" }}> · v{event.version}</span>}
                                </p>
                              )}
                              {event.type === "VERSION" && (
                                <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.5)" }}>
                                  <span className="font-mono font-bold" style={{ color:"#4ab83f" }}>v{event.version_letter}</span>
                                  {event.change_summary && <span> · {event.change_summary}</span>}
                                </p>
                              )}
                              {event.type === "VALIDATION" && event.comment && (
                                <div className="mt-1 rounded-lg px-3 py-1.5 border"
                                  style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.05)" }}>
                                  <p className="m-0 text-xs italic" style={{ color:"rgba(168,191,212,0.5)" }}>"{event.comment}"</p>
                                </div>
                              )}
                              {event.type === "LOG" && event.user_id && (
                                <p className="m-0 mt-0.5 text-[11px] flex items-center gap-1" style={{ color:"rgba(168,191,212,0.3)" }}>
                                  <LuUser size={9} /> {details.user_name || `Utilisateur #${event.user_id}`}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
      {/* ══ Preview modal ════════════════════════════════════ */}
      {previewOpen && (
        <div onClick={() => setPreviewOpen(false)} className="fixed inset-0 z-[1200] flex flex-col items-center justify-center" style={{ background:"rgba(5,12,20,0.9)", backdropFilter:"blur(8px)" }}>
          <div onClick={e => e.stopPropagation()} className="w-[90vw] h-[90vh] rounded-2xl flex flex-col overflow-hidden border" style={{ background:"#0d1f30", borderColor:"rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.08)" }}>
              <span className="text-sm font-semibold text-white flex items-center gap-1.5"><LuFile size={14} /> {previewFile}</span>
              <button onClick={() => { setPreviewOpen(false); setPreviewFile(null); }} style={{ color:"rgba(168,191,212,0.5)" }} onMouseEnter={e=>e.currentTarget.style.color="white"} onMouseLeave={e=>e.currentTarget.style.color="rgba(168,191,212,0.5)"}>
                <LuX size={18} />
              </button>
            </div>
            <iframe src={`${BACKEND}/preview/${encodeURIComponent(previewFile||"")}`} title="preview" className="flex-1 border-none w-full" />
          </div>
        </div>
      )}
    </>
  );
}

function ValidationModal({ doc, canValidate=false, onClose, onValidationAdded }) {
  const isRelecture  = doc.status_name === "En relecture";
  const isValidation = doc.status_name === "En validation";

  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment,    setComment]    = useState("");
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);

  const inputStyle = { background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.85)" };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try { const res = await axios.get(`${API}/validations/document/${doc.id}`); setHistory(res.data.validations||[]); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  }, [doc.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleRelectureSubmit = async (nextStatus) => {
    if (!comment.trim() && nextStatus === "En correction") {
      setError("Un commentaire est obligatoire pour demander des corrections.");
      return;
    }
    setError(null); setSuccess(null); setSubmitting(true);
    try {
      await axios.post(`${API}/validations/document/${doc.id}`, {
        comment,
        decision: nextStatus === "En correction" ? "REJETÉ" : "APPROUVÉ",
      });
      await axios.patch(`${API}/documents/${doc.id}/status`, { newStatus: nextStatus });
      setSuccess(`Statut mis à jour : "${nextStatus}".`);
      setComment("");
      await loadHistory();
      onValidationAdded();
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la mise à jour.");
    } finally { setSubmitting(false); }
  };

  const handleValidationAction = async (nextStatus) => {
    const d = nextStatus === "Validé" ? "APPROUVÉ" : "REJETÉ";
    setError(null); setSuccess(null); setSubmitting(true);
    try {
      await axios.post(`${API}/validations/document/${doc.id}`, { comment, decision: d });
      await axios.patch(`${API}/documents/${doc.id}/status`, { newStatus: nextStatus });
      setSuccess(`Statut mis à jour : "${nextStatus}".`);
      setComment("");
      await loadHistory(); onValidationAdded();
      setTimeout(onClose, 1200);
    } catch (err) { setError(err.response?.data?.error || "Erreur."); }
    finally { setSubmitting(false); }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background:"rgba(5,12,20,0.85)", backdropFilter:"blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} className="rounded-2xl border w-[min(900px,95vw)] max-h-[90vh] flex flex-col overflow-hidden"
        style={{ background:"#0d1f30", borderColor:"rgba(255,255,255,0.12)", boxShadow:"0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between"
          style={{ borderColor:"rgba(255,255,255,0.08)" }}>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="font-mono font-bold text-sm" style={{ color:"#4ab83f" }}>{doc.doc_code}</span>
              <StatusBadge name={doc.status_name} />
              {doc.version_letter && doc.version_letter !== "-" && (
                <span className="rounded-md px-2 py-0.5 text-xs border"
                  style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.6)" }}>
                  v{doc.version_letter}
                </span>
              )}
            </div>
            <p className="m-0 text-white font-semibold text-[17px]">{doc.title}</p>
            <p className="m-0 mt-1 text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>
              {doc.responsible} · {doc.process_name || "—"} · {doc.type_code}
            </p>
            {doc.sharepoint_link && (
              <a href={doc.sharepoint_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg border no-underline"
                style={{ background:"rgba(0,120,212,0.12)", borderColor:"rgba(0,120,212,0.3)", color:"#60a5fa" }}>
                <LuExternalLink size={11} /> Ouvrir sur SharePoint
              </a>
            )}
          </div>
          <button onClick={onClose} className="p-1 flex items-center"
            style={{ color:"rgba(168,191,212,0.5)" }}
            onMouseEnter={e => e.currentTarget.style.color = "white"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(168,191,212,0.5)"}>
            <LuX size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: action form */}
          <div className="w-[300px] flex-shrink-0 border-r p-5 overflow-y-auto"
            style={{ borderColor:"rgba(255,255,255,0.08)" }}>

            {!canValidate ? (
              <div className="rounded-xl px-3.5 py-3 flex gap-2 items-start border"
                style={{ background:"rgba(248,113,113,0.08)", borderColor:"rgba(248,113,113,0.2)" }}>
                <LuLock size={14} style={{ color:"#f87171" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="m-0 mb-0.5 text-xs font-semibold" style={{ color:"#f87171" }}>Accès refusé</p>
                  <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.55)" }}>
                    Seuls Reviewer, Ing. Qualité et Admin peuvent enregistrer une décision.
                  </p>
                </div>
              </div>
            ) : isRelecture ? (
              <div className="flex flex-col gap-3.5">
                <div className="rounded-xl px-3.5 py-3 border"
                  style={{ background:"rgba(96,165,250,0.06)", borderColor:"rgba(96,165,250,0.2)" }}>
                  <p className="m-0 text-xs font-bold uppercase tracking-wider mb-1" style={{ color:"#60a5fa" }}>Décision de relecture</p>
                  <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.6)" }}>
                    Après lecture du document sur SharePoint, choisissez la suite.
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1.5"
                    style={{ color:"rgba(168,191,212,0.5)" }}>Commentaire de relecture</label>
                  <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Observations, corrections à apporter…"
                    className="w-full px-3 py-2 rounded-lg border text-sm resize-y outline-none"
                    style={{ ...inputStyle, minHeight:90 }} />
                </div>
                {error   && <p className="m-0 text-xs rounded-lg px-3 py-2 border" style={{ color:"#f87171", background:"rgba(248,113,113,0.08)", borderColor:"rgba(248,113,113,0.2)" }}>{error}</p>}
                {success && <p className="m-0 text-xs rounded-lg px-3 py-2 border" style={{ color:"#4ade80", background:"rgba(74,222,128,0.08)", borderColor:"rgba(74,222,128,0.2)" }}>{success}</p>}
                <button onClick={() => handleRelectureSubmit("En correction")} disabled={submitting}
                  className="w-full py-2.5 rounded-lg font-bold text-sm border transition-all flex items-center justify-center gap-2"
                  style={{ background:"rgba(249,115,22,0.12)", borderColor:"rgba(249,115,22,0.3)", color:"#f97316", cursor:submitting?"not-allowed":"pointer" }}>
                  <LuPenLine size={14} /> Corrections requises
                </button>
                <button onClick={() => handleRelectureSubmit("En validation")} disabled={submitting}
                  className="w-full py-2.5 rounded-lg font-bold text-sm border-none transition-all flex items-center justify-center gap-2"
                  style={{ background:submitting?"rgba(255,255,255,0.06)":"linear-gradient(135deg,#a5b4fc,#818cf8)", color:"white", boxShadow:submitting?"none":"0 4px 16px rgba(165,180,252,0.3)", cursor:submitting?"not-allowed":"pointer" }}>
                  <LuClipboardCheck size={14} /> Soumettre en validation
                </button>
              </div>
            ) : isValidation ? (
              <div className="flex flex-col gap-3.5">
                <div className="rounded-xl px-3.5 py-3 border"
                  style={{ background:"rgba(165,180,252,0.06)", borderColor:"rgba(165,180,252,0.2)" }}>
                  <p className="m-0 text-xs font-bold uppercase tracking-wider mb-1" style={{ color:"#a5b4fc" }}>Validation finale</p>
                  <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.6)" }}>
                    Approuvez ou rejetez pour déclencher la transition vers "Validé".
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1.5"
                    style={{ color:"rgba(168,191,212,0.5)" }}>Commentaire</label>
                  <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Observations, motif de rejet…"
                    className="w-full px-3 py-2 rounded-lg border text-sm resize-y outline-none"
                    style={{ ...inputStyle, minHeight:80 }} />
                </div>
                {error   && <p className="m-0 text-xs rounded-lg px-3 py-2 border" style={{ color:"#f87171", background:"rgba(248,113,113,0.08)", borderColor:"rgba(248,113,113,0.2)" }}>{error}</p>}
                {success && <p className="m-0 text-xs rounded-lg px-3 py-2 border" style={{ color:"#4ade80", background:"rgba(74,222,128,0.08)", borderColor:"rgba(74,222,128,0.2)" }}>{success}</p>}
                <button onClick={() => handleValidationAction("En correction")} disabled={submitting}
                  className="w-full py-2.5 rounded-lg font-bold text-sm border transition-all flex items-center justify-center gap-2"
                  style={{ background:"rgba(249,115,22,0.12)", borderColor:"rgba(249,115,22,0.3)", color:"#f97316", cursor:submitting?"not-allowed":"pointer" }}>
                  <LuCircleX size={14} /> Rejeter
                </button>
                <button onClick={() => handleValidationAction("Validé")} disabled={submitting}
                  className="w-full py-2.5 rounded-lg font-bold text-sm border-none transition-all flex items-center justify-center gap-2"
                  style={{ background:submitting?"rgba(255,255,255,0.06)":"linear-gradient(135deg,#4ab83f,#3da333)", color:"white", boxShadow:submitting?"none":"0 4px 16px rgba(74,184,63,0.35)", cursor:submitting?"not-allowed":"pointer" }}>
                  <LuCircleCheck size={14} /> Approuver
                </button>
              </div>
            ) : null}
          </div>

          {/* Right: history for this doc */}
          <div className="flex-1 p-5 overflow-y-auto">
            <p className="text-white font-semibold text-[15px] mb-4">
              Historique des décisions
              {history.length > 0 && (
                <span className="font-normal ml-2 text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>({history.length})</span>
              )}
            </p>
            {loading ? (
              <p className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</p>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <LuClipboardCheck size={32} style={{ color:"rgba(168,191,212,0.2)" }} />
                <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.45)" }}>Aucune décision enregistrée.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {history.map(v => (
                  <div key={v.id} className="rounded-xl px-4 py-3.5 border"
                    style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DecisionBadge decision={v.decision} />
                        {v.version_letter && v.version_letter !== "-" && (
                          <span className="text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>v{v.version_letter}</span>
                        )}
                      </div>
                      <span className="text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>
                        {new Date(v.validated_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <LuUser size={13} style={{ color:"rgba(168,191,212,0.4)" }} className="flex-shrink-0" />
                      <span className="text-sm font-semibold text-white">{v.validator_name}</span>
                    </div>
                    {v.comment && (
                      <p className="m-0 text-sm rounded-lg px-3 py-2 border leading-relaxed"
                        style={{ color:"rgba(168,191,212,0.65)", background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
                        {v.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Validations() {
  const { can, currentUser } = useUser();
  const [pendingDocs, setPendingDocs] = useState([]);
  const [allHistory,  setAllHistory]  = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("validation");
  const [selectedDoc,   setSelectedDoc]   = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, hist, statsRes] = await Promise.all([
        axios.get(`${API}/validations/pending-docs`),
        axios.get(`${API}/validations?limit=100`),
        axios.get(`${API}/validations/stats`),
      ]);
      setPendingDocs(pending.data);
      setAllHistory(hist.data.data || []);
      setStats(statsRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const validationDocs = pendingDocs.filter(d => d.status_name === "En validation");

  const [inlineSubmitting, setInlineSubmitting] = useState({});
  const [pendingAction,    setPendingAction]    = useState(null); // { doc, nextStatus, comment }

  const handleInlineValidation = async (doc, nextStatus, comment = "") => {
    const decision = nextStatus === "Validé" ? "APPROUVÉ" : "REJETÉ";
    setPendingAction(null);
    setInlineSubmitting(s => ({ ...s, [doc.id]: nextStatus }));
    try {
      await axios.post(`${API}/validations/document/${doc.id}`, { decision, comment });
      await axios.patch(`${API}/documents/${doc.id}/status`, { newStatus: nextStatus });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setInlineSubmitting(s => ({ ...s, [doc.id]: null }));
    }
  };

  const tabs = [
    { id:"validation", Icon:LuClipboardCheck,label:"En validation",       count:validationDocs.length, accent:"#a5b4fc" },
    { id:"history",    Icon:LuCircleCheck,   label:"Historique",          count:allHistory.length,     accent:"#4ade80" },
  ];

  const ROW_BG_HOVER = "rgba(255,255,255,0.04)";
  const ROW_BORDER   = "1px solid rgba(255,255,255,0.05)";

  const sidebarBottom = (
    <>
      <div className="rounded-xl px-3 py-2.5 border"
        style={{ background:"rgba(74,184,63,0.08)", borderColor:"rgba(74,184,63,0.2)" }}>
        <p className="m-0 text-[10px] uppercase tracking-[1px] font-bold" style={{ color:"rgba(168,191,212,0.5)" }}>Workflow</p>
        <p className="m-0 font-black text-xl" style={{ color:"#a5b4fc" }}>{validationDocs.length} validation</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex"
      style={{ background:"linear-gradient(145deg,#0a1420 0%,#0f1e30 35%,#1a2f4a 70%,#1e3a55 100%)" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .val-row:hover { background: ${ROW_BG_HOVER} !important; cursor:pointer; }
      `}</style>

      <AppSidebar user={currentUser} badges={{ "/validations": pendingDocs.length }} bottomContent={sidebarBottom} />

      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="px-8 py-4 border-b flex items-center justify-between"
          style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(20px)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 1px 0 rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"linear-gradient(135deg,rgba(74,184,63,0.18),rgba(74,184,63,0.08))", border:"1.5px solid rgba(74,184,63,0.3)", boxShadow:"0 4px 14px rgba(74,184,63,0.15)" }}>
              <LuClipboardCheck size={19} style={{ color:"#4ab83f" }} />
            </div>
            <div>
              <h1 className="m-0 font-extrabold text-white" style={{ fontSize:21, letterSpacing:"-0.022em", lineHeight:1.2 }}>
                Validations ISO
              </h1>
              <p className="m-0 text-xs mt-0.5" style={{ color:"rgba(168,191,212,0.48)" }}>
                Décisions de validation · Traçabilité complète
                {activeTab === "validation" && <span style={{ color:"#a5b4fc" }}> · {validationDocs.length} en validation</span>}
                {activeTab === "history"    && <span style={{ color:"#4ade80" }}> · {allHistory.length} entrées</span>}
              </p>
            </div>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold border transition-all"
            style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.6)", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(74,184,63,0.4)"; e.currentTarget.style.color="#4ab83f"; e.currentTarget.style.background="rgba(74,184,63,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="rgba(168,191,212,0.6)"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}>
            <LuRefreshCw size={14} /> Actualiser
          </button>
        </header>

        <div className="flex-1 px-8 py-5 overflow-y-auto">

          {/* ── Stats ──────────────────────────────────────────── */}
          {stats && (
            <div className="flex gap-4 mb-6 flex-wrap">
              <StatCard Icon={LuClock}          label="En validation"     value={validationDocs.length}                     accent="#a5b4fc" />
              <StatCard Icon={LuCircleCheck}    label="Approuvées"        value={stats.decisions?.["APPROUVÉ"] ?? 0}        accent="#4ade80" />
              <StatCard Icon={LuCircleX}        label="Rejetées"          value={stats.decisions?.["REJETÉ"] ?? 0}          accent="#f87171" />
              <StatCard Icon={LuClipboardCheck} label="Total validations" value={stats.total ?? 0}                          accent="#60a5fa" />
            </div>
          )}

          {/* ── Tabs ───────────────────────────────────────────── */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {tabs.map(({ id, Icon, label, count, accent }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
                style={{
                  background:  activeTab===id ? `${accent}18`      : "rgba(255,255,255,0.04)",
                  borderColor: activeTab===id ? `${accent}40`      : "rgba(255,255,255,0.08)",
                  color:       activeTab===id ? accent              : "rgba(168,191,212,0.6)",
                  cursor:"pointer",
                }}>
                <Icon size={14} />
                {label}
                {count > 0 && (
                  <span className="rounded-full px-2 py-px text-xs font-bold"
                    style={{ background:activeTab===id?`${accent}28`:"rgba(255,255,255,0.08)", color:activeTab===id?accent:"rgba(168,191,212,0.6)" }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Content ────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16" style={{ color:"rgba(168,191,212,0.5)" }}>
              <LuRefreshCw size={32} className="animate-spin" style={{ color:"rgba(74,184,63,0.5)" }} />
              <p className="m-0 text-sm">Chargement…</p>
            </div>
          ) : (
            <>
              {/* ── En validation tab ─────────────────────────── */}
              {activeTab === "validation" && (
                validationDocs.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3">
                    <LuCircleCheckBig size={40} style={{ color:"rgba(168,191,212,0.2)" }} />
                    <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.45)" }}>
                      Aucun document en attente de validation finale.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border"
                    style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(165,180,252,0.15)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                    {/* banner */}
                    <div className="px-5 py-2.5 border-b"
                      style={{ background:"rgba(165,180,252,0.06)", borderColor:"rgba(165,180,252,0.15)" }}>
                      <p className="m-0 text-xs font-bold uppercase tracking-wider" style={{ color:"#a5b4fc" }}>
                        Validation finale — approuver ou rejeter pour déclencher la transition vers "Validé"
                      </p>
                    </div>
                    {/* header row */}
                    <div className="grid px-5 py-2.5 border-b"
                      style={{ gridTemplateColumns:"160px 1fr 130px 90px 90px 140px 200px", background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.07)" }}>
                      {["Référence","Titre","Responsable","Type","Version","Dernière décision","Actions"].map(h => (
                        <span key={h} className="text-[11px] font-bold uppercase tracking-[0.8px]"
                          style={{ color:"rgba(168,191,212,0.5)" }}>{h}</span>
                      ))}
                    </div>
                    {/* rows */}
                    {validationDocs.map((doc, i) => {
                      const busy      = inlineSubmitting[doc.id];
                      const isPending = pendingAction?.doc?.id === doc.id;
                      const isApprove = isPending && pendingAction.nextStatus === "Validé";
                      const commentOk = !isPending || isApprove || !!pendingAction.comment.trim();
                      return (
                      <div key={doc.id} style={{ borderBottom: i < validationDocs.length-1 ? ROW_BORDER : "none" }}>
                        {/* Normal row */}
                        <div className="val-row grid px-5 py-3 items-center transition-all duration-150"
                          style={{ gridTemplateColumns:"160px 1fr 130px 90px 90px 140px 200px", background:"transparent", opacity: isPending ? 0.45 : 1 }}
                          onClick={() => !isPending && setSelectedDoc(doc)}>
                          <span className="font-mono font-bold text-sm" style={{ color:"#4ab83f" }}>{doc.doc_code}</span>
                          <div className="overflow-hidden pr-3">
                            <p className="m-0 text-sm font-medium text-white truncate">{doc.title}</p>
                            {doc.process_name && <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>{doc.process_name}</p>}
                          </div>
                          <span className="text-sm truncate" style={{ color:"rgba(168,191,212,0.6)" }}>{doc.responsible || "—"}</span>
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold w-fit border"
                            style={{ background:"rgba(165,180,252,0.1)", color:"#a5b4fc", borderColor:"rgba(165,180,252,0.2)" }}>
                            {doc.type_code}
                          </span>
                          <span className="text-sm font-semibold" style={{ color:"rgba(168,191,212,0.7)" }}>
                            {doc.version_letter && doc.version_letter !== "-" ? `v${doc.version_letter}` : "—"}
                          </span>
                          <div>
                            {doc.last_decision
                              ? <DecisionBadge decision={doc.last_decision} />
                              : <span className="text-sm" style={{ color:"rgba(168,191,212,0.4)" }}>Aucune</span>
                            }
                          </div>
                          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                            {can("validation:create") ? (
                              <>
                                <button disabled={!!busy || isPending}
                                  onClick={() => setPendingAction({ doc, nextStatus:"En correction", comment:"" })}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all"
                                  style={{ background:"rgba(249,115,22,0.12)", borderColor:"rgba(249,115,22,0.3)", color:(busy||isPending)?"rgba(168,191,212,0.3)":"#f97316", cursor:(busy||isPending)?"not-allowed":"pointer" }}>
                                  <LuCircleX size={12} /> {busy==="En correction"?"…":"Rejeter"}
                                </button>
                                <button disabled={!!busy || isPending}
                                  onClick={() => setPendingAction({ doc, nextStatus:"Validé", comment:"" })}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border-none transition-all"
                                  style={{ background:(busy||isPending)?"rgba(255,255,255,0.06)":"linear-gradient(135deg,#4ab83f,#3da333)", color:(busy||isPending)?"rgba(168,191,212,0.3)":"white", boxShadow:(busy||isPending)?"none":"0 3px 10px rgba(74,184,63,0.3)", cursor:(busy||isPending)?"not-allowed":"pointer" }}>
                                  <LuCircleCheck size={12} /> {busy==="Validé"?"…":"Approuver"}
                                </button>
                              </>
                            ) : (
                              <span className="flex items-center gap-1 text-xs" style={{ color:"rgba(168,191,212,0.35)" }}>
                                <LuLock size={11} /> Accès refusé
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ── Confirmation panel ──────────────────── */}
                        {isPending && (
                          <div className="px-5 pb-5 border-t" style={{ borderColor:"rgba(255,255,255,0.06)" }}>
                            <div className="rounded-2xl border p-5 mt-1"
                              style={{
                                background: isApprove ? "rgba(74,184,63,0.06)" : "rgba(249,115,22,0.06)",
                                borderColor: isApprove ? "rgba(74,184,63,0.25)" : "rgba(249,115,22,0.25)",
                                boxShadow: isApprove ? "0 8px 30px rgba(74,184,63,0.08)" : "0 8px 30px rgba(249,115,22,0.08)",
                              }}>
                              {/* Panel header */}
                              <div className="flex items-start gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{ background: isApprove ? "rgba(74,184,63,0.15)" : "rgba(249,115,22,0.15)", border:`1.5px solid ${isApprove?"rgba(74,184,63,0.35)":"rgba(249,115,22,0.35)"}` }}>
                                  {isApprove
                                    ? <LuCircleCheck size={17} style={{ color:"#4ab83f" }} />
                                    : <LuCircleX     size={17} style={{ color:"#f97316" }} />
                                  }
                                </div>
                                <div>
                                  <p className="m-0 font-bold text-sm" style={{ color: isApprove ? "#4ab83f" : "#f97316" }}>
                                    {isApprove ? "Confirmer l'approbation" : "Confirmer le rejet"}
                                  </p>
                                  <p className="m-0 text-xs mt-0.5" style={{ color:"rgba(168,191,212,0.5)" }}>
                                    {isApprove
                                      ? `"${doc.title}" sera marqué Validé.`
                                      : `"${doc.title}" sera renvoyé En correction.`}
                                  </p>
                                </div>
                              </div>

                              {/* Comment field */}
                              <div className="mb-4">
                                <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.5px] mb-1.5"
                                  style={{ color:"rgba(168,191,212,0.55)" }}>
                                  Commentaire
                                  {!isApprove && <span style={{ color:"#f87171" }}>*</span>}
                                  {isApprove && <span className="normal-case font-normal tracking-normal ml-1" style={{ color:"rgba(168,191,212,0.35)" }}>(optionnel)</span>}
                                </label>
                                <textarea
                                  rows={3}
                                  autoFocus
                                  value={pendingAction.comment}
                                  onChange={e => setPendingAction(prev => ({ ...prev, comment: e.target.value }))}
                                  placeholder={isApprove
                                    ? "Observations, remarques positives…"
                                    : "Motif du rejet, corrections à apporter… (obligatoire)"}
                                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none outline-none transition-all"
                                  style={{
                                    background:"rgba(255,255,255,0.04)",
                                    borderColor: pendingAction.comment.trim()
                                      ? (isApprove ? "rgba(74,184,63,0.4)" : "rgba(249,115,22,0.4)")
                                      : "rgba(255,255,255,0.1)",
                                    color:"rgba(255,255,255,0.85)",
                                    minHeight:80,
                                  }}
                                />
                                {!isApprove && !pendingAction.comment.trim() && (
                                  <p className="m-0 mt-1.5 text-xs flex items-center gap-1" style={{ color:"rgba(248,113,113,0.7)" }}>
                                    <LuTriangleAlert size={11} /> Un commentaire est obligatoire pour un rejet.
                                  </p>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center justify-end gap-2.5">
                                <button onClick={() => setPendingAction(null)}
                                  className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                                  style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.6)", cursor:"pointer" }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(168,191,212,0.3)"; e.currentTarget.style.color="#fff"; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="rgba(168,191,212,0.6)"; }}>
                                  Annuler
                                </button>
                                <button
                                  disabled={!commentOk}
                                  onClick={() => handleInlineValidation(pendingAction.doc, pendingAction.nextStatus, pendingAction.comment)}
                                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold border-none transition-all"
                                  style={{
                                    background: !commentOk
                                      ? "rgba(255,255,255,0.06)"
                                      : isApprove
                                        ? "linear-gradient(135deg,#4ab83f,#3da333)"
                                        : "linear-gradient(135deg,#f97316,#ea6c0a)",
                                    color: !commentOk ? "rgba(168,191,212,0.3)" : "white",
                                    boxShadow: !commentOk ? "none" : isApprove ? "0 4px 16px rgba(74,184,63,0.35)" : "0 4px 16px rgba(249,115,22,0.35)",
                                    cursor: !commentOk ? "not-allowed" : "pointer",
                                  }}>
                                  {isApprove
                                    ? <><LuCircleCheck size={14} /> Approuver</>
                                    : <><LuCircleX     size={14} /> Confirmer le rejet</>
                                  }
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* ── History tab ───────────────────────────────── */}
              {activeTab === "history" && (
                allHistory.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3">
                    <LuInbox size={40} style={{ color:"rgba(168,191,212,0.2)" }} />
                    <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.45)" }}>
                      Aucune validation enregistrée.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border"
                    style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                    {/* header row */}
                    <div className="grid px-5 py-2.5 border-b"
                      style={{ gridTemplateColumns:"130px 160px 1fr 140px 100px 1fr", background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.07)" }}>
                      {["Date","Référence","Titre","Validateur","Décision","Commentaire"].map(h => (
                        <span key={h} className="text-[11px] font-bold uppercase tracking-[0.8px]"
                          style={{ color:"rgba(168,191,212,0.5)" }}>{h}</span>
                      ))}
                    </div>
                    {/* rows */}
                    {allHistory.map((v, i) => {
                      const dcfg = DECISION_CFG[v.decision] || DECISION_CFG["EN_ATTENTE"];
                      const DI = dcfg.Icon;
                      return (
                        <div key={v.id} className="grid px-5 py-3 items-center transition-all duration-150 cursor-pointer"
                          style={{ gridTemplateColumns:"130px 160px 1fr 140px 100px 1fr", borderBottom: i < allHistory.length-1 ? ROW_BORDER : "none" }}
                          onClick={() => setSelectedDocId(v.document_id)}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <div>
                            <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.7)" }}>
                              {new Date(v.validated_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}
                            </p>
                            <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.4)" }}>
                              {new Date(v.validated_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                            </p>
                          </div>
                          <div className="overflow-hidden pr-2">
                            <p className="m-0 text-sm font-mono font-bold truncate" style={{ color:"#4ab83f" }}>{v.doc_code}</p>
                            {v.version_letter && v.version_letter !== "-" && (
                              <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.4)" }}>v{v.version_letter}</p>
                            )}
                          </div>
                          <p className="m-0 text-sm text-white truncate pr-3">{v.doc_title || "—"}</p>
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <LuUser size={12} style={{ color:"rgba(168,191,212,0.4)", flexShrink:0 }} />
                            <span className="text-sm truncate" style={{ color:"rgba(168,191,212,0.7)" }}>{v.validator_name}</span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full border w-fit"
                            style={{ background:dcfg.bg, color:dcfg.text, borderColor:dcfg.border }}>
                            <DI size={10} /> {dcfg.label}
                          </span>
                          <p className="m-0 text-sm truncate" style={{ color:"rgba(168,191,212,0.5)" }}>
                            {v.comment || <span style={{ color:"rgba(168,191,212,0.25)" }}>—</span>}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>

      {selectedDocId && <DocDetailModal docId={selectedDocId} onClose={() => setSelectedDocId(null)} />}
      {selectedDoc && (
        <ValidationModal
          doc={selectedDoc}
          canValidate={can("validation:create")}
          onClose={() => setSelectedDoc(null)}
          onValidationAdded={load}
        />
      )}
    </div>
  );
}
