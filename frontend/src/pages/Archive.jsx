// ============================================================
// Archive.jsx — EF11 — ACTIA ES · DocumentList-style layout
// ============================================================
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import AppSidebar from "../components/AppSidebar";
import {
  LuRefreshCw, LuZap, LuShare2, LuTriangleAlert, LuCircleCheckBig,
  LuFolder, LuInbox, LuLock, LuArrowLeftRight, LuFileText, LuArchive,
  LuX, LuUser, LuClock, LuDownload, LuCalendar, LuTag, LuHistory,
} from "react-icons/lu";
import { toast } from "sonner";
import { API, BACKEND } from "../config";

const STATUS_CFG = {
  "Diffusé":         { bg:"rgba(240,253,250,0.08)", text:"#2dd4bf", border:"rgba(153,246,228,0.15)", Icon:LuShare2        },
  "Obsolète":        { bg:"rgba(255,247,237,0.08)", text:"#fb923c", border:"rgba(254,215,170,0.15)", Icon:LuTriangleAlert },
  "Archivé":         { bg:"rgba(248,250,252,0.06)", text:"#94a3b8", border:"rgba(203,213,225,0.12)", Icon:LuArchive       },
};
const statusCfg = (name) => STATUS_CFG[name] || { bg:"rgba(240,243,246,0.06)", text:"rgba(168,191,212,0.6)", border:"rgba(255,255,255,0.1)", Icon:LuFileText };

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
      style={{ background:"rgba(255,255,255,0.04)", borderColor:`${accent}25`, backdropFilter:"blur(10px)" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <I size={13} style={{ color:accent }} />
        <p className="m-0 text-[11px] uppercase tracking-[0.8px] font-bold" style={{ color:"rgba(168,191,212,0.5)" }}>{label}</p>
      </div>
      <p className="m-0 font-black text-3xl text-white" style={{ letterSpacing:-0.5 }}>{value}</p>
    </div>
  );
}

/* ── Document Detail Modal ─────────────────────────────────── */
function DocDetailModal({ docId, onClose, onArchive, canArchive }) {
  const [doc,      setDoc]      = useState(null);
  const [versions, setVersions] = useState([]);
  const [archLog,  setArchLog]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [docRes, verRes, histRes] = await Promise.all([
          axios.get(`${API}/documents/${docId}`),
          axios.get(`${API}/documents/${docId}/versions`),
          axios.get(`${API}/documents/archive-history`),
        ]);
        setDoc(docRes.data);
        setVersions(verRes.data);
        // Filter history for this doc
        setArchLog((histRes.data || []).filter(e => e.doc_id === docId || e.document_id === docId));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [docId]);

  const handleDownload = async (filename) => {
    try {
      const response = await fetch(`${BACKEND}/download/${encodeURIComponent(filename)}`);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = filename;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch { toast.error("Impossible de télécharger."); }
  };

  const s = doc ? statusCfg(doc.status_name) : null;

  return (
    <div onClick={onClose} className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background:"rgba(5,12,20,0.85)", backdropFilter:"blur(8px)" }}>
      <div onClick={e => e.stopPropagation()}
        className="rounded-2xl border w-[min(860px,96vw)] max-h-[92vh] flex flex-col overflow-hidden"
        style={{ background:"#0d1f30", borderColor:"rgba(255,255,255,0.12)", boxShadow:"0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor:"rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"rgba(148,163,184,0.1)", border:"1px solid rgba(148,163,184,0.2)" }}>
              <LuArchive size={16} style={{ color:"#94a3b8" }} />
            </div>
            <div>
              {doc && (
                <>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-sm" style={{ color:"#4ab83f" }}>{doc.doc_code}</span>
                    <StatusBadge name={doc.status_name} />
                    {doc.current_version && doc.current_version !== "-" && (
                      <span className="rounded-md px-2 py-0.5 text-xs border"
                        style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.6)" }}>
                        v{doc.current_version}
                      </span>
                    )}
                  </div>
                  <p className="m-0 text-white font-semibold text-[16px]">{doc.title}</p>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 flex items-center"
            style={{ color:"rgba(168,191,212,0.5)" }}
            onMouseEnter={e => e.currentTarget.style.color = "white"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(168,191,212,0.5)"}>
            <LuX size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3">
            <LuRefreshCw size={24} className="animate-spin" style={{ color:"rgba(74,184,63,0.5)" }} />
            <span className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</span>
          </div>
        ) : !doc ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>Document introuvable.</p>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">

            {/* ── Left: doc info + actions ─────────────────── */}
            <div className="w-[260px] flex-shrink-0 border-r p-5 overflow-y-auto flex flex-col gap-4"
              style={{ borderColor:"rgba(255,255,255,0.08)" }}>

              {/* Meta info */}
              <div className="flex flex-col gap-2.5">
                {[
                  { icon:LuUser,     label:"Responsable", value:doc.responsible || "—" },
                  { icon:LuTag,      label:"Type",        value:doc.type_code || "—" },
                  { icon:LuFolder,   label:"Processus",   value:doc.folder_name || "—" },
                  { icon:LuCalendar, label:"Créé le",     value:doc.created_at ? new Date(doc.created_at).toLocaleDateString("fr-FR") : "—" },
                  { icon:LuCalendar, label:"Révision",    value:doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon size={13} style={{ color:"rgba(168,191,212,0.4)", marginTop:2, flexShrink:0 }} />
                    <div>
                      <p className="m-0 text-[10px] uppercase tracking-wider font-bold" style={{ color:"rgba(168,191,212,0.35)" }}>{label}</p>
                      <p className="m-0 text-sm text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {doc.description && (
                <div className="rounded-xl px-3.5 py-3 border"
                  style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
                  <p className="m-0 text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color:"rgba(168,191,212,0.4)" }}>Description</p>
                  <p className="m-0 text-xs leading-relaxed" style={{ color:"rgba(168,191,212,0.65)" }}>{doc.description}</p>
                </div>
              )}

              {/* Archive action */}
              {canArchive && doc.status_name === "Obsolète" && (
                <button onClick={() => { onArchive(doc); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm border transition-all"
                  style={{ background:"rgba(148,163,184,0.08)", borderColor:"rgba(148,163,184,0.25)", color:"#94a3b8", cursor:"pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.1)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.3)"; e.currentTarget.style.color="#f87171"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="rgba(148,163,184,0.08)"; e.currentTarget.style.borderColor="rgba(148,163,184,0.25)"; e.currentTarget.style.color="#94a3b8"; }}>
                  <LuArchive size={14} /> Archiver ce document
                </button>
              )}
            </div>

            {/* ── Right: versions + archive log ────────────── */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">

              {/* Versions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-0.5 h-3.5 rounded-full" style={{ background:"#4ab83f" }} />
                  <p className="m-0 text-xs font-bold uppercase tracking-wider" style={{ color:"rgba(168,191,212,0.6)" }}>
                    Historique des versions
                  </p>
                  {versions.length > 0 && (
                    <span className="ml-auto rounded-full px-2 py-px text-xs font-bold"
                      style={{ background:"rgba(74,184,63,0.15)", color:"#4ab83f" }}>{versions.length}</span>
                  )}
                </div>
                {versions.length === 0 ? (
                  <p className="text-xs" style={{ color:"rgba(168,191,212,0.4)" }}>Aucune version.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {versions.map(v => (
                      <div key={v.id} className="rounded-xl px-4 py-3 border flex items-center gap-3"
                        style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
                        <span className="rounded-lg px-2 py-0.5 text-xs font-bold border flex-shrink-0"
                          style={{ background:"rgba(74,184,63,0.1)", color:"#4ab83f", borderColor:"rgba(74,184,63,0.2)" }}>
                          v{v.version_letter}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="m-0 text-sm text-white truncate">{v.change_summary || "—"}</p>
                          <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>
                            {v.created_by_name && <span>{v.created_by_name} · </span>}
                            {v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR", {day:"2-digit",month:"short",year:"numeric"}) : "—"}
                          </p>
                        </div>
                        {v.file_path && (
                          <button onClick={() => handleDownload(v.file_path.split("/").pop() || v.file_path)}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border flex-shrink-0"
                            style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.6)", cursor:"pointer" }}
                            onMouseEnter={e => { e.currentTarget.style.color="#4ab83f"; e.currentTarget.style.borderColor="rgba(74,184,63,0.3)"; }}
                            onMouseLeave={e => { e.currentTarget.style.color="rgba(168,191,212,0.6)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; }}>
                            <LuDownload size={11} /> Télécharger
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Archive log */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-0.5 h-3.5 rounded-full" style={{ background:"#94a3b8" }} />
                  <p className="m-0 text-xs font-bold uppercase tracking-wider" style={{ color:"rgba(168,191,212,0.6)" }}>
                    Journal d'archivage (EF11)
                  </p>
                  {archLog.length > 0 && (
                    <span className="ml-auto rounded-full px-2 py-px text-xs font-bold"
                      style={{ background:"rgba(148,163,184,0.15)", color:"#94a3b8" }}>{archLog.length}</span>
                  )}
                </div>
                {archLog.length === 0 ? (
                  <p className="text-xs" style={{ color:"rgba(168,191,212,0.4)" }}>Aucune opération enregistrée pour ce document.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {archLog.map((entry, i) => {
                      const details = (() => { try { return JSON.parse(entry.details); } catch { return {}; } })();
                      const actionMeta = {
                        AUTO_ARCHIVE:       { color:"#f87171", Icon:LuZap,           label:"Archivage auto"    },
                        VERSION_SUPERSEDED: { color:"#fb923c", Icon:LuHistory,       label:"Version remplacée" },
                        STATUS_CHANGE:      { color:"#a5b4fc", Icon:LuArrowLeftRight, label:"Changement statut" },
                      }[entry.action] || { color:"#94a3b8", Icon:LuFileText, label:entry.action };
                      const AI = actionMeta.Icon;
                      return (
                        <div key={entry.id || i} className="rounded-xl px-4 py-3 border"
                          style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color:actionMeta.color }}>
                              <AI size={12} /> {actionMeta.label}
                            </span>
                            <span className="text-xs" style={{ color:"rgba(168,191,212,0.4)" }}>
                              {entry.created_at ? new Date(entry.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}
                            </span>
                          </div>
                          <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.65)" }}>
                            {details.from && details.to
                              ? <>{details.from} <span style={{ color:actionMeta.color }}>→</span> {details.to}</>
                              : details.reason || details.change_summary || "—"}
                          </p>
                          {entry.user_name && (
                            <p className="m-0 mt-1 text-xs flex items-center gap-1" style={{ color:"rgba(168,191,212,0.4)" }}>
                              <LuUser size={10} /> {entry.user_name}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Archive() {
  const { can, currentUser } = useUser();
  const [candidates,   setCandidates]   = useState([]);
  const [archived,     setArchived]     = useState([]);
  const [history,      setHistory]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("archived");
  const [selectedDocId, setSelectedDocId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cand, arch, hist] = await Promise.all([
        axios.get(`${API}/documents/archive-candidates`),
        axios.get(`${API}/documents/archived`),
        axios.get(`${API}/documents/archive-history`),
      ]);
      setCandidates(cand.data); setArchived(arch.data); setHistory(hist.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

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
    { id:"candidates", Icon:LuTriangleAlert, label:"Candidats",       count:expiredDiffuse.length + obsoletes.length, accent:"#fb923c" },
    { id:"archived",   Icon:LuArchive,       label:"Archivés",        count:archived.length,                          accent:"#94a3b8" },
    { id:"history",    Icon:LuRefreshCw,     label:"Historique EF11", count:history.length,                           accent:"#4ab83f" },
  ];

  const sidebarBottom = (
    <>
      {[
        { label:"À archiver", value:expiredDiffuse.length, accent:"#f87171" },
        { label:"Obsolètes",  value:obsoletes.length,      accent:"#fb923c" },
        { label:"Archivés",   value:archived.length,       accent:"#94a3b8" },
      ].map(({ label, value, accent }) => (
        <div key={label} className="flex justify-between items-center px-3 py-2 rounded-lg border"
          style={{ background:`${accent}10`, borderColor:`${accent}25` }}>
          <span className="text-sm" style={{ color:"rgba(168,191,212,0.6)" }}>{label}</span>
          <span className="font-bold text-base" style={{ color:accent }}>{value}</span>
        </div>
      ))}
    </>
  );

  /* ── Shared doc table row renderer ───────────────────────── */
  const DocRow = ({ doc, i, total, showDaysOverdue = false, showArchivedAt = false, showArchiveBtn = false }) => (
    <div className="grid px-5 py-3 items-center cursor-pointer transition-all duration-150"
      style={{ gridTemplateColumns:"155px 1fr 120px 90px 120px 130px", borderBottom: i < total - 1 ? ROW_BORDER : "none", background:"transparent" }}
      onClick={() => setSelectedDocId(doc.id)}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <span className="font-mono font-bold text-[13px]" style={{ color:"#4ab83f" }}>{doc.doc_code}</span>
      <div className="overflow-hidden pr-3">
        <p className="m-0 text-sm font-medium text-white truncate">{doc.title}</p>
        {doc.folder_name && (
          <p className="m-0 text-xs flex items-center gap-1" style={{ color:"rgba(168,191,212,0.45)" }}>
            <LuFolder size={10} /> {doc.folder_name}
          </p>
        )}
      </div>
      <span className="text-sm truncate" style={{ color:"rgba(168,191,212,0.6)" }}>{doc.responsible || "—"}</span>
      <span className="px-2 py-0.5 rounded-md text-xs font-semibold w-fit border"
        style={{ background:"rgba(165,180,252,0.1)", color:"#a5b4fc", borderColor:"rgba(165,180,252,0.2)" }}>
        {doc.type_code}
      </span>
      <StatusBadge name={doc.status_name} />
      <div onClick={e => showArchiveBtn && e.stopPropagation()}>
        {showDaysOverdue ? (
          <span>
            <span className="font-bold text-sm" style={{ color:"#fb923c" }}>+{doc.days_overdue ?? 0} j</span>
            <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>
              {doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—"}
            </p>
          </span>
        ) : showArchiveBtn && can("archive:manage") ? (
          <button onClick={() => handleManualArchive(doc)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold border transition-all"
            style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.7)", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.12)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.3)"; e.currentTarget.style.color="#f87171"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="rgba(168,191,212,0.7)"; }}>
            <LuArchive size={12} /> Archiver
          </button>
        ) : (
          <span className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>
            {doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—"}
          </span>
        )}
      </div>
    </div>
  );

  const TableHeader = ({ lastCol = "Révision" }) => (
    <div className="grid px-5 py-2.5 border-b"
      style={{ gridTemplateColumns:"155px 1fr 120px 90px 120px 130px", background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.07)" }}>
      {["Référence", "Titre", "Responsable", "Type", "Statut", lastCol].map(h => (
        <span key={h} className="text-[11px] font-bold uppercase tracking-[0.8px]"
          style={{ color:"rgba(168,191,212,0.5)" }}>{h}</span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex"
      style={{ background:"linear-gradient(145deg,#0a1420 0%,#0f1e30 35%,#1a2f4a 70%,#1e3a55 100%)" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
      `}</style>

      <AppSidebar user={currentUser} bottomContent={sidebarBottom} />

      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="px-8 py-4 border-b flex items-center justify-between"
          style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(20px)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 1px 0 rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"linear-gradient(135deg,rgba(148,163,184,0.18),rgba(148,163,184,0.08))", border:"1.5px solid rgba(148,163,184,0.3)", boxShadow:"0 4px 14px rgba(0,0,0,0.2)" }}>
              <LuArchive size={19} style={{ color:"#94a3b8" }} />
            </div>
            <div>
              <h1 className="m-0 font-extrabold text-white" style={{ fontSize:21, letterSpacing:"-0.022em", lineHeight:1.2 }}>Archivage</h1>
              <p className="m-0 text-xs mt-0.5" style={{ color:"rgba(168,191,212,0.48)" }}>
                EF11 — Documents obsolètes · Aucune suppression définitive
                {activeTab === "archived"   && <span style={{ color:"#94a3b8" }}> · {archived.length} archivés</span>}
                {activeTab === "candidates" && <span style={{ color:"#fb923c" }}> · {expiredDiffuse.length + obsoletes.length} en attente</span>}
                {activeTab === "history"    && <span style={{ color:"#4ab83f" }}> · {history.length} opérations</span>}
              </p>
            </div>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold border transition-all"
            style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.6)", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(148,163,184,0.4)"; e.currentTarget.style.color="#94a3b8"; e.currentTarget.style.background="rgba(148,163,184,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="rgba(168,191,212,0.6)"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}>
            <LuRefreshCw size={14} /> Actualiser
          </button>
        </header>

        <div className="flex-1 px-8 py-5 overflow-y-auto">

          {/* ── Stats ──────────────────────────────────────────── */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <StatCard Icon={LuShare2}        label="Diffusés expirés"    value={expiredDiffuse.length} accent={expiredDiffuse.length > 0 ? "#f87171" : "#4ade80"} />
            <StatCard Icon={LuTriangleAlert} label="En attente archivage" value={obsoletes.length}     accent={obsoletes.length > 0 ? "#fb923c" : "#4ade80"} />
            <StatCard Icon={LuArchive}       label="Archivés (total)"     value={archived.length}      accent="#94a3b8" />
            <StatCard Icon={LuLock}          label="Aucune suppression"   value="EF11"                 accent="#4ade80" />
          </div>

          {/* ── Tabs ───────────────────────────────────────────── */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {tabs.map(({ id, Icon, label, count, accent }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
                style={{
                  background:  activeTab === id ? `${accent}18`  : "rgba(255,255,255,0.04)",
                  borderColor: activeTab === id ? `${accent}40`  : "rgba(255,255,255,0.08)",
                  color:       activeTab === id ? accent          : "rgba(168,191,212,0.6)",
                  cursor: "pointer",
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
            <div className="flex flex-col items-center gap-3 py-16">
              <LuRefreshCw size={32} className="animate-spin" style={{ color:"rgba(74,184,63,0.4)" }} />
              <span className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</span>
            </div>
          ) : (
            <>
              {/* ── Candidates tab ──────────────────────────── */}
              {activeTab === "candidates" && (
                expiredDiffuse.length === 0 && obsoletes.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3">
                    <LuCircleCheckBig size={40} style={{ color:"rgba(168,191,212,0.2)" }} />
                    <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.45)" }}>Aucun document en attente d'archivage.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {expiredDiffuse.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-block w-[3px] h-4 rounded-full" style={{ background:"#f87171" }} />
                          <p className="m-0 text-white font-semibold text-sm">Documents diffusés expirés</p>
                          <span className="ml-1 text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>{expiredDiffuse.length} document(s) dont la date de révision est dépassée</span>
                        </div>
                        <div className="rounded-2xl overflow-hidden border"
                          style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(248,113,113,0.15)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                          <TableHeader lastCol="Retard (j)" />
                          {expiredDiffuse.map((doc, i) => (
                            <DocRow key={doc.id} doc={doc} i={i} total={expiredDiffuse.length} showDaysOverdue />
                          ))}
                        </div>
                      </div>
                    )}
                    {obsoletes.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-block w-[3px] h-4 rounded-full" style={{ background:"#fb923c" }} />
                          <p className="m-0 text-white font-semibold text-sm">Documents obsolètes — en attente d'archivage</p>
                          <span className="ml-1 text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>{obsoletes.length} document(s) à archiver manuellement</span>
                        </div>
                        <div className="rounded-2xl overflow-hidden border"
                          style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(251,146,60,0.15)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                          <TableHeader lastCol="Action" />
                          {obsoletes.map((doc, i) => (
                            <DocRow key={doc.id} doc={doc} i={i} total={obsoletes.length} showArchiveBtn />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* ── Archived tab ────────────────────────────── */}
              {activeTab === "archived" && (
                archived.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3">
                    <LuArchive size={40} style={{ color:"rgba(168,191,212,0.2)" }} />
                    <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.45)" }}>Aucun document archivé.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border"
                    style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
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
                    <LuInbox size={40} style={{ color:"rgba(168,191,212,0.2)" }} />
                    <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.45)" }}>Aucune action d'archivage enregistrée.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border"
                    style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                    <div className="px-5 py-2.5 border-b"
                      style={{ background:"rgba(74,184,63,0.04)", borderColor:"rgba(74,184,63,0.1)" }}>
                      <p className="m-0 text-xs font-bold uppercase tracking-wider" style={{ color:"#4ab83f" }}>
                        Journal d'archivage (EF11) — toutes les opérations
                      </p>
                    </div>
                    {/* header */}
                    <div className="grid px-5 py-2.5 border-b"
                      style={{ gridTemplateColumns:"110px 130px 1fr 1fr 130px", background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.07)" }}>
                      {["Date","Action","Référence / Titre","Détails","Utilisateur"].map(h => (
                        <span key={h} className="text-[11px] font-bold uppercase tracking-[0.8px]"
                          style={{ color:"rgba(168,191,212,0.5)" }}>{h}</span>
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
                        <div key={entry.id} className="grid px-5 py-3 items-center transition-all duration-150"
                          style={{ gridTemplateColumns:"110px 130px 1fr 1fr 130px", borderBottom:i<history.length-1?ROW_BORDER:"none" }}>
                          <div>
                            <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.6)" }}>
                              {entry.created_at ? new Date(entry.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                            </p>
                            <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.35)" }}>
                              {entry.created_at ? new Date(entry.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) : ""}
                            </p>
                          </div>
                          <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color:actionMeta.color }}>
                            <AI size={13} /> {actionMeta.label}
                          </span>
                          <div>
                            <p className="m-0 font-mono font-bold text-sm" style={{ color:"#4ab83f" }}>{entry.doc_code}</p>
                            <p className="m-0 text-xs truncate" style={{ color:"rgba(168,191,212,0.45)" }}>{entry.title}</p>
                          </div>
                          <span className="text-sm" style={{ color:"rgba(168,191,212,0.55)" }}>
                            {details.from && details.to
                              ? <>{details.from} <span style={{ color:actionMeta.color }}>→</span> {details.to}</>
                              : details.reason || details.change_summary || "—"}
                          </span>
                          <span className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>
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
    </div>
  );
}
