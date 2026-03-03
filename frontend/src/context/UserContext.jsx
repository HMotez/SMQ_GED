// ============================================================
// context/UserContext.jsx — Sprint 3 : JWT Authentication
// login() → POST /api/auth/login → Bearer token
// logout() → clear token → redirect /login
// ============================================================
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { API } from "../config";

// ── Permissions par rôle (miroir backend) ─────────────────────
export const ROLE_PERMISSIONS = {
  "Admin":        ["document:read","document:create","document:update","document:status","validation:create","archive:manage","user:manage"],
  "Ing. Qualité": ["document:read","document:create","document:update","document:status"],
  "Reviewer":     ["document:read","validation:create"],
};

export const TRANSITION_ROLE_MAP = {
  "Brouillon→En rédaction":     ["Admin","Ing. Qualité"],
  "En rédaction→En relecture":  ["Admin","Ing. Qualité"],
  "En relecture→En validation": ["Admin","Ing. Qualité"],
  "En validation→Validé":       ["Admin","Reviewer"],
  "Validé→Diffusé":             ["Admin"],
  "Diffusé→Obsolète":           ["Admin"],
  "Obsolète→Archivé":           ["Admin"],
};

const UserContext = createContext(null);

// ── Helper axios ─────────────────────────────────────────────
function setAuthHeader(token) {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // Keep x-user-id for backward compat (decoded from token below)
  } else {
    delete axios.defaults.headers.common["Authorization"];
    delete axios.defaults.headers.common["x-user-id"];
  }
}

export function UserProvider({ children }) {
  const [currentUser,  setCurrentUserState] = useState(null);
  const [token,        setTokenState]        = useState(null);
  const [authLoading,  setAuthLoading]       = useState(true); // checking stored token

  // ── Auto-login helper (used for startup & role switching) ───
  const autoLogin = useCallback(async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    const { token: newToken, user } = res.data;
    localStorage.setItem("ged_token", newToken);
    setTokenState(newToken);
    setCurrentUserState(user);
    setAuthHeader(newToken);
    axios.defaults.headers.common["x-user-id"] = user.id;
    return user;
  }, []);

  // ── Restore token from localStorage on mount ────────────────
  useEffect(() => {
    const stored = localStorage.getItem("ged_token");
    if (!stored) {
      // No stored session — visitor mode (not authenticated)
      setAuthLoading(false);
      return;
    }
    // Verify stored token with server
    axios.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((res) => {
        const user = res.data.user;
        setCurrentUserState(user);
        setTokenState(stored);
        setAuthHeader(stored);
        axios.defaults.headers.common["x-user-id"] = user.id;
      })
      .catch(() => {
        // Token expired — clear session, visitor mode
        localStorage.removeItem("ged_token");
      })
      .finally(() => setAuthLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── login ────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    const { token: newToken, user } = res.data;

    localStorage.setItem("ged_token", newToken);
    setTokenState(newToken);
    setCurrentUserState(user);
    setAuthHeader(newToken);
    axios.defaults.headers.common["x-user-id"] = user.id;
  }, []);

  // ── logout ───────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch { /* ignore */ }
    localStorage.removeItem("ged_token");
    setTokenState(null);
    setCurrentUserState(null);
    setAuthHeader(null);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────
  const userRole = currentUser?.role || null;

  const can = useCallback((permission) => {
    if (!userRole) return false;
    return (ROLE_PERMISSIONS[userRole] || []).includes(permission);
  }, [userRole]);

  const canTransition = useCallback((from, to) => {
    if (!userRole) return false;
    const key = `${from}→${to}`;
    return (TRANSITION_ROLE_MAP[key] || []).includes(userRole);
  }, [userRole]);

  const isRole = useCallback((...roles) => roles.includes(userRole), [userRole]);

  const isAuthenticated = !!currentUser && !!token;

  return (
    <UserContext.Provider value={{
      currentUser,
      token,
      isAuthenticated,
      authLoading,
      userRole,
      login,
      logout,
      autoLogin,
      can,
      canTransition,
      isRole,
      // Legacy compat: keep setCurrentUser for UserSelector if used
      setCurrentUser: setCurrentUserState,
      users: [],
      loadingUsers: false,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
