import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Mail, User as UserIcon, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";

export default function NewForm() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/forms", {
        title: title.trim() || (clientName ? `${clientName.split(" ")[0]}'s care plan` : "House-sitting intake"),
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
      });
      toast.success("Form created! Share the link with your client.");
      navigate(`/forms/${data.form_id}`);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not create form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] grain-bg" data-testid="new-form-page">
      <header className="sticky top-0 z-40 w-full bg-[#FAF9F6]/92 backdrop-blur-md border-b border-[#E8E4DF] py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-[#76706A] hover:text-[#3E3A37]" data-testid="back-to-dashboard">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#8A9A7A] flex items-center justify-center">
              <Home className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-extrabold tracking-tight text-[#3E3A37]">HomeNest</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-8 py-10 md:py-16">
        <div className="text-center mb-10 fade-up">
          <div className="text-[#C58B71] font-semibold text-xs tracking-[0.2em] uppercase mb-3">New client form</div>
          <h1 className="font-heading text-4xl sm:text-5xl tracking-tight text-[#3E3A37] mb-3">Create a care plan for your client</h1>
          <p className="text-[#76706A] text-lg max-w-xl mx-auto">
            Start a new intake — we'll generate a cozy link you can send to your client so they can fill in the details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_4px_20px_rgba(62,58,55,0.04)] border border-[#E8E4DF]/60 fade-up space-y-5" data-testid="new-form-form">
          <Field
            icon={FileText}
            label="Form title"
            value={title}
            onChange={setTitle}
            placeholder="e.g. Smith family · March trip"
            testid="new-form-title"
          />
          <Field
            icon={UserIcon}
            label="Your client's name"
            value={clientName}
            onChange={setClientName}
            placeholder="e.g. Sarah Smith"
            testid="new-form-client-name"
            required
          />
          <Field
            icon={Mail}
            label="Your client's email (optional)"
            value={clientEmail}
            onChange={setClientEmail}
            type="email"
            placeholder="sarah@example.com — leave blank if you'd rather just share the link"
            testid="new-form-client-email"
          />
          <div className="pt-4 flex justify-end gap-3">
            <Link to="/dashboard" className="pill-btn text-[#76706A] hover:bg-[#F4F3ED] px-6 py-3" data-testid="cancel-new-form">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] disabled:opacity-60 px-8 py-3 shadow-sm font-semibold"
              data-testid="create-form-submit"
            >
              {saving ? "Creating…" : (<>Create & share <ArrowRight className="w-4 h-4 ml-2" /></>)}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, type = "text", placeholder, required, testid }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#3E3A37] mb-2">{label}</span>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-[#A39E98] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-white border-2 border-[#E8E4DF] rounded-xl py-3 text-[#3E3A37] focus:outline-none focus:border-[#8A9A7A] focus:ring-4 focus:ring-[#8A9A7A]/10 transition-all placeholder:text-[#A39E98] ${Icon ? "pl-10 pr-4" : "px-4"}`}
          data-testid={testid}
        />
      </div>
    </label>
  );
}
