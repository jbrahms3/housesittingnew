import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      toast.success(`Welcome back, ${data.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your clients and care plans.">
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
        <FieldInput icon={Mail} label="Email" type="email" value={email} onChange={setEmail} testid="login-email" required />
        <FieldInput icon={Lock} label="Password" type="password" value={password} onChange={setPassword} testid="login-password" required />
        <button
          type="submit"
          disabled={loading}
          className="w-full pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] disabled:opacity-60 px-8 py-3.5 shadow-sm font-semibold"
          data-testid="login-submit"
        >
          {loading ? "Signing in…" : (<>Sign in <ArrowRight className="w-4 h-4 ml-2" /></>)}
        </button>
      </form>
      <p className="text-center text-sm text-[#76706A] mt-6">
        Don't have an account?{" "}
        <Link to="/register" className="text-[#8A9A7A] font-semibold hover:underline" data-testid="link-to-register">Create one</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] grain-bg flex flex-col">
      <div className="px-4 sm:px-8 py-6">
        <Link to="/" className="inline-flex items-center gap-2" data-testid="logo-link">
          <div className="w-9 h-9 rounded-full bg-[#8A9A7A] flex items-center justify-center">
            <Home className="w-5 h-5 text-white" strokeWidth={2.25} />
          </div>
          <span className="font-heading font-extrabold text-xl tracking-tight text-[#3E3A37]">HomeNest</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-16">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgba(62,58,55,0.08)] border border-[#E8E4DF]/60 fade-up" data-testid="auth-card">
          <h1 className="font-heading text-3xl font-bold text-[#3E3A37] mb-2">{title}</h1>
          <p className="text-[#76706A] mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FieldInput({ icon: Icon, label, type = "text", value, onChange, testid, required, placeholder }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#3E3A37] mb-2">{label}</span>
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 text-[#A39E98] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-white border-2 border-[#E8E4DF] rounded-xl py-3 text-[#3E3A37] focus:outline-none focus:border-[#8A9A7A] focus:ring-4 focus:ring-[#8A9A7A]/10 transition-all placeholder:text-[#A39E98] ${Icon ? "pl-10 pr-4" : "px-4"}`}
          required={required}
          placeholder={placeholder}
          data-testid={testid}
        />
      </div>
    </label>
  );
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-[#E8E4DF]" />
      <span className="text-xs uppercase tracking-widest text-[#A39E98]">or</span>
      <div className="flex-1 h-px bg-[#E8E4DF]" />
    </div>
  );
}

export function GoogleButton({ onClick, label, testid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full inline-flex items-center justify-center gap-3 bg-white border-2 border-[#E8E4DF] hover:border-[#8A9A7A] hover:bg-[#FAF9F6] text-[#3E3A37] rounded-full px-6 py-3.5 font-semibold transition-all"
      data-testid={testid}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.12A6.9 6.9 0 0 1 5.45 12c0-.73.13-1.45.39-2.12V7.04H2.18A10.99 10.99 0 0 0 1 12c0 1.77.43 3.45 1.18 4.96l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
      </svg>
      {label}
    </button>
  );
}
