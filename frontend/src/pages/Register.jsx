import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { AuthShell, FieldInput } from "./Login";

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      setUser(data);
      toast.success(`Welcome, ${data.name}! Let's build your first plan.`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your sitter account" subtitle="Send clients a warm, organized care plan in minutes.">
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
        <FieldInput icon={User} label="Your name" value={name} onChange={setName} testid="register-name" required placeholder="Alex Thompson" />
        <FieldInput icon={Mail} label="Email" type="email" value={email} onChange={setEmail} testid="register-email" required />
        <FieldInput icon={Lock} label="Password" type="password" value={password} onChange={setPassword} testid="register-password" required placeholder="Min. 6 characters" />
        <button
          type="submit"
          disabled={loading}
          className="w-full pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] disabled:opacity-60 px-8 py-3.5 shadow-sm font-semibold"
          data-testid="register-submit"
        >
          {loading ? "Creating account…" : (<>Create account <ArrowRight className="w-4 h-4 ml-2" /></>)}
        </button>
      </form>
      <p className="text-center text-sm text-[#76706A] mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-[#8A9A7A] font-semibold hover:underline" data-testid="link-to-login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
