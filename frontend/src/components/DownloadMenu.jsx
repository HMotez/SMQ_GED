import { useState } from "react";
import { LuDownload, LuLoader } from "react-icons/lu";
import { toast } from "sonner";
import { BACKEND } from "../config";

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
  const [loading, setLoading] = useState(null); // ext being downloaded

  if (!filename) return null;

  const srcExt = filename.split(".").pop()?.toLowerCase();

  const handleAs = async (ext) => {
    if (loading) return;
    setLoading(ext);
    try {
      const encodedPath = filename.split("/").map(encodeURIComponent).join("/");
      const url = srcExt === ext
        ? `${BACKEND}/download/${encodedPath}`
        : `${BACKEND}/convert/${encodedPath}?to=${ext}`;
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erreur serveur");
      }
      const blob    = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link    = document.createElement("a");
      const base    = filename.replace(/\.[^/.]+$/, "");
      link.href     = blobUrl;
      link.download = `${base}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      toast.error(e.message || "Erreur de téléchargement");
    } finally {
      setLoading(null);
    }
  };

  const isSmall = size === "small";

  if (isSmall) {
    // Compact inline buttons: PDF · Word · Excel
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

  // Normal: icon + "Télécharger" wrapper + 3 format pill buttons
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
