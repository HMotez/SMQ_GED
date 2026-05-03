// ============================================================
// Workflow.jsx — ACTIA ES · Document Lifecycle Visualization
// EF06 — ISO 9001 Workflow with role-based transitions
// ============================================================
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import AppSidebar from "../components/AppSidebar";
import {
  LuPencil, LuPenLine, LuEye, LuCircleCheckBig, LuShare2,
  LuTriangleAlert, LuArchive, LuFileText, LuClipboardCheck,
  LuArrowRight, LuArrowDown, LuCrown, LuWrench, LuShieldCheck,
  LuRefreshCw, LuGitBranch,
} from "react-icons/lu";
import { API } from "../config";

// ── Workflow definition ────────────────────────────────────────
const STATUSES = [
  {
    name: "Brouillon",
    icon: LuPencil,
    color: "#9ca3af",
    bg: "rgba(243,244,246,0.08)",
    border: "rgba(209,213,219,0.2)",
    description: "Document créé, en cours de rédaction initiale.",
    roles: ["Admin", "Ing. Qualité"],
    iso: "",
  },
  {
    name: "En rédaction",
    icon: LuPenLine,
    color: "#4ade80",
    bg: "rgba(240,253,244,0.08)",
    border: "rgba(187,247,208,0.2)",
    description: "L'ingénieur qualité rédige et enrichit le document.",
    roles: ["Admin", "Ing. Qualité"],
    iso: "",
  },
  {
    name: "Appel en relecture",
    icon: LuEye,
    color: "#fbbf24",
    bg: "rgba(255,247,205,0.08)",
    border: "rgba(252,211,77,0.25)",
    description: "Une version est soumise au reviewer pour lecture.",
    roles: ["Admin", "Ing. Qualité"],
    iso: "",
  },
  {
    name: "En relecture",
    icon: LuEye,
    color: "#60a5fa",
    bg: "rgba(239,246,255,0.08)",
    border: "rgba(191,219,254,0.2)",
    description: "Le reviewer lit le document sur SharePoint.",
    roles: ["Admin", "Ing. Qualité", "Reviewer"],
    iso: "",
  },
  {
    name: "En correction",
    icon: LuPenLine,
    color: "#f97316",
    bg: "rgba(255,237,213,0.08)",
    border: "rgba(253,186,116,0.25)",
    description: "Des corrections sont demandées par le reviewer.",
    roles: ["Admin", "Ing. Qualité"],
    iso: "",
  },
  {
    name: "En validation",
    icon: LuClipboardCheck,
    color: "#a5b4fc",
    bg: "rgba(238,242,255,0.08)",
    border: "rgba(199,210,254,0.2)",
    description: "Le reviewer approuve ou rejette la version finale.",
    roles: ["Admin", "Reviewer"],
    iso: "",
  },
  {
    name: "Validé",
    icon: LuCircleCheckBig,
    color: "#4ade80",
    bg: "rgba(240,253,244,0.08)",
    border: "rgba(134,239,172,0.25)",
    description: "Document validé par le reviewer, en attente d'approbation qualité.",
    roles: ["Admin", "Reviewer"],
    iso: "",
  },
  {
    name: "Approuvé",
    icon: LuShieldCheck,
    color: "#818cf8",
    bg: "rgba(238,242,255,0.10)",
    border: "rgba(165,180,252,0.3)",
    description: "Document approuvé par la direction qualité, prêt pour diffusion.",
    roles: ["Admin", "Ing. Qualité"],
    iso: "",
  },
  {
    name: "Diffusé",
    icon: LuShare2,
    color: "#2dd4bf",
    bg: "rgba(240,253,250,0.08)",
    border: "rgba(153,246,228,0.2)",
    description: "Document distribué à tous les utilisateurs.",
    roles: ["Admin"],
    iso: "",
  },
  {
    name: "Obsolète",
    icon: LuTriangleAlert,
    color: "#fb923c",
    bg: "rgba(255,247,237,0.08)",
    border: "rgba(254,215,170,0.2)",
    description: "Document remplacé, ne doit plus être utilisé.",
    roles: ["Admin"],
    iso: "",
  },
  {
    name: "Archivé",
    icon: LuArchive,
    color: "#94a3b8",
    bg: "rgba(248,250,252,0.06)",
    border: "rgba(203,213,225,0.15)",
    description: "Document archivé définitivement — conservé sans suppression.",
    roles: ["Admin"],
    iso: "",
  },
];

// Transitions avec les rôles autorisés
const TRANSITIONS = [
  { from: "Brouillon",          to: "En rédaction",       roles: ["Admin", "Ing. Qualité"] },
  { from: "En rédaction",       to: "Appel en relecture", roles: ["Admin", "Ing. Qualité"] },
  { from: "Appel en relecture", to: "En relecture",       roles: ["Admin", "Ing. Qualité", "Reviewer"] },
  { from: "En relecture",       to: "En correction",      roles: ["Admin", "Reviewer", "Ing. Qualité"] },
  { from: "En relecture",       to: "En validation",      roles: ["Admin", "Reviewer", "Ing. Qualité"] },
  { from: "En correction",      to: "Appel en relecture", roles: ["Admin", "Ing. Qualité"] },
  { from: "En validation",      to: "Validé",             roles: ["Admin", "Reviewer"] },
  { from: "Validé",             to: "Approuvé",           roles: ["Admin", "Ing. Qualité"] },
  { from: "Approuvé",           to: "Diffusé",            roles: ["Admin", "Ing. Qualité"] },
  { from: "Diffusé",            to: "Obsolète",           roles: ["Admin"] },
  { from: "Obsolète",           to: "Archivé",            roles: ["Admin"] },
];

const ROLE_CFG = {
  "Admin":        { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)", Icon: LuCrown        },
  "Ing. Qualité": { color: "#2dd4bf", bg: "rgba(45,212,191,0.1)",   border: "rgba(45,212,191,0.22)",  Icon: LuWrench       },
  "Reviewer":     { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.25)",  Icon: LuShieldCheck  },
};

function RoleBadge({ role }) {
  const cfg = ROLE_CFG[role];
  if (!cfg) return null;
  const I = cfg.Icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      <I size={9} /> {role}
    </span>
  );
}

function StatBadge({ count, color }) {
  if (!count && count !== 0) return null;
  return (
    <span className="rounded-full px-2 py-px text-xs font-black tabular-nums"
      style={{ background: count > 0 ? `${color}22` : "rgba(255,255,255,0.06)", color: count > 0 ? color : "var(--ged-tx3)" }}>
      {count}
    </span>
  );
}

// ── Main layout: two columns of statuses + branch in middle ───
// Linear flow but with a branch at "En relecture" → "En correction" | "En validation"
// We'll render it as a vertical flow with the branch shown clearly

export default function Workflow() {
  const { currentUser } = useUser();
  const [docStats, setDocStats] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const detailRef = useRef(null);

  useEffect(() => {
    if (selected && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selected]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/documents/stats`);
        setDocStats(res.data.byStatus || {});
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  // Linear path (main) + branch
  const mainFlow = [
    "Brouillon",
    "En rédaction",
    "Appel en relecture",
    "En relecture",
    // branch here: En correction (loop back) | En validation (continue)
    "En validation",
    "Validé",
    "Approuvé",
    "Diffusé",
    "Obsolète",
    "Archivé",
  ];

  const getStatus = (name) => STATUSES.find(s => s.name === name);
  const getTransition = (from, to) => TRANSITIONS.find(t => t.from === from && t.to === to);

  const sidebarBottom = (
    <>
      <div className="rounded-xl px-3 py-2.5 border"
        style={{ background: "rgba(74,184,63,0.08)", borderColor: "rgba(74,184,63,0.2)" }}>
        <p className="m-0 text-[10px] uppercase tracking-[1px] font-bold" style={{ color: "var(--ged-tx2)" }}>Statuts actifs</p>
        <p className="m-0 font-black text-xl text-white">{STATUSES.length}</p>
        <p className="m-0 text-xs" style={{ color: "var(--ged-tx3)" }}>étapes du cycle</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex"
      style={{ background: "linear-gradient(145deg,#0a1420 0%,#0f1e30 35%,#1a2f4a 70%,#1e3a55 100%)" }}>

      <AppSidebar user={currentUser} bottomContent={sidebarBottom} />

      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="px-8 py-4 border-b flex items-center justify-between"
          style={{ background: "var(--ged-header)", backdropFilter: "blur(20px)", borderColor: "var(--ged-border)", boxShadow: "0 1px 0 rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(74,184,63,0.18),rgba(74,184,63,0.08))", border: "1.5px solid rgba(74,184,63,0.3)", boxShadow: "0 4px 14px rgba(74,184,63,0.15)" }}>
              <LuGitBranch size={19} style={{ color: "#4ab83f" }} />
            </div>
            <div>
              <h1 className="m-0 font-extrabold" style={{ fontSize: 21, letterSpacing: "-0.022em", lineHeight: 1.2, color:"var(--ged-tx1)" }}>
                Workflow ISO 9001
              </h1>
              <p className="m-0 text-xs mt-0.5" style={{ color: "var(--ged-tx4)" }}>
                Cycle de vie documentaire · Rôles & transitions autorisées
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(ROLE_CFG).map(([role, cfg]) => {
              const I = cfg.Icon;
              return (
                <span key={role} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
                  style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                  <I size={12} /> {role}
                </span>
              );
            })}
          </div>
        </header>

        <div className="flex-1 px-8 py-6 overflow-y-auto">

          {/* ── Two-column layout: flow + detail ─────────────── */}
          <div className="flex gap-6 items-start">

            {/* ── LEFT: Workflow diagram ────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Main flow */}
              <div className="flex flex-col items-center">

                {mainFlow.map((statusName, idx) => {
                  const s = getStatus(statusName);
                  if (!s) return null;
                  const SI = s.icon;
                  const count = docStats[statusName] ?? 0;
                  const isSelected = selected === statusName;
                  const prevName = mainFlow[idx - 1];
                  const nextName = mainFlow[idx + 1];
                  const transition = prevName ? getTransition(prevName, statusName) : null;

                  // Special: at "En relecture", show branch arrow to "En correction"
                  const isRelectureNode = statusName === "En relecture";
                  const correctionStatus = getStatus("En correction");
                  const correctionCount  = docStats["En correction"] ?? 0;
                  const loopTransition   = getTransition("En relecture", "En correction");
                  const backTransition   = getTransition("En correction", "Appel en relecture");

                  return (
                    <div key={statusName} className="w-full flex flex-col items-center">

                      {/* Arrow from previous */}
                      {idx > 0 && transition && (
                        <div className="flex flex-col items-center my-1">
                          <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.12)" }} />
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                            style={{ background: "var(--ged-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            {transition.roles.map(r => <RoleBadge key={r} role={r} />)}
                          </div>
                          <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.12)" }} />
                          <LuArrowDown size={12} style={{ color: "var(--ged-tx3)" }} />
                        </div>
                      )}

                      {/* Status node */}
                      <button
                        onClick={() => setSelected(isSelected ? null : statusName)}
                        className="w-full max-w-lg rounded-2xl px-5 py-4 border transition-all duration-200 text-left"
                        style={{
                          background:   isSelected ? s.bg  : "rgba(255,255,255,0.03)",
                          borderColor:  isSelected ? s.border : "rgba(255,255,255,0.08)",
                          boxShadow:    isSelected ? `0 0 24px ${s.color}18` : "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = s.bg; e.currentTarget.style.borderColor = s.border; }}}
                        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
                            <SI size={16} style={{ color: s.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{s.name}</span>
                              {!loading && <StatBadge count={count} color={s.color} />}
                            </div>
                            <p className="m-0 text-xs mt-0.5" style={{ color: "var(--ged-tx2)" }}>{s.description}</p>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {s.roles.map(r => <RoleBadge key={r} role={r} />)}
                          </div>
                        </div>
                      </button>

                      {/* Branch at "En relecture" */}
                      {isRelectureNode && correctionStatus && (
                        <div className="w-full max-w-lg mt-3 mb-1">
                          {/* Branch container */}
                          <div className="rounded-2xl border overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>

                            {/* Header */}
                            <div className="flex items-center gap-2 px-4 py-2.5 border-b"
                              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                              <div className="w-1.5 h-4 rounded-full" style={{ background: "linear-gradient(to bottom, #f97316, #a5b4fc)" }} />
                              <span className="text-[10.5px] uppercase tracking-widest font-bold" style={{ color: "rgba(168,191,212,0.55)" }}>
                                Décision de relecture
                              </span>
                            </div>

                            <div className="flex p-4 gap-0">

                              {/* Branch A — En correction */}
                              <div className="flex-1 flex flex-col items-center gap-2">
                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                  {loopTransition?.roles.map(r => <RoleBadge key={r} role={r} />)}
                                </div>
                                <LuArrowDown size={13} style={{ color: "#f97316", opacity: 0.7 }} />
                                <button
                                  onClick={() => setSelected(selected === "En correction" ? null : "En correction")}
                                  className="w-full rounded-xl px-3 py-3 border text-left transition-all"
                                  style={{
                                    background:  selected === "En correction" ? "rgba(249,115,22,0.12)" : "rgba(249,115,22,0.05)",
                                    borderColor: selected === "En correction" ? "rgba(249,115,22,0.45)" : "rgba(249,115,22,0.18)",
                                    cursor: "pointer",
                                    boxShadow: selected === "En correction" ? "0 0 16px rgba(249,115,22,0.15)" : "none",
                                  }}
                                  onMouseEnter={e => { if (selected !== "En correction") { e.currentTarget.style.background = "rgba(249,115,22,0.09)"; e.currentTarget.style.borderColor = "rgba(249,115,22,0.3)"; }}}
                                  onMouseLeave={e => { if (selected !== "En correction") { e.currentTarget.style.background = "rgba(249,115,22,0.05)"; e.currentTarget.style.borderColor = "rgba(249,115,22,0.18)"; }}}
                                >
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                      style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.25)" }}>
                                      <LuPenLine size={12} style={{ color: "#f97316" }} />
                                    </div>
                                    <span className="font-bold text-[13px]" style={{ color: "#f97316" }}>En correction</span>
                                    {!loading && <StatBadge count={correctionCount} color="#f97316" />}
                                  </div>
                                  <p className="m-0 text-[11px] leading-relaxed" style={{ color: "rgba(168,191,212,0.55)" }}>
                                    Corrections demandées — l'auteur soumet une nouvelle version
                                  </p>
                                </button>
                                {/* Loop back */}
                                {backTransition && (
                                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border w-full justify-center"
                                    style={{ background: "rgba(251,191,36,0.05)", borderColor: "rgba(251,191,36,0.18)" }}>
                                    <LuRefreshCw size={9} style={{ color: "#fbbf24" }} />
                                    <span className="text-[10px] font-semibold" style={{ color: "#fbbf24" }}>→ Appel en relecture</span>
                                    {backTransition.roles.map(r => <RoleBadge key={r} role={r} />)}
                                  </div>
                                )}
                              </div>

                              {/* Divider */}
                              <div className="flex flex-col items-center justify-center mx-3 gap-1.5 self-stretch">
                                <div className="flex-1 w-px" style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)" }} />
                                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                  <span className="text-[9px] font-black" style={{ color: "rgba(168,191,212,0.4)" }}>OU</span>
                                </div>
                                <div className="flex-1 w-px" style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)" }} />
                              </div>

                              {/* Branch B — En validation */}
                              <div className="flex-1 flex flex-col items-center gap-2">
                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                  {getTransition("En relecture", "En validation")?.roles.map(r => <RoleBadge key={r} role={r} />)}
                                </div>
                                <LuArrowDown size={13} style={{ color: "#a5b4fc", opacity: 0.7 }} />
                                <button
                                  onClick={() => setSelected(selected === "En validation" ? null : "En validation")}
                                  className="w-full rounded-xl px-3 py-3 border text-left transition-all"
                                  style={{
                                    background:  selected === "En validation" ? "rgba(165,180,252,0.1)" : "rgba(165,180,252,0.04)",
                                    borderColor: selected === "En validation" ? "rgba(165,180,252,0.4)" : "rgba(165,180,252,0.18)",
                                    cursor: "pointer",
                                    boxShadow: selected === "En validation" ? "0 0 16px rgba(165,180,252,0.12)" : "none",
                                  }}
                                  onMouseEnter={e => { if (selected !== "En validation") { e.currentTarget.style.background = "rgba(165,180,252,0.08)"; e.currentTarget.style.borderColor = "rgba(165,180,252,0.3)"; }}}
                                  onMouseLeave={e => { if (selected !== "En validation") { e.currentTarget.style.background = "rgba(165,180,252,0.04)"; e.currentTarget.style.borderColor = "rgba(165,180,252,0.18)"; }}}
                                >
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                      style={{ background: "rgba(165,180,252,0.12)", border: "1px solid rgba(165,180,252,0.22)" }}>
                                      <LuClipboardCheck size={12} style={{ color: "#a5b4fc" }} />
                                    </div>
                                    <span className="font-bold text-[13px]" style={{ color: "#a5b4fc" }}>En validation</span>
                                    {!loading && <StatBadge count={docStats["En validation"] ?? 0} color="#a5b4fc" />}
                                  </div>
                                  <p className="m-0 text-[11px] leading-relaxed" style={{ color: "rgba(168,191,212,0.55)" }}>
                                    Continue vers la validation finale
                                  </p>
                                </button>
                              </div>

                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            </div>

            {/* ── RIGHT: Detail panel ───────────────────────── */}
            <div ref={detailRef} className="w-[320px] flex-shrink-0 sticky top-6">

              {/* Role legend */}
              <div className="rounded-2xl border mb-4 overflow-hidden"
                style={{ background: "var(--ged-header)", borderColor: "var(--ged-border)" }}>
                <div className="px-4 py-3 border-b" style={{ background: "var(--ged-card)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <p className="m-0 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ged-tx2)" }}>Légende des rôles</p>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {Object.entries(ROLE_CFG).map(([role, cfg]) => {
                    const I = cfg.Icon;
                    return (
                      <div key={role} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                          <I size={14} style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <p className="m-0 font-bold text-sm" style={{ color: cfg.color }}>{role}</p>
                          <p className="m-0 text-xs" style={{ color: "var(--ged-tx2)" }}>
                            {role === "Admin"        && "Accès total · toutes les transitions"}
                            {role === "Ing. Qualité" && "Crée, rédige et soumet en relecture"}
                            {role === "Reviewer"     && "Relit, corrige et valide les documents"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected status detail */}
              {selected ? (() => {
                const s = getStatus(selected);
                if (!s) return null;
                const SI = s.icon;
                const count = docStats[selected] ?? 0;
                const outgoing = TRANSITIONS.filter(t => t.from === selected);
                const incoming = TRANSITIONS.filter(t => t.to === selected);
                return (
                  <div className="rounded-2xl border overflow-hidden"
                    style={{ background: "var(--ged-header)", borderColor: s.border, boxShadow: `0 0 20px ${s.color}10` }}>
                    <div className="px-4 py-3 border-b flex items-center gap-3"
                      style={{ background: s.bg, borderColor: s.border }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(0,0,0,0.15)", border: `1.5px solid ${s.border}` }}>
                        <SI size={15} style={{ color: s.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="m-0 font-bold text-white text-sm">{s.name}</p>
                        {s.iso && <p className="m-0 text-[10px]" style={{ color: s.color }}>{s.iso}</p>}
                      </div>
                      <StatBadge count={count} color={s.color} />
                    </div>
                    <div className="p-4 flex flex-col gap-4">
                      <p className="m-0 text-sm" style={{ color: "var(--ged-tx2)" }}>{s.description}</p>

                      <div>
                        <p className="m-0 text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: "var(--ged-tx3)" }}>Rôles actifs</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {s.roles.map(r => <RoleBadge key={r} role={r} />)}
                        </div>
                      </div>

                      {incoming.length > 0 && (
                        <div>
                          <p className="m-0 text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: "var(--ged-tx3)" }}>Transitions entrantes</p>
                          <div className="flex flex-col gap-1.5">
                            {incoming.map(t => {
                              const fs = getStatus(t.from);
                              if (!fs) return null;
                              return (
                                <div key={t.from} className="flex items-center gap-2 rounded-lg px-3 py-2 border"
                                  style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                                  <span className="text-xs font-semibold" style={{ color: fs.color }}>{t.from}</span>
                                  <LuArrowRight size={11} style={{ color: "var(--ged-tx3)" }} />
                                  <div className="flex gap-1 flex-wrap ml-auto">
                                    {t.roles.map(r => <RoleBadge key={r} role={r} />)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {outgoing.length > 0 && (
                        <div>
                          <p className="m-0 text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: "var(--ged-tx3)" }}>Transitions sortantes</p>
                          <div className="flex flex-col gap-1.5">
                            {outgoing.map(t => {
                              const ts = getStatus(t.to);
                              if (!ts) return null;
                              return (
                                <div key={t.to} className="flex items-center gap-2 rounded-lg px-3 py-2 border"
                                  style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                                  <LuArrowRight size={11} style={{ color: "var(--ged-tx3)" }} />
                                  <span className="text-xs font-semibold" style={{ color: ts.color }}>{t.to}</span>
                                  <div className="flex gap-1 flex-wrap ml-auto">
                                    {t.roles.map(r => <RoleBadge key={r} role={r} />)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {outgoing.length === 0 && (
                        <div className="rounded-lg px-3 py-2 border"
                          style={{ background: "rgba(148,163,184,0.06)", borderColor: "rgba(148,163,184,0.15)" }}>
                          <p className="m-0 text-xs" style={{ color: "var(--ged-tx2)" }}>
                            État terminal — aucune transition sortante.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div className="rounded-2xl border px-4 py-8 flex flex-col items-center gap-3"
                  style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <LuGitBranch size={28} style={{ color: "var(--ged-tx3)" }} />
                  <p className="m-0 text-sm text-center" style={{ color: "var(--ged-tx3)" }}>
                    Cliquez sur un statut pour voir ses détails et transitions.
                  </p>
                </div>
              )}

              {/* Stats summary */}
              {!loading && Object.keys(docStats).length > 0 && (
                <div className="rounded-2xl border mt-4 overflow-hidden"
                  style={{ background: "var(--ged-header)", borderColor: "var(--ged-border)" }}>
                  <div className="px-4 py-3 border-b" style={{ background: "var(--ged-card)", borderColor: "rgba(255,255,255,0.07)" }}>
                    <p className="m-0 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ged-tx2)" }}>Documents par statut</p>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    {STATUSES.map(s => {
                      const SI = s.icon;
                      const count = docStats[s.name] ?? 0;
                      if (!count) return null;
                      return (
                        <div key={s.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                          style={{ background: count > 0 ? s.bg : "transparent" }}>
                          <SI size={11} style={{ color: s.color, flexShrink: 0 }} />
                          <span className="flex-1 text-xs" style={{ color: "var(--ged-tx2)" }}>{s.name}</span>
                          <span className="font-bold text-sm" style={{ color: s.color }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
