// ============================================================
// Archive.jsx — EF11 — ACTIA ES · Dark Login-Style Premium Design
// ============================================================
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import UserSelector from "../components/UserSelector";
import AppSidebar from "../components/AppSidebar";
import {
  LuRefreshCw, LuZap, LuShare2, LuTriangleAlert, LuCircleCheckBig,
  LuFolder, LuInbox, LuLock, LuArrowLeftRight, LuFileText, LuArchive,
} from "react-icons/lu";
import { toast } from "sonner";

import { API } from "../config";

const STATUS_CFG = {
  "Diffusé":  { bg:"rgba(240,253,250,0.08)", text:"#2dd4bf", border:"rgba(153,246,228,0.15)", Icon:LuShare2        },
  "Obsolète": { bg:"rgba(255,247,237,0.08)", text:"#fb923c", border:"rgba(254,215,170,0.15)", Icon:LuTriangleAlert },
  "Archivé":  { bg:"rgba(248,250,252,0.06)", text:"#94a3b8", border:"rgba(203,213,225,0.12)", Icon:LuArchive       },
};
const statusCfg = (name) => STATUS_CFG[name] || { bg:"rgba(240,243,246,0.06)", text:"rgba(168,191,212,0.6)", border:"rgba(255,255,255,0.1)", Icon:LuFileText };

/* ── Status badge ─────────────────────────────────────────── */
function StatusBadge({ name }) {
  const s = statusCfg(name);
  const SI = s.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border" style={{ background:s.bg, color:s.text, borderColor:s.border }}>
      <SI size={11} /> {name}
    </span>
  );
}

/* ── Stat card (dark) ─────────────────────────────────────── */
function StatCard({ Icon, label, value, accent }) {
  const I = Icon;
  return (
    <div className="flex-1 min-w-[120px] rounded-2xl px-5 py-4 border" style={{ background:"rgba(255,255,255,0.04)", borderColor:`${accent}25`, backdropFilter:"blur(10px)" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <I size={13} style={{ color:accent }} />
        <p className="m-0 text-[11px] uppercase tracking-[0.8px] font-bold" style={{ color:"rgba(168,191,212,0.5)" }}>{label}</p>
      </div>
      <p className="m-0 font-black text-3xl text-white" style={{ letterSpacing:-0.5 }}>{value}</p>
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────── */
function Empty({ Icon = LuInbox, message }) {
  const I = Icon;
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      <I size={40} style={{ color:"rgba(168,191,212,0.2)" }} />
      <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.45)" }}>{message}</p>
    </div>
  );
}

/* ── Section block ────────────────────────────────────────── */
function Section({ title, subtitle, accentColor="#4ab83f", children }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="inline-block w-[3px] h-4 rounded-full flex-shrink-0" style={{ background:accentColor }} />
        <p className="m-0 text-white font-semibold text-sm">{title}</p>
      </div>
      <p className="m-0 mb-3 pl-[13px] text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>{subtitle}</p>
      {children}
    </div>
  );
}

/* ── Document table (dark) ────────────────────────────────── */
function DocTable({ docs, action, showDaysOverdue=false, showArchivedAt=false }) {
  const lastCol = showDaysOverdue ? "Retard (j)" : showArchivedAt ? "Archivé" : "Révision";
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
      <div className="grid px-5 py-2.5 border-b" style={{ gridTemplateColumns:"150px 1fr 120px 110px 120px 130px", background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.07)" }}>
        {["Référence","Titre","Responsable","Type","Statut",lastCol].map(h => (
          <span key={h} className="text-[11px] font-bold uppercase tracking-[0.8px]" style={{ color:"rgba(168,191,212,0.5)" }}>{h}</span>
        ))}
      </div>
      {docs.map((doc, i) => (
        <div key={doc.id} className="grid px-5 py-3 items-center" style={{ gridTemplateColumns:"150px 1fr 120px 110px 120px 130px", borderBottom:i<docs.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
          <span className="font-mono font-bold text-[13px]" style={{ color:"#4ab83f" }}>{doc.doc_code}</span>
          <div className="overflow-hidden pr-3">
            <p className="m-0 text-sm font-medium text-white truncate">{doc.title}</p>
            {doc.folder_name && (
              <p className="m-0 text-xs flex items-center gap-1" style={{ color:"rgba(168,191,212,0.45)" }}><LuFolder size={10} /> {doc.folder_name}</p>
            )}
          </div>
          <span className="text-sm truncate" style={{ color:"rgba(168,191,212,0.6)" }}>{doc.responsible||"—"}</span>
          <span className="px-2 py-0.5 rounded-md text-[13px] font-semibold w-fit border" style={{ background:"rgba(165,180,252,0.1)", color:"#a5b4fc", borderColor:"rgba(165,180,252,0.2)" }}>{doc.type_code}</span>
          <StatusBadge name={doc.status_name} />
          <div>
            {showDaysOverdue ? (
              <span>
                <span className="font-bold text-sm" style={{ color:"#fb923c" }}>+{doc.days_overdue??0} j</span>
                <p className="m-0 mt-0.5 text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>{doc.next_review_date?new Date(doc.next_review_date).toLocaleDateString("fr-FR"):"—"}</p>
              </span>
            ) : action ? action(doc) : (
              <span className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>{doc.next_review_date?new Date(doc.next_review_date).toLocaleDateString("fr-FR"):"—"}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Archive() {
  const { can, currentUser } = useUser();
  const [candidates, setCandidates] = useState([]);
  const [archived,   setArchived]   = useState([]);
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("candidates");

  const load = async () => {
    setLoading(true);
    try {
      const [cand, arch, hist] = await Promise.all([
        axios.get(`${API}/documents/archive-candidates`),
        axios.get(`${API}/documents/archived`),
        axios.get(`${API}/documents/archive-history`),
      ]);
      setCandidates(cand.data); setArchived(arch.data); setHistory(hist.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

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

  const expiredDiffuse = candidates.filter(d => d.status_name==="Diffusé");
  const obsoletes      = candidates.filter(d => d.status_name==="Obsolète");

  /* ── Sidebar ──────────────────────────────────────────────── */
  const sidebarBottom = (
    <>
      {[
        { label:"À archiver", value:expiredDiffuse.length, accent:"#f87171"  },
        { label:"Obsolètes",  value:obsoletes.length,      accent:"#fb923c"  },
        { label:"Archivés",   value:archived.length,       accent:"#94a3b8"  },
      ].map(({ label, value, accent }) => (
        <div key={label} className="flex justify-between items-center px-3 py-2 rounded-lg border" style={{ background:`${accent}10`, borderColor:`${accent}25` }}>
          <span className="text-sm" style={{ color:"rgba(168,191,212,0.6)" }}>{label}</span>
          <span className="font-bold text-base" style={{ color:accent }}>{value}</span>
        </div>
      ))}
      <UserSelector />
    </>
  );

  const tabBtn = (id, TabIcon, label, count) => (
    <button key={id} onClick={() => setActiveTab(id)}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
      style={{
        background:  activeTab===id ? "rgba(74,184,63,0.12)"  : "rgba(255,255,255,0.04)",
        borderColor: activeTab===id ? "rgba(74,184,63,0.28)"  : "rgba(255,255,255,0.08)",
        color:       activeTab===id ? "#4ab83f"               : "rgba(168,191,212,0.6)",
        cursor: "pointer",
      }}>
      <TabIcon size={14} />
      {label}
      {count > 0 && (
        <span className="rounded-full px-2 py-px text-xs font-bold" style={{ background:activeTab===id?"rgba(74,184,63,0.18)":"rgba(255,255,255,0.08)", color:activeTab===id?"#4ab83f":"rgba(168,191,212,0.6)" }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex" style={{ background:"linear-gradient(145deg,#0a1420 0%,#0f1e30 35%,#1a2f4a 70%,#1e3a55 100%)" }}>
      <AppSidebar user={currentUser} bottomContent={sidebarBottom} />

      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Header ────────────────────────────────────────── */}
        <header className="px-9 py-4 border-b flex items-center justify-between"
          style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(20px)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 1px 0 rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"linear-gradient(135deg,rgba(148,163,184,0.18),rgba(148,163,184,0.08))", border:"1.5px solid rgba(148,163,184,0.3)", boxShadow:"0 4px 14px rgba(0,0,0,0.2)" }}>
              <LuArchive size={19} style={{ color:"#94a3b8" }} />
            </div>
            <div>
              <h1 className="m-0 font-extrabold text-white" style={{ fontSize:21, letterSpacing:"-0.022em", lineHeight:1.2 }}>Archivage</h1>
              <p className="m-0 text-xs mt-0.5" style={{ color:"rgba(168,191,212,0.48)" }}>EF11 — Documents obsolètes · Aucune suppression définitive</p>
            </div>
          </div>
        </header>

        <div className="flex-1 px-9 py-6 overflow-y-auto">

          {/* Stats */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <StatCard Icon={LuShare2}        label="Diffusés expirés"    value={expiredDiffuse.length} accent={expiredDiffuse.length>0?"#f87171":"#4ade80"} />
            <StatCard Icon={LuTriangleAlert} label="En attente archivage" value={obsoletes.length}     accent={obsoletes.length>0?"#fb923c":"#4ade80"} />
            <StatCard Icon={LuArchive}       label="Archivés (total)"     value={archived.length}      accent="#94a3b8" />
            <StatCard Icon={LuLock}          label="Aucune suppression"   value="EF11"                 accent="#4ade80" />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {tabBtn("candidates", LuTriangleAlert, "Candidats",       expiredDiffuse.length+obsoletes.length)}
            {tabBtn("archived",   LuArchive,       "Archivés",        archived.length)}
            {tabBtn("history",    LuRefreshCw,     "Historique EF11", history.length)}
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <LuRefreshCw size={32} className="animate-spin" style={{ color:"rgba(74,184,63,0.4)" }} />
              <span className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</span>
            </div>
          ) : (
            <>
              {/* Candidates tab */}
              {activeTab === "candidates" && (
                expiredDiffuse.length===0 && obsoletes.length===0
                  ? <Empty Icon={LuCircleCheckBig} message="Aucun document en attente d'archivage." />
                  : (
                    <>
                      {expiredDiffuse.length > 0 && (
                        <Section title="Documents diffusés expirés" subtitle={`${expiredDiffuse.length} document(s) dont la date de révision est dépassée`} accentColor="#f87171">
                          <DocTable docs={expiredDiffuse} showDaysOverdue />
                        </Section>
                      )}
                      {obsoletes.length > 0 && (
                        <Section title="Documents obsolètes — en attente d'archivage définitif" subtitle={`${obsoletes.length} document(s) à archiver manuellement`} accentColor="#fb923c">
                          <DocTable docs={obsoletes} action={(doc) => can("archive:manage") ? (
                            <button onClick={() => handleManualArchive(doc)}
                              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold border transition-all"
                              style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.7)", cursor:"pointer" }}
                              onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.12)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.3)"; e.currentTarget.style.color="#f87171"; }}
                              onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="rgba(168,191,212,0.7)"; }}>
                              <LuArchive size={12} /> Archiver
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-sm" style={{ color:"rgba(168,191,212,0.35)" }}><LuLock size={11} /> Non autorisé</span>
                          )} />
                        </Section>
                      )}
                    </>
                  )
              )}

              {/* Archived tab */}
              {activeTab === "archived" && (
                archived.length === 0
                  ? <Empty Icon={LuArchive} message="Aucun document archivé." />
                  : (
                    <Section title="Documents archivés — historique conservé" subtitle="Aucun document supprimé définitivement — conformité EF11" accentColor="#94a3b8">
                      <DocTable docs={archived} showArchivedAt />
                    </Section>
                  )
              )}

              {/* History tab */}
              {activeTab === "history" && (
                history.length === 0
                  ? <Empty Icon={LuInbox} message="Aucune action d'archivage enregistrée." />
                  : (
                    <Section title="Journal d'archivage (EF11)" subtitle="Toutes les opérations : versions remplacées, changements de statut" accentColor="#4ab83f">
                      <div className="rounded-2xl overflow-hidden border" style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                        {history.map((entry, i) => {
                          const details = (() => { try { return JSON.parse(entry.details); } catch { return {}; } })();
                          const actionMeta = {
                            AUTO_ARCHIVE:       { color:"#f87171", Icon:LuZap,            label:"Archivage"         },
                            VERSION_SUPERSEDED: { color:"#fb923c", Icon:LuRefreshCw,      label:"Version remplacée" },
                            STATUS_CHANGE:      { color:"#a5b4fc", Icon:LuArrowLeftRight,  label:"Changement statut" },
                          }[entry.action] || { color:"#94a3b8", Icon:LuFileText, label:entry.action };
                          const ActionIcon = actionMeta.Icon;

                          return (
                            <div key={entry.id} className="grid px-5 py-3 items-center" style={{ gridTemplateColumns:"120px 130px 1fr 1fr 140px", borderBottom:i<history.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                              <span className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>
                                {entry.created_at?new Date(entry.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}):"—"}
                              </span>
                              <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color:actionMeta.color }}>
                                <ActionIcon size={13} /> {actionMeta.label}
                              </span>
                              <div>
                                <p className="m-0 font-mono font-bold text-sm" style={{ color:"#4ab83f" }}>{entry.doc_code}</p>
                                <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>{entry.title}</p>
                              </div>
                              <span className="text-sm" style={{ color:"rgba(168,191,212,0.55)" }}>
                                {details.from&&details.to ? <>{details.from} <span style={{ color:actionMeta.color }}>→</span> {details.to}</> : details.reason||details.change_summary||"—"}
                              </span>
                              <span className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>{entry.user_name||"Système"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </Section>
                  )
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
