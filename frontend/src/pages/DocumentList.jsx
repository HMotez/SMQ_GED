// ============================================================
// DocumentList.jsx — ACTIA ES · Dark Login-Style Premium Design
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext";
import UserSelector from "../components/UserSelector";
import useRoleCheck from "../hooks/useRoleCheck";
import { AccessDeniedMessage, DocumentAccessStatus, DocumentRolePermissionsMatrix, RoleInfoBadge } from "../components/RoleBasedAccess";
import AppSidebar from "../components/AppSidebar";
import {
  LuPencil, LuPenLine, LuEye, LuCircleCheckBig, LuShare2,
  LuTriangleAlert, LuCircleHelp, LuCheck, LuClock, LuRefreshCw,
  LuInbox, LuX, LuLock, LuPlus, LuFile, LuDownload,
  LuFolder, LuArrowRight, LuArchive, LuFileText, LuClipboardCheck, LuChevronDown,
} from "react-icons/lu";
import { toast } from "sonner";

import { API, BACKEND } from "../config";

const ISO_LIFECYCLE   = ["Brouillon","En rédaction","En relecture","En validation","Validé","Diffusé","Obsolète","Archivé"];
const LOCKED_STATUSES = ["Validé","Diffusé","Obsolète","Archivé"];
const TERMINAL_STATUS = "Archivé";
const ALLOWED_TRANSITIONS = {
  "Brouillon":     ["En rédaction"],
  "En rédaction":  ["En relecture"],
  "En relecture":  ["En validation"],
  "En validation": ["Validé"],
  "Validé":        ["Diffusé"],
  "Diffusé":       ["Obsolète"],
  "Obsolète":      ["Archivé"],
  "Archivé":       [],
};

/* Dark-adapted status config */
const STATUS_CFG = {
  "Brouillon":     { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)", Icon:LuPencil          },
  "En rédaction":  { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(187,247,208,0.15)", Icon:LuPenLine         },
  "En relecture":  { bg:"rgba(239,246,255,0.08)", text:"#60a5fa", border:"rgba(191,219,254,0.15)", Icon:LuEye             },
  "En validation": { bg:"rgba(238,242,255,0.08)", text:"#a5b4fc", border:"rgba(199,210,254,0.15)", Icon:LuClipboardCheck  },
  "Validé":        { bg:"rgba(240,253,244,0.08)", text:"#4ade80", border:"rgba(134,239,172,0.2)",  Icon:LuCircleCheckBig  },
  "Diffusé":       { bg:"rgba(240,253,250,0.08)", text:"#2dd4bf", border:"rgba(153,246,228,0.15)", Icon:LuShare2          },
  "Obsolète":      { bg:"rgba(255,247,237,0.08)", text:"#fb923c", border:"rgba(254,215,170,0.15)", Icon:LuTriangleAlert   },
  "Archivé":       { bg:"rgba(248,250,252,0.06)", text:"#94a3b8", border:"rgba(203,213,225,0.12)", Icon:LuArchive         },
};
const sCfg = (n) => STATUS_CFG[n] || { bg:"rgba(243,244,246,0.08)", text:"#9ca3af", border:"rgba(209,213,219,0.15)", Icon:LuCircleHelp };

/* ── Status badge ─────────────────────────────────────────── */
function StatusBadge({ name, size = "sm" }) {
  const s = sCfg(name);
  const SI = s.Icon;
  return (
    <span className={`inline-flex items-center gap-1 ${size==="lg"?"px-3 py-1 text-xs":"px-2 py-0.5 text-[11px]"} font-semibold rounded-full whitespace-nowrap border`}
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
      <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color:"rgba(168,191,212,0.6)" }}>Cycle de vie ISO 9001</p>
      <div className="flex items-center overflow-x-auto pb-1">
        {ISO_LIFECYCLE.map((s, i) => {
          const cfg = sCfg(s);
          const CI = cfg.Icon;
          const done = i < idx, curr = i === idx;
          return (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-1 min-w-[56px]">
                <div className="w-7 h-7 rounded-full flex items-center justify-center border-2" style={{
                  background:curr?cfg.bg:done?"rgba(74,184,63,0.12)":"rgba(255,255,255,0.04)",
                  borderColor:curr?cfg.border:done?"rgba(74,184,63,0.4)":"rgba(255,255,255,0.1)",
                }}>
                  {done ? <LuCheck size={12} style={{ color:"#4ade80" }} />
                        : curr ? <CI size={12} style={{ color:cfg.text }} />
                        : <span className="text-xs" style={{ color:"rgba(168,191,212,0.4)" }}>{i+1}</span>}
                </div>
                <span className="text-[10px] text-center leading-tight max-w-[52px] break-words"
                  style={{ color:curr?cfg.text:done?"#4ade80":"rgba(168,191,212,0.4)", fontWeight:curr?700:400 }}>{s}</span>
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
        background:target===current?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.04)",
        color:target===current?"white":disabled?"rgba(168,191,212,0.3)":"rgba(168,191,212,0.7)",
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
      {start > 1 && <span className="px-1" style={{ color:"rgba(168,191,212,0.4)" }}>…</span>}
      {pages.map(p => <PagBtn key={p} label={p} target={p} current={page} onChange={onChange} />)}
      {end < totalPages && <span className="px-1" style={{ color:"rgba(168,191,212,0.4)" }}>…</span>}
      <PagBtn label="›" target={page+1}     current={page} disabled={page===totalPages} onChange={onChange} />
      <PagBtn label="»" target={totalPages} current={page} disabled={page===totalPages} onChange={onChange} />
      <span className="text-sm ml-2" style={{ color:"rgba(168,191,212,0.5)" }}>Page {page} / {totalPages}</span>
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
          background: value ? "rgba(74,184,63,0.08)" : "rgba(255,255,255,0.04)",
          borderColor: value ? "rgba(74,184,63,0.4)" : "rgba(255,255,255,0.1)",
          color: value ? "rgba(255,255,255,0.9)" : "rgba(168,191,212,0.55)",
          cursor: "pointer",
        }}>
        <span className="truncate">{label}</span>
        <LuChevronDown size={13} style={{ flexShrink:0, marginLeft:6, color:"rgba(168,191,212,0.4)", transform: open?"rotate(180deg)":"none", transition:"transform 0.2s" }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 rounded-xl overflow-hidden z-50"
          style={{ background:"rgba(10,22,36,0.98)", border:"1px solid rgba(255,255,255,0.12)", boxShadow:"0 20px 60px rgba(0,0,0,0.6)", minWidth:"100%", maxHeight:280, overflowY:"auto" }}>
          <button type="button" onClick={() => { onChange(""); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm"
            style={{ color: !value ? "#4ade80" : "rgba(168,191,212,0.5)", background: !value ? "rgba(74,184,63,0.08)" : "transparent" }}>
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
                    color: String(main.id) === String(value) ? "#4ade80" : "rgba(168,191,212,0.8)",
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
  const { can, currentUser } = useUser();
  const { canPerformAction, getBlockReason, canTransitionStatus } = useRoleCheck();

  const [documents,    setDocuments]    = useState([]);
  const [pagination,   setPagination]   = useState({ total:0,page:1,limit:15,totalPages:1 });
  const [stats,        setStats]        = useState({ total:0,overdue:0,byStatus:{} });
  const [types,        setTypes]        = useState([]);
  const [filterOpts,   setFilterOpts]   = useState({ responsables:[],processes:[] });
  const [folderTree,   setFolderTree]   = useState([]); // [{id, name, children:[{id,name}]}]
  const [loading,      setLoading]      = useState(true);
  const [filters, setFilters] = useState({ keyword:"",docCode:"",typeId:"",statusName:"",processId:"",responsible:"",overdue:false });
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  const [selected,       setSelected]       = useState(null);
  const [versions,       setVersions]       = useState([]);
  const [previewOpen,    setPreviewOpen]     = useState(false);
  const [previewFile,    setPreviewFile]     = useState(null);
  const [newVerOpen,     setNewVerOpen]      = useState(false);
  const [downloadOpen,   setDownloadOpen]    = useState(false);
  const [summary,        setSummary]         = useState("");
  const [newFile,        setNewFile]         = useState(null);
  const [submitting,     setSubmitting]      = useState(false);
  const [statusChanging, setStatusChanging]  = useState(false);
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
  const setFilter = (key, value) => { setFilters(f => ({ ...f, [key]:value })); setPage(1); };
  const clearAllFilters = () => { setFilters({ keyword:"",docCode:"",typeId:"",statusName:"",processId:"",responsible:"",overdue:false }); setPage(1); };
  const hasActiveFilters = Object.values(filters).some(v => v !== "" && v !== false);

  const openDoc = async (doc) => {
    setSelected(doc); setVersions([]);
    try { const res = await axios.get(`${API}/documents/${doc.id}/versions`); setVersions(res.data); } catch { /* silent */ }
  };
  const closeDoc = () => { setSelected(null); setVersions([]); setNewVerOpen(false); setSummary(""); setNewFile(null); };

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

  const handleDownload = async (filename) => {
    try {
      const response = await fetch(`${BACKEND}/download/${encodeURIComponent(filename)}`);
      if (!response.ok) throw new Error("Erreur serveur");
      const blob = await response.blob(); const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href=url; link.download=filename;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch { toast.error("Impossible de télécharger le fichier."); }
  };

  const handleNewVersion = async (e) => {
    e.preventDefault();
    if (!newFile) return void toast.warning("Veuillez sélectionner un fichier.");
    if (!summary.trim()) return void toast.warning("Le résumé des changements est obligatoire.");
    setSubmitting(true);
    try {
      const form = new FormData(); form.append("file", newFile); form.append("change_summary", summary.trim());
      const res = await axios.put(`${API}/documents/${selected.id}`, form, { headers:{ "Content-Type":"multipart/form-data" } });
      const [docRes, verRes] = await Promise.all([axios.get(`${API}/documents/${selected.id}`), axios.get(`${API}/documents/${selected.id}/versions`)]);
      setSelected(docRes.data); setVersions(verRes.data);
      setDocuments(prev => prev.map(d => d.id===selected.id ? { ...d, current_version:res.data.version } : d));
      setNewVerOpen(false); setSummary(""); setNewFile(null); toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.error || "Erreur lors de la création de la version."); }
    finally { setSubmitting(false); }
  };

  const isLocked   = (n) => LOCKED_STATUSES.includes(n);
  const isTerminal = (n) => n === TERMINAL_STATUS;
  const nextSteps  = (n) => ALLOWED_TRANSITIONS[n] || [];

  /* ── Input/select shared dark style ─────────────────────── */
  const inputStyle = (active) => ({
    background: active ? "rgba(74,184,63,0.08)" : "rgba(255,255,255,0.04)",
    borderColor: active ? "rgba(74,184,63,0.4)" : "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.85)",
  });

  /* ── Sidebar middle content ───────────────────────────────── */
  const sidebarMiddle = (
    <div className="px-2.5 pt-1 pb-2 flex flex-col gap-1">
      <button onClick={() => setFilter("overdue", !filters.overdue)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold border transition-all"
        style={{
          background:filters.overdue?"rgba(251,146,60,0.12)":"transparent",
          borderColor:filters.overdue?"rgba(251,146,60,0.3)":"rgba(255,255,255,0.08)",
          color:filters.overdue?"#fb923c":"rgba(168,191,212,0.7)",
        }}>
        <span className="flex items-center gap-1.5"><LuClock size={13} /> En retard</span>
        {stats.overdue > 0 && <span className="rounded-full px-1.5 py-px text-[11px] font-bold" style={{ background:"#ea580c", color:"white" }}>{stats.overdue}</span>}
      </button>
      <p className="text-[10px] uppercase tracking-[1px] font-bold px-1 mt-2 mb-1" style={{ color:"rgba(168,191,212,0.4)" }}>Par statut</p>
      {ISO_LIFECYCLE.map(s => {
        const cnt = stats.byStatus?.[s] || 0;
        if (!cnt) return null;
        const cfg = sCfg(s);
        const CI = cfg.Icon;
        const active = filters.statusName === s;
        return (
          <button key={s} onClick={() => setFilter("statusName", active?"":s)}
            className="flex justify-between items-center w-full px-2 py-1.5 rounded-md text-xs transition-all border"
            style={{
              background:active?`${cfg.bg}`:"transparent",
              borderColor:active?cfg.border:"transparent",
              color:active?cfg.text:"rgba(168,191,212,0.6)",
            }}>
            <span className="flex items-center gap-1"><CI size={10} /> {s}</span>
            <span className="rounded-full px-1.5 py-px text-[11px]" style={{ color:"rgba(168,191,212,0.5)" }}>{cnt}</span>
          </button>
        );
      })}
    </div>
  );

  const sidebarBottom = (
    <>
      <div className="rounded-xl px-3.5 py-3 border" style={{ background:"rgba(74,184,63,0.08)", borderColor:"rgba(74,184,63,0.2)" }}>
        <p className="text-[10px] uppercase tracking-[1px] font-bold m-0" style={{ color:"rgba(168,191,212,0.5)" }}>Total</p>
        <p className="font-black text-2xl m-0" style={{ color:"#4ab83f" }}>{stats.total}</p>
        <p className="text-xs m-0 mt-0.5" style={{ color:"rgba(168,191,212,0.4)" }}>documents</p>
      </div>
      <UserSelector />
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background:"linear-gradient(145deg,#0a1420 0%,#0f1e30 35%,#1a2f4a 70%,#1e3a55 100%)" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .animate-fade-in { animation: fadeIn 0.2s ease; }
      `}</style>

      <AppSidebar user={currentUser} middleContent={sidebarMiddle} bottomContent={sidebarBottom} />

      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Header ────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-8 py-4 border-b"
          style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(20px)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 1px 0 rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"linear-gradient(135deg,rgba(74,184,63,0.18),rgba(74,184,63,0.08))", border:"1.5px solid rgba(74,184,63,0.3)", boxShadow:"0 4px 14px rgba(74,184,63,0.15)" }}>
              <LuFileText size={19} style={{ color:"#4ab83f" }} />
            </div>
            <div>
              <h1 className="m-0 font-extrabold text-white" style={{ fontSize:21, letterSpacing:"-0.022em", lineHeight:1.2 }}>Documents</h1>
              <p className="m-0 text-xs mt-0.5" style={{ color:"rgba(168,191,212,0.48)" }}>
                {pagination.total} document{pagination.total>1?"s":""}
                {filters.overdue    && <span style={{ color:"#fb923c" }}> · En retard</span>}
                {filters.statusName && <span style={{ color:"rgba(168,191,212,0.7)" }}> · {filters.statusName}</span>}
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
          style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.06)" }}>
          <div className="flex gap-2.5 flex-wrap">
            <div className="relative flex-shrink-0 w-[190px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-mono" style={{ color:"rgba(168,191,212,0.5)" }}>#</span>
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
            {[
              { value:filters.typeId,     onChange:(e)=>setFilter("typeId",e.target.value),     placeholder:"Type",   options:types.map(t=>({value:t.id,label:`${t.code} — ${t.label}`})) },
              { value:filters.statusName, onChange:(e)=>setFilter("statusName",e.target.value), placeholder:"Statut", options:ISO_LIFECYCLE.map(s=>({value:s,label:s})) },
            ].map(({ value, onChange, placeholder, options }) => (
              <select key={placeholder} value={value} onChange={onChange} className="px-3 py-2 rounded-lg border text-sm outline-none cursor-pointer" style={inputStyle(!!value)}>
                <option value="">{placeholder}</option>
                {options.map(o => <option key={o.value} value={o.value} style={{ background:"#1a2f4a" }}>{o.label}</option>)}
              </select>
            ))}

            <ProcessDropdown
              folderTree={folderTree}
              value={filters.processId}
              onChange={(v) => setFilter("processId", v)}
            />
            <button onClick={() => setFilter("overdue", !filters.overdue)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border transition-all"
              style={{
                background:filters.overdue?"rgba(251,146,60,0.1)":"rgba(255,255,255,0.04)",
                borderColor:filters.overdue?"rgba(251,146,60,0.35)":"rgba(255,255,255,0.1)",
                color:filters.overdue?"#fb923c":"rgba(168,191,212,0.6)",
              }}>
              <LuClock size={13} /> En retard {filters.overdue && <LuCheck size={12} />}
            </button>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm border transition-all"
                style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.6)" }}>
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
              {filters.statusName  && <ActiveTag label={`Statut: ${filters.statusName}`}       onRemove={() => setFilter("statusName","")} />}
              {filters.processId   && <ActiveTag label={`Processus: ${(folderTree.flatMap(s=>s.children||[]).find(f=>f.id==filters.processId)?.name || filters.processId).replace(/_/g," ")}`} onRemove={() => setFilter("processId","")} />}
              {filters.overdue     && <ActiveTag label="En retard"                             onRemove={() => setFilter("overdue",false)} />}
            </div>
          )}
        </div>

        {/* ── Document table ─────────────────────────────────── */}
        <div className="flex-1 px-8 py-5">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16" style={{ color:"rgba(168,191,212,0.5)" }}>
              <LuRefreshCw size={32} className="animate-spin" style={{ color:"rgba(74,184,63,0.5)" }} />
              <p className="m-0 text-sm">Chargement…</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <LuInbox size={40} style={{ color:"rgba(168,191,212,0.2)" }} />
              <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>Aucun document trouvé</p>
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
              <div className="rounded-2xl overflow-hidden border" style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                {/* Header */}
                <div className="grid px-5 py-2.5 border-b" style={{ gridTemplateColumns:"155px 1fr 120px 110px 155px 105px 28px", background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.07)" }}>
                  {["Référence","Titre","Responsable","Type","Statut","Revue",""].map(h => (
                    <span key={h} className="text-[11px] font-bold uppercase tracking-[0.8px]" style={{ color:"rgba(168,191,212,0.5)" }}>{h}</span>
                  ))}
                </div>
                {/* Rows */}
                {documents.map((doc, i) => (
                  <div key={doc.id} onClick={() => openDoc(doc)}
                    className="grid px-5 py-3 items-center cursor-pointer transition-all duration-150"
                    style={{
                      gridTemplateColumns:"155px 1fr 120px 110px 155px 105px 28px",
                      borderBottom: i < documents.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      background: doc.is_overdue ? "rgba(251,146,60,0.04)" : "transparent",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = doc.is_overdue?"rgba(251,146,60,0.04)":"transparent"}
                  >
                    <span className="font-mono font-bold text-sm" style={{ color:"#4ab83f" }}>{doc.doc_code}</span>
                    <div className="overflow-hidden pr-3">
                      <p className="m-0 text-sm font-medium text-white truncate">{doc.title}</p>
                      {doc.folder_name && (
                        <p className="m-0 mt-0.5 text-xs flex items-center gap-1" style={{ color:"rgba(168,191,212,0.45)" }}>
                          <LuFolder size={10} /> {doc.folder_name}
                        </p>
                      )}
                    </div>
                    <span className="text-sm truncate" style={{ color:"rgba(168,191,212,0.6)" }}>{doc.responsible||"—"}</span>
                    <span className="px-2 py-0.5 rounded-md text-[13px] font-semibold w-fit border" style={{ background:"rgba(96,165,250,0.1)", color:"#60a5fa", borderColor:"rgba(96,165,250,0.2)" }}>
                      {doc.type_code}
                    </span>
                    <StatusBadge name={doc.status_name} />
                    <span className="text-sm" style={{ color:doc.is_overdue?"#fb923c":"rgba(168,191,212,0.5)", fontWeight:doc.is_overdue?600:400 }}>
                      {doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—"}
                    </span>
                    <span className="flex items-center">
                      {doc.is_overdue && <LuClock size={13} style={{ color:"#fb923c" }} />}
                    </span>
                  </div>
                ))}
              </div>
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={p => setPage(p)} />
            </>
          )}
        </div>
      </main>

      {/* ══ Document detail modal ════════════════════════════ */}
      {selected && (
        <div onClick={closeDoc} className="fixed inset-0 flex items-center justify-center z-[1000] p-6 animate-fade-in"
          style={{ background:"rgba(5,12,20,0.85)", backdropFilter:"blur(8px)" }}>
          <div onClick={e => e.stopPropagation()} className="rounded-2xl w-full max-w-[700px] max-h-[90vh] overflow-auto border"
            style={{ background:"#0d1f30", borderColor:"rgba(255,255,255,0.12)", boxShadow:"0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
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
                  <button onClick={closeDoc} className="p-1 flex items-center" style={{ color:"rgba(168,191,212,0.5)" }} onMouseEnter={e=>e.currentTarget.style.color="white"} onMouseLeave={e=>e.currentTarget.style.color="rgba(168,191,212,0.5)"}>
                    <LuX size={18} />
                  </button>
                </div>
              </div>

              <RoleInfoBadge />
              <DocumentAccessStatus document={selected} />
              <DocumentRolePermissionsMatrix document={selected} />
              <LifecycleBar currentStatus={selected.status_name} />

              {/* Status transition */}
              <div className="rounded-xl px-4 py-3.5 mb-5 border" style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-0.5 h-3.5 rounded-full" style={{ background:"#4ab83f" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color:"rgba(168,191,212,0.6)" }}>Transition de statut</p>
                </div>
                {isTerminal(selected.status_name) ? (
                  <p className="m-0 text-sm flex items-center gap-1.5" style={{ color:"rgba(168,191,212,0.5)" }}><LuArchive size={13} /> Document archivé — état terminal.</p>
                ) : nextSteps(selected.status_name).length === 0 ? (
                  <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>Aucune transition disponible.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {nextSteps(selected.status_name).map(next => {
                      const cfg = sCfg(next);
                      const NI = cfg.Icon;
                      const allowed = canTransitionStatus(selected.status_name, next);
                      const reason = !allowed ? getBlockReason("change_status", selected) : null;
                      return (
                        <button key={next} onClick={() => allowed && handleStatusChange(next)} disabled={statusChanging||!allowed} title={reason||undefined}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                          style={{ background:allowed?cfg.bg:"rgba(255,255,255,0.03)", borderColor:allowed?cfg.border:"rgba(255,255,255,0.08)", color:allowed?cfg.text:"rgba(168,191,212,0.35)", cursor:(statusChanging||!allowed)?"not-allowed":"pointer" }}>
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
                  ["Contexte",       selected.context||"—"],
                  ["Prochaine revue",selected.next_review_date?new Date(selected.next_review_date).toLocaleDateString("fr-FR"):"—"],
                  ["Créé le",        selected.created_at?new Date(selected.created_at).toLocaleDateString("fr-FR"):"—"],
                  ["Créé par",       selected.created_by_name||"—"],
                ].map(([l,v]) => (
                  <div key={l} className="rounded-lg px-3.5 py-2.5 border" style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
                    <p className="m-0 mb-0.5 text-xs uppercase tracking-[0.8px]" style={{ color:"rgba(168,191,212,0.45)" }}>{l}</p>
                    <p className="m-0 text-sm font-medium text-white">{v}</p>
                  </div>
                ))}
              </div>

              {/* Keywords */}
              {selected.keywords?.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3"><div className="w-0.5 h-3.5 rounded-full" style={{ background:"#4ab83f" }} /><p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color:"rgba(168,191,212,0.6)" }}>Mots-clés</p></div>
                  <div className="flex gap-1.5 flex-wrap">
                    {selected.keywords.map(k => (
                      <span key={k} className="rounded-full text-sm px-2.5 py-0.5 border" style={{ background:"rgba(96,165,250,0.1)", color:"#60a5fa", borderColor:"rgba(96,165,250,0.2)" }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* File */}
              {selected.file_name && (
                <div className="rounded-xl px-4 py-3.5 mb-5 border" style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <LuFileText size={24} style={{ color:"rgba(168,191,212,0.4)" }} />
                    <div>
                      <p className="m-0 text-sm font-semibold text-white">{selected.file_name}</p>
                      <p className="m-0 mt-0.5 text-xs" style={{ color:"rgba(168,191,212,0.45)" }}>Fichier document</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setPreviewFile(selected.file_name); setPreviewOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ background:"linear-gradient(135deg,#4ab83f,#3da333)", boxShadow:"0 4px 16px rgba(74,184,63,0.35)" }}>
                      <LuEye size={14} /> Visualiser
                    </button>
                    <div className="relative flex-1" ref={downloadRef}>
                      <button
                        onClick={() => versions.length > 1 ? setDownloadOpen(o => !o) : handleDownload(selected.file_name)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border transition-all"
                        style={{ background:"rgba(255,255,255,0.06)", borderColor:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.8)" }}>
                        <LuDownload size={14} /> Télécharger
                      </button>
                      {downloadOpen && versions.length > 1 && (
                        <div className="absolute bottom-[calc(100%+6px)] left-0 right-0 rounded-xl overflow-hidden z-20 border"
                          style={{ background:"#0d1f30", borderColor:"rgba(255,255,255,0.12)", boxShadow:"0 20px 60px rgba(0,0,0,0.55)" }}>
                          <p className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider border-b m-0"
                            style={{ color:"rgba(168,191,212,0.45)", borderColor:"rgba(255,255,255,0.07)" }}>
                            Choisir une version
                          </p>
                          {versions.map(v => (
                            <button key={v.id}
                              onClick={() => { handleDownload(v.file_name); setDownloadOpen(false); }}
                              className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm text-left border-b transition-all"
                              style={{ borderColor:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.8)", background:"transparent", cursor:"pointer" }}
                              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                              <span className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded" style={{ background:"rgba(74,184,63,0.12)", color:"#4ab83f" }}>
                                  v{v.version_letter}
                                </span>
                                <span style={{ color:"rgba(168,191,212,0.55)" }}>
                                  {v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR") : "—"}
                                </span>
                                {v.change_summary && (
                                  <span className="text-xs truncate max-w-[100px]" style={{ color:"rgba(168,191,212,0.4)" }}>
                                    — {v.change_summary}
                                  </span>
                                )}
                              </span>
                              <LuDownload size={12} style={{ color:"#4ab83f", flexShrink:0 }} />
                            </button>
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
                  <div className="flex items-center gap-2 mb-3"><div className="w-0.5 h-3.5 rounded-full" style={{ background:"#4ab83f" }} /><p className="text-xs font-semibold uppercase tracking-wider m-0" style={{ color:"rgba(168,191,212,0.6)" }}>🕐 Historique versions</p></div>
                  {versions.map(v => (
                    <div key={v.id} className="rounded-lg mb-1.5 px-3 py-2 border" style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.07)" }}>
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">v{v.version_letter}</span>
                        <span className="text-sm flex-1" style={{ color:"rgba(168,191,212,0.5)" }}>{v.created_at?new Date(v.created_at).toLocaleDateString("fr-FR"):"—"}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => { setPreviewFile(v.file_name); setPreviewOpen(true); }}
                            className="rounded-md px-2 py-0.5 text-xs flex items-center gap-1 border transition-all"
                            style={{ background:"rgba(255,255,255,0.05)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.7)", cursor:"pointer" }}>
                            <LuEye size={12} /> Consulter
                          </button>
                          <button onClick={() => handleDownload(v.file_name)}
                            className="rounded-md px-2 py-0.5 text-xs flex items-center gap-1 border transition-all"
                            style={{ background:"rgba(255,255,255,0.05)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.7)", cursor:"pointer" }}>
                            <LuDownload size={12} /> Télécharger
                          </button>
                        </div>
                      </div>
                      {v.change_summary && <p className="m-0 mt-1 text-sm" style={{ color:"rgba(168,191,212,0.55)" }}>{v.change_summary}</p>}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={closeDoc} className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer"
                style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.6)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.2)"; e.currentTarget.style.color="white"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="rgba(168,191,212,0.6)"; }}>
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

      {/* ══ New version modal ════════════════════════════════ */}
      {newVerOpen && selected && (
        <div onClick={() => setNewVerOpen(false)} className="fixed inset-0 z-[1200] flex items-center justify-center" style={{ background:"rgba(5,12,20,0.85)", backdropFilter:"blur(8px)" }}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleNewVersion}
            className="rounded-2xl p-6 w-[420px] flex flex-col gap-3.5 border animate-fade-in"
            style={{ background:"#0d1f30", borderColor:"rgba(255,255,255,0.12)", boxShadow:"0 40px 100px rgba(0,0,0,0.6)" }}>
            <h3 className="m-0 text-white text-base font-bold flex items-center gap-1.5"><LuPlus size={15} /> Nouvelle version — {selected.doc_code}</h3>
            <p className="m-0 text-sm" style={{ color:"rgba(168,191,212,0.6)" }}>
              Version actuelle : <strong className="text-white">v{selected.current_version}</strong> → Nouvelle : <strong style={{ color:"#4ab83f" }}>v{selected.current_version==="-"?"A":String.fromCharCode(selected.current_version.charCodeAt(0)+1)}</strong>
            </p>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color:"rgba(168,191,212,0.5)" }}>Nouveau fichier *</label>
              <input type="file" required onChange={e => setNewFile(e.target.files[0])}
                className="w-full px-3 py-1.5 rounded-lg border text-sm" style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.8)" }} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color:"rgba(168,191,212,0.5)" }}>Résumé des changements *</label>
              <textarea required rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Décrivez les modifications…"
                className="w-full px-3 py-1.5 rounded-lg border text-sm resize-y outline-none"
                style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.8)" }} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting}
                className="flex-1 py-2.5 rounded-xl border-none text-white text-sm font-bold flex items-center justify-center gap-1.5"
                style={{ background:submitting?"rgba(255,255,255,0.08)":"linear-gradient(135deg,#4ab83f,#3da333)", boxShadow:submitting?"none":"0 4px 16px rgba(74,184,63,0.35)", cursor:submitting?"not-allowed":"pointer", color:submitting?"rgba(168,191,212,0.4)":"white" }}>
                {submitting?"Enregistrement…":<><LuCircleCheckBig size={14} /> Créer la version</>}
              </button>
              <button type="button" onClick={() => setNewVerOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border transition-all cursor-pointer"
                style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(168,191,212,0.6)" }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}