import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Home } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : null;

    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const { data } = await api.post("/auth/google-session", { session_id: sessionId });
        setUser(data);
        // Clean hash
        window.history.replaceState(null, "", "/dashboard");
        toast.success(`Welcome, ${data.name}!`);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Google sign-in failed");
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]" data-testid="auth-callback">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#8A9A7A] flex items-center justify-center animate-pulse">
          <Home className="w-6 h-6 text-white" />
        </div>
        <p className="text-[#76706A] font-body">Signing you in…</p>
      </div>
    </div>
  );
}
