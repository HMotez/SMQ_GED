// ============================================================
// DocumentList.jsx — ACTIA ES Brand Theme · Inter + Lucide
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext";
import UserSelector from "../components/UserSelector";
import useRoleCheck from "../hooks/useRoleCheck";
import {
  AccessDeniedMessage,
  DocumentAccessStatus,
  RoleInfoBadge,
} from "../components/RoleBasedAccess";
import {
  LuHouse, LuFilePlus, LuFileText, LuClipboardCheck, LuArchive,
  LuPencil, LuPenLine, LuEye, LuCircleCheckBig, LuShare2, LuTriangleAlert, LuCircleHelp,
  LuCheck, LuClock, LuRefreshCw, LuInbox,
  LuX, LuLock, LuUpload, LuPlus, LuFile, LuDownload,
  LuFolder, LuArrowRight,
} from "react-icons/lu";

const API = "http://localhost:4000/api";

/* ── ACTIA colors ─────────────────────────────────────────── */
const NAVY       = "#2e4a6b";
const NAVY_DARK  = "#1e3450";
const NAVY_LIGHT = "#3d5f84";
const GREEN      = "#4ab83f";
const BG         = "#f0f3f6";
const BORDER     = "#dde4ec";
const MUTED      = "#6b82a0";
const SURFACE    = "#ffffff";

/* ── ISO lifecycle ────────────────────────────────────────── */
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

const STATUS_CFG = {
  "Brouillon":     { bg:"#f3f4f6", text:"#6b7280", border:"#d1d5db", Icon: LuPencil       },
  "En rédaction":  { bg:"#f0fdf4", text:"#166534", border:"#bbf7d0", Icon: LuPenLine      },
  "En relecture":  { bg:"#eff6ff", text:"#1d4ed8", border:"#bfdbfe", Icon: LuEye          },
  "En validation": { bg:"#eef2ff", text:"#3730a3", border:"#c7d2fe", Icon: LuClipboardCheck },
  "Validé":        { bg:"#f0fdf4", text:"#15803d", border:"#86efac", Icon: LuCircleCheckBig },
  "Diffusé":       { bg:"#f0fdfa", text:"#0f766e", border:"#99f6e4", Icon: LuShare2       },
  "Obsolète":      { bg:"#fff7ed", text:"#c2410c", border:"#fed7aa", Icon: LuTriangleAlert },
  "Archivé":       { bg:"#f8fafc", text:"#475569", border:"#cbd5e1", Icon: LuArchive      },
};
const sCfg = (n) => STATUS_CFG[n] || { bg:"#f3f4f6", text:"#6b7280", border:"#d1d5db", Icon: LuCircleHelp };

/* ── Nav config ───────────────────────────────────────────── */
const NAV = [
  { icon: LuHouse,           label: "Accueil",          href: "/",            end: true  },
  { icon: LuFilePlus,       label: "Nouveau document", href: "/create",      end: false },
  { icon: LuFileText,       label: "Liste documents",  href: "/list",        end: false },
  { icon: LuClipboardCheck, label: "Validations",      href: "/validations", end: false },
  { icon: LuArchive,        label: "Archivage",        href: "/archive",     end: false },
];

/* ── Status badge ─────────────────────────────────────────── */
function StatusBadge({ name, size = "sm" }) {
  const s = sCfg(name);
  const SI = s.Icon;
  return (
    <span style={{ background:s.bg, color:s.text, border:`1px solid ${s.border}`, padding:size==="lg"?"4px 13px":"2px 9px", borderRadius:99, fontSize:size==="lg"?12:11, fontWeight:600, display:"inline-flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
      <SI size={size==="lg"?12:11} /> {name || "—"}
    </span>
  );
}

/* ── Lifecycle bar ────────────────────────────────────────── */
function LifecycleBar({ currentStatus }) {
  const idx = ISO_LIFECYCLE.indexOf(currentStatus);
  return (
    <div style={{ marginBottom:20 }}>
      <p style={{ color:MUTED, fontSize:10, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Cycle de vie ISO</p>
      <div style={{ display:"flex", alignItems:"center", overflowX:"auto" }}>
        {ISO_LIFECYCLE.map((s, i) => {
          const cfg = sCfg(s);
          const CurrIcon = cfg.Icon;
          const done = i < idx, curr = i === idx;
          return (
            <div key={s} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, minWidth:58 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:curr?cfg.bg:done?"#f0fdf4":"#f8fafc", border:`2px solid ${curr?cfg.border:done?"#86efac":BORDER}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {done ? <LuCheck size={12} style={{ color:"#15803d" }} /> : curr ? <CurrIcon size={12} /> : <span style={{ color:MUTED, fontSize:10 }}>{i+1}</span>}
                </div>
                <span style={{ fontSize:9, color:curr?cfg.text:done?"#15803d":MUTED, fontWeight:curr?700:400, textAlign:"center", lineHeight:1.2, maxWidth:54, wordBreak:"break-word" }}>{s}</span>
              </div>
              {i < ISO_LIFECYCLE.length-1 && (
                <div style={{ height:2, width:14, flexShrink:0, marginBottom:18, background:done?"#86efac":BORDER }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Pagination ───────────────────────────────────────────── */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  const btn = (label, target, disabled = false) => (
    <button key={label} onClick={() => !disabled && onChange(target)} disabled={disabled}
      style={{ padding:"5px 10px", borderRadius:7, fontSize:12, cursor:disabled?"default":"pointer", fontWeight:target===page?700:400, background:target===page?NAVY:SURFACE, color:target===page?"#fff":disabled?MUTED:NAVY, border:`1px solid ${target===page?NAVY:BORDER}`, transition:"all 0.12s" }}>
      {label}
    </button>
  );
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"center", padding:"20px 0" }}>
      {btn("«",1,page===1)}{btn("‹",page-1,page===1)}
      {start>1 && <span style={{ color:MUTED, padding:"0 4px" }}>…</span>}
      {pages.map(p => btn(p, p))}
      {end<totalPages && <span style={{ color:MUTED, padding:"0 4px" }}>…</span>}
      {btn("›",page+1,page===totalPages)}{btn("»",totalPages,page===totalPages)}
      <span style={{ color:MUTED, fontSize:11, marginLeft:8 }}>Page {page} / {totalPages}</span>
    </div>
  );
}

/* ── Active filter tag ────────────────────────────────────── */
function ActiveTag({ label, onRemove }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#eef3fa", border:`1px solid ${NAVY}33`, color:NAVY, borderRadius:99, padding:"2px 10px", fontSize:11 }}>
      {label}
      <button onClick={onRemove} style={{ background:"none", border:"none", color:NAVY, cursor:"pointer", fontSize:13, lineHeight:1, padding:0 }}>×</button>
    </span>
  );
}

/* ── Sidebar ──────────────────────────────────────────────── */
function Sidebar({ stats, filters, setFilter }) {
  return (
    <aside style={{ width:220, background:NAVY_DARK, borderRight:`1px solid ${NAVY_LIGHT}`, display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>

      {/* ACTIA Logo */}
      <div style={{ padding:"20px 16px 16px", borderBottom:`1px solid ${NAVY_LIGHT}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", gap:2, padding:6, background:NAVY, borderRadius:8 }}>
            {[...Array(3)].map((_,i) => (
              <div key={i} style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {[...Array(3)].map((_,j) => (
                  <div key={j} style={{ width:4, height:4, borderRadius:1, background:GREEN, opacity:(i+j)%2===0?1:0.5 }} />
                ))}
              </div>
            ))}
          </div>
          <div>
            <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
              <span style={{ color:"#fff", fontWeight:800, fontSize:13, letterSpacing:1.5 }}>ACTIA</span>
              <span style={{ color:GREEN, fontWeight:700, fontSize:10 }}>ES</span>
            </div>
            <p style={{ color:MUTED, fontSize:9, margin:0 }}>Documentation</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding:"10px 10px 0" }}>
        {NAV.map((navItem) => {
          const NavIcon = navItem.icon;
          return (
            <NavLink key={navItem.href} to={navItem.href} end={navItem.end}
              style={({ isActive }) => ({
                display:"flex", alignItems:"center", gap:9, padding:"9px 12px", borderRadius:8, marginBottom:2, textDecoration:"none",
                background:isActive?"rgba(74,184,63,0.1)":"transparent",
                color:isActive?GREEN:"#a8bfd4", fontWeight:isActive?600:400, fontSize:13,
                borderLeft:isActive?`3px solid ${GREEN}`:"3px solid transparent",
                transition:"all 0.12s",
              })}>
              <NavIcon size={16} style={{ flexShrink:0 }} />
              {navItem.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Overdue filter */}
      <div style={{ padding:"12px 10px 0" }}>
        <button onClick={() => setFilter("overdue", !filters.overdue)}
          style={{ width:"100%", padding:"8px 12px", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", background:filters.overdue?"rgba(194,65,12,0.15)":"transparent", border:`1px solid ${filters.overdue?"#c2410c55":"rgba(168,191,212,0.2)"}`, color:filters.overdue?"#fb923c":"#a8bfd4", fontSize:12, fontWeight:600, transition:"all 0.12s" }}>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}><LuClock size={13} /> En retard</span>
          {stats.overdue>0 && <span style={{ background:"#c2410c", color:"#fff", borderRadius:99, padding:"1px 7px", fontSize:10, fontWeight:700 }}>{stats.overdue}</span>}
        </button>
      </div>

      {/* Status filters */}
      <div style={{ padding:"12px 10px 0" }}>
        <p style={{ color:MUTED, fontSize:10, textTransform:"uppercase", letterSpacing:1, margin:"0 0 6px", paddingLeft:4 }}>Par statut</p>
        {ISO_LIFECYCLE.map(s => {
          const cnt = stats.byStatus?.[s] || 0; if (!cnt) return null;
          const cfg = sCfg(s); const CfgIcon = cfg.Icon; const active = filters.statusName === s;
          return (
            <button key={s} onClick={() => setFilter("statusName", active ? "" : s)}
              style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", padding:"5px 8px", borderRadius:6, marginBottom:2, background:active?"rgba(74,184,63,0.12)":"transparent", border:`1px solid ${active?"rgba(74,184,63,0.3)":"transparent"}`, cursor:"pointer", color:active?GREEN:"#a8bfd4", fontSize:11, transition:"all 0.1s" }}>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><CfgIcon size={10} /> {s}</span>
              <span style={{ background:"rgba(255,255,255,0.08)", borderRadius:99, padding:"1px 6px", fontSize:10, color:MUTED }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Total */}
      <div style={{ marginTop:"auto", padding:"12px 10px" }}>
        <div style={{ background:"rgba(74,184,63,0.12)", border:"1px solid rgba(74,184,63,0.25)", borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
          <p style={{ color:MUTED, fontSize:10, textTransform:"uppercase", letterSpacing:1, margin:"0 0 2px" }}>Total</p>
          <p style={{ color:GREEN, fontWeight:800, fontSize:26, margin:0 }}>{stats.total}</p>
          <p style={{ color:MUTED, fontSize:11, margin:"2px 0 0" }}>documents</p>
        </div>
        <UserSelector />
      </div>
    </aside>
  );
}

/* ── Input helper ─────────────────────────────────────────── */
const inp = (active = false) => ({
  background:active?"#f0fdf4":BG, border:`1px solid ${active?GREEN:BORDER}`,
  borderRadius:8, padding:"8px 12px", color:NAVY, fontSize:13, outline:"none",
  fontFamily:"inherit", width:"100%", transition:"border-color 0.15s",
});

const sectionLabel = { color:MUTED, fontSize:11, textTransform:"uppercase", letterSpacing:1, fontWeight:600, margin:"0 0 12px", display:"flex", alignItems:"center", gap:6 };
const bar = <span style={{ display:"inline-block", width:3, height:14, background:GREEN, borderRadius:99 }} />;

/* ══════════════════════════════════════════════════════════ */
export default function DocumentList() {
  const { can, currentUser } = useUser();
  const { canPerformAction, getBlockReason, canTransitionStatus } = useRoleCheck();

  const [documents,    setDocuments]    = useState([]);
  const [pagination,   setPagination]   = useState({ total:0, page:1, limit:15, totalPages:1 });
  const [stats,        setStats]        = useState({ total:0, overdue:0, byStatus:{} });
  const [types,        setTypes]        = useState([]);
  const [filterOpts,   setFilterOpts]   = useState({ responsables:[], processes:[] });
  const [loading,      setLoading]      = useState(true);
  const [filters, setFilters] = useState({ keyword:"", docCode:"", typeId:"", statusName:"", processId:"", responsible:"", overdue:false });
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  const [selected,       setSelected]       = useState(null);
  const [versions,       setVersions]       = useState([]);
  const [previewOpen,    setPreviewOpen]     = useState(false);
  const [previewFile,    setPreviewFile]     = useState(null);
  const [exportOpen,     setExportOpen]      = useState(false);
  const [newVerOpen,     setNewVerOpen]      = useState(false);
  const [summary,        setSummary]         = useState("");
  const [newFile,        setNewFile]         = useState(null);
  const [submitting,     setSubmitting]      = useState(false);
  const [statusChanging, setStatusChanging]  = useState(false);
  const exportRef = useRef(null);
  const debounceTimer = useRef(null);
  const debounce = (fn, ms=400) => { clearTimeout(debounceTimer.current); debounceTimer.current=setTimeout(fn,ms); };

  useEffect(() => {
    Promise.all([axios.get(`${API}/types`), axios.get(`${API}/documents/filters`), axios.get(`${API}/documents/stats`)])
      .then(([t,fo,st]) => { setTypes(t.data); setFilterOpts(fo.data); setStats(st.data); }).catch(console.error);
  }, []);

  const fetchDocuments = useCallback(async (activeFilters, activePage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", activePage); params.set("limit", LIMIT);
      if (activeFilters.keyword)     params.set("keyword",     activeFilters.keyword);
      if (activeFilters.docCode)     params.set("docCode",     activeFilters.docCode);
      if (activeFilters.typeId)      params.set("typeId",      activeFilters.typeId);
      if (activeFilters.processId)   params.set("processId",   activeFilters.processId);
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
  const clearAllFilters = () => { setFilters({ keyword:"", docCode:"", typeId:"", statusName:"", processId:"", responsible:"", overdue:false }); setPage(1); };
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
      await refreshStats(); alert(`✅ ${res.data.message}`);
    } catch (err) { alert(err.response?.data?.error || "Erreur lors du changement de statut."); }
    finally { setStatusChanging(false); }
  };

  const FORMAT_GROUPS = { pdf:["pdf"], docx:["doc","docx"], xlsx:["xls","xlsx"], pptx:["ppt","pptx"] };
  const fileMatchesFmt = (filename, fmt) => { const ext = filename?.split(".").pop().toLowerCase()||""; return (FORMAT_GROUPS[fmt]||[fmt]).includes(ext); };

  const handleExport = async () => {
    setExportOpen(false);
    try {
      const response = await fetch(`http://localhost:4000/download/${encodeURIComponent(selected.file_name)}`);
      if (!response.ok) throw new Error("Erreur serveur");
      const blob = await response.blob(); const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href=url; link.download=selected.file_name;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch { alert("Impossible de télécharger le fichier."); }
  };

  const handleNewVersion = async (e) => {
    e.preventDefault();
    if (!newFile) return alert("Veuillez sélectionner un fichier.");
    if (!summary.trim()) return alert("Le résumé des changements est obligatoire.");
    setSubmitting(true);
    try {
      const form = new FormData(); form.append("file", newFile); form.append("change_summary", summary.trim());
      const res = await axios.put(`${API}/documents/${selected.id}`, form, { headers:{ "Content-Type":"multipart/form-data" } });
      const [docRes, verRes] = await Promise.all([axios.get(`${API}/documents/${selected.id}`), axios.get(`${API}/documents/${selected.id}/versions`)]);
      setSelected(docRes.data); setVersions(verRes.data);
      setDocuments(prev => prev.map(d => d.id===selected.id ? { ...d, current_version:res.data.version } : d));
      setNewVerOpen(false); setSummary(""); setNewFile(null); alert(`✅ ${res.data.message}`);
    } catch (err) { alert(err.response?.data?.error || "Erreur lors de la création de la version."); }
    finally { setSubmitting(false); }
  };

  const isLocked   = (n) => LOCKED_STATUSES.includes(n);
  const isTerminal = (n) => n === TERMINAL_STATUS;
  const nextSteps  = (n) => ALLOWED_TRANSITIONS[n] || [];

  return (
    <div style={{ minHeight:"100vh", background:BG, color:NAVY, display:"flex" }}>
      <Sidebar stats={stats} filters={filters} setFilter={setFilter} />

      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

        {/* Header */}
        <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 32px", background:SURFACE, borderBottom:`1px solid ${BORDER}`, boxShadow:"0 1px 4px rgba(46,74,107,0.06)" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
              <span style={{ display:"inline-block", width:3, height:18, background:GREEN, borderRadius:99 }} />
              <h1 style={{ margin:0, fontSize:18, fontWeight:700, color:NAVY }}>Documents</h1>
            </div>
            <p style={{ margin:0, fontSize:11, color:MUTED }}>
              {pagination.total} document{pagination.total>1?"s":""}
              {filters.overdue && <span style={{ color:"#c2410c" }}> · En retard</span>}
              {filters.statusName && <span style={{ color:NAVY_LIGHT }}> · {filters.statusName}</span>}
            </p>
          </div>
          {can("document:create") && (
            <NavLink to="/create" className="btn-primary" style={{ fontSize:13, padding:"8px 18px" }}>+ Nouveau</NavLink>
          )}
        </header>

        {/* Filters */}
        <div style={{ padding:"14px 32px", background:SURFACE, borderBottom:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <div style={{ position:"relative", flexShrink:0, width:190 }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:MUTED, fontSize:12 }}>#</span>
              <input placeholder="Référence…" value={filters.docCode} onChange={(e) => setFilter("docCode", e.target.value)} style={{ ...inp(!!filters.docCode), paddingLeft:24 }} />
            </div>
            <input placeholder="Mot-clé (titre, tag, responsable…)" value={filters.keyword} onChange={(e) => setFilter("keyword", e.target.value)} style={{ ...inp(!!filters.keyword), flex:1, minWidth:200 }} />
            <select value={filters.responsible} onChange={(e) => setFilter("responsible", e.target.value)} style={{ ...inp(!!filters.responsible), width:"auto", minWidth:160, cursor:"pointer" }}>
              <option value="">Responsable</option>
              {filterOpts.responsables.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            {[
              { value:filters.typeId,     onChange:(e)=>setFilter("typeId",e.target.value),     placeholder:"Type",      options:types.map(t=>({value:t.id,label:`${t.code} — ${t.label}`})) },
              { value:filters.statusName, onChange:(e)=>setFilter("statusName",e.target.value), placeholder:"Statut",    options:ISO_LIFECYCLE.map(s=>({value:s,label:s})) },
              { value:filters.processId,  onChange:(e)=>setFilter("processId",e.target.value),  placeholder:"Processus", options:filterOpts.processes.map(p=>({value:p.id,label:p.name})) },
            ].map(({ value, onChange, placeholder, options }) => (
              <select key={placeholder} value={value} onChange={onChange} style={{ ...inp(!!value), width:"auto", cursor:"pointer" }}>
                <option value="">{placeholder}</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ))}
            <button onClick={() => setFilter("overdue", !filters.overdue)} style={{ padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, background:filters.overdue?"rgba(194,65,12,0.1)":BG, border:`1px solid ${filters.overdue?"#c2410c":BORDER}`, color:filters.overdue?"#c2410c":MUTED, transition:"all 0.12s", display:"flex", alignItems:"center", gap:5 }}>
              <LuClock size={13} /> En retard {filters.overdue && <LuCheck size={12} />}
            </button>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} style={{ marginLeft:"auto", padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, background:BG, border:`1px solid ${BORDER}`, color:MUTED, display:"flex", alignItems:"center", gap:4 }}>
                <LuX size={12} /> Effacer
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {filters.keyword    && <ActiveTag label={`Mot-clé: "${filters.keyword}"`}      onRemove={() => setFilter("keyword","")} />}
              {filters.docCode    && <ActiveTag label={`Réf: "${filters.docCode}"`}           onRemove={() => setFilter("docCode","")} />}
              {filters.responsible&& <ActiveTag label={`Responsable: ${filters.responsible}`} onRemove={() => setFilter("responsible","")} />}
              {filters.typeId     && <ActiveTag label={`Type: ${types.find(t=>t.id==filters.typeId)?.code||filters.typeId}`} onRemove={() => setFilter("typeId","")} />}
              {filters.statusName && <ActiveTag label={`Statut: ${filters.statusName}`}       onRemove={() => setFilter("statusName","")} />}
              {filters.processId  && <ActiveTag label={`Processus: ${filterOpts.processes.find(p=>p.id==filters.processId)?.name||filters.processId}`} onRemove={() => setFilter("processId","")} />}
              {filters.overdue    && <ActiveTag label="En retard"                             onRemove={() => setFilter("overdue",false)} />}
            </div>
          )}
        </div>

        {/* Table */}
        <div style={{ flex:1, padding:"20px 32px" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:60, color:MUTED, display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
              <LuRefreshCw size={32} style={{ animation:"spin 1s linear infinite" }} />
              Chargement…
            </div>
          ) : documents.length === 0 ? (
            <div style={{ padding:60, color:MUTED, display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
              <LuInbox size={40} style={{ color: BORDER }} />
              <p style={{ margin:0 }}>Aucun document trouvé</p>
              {hasActiveFilters && <button onClick={clearAllFilters} className="btn-primary" style={{ marginTop:4, fontSize:13 }}>Effacer les filtres</button>}
            </div>
          ) : (
            <>
              <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(46,74,107,0.06)" }}>
                <div style={{ display:"grid", gridTemplateColumns:"155px 1fr 120px 110px 155px 105px 28px", padding:"10px 20px", background:"#f5f7fa", borderBottom:`1px solid ${BORDER}` }}>
                  {["Référence","Titre","Responsable","Type","Statut","Revue",""].map(h => (
                    <span key={h} style={{ color:MUTED, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8 }}>{h}</span>
                  ))}
                </div>
                {documents.map((doc, i) => (
                  <div key={doc.id} onClick={() => openDoc(doc)}
                    style={{ display:"grid", gridTemplateColumns:"155px 1fr 120px 110px 155px 105px 28px", padding:"13px 20px", alignItems:"center", cursor:"pointer", borderBottom:i<documents.length-1?`1px solid ${BORDER}`:"none", background:doc.is_overdue?"rgba(194,65,12,0.03)":"transparent", transition:"background 0.1s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background="#eef3fa"}
                    onMouseLeave={(e) => e.currentTarget.style.background=doc.is_overdue?"rgba(194,65,12,0.03)":"transparent"}>
                    <span style={{ fontFamily:"monospace", color:GREEN, fontWeight:700, fontSize:12 }}>{doc.doc_code}</span>
                    <div style={{ overflow:"hidden", paddingRight:12 }}>
                      <p style={{ margin:0, color:NAVY, fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.title}</p>
                      {doc.folder_name && <p style={{ margin:"2px 0 0", color:MUTED, fontSize:11, display:"flex", alignItems:"center", gap:3 }}><LuFolder size={10} /> {doc.folder_name}</p>}
                    </div>
                    <span style={{ color:MUTED, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.responsible||"—"}</span>
                    <span style={{ background:"#eef3fa", color:NAVY_LIGHT, border:`1px solid ${NAVY}22`, padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:600, width:"fit-content" }}>{doc.type_code}</span>
                    <StatusBadge name={doc.status_name} />
                    <span style={{ color:doc.is_overdue?"#c2410c":MUTED, fontSize:12, fontWeight:doc.is_overdue?600:400 }}>
                      {doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString("fr-FR") : "—"}
                    </span>
                    <span style={{ display:"flex", alignItems:"center" }}>{doc.is_overdue && <LuClock size={13} style={{ color:"#c2410c" }} />}</span>
                  </div>
                ))}
              </div>
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={p => setPage(p)} />
            </>
          )}
        </div>
      </main>

      {/* ══ Document modal ══════════════════════════════════════ */}
      {selected && (
        <div onClick={closeDoc} style={{ position:"fixed", inset:0, background:"rgba(30,52,80,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:18, width:"100%", maxWidth:700, maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 60px rgba(30,52,80,0.3)" }}>
            <div style={{ padding:"24px 30px" }}>

              {/* Modal header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <p style={{ margin:"0 0 4px", fontFamily:"monospace", color:GREEN, fontWeight:700, fontSize:18 }}>{selected.doc_code}</p>
                  <h2 style={{ margin:0, color:NAVY, fontSize:16, fontWeight:700 }}>{selected.title}</h2>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {selected.is_overdue && <span style={{ background:"#fff7ed", color:"#c2410c", border:"1px solid #fed7aa", borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:600, display:"inline-flex", alignItems:"center", gap:4 }}><LuClock size={11} /> En retard</span>}
                  <StatusBadge name={selected.status_name} size="lg" />
                  <button onClick={closeDoc} style={{ background:"none", border:"none", color:MUTED, cursor:"pointer", padding:4, display:"flex", alignItems:"center" }}><LuX size={18} /></button>
                </div>
              </div>

              <RoleInfoBadge />
              <DocumentAccessStatus document={selected} />
              <LifecycleBar currentStatus={selected.status_name} />

              {/* Status transition */}
              <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:12, padding:"16px 18px", marginBottom:20 }}>
                <p style={{ ...sectionLabel }}>{bar} Transition de statut</p>
                {isTerminal(selected.status_name) ? (
                  <p style={{ margin:0, color:MUTED, fontSize:12, display:"flex", alignItems:"center", gap:5 }}><LuArchive size={13} /> Document archivé — état terminal.</p>
                ) : nextSteps(selected.status_name).length === 0 ? (
                  <p style={{ margin:0, color:MUTED, fontSize:12 }}>Aucune transition disponible.</p>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {nextSteps(selected.status_name).map(next => {
                      const cfg = sCfg(next); const NextIcon = cfg.Icon; const allowed = canTransitionStatus(selected.status_name, next);
                      const reason = !allowed ? getBlockReason("change_status", selected) : null;
                      return (
                        <button key={next} onClick={() => allowed && handleStatusChange(next)} disabled={statusChanging||!allowed} title={reason||undefined}
                          style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderRadius:10, background:allowed?cfg.bg:BG, border:`1px solid ${allowed?cfg.border:BORDER}`, color:allowed?cfg.text:MUTED, fontSize:13, fontWeight:600, cursor:(statusChanging||!allowed)?"not-allowed":"pointer", transition:"all 0.12s" }}>
                          <span style={{ display:"flex", alignItems:"center", gap:5 }}><NextIcon size={13} /> Passer à : <strong>{next}</strong></span>
                          <span style={{ display:"flex", alignItems:"center" }}>{allowed ? <LuArrowRight size={13} /> : <LuLock size={13} />}</span>
                        </button>
                      );
                    })}
                    {!currentUser && <p style={{ color:"#c2410c", fontSize:11, margin:"4px 0 0", display:"flex", alignItems:"center", gap:4 }}><LuTriangleAlert size={12} /> Sélectionnez un utilisateur dans la barre latérale.</p>}
                  </div>
                )}
                {isLocked(selected.status_name) && !isTerminal(selected.status_name) && (
                  <p style={{ margin:"10px 0 0", color:"#ef4444", fontSize:11, display:"flex", alignItems:"center", gap:4 }}><LuLock size={12} /> Statut verrouillé — modification de fichier impossible.</p>
                )}
              </div>

              {/* Metadata */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                {[["Responsable",selected.responsible||"—"],["Type",`${selected.type_code} — ${selected.type_label}`],["Origine",selected.origin||"—"],["Version",selected.current_version||"—"],["Processus",selected.folder_name||"—"],["Contexte",selected.context||"—"],["Prochaine revue",selected.next_review_date?new Date(selected.next_review_date).toLocaleDateString("fr-FR"):"—"],["Créé le",selected.created_at?new Date(selected.created_at).toLocaleDateString("fr-FR"):"—"],["Créé par",selected.created_by_name||"—"]].map(([l,v]) => (
                  <div key={l} style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:9, padding:"10px 13px" }}>
                    <p style={{ margin:"0 0 3px", color:MUTED, fontSize:10, textTransform:"uppercase", letterSpacing:0.8 }}>{l}</p>
                    <p style={{ margin:0, color:NAVY, fontSize:13, fontWeight:500 }}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Keywords */}
              {selected.keywords?.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <p style={{ ...sectionLabel }}>{bar} Mots-clés</p>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {selected.keywords.map(k => (
                      <span key={k} style={{ background:"#eef3fa", color:NAVY, border:`1px solid ${BORDER}`, padding:"2px 10px", borderRadius:99, fontSize:12 }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* File */}
              {selected.file_name && (
                <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <LuFileText size={24} style={{ color: MUTED, flexShrink:0 }} />
                    <div>
                      <p style={{ margin:0, color:NAVY, fontSize:13, fontWeight:600 }}>{selected.file_name}</p>
                      <p style={{ margin:"2px 0 0", color:MUTED, fontSize:11 }}>Fichier document</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => { setPreviewFile(selected.file_name); setPreviewOpen(true); }} className="btn-primary" style={{ flex:1, padding:"8px 16px", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                      <LuEye size={14} /> Visualiser
                    </button>
                    <div style={{ position:"relative", flex:1 }} ref={exportRef}>
                      <button onClick={() => setExportOpen(o=>!o)} style={{ width:"100%", height:"100%", padding:"8px 16px", borderRadius:8, background:SURFACE, color:NAVY_LIGHT, border:`1px solid ${NAVY}33`, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                        <LuUpload size={14} /> Exporter…
                      </button>
                      {exportOpen && (
                        <div style={{ position:"absolute", bottom:"calc(100% + 4px)", left:0, right:0, background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:10, overflow:"hidden", zIndex:10, boxShadow:"0 8px 24px rgba(46,74,107,0.15)" }}>
                          {[{label:"PDF",fmt:"pdf"},{label:"Word",fmt:"docx"},{label:"Excel",fmt:"xlsx"},{label:"PowerPoint",fmt:"pptx"}].map(({label,fmt}) => {
                            const isMatch = fileMatchesFmt(selected.file_name, fmt);
                            return (
                              <button key={fmt} onClick={isMatch?handleExport:undefined} disabled={!isMatch}
                                style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", padding:"9px 14px", background:"transparent", border:"none", borderBottom:`1px solid ${BORDER}`, color:isMatch?NAVY:MUTED, fontSize:13, textAlign:"left", cursor:isMatch?"pointer":"default" }}
                                onMouseEnter={(e) => { if(isMatch) e.currentTarget.style.background="#eef3fa"; }}
                                onMouseLeave={(e) => e.currentTarget.style.background="transparent"}>
                                <span>{label}</span>
                                {isMatch && <span style={{ fontSize:10, color:GREEN, display:"flex", alignItems:"center", gap:2 }}><LuDownload size={10} /> exporter</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {canPerformAction("update", selected) ? (
                <button onClick={() => setNewVerOpen(true)} style={{ width:"100%", marginBottom:12, padding:"10px", borderRadius:10, background:GREEN, border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 2px 8px rgba(74,184,63,0.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <LuPlus size={14} /> Nouvelle version
                </button>
              ) : (
                <AccessDeniedMessage action="update" document={selected} reason={getBlockReason("update", selected)} />
              )}

              {/* Version history */}
              {versions.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <p style={{ ...sectionLabel }}>{bar} Historique versions</p>
                  {versions.map(v => (
                    <div key={v.id} style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:8, marginBottom:6, padding:"8px 12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontFamily:"monospace", color:NAVY, fontWeight:700, fontSize:13 }}>v{v.version_letter}</span>
                        <span style={{ color:MUTED, fontSize:11 }}>{v.created_at?new Date(v.created_at).toLocaleDateString("fr-FR"):"—"}</span>
                        <button onClick={() => { setPreviewFile(v.file_name); setPreviewOpen(true); }} style={{ background:SURFACE, border:`1px solid ${BORDER}`, color:NAVY, borderRadius:6, padding:"2px 8px", fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                          <LuEye size={12} /> Consulter
                        </button>
                      </div>
                      {v.change_summary && <p style={{ margin:"4px 0 0", color:MUTED, fontSize:11 }}>{v.change_summary}</p>}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={closeDoc} style={{ width:"100%", marginTop:8, padding:"10px", borderRadius:10, background:BG, border:`1px solid ${BORDER}`, color:MUTED, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewOpen && (
        <div onClick={() => setPreviewOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(30,52,80,0.85)", zIndex:1100, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width:"90vw", height:"90vh", background:SURFACE, borderRadius:14, display:"flex", flexDirection:"column", overflow:"hidden", border:`1px solid ${BORDER}`, boxShadow:"0 24px 60px rgba(30,52,80,0.4)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderBottom:`1px solid ${BORDER}`, background:"#f5f7fa" }}>
              <span style={{ color:NAVY, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}><LuFile size={14} /> {previewFile}</span>
              <button onClick={() => { setPreviewOpen(false); setPreviewFile(null); }} style={{ background:"transparent", border:"none", color:MUTED, cursor:"pointer", lineHeight:1, display:"flex", alignItems:"center" }}><LuX size={18} /></button>
            </div>
            <iframe src={`http://localhost:4000/preview/${encodeURIComponent(previewFile||"")}`} title="preview" style={{ flex:1, border:"none", width:"100%", background:"#fff" }} />
          </div>
        </div>
      )}

      {/* New version modal */}
      {newVerOpen && selected && (
        <div onClick={() => setNewVerOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(30,52,80,0.75)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleNewVersion} style={{ background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:14, padding:24, width:420, display:"flex", flexDirection:"column", gap:14, boxShadow:"0 20px 50px rgba(30,52,80,0.3)" }}>
            <h3 style={{ margin:0, color:NAVY, fontSize:15, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}><LuPlus size={15} /> Nouvelle version — {selected.doc_code}</h3>
            <p style={{ margin:0, color:MUTED, fontSize:12 }}>
              Version actuelle : <strong style={{ color:NAVY }}>v{selected.current_version}</strong> → Nouvelle : <strong style={{ color:GREEN }}>v{selected.current_version==="-"?"A":String.fromCharCode(selected.current_version.charCodeAt(0)+1)}</strong>
            </p>
            <div>
              <label style={{ color:MUTED, fontSize:12, display:"block", marginBottom:4 }}>Nouveau fichier *</label>
              <input type="file" required onChange={(e) => setNewFile(e.target.files[0])} style={{ width:"100%", padding:"7px 10px", borderRadius:8, background:BG, border:`1px solid ${BORDER}`, color:NAVY, fontSize:12, boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ color:MUTED, fontSize:12, display:"block", marginBottom:4 }}>Résumé des changements *</label>
              <textarea required rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Décrivez les modifications…"
                style={{ width:"100%", padding:"7px 10px", borderRadius:8, background:BG, border:`1px solid ${BORDER}`, color:NAVY, fontSize:12, resize:"vertical", fontFamily:"inherit", boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ flex:1, padding:"10px", fontSize:13, opacity:submitting?0.6:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                {submitting ? "Enregistrement…" : <><LuCircleCheckBig size={14} /> Créer la version</>}
              </button>
              <button type="button" onClick={() => setNewVerOpen(false)} style={{ flex:1, padding:"10px", borderRadius:8, background:BG, border:`1px solid ${BORDER}`, color:MUTED, fontSize:13, cursor:"pointer" }}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
