// ============================================================
// Validations.jsx — ACTIA ES · Dark Login-Style Premium Design
// ============================================================
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import UserSelector from "../components/UserSelector";
import AppSidebar from "../components/AppSidebar";
import {
  LuRefreshCw, LuCircleCheck, LuCircleX, LuClock,
  LuPencil, LuPenLine, LuEye, LuCircleCheckBig, LuShare2, LuTriangleAlert,
  LuUser, LuInbox, LuLock, LuClipboardCheck, LuArchive, LuFileText,
} from "react-icons/lu";

import { API } from "../config";

const STATUS_CFG = {
  "Brouillon":     { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)", Icon:LuPencil         },
  "En rédaction":  { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(187,247,208,0.15)", Icon:LuPenLine        },
  "En relecture":  { bg:"rgba(239,246,255,0.08)", text:"#60a5fa", border:"rgba(191,219,254,0.15)", Icon:LuEye            },
  "En validation": { bg:"rgba(238,242,255,0.08)", text:"#a5b4fc", border:"rgba(199,210,254,0.15)", Icon:LuClipboardCheck },
  "Validé":        { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(134,239,172,0.2)",  Icon:LuCircleCheckBig },
  "Diffusé":       { bg:"rgba(240,253,250,0.08)", text:"#2dd4bf", border:"rgba(153,246,228,0.15)", Icon:LuShare2         },
  "Obsolète":      { bg:"rgba(255,247,237,0.08)", text:"#fb923c", border:"rgba(254,215,170,0.15)", Icon:LuTriangleAlert  },
  "Archivé":       { bg:"rgba(248,250,252,0.06)", text:"#94a3b8", border:"rgba(203,213,225,0.12)", Icon:LuArchive        },
};

const DECISION_CFG = {
  "APPROUVÉ":   { bg:"rgba(240,253,244,0.12)", text:"#4ade80", border:"rgba(134,239,172,0.25)", Icon:LuCircleCheck, label:"Approuvé"   },
  "REJETÉ":     { bg:"rgba(254,242,242,0.12)", text:"#f87171", border:"rgba(252,165,165,0.25)", Icon:LuCircleX,     label:"Rejeté"     },
  "EN_ATTENTE": { bg:"rgba(238,242,255,0.12)", text:"#a5b4fc", border:"rgba(165,180,252,0.25)", Icon:LuClock,       label:"En attente" },
};

/* ── Status badge ─────────────────────────────────────────── */
function StatusBadge({ name }) {
  const s = STATUS_CFG[name] || { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)", Icon:LuFileText };
  const SI = s.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap" style={{ background:s.bg, color:s.text, borderColor:s.border }}>
      <SI size={11} /> {name}
    </span>
  );
}

/* ── Decision badge ───────────────────────────────────────── */
function DecisionBadge({ decision }) {
  const d = DECISION_CFG[decision] || DECISION_CFG["EN_ATTENTE"];
  const DI = d.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border" style={{ background:d.bg, color:d.text, borderColor:d.border }}>
      <DI size={11} /> {d.label}
    </span>
  );
}

/* ── Stat card (dark) ─────────────────────────────────────── */
function StatCard({ Icon, label, value, accent }) {
  return (
    <div className="flex-1 min-w-[120px] rounded-2xl px-5 py-4 border" style={{ background:"rgba(255,255,255,0.04)", borderColor:`${accent}25`, backdropFilter:"blur(10px)" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} style={{ color:accent }} />
        <p className="m-0 text-[11px] uppercase tracking-[0.8px] font-bold" style={{ color:"rgba(168,191,212,0.5)" }}>{label}</p>
      </div>
      <p className="m-0 font-black text-3xl text-white" style={{ letterSpacing:-0.5 }}>{value}</p>
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────── */
function Empty({ Icon = LuInbox, message }) {
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      <Icon size={40} style={{ color:"rgba(168,191,212,0.2)" }} />
      <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.45)" }}>{message}</p>
    </div>
  );
}

/* ── Validation modal (dark) ──────────────────────────────── */
function ValidationModal({ doc, users, canValidate=false, onClose, onValidationAdded }) {
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ validatorId:"", comment:"", decision:"EN_ATTENTE" });
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try { const res = await axios.get(`${API}/validations/document/${doc.id}`); setHistory(res.data.validations||[]); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  }, [doc.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setSuccess(null); setSubmitting(true);
    try {
      const payload = { validatorId:form.validatorId?parseInt(form.validatorId):undefined, validatorName:form.validatorId?users.find(u=>u.id===parseInt(form.validatorId))?.name||"":"", comment:form.comment, decision:form.decision };
      await axios.post(`${API}/validations/document/${doc.id}`, payload);
      setSuccess("Validation enregistrée avec succès.");
      setForm({ validatorId:"", comment:"", decision:"EN_ATTENTE" });
      await loadHistory(); onValidationAdded();
    } catch (err) { const data=err.response?.data; setError(data?.debug||data?.error||"Erreur lors de l'enregistrement."); }
    finally { setSubmitting(false); }
  };

  const DECISION_OPTS = [
    { value:"APPROUVÉ",   cfg:DECISION_CFG["APPROUVÉ"]   },
    { value:"REJETÉ",     cfg:DECISION_CFG["REJETÉ"]     },
    { value:"EN_ATTENTE", cfg:DECISION_CFG["EN_ATTENTE"] },
  ];

  const inputStyle = { background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.85)" };

  return (
    <div onClick={onClose} className="fixed inset-0 flex items-center justify-center z-50" style={{ background:"rgba(5,12,20,0.85)", backdropFilter:"blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} className="rounded-2xl border w-[min(860px,95vw)] max-h-[90vh] flex flex-col overflow-hidden"
        style={{ background:"#0d1f30", borderColor:"rgba(255,255,255,0.12)", boxShadow:"0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between" style={{ borderColor:"rgba(255,255,255,0.08)" }}>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="font-mono font-bold text-sm" style={{ color:"#4ab83f" }}>{doc.doc_code}</span>
              <StatusBadge name={doc.status_name} />
              {doc.version_letter && doc.version_letter!=="-" && (
                <span className="rounded-md px-2 py-0.5 text-xs border" style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.6)" }}>v.{doc.version_letter}</span>
              )}
            </div>
            <p className="m-0 text-white font-semibold text-[17px]">{doc.title}</p>
            <p className="m-0 mt-1 text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>{doc.responsible} · {doc.process_name||"—"} · {doc.type_code}</p>
          </div>
          <button onClick={onClose} className="text-xl leading-none px-1" style={{ color:"rgba(168,191,212,0.5)" }} onMouseEnter={e=>e.currentTarget.style.color="white"} onMouseLeave={e=>e.currentTarget.style.color="rgba(168,191,212,0.5)"}>×</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: form */}
          <div className="w-[280px] flex-shrink-0 border-r p-5 overflow-y-auto" style={{ borderColor:"rgba(255,255,255,0.08)" }}>
            <p className="text-white font-semibold text-[15px] mb-4">Nouvelle validation</p>

            {!canValidate && (
              <div className="rounded-xl px-3.5 py-3 mb-3.5 flex gap-2 items-start border" style={{ background:"rgba(248,113,113,0.08)", borderColor:"rgba(248,113,113,0.2)" }}>
                <LuLock size={14} style={{ color:"#f87171" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="m-0 mb-0.5 text-xs font-semibold" style={{ color:"#f87171" }}>Accès refusé</p>
                  <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.55)" }}>Seuls Validateur, Responsable Qualité et Admin GED peuvent enregistrer une validation.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" style={{ opacity:canValidate?1:0.4, pointerEvents:canValidate?"auto":"none" }}>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1.5" style={{ color:"rgba(168,191,212,0.5)" }}>Validateur</label>
                <select value={form.validatorId} onChange={e => setForm(f=>({...f,validatorId:e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
                  <option value="" style={{ background:"#0d1f30" }}>— Sélectionner —</option>
                  {users.map(u => <option key={u.id} value={u.id} style={{ background:"#0d1f30" }}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1.5" style={{ color:"rgba(168,191,212,0.5)" }}>Décision *</label>
                <div className="flex flex-col gap-1.5">
                  {DECISION_OPTS.map(({ value, cfg }) => {
                    const DI = cfg.Icon;
                    return (
                      <button type="button" key={value} onClick={() => setForm(f=>({...f,decision:value}))}
                        className="px-3 py-2 rounded-lg text-sm font-semibold text-left flex items-center gap-2 cursor-pointer border transition-all"
                        style={{ background:form.decision===value?cfg.bg:"rgba(255,255,255,0.04)", color:form.decision===value?cfg.text:"rgba(168,191,212,0.55)", borderColor:form.decision===value?cfg.border:"rgba(255,255,255,0.08)" }}>
                        <DI size={14} /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.5px] mb-1.5" style={{ color:"rgba(168,191,212,0.5)" }}>Commentaire</label>
                <textarea rows={4} value={form.comment} onChange={e => setForm(f=>({...f,comment:e.target.value}))}
                  placeholder="Observations, motif de rejet…"
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-y outline-none"
                  style={{ ...inputStyle, minHeight:90 }} />
              </div>

              {error   && <p className="m-0 text-xs rounded-lg px-3 py-2 border" style={{ color:"#f87171", background:"rgba(248,113,113,0.08)", borderColor:"rgba(248,113,113,0.2)" }}>{error}</p>}
              {success && <p className="m-0 text-xs rounded-lg px-3 py-2 border" style={{ color:"#4ade80", background:"rgba(74,222,128,0.08)", borderColor:"rgba(74,222,128,0.2)" }}>{success}</p>}

              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-lg font-bold text-sm border-none transition-all"
                style={{ background:submitting?"rgba(255,255,255,0.06)":"linear-gradient(135deg,#4ab83f,#3da333)", color:submitting?"rgba(168,191,212,0.4)":"white", boxShadow:submitting?"none":"0 4px 16px rgba(74,184,63,0.35)", cursor:submitting?"not-allowed":"pointer" }}>
                {submitting?"Enregistrement…":"Enregistrer la validation"}
              </button>
            </form>
          </div>

          {/* Right: history */}
          <div className="flex-1 p-5 overflow-y-auto">
            <p className="text-white font-semibold text-[15px] mb-4">
              Historique des validations
              {history.length > 0 && <span className="font-normal ml-2 text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>({history.length})</span>}
            </p>
            {loading ? <p className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</p>
              : history.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <LuClipboardCheck size={32} style={{ color:"rgba(168,191,212,0.2)" }} />
                  <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.45)" }}>Aucune validation enregistrée.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {history.map(v => (
                    <div key={v.id} className="rounded-xl px-4 py-3.5 border" style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <DecisionBadge decision={v.decision} />
                          {v.version_letter && <span className="text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>v.{v.version_letter}</span>}
                        </div>
                        <span className="text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>
                          {new Date(v.validated_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <LuUser size={13} style={{ color:"rgba(168,191,212,0.4)" }} className="flex-shrink-0" />
                        <span className="text-[15px] font-semibold text-white">{v.validator_name}</span>
                      </div>
                      {v.comment && (
                        <p className="m-0 text-sm rounded-lg px-3 py-2 border leading-relaxed" style={{ color:"rgba(168,191,212,0.65)", background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
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
  const { can } = useUser();
  const [pendingDocs, setPendingDocs] = useState([]);
  const [allHistory,  setAllHistory]  = useState([]);
  const [stats,       setStats]       = useState(null);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("pending");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, hist, statsRes, usersRes] = await Promise.all([
        axios.get(`${API}/validations/pending-docs`),
        axios.get(`${API}/validations?limit=50`),
        axios.get(`${API}/validations/stats`),
        axios.get(`${API}/users`),
      ]);
      setPendingDocs(pending.data); setAllHistory(hist.data.data||[]); setStats(statsRes.data); setUsers(usersRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sidebarBottom = (
    <>
      <div className="rounded-xl px-3 py-2.5 border" style={{ background:"rgba(74,184,63,0.08)", borderColor:"rgba(74,184,63,0.2)" }}>
        <p className="m-0 text-[10px] uppercase tracking-[1px] font-bold" style={{ color:"rgba(168,191,212,0.5)" }}>EF05 — Validations</p>
        <p className="m-0 font-black text-xl" style={{ color:"#4ab83f" }}>{pendingDocs.length} en attente</p>
      </div>
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
        cursor:"pointer",
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

  const PENDING_COLS = "160px 1fr 120px 100px 110px 140px 110px";
  const HISTORY_COLS = "130px 160px 1fr 130px 120px 1fr";

  const tableRowStyle = { borderBottom:"1px solid rgba(255,255,255,0.05)" };

  return (
    <div className="min-h-screen flex" style={{ background:"linear-gradient(145deg,#0a1420 0%,#0f1e30 35%,#1a2f4a 70%,#1e3a55 100%)" }}>
      <AppSidebar badges={{ "/validations": pendingDocs.length }} bottomContent={sidebarBottom} />

      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Header ────────────────────────────────────────── */}
        <header className="px-9 py-4 border-b flex items-center justify-between"
          style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(20px)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 1px 0 rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"linear-gradient(135deg,rgba(74,184,63,0.18),rgba(74,184,63,0.08))", border:"1.5px solid rgba(74,184,63,0.3)", boxShadow:"0 4px 14px rgba(74,184,63,0.15)" }}>
              <LuClipboardCheck size={19} style={{ color:"#4ab83f" }} />
            </div>
            <div>
              <h1 className="m-0 font-extrabold text-white" style={{ fontSize:21, letterSpacing:"-0.022em", lineHeight:1.2 }}>Validations ISO</h1>
              <p className="m-0 text-xs mt-0.5" style={{ color:"rgba(168,191,212,0.48)" }}>EF05 — Décisions de validation · Traçabilité complète</p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold border transition-all"
            style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.6)", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(74,184,63,0.4)"; e.currentTarget.style.color="#4ab83f"; e.currentTarget.style.background="rgba(74,184,63,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="rgba(168,191,212,0.6)"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}>
            <LuRefreshCw size={14} /> Actualiser
          </button>
        </header>

        <div className="flex-1 px-9 py-6 overflow-y-auto">
          {/* Stats */}
          {stats && (
            <div className="flex gap-4 mb-6 flex-wrap">
              <StatCard Icon={LuClock}          label="Docs en validation" value={stats.pending_docs_count}            accent={stats.pending_docs_count>0?"#a5b4fc":"#4ade80"} />
              <StatCard Icon={LuCircleCheck}    label="Approuvées"         value={stats.decisions?.["APPROUVÉ"]??0}   accent="#4ade80" />
              <StatCard Icon={LuCircleX}        label="Rejetées"           value={stats.decisions?.["REJETÉ"]??0}     accent="#f87171" />
              <StatCard Icon={LuClipboardCheck} label="Total validations"  value={stats.total??0}                     accent="#60a5fa" />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {tabBtn("pending", LuClock,          "Documents en attente", pendingDocs.length)}
            {tabBtn("history", LuClipboardCheck, "Historique complet",   allHistory.length)}
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <LuRefreshCw size={32} className="animate-spin" style={{ color:"rgba(74,184,63,0.4)" }} />
              <span className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>Chargement…</span>
            </div>
          ) : (
            <>
              {/* Pending tab */}
              {activeTab === "pending" && (
                pendingDocs.length === 0 ? <Empty Icon={LuCircleCheckBig} message="Aucun document en attente de validation." />
                : (
                  <div className="rounded-2xl overflow-hidden border" style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                    {/* Header */}
                    <div className="grid px-5 py-2.5 border-b" style={{ gridTemplateColumns:PENDING_COLS, background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.07)" }}>
                      {["Référence","Titre","Responsable","Type","Version","Dernière décision","Action"].map(h => (
                        <span key={h} className="text-[11px] font-bold uppercase tracking-[0.8px]" style={{ color:"rgba(168,191,212,0.5)" }}>{h}</span>
                      ))}
                    </div>
                    {pendingDocs.map((doc, i) => (
                      <div key={doc.id} className="grid px-5 py-3 items-center" style={{ gridTemplateColumns:PENDING_COLS, ...(i<pendingDocs.length-1?tableRowStyle:{}) }}>
                        <span className="font-mono font-bold text-sm" style={{ color:"#4ab83f" }}>{doc.doc_code}</span>
                        <div className="overflow-hidden pr-3">
                          <p className="m-0 text-sm font-medium text-white truncate">{doc.title}</p>
                          {doc.process_name && <p className="m-0 text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>{doc.process_name}</p>}
                        </div>
                        <span className="text-sm truncate" style={{ color:"rgba(168,191,212,0.6)" }}>{doc.responsible||"—"}</span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold w-fit border" style={{ background:"rgba(165,180,252,0.1)", color:"#a5b4fc", borderColor:"rgba(165,180,252,0.2)" }}>{doc.type_code}</span>
                        <span className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>{doc.version_letter&&doc.version_letter!=="-"?`v.${doc.version_letter}`:"—"}</span>
                        <div>{doc.last_decision?<DecisionBadge decision={doc.last_decision} />:<span className="text-sm" style={{ color:"rgba(168,191,212,0.4)" }}>Aucune</span>}</div>
                        <button onClick={() => setSelectedDoc(doc)}
                          className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-xl text-sm font-semibold text-white border-none"
                          style={{ background:"linear-gradient(135deg,#4ab83f,#3da333)", boxShadow:"0 3px 12px rgba(74,184,63,0.35)", cursor:"pointer" }}>
                          <LuClipboardCheck size={13} /> Valider
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* History tab */}
              {activeTab === "history" && (
                allHistory.length === 0 ? <Empty Icon={LuInbox} message="Aucune validation enregistrée." />
                : (
                  <div className="rounded-2xl overflow-hidden border" style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                    <div className="grid px-5 py-2.5 border-b" style={{ gridTemplateColumns:HISTORY_COLS, background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.07)" }}>
                      {["Date","Référence","Titre doc","Validateur","Décision","Commentaire"].map(h => (
                        <span key={h} className="text-[11px] font-bold uppercase tracking-[0.8px]" style={{ color:"rgba(168,191,212,0.5)" }}>{h}</span>
                      ))}
                    </div>
                    {allHistory.map((v, i) => (
                      <div key={v.id} className="grid px-5 py-3 items-center" style={{ gridTemplateColumns:HISTORY_COLS, ...(i<allHistory.length-1?tableRowStyle:{}) }}>
                        <span className="text-sm" style={{ color:"rgba(168,191,212,0.55)" }}>
                          {new Date(v.validated_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}
                          <br /><span className="text-xs opacity-70">{new Date(v.validated_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span>
                        </span>
                        <span className="font-mono font-bold text-sm" style={{ color:"#4ab83f" }}>{v.doc_code}</span>
                        <span className="text-sm truncate pr-2 text-white">{v.doc_title}</span>
                        <span className="flex items-center gap-1.5 text-sm" style={{ color:"rgba(168,191,212,0.7)" }}><LuUser size={12} className="flex-shrink-0" /> {v.validator_name}</span>
                        <DecisionBadge decision={v.decision} />
                        <span className="text-sm truncate" style={{ color:"rgba(168,191,212,0.5)" }}>{v.comment||"—"}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>

      {selectedDoc && (
        <ValidationModal doc={selectedDoc} users={users} canValidate={can("validation:create")} onClose={() => setSelectedDoc(null)} onValidationAdded={load} />
      )}
    </div>
  );
}