// ============================================================
// App.jsx
// RÔLE : Composant racine de l'application React.
//        Définit le routage global avec React Router et applique
//        les gardes d'accès par rôle (RBAC) :
//          PublicRoute     → /login, /register (redirige si déjà connecté)
//          ProtectedRoute  → toutes les pages authentifiées
//          AdminRoute      → /admin/users (Admin uniquement)
//          AdminOrQualite  → /admin/logs (Admin + Ing. Qualité)
//        Enveloppe l'app dans UserProvider (auth) et Toaster (notifications).
//        SessionManager est monté ici pour détecter l'inactivité globalement.
//
// Structure :
//   PublicRoute      → accessible uniquement si NON connecté (login/register)
//   ProtectedRoute   → accessible uniquement si connecté
//   AdminRoute       → accessible uniquement si rôle = Admin
//   AdminOrQualite   → accessible si Admin ou Ing. Qualité
// ============================================================
import { Navigate, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { UserProvider, useUser } from "./context/UserContext";
import SessionManager from "./components/SessionManager";
import Home           from "./pages/Home";
import Login          from "./pages/Login";
import Register        from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword  from "./pages/ResetPassword";
import CreateDocument from "./pages/CreateDocument";
import DocumentList   from "./pages/DocumentList";
import Archive        from "./pages/Archive";
import Validations    from "./pages/Validations";
import Dashboard      from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Logs          from "./pages/Logs";
import Notifications  from "./pages/Notifications";
import AIAssistant    from "./pages/AIAssistant";
import Workflow       from "./pages/Workflow";

// Bloque l'accès si non connecté — redirige vers /login.
// Affiche un spinner pendant la vérification du token stocké.
function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useUser();
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:"#0a1420" }}>
        <div className="text-center">
          <div className="mx-auto mb-4 rounded-full" style={{ width:36,height:36,border:"2.5px solid rgba(74,184,63,0.2)",borderTopColor:"#4ab83f",animation:"spin 0.7s linear infinite" }} />
          <p className="text-sm" style={{ color:"rgba(168,191,212,0.5)" }}>Vérification de la session…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Bloque l'accès si rôle ≠ Admin — redirige vers /.
function AdminRoute({ children }) {
  const { isAuthenticated, authLoading, userRole } = useUser();
  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (userRole !== "Admin") return <Navigate to="/" replace />;
  return children;
}

// Bloque l'accès si rôle ≠ Admin et ≠ Ing. Qualité.
function AdminOrQualiteRoute({ children }) {
  const { isAuthenticated, authLoading, userRole } = useUser();
  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (userRole !== "Admin" && userRole !== "Ing. Qualité") return <Navigate to="/" replace />;
  return children;
}

// Redirige vers / si l'utilisateur est déjà connecté (empêche d'accéder au login).
function PublicRoute({ children }) {
  const { isAuthenticated, authLoading } = useUser();
  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
    <SessionManager />
    <Routes>
      {/* Public */}
      <Route path="/login"            element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"         element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password"  element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password"   element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* Visitor-accessible */}
      <Route path="/"           element={<Home />} />
      <Route path="/archive"    element={<Archive />} />

      {/* All roles including Visiteur — pages handle their own filtering */}
      <Route path="/list"        element={<DocumentList />} />
      <Route path="/validations" element={<Validations />} />
      <Route path="/workflow"    element={<Workflow />} />
      <Route path="/dashboard"   element={<Dashboard />} />
      <Route path="/ai"          element={<AIAssistant />} />

      {/* Auth-required */}
      <Route path="/create"        element={<ProtectedRoute><CreateDocument /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/admin/users"   element={<AdminRoute><UserManagement /></AdminRoute>} />
      <Route path="/admin/logs"    element={<AdminOrQualiteRoute><Logs /></AdminOrQualiteRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Toaster position="bottom-right" theme="dark" richColors toastOptions={{ duration:4000 }} />
      <AppRoutes />
    </UserProvider>
  );
}
