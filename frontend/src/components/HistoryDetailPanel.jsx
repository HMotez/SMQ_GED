// ============================================================
// components/HistoryDetailPanel.jsx
// RÔLE : Panneau latéral (slide-in drawer) affichant le détail
//        d'une entrée d'historique sélectionnée.
//        Utilisé par deux pages avec deux modes :
//          - type="validation" : détail d'une décision de validation
//            (validateur, décision, commentaire, signature SHA-256)
//          - type="archive"    : détail d'un événement d'archivage
//            (action AUTO_ARCHIVE, VERSION_SUPERSEDED, STATUS_CHANGE)
//        Se ferme avec la touche Échap ou le bouton X.
// ============================================================
import { useEffect } from "react";
import {
  LuX, LuCalendar, LuUser, LuFileText, LuTag,
  LuArrowLeftRight, LuZap, LuRefreshCw, LuCircleCheck,
  LuCircleX, LuClipboardCheck, LuArchive,
  LuShieldCheck, LuTriangleAlert, LuInfo,
} from "react-icons/lu";

/* ── decision config (validation) ─────────────────────────── */
const DECISION_CFG = {
  "APPROUVÉ":   { bg:"rgba(240,253,244,0.12)", text:"#4ade80",  border:"rgba(134,239,172,0.25)", Icon:LuCircleCheck,     label:"Approuvé"    },
  "REJETÉ":     { bg:"rgba(254,242,242,0.10)", text:"#f87171",  border:"rgba(252,165,165,0.25)", Icon:LuCircleX,         label:"Rejeté"      },
  "EN_ATTENTE": { bg:"rgba(238,242,255,0.10)", text:"#a5b4fc",  border:"rgba(199,210,254,0.25)", Icon:LuClipboardCheck,  label:"En attente"  },
};

/* ── action config (archive) ───────────────────────────────── */
const ACTION_CFG = {
  AUTO_ARCHIVE:       { color:"#f87171", Icon:LuZap,           label:"Archivage automatique"  },
  VERSION_SUPERSEDED: { color:"#fb923c", Icon:LuRefreshCw,     label:"Version remplacée"      },
  STATUS_CHANGE:      { color:"#a5b4fc", Icon:LuArrowLeftRight, label:"Changement de statut"  },
};

function Row({ icon: Icon, label, children, accent }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b" style={{ borderColor:"rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-center w-7 h-7 rounded-lg mt-0.5 flex-shrink-0"
        style={{ background:"rgba(255,255,255,0.05)", color: accent || "rgba(168,191,212,0.5)" }}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-[10px] font-bold uppercase tracking-wider mb-1"
          style={{ color:"rgba(168,191,212,0.4)" }}>{label}</p>
        <div className="text-sm" style={{ color:"rgba(220,230,240,0.85)" }}>{children}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function HistoryDetailPanel({ type, entry, onClose }) {
  /* close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!entry) return null;

  /* ── VALIDATION entry ───────────────────────────────────── */
  if (type === "validation") {
    const dcfg = DECISION_CFG[entry.decision] || DECISION_CFG["EN_ATTENTE"];
    const DI = dcfg.Icon;
    const dateStr = entry.validated_at
      ? new Date(entry.validated_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })
      : "—";
    const timeStr = entry.validated_at
      ? new Date(entry.validated_at).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })
      : "";

    return (
      <>
        {/* backdrop */}
        <div className="fixed inset-0 z-[900]" style={{ background:"rgba(0,0,0,0.45)", backdropFilter:"blur(2px)" }}
          onClick={onClose} />

        {/* drawer */}
        <div className="fixed top-0 right-0 h-full z-[910] flex flex-col"
          style={{ width:"min(420px,92vw)", background:"#0a1929", borderLeft:"1px solid rgba(255,255,255,0.09)",
            boxShadow:"-8px 0 40px rgba(0,0,0,0.6)" }}>

          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2.5">
              <LuShieldCheck size={16} style={{ color:"#a5b4fc" }} />
              <span className="text-sm font-bold text-white">Détail de validation</span>
            </div>
            <button onClick={onClose} className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
              style={{ color:"rgba(168,191,212,0.5)", background:"transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color="white"; }}
              onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(168,191,212,0.5)"; }}>
              <LuX size={16} />
            </button>
          </div>

          {/* decision hero */}
          <div className="mx-5 mt-5 mb-2 flex items-center gap-3 px-4 py-3.5 rounded-xl border"
            style={{ background:dcfg.bg, borderColor:dcfg.border }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background:"rgba(255,255,255,0.06)", color:dcfg.text }}>
              <DI size={20} />
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-wider"
                style={{ color:"rgba(168,191,212,0.45)" }}>Décision</p>
              <p className="m-0 text-lg font-bold" style={{ color:dcfg.text }}>{dcfg.label}</p>
            </div>
          </div>

          {/* rows */}
          <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.1) transparent" }}>

            <Row icon={LuCalendar} label="Date" accent="#60a5fa">
              <span>{dateStr}</span>
              {timeStr && <span className="ml-2 text-xs" style={{ color:"rgba(168,191,212,0.4)" }}>{timeStr}</span>}
            </Row>

            <Row icon={LuTag} label="Référence" accent="#4ade80">
              <span className="font-mono font-bold" style={{ color:"#4ade80" }}>{entry.doc_code || "—"}</span>
            </Row>

            <Row icon={LuFileText} label="Titre du document" accent="rgba(168,191,212,0.5)">
              {entry.doc_title || <span style={{ color:"rgba(168,191,212,0.3)" }}>—</span>}
            </Row>

            {entry.doc_status && (
              <Row icon={LuInfo} label="Statut actuel" accent="#a5b4fc">
                {entry.doc_status}
              </Row>
            )}

            {entry.version_letter && (
              <Row icon={LuRefreshCw} label="Version" accent="#fb923c">
                Version {entry.version_letter}
              </Row>
            )}

            <Row icon={LuUser} label="Validateur" accent="#94a3b8">
              {entry.validator_name || <span style={{ color:"rgba(168,191,212,0.3)" }}>Inconnu</span>}
            </Row>

            <Row icon={LuInfo} label="Commentaire" accent="#fbbf24">
              {entry.comment
                ? <span style={{ whiteSpace:"pre-wrap", lineHeight:"1.6" }}>{entry.comment}</span>
                : <span style={{ color:"rgba(168,191,212,0.3)", fontStyle:"italic" }}>Aucun commentaire</span>}
            </Row>

          </div>
        </div>
      </>
    );
  }

  /* ── ARCHIVE entry ──────────────────────────────────────── */
  if (type === "archive") {
    const details = (() => { try { return JSON.parse(entry.details); } catch { return {}; } })();
    const actionMeta = ACTION_CFG[entry.action] || { color:"#94a3b8", Icon:LuFileText, label:entry.action || "Opération" };
    const AI = actionMeta.Icon;
    const dateStr = entry.created_at
      ? new Date(entry.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })
      : "—";
    const timeStr = entry.created_at
      ? new Date(entry.created_at).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })
      : "";

    return (
      <>
        {/* backdrop */}
        <div className="fixed inset-0 z-[900]" style={{ background:"rgba(0,0,0,0.45)", backdropFilter:"blur(2px)" }}
          onClick={onClose} />

        {/* drawer */}
        <div className="fixed top-0 right-0 h-full z-[910] flex flex-col"
          style={{ width:"min(420px,92vw)", background:"#0a1929", borderLeft:"1px solid rgba(255,255,255,0.09)",
            boxShadow:"-8px 0 40px rgba(0,0,0,0.6)" }}>

          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2.5">
              <LuArchive size={16} style={{ color:"#94a3b8" }} />
              <span className="text-sm font-bold text-white">Détail d'archivage</span>
            </div>
            <button onClick={onClose} className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
              style={{ color:"rgba(168,191,212,0.5)", background:"transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color="white"; }}
              onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(168,191,212,0.5)"; }}>
              <LuX size={16} />
            </button>
          </div>

          {/* action hero */}
          <div className="mx-5 mt-5 mb-2 flex items-center gap-3 px-4 py-3.5 rounded-xl border"
            style={{ background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background:"rgba(255,255,255,0.06)", color:actionMeta.color }}>
              <AI size={20} />
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-wider"
                style={{ color:"rgba(168,191,212,0.45)" }}>Action</p>
              <p className="m-0 text-lg font-bold" style={{ color:actionMeta.color }}>{actionMeta.label}</p>
            </div>
          </div>

          {/* rows */}
          <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.1) transparent" }}>

            <Row icon={LuCalendar} label="Date" accent="#60a5fa">
              <span>{dateStr}</span>
              {timeStr && <span className="ml-2 text-xs" style={{ color:"rgba(168,191,212,0.4)" }}>{timeStr}</span>}
            </Row>

            <Row icon={LuTag} label="Référence" accent="#4ade80">
              <span className="font-mono font-bold" style={{ color:"#4ade80" }}>{entry.doc_code || "—"}</span>
            </Row>

            <Row icon={LuFileText} label="Titre du document" accent="rgba(168,191,212,0.5)">
              {entry.title || <span style={{ color:"rgba(168,191,212,0.3)" }}>—</span>}
            </Row>

            {details.from && details.to && (
              <Row icon={LuArrowLeftRight} label="Changement de statut" accent={actionMeta.color}>
                <span style={{ color:"rgba(168,191,212,0.55)" }}>{details.from}</span>
                <span className="mx-2 font-bold" style={{ color:actionMeta.color }}>→</span>
                <span className="font-semibold text-white">{details.to}</span>
              </Row>
            )}

            {(details.reason || details.change_summary) && (
              <Row icon={LuInfo} label="Motif / Détails" accent="#fbbf24">
                <span style={{ whiteSpace:"pre-wrap", lineHeight:"1.6" }}>
                  {details.reason || details.change_summary}
                </span>
              </Row>
            )}

            {details.superseded_by && (
              <Row icon={LuRefreshCw} label="Remplacé par" accent="#fb923c">
                <span className="font-mono" style={{ color:"#fb923c" }}>{details.superseded_by}</span>
              </Row>
            )}

            <Row icon={LuUser} label="Utilisateur" accent="#94a3b8">
              {entry.user_name || <span style={{ color:"rgba(168,191,212,0.3)", fontStyle:"italic" }}>Système</span>}
            </Row>

          </div>
        </div>
      </>
    );
  }

  return null;
}
