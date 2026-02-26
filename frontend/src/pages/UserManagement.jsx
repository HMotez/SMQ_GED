// ============================================================
// pages/UserManagement.jsx — Admin GED · Gestion des utilisateurs
// Activation des comptes + attribution des rôles + rejet
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import AppSidebar from "../components/AppSidebar";
import {
  LuUsers, LuUserCheck, LuUserX, LuRefreshCw, LuShieldCheck,
  LuCircleCheckBig, LuCircleAlert, LuClock, LuCheck, LuX,
} from "react-icons/lu";

import { API } from "../config";

const ROLE_COLORS = {
  "Admin GED":           "#f87171",
  "Responsable Qualité": "#fbbf24",
  "Ing. Qualité":        "#2dd4bf",
  "Rédacteur":           "#60a5fa",
  "Validateur":          "#4ade80",
  "Lecteur":             "#a78bfa",
};

const STYLES = `
  @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  .anim-in  { animation: fadeInUp 0.4s cubic-bezier(.16,1,.3,1) both; }
  .anim-msg { animation: fadeIn 0.25s ease both; }

  .user-row { transition: background 0.18s, border-color 0.18s; }
  .user-row:hover { background: rgba(255,255,255,0.03) !important; }

  .role-select {
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.85);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12.5px;
    outline: none;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
    appearance: none;
    min-width: 160px;
  }
  .role-select:focus {
    border-color: rgba(74,184,63,0.5);
    box-shadow: 0 0 0 3px rgba(74,184,63,0.12);
  }
  .role-select:disabled { opacity: 0.45; cursor: not-allowed; }
  .role-select option   { background: #0d1f30; }

  .action-btn {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .action-btn:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; filter: none !important; }
`;

/* ── Toast notification ───────────────────────────────────── */
function Toast({ msg, type }) {
  if (!msg) return null;
  const isOk = type === "success";
  return (
    <div className="anim-msg fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl"
      style={{
        background: isOk ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
        borderColor: isOk ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)",
        backdropFilter: "blur(16px)",
        maxWidth: 420,
      }}>
      {isOk
        ? <LuCircleCheckBig size={16} style={{ color:"#4ade80", flexShrink:0 }} />
        : <LuCircleAlert    size={16} style={{ color:"#f87171", flexShrink:0 }} />}
      <span className="text-[13px] font-semibold" style={{ color: isOk ? "#4ade80" : "#f87171" }}>{msg}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function UserManagement() {
  const { currentUser, token, logout } = useUser();

  const [users,     setUsers]     = useState([]);
  const [roles,     setRoles]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState({}); // userId → bool (activate)
  const [rejecting, setRejecting] = useState({}); // userId → bool
  const [selected,  setSelected]  = useState({}); // userId → roleId
  const [toast,     setToast]     = useState({ msg:"", type:"" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:"", type:"" }), 3500);
  };

  // ── Fetch roles list ─────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRoles(await res.json());
    } catch { /* ignore */ }
  }, [token]);

  // ── Fetch users ──────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/roles/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      showToast("Impossible de charger les utilisateurs.", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [fetchRoles, fetchUsers]);

  // ── Init selected dropdown when both users + roles are ready ──
  useEffect(() => {
    if (!roles.length || !users.length) return;
    setSelected(prev => {
      const init = { ...prev };
      users.forEach(u => {
        // Only initialize if not already touched by the admin
        if (init[u.id] !== undefined) return;
        if (u.role_id) {
          init[u.id] = String(u.role_id);
        } else if (u.requested_role) {
          // Pre-fill dropdown with requested role
          const match = roles.find(r => r.name === u.requested_role);
          init[u.id] = match ? String(match.id) : "";
        } else {
          init[u.id] = "";
        }
      });
      return init;
    });
  }, [users, roles]);

  // Reset selected when users are re-fetched (so new pending users get pre-filled)
  useEffect(() => {
    if (!roles.length) return;
    const init = {};
    users.forEach(u => {
      if (u.role_id) {
        init[u.id] = String(u.role_id);
      } else if (u.requested_role) {
        const match = roles.find(r => r.name === u.requested_role);
        init[u.id] = match ? String(match.id) : "";
      } else {
        init[u.id] = "";
      }
    });
    setSelected(init);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]); // intentionally omit roles — only re-run when users change

  // ── Activate + assign role ───────────────────────────────
  const handleActivate = async (userId, userName) => {
    const roleId = selected[userId];
    if (!roleId) return showToast("Sélectionnez un rôle avant d'activer.", "error");

    setSaving(s => ({ ...s, [userId]: true }));
    try {
      const res = await fetch(`${API}/roles/users/${userId}`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ roleId: parseInt(roleId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur.");
      showToast(data.message || `Compte de ${userName} activé.`, "success");
      await fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(s => ({ ...s, [userId]: false }));
    }
  };

  // ── Reject + delete account ──────────────────────────────
  const handleReject = async (userId, userName, userEmail) => {
    setRejecting(s => ({ ...s, [userId]: true }));
    try {
      const res = await fetch(`${API}/roles/users/${userId}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur.");
      showToast(`Compte de "${userName}" (${userEmail}) rejeté et supprimé.`, "success");
      await fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRejecting(s => ({ ...s, [userId]: false }));
    }
  };

  const pending = users.filter(u => !u.is_active);
  const active  = users.filter(u =>  u.is_active);

  return (
    <div className="flex min-h-screen"
      style={{ background:"linear-gradient(145deg,#0a1420 0%,#0f1e30 40%,#162840 100%)", fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{STYLES}</style>

      <AppSidebar user={currentUser} onLogout={logout} />

      <main className="flex-1 min-w-0 p-6 overflow-y-auto">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="anim-in mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
              style={{ background:"rgba(74,184,63,0.12)", border:"1.5px solid rgba(74,184,63,0.3)" }}>
              <LuUsers size={17} style={{ color:"#4ab83f" }} />
            </div>
            <div>
              <h1 className="text-white text-[20px] font-black m-0" style={{ letterSpacing:-0.5 }}>
                Gestion des utilisateurs
              </h1>
              <p className="m-0 text-[12px]" style={{ color:"rgba(168,191,212,0.5)" }}>
                Activation des comptes et attribution des rôles — Admin GED
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats strip ────────────────────────────────── */}
        <div className="anim-in flex gap-3 mb-6">
          {[
            { label:"Total",       value:users.length,   color:"#60a5fa" },
            { label:"En attente",  value:pending.length, color:"#fbbf24", highlight: pending.length > 0 },
            { label:"Actifs",      value:active.length,  color:"#4ade80" },
          ].map(stat => (
            <div key={stat.label}
              className="flex-1 px-4 py-3 rounded-xl border"
              style={{
                background:  stat.highlight ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)",
                borderColor: stat.highlight ? "rgba(251,191,36,0.3)"  : "rgba(255,255,255,0.08)",
              }}>
              <div className="text-[22px] font-black tabular-nums" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-[11px] font-semibold mt-0.5" style={{ color:"rgba(168,191,212,0.5)" }}>{stat.label}</div>
            </div>
          ))}
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="action-btn px-4"
            style={{ background:"rgba(255,255,255,0.06)", color:"rgba(168,191,212,0.7)", border:"1.5px solid rgba(255,255,255,0.1)" }}>
            <LuRefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span style={{ width:28,height:28,border:"2.5px solid rgba(255,255,255,0.1)",borderTopColor:"#4ab83f",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} />
          </div>
        ) : (
          <>
            {/* ── Pending section ──────────────────────── */}
            {pending.length > 0 && (
              <section className="anim-in mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <LuClock size={14} style={{ color:"#fbbf24" }} />
                  <h2 className="text-[13px] font-bold m-0 uppercase tracking-wider" style={{ color:"#fbbf24" }}>
                    En attente d'activation ({pending.length})
                  </h2>
                </div>

                <div className="rounded-2xl overflow-hidden"
                  style={{ border:"1px solid rgba(251,191,36,0.2)", background:"rgba(251,191,36,0.04)" }}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                        {["Nom", "Email", "Rôle demandé", "Attribuer un rôle", "Actions"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[10.5px] font-bold uppercase tracking-wider"
                            style={{ color:"rgba(168,191,212,0.4)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((u, idx) => {
                        const reqColor = ROLE_COLORS[u.requested_role] || "rgba(168,191,212,0.5)";
                        const isSaving   = !!saving[u.id];
                        const isRejecting = !!rejecting[u.id];
                        const busy = isSaving || isRejecting;
                        return (
                          <tr key={u.id}
                            className="user-row"
                            style={{
                              borderBottom: idx < pending.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                              background: "transparent",
                            }}>

                            {/* Nom */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.25)" }}>
                                  <LuUserX size={13} style={{ color:"#fbbf24" }} />
                                </div>
                                <span className="text-[13px] font-semibold" style={{ color:"rgba(255,255,255,0.85)" }}>{u.name}</span>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-5 py-3.5">
                              <span className="text-[12.5px]" style={{ color:"rgba(168,191,212,0.6)" }}>{u.email}</span>
                            </td>

                            {/* Rôle demandé */}
                            <td className="px-5 py-3.5">
                              {u.requested_role ? (
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap"
                                  style={{
                                    background: `${reqColor}16`,
                                    color:      reqColor,
                                    border:     `1.5px solid ${reqColor}30`,
                                  }}>
                                  {u.requested_role}
                                </span>
                              ) : (
                                <span className="text-[11px]" style={{ color:"rgba(168,191,212,0.35)" }}>—</span>
                              )}
                            </td>

                            {/* Dropdown */}
                            <td className="px-5 py-3.5">
                              <select
                                className="role-select"
                                value={selected[u.id] || ""}
                                onChange={e => setSelected(s => ({ ...s, [u.id]: e.target.value }))}
                                disabled={busy}
                              >
                                <option value="">— Choisir un rôle —</option>
                                {roles.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                {/* Activer */}
                                <button
                                  className="action-btn"
                                  onClick={() => handleActivate(u.id, u.name)}
                                  disabled={busy || !selected[u.id]}
                                  style={{
                                    background: selected[u.id] ? "rgba(74,184,63,0.15)" : "rgba(255,255,255,0.05)",
                                    color:      selected[u.id] ? "#4ab83f"              : "rgba(168,191,212,0.35)",
                                    border:     `1.5px solid ${selected[u.id] ? "rgba(74,184,63,0.35)" : "rgba(255,255,255,0.08)"}`,
                                  }}>
                                  {isSaving
                                    ? <><span style={{ width:11,height:11,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#4ab83f",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} /> En cours…</>
                                    : <><LuCheck size={12} /> Activer</>}
                                </button>

                                {/* Rejeter */}
                                <button
                                  className="action-btn"
                                  onClick={() => handleReject(u.id, u.name, u.email)}
                                  disabled={busy}
                                  style={{
                                    background: "rgba(248,113,113,0.1)",
                                    color:      "#f87171",
                                    border:     "1.5px solid rgba(248,113,113,0.28)",
                                  }}>
                                  {isRejecting
                                    ? <><span style={{ width:11,height:11,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#f87171",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} /> Rejet…</>
                                    : <><LuX size={12} /> Rejeter</>}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── Active users section ─────────────────── */}
            <section className="anim-in">
              <div className="flex items-center gap-2 mb-3">
                <LuShieldCheck size={14} style={{ color:"#4ab83f" }} />
                <h2 className="text-[13px] font-bold m-0 uppercase tracking-wider" style={{ color:"#4ab83f" }}>
                  Comptes actifs ({active.length})
                </h2>
              </div>

              {active.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border"
                  style={{ border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)" }}>
                  <p className="text-[13px] m-0" style={{ color:"rgba(168,191,212,0.4)" }}>Aucun compte actif.</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden border"
                  style={{ border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.025)" }}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                        {["Nom", "Email", "Rôle actuel", "Modifier le rôle", "Action"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[10.5px] font-bold uppercase tracking-wider"
                            style={{ color:"rgba(168,191,212,0.4)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {active.map((u, idx) => {
                        const roleColor = ROLE_COLORS[u.role] || "#a8bfd4";
                        const isDirty = selected[u.id] && String(selected[u.id]) !== String(u.role_id);
                        return (
                          <tr key={u.id}
                            className="user-row"
                            style={{
                              borderBottom: idx < active.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                              background: "transparent",
                            }}>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ background:`${roleColor}15`, border:`1px solid ${roleColor}30` }}>
                                  <LuUserCheck size={13} style={{ color: roleColor }} />
                                </div>
                                <span className="text-[13px] font-semibold" style={{ color:"rgba(255,255,255,0.85)" }}>{u.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-[12.5px]" style={{ color:"rgba(168,191,212,0.6)" }}>{u.email}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              {u.role ? (
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                                  style={{ background:`${roleColor}14`, color:roleColor, border:`1.5px solid ${roleColor}28` }}>
                                  {u.role}
                                </span>
                              ) : (
                                <span className="text-[11px]" style={{ color:"rgba(168,191,212,0.35)" }}>—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <select
                                className="role-select"
                                value={selected[u.id] || ""}
                                onChange={e => setSelected(s => ({ ...s, [u.id]: e.target.value }))}
                                disabled={saving[u.id]}
                              >
                                <option value="">— Sélectionner —</option>
                                {roles.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3.5">
                              <button
                                className="action-btn"
                                onClick={() => handleActivate(u.id, u.name)}
                                disabled={saving[u.id] || !isDirty}
                                style={{
                                  background: isDirty ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.04)",
                                  color:      isDirty ? "#60a5fa"               : "rgba(168,191,212,0.3)",
                                  border:     `1.5px solid ${isDirty ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.07)"}`,
                                }}>
                                {saving[u.id]
                                  ? <><span style={{ width:11,height:11,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#60a5fa",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} /> En cours…</>
                                  : <><LuCheck size={12} /> Appliquer</>}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
