import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading || user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]" data-testid="auth-loading">
        <div className="flex flex-col items-center gap-3 text-[#76706A]">
          <div className="w-10 h-10 border-4 border-[#E8E4DF] border-t-[#8A9A7A] rounded-full animate-spin" />
          <p className="font-body">Loading your cozy space…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
