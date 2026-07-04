import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "sonner";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewForm from "./pages/NewForm";
import SitterFormView from "./pages/SitterFormView";
import PublicForm from "./pages/PublicForm";
import PublicSitterProfile from "./pages/PublicSitterProfile";
import AuthCallback from "./pages/AuthCallback";
import PricingSettings from "./pages/PricingSettings";
import ProfileSettings from "./pages/ProfileSettings";
import "./App.css";

function Router() {
  const loc = useLocation();
  if (loc.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/share/:shareToken" element={<PublicForm />} />
      <Route path="/sitter/:userId" element={<PublicSitterProfile />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/new"
        element={
          <ProtectedRoute>
            <NewForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:formId"
        element={
          <ProtectedRoute>
            <SitterFormView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/pricing"
        element={
          <ProtectedRoute>
            <PricingSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/profile"
        element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  // BetaPool milestone: tester simply visits the site.
  useEffect(() => {
    const fire = () => {
      try { window.BetaPool?.complete?.("visited_site"); } catch (e) { /* no-op */ }
    };
    fire();
    // Also try a short delay in case the SDK loads after React mounts.
    const t = setTimeout(fire, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Router />
        <Toaster position="top-center" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}
