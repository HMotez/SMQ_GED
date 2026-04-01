// ============================================================
// pages/AIAssistant.jsx — ACTIA ES GED — Sprint 6 Module IA
// Carte 1 : Chatbot Qualité
// Carte 2 : Classification Automatique
// Carte 3 : Extraction Automatique des Dates
// Carte 4 : Analyse Amélioration Continue
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import AppSidebar from "../components/AppSidebar";
import DocDetailModal from "../components/DocDetailModal";
import { toast } from "sonner";
import { API } from "../config";
import {
  LuBot, LuSend, LuRefreshCw, LuUser, LuSparkles,
  LuTriangleAlert, LuClock, LuEye, LuLayers,
  LuCircleCheck, LuCircleAlert, LuSearch,
  LuCpu, LuActivity, LuChevronRight, LuInfo,
  LuShieldCheck, LuZap, LuChartBar,
  LuFileText, LuFolderOpen, LuTag, LuCalendar,
  LuArchive, LuGitBranch, LuNetwork,
  LuFileCheck, LuBookOpen, LuTrash2,
  LuCopy, LuCheck, LuHistory, LuPlus, LuMessageSquare, LuX,
} from "react-icons/lu";

const GREEN      = "#4ab83f";
const GREEN_DARK = "#3a9a31";
const BG_CARD    = "rgba(255,255,255,0.035)";
const BORDER     = "rgba(255,255,255,0.07)";

// ── Auth header helper ──────────────────────────────────────
function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Status badge ────────────────────────────────────────────
const STATUS_COLORS = {
  "Brouillon":     "#9ca3af",
  "En rédaction":  "#4ade80",
  "En relecture":  "#60a5fa",
  "En validation": "#a5b4fc",
  "Validé":        "#4ade80",
  "Diffusé":       "#2dd4bf",
  "Obsolète":      "#fb923c",
  "Archivé":       "#94a3b8",
};

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "#9ca3af";
  return (
    <span style={{
      background: `${color}18`,
      color,
      border: `1px solid ${color}30`,
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

// ── Priority badge ──────────────────────────────────────────
const PRIORITY_CFG = {
  CRITIQUE: { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
  HAUTE:    { color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)"  },
  MOYENNE:  { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.25)" },
  BASSE:    { color: "#4ade80", bg: "rgba(74,222,128,0.1)",   border: "rgba(74,222,128,0.25)" },
};

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.BASSE;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
    }}>
      {priority}
    </span>
  );
}

// ── Card wrapper ─────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: BG_CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 14,
      backdropFilter: "blur(12px)",
      ...style,
    }}>
      {children}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// SECTION 1 — CHATBOT QUALITÉ
// ═══════════════════════════════════════════════════════════
const QUICK_QUESTIONS = [
  {
    cat: "Surveillance",
    color: "#f87171",
    items: [
      { icon: LuClock,         label: "Documents expirés",       q: "Quels documents ont dépassé leur date de révision ?" },
      { icon: LuCircleAlert,   label: "En attente de validation",q: "Quels documents sont en attente de validation ?" },
      { icon: LuCircleAlert,   label: "En retard de révision",   q: "Quels documents sont en retard de révision ?" },
      { icon: LuTriangleAlert, label: "Documents obsolètes",     q: "Liste les documents obsolètes" },
    ],
  },
  {
    cat: "Documents",
    color: "#60a5fa",
    items: [
      { icon: LuFileText,    label: "Tous les documents",        q: "Donne-moi la liste de tous les documents" },
      { icon: LuUser,        label: "Mes documents",             q: "Quels sont mes documents ?" },
      { icon: LuFolderOpen,  label: "Par dossier",               q: "Combien de documents par dossier ?" },
      { icon: LuTag,         label: "Par type documentaire",     q: "Combien de documents par type documentaire ?" },
    ],
  },
  {
    cat: "Statistiques",
    color: "#818cf8",
    items: [
      { icon: LuChartBar,    label: "Répartition par statut",    q: "Quelle est la répartition des documents par statut ?" },
      { icon: LuShieldCheck, label: "Documents validés",         q: "Quels documents ont le statut Validé ?" },
      { icon: LuEye,         label: "Documents diffusés",        q: "Quels documents sont actuellement diffusés ?" },
      { icon: LuActivity,    label: "En cours de rédaction",     q: "Quels documents sont en cours de rédaction ?" },
    ],
  },
  {
    cat: "Processus & Dates",
    color: "#2dd4bf",
    items: [
      { icon: LuNetwork,     label: "Par processus",             q: "Combien de documents par processus ?" },
      { icon: LuCalendar,    label: "Révisions prochaines",      q: "Quels documents ont une révision dans les 30 prochains jours ?" },
      { icon: LuFileCheck,   label: "Procédure de validation",   q: "Comment fonctionne la procédure de validation ISO ?" },
      { icon: LuGitBranch,   label: "Dates de révision",         q: "Quelles sont les dates de révision des documents ?" },
    ],
  },
  {
    cat: "Activité",
    color: GREEN,
    items: [
      { icon: LuSparkles,    label: "Derniers créés",            q: "Quels sont les 15 derniers documents créés ?" },
      { icon: LuSearch,      label: "Jamais consultés",          q: "Quels documents n'ont jamais été consultés ?" },
      { icon: LuArchive,     label: "Archivés récemment",        q: "Quels documents ont été archivés ?" },
      { icon: LuBookOpen,    label: "En relecture",              q: "Quels documents sont en cours de relecture ?" },
    ],
  },
];

const EMPTY_MESSAGES = {
  expired_docs:       "Aucun document n'a dépassé sa date de révision.",
  validation_pending: "Aucun document n'est actuellement en attente de validation.",
  overdue_docs:       "Aucun document n'est en retard de révision.",
  obsolete_docs:      "Aucun document obsolète trouvé dans le système.",
  archived_docs:      "Aucun document archivé trouvé.",
  published_docs:     "Aucun document diffusé (en vigueur) actuellement.",
  in_relecture:       "Aucun document n'est en cours de relecture.",
  draft_docs:         "Aucun document en cours de rédaction ou brouillon.",
  upcoming_reviews:   "Aucune révision prévue dans les 30 prochains jours.",
  latest_version:     "Aucun document trouvé pour cette référence.",
  validated_docs:     "Aucun document validé trouvé.",
  list_all:           "La base documentaire est vide.",
  never_viewed:       "Tous les documents ont été consultés au moins une fois.",
  my_docs:            "Vous n'avez créé aucun document dans le système.",
  dates_overview:     "Aucune date de révision enregistrée.",
  recent_docs:        "Aucun document récent trouvé.",
  by_responsible:     "Aucun document trouvé pour ce responsable.",
  by_process:         "Aucun document trouvé pour ce processus.",
  by_type:            "Aucun document trouvé pour ce type documentaire.",
  by_folder:          "Aucun document trouvé dans ce dossier.",
  text_search:        "Aucun document ne correspond à votre recherche.",
};

// ── Simple markdown renderer ─────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;
  // Strip SUGGESTIONS JSON before rendering
  const clean = text.replace(/SUGGESTIONS:\{.*?\}$/m, "").trimEnd();
  const lines = clean.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headers
    if (/^###\s/.test(line)) {
      elements.push(<div key={i} style={{ fontSize: 13, fontWeight: 700, color: "rgba(220,235,248,0.95)", marginTop: 10, marginBottom: 4 }}>{line.replace(/^###\s/, "")}</div>);
    } else if (/^##\s/.test(line)) {
      elements.push(<div key={i} style={{ fontSize: 14, fontWeight: 800, color: "rgba(220,235,248,0.98)", marginTop: 12, marginBottom: 5, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 4 }}>{line.replace(/^##\s/, "")}</div>);
    } else if (/^#\s/.test(line)) {
      elements.push(<div key={i} style={{ fontSize: 15, fontWeight: 900, color: "#4ab83f", marginTop: 14, marginBottom: 6 }}>{line.replace(/^#\s/, "")}</div>);
    }
    // Bullet list
    else if (/^[-•*]\s/.test(line)) {
      elements.push(
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginLeft: 8, marginTop: 3 }}>
          <span style={{ color: "#4ab83f", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
          <span>{inlineFormat(line.replace(/^[-•*]\s/, ""))}</span>
        </div>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginLeft: 8, marginTop: 3 }}>
          <span style={{ color: "#4ab83f", fontWeight: 700, flexShrink: 0, minWidth: 18, marginTop: 1 }}>{num}.</span>
          <span>{inlineFormat(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    }
    // Empty line → spacer
    else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 6 }} />);
    }
    // Normal paragraph
    else {
      elements.push(<div key={i} style={{ marginTop: 2 }}>{inlineFormat(line)}</div>);
    }
    i++;
  }
  return <div style={{ lineHeight: 1.65, fontSize: 13.5 }}>{elements}</div>;
}

function inlineFormat(text) {
  // Bold + italic combined, then bold, then italic, then code
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (/^\*\*\*/.test(part)) return <strong key={i}><em>{part.slice(3, -3)}</em></strong>;
    if (/^\*\*/.test(part))   return <strong key={i} style={{ color: "rgba(220,235,248,0.98)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (/^\*/.test(part))     return <em key={i} style={{ color: "rgba(220,235,248,0.85)" }}>{part.slice(1, -1)}</em>;
    if (/^`/.test(part))      return <code key={i} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", fontSize: 12, fontFamily: "monospace", color: "#4ab83f" }}>{part.slice(1, -1)}</code>;
    return part;
  });
}

const INITIAL_MESSAGE = {
  id: 0, from: "bot",
  text: "Bonjour ! Je suis votre assistant IA propulsé par **Groq AI** (Llama 3.3 70B). Posez-moi n'importe quelle question — sur vos documents, l'ISO 9001, la qualité, ou n'importe quel autre sujet. Je suis là pour vous aider !",
  intent: null, docs: [], stats: null, llm: true, suggestions: [],
};

const LS_KEY = "smq_chat_history";

function loadSavedConvs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

function ChatbotSection({ token }) {
  const [messages, setMessages]     = useState([INITIAL_MESSAGE]);
  const [history, setHistory]       = useState([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [copied, setCopied]         = useState(null);
  const [savedConvs, setSavedConvs] = useState(loadSavedConvs);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function persistConvs(convs) {
    setSavedConvs(convs);
    localStorage.setItem(LS_KEY, JSON.stringify(convs));
  }

  function saveCurrentConversation() {
    const userMsgs = messages.filter(m => m.from === "user");
    if (userMsgs.length === 0) return;
    const title = userMsgs[0].text.slice(0, 60) + (userMsgs[0].text.length > 60 ? "…" : "");
    const conv = { id: Date.now(), title, date: new Date().toLocaleDateString("fr-FR"), messages, history };
    const updated = [conv, ...savedConvs].slice(0, 20);
    persistConvs(updated);
    toast.success("Conversation sauvegardée");
  }

  function loadConversation(conv) {
    setMessages(conv.messages);
    setHistory(conv.history || []);
    setShowHistory(false);
  }

  function deleteConversation(id, e) {
    e.stopPropagation();
    persistConvs(savedConvs.filter(c => c.id !== id));
  }

  function clearConversation() {
    setMessages([INITIAL_MESSAGE]);
    setHistory([]);
  }

  function copyMessage(text) {
    const clean = text.replace(/SUGGESTIONS:\{.*?\}$/m, "").trim();
    navigator.clipboard.writeText(clean).then(() => {
      setCopied(clean);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function parseSuggestions(text) {
    try {
      const m = text.match(/SUGGESTIONS:(\{.*?\})/);
      return m ? JSON.parse(m[1]).q || [] : [];
    } catch { return []; }
  }

  async function sendMessage(text) {
    const query = (text || input).trim();
    if (!query || loading) return;
    setInput("");
    const userMsgId = Date.now();
    const botMsgId  = userMsgId + 1;
    setMessages(prev => [...prev, { id: userMsgId, from: "user", text: query }]);
    setLoading(true);

    // Streaming via SSE
    const botPlaceholder = {
      id: botMsgId, from: "bot", text: "", streaming: true,
      intent: null, intentKey: null, docs: [], stats: null,
      statsLabel: "Statut", count: 0, llm: true, suggestions: [],
    };
    setMessages(prev => [...prev, botPlaceholder]);

    try {
      const resp = await fetch(`${API}/ai/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ query, history }),
      });

      if (!resp.ok) throw new Error("Erreur serveur");

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";
      let   fullText = "";
      let   meta     = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === "meta") {
              meta = parsed;
              setMessages(prev => prev.map(m => m.id === botMsgId ? {
                ...m,
                intent:     meta.intent_label,
                intentKey:  meta.intent,
                docs:       meta.documents || [],
                stats:      meta.statistics || null,
                statsLabel: meta.stats_label || "Statut",
                count:      (meta.documents || []).length,
                llm:        meta.llm_powered || false,
              } : m));
            } else if (parsed.token) {
              fullText += parsed.token;
              setMessages(prev => prev.map(m =>
                m.id === botMsgId ? { ...m, text: fullText } : m
              ));
            }
          } catch {}
        }
      }

      const suggestions = parseSuggestions(fullText);
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, streaming: false, suggestions } : m
      ));
      setHistory(prev => [
        ...prev,
        { role: "user",      content: query },
        { role: "assistant", content: fullText.replace(/SUGGESTIONS:\{.*?\}$/m, "").trim() },
      ]);
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, from: "bot-error", text: "Erreur lors du traitement.", streaming: false } : m
      ));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      {/* Quick questions — grouped by category */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {QUICK_QUESTIONS.map(({ cat, color, items }) => (
          <div key={cat}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: `${color}99`, textTransform: "uppercase", letterSpacing: "0.9px" }}>
                {cat}
              </span>
              <div style={{ flex: 1, height: 1, background: `${color}15` }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {items.map(({ icon: Icon, label, q }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(q)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: `${color}08`, border: `1px solid ${color}20`,
                    color: "rgba(168,191,212,0.65)", borderRadius: 20,
                    padding: "5px 13px", fontSize: 12.5, cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${color}18`;
                    e.currentTarget.style.borderColor = `${color}50`;
                    e.currentTarget.style.color = color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `${color}08`;
                    e.currentTarget.style.borderColor = `${color}20`;
                    e.currentTarget.style.color = "rgba(168,191,212,0.65)";
                  }}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Messages */}
      <Card style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 300 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: "flex", gap: 12,
              flexDirection: msg.from === "user" ? "row-reverse" : "row",
            }}>
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: msg.from === "user" ? `${GREEN}20` : "rgba(99,102,241,0.2)",
                border: `1px solid ${msg.from === "user" ? GREEN + "40" : "rgba(99,102,241,0.35)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {msg.from === "user"
                  ? <LuUser size={16} color={GREEN} />
                  : <LuBot size={16} color="#818cf8" />
                }
              </div>

              {/* Bubble */}
              <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{
                  background: msg.from === "user"
                    ? `${GREEN}14`
                    : msg.from === "bot-error"
                      ? "rgba(248,113,113,0.12)"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${msg.from === "user" ? GREEN + "25" : msg.from === "bot-error" ? "rgba(248,113,113,0.25)" : BORDER}`,
                  borderRadius: msg.from === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                  padding: "10px 14px",
                  color: msg.from === "bot-error" ? "#f87171" : "rgba(220,235,248,0.9)",
                  fontSize: 13.5, lineHeight: 1.55,
                }}>
                  {msg.intent && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: msg.llm ? "rgba(139,92,246,0.12)" : "rgba(74,184,63,0.1)",
                      border: `1px solid ${msg.llm ? "rgba(139,92,246,0.3)" : "rgba(74,184,63,0.2)"}`,
                      borderRadius: 6, padding: "2px 8px", fontSize: 11,
                      color: msg.llm ? "#a78bfa" : GREEN,
                      fontWeight: 600, marginBottom: 6,
                    }}>
                      <LuZap size={10} />
                      {msg.llm ? "Groq AI" : msg.intent}
                    </div>
                  )}
                  <div>{msg.from === "bot" ? renderMarkdown(msg.text) : msg.text}</div>
                </div>

                {/* Stats table */}
                {msg.stats && msg.stats.length > 0 && (
                  <div style={{
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`,
                    borderRadius: 10, overflow: "hidden",
                  }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th style={{ padding: "8px 12px", fontSize: 11, color: "rgba(168,191,212,0.5)", fontWeight: 600, textAlign: "left" }}>{msg.statsLabel || "Statut"}</th>
                          <th style={{ padding: "8px 12px", fontSize: 11, color: "rgba(168,191,212,0.5)", fontWeight: 600, textAlign: "right" }}>Nb</th>
                        </tr>
                      </thead>
                      <tbody>
                        {msg.stats.map((s, i) => (
                          <tr key={i} style={{ borderBottom: i < msg.stats.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                            <td style={{ padding: "7px 12px" }}>
                              {msg.statsLabel === "Statut"
                                ? <StatusBadge status={s.name} />
                                : (
                                  <span style={{ fontSize: 12.5, color: "rgba(220,235,248,0.85)", fontWeight: 500 }}>
                                    {s.name || "—"}
                                    {s.code && (
                                      <span style={{ marginLeft: 7, fontSize: 10, fontWeight: 600, color: "rgba(129,140,248,0.75)", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.18)", borderRadius: 4, padding: "1px 5px" }}>
                                        {s.code}
                                      </span>
                                    )}
                                  </span>
                                )
                              }
                            </td>
                            <td style={{ padding: "7px 12px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "rgba(220,235,248,0.85)" }}>{s.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* No results indicator */}
                {msg.intentKey && msg.from === "bot" &&
                 (!msg.docs || msg.docs.length === 0) &&
                 (!msg.stats || msg.stats.length === 0) &&
                 msg.intentKey !== "help" && msg.intentKey !== "how_to_validate" && msg.intentKey !== "general_advice" && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)",
                    borderRadius: 10, padding: "10px 14px",
                  }}>
                    <LuSearch size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: "#fbbf24", fontWeight: 500 }}>
                      {EMPTY_MESSAGES[msg.intentKey] || "Aucun résultat trouvé pour cette requête."}
                    </span>
                  </div>
                )}

                {/* Copy + streaming indicator */}
                {msg.from === "bot" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -4 }}>
                    {msg.streaming && (
                      <span style={{ fontSize: 11, color: "rgba(168,191,212,0.4)", fontStyle: "italic" }}>
                        l'assistant écrit…
                      </span>
                    )}
                    {!msg.streaming && msg.text && (() => {
                      const cleanText = msg.text.replace(/SUGGESTIONS:\{.*?\}$/m,"").trim();
                      const isCopied  = copied === cleanText;
                      return (
                        <button
                          onClick={() => copyMessage(msg.text)}
                          title={isCopied ? "Copié !" : "Copier la réponse"}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            background: isCopied ? "rgba(74,184,63,0.1)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${isCopied ? "rgba(74,184,63,0.3)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 6, padding: "3px 9px", cursor: "pointer",
                            color: isCopied ? GREEN : "rgba(168,191,212,0.45)",
                            fontSize: 11, fontWeight: 500, transition: "all 0.2s",
                          }}
                          onMouseEnter={e => { if (!isCopied) { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(168,191,212,0.8)"; }}}
                          onMouseLeave={e => { if (!isCopied) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(168,191,212,0.45)"; }}}
                        >
                          {isCopied
                            ? <><LuCheck size={11} /> Copié</>
                            : <><LuCopy  size={11} /> Copier</>
                          }
                        </button>
                      );
                    })()}
                  </div>
                )}

                {/* Suggested follow-up questions */}
                {msg.from === "bot" && !msg.streaming && msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                    {msg.suggestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        style={{
                          background: "rgba(74,184,63,0.06)", border: "1px solid rgba(74,184,63,0.2)",
                          color: "rgba(74,184,63,0.8)", borderRadius: 20,
                          padding: "4px 12px", fontSize: 11.5, cursor: "pointer",
                          transition: "all 0.15s", textAlign: "left",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(74,184,63,0.14)"; e.currentTarget.style.borderColor = "rgba(74,184,63,0.4)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(74,184,63,0.06)"; e.currentTarget.style.borderColor = "rgba(74,184,63,0.2)"; }}
                      >
                        ↳ {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Documents list */}
                {msg.docs && msg.docs.length > 0 && (
                  <div style={{
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`,
                    borderRadius: 10, overflow: "hidden",
                  }}>
                    <div style={{ padding: "8px 12px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "rgba(168,191,212,0.5)", fontWeight: 600 }}>RÉSULTATS</span>
                      <span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>{msg.count} doc(s)</span>
                    </div>
                    <div style={{ maxHeight: 260, overflowY: "auto" }}>
                      {msg.docs.map(doc => (
                        <div key={doc.id} onClick={() => setSelectedDocId(doc.id)} style={{
                          padding: "9px 12px", borderBottom: `1px solid ${BORDER}`,
                          display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10,
                          cursor: "pointer", transition: "background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(74,184,63,0.07)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, fontFamily: "monospace", flexShrink: 0 }}>{doc.doc_code}</span>
                              {doc.type_code && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(129,140,248,0.8)", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 4, padding: "1px 6px" }}>
                                  {doc.type_code}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: "rgba(220,235,248,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240, marginBottom: 2 }}>{doc.title}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              {doc.responsible && (
                                <span style={{ fontSize: 10.5, color: "rgba(168,191,212,0.5)" }}>{doc.responsible}</span>
                              )}
                              {doc.next_review_date && (
                                <span style={{ fontSize: 10.5, color: "rgba(168,191,212,0.45)" }}>
                                  Rev. {new Date(doc.next_review_date).toLocaleDateString("fr-FR")}
                                </span>
                              )}
                              {doc.days_overdue && (
                                <span style={{ fontSize: 10.5, color: "#fb923c", fontWeight: 600 }}>{doc.days_overdue}j de retard</span>
                              )}
                            </div>
                          </div>
                          <StatusBadge status={doc.status_name} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <LuBot size={16} color="#818cf8" />
              </div>
              <div style={{
                padding: "10px 14px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
                borderRadius: "4px 14px 14px 14px",
                display: "flex", gap: 6, alignItems: "center",
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "rgba(168,191,212,0.4)",
                    animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", gap: 8 }}>
            {/* New conversation */}
            <button onClick={clearConversation} title="Nouvelle conversation"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", color: "rgba(168,191,212,0.5)", display: "flex", alignItems: "center", transition: "all 0.2s", flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.1)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(168,191,212,0.5)"; e.currentTarget.style.borderColor = BORDER; }}
            ><LuPlus size={15} /></button>

            {/* Save conversation */}
            <button onClick={saveCurrentConversation} title="Sauvegarder la conversation"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", color: "rgba(168,191,212,0.5)", display: "flex", alignItems: "center", transition: "all 0.2s", flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(74,184,63,0.1)"; e.currentTarget.style.color = GREEN; e.currentTarget.style.borderColor = "rgba(74,184,63,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(168,191,212,0.5)"; e.currentTarget.style.borderColor = BORDER; }}
            ><LuMessageSquare size={15} /></button>

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Posez votre question en français… (Entrée pour envoyer)"
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", color: "rgba(220,235,248,0.9)", fontSize: 13.5, outline: "none" }}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              style={{ background: loading || !input.trim() ? "rgba(74,184,63,0.3)" : `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})`, border: "none", borderRadius: 10, padding: "10px 16px", color: "#fff", cursor: loading || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}
            ><LuSend size={15} /> Envoyer</button>
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {history.length > 0 && (
              <span style={{ fontSize: 11, color: "rgba(168,191,212,0.3)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
                {Math.floor(history.length / 2)} échange(s) en mémoire
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ── History Panel ───────────────────────────────────────── */}
      <Card style={{ overflow: "hidden" }}>
        {/* Header — always visible */}
        <button
          onClick={() => setShowHistory(h => !h)}
          style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LuHistory size={15} color={GREEN} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(220,235,248,0.85)" }}>
              Historique des conversations
            </span>
            {savedConvs.length > 0 && (
              <span style={{ background: `${GREEN}20`, color: GREEN, border: `1px solid ${GREEN}35`, borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>
                {savedConvs.length}
              </span>
            )}
          </div>
          <LuChevronRight size={14} color="rgba(168,191,212,0.4)"
            style={{ transform: showHistory ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        {/* Collapsible list */}
        {showHistory && (
          <div style={{ borderTop: `1px solid ${BORDER}`, maxHeight: 320, overflowY: "auto" }}>
            {savedConvs.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                <LuMessageSquare size={28} color="rgba(168,191,212,0.2)" style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 12.5, color: "rgba(168,191,212,0.35)" }}>
                  Aucune conversation sauvegardée.<br />
                  Cliquez sur <LuMessageSquare size={11} style={{ verticalAlign: "middle" }} /> pour en sauvegarder une.
                </p>
              </div>
            ) : (
              savedConvs.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  style={{
                    padding: "10px 16px", borderBottom: `1px solid ${BORDER}`,
                    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <LuMessageSquare size={13} color="rgba(129,140,248,0.6)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: "rgba(220,235,248,0.8)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.title}
                    </div>
                    <div style={{ fontSize: 10.5, color: "rgba(168,191,212,0.35)", marginTop: 2 }}>
                      {conv.date} · {conv.messages.filter(m => m.from === "user").length} question(s)
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    title="Supprimer"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(168,191,212,0.25)", padding: 4, borderRadius: 4, display: "flex", transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(168,191,212,0.25)"}
                  >
                    <LuX size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {selectedDocId && <DocDetailModal docId={selectedDocId} onClose={() => setSelectedDocId(null)} />}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50%       { opacity: 1;    transform: scale(1.1);  }
        }
      `}</style>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// SECTION 4 — ANALYSE AMÉLIORATION CONTINUE
// ═══════════════════════════════════════════════════════════
const ICON_MAP = {
  warning:   LuTriangleAlert,
  "eye-off": LuEye,
  clock:     LuClock,
  layers:    LuLayers,
};

function ImprovementsSection({ token }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: resp } = await axios.get(`${API}/ai/improvements`, {
        headers: authHeaders(token),
      });
      setData(resp);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, gap: 16 }}>
        <LuCpu size={32} color={GREEN} style={{ animation: "spin 2s linear infinite" }} />
        <p style={{ margin: 0, color: "rgba(168,191,212,0.6)", fontSize: 14 }}>Analyse en cours…</p>
      </div>
    );
  }

  if (!data) return null;

  const healthColor = data.health_score >= 80 ? GREEN : data.health_score >= 60 ? "#fbbf24" : "#f87171";
  const KPIS = [
    { label: "Total",         value: data.kpis.total,         color: "rgba(168,191,212,0.7)" },
    { label: "Diffusés",      value: data.kpis.diffuse,       color: "#2dd4bf" },
    { label: "En validation", value: data.kpis.en_validation, color: "#a5b4fc" },
    { label: "Obsolètes",     value: data.kpis.obsolete,      color: "#fb923c" },
    { label: "Expirés",       value: data.kpis.expired,       color: "#f87171" },
    { label: "Archivés",      value: data.kpis.archive,       color: "#94a3b8" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "stretch" }}>
        {/* Health score */}
        <Card style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gridColumn: "span 1", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(168,191,212,0.45)" }}>Score Qualité</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: healthColor, lineHeight: 1, fontFamily: "monospace" }}>
            {data.health_score}
          </div>
          <div style={{ fontSize: 11, color: healthColor, fontWeight: 700 }}>{data.health_label}</div>
        </Card>

        {/* KPIs */}
        {KPIS.slice(1).map(kpi => (
          <Card key={kpi.label} style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(168,191,212,0.4)" }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: kpi.color, fontFamily: "monospace", lineHeight: 1 }}>
              {kpi.value}
            </div>
          </Card>
        ))}

        {/* Refresh */}
        <button
          onClick={load}
          style={{
            background: "rgba(74,184,63,0.08)", border: `1px solid ${GREEN}25`,
            borderRadius: 12, padding: "0 16px", cursor: "pointer",
            color: GREEN, display: "flex", alignItems: "center", gap: 7,
            fontSize: 13, fontWeight: 600,
          }}
        >
          <LuRefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* ── AI Synthesis Block ─────────────────────────────────── */}
      {data.ai_synthesis && (
        <Card style={{ padding: 0, overflow: "hidden", border: "1px solid rgba(139,92,246,0.22)" }}>
          {/* Header */}
          <div style={{
            padding: "13px 20px",
            background: "linear-gradient(90deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))",
            borderBottom: "1px solid rgba(139,92,246,0.15)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <LuSparkles size={14} color="#a78bfa" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Rapport IA — Amélioration Continue</div>
              <div style={{ fontSize: 11, color: "rgba(167,139,250,0.5)" }}>Généré par llama-3.3-70b · ISO 9001</div>
            </div>
          </div>

          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Synthèse */}
            {data.ai_synthesis.synthese && (
              <div style={{
                background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)",
                borderRadius: 10, padding: "13px 16px",
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(167,139,250,0.6)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 7 }}>
                  Synthèse exécutive
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: "rgba(220,235,248,0.88)", lineHeight: 1.65 }}>
                  {data.ai_synthesis.synthese}
                </p>
              </div>
            )}

            {/* Axes prioritaires */}
            {data.ai_synthesis.axes?.length > 0 && (
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(167,139,250,0.6)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
                  Axes prioritaires d'amélioration
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.ai_synthesis.axes.map((axe, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 14px",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 9,
                    }}>
                      <div style={{
                        minWidth: 24, height: 24, borderRadius: 6,
                        background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.28)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, color: "#a78bfa", flexShrink: 0,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(220,235,248,0.9)" }}>{axe.titre}</span>
                          {axe.clause && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: "#a78bfa",
                              background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)",
                              borderRadius: 5, padding: "1px 7px",
                            }}>
                              {axe.clause}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 12.5, color: "rgba(168,191,212,0.72)", lineHeight: 1.55 }}>{axe.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conclusion */}
            {data.ai_synthesis.conclusion && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                background: `rgba(74,184,63,0.06)`, border: `1px solid rgba(74,184,63,0.15)`,
                borderRadius: 9,
              }}>
                <LuCircleCheck size={15} color={GREEN} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12.5, color: "rgba(220,235,248,0.75)", fontStyle: "italic", lineHeight: 1.5 }}>
                  {data.ai_synthesis.conclusion}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "rgba(220,235,248,0.9)", display: "flex", alignItems: "center", gap: 8 }}>
            <LuSparkles size={16} color={GREEN} />
            Recommandations IA
          </h3>
          <span style={{
            background: data.total_recommendations > 0 ? "rgba(248,113,113,0.12)" : "rgba(74,184,63,0.1)",
            color: data.total_recommendations > 0 ? "#f87171" : GREEN,
            border: `1px solid ${data.total_recommendations > 0 ? "rgba(248,113,113,0.25)" : "rgba(74,184,63,0.25)"}`,
            borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700,
          }}>
            {data.total_recommendations} recommandation(s)
          </span>
        </div>

        {data.recommendations.length === 0 ? (
          <Card style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
            <LuCircleCheck size={40} color={GREEN} />
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: GREEN }}>Excellent état documentaire !</p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(168,191,212,0.5)" }}>
                Aucune anomalie détectée. Continuez ainsi.
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.recommendations.map((rec, i) => {
              const Icon = ICON_MAP[rec.icon] || LuTriangleAlert;
              const isOpen = expanded === i;
              const pcfg = PRIORITY_CFG[rec.priority] || PRIORITY_CFG.BASSE;
              return (
                <Card key={rec.id} style={{
                  border: isOpen ? `1px solid ${pcfg.border}` : `1px solid ${BORDER}`,
                  transition: "all 0.2s",
                }}>
                  {/* Header */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : i)}
                    style={{
                      width: "100%", background: "none", border: "none",
                      padding: "14px 16px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: pcfg.bg, border: `1px solid ${pcfg.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={17} color={pcfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: "rgba(220,235,248,0.9)" }}>{rec.title}</span>
                        <PriorityBadge priority={rec.priority} />
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px",
                          color: "rgba(168,191,212,0.4)", background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${BORDER}`, borderRadius: 5, padding: "2px 6px",
                        }}>
                          {rec.category}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(168,191,212,0.6)", lineHeight: 1.45 }}>{rec.detail}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {rec.metric && (
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: pcfg.color, lineHeight: 1, fontFamily: "monospace" }}>
                            {rec.metric.value}
                          </div>
                          <div style={{ fontSize: 10, color: "rgba(168,191,212,0.45)", fontWeight: 600 }}>
                            {rec.metric.unit}
                          </div>
                        </div>
                      )}
                      <LuChevronRight
                        size={16}
                        color="rgba(168,191,212,0.4)"
                        style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                      />
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${BORDER}` }}>
                      <div style={{
                        background: "rgba(74,184,63,0.06)", border: "1px solid rgba(74,184,63,0.15)",
                        borderRadius: 10, padding: "10px 14px", marginTop: 12,
                        display: "flex", alignItems: "flex-start", gap: 8,
                      }}>
                        <LuZap size={14} color={GREEN} style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>
                            Action recommandée
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "rgba(220,235,248,0.8)", lineHeight: 1.5 }}>
                            {rec.action}
                          </p>
                        </div>
                      </div>

                      {/* Documents list if any */}
                      {rec.documents && rec.documents.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(168,191,212,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
                            Documents concernés ({rec.documents.length})
                          </div>
                          <div style={{
                            maxHeight: 160, overflowY: "auto",
                            border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden",
                          }}>
                            {rec.documents.map((doc, j) => (
                              <div key={j} style={{
                                padding: "7px 12px",
                                borderBottom: j < rec.documents.length - 1 ? `1px solid ${BORDER}` : "none",
                                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                              }}>
                                <div>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: GREEN, fontFamily: "monospace", marginRight: 8 }}>
                                    {doc.doc_code}
                                  </span>
                                  <span style={{ fontSize: 12, color: "rgba(168,191,212,0.7)" }}>{doc.title}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  {doc.version_count && (
                                    <span style={{ fontSize: 11, color: "#818cf8" }}>{doc.version_count} versions</span>
                                  )}
                                  <StatusBadge status={doc.status_name} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{
                        marginTop: 12, padding: "8px 12px",
                        background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)",
                        borderRadius: 8, display: "flex", gap: 8, alignItems: "center",
                      }}>
                        <LuInfo size={13} color="#fbbf24" />
                        <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 500 }}>
                          La décision finale appartient au Responsable Qualité. Cette recommandation est automatique.
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ textAlign: "right", fontSize: 11, color: "rgba(168,191,212,0.3)" }}>
        Analyse générée le {new Date(data.generated_at).toLocaleString("fr-FR")}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
const TABS = [
  { id: "chatbot",      label: "Chatbot Qualité",       icon: LuBot,      roles: ["*"] },
  { id: "improvements", label: "Amélioration Continue", icon: LuChartBar, roles: ["*"] },
];

export default function AIAssistant() {
  const { currentUser, token } = useUser();
  const [activeTab, setActiveTab] = useState("chatbot");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(145deg,#0a1420 0%,#0d1f2d 50%,#0b1929 100%)" }}>
      <AppSidebar user={currentUser} />

      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", maxWidth: 1100 }}>

        {/* ── Page header ─────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          {/* Top bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 18, paddingBottom: 18,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Icon */}
              <div style={{
                width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                background: `linear-gradient(135deg, ${GREEN}20, ${GREEN}0a)`,
                border: `1.5px solid ${GREEN}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 16px ${GREEN}18`,
              }}>
                <LuCpu size={22} color={GREEN} />
              </div>
              {/* Title + badge */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                  <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: "rgba(220,235,248,0.96)", letterSpacing: "-0.025em" }}>
                    Assistant IA
                  </h1>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.28)",
                    borderRadius: 7, padding: "3px 9px",
                    fontSize: 10.5, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.2px",
                  }}>
                    <LuZap size={10} /> Groq AI
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(168,191,212,0.42)", letterSpacing: "0.1px" }}>
                  llama-3.3-70b · Streaming · Données ACTIA ES en temps réel
                </p>
              </div>
            </div>
            {/* Status indicator */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "rgba(74,184,63,0.08)", border: "1px solid rgba(74,184,63,0.2)",
              borderRadius: 10, padding: "6px 14px",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(74,184,63,0.85)" }}>Connecté</span>
            </div>
          </div>

          {/* ── Tabs (pill style) ── */}
          <div style={{
            display: "flex", gap: 4, padding: "4px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, width: "fit-content",
          }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 18px",
                    borderRadius: 9,
                    border: isActive ? `1.5px solid rgba(74,184,63,0.28)` : "1.5px solid transparent",
                    background: isActive ? "rgba(74,184,63,0.13)" : "transparent",
                    color: isActive ? GREEN : "rgba(168,191,212,0.58)",
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    whiteSpace: "nowrap",
                    boxShadow: isActive ? "0 2px 10px rgba(74,184,63,0.1)" : "none",
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.055)"; e.currentTarget.style.color = "rgba(220,235,248,0.9)"; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(168,191,212,0.58)"; }}}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "chatbot"      && <ChatbotSection      token={token} />}
          {activeTab === "improvements" && <ImprovementsSection token={token} />}
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
