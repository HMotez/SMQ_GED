// ============================================================
// components/DownloadMenu.jsx — Menu de téléchargement multi-format
//
// Propose le téléchargement d'un document en 3 formats :
//   PDF   → téléchargement direct (/download) si le fichier est déjà PDF,
//            sinon conversion LibreOffice via /convert?to=pdf
//   Word  → conversion vers DOCX via /convert?to=docx
//   Excel → conversion vers XLSX via /convert?to=xlsx
//
// Props :
//   filename — chemin relatif stocké en DB (ex: "CDR/PR_Procedures/1712_doc.pdf")
//   size     — "normal" (défaut) : boutons avec icône + label "Télécharger"
//              "small" : compact, 3 boutons simples sans wrapper
//
// Le téléchargement est déclenché via un lien <a> temporaire créé
// dans le DOM (Blob URL) — technique standard pour les téléchargements
// de fichiers binaires sans ouvrir de nouvel onglet.
// ============================================================
import { useState } from "react";
import { LuDownload, LuLoader } from "react-icons/lu";
import { toast } from "sonner";
import { BACKEND } from "../config";

// ─── Formats disponibles avec couleur d'affichage ────────────
const FORMATS = [
  { ext: "pdf",  label: "PDF",   color: "#f87171" },
  { ext: "docx", label: "Word",  color: "#60a5fa" },
  { ext: "xlsx", label: "Excel", color: "#4ab83f" },
];

/**
 * DownloadMenu — inline format buttons (PDF / Word / Excel), no popup.
 *
 * Props:
 *   filename  — stored filename (e.g. "1712345678_doc.pdf")
 *   size      — "normal" (default) or "small"  — controls button appearance
 */
export default function DownloadMenu({ filename, size = "normal" }) {
  // ─── État local ───────────────────────────────────────────
  const [loading, setLoading] = useState(null); // extension en cours de téléchargement

  // Pas de fichier → rien à afficher
  if (!filename) return null;

  // Extension source du fichier stocké (détermine si conversion nécessaire)
  const srcExt = filename.split(".").pop()?.toLowerCase();

  // ─── Téléchargement / conversion ─────────────────────────
  const handleAs = async (ext) => {
    if (loading) return; // empêche les clics simultanés
    setLoading(ext);
    try {
      // Encoder chaque segment du chemin séparément (préserve les "/")
      const encodedPath = filename.split("/").map(encodeURIComponent).join("/");
      // Si même extension : téléchargement direct, sinon conversion
      const url = srcExt === ext
        ? `${BACKEND}/download/${encodedPath}`
        : `${BACKEND}/convert/${encodedPath}?to=${ext}`;

      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erreur serveur");
      }

      // Créer un Blob URL temporaire pour déclencher le téléchargement
      const blob    = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link    = document.createElement("a");
      const base    = filename.split("/").pop().replace(/\.[^/.]+$/, ""); // nom sans extension
      link.href     = blobUrl;
      link.download = `${base}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl); // libérer la mémoire immédiatement
    } catch (e) {
      toast.error(e.message || "Erreur de téléchargement");
    } finally {
      setLoading(null);
    }
  };

  const isSmall = size === "small";

  // ─── Mode compact (3 boutons simples) ────────────────────
  if (isSmall) {
    return (
      <div className="flex items-center gap-1">
        {FORMATS.map(({ ext, label, color }) => (
          <button
            key={ext}
            onClick={() => handleAs(ext)}
            disabled={!!loading}
            title={srcExt === ext ? `Télécharger (${label})` : `Convertir en ${label}`}
            className="rounded-md px-2 py-0.5 text-[10px] font-bold border transition-all flex items-center gap-1"
            style={{
              background: loading === ext ? `${color}22` : "rgba(255,255,255,0.04)",
              borderColor: `${color}50`,
              color: loading === ext ? color : "rgba(168,191,212,0.65)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading && loading !== ext ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = color; } }}
            onMouseLeave={e => { if (loading !== ext) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(168,191,212,0.65)"; e.currentTarget.style.borderColor = `${color}50`; } }}
          >
            {loading === ext
              ? <LuLoader size={9} style={{ animation: "spin 1s linear infinite" }} />
              : null}
            {label}
          </button>
        ))}
      </div>
    );
  }

  // ─── Mode normal (icône + "Télécharger" + 3 boutons format) ─
  return (
    <div className="flex items-center gap-1 flex-shrink-0 rounded-xl border overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(74,184,63,0.2)" }}>
      <span className="flex items-center gap-1.5 pl-3 pr-2 py-2 text-sm font-semibold"
        style={{ color: "#4ab83f", whiteSpace: "nowrap" }}>
        <LuDownload size={13} /> Télécharger
      </span>
      <div className="flex items-center gap-px pr-1">
        {FORMATS.map(({ ext, label, color }) => (
          <button
            key={ext}
            onClick={() => handleAs(ext)}
            disabled={!!loading}
            title={srcExt === ext ? `Télécharger en ${label} (original)` : `Convertir en ${label}`}
            className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1"
            style={{
              // Fichier original dans ce format → couleur de fond différente
              background: loading === ext ? `${color}28` : srcExt === ext ? `${color}14` : "rgba(255,255,255,0.03)",
              borderColor: loading === ext ? color : `${color}45`,
              color: loading === ext ? color : srcExt === ext ? color : "rgba(168,191,212,0.65)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading && loading !== ext ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = `${color}28`; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = color; } }}
            onMouseLeave={e => { if (loading !== ext) { e.currentTarget.style.background = srcExt === ext ? `${color}14` : "rgba(255,255,255,0.03)"; e.currentTarget.style.color = srcExt === ext ? color : "rgba(168,191,212,0.65)"; e.currentTarget.style.borderColor = `${color}45`; } }}
          >
            {loading === ext && <LuLoader size={10} style={{ animation: "spin 1s linear infinite" }} />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
