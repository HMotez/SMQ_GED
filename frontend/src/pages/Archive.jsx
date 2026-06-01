// ============================================================
// pages/Archive.jsx — EF11
// RÔLE : Page d'archivage manuel des documents.
//        Affiche les documents en statut Diffusé/Obsolète/Archivé.
//        Admin et Ing. Qualité peuvent faire progresser les documents
//        vers le statut Archivé manuellement.
//        Affiche l'historique des archivages (AUTO_ARCHIVE,
//        VERSION_SUPERSEDED, STATUS_CHANGE) avec détails complets.
//        Accessible à Admin et Ing. Qualité uniquement.
// ============================================================
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import AppSidebar from "../components/AppSidebar";
import DownloadMenu from "../components/DownloadMenu";
import {
  LuRefreshCw, LuZap, LuShare2, LuTriangleAlert, LuCircleCheckBig,
  LuFolder, LuInbox, LuLock, LuArrowLeftRight, LuFile, LuFileText, LuArchive,
  LuX, LuUser, LuClock, LuCalendar, LuTag, LuHistory,
  LuCircleCheck, LuCircleX, LuEye,
} from "react-icons/lu";
import { toast } from "sonner";
import { API, BACKEND } from "../config";
import HistoryDetailPanel from "../components/HistoryDetailPanel";

const STATUS_CFG = {
  "Diffusé":         { bg:"rgba(240,253,250,0.08)", text:"#2dd4bf", border:"rgba(153,246,228,0.15)", Icon:LuShare2        },
  "Obsolète":        { bg:"rgba(255,247,237,0.08)", text:"#fb923c", border:"rgba(254,215,170,0.15)", Icon:LuTriangleAlert },
  "Archivé":         { bg:"rgba(248,250,252,0.06)", text:"#94a3b8", border:"rgba(203,213,225,0.12)", Icon:LuArchive       },
};
const statusCfg = (name) => STATUS_CFG[name] || { bg:"rgba(240,243,246,0.06)", text:"var(--ged-tx2)", border:"rgba(255,255,255,0.1)", Icon:LuFileText };

function StatusBadge({ name }) {
  const s = statusCfg(name);
  const SI = s.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap"
      style={{ background:s.bg, color:s.text, borderColor:s.border }}>
      <SI size={11} /> {name}
    </span>
  );
}

function StatCard({ Icon, label, value, accent }) {
  const I = Icon;
  return (
    <div className="flex-1 min-w-[120px] rounded-2xl px-5 py-4 border"
      style={{ background:"var(--ged-card)", borderColor:`${accent}25`, backdropFilter:"blur(10px)" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <I size={13} style={{ color:accent }} />
        <p className="m-0 text-[11px] uppercase tracking-[0.8px] font-bold" style={{ color:"var(--ged-tx2)" }}>{label}</p>
      </div>
      <p className="m-0 font-black text-3xl text-white" style={{ letterSpacing:-0.5 }}>{value}</p>
    </div>
  );
}

/* ── Document Detail Modal ─────────────────────────────────── */
function DocDetailModal({ docId, onClose, onArchive, canArchive }) {
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
                      {doc.current_version && (
                        <span className="rounded-md px-2 py-0.5 text-xs font-bold border"
                          style={{ background:"rgba(165,180,252,0.1)", borderColor:"rgba(165,180,252,0.25)", color:"#a5b4fc" }}>
                          {doc.current_version === "-" || !doc.current_version ? "Initiale" : doc.current_version.replace(/^v/, "")}
                        </span>
                      )}
                    </div>
                    <h2 className="m-0 text-white font-bold" style={{ fontSize:20, letterSpacing:-0.3 }}>{doc.title}</h2>
                  </>
                ) : loading ? (
                  <div className="h-8 w-56 rounded-lg animate-pulse" style={{ background:"var(--ged-card-md)" }} />
                ) : null}
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
              style={{ color:"var(--ged-tx2)", background:"var(--ged-card)", border:"1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.1)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.3)"; e.currentTarget.style.color="#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; e.currentTarget.style.color="var(--ged-tx2)"; }}>
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
                    color: activeTab === tab.id ? "#fff" : "var(--ged-tx3)",
                    borderBottomColor: activeTab === tab.id ? "#4ab83f" : "transparent",
                    background: activeTab === tab.id ? "rgba(74,184,63,0.06)" : "transparent",
                    cursor:"pointer",
                  }}>
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <span className="rounded-full px-1.5 py-px text-[10px] font-black"
                      style={{
                        background: activeTab === tab.id ? "rgba(74,184,63,0.2)" : "rgba(255,255,255,0.06)",
                        color: activeTab === tab.id ? "#4ab83f" : "var(--ged-tx3)",
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
            <span className="text-sm" style={{ color:"var(--ged-tx3)" }}>Chargement…</span>
          </div>
        ) : !doc ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color:"var(--ged-tx3)" }}>Document introuvable.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-7 py-6">

            {/* ── Aperçu ─────────────────────────────────── */}
            {activeTab === "apercu" && (
              <div className="flex flex-col gap-5">
                <div className="grid gap-3" style={{ gridTemplateColumns:"repeat(3, 1fr)" }}>
                  {[
                    { Icon:LuUser,     label:"Responsable",             value:doc.responsible || "—" },
                    { Icon:LuTag,      label:"Type",                  value:doc.type_code ? `${doc.type_code}${doc.type_label ? " — " + doc.type_label : ""}` : "—" },
                    { Icon:LuFolder,   label:"Processus",             value:doc.folder_name || "—" },
                    { Icon:LuCalendar, label:"Créé le",               value:doc.created_at ? new Date(doc.created_at).toLocaleDateString("fr-FR") : "—" },
                    { Icon:LuCalendar, label:"Prochaine révision",    value:doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—" },
                    { Icon:LuFileText, label:"Origine",               value:doc.origin || "INTERNE" },
                    { Icon:LuHistory,  label:"Version",               value:doc.current_version || doc.version_letter || "—" },
                    { Icon:LuFolder,   label:"Processus stratégique", value:doc.strategic_process || "—" },
                    { Icon:LuFolder,   label:"Processus principal",   value:doc.main_process || "—" },
                    { Icon:LuUser,     label:"Créé par",              value:doc.created_by_name || "—" },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="rounded-xl px-4 py-3 border"
                      style={{ background:"rgba(255,255,255,0.025)", borderColor:"rgba(255,255,255,0.07)" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={11} style={{ color:"var(--ged-tx3)" }} />
                        <p className="m-0 text-[10px] uppercase tracking-wider font-bold" style={{ color:"var(--ged-tx3)" }}>{label}</p>
                      </div>
                      <p className="m-0 text-sm font-medium text-white truncate" title={value}>{value}</p>
                    </div>
                  ))}
                </div>

                {(doc.context || doc.description) && (
                  <div className="rounded-xl px-4 py-3.5 border"
                    style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.06)" }}>
                    <p className="m-0 text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color:"var(--ged-tx3)" }}>Description / Contexte</p>
                    <p className="m-0 text-sm leading-relaxed" style={{ color:"var(--ged-tx2)" }}>{doc.context || doc.description}</p>
                  </div>
                )}

                {doc.keywords?.length > 0 && (
                  <div>
                    <p className="m-0 text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color:"var(--ged-tx3)" }}>Mots-clés</p>
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

                {canArchive && doc.status_name === "Obsolète" && (
                  <button onClick={() => { onArchive(doc); onClose(); }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all mt-2"
                    style={{ background:"rgba(148,163,184,0.06)", borderColor:"rgba(148,163,184,0.2)", color:"#94a3b8", cursor:"pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.1)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.3)"; e.currentTarget.style.color="#f87171"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="rgba(148,163,184,0.06)"; e.currentTarget.style.borderColor="rgba(148,163,184,0.2)"; e.currentTarget.style.color="#94a3b8"; }}>
                    <LuArchive size={15} /> Archiver ce document
                  </button>
                )}
              </div>
            )}

            {/* ── Versions ───────────────────────────────── */}
            {activeTab === "versions" && (
              <div className="flex flex-col gap-3">
                {versions.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <LuHistory size={32} style={{ color:"var(--ged-tx3)" }} />
                    <p className="text-sm m-0" style={{ color:"var(--ged-tx3)" }}>Aucune version enregistrée.</p>
                  </div>
                ) : versions.map((v, idx) => {
                  const isLast  = idx === versions.length - 1;
                  return (
                  <div key={v.id} className="rounded-xl border overflow-hidden"
                    style={{ background:"rgba(255,255,255,0.02)", borderColor: isLast ? "rgba(74,184,63,0.2)" : "rgba(255,255,255,0.07)" }}>
                    <div className="px-5 py-4 flex items-center gap-4">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 w-16">
                        <span className="rounded-xl px-3 py-1 text-sm font-black border"
                          style={{ background: isLast ? "rgba(74,184,63,0.15)" : "rgba(255,255,255,0.05)", color: isLast ? "#4ab83f" : "var(--ged-tx2)", borderColor: isLast ? "rgba(74,184,63,0.3)" : "rgba(255,255,255,0.08)" }}>
                          {v.version_letter || "-"}
                        </span>
                        {isLast && (
                          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color:"#4ab83f" }}>Actuelle</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-semibold text-white">{v.change_summary || "Version initiale"}</p>
                        <p className="m-0 text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color:"var(--ged-tx3)" }}>
                          {v.created_by_name && <span className="flex items-center gap-1"><LuUser size={10} />{v.created_by_name} ·</span>}
                          <span className="flex items-center gap-1"><LuCalendar size={10} />{v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}) : "—"}</span>
                          {v.file_size > 0 && <span>· {(v.file_size/1024).toFixed(0)} Ko</span>}
                        </p>
                      </div>
                      {v.file_path && (
                        <div className="flex flex-wrap gap-2 flex-shrink-0 justify-end">
                          <button onClick={() => { setPreviewFile(v.file_path); setPreviewOpen(true); }}
                            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border font-semibold transition-all"
                            style={{ background:"rgba(96,165,250,0.06)", borderColor:"rgba(96,165,250,0.2)", color:"#60a5fa", cursor:"pointer" }}
                            onMouseEnter={e => { e.currentTarget.style.background="rgba(96,165,250,0.15)"; e.currentTarget.style.borderColor="rgba(96,165,250,0.4)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background="rgba(96,165,250,0.06)"; e.currentTarget.style.borderColor="rgba(96,165,250,0.2)"; }}>
                            <LuEye size={14} /> Consulter
                          </button>
                          <DownloadMenu filename={v.file_path} />
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
                    <LuCircleCheck size={32} style={{ color:"var(--ged-tx3)" }} />
                    <p className="text-sm m-0" style={{ color:"var(--ged-tx3)" }}>Aucune décision de validation enregistrée.</p>
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
                              style={{ background:"var(--ged-card)", color:"var(--ged-tx2)", borderColor:"var(--ged-border)" }}>
                              {v.version_letter}
                            </span>
                          )}
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color:"var(--ged-tx3)" }}>
                          {v.validated_at ? new Date(v.validated_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background:"var(--ged-card)", border:"1px solid var(--ged-border)" }}>
                          <LuUser size={13} style={{ color:"var(--ged-tx2)" }} />
                        </div>
                        <span className="text-sm font-semibold text-white">{v.validator_name}</span>
                      </div>
                      {v.comment && (
                        <div className="rounded-lg px-3 py-2.5 border mt-1"
                          style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.06)" }}>
                          <p className="m-0 text-xs leading-relaxed italic" style={{ color:"var(--ged-tx2)" }}>"{v.comment}"</p>
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
                    <LuFileText size={32} style={{ color:"var(--ged-tx3)" }} />
                    <p className="text-sm m-0" style={{ color:"var(--ged-tx3)" }}>Aucune activité enregistrée pour ce document.</p>
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
                                <span className="text-[11px] flex-shrink-0" style={{ color:"var(--ged-tx3)" }}>
                                  {event.timestamp ? new Date(event.timestamp).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}
                                </span>
                              </div>
                              {event.type === "LOG" && details.from && details.to && (
                                <p className="m-0 text-xs" style={{ color:"var(--ged-tx2)" }}>
                                  <span style={{ color:"var(--ged-tx3)" }}>{details.from}</span>
                                  {" "}<span style={{ color:cfg.text }}>→</span>{" "}
                                  <span className="font-semibold text-white">{details.to}</span>
                                </p>
                              )}
                              {event.type === "VALIDATION" && (
                                <p className="m-0 text-xs" style={{ color:"var(--ged-tx2)" }}>
                                  Par <span className="font-semibold text-white">{event.validator_name}</span>
                                  {event.version && <span style={{ color:"var(--ged-tx3)" }}> · v{event.version}</span>}
                                </p>
                              )}
                              {event.type === "VERSION" && (
                                <p className="m-0 text-xs" style={{ color:"var(--ged-tx2)" }}>
                                  <span className="font-mono font-bold" style={{ color:"#4ab83f" }}>{event.version_letter}</span>
                                  {event.change_summary && <span> · {event.change_summary}</span>}
                                </p>
                              )}
                              {event.type === "VALIDATION" && event.comment && (
                                <div className="mt-1 rounded-lg px-3 py-1.5 border"
                                  style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.05)" }}>
                                  <p className="m-0 text-xs italic" style={{ color:"var(--ged-tx2)" }}>"{event.comment}"</p>
                                </div>
                              )}
                              {event.type === "LOG" && event.user_id && (
                                <p className="m-0 mt-0.5 text-[11px] flex items-center gap-1" style={{ color:"var(--ged-tx3)" }}>
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
            <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background:"var(--ged-card)", borderColor:"var(--ged-border)" }}>
              <span className="text-sm font-semibold text-white flex items-center gap-1.5"><LuFile size={14} /> {previewFile}</span>
              <button onClick={() => { setPreviewOpen(false); setPreviewFile(null); }} style={{ color:"var(--ged-tx2)" }} onMouseEnter={e=>e.currentTarget.style.color="white"} onMouseLeave={e=>e.currentTarget.style.color="var(--ged-tx2)"}>
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

export default function Archive() {
  const { can, currentUser } = useUser();
  const [candidates,   setCandidates]   = useState([]);
  const [archived,     setArchived]     = useState([]);
  const [history,      setHistory]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("archived");
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState(null);

  const isVisitor = !currentUser;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isVisitor) {
        const arch = await axios.get(`${API}/documents/archived`);
        setArchived(arch.data);
      } else {
        const [cand, arch, hist] = await Promise.all([
          axios.get(`${API}/documents/archive-candidates`),
          axios.get(`${API}/documents/archived`),
          axios.get(`${API}/documents/archive-history`),
        ]);
        setCandidates(cand.data); setArchived(arch.data); setHistory(hist.data);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [isVisitor]);

  useEffect(() => { load(); }, [load]);

  const handleManualArchive = (doc) => {
    toast.warning(`Archiver "${doc.doc_code} — ${doc.title}" ?`, {
      description: "Cette action est irréversible.",
      duration: 8000,
      action: {
        label: "Confirmer",
        onClick: async () => {
          try {
            await axios.patch(`${API}/documents/${doc.id}/status`, { newStatus: "Archivé" });
            await load();
            toast.success("Document archivé avec succès.");
          } catch (err) {
            toast.error(err.response?.data?.error || "Erreur lors de l'archivage.");
          }
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const expiredDiffuse = candidates.filter(d => d.status_name === "Diffusé");
  const obsoletes      = candidates.filter(d => d.status_name === "Obsolète");

  const ROW_BORDER = "1px solid rgba(255,255,255,0.05)";

  const tabs = [
    { id:"archived", Icon:LuArchive,   label:"Archivés",   count:archived.length, accent:"#94a3b8" },
    ...(!isVisitor ? [{ id:"history", Icon:LuRefreshCw, label:"Historique", count:history.length, accent:"#4ab83f" }] : []),
  ];

  const sidebarBottom = (
    <>
      {[
        ...(!isVisitor ? [
          { label:"À archiver", value:expiredDiffuse.length, accent:"#f87171" },
          { label:"Obsolètes",  value:obsoletes.length,      accent:"#fb923c" },
        ] : []),
        { label:"Archivés",   value:archived.length,       accent:"#94a3b8" },
      ].map(({ label, value, accent }) => (
        <div key={label} className="flex justify-between items-center px-3 py-2 rounded-lg border"
          style={{ background:`${accent}10`, borderColor:`${accent}25` }}>
          <span className="text-sm" style={{ color:"var(--ged-tx2)" }}>{label}</span>
          <span className="font-bold text-base" style={{ color:accent }}>{value}</span>
        </div>
      ))}
    </>
  );

  /* ── Shared doc table row renderer ───────────────────────── */
  const DocRow = ({ doc, i, total, showDaysOverdue = false, showArchivedAt = false, showArchiveBtn = false }) => {
    const sc = statusCfg(doc.status_name);
    const rowBg = `${sc.text}08`;
    const rowBgHov = `${sc.text}16`;
    return (
    <div className="row-slide-in relative grid pl-7 pr-5 py-3 items-center cursor-pointer transition-all duration-200 overflow-hidden"
      style={{ gridTemplateColumns:"155px 1fr 120px 90px 120px 130px", borderBottom: i < total - 1 ? `1px solid ${sc.text}15` : "none", background: rowBg, animationDelay:`${i*0.04}s` }}
      onClick={() => setSelectedDocId(doc.id)}
      onMouseEnter={e => e.currentTarget.style.background = rowBgHov}
      onMouseLeave={e => e.currentTarget.style.background = rowBg}>
      {/* Left status bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background:`linear-gradient(to bottom,${sc.text},${sc.text}55)` }} />
      <span className="font-mono font-bold text-[13px]" style={{ color: sc.text }}>{doc.doc_code}</span>
      <div className="overflow-hidden pr-3">
        <p className="m-0 text-sm font-medium text-white truncate">{doc.title}</p>
        {doc.folder_name && (
          <p className="m-0 text-xs flex items-center gap-1" style={{ color:"var(--ged-tx3)" }}>
            <LuFolder size={10} /> {doc.folder_name}
          </p>
        )}
      </div>
      <span className="text-sm truncate" style={{ color:"var(--ged-tx2)" }}>{doc.responsible || "—"}</span>
      <span className="px-2 py-0.5 rounded-md text-xs font-semibold w-fit border"
        style={{ background:"rgba(165,180,252,0.1)", color:"#a5b4fc", borderColor:"rgba(165,180,252,0.2)" }}>
        {doc.type_code}
      </span>
      <StatusBadge name={doc.status_name} />
      <div onClick={e => showArchiveBtn && e.stopPropagation()}>
        {showDaysOverdue ? (
          <span>
            <span className="font-bold text-sm" style={{ color:"#fb923c" }}>+{doc.days_overdue ?? 0} j</span>
            <p className="m-0 text-xs" style={{ color:"var(--ged-tx3)" }}>
              {doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—"}
            </p>
          </span>
        ) : showArchiveBtn && can("archive:manage") ? (
          <button onClick={() => handleManualArchive(doc)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold border transition-all"
            style={{ background:"var(--ged-card)", borderColor:"rgba(255,255,255,0.1)", color:"var(--ged-tx2)", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.12)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.3)"; e.currentTarget.style.color="#f87171"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="var(--ged-tx2)"; }}>
            <LuArchive size={12} /> Archiver
          </button>
        ) : (
          <span className="text-sm" style={{ color:"var(--ged-tx2)" }}>
            {doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—"}
          </span>
        )}
      </div>
    </div>
    );
  };

  const TableHeader = ({ lastCol = "Révision" }) => (
    <div className="grid px-5 py-2.5 border-b"
      style={{ gridTemplateColumns:"155px 1fr 120px 90px 120px 130px", background:"var(--ged-card)", borderColor:"rgba(255,255,255,0.07)" }}>
      {["Référence", "Titre", "Responsable", "Type", "Statut", lastCol].map(h => (
        <span key={h} className="text-[11px] font-bold uppercase tracking-[0.8px]"
          style={{ color:"var(--ged-tx2)" }}>{h}</span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex"
      style={{ background: "linear-gradient(145deg,#0a1420 0%,#0f1e30 35%,#1a2f4a 70%,#1e3a55 100%)" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        @keyframes rowSlideIn { from { opacity:0; transform:translateX(-14px); } to { opacity:1; transform:translateX(0); } }
        .row-slide-in { animation: rowSlideIn 0.38s cubic-bezier(.22,.68,0,1.1) both; }
      `}</style>

      <AppSidebar user={currentUser} bottomContent={sidebarBottom} />

      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="px-8 py-4 border-b flex items-center justify-between"
          style={{ background:"var(--ged-header)", backdropFilter:"blur(20px)", borderColor:"var(--ged-border)", boxShadow:"0 1px 0 rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"linear-gradient(135deg,rgba(148,163,184,0.18),rgba(148,163,184,0.08))", border:"1.5px solid rgba(148,163,184,0.3)", boxShadow:"0 4px 14px rgba(0,0,0,0.2)" }}>
              <LuArchive size={19} style={{ color:"#94a3b8" }} />
            </div>
            <div>
              <h1 className="m-0 font-extrabold" style={{ fontSize:21, letterSpacing:"-0.022em", lineHeight:1.2, color:"var(--ged-tx1)" }}>Archivage</h1>
              <p className="m-0 text-xs mt-0.5" style={{ color:"var(--ged-tx4)" }}>
                Documents obsolètes · Aucune suppression définitive
                {activeTab === "archived"   && <span style={{ color:"#94a3b8" }}> · {archived.length} archivés</span>}

                {activeTab === "history"    && <span style={{ color:"#4ab83f" }}> · {history.length} opérations</span>}
              </p>
            </div>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold border transition-all"
            style={{ background:"var(--ged-card)", borderColor:"rgba(255,255,255,0.1)", color:"var(--ged-tx2)", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(148,163,184,0.4)"; e.currentTarget.style.color="#94a3b8"; e.currentTarget.style.background="rgba(148,163,184,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="var(--ged-tx2)"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}>
            <LuRefreshCw size={14} /> Actualiser
          </button>
        </header>

        <div className="flex-1 px-8 py-5 overflow-y-auto">

          {/* ── Stats ──────────────────────────────────────────── */}
          <div className="flex gap-4 mb-6 flex-wrap">
            {!isVisitor && <StatCard Icon={LuShare2}        label="Diffusés expirés"    value={expiredDiffuse.length} accent={expiredDiffuse.length > 0 ? "#f87171" : "#4ade80"} />}
            {!isVisitor && <StatCard Icon={LuTriangleAlert} label="En attente archivage" value={obsoletes.length}     accent={obsoletes.length > 0 ? "#fb923c" : "#4ade80"} />}
            <StatCard Icon={LuArchive}       label="Archivés (total)"     value={archived.length}      accent="#94a3b8" />
            <StatCard Icon={LuLock}          label="Aucune suppression"   value="✓"                    accent="#4ade80" />
          </div>

          {/* ── Tabs ───────────────────────────────────────────── */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {tabs.map(({ id, Icon, label, count, accent }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
                style={{
                  background:  activeTab === id ? `${accent}18`  : "rgba(255,255,255,0.04)",
                  borderColor: activeTab === id ? `${accent}40`  : "rgba(255,255,255,0.08)",
                  color:       activeTab === id ? accent          : "var(--ged-tx2)",
                  cursor: "pointer",
                }}>
                <Icon size={14} />
                {label}
                {count > 0 && (
                  <span className="rounded-full px-2 py-px text-xs font-bold"
                    style={{ background:activeTab===id?`${accent}28`:"rgba(255,255,255,0.08)", color:activeTab===id?accent:"var(--ged-tx2)" }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Content ────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <LuRefreshCw size={32} className="animate-spin" style={{ color:"rgba(74,184,63,0.4)" }} />
              <span className="text-sm" style={{ color:"var(--ged-tx2)" }}>Chargement…</span>
            </div>
          ) : (
            <>
              {/* ── Archived tab ────────────────────────────── */}
              {activeTab === "archived" && (
                archived.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3">
                    <LuArchive size={40} style={{ color:"var(--ged-tx3)" }} />
                    <p className="m-0 text-sm" style={{ color:"var(--ged-tx3)" }}>Aucun document archivé.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border"
                    style={{ background:"var(--ged-header)", borderColor:"var(--ged-border)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                    <div className="px-5 py-2.5 border-b"
                      style={{ background:"rgba(148,163,184,0.05)", borderColor:"rgba(148,163,184,0.12)" }}>
                      <p className="m-0 text-xs font-bold uppercase tracking-wider" style={{ color:"#94a3b8" }}>
                        Documents archivés — historique conservé · Cliquer pour voir les détails
                      </p>
                    </div>
                    <TableHeader lastCol="Révision" />
                    {archived.map((doc, i) => (
                      <DocRow key={doc.id} doc={doc} i={i} total={archived.length} />
                    ))}
                  </div>
                )
              )}

              {/* ── History tab ─────────────────────────────── */}
              {activeTab === "history" && (
                history.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3">
                    <LuInbox size={40} style={{ color:"var(--ged-tx3)" }} />
                    <p className="m-0 text-sm" style={{ color:"var(--ged-tx3)" }}>Aucune action d'archivage enregistrée.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border"
                    style={{ background:"var(--ged-header)", borderColor:"var(--ged-border)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                    <div className="px-5 py-2.5 border-b"
                      style={{ background:"rgba(74,184,63,0.04)", borderColor:"rgba(74,184,63,0.1)" }}>
                      <p className="m-0 text-xs font-bold uppercase tracking-wider" style={{ color:"#4ab83f" }}>
                        Journal d'archivage — cliquer sur une ligne pour voir les détails
                      </p>
                    </div>
                    {/* header */}
                    <div className="grid px-5 py-2.5 border-b"
                      style={{ gridTemplateColumns:"110px 130px 1fr 1fr 130px", background:"var(--ged-card)", borderColor:"rgba(255,255,255,0.07)" }}>
                      {["Date","Action","Référence / Titre","Détails","Utilisateur"].map(h => (
                        <span key={h} className="text-[11px] font-bold uppercase tracking-[0.8px]"
                          style={{ color:"var(--ged-tx2)" }}>{h}</span>
                      ))}
                    </div>
                    {history.map((entry, i) => {
                      const details = (() => { try { return JSON.parse(entry.details); } catch { return {}; } })();
                      const actionMeta = {
                        AUTO_ARCHIVE:       { color:"#f87171", Icon:LuZap,            label:"Archivage"         },
                        VERSION_SUPERSEDED: { color:"#fb923c", Icon:LuRefreshCw,      label:"Ver. remplacée"    },
                        STATUS_CHANGE:      { color:"#a5b4fc", Icon:LuArrowLeftRight,  label:"Chgt. statut"      },
                      }[entry.action] || { color:"#94a3b8", Icon:LuFileText, label:entry.action };
                      const AI = actionMeta.Icon;
                      return (
                        <div key={entry.id} className="grid px-5 py-3 items-center transition-all duration-150 cursor-pointer"
                          style={{ gridTemplateColumns:"110px 130px 1fr 1fr 130px", borderBottom:i<history.length-1?ROW_BORDER:"none" }}
                          onClick={() => setSelectedHistoryEntry(entry)}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(148,163,184,0.06)"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <div>
                            <p className="m-0 text-sm" style={{ color:"var(--ged-tx2)" }}>
                              {entry.created_at ? new Date(entry.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                            </p>
                            <p className="m-0 text-xs" style={{ color:"var(--ged-tx3)" }}>
                              {entry.created_at ? new Date(entry.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) : ""}
                            </p>
                          </div>
                          <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color:actionMeta.color }}>
                            <AI size={13} /> {actionMeta.label}
                          </span>
                          <div>
                            <p className="m-0 font-mono font-bold text-sm" style={{ color:"#4ab83f" }}>{entry.doc_code}</p>
                            <p className="m-0 text-xs truncate" style={{ color:"var(--ged-tx3)" }}>{entry.title}</p>
                          </div>
                          <span className="text-sm" style={{ color:"var(--ged-tx2)" }}>
                            {details.from && details.to
                              ? <>{details.from} <span style={{ color:actionMeta.color }}>→</span> {details.to}</>
                              : details.reason || details.change_summary || "—"}
                          </span>
                          <span className="text-sm" style={{ color:"var(--ged-tx2)" }}>
                            {entry.user_name || "Système"}
                          </span>
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

      {/* ── Document detail modal ──────────────────────────────── */}
      {selectedDocId && (
        <DocDetailModal
          docId={selectedDocId}
          canArchive={can("archive:manage")}
          onClose={() => setSelectedDocId(null)}
          onArchive={handleManualArchive}
        />
      )}
      {selectedHistoryEntry && (
        <HistoryDetailPanel
          type="archive"
          entry={selectedHistoryEntry}
          onClose={() => setSelectedHistoryEntry(null)}
        />
      )}
    </div>
  );
}
