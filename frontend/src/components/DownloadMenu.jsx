import { useState, useRef, useEffect } from "react";
import { LuDownload, LuLoader } from "react-icons/lu";
import { toast } from "sonner";
import { BACKEND } from "../config";

const FORMATS = [
  { ext: "pdf",  label: "PDF",   color: "#f87171" },
  { ext: "docx", label: "Word",  color: "#60a5fa" },
  { ext: "xlsx", label: "Excel", color: "#4ab83f" },
];

/**
 * DownloadMenu — download a file with optional format conversion.
 *
 * Props:
 *   filename  — stored filename (e.g. "1712345678_doc.pdf")
 *   size      — "normal" (default) or "small"  — controls button appearance
 */
export default function DownloadMenu({ filename, size = "normal" }) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(null); // ext being converted/downloaded
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (!filename) return null;

  const srcExt = filename.split(".").pop()?.toLowerCase();

  const handleAs = async (ext) => {
    setLoading(ext);
    setOpen(false);
    try {
      const url = srcExt === ext
        ? `${BACKEND}/download/${encodeURIComponent(filename)}`
        : `${BACKEND}/convert/${encodeURIComponent(filename)}?to=${ext}`;
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

  const btnClass = isSmall
    ? "rounded-md px-2 py-0.5 text-xs flex items-center gap-1 border transition-all"
    : "flex items-center gap-2 text-sm px-4 py-2 rounded-xl border font-semibold transition-all";

  const btnStyle = isSmall
    ? { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(168,191,212,0.7)", cursor: "pointer" }
    : { background: "rgba(74,184,63,0.06)", borderColor: "rgba(74,184,63,0.2)", color: "#4ab83f", cursor: "pointer" };

  const btnHover = isSmall
    ? { background: "rgba(255,255,255,0.1)" }
    : { background: "rgba(74,184,63,0.15)", borderColor: "rgba(74,184,63,0.4)" };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !loading && setOpen(o => !o)}
        disabled={!!loading}
        className={btnClass}
        style={btnStyle}
        onMouseEnter={e => { if (!loading) Object.assign(e.currentTarget.style, btnHover); }}
        onMouseLeave={e => Object.assign(e.currentTarget.style, btnStyle)}
      >
        {loading
          ? <LuLoader size={isSmall ? 10 : 14} style={{ animation: "spin 1s linear infinite" }} />
          : <LuDownload size={isSmall ? 10 : 14} />}
        {loading ? "..." : "Télécharger"}
      </button>

      {open && (
        <div
          className="absolute right-0 bottom-[calc(100%+6px)] z-50 rounded-xl overflow-hidden border"
          style={{ background: "#0d1f30", borderColor: "rgba(255,255,255,0.12)", boxShadow: "0 20px 60px rgba(0,0,0,0.55)", minWidth: "170px" }}
        >
          <p className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider border-b m-0"
            style={{ color: "rgba(168,191,212,0.45)", borderColor: "rgba(255,255,255,0.07)" }}>
            Format de téléchargement
          </p>
          {FORMATS.map(({ ext, label, color }) => (
            <button key={ext}
              onClick={() => handleAs(ext)}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-left border-b transition-all"
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                color: "rgba(168,191,212,0.85)",
                background: srcExt === ext ? "rgba(255,255,255,0.04)" : "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = srcExt === ext ? "rgba(255,255,255,0.04)" : "transparent"; }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="flex-1">{label}</span>
              {srcExt === ext
                ? <span className="text-[9px] font-bold uppercase" style={{ color: "rgba(168,191,212,0.35)" }}>original</span>
                : <span className="text-[9px]" style={{ color: "rgba(168,191,212,0.3)" }}>convertir</span>
              }
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
