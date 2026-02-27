import { Navigate, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { UserProvider, useUser } from "./context/UserContext";
import Home           from "./pages/Home";
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import CreateDocument from "./pages/CreateDocument";
import DocumentList   from "./pages/DocumentList";
import Archive        from "./pages/Archive";
import Validations    from "./pages/Validations";
import Dashboard        from "./pages/Dashboard";
import UserManagement  from "./pages/UserManagement";
import Notifications   from "./pages/Notifications";
import AIAssistant     from "./pages/AIAssistant";

// ── Garde toutes les routes protégées ────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useUser();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"
            style={{ borderWidth: 3, borderStyle: "solid", borderColor: "#e5e7eb", borderTopColor: "#ec4899" }} />
          <p className="text-gray-400 text-sm">Vérification de la session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ── Routes publiques (login seulement) ───────────────────────
function PublicRoute({ children }) {
  const { isAuthenticated, authLoading } = useUser();
  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />

      {/* Protected */}
      <Route path="/" element={
        <ProtectedRoute><Home /></ProtectedRoute>
      } />
      <Route path="/create" element={
        <ProtectedRoute><CreateDocument /></ProtectedRoute>
      } />
      <Route path="/list" element={
        <ProtectedRoute><DocumentList /></ProtectedRoute>
      } />
      <Route path="/archive" element={
        <ProtectedRoute><Archive /></ProtectedRoute>
      } />
      <Route path="/validations" element={
        <ProtectedRoute><Validations /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute><UserManagement /></ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute><Notifications /></ProtectedRoute>
      } />
      <Route path="/ai" element={
        <ProtectedRoute><AIAssistant /></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        toastOptions={{ duration: 4000 }}
      />
      <AppRoutes />
    </UserProvider>
  );
}
