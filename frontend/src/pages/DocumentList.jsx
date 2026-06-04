// ============================================================
// pages/DocumentList.jsx
// RÔLE : Liste principale des documents avec gestion complète
//        du cycle de vie ISO 9001.
//        Fonctionnalités :
//          - Recherche et filtres (statut, type, processus, dossier)
//          - Transitions de statut selon les droits du rôle
//          - Upload de nouvelle version
//          - Téléchargement multi-format (PDF, DOCX, XLSX)
//          - Détails du document avec historique des versions
//        Machine à états : Brouillon → ... → Archivé
//        Accessible à tous les rôles (lecture), modifications
//        réservées à Admin et Ing. Qualité.
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { NavLink, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import useRoleCheck from "../hooks/useRoleCheck";
import { AccessDeniedMessage, DocumentAccessStatus, DocumentRolePermissionsMatrix, RoleInfoBadge } from "../components/RoleBasedAccess";
import AppSidebar from "../components/AppSidebar";
import DownloadMenu from "../components/DownloadMenu";
import DocDetailModal from "../components/DocDetailModal";
import {
  LuPencil, LuPenLine, LuEye, LuCircleCheckBig, LuCircleCheck, LuShare2,
  LuTriangleAlert, LuCircleHelp, LuCheck, LuClock, LuRefreshCw,
  LuInbox, LuX, LuLock, LuPlus, LuFile, LuDownload,
  LuFolder, LuArrowRight, LuArchive, LuFileText, LuClipboardCheck, LuChevronDown,
  LuShieldCheck, LuHistory, LuUpload, LuLink,
} from "react-icons/lu";
import { toast } from "sonner";

import { API, BACKEND } from "../config";

const ISO_LIFECYCLE   = ["Brouillon","En rédaction","Appel en relecture","En relecture","En correction","En validation","Validé","Diffusé","Obsolète","Archivé"];
const LOCKED_STATUSES = ["Validé","Diffusé","Obsolète","Archivé"];
const TERMINAL_STATUS = "Archivé";
const ALLOWED_TRANSITIONS = {
  "Brouillon":           ["En rédaction"],
  "En rédaction":        ["Appel en relecture"],
  "Appel en relecture":  ["En relecture"],
  "En relecture":        ["En correction", "En validation"],
  "En correction":       ["Appel en relecture"],
  "En validation":       ["Validé"],
  "Validé":              ["Diffusé"],
  "Diffusé":             ["Obsolète"],
  "Obsolète":            ["Archivé"],
  "Archivé":             [],
};

/* Dark-adapted status config */
const STATUS_CFG = {
  "Brouillon":           { bg:"rgba(156,163,175,0.12)", text:"#d1d5db", border:"rgba(209,213,219,0.30)",  Icon:LuPencil          },
  "En rédaction":        { bg:"rgba(74,222,128,0.12)",  text:"#4ade80", border:"rgba(74,222,128,0.30)",  Icon:LuPenLine         },
  "Appel en relecture":  { bg:"rgba(251,191,36,0.12)",  text:"#fbbf24", border:"rgba(251,191,36,0.30)",  Icon:LuEye             },
  "En relecture":        { bg:"rgba(96,165,250,0.12)",  text:"#60a5fa", border:"rgba(96,165,250,0.30)",  Icon:LuEye             },
  "En correction":       { bg:"rgba(249,115,22,0.12)",  text:"#fb923c", border:"rgba(249,115,22,0.30)",  Icon:LuPenLine         },
  "En validation":       { bg:"rgba(165,180,252,0.12)", text:"#a5b4fc", border:"rgba(165,180,252,0.30)", Icon:LuClipboardCheck  },
  "Validé":              { bg:"rgba(74,222,128,0.12)",  text:"#4ade80", border:"rgba(74,222,128,0.30)",  Icon:LuCircleCheckBig  },
  "Diffusé":             { bg:"rgba(45,212,191,0.12)",  text:"#2dd4bf", border:"rgba(45,212,191,0.30)",  Icon:LuShare2          },
  "Obsolète":            { bg:"rgba(251,146,60,0.12)",  text:"#fb923c", border:"rgba(251,146,60,0.30)",  Icon:LuTriangleAlert   },
  "Archivé":             { bg:"rgba(96,165,250,0.12)",  text:"#60a5fa", border:"rgba(96,165,250,0.30)",  Icon:LuArchive         },
};
const sCfg = (n) => STATUS_CFG[n] || { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)", Icon:LuCircleHelp };

/* ── Status badge ─────────────────────────────────────────── */
function StatusBadge({ name, size = "sm" }) {
  const s = sCfg(name);
  const SI = s.Icon;
  return (
    <span className={`inline-flex items-center gap-1 ${size==="lg"?"px-3 py-1 text-xs":"px-1.5 py-0.5 text-[11px]"} font-semibold rounded-md whitespace-nowrap border w-fit`}
      style={{ background:s.bg, color:s.text, borderColor:s.border }}>
      <SI size={size==="lg"?12:11} />
      {name||"—"}
    </span>
  );
}

/* ── Lifecycle bar (dark) ─────────────────────────────────── */
function LifecycleBar({ currentStatus }) {
  const idx = ISO_LIFECYCLE.indexOf(currentStatus);
  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color:"var(--ged-tx2)" }}>Cycle de vie ISO 9001</p>
      <div className="flex items-center overflow-x-auto pb-1">
        {ISO_LIFECYCLE.map((s, i) => {
          const cfg = sCfg(s);
          const CI = cfg.Icon;
          const done = i < idx, curr = i === idx;
          return (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-1 min-w-[56px]">
                <div className="w-7 h-7 rounded-full flex items-center justify-center border-2" style={{
                  background:curr?cfg.bg:done?"rgba(74,184,63,0.12)":"var(--ged-card)",
                  borderColor:curr?cfg.border:done?"rgba(74,184,63,0.4)":"rgba(255,255,255,0.1)",
                }}>
                  {done ? <LuCheck size={12} style={{ color:"#4ade80" }} />
                        : curr ? <CI size={12} style={{ color:cfg.text }} />
                        : <span className="text-xs" style={{ color:"var(--ged-tx3)" }}>{i+1}</span>}
                </div>
                <span className="text-[10px] text-center leading-tight max-w-[52px] break-words"
                  style={{ color:curr?cfg.text:done?"#4ade80":"var(--ged-tx3)", fontWeight:curr?700:400 }}>{s}</span>
              </div>
              {i < ISO_LIFECYCLE.length - 1 && (
                <div className="h-0.5 w-3 flex-shrink-0 mb-4" style={{ background:done?"rgba(74,184,63,0.4)":"rgba(255,255,255,0.08)" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Pagination ───────────────────────────────────────────── */
function PagBtn({ label, target, current, disabled=false, onChange }) {
  return (
    <button onClick={() => !disabled && onChange(target)} disabled={disabled}
      className="px-2.5 py-1 rounded-lg text-sm transition-all border"
      style={{
        background:target===current?"rgba(255,255,255,0.15)":"var(--ged-card)",
        color:target===current?"white":disabled?"var(--ged-tx3)":"var(--ged-tx2)",
        borderColor:target===current?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)",
        fontWeight:target===current?700:400,
        cursor:disabled?"default":"pointer",
      }}
    >{label}</button>
  );
}
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page-2), end = Math.min(totalPages, page+2);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div className="flex items-center gap-1 justify-center py-5">
      <PagBtn label="«" target={1}          current={page} disabled={page===1}          onChange={onChange} />
      <PagBtn label="‹" target={page-1}     current={page} disabled={page===1}          onChange={onChange} />
      {start > 1 && <span className="px-1" style={{ color:"var(--ged-tx3)" }}>…</span>}
      {pages.map(p => <PagBtn key={p} label={p} target={p} current={page} onChange={onChange} />)}
      {end < totalPages && <span className="px-1" style={{ color:"var(--ged-tx3)" }}>…</span>}
      <PagBtn label="›" target={page+1}     current={page} disabled={page===totalPages} onChange={onChange} />
      <PagBtn label="»" target={totalPages} current={page} disabled={page===totalPages} onChange={onChange} />
      <span className="text-sm ml-2" style={{ color:"var(--ged-tx2)" }}>Page {page} / {totalPages}</span>
    </div>
  );
}

/* ── Active filter tag ────────────────────────────────────── */
function ActiveTag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm border"
      style={{ background:"rgba(74,184,63,0.1)", borderColor:"rgba(74,184,63,0.25)", color:"#4ade80" }}>
      {label}
      <button onClick={onRemove} className="leading-none hover:opacity-70" style={{ color:"#4ade80" }}>×</button>
    </span>
  );
}

/* ── Custom grouped process dropdown ─────────────────────── */
function ProcessDropdown({ folderTree, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const allChildren = folderTree.flatMap(s => s.children || []);
  const selected = allChildren.find(f => String(f.id) === String(value));
  const label = selected ? selected.name.replace(/_/g, " ") : "Processus / Sous-processus";
  return (
    <div ref={ref} className="relative" style={{ minWidth: 220 }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm outline-none transition-all"
        style={{
          background: value ? "rgba(74,184,63,0.08)" : "var(--ged-input)",
          borderColor: value ? "rgba(74,184,63,0.4)" : "var(--ged-border-md)",
          color: value ? "var(--ged-tx1)" : "var(--ged-tx2)",
          cursor: "pointer",
        }}>
        <span className="truncate">{label}</span>
        <LuChevronDown size={13} style={{ flexShrink:0, marginLeft:6, color:"var(--ged-tx3)", transform: open?"rotate(180deg)":"none", transition:"transform 0.2s" }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 rounded-xl overflow-hidden z-50"
          style={{ background:"var(--ged-modal-bg)", border:"1px solid var(--ged-border-md)", boxShadow:"var(--ged-shadow)", minWidth:"100%", maxHeight:280, overflowY:"auto" }}>
          <button type="button" onClick={() => { onChange(""); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm"
            style={{ color: !value ? "#4ade80" : "var(--ged-tx2)", background: !value ? "rgba(74,184,63,0.08)" : "transparent" }}>
            Tous les processus
          </button>
          {folderTree.map(strategic => (
            <div key={strategic.id}>
              <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider m-0"
                style={{ color:"rgba(74,184,63,0.7)", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                {strategic.name.replace(/_/g, " ")}
              </p>
              {(strategic.children || []).map(main => (
                <button key={main.id} type="button"
                  onClick={() => { onChange(String(main.id)); setOpen(false); }}
                  className="w-full text-left px-5 py-2 text-sm transition-all"
                  style={{
                    color: String(main.id) === String(value) ? "#4ade80" : "var(--ged-tx1)",
                    background: String(main.id) === String(value) ? "rgba(74,184,63,0.1)" : "transparent",
                  }}
                  onMouseEnter={e => { if (String(main.id) !== String(value)) e.currentTarget.style.background="rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (String(main.id) !== String(value)) e.currentTarget.style.background="transparent"; }}>
                  {main.name.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sidebar dark overrides ───────────────────────────────── */
const SIDEBAR_OVERRIDE_STYLES = `
  .dark-sidebar { background: rgba(10,20,32,0.95) !important; border-right: 1px solid rgba(255,255,255,0.08) !important; }
`;

/* ══════════════════════════════════════════════════════════ */
export default function DocumentList() {
  const { can, currentUser, userRole } = useUser();
  const { canPerformAction, getBlockReason, canTransitionStatus } = useRoleCheck();
  const location = useLocation();

  const [documents,    setDocuments]    = useState([]);
  const [pagination,   setPagination]   = useState({ total:0,page:1,limit:15,totalPages:1 });
  const [stats,        setStats]        = useState({ total:0,overdue:0,byStatus:{} });
  const [types,        setTypes]        = useState([]);
  const [filterOpts,   setFilterOpts]   = useState({ responsables:[],processes:[] });
  const [folderTree,   setFolderTree]   = useState([]); // [{id, name, children:[{id,name}]}]
  const [loading,      setLoading]      = useState(true);

  const initialFilters = (() => {
    const p = new URLSearchParams(location.search);
    return {
      keyword: "", docCode: "", typeId: p.get("typeId") || "", processId: p.get("folderId") || "", responsible: "",
      statusName: p.get("statusName") || "",
      overdue: p.get("overdue") === "true",
    };
  })();
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const isVisiteur = userRole === "Visiteur";

  useEffect(() => {
    if (isVisiteur) {
      setFilters(f => ({ ...f, statusName: "Archivé", overdue: false }));
      setPage(1);
    }
  }, [isVisiteur]);
  const LIMIT = 15;

  const [linkedDocId,    setLinkedDocId]    = useState(null); // opened via email link
  const [selected,       setSelected]       = useState(null);
  const [versions,       setVersions]       = useState([]);
  const [previewOpen,    setPreviewOpen]     = useState(false);
  const [previewFile,    setPreviewFile]     = useState(null);
  const [newVerOpen,     setNewVerOpen]      = useState(false);
  const [downloadOpen,   setDownloadOpen]    = useState(false);
  const [summary,        setSummary]         = useState("");
  const [spLink,         setSpLink]          = useState("");
  const [newFile,        setNewFile]         = useState(null);
  const [submitting,     setSubmitting]      = useState(false);
  const [statusChanging, setStatusChanging]  = useState(false);
  const [confirmTransition, setConfirmTransition] = useState(null); // { next, cfg, NI }
  const [timeline,       setTimeline]        = useState([]);
  const [activeTab,      setActiveTab]       = useState("detail");
  const debounceTimer = useRef(null);
  const downloadRef   = useRef(null);
  const debounce = (fn, ms=400) => { clearTimeout(debounceTimer.current); debounceTimer.current=setTimeout(fn,ms); };

  useEffect(() => {
    if (!downloadOpen) return;
    const handler = (e) => { if (downloadRef.current && !downloadRef.current.contains(e.target)) setDownloadOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [downloadOpen]);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/types`),
      axios.get(`${API}/documents/filters`),
      axios.get(`${API}/documents/stats`),
      axios.get(`${API}/folders/level/1`),
    ])
      .then(([t, fo, st, l1]) => {
        setTypes(t.data);
        setFilterOpts(fo.data);
        setStats(st.data);
        // Load children for each level-1 folder to build the tree
        Promise.all(l1.data.map(f => axios.get(`${API}/folders/children/${f.id}`).then(r => ({ ...f, children: r.data }))))
          .then(tree => setFolderTree(tree));
      })
      .catch(console.error);
  }, []);

  const fetchDocuments = useCallback(async (activeFilters, activePage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", activePage); params.set("limit", LIMIT);
      if (activeFilters.keyword)     params.set("keyword",     activeFilters.keyword);
      if (activeFilters.docCode)     params.set("docCode",     activeFilters.docCode);
      if (activeFilters.typeId)      params.set("typeId",      activeFilters.typeId);
      if (activeFilters.processId)   params.set("folderId",    activeFilters.processId);
      if (activeFilters.responsible) params.set("responsible", activeFilters.responsible);
      if (activeFilters.overdue)     params.set("overdue",     "true");
      if (activeFilters.statusName)  params.set("statusName",  activeFilters.statusName);
      const res = await axios.get(`${API}/documents?${params}`);
      setDocuments(res.data.data); setPagination(res.data.pagination);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { debounce(() => fetchDocuments(filters, page)); }, [filters, page]); // eslint-disable-line

  const refreshStats = async () => { try { const st = await axios.get(`${API}/documents/stats`); setStats(st.data); } catch { /* silent */ } };
  const setFilter = (key, value) => {
    if (isVisiteur && (key === "statusName" || key === "overdue")) return;
    setFilters(f => ({ ...f, [key]:value })); setPage(1);
  };
  const clearAllFilters = () => {
    setFilters({ keyword:"",docCode:"",typeId:"",statusName:isVisiteur?"Archivé":"",processId:"",responsible:"",overdue:false });
    setPage(1);
  };
  const hasActiveFilters = Object.entries(filters).some(([k, v]) =>
    isVisiteur && (k === "statusName" || k === "overdue") ? false : (v !== "" && v !== false)
  );

  const openDoc = async (doc) => {
    setSelected(doc); setVersions([]); setTimeline([]); setActiveTab("detail");
    try {
      const [verRes, auditRes] = await Promise.all([
        axios.get(`${API}/documents/${doc.id}/versions`),
        axios.get(`${API}/documents/${doc.id}/audit-trail`).catch(() => ({ data: { timeline: [] } })),
      ]);
      setVersions(verRes.data);
      setTimeline(auditRes.data?.timeline || []);
    } catch { /* silent */ }
  };

  // Auto-open document from email link (?docId=<id>)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docId  = params.get("docId");
    if (docId) setLinkedDocId(Number(docId));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const closeDoc = () => { setSelected(null); setVersions([]); setTimeline([]); setActiveTab("detail"); setNewVerOpen(false); setSummary(""); setSpLink(""); setNewFile(null); };

  const handleStatusChange = async (nextStatus) => {
    if (!selected) return; setStatusChanging(true);
    try {
      const res = await axios.patch(`${API}/documents/${selected.id}/status`, { newStatus:nextStatus });
      const updated = await axios.get(`${API}/documents/${selected.id}`);
      setSelected(updated.data);
      setDocuments(prev => prev.map(d => d.id===selected.id ? { ...d, status_name:nextStatus } : d));
      await refreshStats(); toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.error || "Erreur lors du changement de statut."); }
    finally { setStatusChanging(false); }
  };

  const handleDownloadAs = async (filename, ext) => {
    try {
      const srcExt = filename.split(".").pop()?.toLowerCase();
      const encodedPath = filename.split("/").map(encodeURIComponent).join("/");
      const url = srcExt === ext
        ? `${BACKEND}/download/${encodedPath}`
        : `${BACKEND}/convert/${encodedPath}?to=${ext}`;
      const response = await fetch(url);
      if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.error||"Erreur serveur"); }
      const blob = await response.blob(); const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl; link.download = filename.split("/").pop().replace(/\.[^/.]+$/, "") + "." + ext;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(blobUrl);
    } catch(e) { toast.error(e.message || "Erreur de téléchargement"); }
  };

  const handleNewVersion = async (e) => {
    e.preventDefault();
    if (!newFile) return void toast.warning("Veuillez sélectionner un fichier.");
    if (!summary.trim()) return void toast.warning("Le résumé des changements est obligatoire.");
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("file", newFile);
      form.append("change_summary", summary.trim());
      form.append("sharepoint_link", spLink.trim());
      const res = await axios.put(`${API}/documents/${selected.id}`, form, { headers:{ "Content-Type":"multipart/form-data" } });
      const [docRes, verRes] = await Promise.all([axios.get(`${API}/documents/${selected.id}`), axios.get(`${API}/documents/${selected.id}/versions`)]);
      setSelected(docRes.data); setVersions(verRes.data);
      setDocuments(prev => prev.map(d => d.id===selected.id ? { ...d, current_version:res.data.version } : d));
      setNewVerOpen(false); setSummary(""); setSpLink(""); setNewFile(null); toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.error || "Erreur lors de la création de la version."); }
    finally { setSubmitting(false); }
  };

  const isLocked   = (n) => LOCKED_STATUSES.includes(n);
  const isTerminal = (n) => n === TERMINAL_STATUS;
  const nextSteps  = (n) => ALLOWED_TRANSITIONS[n] || [];

  /* ── Input/select shared dark style ─────────────────────── */
  const inputStyle = (active) => ({
    background: active ? "rgba(74,184,63,0.08)" : "var(--ged-input)",
    borderColor: active ? "rgba(74,184,63,0.4)" : "var(--ged-border-md)",
    color: "var(--ged-tx1)",
  });

  /* ── Sidebar middle content ───────────────────────────────── */
  const sidebarMiddle = (
    <div className="px-2.5 pt-1 pb-2 flex flex-col gap-1">
      {!isVisiteur && (
        <button onClick={() => setFilter("overdue", !filters.overdue)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold border transition-all"
          style={{
            background:filters.overdue?"rgba(251,146,60,0.12)":"transparent",
            borderColor:filters.overdue?"rgba(251,146,60,0.3)":"var(--ged-border)",
            color:filters.overdue?"#fb923c":"var(--ged-tx2)",
          }}>
          <span className="flex items-center gap-1.5"><LuClock size={13} /> En retard</span>
          {stats.overdue > 0 && <span className="rounded-full px-1.5 py-px text-[11px] font-bold" style={{ background:"#ea580c", color:"white" }}>{stats.overdue}</span>}
        </button>
      )}
      <p className="text-[10px] uppercase tracking-[1px] font-bold px-1 mt-2 mb-1" style={{ color:"var(--ged-tx3)" }}>Par statut</p>
      {ISO_LIFECYCLE.filter(s => !isVisiteur || s === "Archivé").map(s => {
        const cnt = stats.byStatus?.[s] || 0;
        if (!cnt) return null;
        const cfg = sCfg(s);
        const CI = cfg.Icon;
        const active = isVisiteur ? true : filters.statusName === s;
        return (
          <button key={s} onClick={() => !isVisiteur && setFilter("statusName", active?"":s)}
            className="flex justify-between items-center w-full px-2 py-1.5 rounded-md text-xs transition-all border"
            style={{
              background:active?`${cfg.bg}`:"transparent",
              borderColor:active?cfg.border:"transparent",
              color:active?cfg.text:"var(--ged-tx2)",
              cursor:isVisiteur?"default":"pointer",
            }}>
            <span className="flex items-center gap-1"><CI size={10} /> {s}</span>
            <span className="rounded-full px-1.5 py-px text-[11px]" style={{ color:"var(--ged-tx2)" }}>{cnt}</span>
          </button>
        );
      })}
    </div>
  );

  const sidebarBottom = (
    <>
      <div className="rounded-xl px-3.5 py-3 border" style={{ background:"rgba(74,184,63,0.08)", borderColor:"rgba(74,184,63,0.2)" }}>
        <p className="text-[10px] uppercase tracking-[1px] font-bold m-0" style={{ color:"var(--ged-tx2)" }}>Total</p>
        <p className="font-black text-2xl m-0" style={{ color:"#4ab83f" }}>{stats.total}</p>
        <p className="text-xs m-0 mt-0.5" style={{ color:"var(--ged-tx3)" }}>documents</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "transparent" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .animate-fade-in { animation: fadeIn 0.2s ease; }
        @keyframes rowSlideIn { from { opacity:0; transform:translateX(-14px); } to { opacity:1; transform:translateX(0); } }
        .row-slide-in { animation: rowSlideIn 0.38s cubic-bezier(.22,.68,0,1.1) both; }
      `}</style>

      <AppSidebar user={currentUser} middleContent={sidebarMiddle} bottomContent={sidebarBottom} />

      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Header ────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-8 py-4 border-b"
          style={{ background:"var(--ged-header)", backdropFilter:"blur(20px)", borderColor:"var(--ged-border)", boxShadow:"0 1px 0 rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"linear-gradient(135deg,rgba(74,184,63,0.18),rgba(74,184,63,0.08))", border:"1.5px solid rgba(74,184,63,0.3)", boxShadow:"0 4px 14px rgba(74,184,63,0.15)" }}>
              <LuFileText size={19} style={{ color:"#4ab83f" }} />
            </div>
            <div>
              <h1 className="m-0 font-extrabold" style={{ fontSize:21, letterSpacing:"-0.022em", lineHeight:1.2, color:"var(--ged-tx1)" }}>
                {isVisiteur ? "Documents archivés" : "Documents"}
              </h1>
              <p className="m-0 text-xs mt-0.5" style={{ color:"var(--ged-tx4)" }}>
                {pagination.total} document{pagination.total>1?"s":""}
                {!isVisiteur && filters.overdue    && <span style={{ color:"#fb923c" }}> · En retard</span>}
                {!isVisiteur && filters.statusName && <span style={{ color:"var(--ged-tx2)" }}> · {filters.statusName}</span>}
              </p>
            </div>
          </div>
          {can("document:create") && (
            <NavLink to="/create" className="no-underline flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background:"linear-gradient(135deg,#4ab83f,#3da333)", boxShadow:"0 4px 16px rgba(74,184,63,0.35)" }}>
              <LuPlus size={14} /> Nouveau
            </NavLink>
          )}
        </header>

        {/* ── Filter bar ────────────────────────────────────── */}
        <div className="px-8 py-3.5 border-b flex flex-col gap-2.5"
          style={{ background:"var(--ged-header)", borderColor:"var(--ged-border-sm)" }}>
          <div className="flex gap-2.5 flex-wrap">
            <div className="relative flex-shrink-0 w-[190px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-mono" style={{ color:"var(--ged-tx2)" }}>#</span>
              <input placeholder="Référence…" value={filters.docCode} onChange={(e) => setFilter("docCode", e.target.value)}
                className="w-full pl-6 pr-3 py-2 rounded-lg border text-sm outline-none transition-all"
                style={inputStyle(!!filters.docCode)} />
            </div>
            <input placeholder="Mot-clé (titre, tag, responsable…)" value={filters.keyword} onChange={(e) => setFilter("keyword", e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border text-sm outline-none transition-all"
              style={inputStyle(!!filters.keyword)} />
            <select value={filters.responsible} onChange={(e) => setFilter("responsible", e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm outline-none cursor-pointer min-w-[160px]"
              style={inputStyle(!!filters.responsible)}>
              <option value="">Responsable</option>
              {filterOpts.responsables.map(r => <option key={r} value={r} style={{ background:"#1a2f4a" }}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-2.5 flex-wrap items-center">
            <select value={filters.typeId} onChange={(e)=>setFilter("typeId",e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none cursor-pointer" style={inputStyle(!!filters.typeId)}>
              <option value="">Type</option>
              {types.map(t => <option key={t.id} value={t.id} style={{ background:"#1a2f4a" }}>{t.code} — {t.label}</option>)}
            </select>
            {isVisiteur ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border"
                style={{ background:"rgba(148,163,184,0.08)", borderColor:"rgba(203,213,225,0.2)", color:"#94a3b8" }}>
                <LuArchive size={13} /> Archivé
              </span>
            ) : (
              <select value={filters.statusName} onChange={(e)=>setFilter("statusName",e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none cursor-pointer" style={inputStyle(!!filters.statusName)}>
                <option value="">Statut</option>
                {ISO_LIFECYCLE.map(s => <option key={s} value={s} style={{ background:"#1a2f4a" }}>{s}</option>)}
              </select>
            )}

            <ProcessDropdown
              folderTree={folderTree}
              value={filters.processId}
              onChange={(v) => setFilter("processId", v)}
            />
            {!isVisiteur && (
              <button onClick={() => setFilter("overdue", !filters.overdue)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border transition-all"
                style={{
                  background:filters.overdue?"rgba(251,146,60,0.1)":"var(--ged-card)",
                  borderColor:filters.overdue?"rgba(251,146,60,0.35)":"rgba(255,255,255,0.1)",
                  color:filters.overdue?"#fb923c":"var(--ged-tx2)",
                }}>
                <LuClock size={13} /> En retard {filters.overdue && <LuCheck size={12} />}
              </button>
            )}
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm border transition-all"
                style={{ background:"var(--ged-card)", borderColor:"rgba(255,255,255,0.1)", color:"var(--ged-tx2)" }}>
                <LuX size={12} /> Effacer tout
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <div className="flex gap-1.5 flex-wrap">
              {filters.keyword     && <ActiveTag label={`Mot-clé: "${filters.keyword}"`}      onRemove={() => setFilter("keyword","")} />}
              {filters.docCode     && <ActiveTag label={`Réf: "${filters.docCode}"`}           onRemove={() => setFilter("docCode","")} />}
              {filters.responsible && <ActiveTag label={`Responsable: ${filters.responsible}`} onRemove={() => setFilter("responsible","")} />}
              {filters.typeId      && <ActiveTag label={`Type: ${types.find(t=>t.id==filters.typeId)?.code||filters.typeId}`} onRemove={() => setFilter("typeId","")} />}
              {filters.statusName && !isVisiteur && <ActiveTag label={`Statut: ${filters.statusName}`} onRemove={() => setFilter("statusName","")} />}
              {filters.processId   && <ActiveTag label={`Processus: ${(folderTree.flatMap(s=>s.children||[]).find(f=>f.id==filters.processId)?.name || filters.processId).replace(/_/g," ")}`} onRemove={() => setFilter("processId","")} />}
              {filters.overdue     && <ActiveTag label="En retard"                             onRemove={() => setFilter("overdue",false)} />}
            </div>
          )}
        </div>

        {/* ── Document table ─────────────────────────────────── */}
        <div className="flex-1 px-8 py-5">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16" style={{ color:"var(--ged-tx2)" }}>
              <LuRefreshCw size={32} className="animate-spin" style={{ color:"rgba(74,184,63,0.5)" }} />
              <p className="m-0 text-sm">Chargement…</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <LuInbox size={40} style={{ color:"var(--ged-tx3)" }} />
              <p className="m-0 text-sm" style={{ color:"var(--ged-tx2)" }}>Aucun document trouvé</p>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background:"linear-gradient(135deg,#4ab83f,#3da333)", boxShadow:"0 4px 16px rgba(74,184,63,0.35)" }}>
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="rounded-2xl overflow-hidden border" style={{ background:"var(--ged-header)", borderColor:"var(--ged-border)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                {/* Header */}
                <div className="grid px-5 py-2.5 border-b" style={{ gridTemplateColumns:"240px 1fr 120px 80px 130px 105px 28px", background:"var(--ged-card)", borderColor:"rgba(255,255,255,0.07)" }}>
                  {["Référence","Titre","Responsable","Type","Statut","Revue",""].map(h => (
                    <span key={h} className="text-[11px] font-bold uppercase tracking-[0.8px]" style={{ color:"var(--ged-tx2)" }}>{h}</span>
                  ))}
                </div>
                {/* Rows */}
                {documents.map((doc, i) => {
                  const sc = sCfg(doc.status_name);
                  const rowBg = doc.is_overdue ? "rgba(251,146,60,0.08)" : `${sc.text}08`;
                  const rowBgHov = doc.is_overdue ? "rgba(251,146,60,0.15)" : `${sc.text}15`;
                  return (
                  <div key={doc.id} onClick={() => openDoc(doc)}
                    className="row-slide-in relative grid pl-7 pr-5 py-3 items-center cursor-pointer transition-all duration-200 overflow-hidden"
                    style={{
                      gridTemplateColumns:"240px 1fr 120px 80px 130px 105px 28px",
                      borderBottom: i < documents.length-1 ? `1px solid ${sc.text}15` : "none",
                      background: rowBg,
                      animationDelay: `${i * 0.04}s`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = rowBgHov}
                    onMouseLeave={e => e.currentTarget.style.background = rowBg}
                  >
                    {/* Left status bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ background:`linear-gradient(to bottom,${sc.text},${sc.text}55)` }} />
                    <span className="font-mono font-bold text-sm" style={{ color: sc.text }}>{doc.doc_code}</span>
                    <div className="overflow-hidden pr-3">
                      <p className="m-0 text-sm font-medium text-white truncate" title={doc.title}>{doc.title}</p>
                      {doc.folder_name && (
                        <p className="m-0 mt-0.5 text-xs flex items-center gap-1" style={{ color:"var(--ged-tx3)" }}>
                          <LuFolder size={10} /> {doc.folder_name}
                        </p>
                      )}
                    </div>
                    <span className="text-sm truncate" style={{ color:"var(--ged-tx2)" }}>{doc.responsible||"—"}</span>
                    <span className="px-2 py-0.5 rounded-md text-[13px] font-semibold w-fit border" style={{ background:"rgba(96,165,250,0.1)", color:"#60a5fa", borderColor:"rgba(96,165,250,0.2)" }}>
                      {doc.type_code}
                    </span>
                    <StatusBadge name={doc.status_name} />
                    <span className="text-sm" style={{ color:doc.is_overdue?"#fb923c":"var(--ged-tx2)", fontWeight:doc.is_overdue?600:400 }}>
                      {doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—"}
                    </span>
                    <span className="flex items-center">
                      {doc.is_overdue && <LuClock size={13} style={{ color:"#fb923c" }} />}
                    </span>
                  </div>
                  );
                })}
              </div>
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={p => setPage(p)} />
            </>
          )}
        </div>
      </main>

      {/* ══ Email-link doc detail (with Consultation tab) ═══ */}
      {linkedDocId && (
        <DocDetailModal docId={linkedDocId} onClose={() => setLinkedDocId(null)} />
      )}

      {/* ══ Document detail modal ════════════════════════════ */}
      {selected && (
        <div onClick={closeDoc} className="fixed inset-0 flex items-center justify-center z-[1000] p-6 animate-fade-in"
          style={{ background:"rgba(5,12,20,0.4)", backdropFilter:"blur(8px)" }}>
          <div onClick={e => e.stopPropagation()} className="rounded-2xl w-full max-w-[800px] max-h-[90vh] overflow-auto border"
            style={{ background:"linear-gradient(160deg,rgba(18,32,58,0.96) 0%,rgba(12,22,40,0.96) 100%)", borderColor:"rgba(255,255,255,0.14)", boxShadow:"0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <div className="p-7">
              {/* Modal header */}
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="m-0 mb-1 font-mono font-bold text-xl" style={{ color:"#4ab83f" }}>{selected.doc_code}</p>
                  <h2 className="m-0 text-white text-[17px] font-bold">{selected.title}</h2>
                </div>
                <div className="flex items-center gap-2.5">
                  {selected.is_overdue && (
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1 border" style={{ background:"rgba(251,146,60,0.12)", color:"#fb923c", borderColor:"rgba(251,146,60,0.25)" }}>
                      <LuClock size={11} /> En retard
                    </span>
                  )}
                  <StatusBadge name={selected.status_name} size="lg" />
                  <button onClick={closeDoc} className="p-1 flex items-center" style={{ color:"var(--ged-tx2)" }} onMouseEnter={e=>e.currentTarget.style.color="white"} onMouseLeave={e=>e.currentTarget.style.color="var(--ged-tx2)"}>
                    <LuX size={18} />
                  </button>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex items-end gap-0.5 mb-5 border-b" style={{ borderColor:"var(--ged-border)" }}>
                {[
                  { id:"detail",       label:"Détail" },
                  { id:"consultation", label:"Consultation", count: timeline.length },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all"
                    style={{
                      color: activeTab === tab.id ? "var(--ged-tx1)" : "var(--ged-tx3)",
                      borderBottomColor: activeTab === tab.id ? "#4ab83f" : "transparent",
                      background: activeTab === tab.id ? "rgba(74,184,63,0.06)" : "transparent",
                      cursor: "pointer", marginBottom: -1,
                    }}>
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="rounded-full px-1.5 py-px text-[10px] font-black"
                        style={{ background: activeTab === tab.id ? "rgba(74,184,63,0.2)" : "rgba(255,255,255,0.06)", color: activeTab === tab.id ? "#4ab83f" : "var(--ged-tx3)" }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {activeTab === "detail" && <>
              <RoleInfoBadge />
              <DocumentAccessStatus document={selected} />
              <DocumentRolePermissionsMatrix document={selected} />
              <LifecycleBar currentStatus={selected.status_name} />

              {/* Status transition */}
              <div className="rounded-xl px-4 py-3.5 mb-5 border" style={{ background:"var(--ged-header)", borderColor:"var(--ged-border)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-0.5 h-3.5 rounded-full" style={{ background:"#4ab83f" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color:"var(--ged-tx2)" }}>Transition de statut</p>
                </div>
                {isTerminal(selected.status_name) ? (
                  <p className="m-0 text-sm flex items-center gap-1.5" style={{ color:"var(--ged-tx2)" }}><LuArchive size={13} /> Document archivé — état terminal.</p>
                ) : nextSteps(selected.status_name).length === 0 ? (
                  <p className="m-0 text-sm" style={{ color:"var(--ged-tx2)" }}>Aucune transition disponible.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selected.status_name === "En validation" && (
                      <div className="rounded-xl px-3 py-2.5 border flex items-start gap-2 mb-1"
                        style={{ background:"rgba(165,180,252,0.08)", borderColor:"rgba(165,180,252,0.25)" }}>
                        <LuClipboardCheck size={14} style={{ color:"#a5b4fc", flexShrink:0, marginTop:1 }} />
                        <p className="m-0 text-xs" style={{ color:"var(--ged-tx2)" }}>
                          Pour valider ce document, utilisez la page{" "}
                          <NavLink to="/validations" className="font-bold no-underline" style={{ color:"#a5b4fc" }}>Validations</NavLink>
                          {" "}pour approuver ou rejeter.
                        </p>
                      </div>
                    )}
                    {nextSteps(selected.status_name).map(next => {
                      const cfg = sCfg(next);
                      const NI = cfg.Icon;
                      const allowed = canTransitionStatus(selected.status_name, next);
                      const reason = !allowed ? getBlockReason("change_status", selected) : null;
                      return (
                        <button key={next} onClick={() => allowed && setConfirmTransition({ next, cfg, NI })} disabled={statusChanging||!allowed} title={reason||undefined}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                          style={{ background:allowed?cfg.bg:"var(--ged-card)", borderColor:allowed?cfg.border:"var(--ged-border)", color:allowed?cfg.text:"var(--ged-tx3)", cursor:(statusChanging||!allowed)?"not-allowed":"pointer" }}>
                          <span className="flex items-center gap-1.5"><NI size={13} /> Passer à : <strong>{next}</strong></span>
                          <span>{allowed?<LuArrowRight size={13} />:<LuLock size={13} />}</span>
                        </button>
                      );
                    })}
                    {!currentUser && <p className="text-xs mt-1 flex items-center gap-1" style={{ color:"#fb923c" }}><LuTriangleAlert size={12} /> Sélectionnez un utilisateur.</p>}
                  </div>
                )}
                {isLocked(selected.status_name) && !isTerminal(selected.status_name) && (
                  <p className="mt-2.5 text-xs flex items-center gap-1" style={{ color:"#f87171" }}><LuLock size={12} /> Statut verrouillé — modification de fichier impossible.</p>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {[
                  ["Responsable",    selected.responsible||"—"],
                  ["Type",           `${selected.type_code} — ${selected.type_label}`],
                  ["Origine",        selected.origin||"—"],
                  ["Version",        selected.current_version||"—"],
                  ["Processus",      selected.folder_name||"—"],
                  ["Processus stratégique", selected.strategic_process||"—"],
                  ["Processus principal",   selected.main_process||"—"],
                  ["Contexte",       selected.context||"—"],
                  ["Prochaine revue",selected.next_review_date?new Date(selected.next_review_date).toLocaleDateString("fr-FR"):"—"],
                  ["Créé le",        selected.created_at?new Date(selected.created_at).toLocaleDateString("fr-FR"):"—"],
                  ["Créé par",       selected.created_by_name||"—"],
                ].map(([l,v]) => (
                  <div key={l} className="rounded-lg px-3.5 py-2.5 border" style={{ background:"var(--ged-header)", borderColor:"rgba(255,255,255,0.07)" }}>
                    <p className="m-0 mb-0.5 text-xs uppercase tracking-[0.8px]" style={{ color:"var(--ged-tx3)" }}>{l}</p>
                    <p className="m-0 text-sm font-medium text-white">{v}</p>
                  </div>
                ))}
                {selected.sharepoint_link && (
                  <div className="rounded-lg px-3.5 py-2.5 border" style={{ background:"var(--ged-header)", borderColor:"rgba(255,255,255,0.07)" }}>
                    <p className="m-0 mb-0.5 text-xs uppercase tracking-[0.8px]" style={{ color:"var(--ged-tx3)" }}>SharePoint</p>
                    <a href={selected.sharepoint_link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color:"#60a5fa", textDecoration:"none" }}>
                      <LuShare2 size={11} /> SharePoint
                    </a>
                  </div>
                )}
              </div>

              {/* Keywords */}
              {selected.keywords?.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3"><div className="w-0.5 h-3.5 rounded-full" style={{ background:"#4ab83f" }} /><p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color:"var(--ged-tx2)" }}>Mots-clés</p></div>
                  <div className="flex gap-1.5 flex-wrap">
                    {selected.keywords.map(k => (
                      <span key={k} className="rounded-full text-sm px-2.5 py-0.5 border" style={{ background:"rgba(96,165,250,0.1)", color:"#60a5fa", borderColor:"rgba(96,165,250,0.2)" }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}


              {/* File */}
              {selected.file_name && (
                <div className="rounded-xl px-4 py-3.5 mb-5 border" style={{ background:"var(--ged-header)", borderColor:"rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <LuFileText size={24} style={{ color:"var(--ged-tx3)" }} />
                    <div>
                      <p className="m-0 text-sm font-semibold text-white">{selected.file_name}</p>
                      <p className="m-0 mt-0.5 text-xs" style={{ color:"var(--ged-tx3)" }}>Fichier document</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setPreviewFile(selected.file_path); setPreviewOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ background:"linear-gradient(135deg,#4ab83f,#3da333)", boxShadow:"0 4px 16px rgba(74,184,63,0.35)" }}>
                      <LuEye size={14} /> Visualiser
                    </button>
                    <div className="relative flex-1" ref={downloadRef}>
                      <button
                        onClick={() => setDownloadOpen(o => !o)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border transition-all"
                        style={{ background:"var(--ged-card-md)", borderColor:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.8)" }}>
                        <LuDownload size={14} /> Télécharger
                      </button>
                      {downloadOpen && (
                        <div className="absolute top-[calc(100%+6px)] left-0 right-0 rounded-xl overflow-hidden z-20 border"
                          style={{ background:"#0d1f30", borderColor:"rgba(255,255,255,0.12)", boxShadow:"0 20px 60px rgba(0,0,0,0.55)", minWidth:"260px" }}>
                          <p className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider border-b m-0"
                            style={{ color:"var(--ged-tx3)", borderColor:"rgba(255,255,255,0.07)" }}>
                            Format de téléchargement
                          </p>
                          {versions.slice(-1).map(v => (
                            <div key={v.id} className="flex items-center justify-between px-3.5 py-2.5 border-b"
                              style={{ borderColor:"rgba(255,255,255,0.06)" }}>
                              <span className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background:"rgba(74,184,63,0.12)", color:"#4ab83f" }}>
                                  {v.version_letter}
                                </span>
                                <span className="text-xs truncate" style={{ color:"var(--ged-tx3)" }}>
                                  {v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR") : "—"}
                                  {v.change_summary ? ` — ${v.change_summary}` : ""}
                                </span>
                              </span>
                              <div className="flex gap-1 flex-shrink-0 ml-2">
                                {[{ext:"pdf",color:"#f87171"},{ext:"docx",label:"Word",color:"#60a5fa"},{ext:"xlsx",label:"Excel",color:"#4ab83f"}].map(({ext,color}) => (
                                  <button key={ext}
                                    onClick={() => { handleDownloadAs(v.file_path, ext); setDownloadOpen(false); }}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold border transition-all"
                                    style={{ background:"var(--ged-card)", borderColor:`${color}40`, color, cursor:"pointer" }}
                                    onMouseEnter={e => { e.currentTarget.style.background=`${color}22`; e.currentTarget.style.borderColor=color; }}
                                    onMouseLeave={e => { e.currentTarget.style.background="var(--ged-card)"; e.currentTarget.style.borderColor=`${color}40`; }}>
                                    {ext === "docx" ? "Word" : ext === "xlsx" ? "Excel" : "PDF"}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {canPerformAction("update", selected) ? (
                <button onClick={() => setNewVerOpen(true)}
                  className="w-full mb-3 py-2.5 rounded-xl border-none text-white text-sm font-semibold flex items-center justify-center gap-1.5"
                  style={{ background:"linear-gradient(135deg,#4ab83f,#3da333)", boxShadow:"0 4px 16px rgba(74,184,63,0.35)", cursor:"pointer" }}>
                  <LuPlus size={14} /> Nouvelle version
                </button>
              ) : (
                <AccessDeniedMessage action="update" document={selected} reason={getBlockReason("update", selected)} />
              )}

              {/* Version history */}
              {versions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3"><div className="w-0.5 h-3.5 rounded-full" style={{ background:"#4ab83f" }} /><p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color:"var(--ged-tx2)" }}>🕐 Historique versions</p></div>
                  {versions.map((v, idx) => {
                    return (
                    <div key={v.id} className="rounded-lg mb-1.5 px-3 py-2 border" style={{ background:"var(--ged-header)", borderColor:"rgba(255,255,255,0.07)" }}>
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">{v.version_letter || "-"}</span>
                        <span className="text-sm flex-1" style={{ color:"var(--ged-tx2)" }}>{v.created_at?new Date(v.created_at).toLocaleDateString("fr-FR"):"—"}</span>
                        {v.file_path && (
                          <div className="flex gap-1.5">
                            <button onClick={() => { setPreviewFile(v.file_path); setPreviewOpen(true); }}
                              className="rounded-md px-2 py-0.5 text-xs flex items-center gap-1 border transition-all"
                              style={{ background:"rgba(255,255,255,0.05)", borderColor:"rgba(255,255,255,0.1)", color:"var(--ged-tx2)", cursor:"pointer" }}>
                              <LuEye size={12} /> Consulter
                            </button>
                            <DownloadMenu filename={v.file_path} size="small" />
                          </div>
                        )}
                      </div>
                      {v.change_summary && <p className="m-0 mt-1 text-sm" style={{ color:"var(--ged-tx2)" }}>{v.change_summary}</p>}
                      {v.sharepoint_link && v.version_letter !== "-" && (
                        <a href={v.sharepoint_link} target="_blank" rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium"
                          style={{ color:"#60a5fa" }}>
                          <LuShare2 size={11} /> SharePoint
                        </a>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}

              </> /* end detail tab */}

              {/* ── Consultation tab ──────────────────────── */}
              {activeTab === "consultation" && (
                <div>
                  {timeline.length === 0 ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <LuFileText size={32} style={{ color:"var(--ged-tx3)" }} />
                      <p className="text-sm m-0" style={{ color:"var(--ged-tx3)" }}>Aucune activité enregistrée.</p>
                    </div>
                  ) : (
                    <div className="relative pl-2">
                      <div className="absolute left-[28px] top-5 bottom-5 w-px"
                        style={{ background:"linear-gradient(to bottom,rgba(74,184,63,0.4) 0%,rgba(148,163,184,0.1) 100%)" }} />
                      <div className="flex flex-col">
                        {timeline.map((event, idx) => {
                          const TYPE_CFG = {
                            STATUS_CHANGE:      { text:"#a5b4fc", Icon:LuArrowRight,  label:"Changement de statut" },
                            DOCUMENT_CREATED:   { text:"#4ab83f", Icon:LuCheck,       label:"Création" },
                            AUTO_ARCHIVE:       { text:"#94a3b8", Icon:LuArchive,     label:"Archivage automatique" },
                            VERSION_SUPERSEDED: { text:"#fb923c", Icon:LuRefreshCw,   label:"Version remplacée" },
                          };
                          let cfg;
                          if (event.type === "VERSION")     cfg = { text:"#4ab83f", Icon:LuRefreshCw, label:"Nouvelle version" };
                          else if (event.type === "VALIDATION") cfg = { text:"#a5b4fc", Icon:LuCheck, label:"Validation" };
                          else cfg = TYPE_CFG[event.action] || { text:"#94a3b8", Icon:LuFileText, label: event.action || "Activité" };
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
                                {event.type === "VERSION" && (
                                  <p className="m-0 text-xs" style={{ color:"var(--ged-tx2)" }}>
                                    <span className="font-mono font-bold" style={{ color:"#4ab83f" }}>{event.version_letter}</span>
                                    {event.change_summary && <span> · {event.change_summary}</span>}
                                  </p>
                                )}
                                {event.type === "LOG" && event.user_id && (
                                  <p className="m-0 mt-0.5 text-[11px]" style={{ color:"var(--ged-tx3)" }}>
                                    {details.user_name || `Utilisateur #${event.user_id}`}
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

              <button onClick={closeDoc} className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer"
                style={{ background:"var(--ged-card)", borderColor:"rgba(255,255,255,0.1)", color:"var(--ged-tx2)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.2)"; e.currentTarget.style.color="white"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="var(--ged-tx2)"; }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Preview modal ════════════════════════════════════ */}
      {previewOpen && (
        <div onClick={() => setPreviewOpen(false)} className="fixed inset-0 z-[1100] flex flex-col items-center justify-center" style={{ background:"rgba(5,12,20,0.9)", backdropFilter:"blur(8px)" }}>
          <div onClick={e => e.stopPropagation()} className="w-[90vw] h-[90vh] rounded-2xl flex flex-col overflow-hidden border" style={{ background:"#0d1f30", borderColor:"rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background:"var(--ged-card)", borderColor:"var(--ged-border)" }}>
              <span className="text-sm font-semibold text-white flex items-center gap-1.5"><LuFile size={14} /> {previewFile?.split("/").pop()}</span>
              <button onClick={() => { setPreviewOpen(false); setPreviewFile(null); }} style={{ color:"var(--ged-tx2)" }} onMouseEnter={e=>e.currentTarget.style.color="white"} onMouseLeave={e=>e.currentTarget.style.color="var(--ged-tx2)"}>
                <LuX size={18} />
              </button>
            </div>
            <iframe src={`${BACKEND}/preview/${(previewFile||"").split("/").map(encodeURIComponent).join("/")}`} title="preview" className="flex-1 border-none w-full" />
          </div>
        </div>
      )}

      {/* ══ New version modal ════════════════════════════════ */}
      {newVerOpen && selected && (() => {
        const nextVer = (() => {
          const raw = selected.current_version || "-";
          const c = raw.replace(/^v/, "");
          const vv = (selected.validated_version || "").replace(/^v/, "");
          if (c === "-") return "A";
          if (/^[A-Z]$/i.test(c)) return `${c.toUpperCase()}1`;
          const m = c.match(/^([A-Z])(\d+)$/i);
          if (!m) return "A";
          const [, letter, num] = m;
          if (vv && c === vv) return String.fromCharCode(letter.toUpperCase().charCodeAt(0) + 1);
          const n = parseInt(num);
          if (n < 9) return `${letter.toUpperCase()}${n + 1}`;
          return String.fromCharCode(letter.toUpperCase().charCodeAt(0) + 1);
        })();
        return (
          <div onClick={() => setNewVerOpen(false)} className="fixed inset-0 z-[1200] flex items-center justify-center" style={{ background:"rgba(5,12,20,0.4)", backdropFilter:"blur(8px)" }}>
            <form onClick={e => e.stopPropagation()} onSubmit={handleNewVersion}
              className="rounded-2xl w-[680px] flex flex-col border animate-fade-in overflow-hidden"
              style={{ background:"linear-gradient(160deg,#0f2140 0%,#0a1830 100%)", borderColor:"rgba(255,255,255,0.14)", boxShadow:"0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)" }}>

              {/* ── Header ── */}
              <div className="relative px-6 pt-5 pb-4" style={{ background:"linear-gradient(135deg,rgba(74,184,63,0.08),rgba(15,33,64,0))", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background:"linear-gradient(90deg,#4ab83f,#3da333,rgba(74,184,63,0))" }} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <LuHistory size={15} style={{ color:"#4ab83f" }} />
                      <span className="text-white font-bold text-base">Nouvelle version</span>
                    </div>
                    <p className="m-0 text-xs font-mono" style={{ color:"rgba(168,191,212,0.55)" }}>{selected.doc_code}</p>
                  </div>
                  <button type="button" onClick={() => setNewVerOpen(false)}
                    className="rounded-lg p-1.5 border transition-colors cursor-pointer flex-shrink-0 mt-0.5"
                    style={{ background:"rgba(255,255,255,0.05)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(168,191,212,0.5)" }}>
                    <LuX size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold font-mono" style={{ background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.1)" }}>
                    {selected.current_version || "—"}
                  </span>
                  <LuArrowRight size={11} style={{ color:"rgba(168,191,212,0.4)" }} />
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold font-mono" style={{ background:"rgba(74,184,63,0.15)", color:"#4ab83f", border:"1px solid rgba(74,184,63,0.28)" }}>
                    {nextVer}
                  </span>
                  <span className="text-xs" style={{ color:"rgba(168,191,212,0.4)" }}>· version suivante</span>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="flex flex-col gap-4 px-6 py-5">

                {/* File drop zone */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color:"rgba(168,191,212,0.65)" }}>
                    Nouveau fichier <span style={{ color:"#4ab83f" }}>*</span>
                  </label>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-5"
                    style={{ borderColor: newFile ? "rgba(74,184,63,0.45)" : "rgba(255,255,255,0.1)", background: newFile ? "rgba(74,184,63,0.05)" : "rgba(255,255,255,0.015)" }}>
                    <input type="file" required className="hidden" onChange={e => setNewFile(e.target.files[0])} />
                    {newFile ? (
                      <>
                        <LuFile size={22} style={{ color:"#4ab83f" }} />
                        <span className="text-sm font-semibold max-w-[560px] truncate px-2 text-center" style={{ color:"#4ab83f" }}>{newFile.name}</span>
                        <span className="text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>
                          {(newFile.size / 1024 / 1024).toFixed(2)} Mo · Cliquer pour changer
                        </span>
                      </>
                    ) : (
                      <>
                        <LuUpload size={22} style={{ color:"rgba(168,191,212,0.35)" }} />
                        <span className="text-sm" style={{ color:"rgba(168,191,212,0.55)" }}>Cliquer pour sélectionner un fichier</span>
                        <span className="text-xs" style={{ color:"rgba(168,191,212,0.3)" }}>PDF, DOCX, XLSX…</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Summary */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color:"rgba(168,191,212,0.65)" }}>
                    Résumé des changements <span style={{ color:"#4ab83f" }}>*</span>
                  </label>
                  <textarea required rows={3} value={summary} onChange={e => setSummary(e.target.value.slice(0, 500))}
                    placeholder="Décrivez les modifications apportées à cette version…"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none outline-none transition-colors"
                    style={{ background:"rgba(255,255,255,0.05)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.85)", fontFamily:"inherit" }} />
                  <p className="m-0 mt-1 text-right text-xs" style={{ color: summary.length > 450 ? "#f87171" : "rgba(168,191,212,0.3)" }}>
                    {summary.length}/500
                  </p>
                </div>

                {/* SharePoint */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color:"rgba(168,191,212,0.65)" }}>
                    Lien SharePoint <span className="font-normal normal-case" style={{ color:"rgba(168,191,212,0.35)" }}>(optionnel)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <LuLink size={12} style={{ color:"rgba(168,191,212,0.35)" }} />
                    </div>
                    <input type="url" value={spLink} onChange={e => setSpLink(e.target.value)} placeholder="https://..."
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                      style={{ background:"rgba(255,255,255,0.05)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.85)" }} />
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="flex gap-2.5 px-6 pb-5">
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 rounded-xl border-none text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: submitting ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#4ab83f,#3da333)",
                    boxShadow: submitting ? "none" : "0 4px 20px rgba(74,184,63,0.38)",
                    cursor: submitting ? "not-allowed" : "pointer",
                    color: submitting ? "rgba(168,191,212,0.45)" : "white",
                  }}>
                  {submitting
                    ? <><LuRefreshCw size={14} className="animate-spin" /> Enregistrement…</>
                    : <><LuCircleCheckBig size={15} /> Créer la version</>}
                </button>
                <button type="button" onClick={() => setNewVerOpen(false)}
                  className="px-5 py-3 rounded-xl text-sm border transition-all cursor-pointer"
                  style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(168,191,212,0.65)" }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ── Confirmation modal for status transition ──────── */}
      {confirmTransition && selected && (() => {
        const { next, cfg, NI } = confirmTransition;
        const fromCfg  = sCfg(selected.status_name);
        const FromIcon = fromCfg.Icon;
        const isIrreversible = ["Validé","Diffusé","Obsolète","Archivé"].includes(next);

        // Previous status in the ISO lifecycle
        const curIdx  = ISO_LIFECYCLE.indexOf(selected.status_name);
        const prevStatus = curIdx > 0 ? ISO_LIFECYCLE[curIdx - 1] : null;
        const prevCfg    = prevStatus ? sCfg(prevStatus) : null;
        const PrevIcon   = prevCfg?.Icon;
        const canGoBack  = prevStatus && ["Admin", "Ing. Qualité"].includes(userRole) && selected.status_name !== "Archivé";

        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
            onClick={() => setConfirmTransition(null)}
          >
            <div
              className="rounded-2xl border overflow-hidden w-full max-w-md mx-4"
              style={{ background: "var(--ged-bg)", borderColor: cfg.border, boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${cfg.border}` }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b flex items-center gap-3"
                style={{ background: `${cfg.bg}`, borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.bg}`, border: `1.5px solid ${cfg.border}` }}>
                  <NI size={18} style={{ color: cfg.text }} />
                </div>
                <div>
                  <p className="m-0 text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(168,191,212,0.5)" }}>Confirmation requise</p>
                  <p className="m-0 text-[15px] font-bold text-white">Changement de statut</p>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-5 flex flex-col gap-4">

                {/* From → To */}
                <div className="flex items-center justify-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ background: fromCfg.bg, border: `1px solid ${fromCfg.border}` }}>
                    <FromIcon size={12} style={{ color: fromCfg.text }} />
                    <span className="text-[12px] font-semibold" style={{ color: fromCfg.text }}>{selected.status_name}</span>
                  </div>
                  <span className="text-base font-bold" style={{ color: "rgba(168,191,212,0.4)" }}>→</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <NI size={12} style={{ color: cfg.text }} />
                    <span className="text-[12px] font-bold" style={{ color: cfg.text }}>{next}</span>
                  </div>
                </div>

                {/* Document name */}
                <p className="text-sm text-center m-0" style={{ color: "rgba(168,191,212,0.7)" }}>
                  Document : <strong className="text-white">{selected.title}</strong>
                </p>

                {/* Warning if irreversible */}
                {isIrreversible && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
                    <LuTriangleAlert size={14} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
                    <p className="m-0 text-[12px]" style={{ color: "rgba(251,191,36,0.85)" }}>
                      Cette transition est <strong>difficile à annuler</strong>. Assurez-vous que le document est prêt avant de confirmer.
                    </p>
                  </div>
                )}

                {/* Confirm + Cancel */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setConfirmTransition(null); handleStatusChange(next); }}
                    disabled={statusChanging}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold border-none flex items-center justify-center gap-1.5 transition-all"
                    style={{ background: `linear-gradient(135deg, ${cfg.text}cc, ${cfg.text}99)`, color: "#fff", cursor: "pointer", boxShadow: `0 4px 14px ${cfg.text}40` }}
                  >
                    <LuCircleCheck size={14} /> Confirmer
                  </button>
                  <button
                    onClick={() => setConfirmTransition(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)", color: "rgba(168,191,212,0.7)", cursor: "pointer" }}
                  >
                    Annuler
                  </button>
                </div>

                {/* Rollback to previous status */}
                {prevStatus && (
                  <div className="rounded-xl border overflow-hidden"
                    style={{ borderColor: canGoBack ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.06)" }}>
                    <div className="px-3 py-2 flex items-center gap-1.5 border-b"
                      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                      <LuRefreshCw size={10} style={{ color: "rgba(168,191,212,0.4)" }} />
                      <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(168,191,212,0.4)" }}>
                        Retour au statut précédent
                      </span>
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {prevCfg && PrevIcon && (
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: prevCfg.bg, border: `1px solid ${prevCfg.border}` }}>
                            <PrevIcon size={12} style={{ color: prevCfg.text }} />
                          </div>
                        )}
                        <div>
                          <p className="m-0 text-[12px] font-semibold" style={{ color: canGoBack ? prevCfg?.text : "rgba(168,191,212,0.35)" }}>
                            {prevStatus}
                          </p>
                          <p className="m-0 text-[10px]" style={{ color: "rgba(168,191,212,0.35)" }}>
                            {canGoBack ? "Transition disponible" : "Non autorisé pour votre rôle"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { if (canGoBack) { setConfirmTransition(null); handleStatusChange(prevStatus); } }}
                        disabled={!canGoBack || statusChanging}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                        style={{
                          background: canGoBack ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${canGoBack ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.07)"}`,
                          color: canGoBack ? "#fbbf24" : "rgba(168,191,212,0.3)",
                          cursor: canGoBack ? "pointer" : "not-allowed",
                        }}
                      >
                        {canGoBack ? <><LuRefreshCw size={10} /> Retourner</> : <><LuLock size={10} /> Verrouillé</>}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}