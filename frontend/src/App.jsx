import { Navigate, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { UserProvider, useUser } from "./context/UserContext";
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

function AdminRoute({ children }) {
  const { isAuthenticated, authLoading, userRole } = useUser();
  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (userRole !== "Admin") return <Navigate to="/" replace />;
  return children;
}

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
      <Route path="/login"            element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"         element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password"  element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password"   element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* Visitor-accessible */}
      <Route path="/"           element={<Home />} />
      <Route path="/list"       element={<DocumentList />} />
      <Route path="/archive"    element={<Archive />} />
      <Route path="/validations" element={<Validations />} />
      <Route path="/workflow"   element={<Workflow />} />

      {/* Auth-required */}
      <Route path="/create"        element={<ProtectedRoute><CreateDocument /></ProtectedRoute>} />
      <Route path="/dashboard"     element={<Dashboard />} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/ai"            element={<AIAssistant />} />
      <Route path="/admin/users"   element={<AdminRoute><UserManagement /></AdminRoute>} />
      <Route path="/admin/logs"    element={<AdminRoute><Logs /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
