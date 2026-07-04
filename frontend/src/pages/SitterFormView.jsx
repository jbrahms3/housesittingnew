import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Home, ArrowLeft, Share2, Copy, Mail, Send, Clock, CheckCircle2, Trash2, Printer, Calendar as CalIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";
import CarePlanView from "../components/CarePlanView";
import { calculateTotal, formatMoney, hasAnyPricing } from "../lib/pricing";

export default function SitterFormView() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: formData }, { data: pricingData }] = await Promise.all([
          api.get(`/forms/${formId}`),
          api.get(`/me/pricing`).catch(() => ({ data: null })),
        ]);
        if (cancelled) return;
        setForm(formData);
        setPricing(pricingData);
      } catch (err) {
        toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not load form");
        navigate("/dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [formId, navigate, reloadTick]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this form? This cannot be undone.")) return;
    try {
      await api.delete(`/forms/${formId}`);
      toast.success("Form deleted");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  const handleConfirm = async () => {
    try {
      const { data } = await api.post(`/forms/${formId}/confirm`);
      setForm(data);
      toast.success("Care plan confirmed — these dates now show on your public calendar.");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not confirm");
    }
  };

  if (loading || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="w-10 h-10 border-4 border-[#E8E4DF] border-t-[#8A9A7A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] grain-bg" data-testid="sitter-form-view">
      <header className="no-print sticky top-0 z-40 w-full bg-[#FAF9F6]/92 backdrop-blur-md border-b border-[#E8E4DF] py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            {form.status === "completed" && (
              <button
                onClick={() => window.print()}
                className="pill-btn border-2 border-[#E8E4DF] text-[#3E3A37] hover:border-[#8A9A7A] hover:bg-white px-4 py-2"
                data-testid="print-button"
              >
                <Printer className="w-4 h-4 mr-2" /> Print
              </button>
            )}
            <button
              onClick={handleDelete}
              className="pill-btn text-[#C58B71] hover:bg-[#F5E6E8] px-3 py-2"
              data-testid="delete-form"
              title="Delete form"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8 md:py-12">
        {form.status === "pending" ? (
          <PendingView form={form} onRefresh={() => setReloadTick((t) => t + 1)} />
        ) : (
          <>
            <CompletedBanner form={form} onConfirm={handleConfirm} />
            {hasAnyPricing(pricing) && <PriceSummary form={form} pricing={pricing} />}
            <CarePlanView form={form} />
          </>
        )}
      </main>
    </div>
  );
}

function PendingView({ form, onRefresh }) {
  const link = `${window.location.origin}/share/${form.share_token}`;
  const [recipient, setRecipient] = useState(form.client_email || "");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    } catch {
      toast.error("Copy failed");
    }
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post(`/forms/${form.form_id}/send-email`, {
        recipient_email: recipient || form.client_email,
        personal_note: note || null,
      });
      toast.success(`Email sent to ${recipient || form.client_email}`);
      setNote("");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <section className="bg-white rounded-3xl p-7 md:p-10 border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)]">
        <div className="inline-flex items-center gap-2 bg-[#F0EBE1] text-[#76706A] text-xs font-semibold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full mb-4">
          <Clock className="w-3.5 h-3.5 text-[#C58B71]" /> Waiting for client
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-[#3E3A37] mb-2" data-testid="pending-title">{form.title}</h1>
        <p className="text-[#76706A] text-lg">
          For <span className="font-semibold text-[#3E3A37]">{form.client_name || form.client_email}</span>
        </p>
        <p className="text-[#76706A] mt-4 max-w-xl">
          Share the link below so {form.client_name?.split(" ")[0] || "your client"} can fill out the care plan.
          Once they submit, you'll see everything here.
        </p>
      </section>

      <section className="bg-white rounded-3xl p-7 md:p-10 border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#8A9A7A] flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#3E3A37]">Share the link</h2>
        </div>
        <p className="text-sm text-[#76706A] mb-3">
          This link is private — only people you send it to can open it.
        </p>
        <label className="block text-sm font-semibold text-[#3E3A37] mb-2">Form link</label>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={link}
            className="flex-1 bg-[#FAF9F6] border-2 border-[#E8E4DF] rounded-xl px-3 py-2 text-[#3E3A37] text-sm"
            data-testid="share-link-input"
          />
          <button onClick={copy} className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] px-4 py-2" data-testid="copy-link-button">
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <Link to="/settings/profile" className="text-xs text-[#8A9A7A] font-semibold hover:underline mt-3 inline-block" data-testid="edit-profile-link">
          Update your profile (clients see your photo & bio when they open this link) →
        </Link>
      </section>

      <section className="bg-white rounded-3xl p-7 md:p-10 border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#C58B71] flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#3E3A37]">Email it to your client</h2>
        </div>

        <form onSubmit={sendEmail} className="space-y-3" data-testid="email-form">
          <label className="block">
            <span className="block text-sm font-semibold text-[#3E3A37] mb-2">Client's email</span>
            <input
              type="email"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="client@example.com"
              className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2 focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10"
              data-testid="sitter-email-input"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-[#3E3A37] mb-2">Personal note (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={`Thanks so much for trusting me with ${form.client_name?.split(" ")[0] || "your home"}! Let me know if anything needs tweaking.`}
              className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2 focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10"
              data-testid="personal-note-input"
            />
          </label>
          <div className="flex items-center justify-between gap-2 pt-2">
            <button type="button" onClick={onRefresh} className="pill-btn text-[#76706A] hover:bg-[#F4F3ED] px-5 py-2.5" data-testid="refresh-status">
              Check for submission
            </button>
            <button
              type="submit"
              disabled={sending}
              className="pill-btn bg-[#C58B71] text-white hover:bg-[#B37A60] disabled:opacity-60 px-6 py-2.5 font-semibold"
              data-testid="send-email-button"
            >
              <Send className="w-4 h-4 mr-2" /> {sending ? "Sending…" : "Send email"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CompletedBanner({ form, onConfirm }) {
  const completed = form.completed_at ? new Date(form.completed_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;
  const confirmed = form.confirmed_at ? new Date(form.confirmed_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;

  if (form.sitter_confirmed) {
    return (
      <div className="bg-[#E8F0E1] border border-[#8A9A7A]/30 rounded-2xl p-4 mb-6 flex items-center gap-3" data-testid="confirmed-banner">
        <div className="w-10 h-10 rounded-full bg-[#8A9A7A] flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-heading font-bold text-[#3E3A37]">Confirmed{confirmed ? ` on ${confirmed}` : ""}</div>
          <div className="text-sm text-[#76706A] flex items-center gap-1.5">
            <CalIcon className="w-3.5 h-3.5" /> These dates now show on your public availability calendar.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F0EBE1] border border-[#C58B71]/30 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 no-print" data-testid="awaiting-confirmation-banner">
      <div className="w-10 h-10 rounded-full bg-[#C58B71] flex items-center justify-center flex-shrink-0">
        <Clock className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <div className="font-heading font-bold text-[#3E3A37]">Submitted{completed ? ` on ${completed}` : ""} — please confirm</div>
        <div className="text-sm text-[#76706A]">
          {form.client_name || form.client_email} filled out the care plan. Confirm to lock these dates onto your public calendar.
        </div>
      </div>
      <button
        onClick={onConfirm}
        className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] px-6 py-2.5 font-semibold whitespace-nowrap self-start sm:self-auto"
        data-testid="confirm-care-plan-button"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm care plan
      </button>
    </div>
  );
}

function PriceSummary({ form, pricing }) {
  const { total, lines, currency } = calculateTotal(form, pricing);
  if (lines.length === 0) return null;
  return (
    <section className="bg-white rounded-3xl p-6 md:p-8 border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)] mb-6 print-card" data-testid="price-summary">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-[#A39E98] font-semibold">Visit total</div>
          <div className="font-heading text-3xl font-extrabold text-[#3E3A37]" data-testid="price-summary-total">{formatMoney(total, currency)}</div>
        </div>
        <a
          href="/settings/pricing"
          className="pill-btn border-2 border-[#E8E4DF] text-[#3E3A37] hover:border-[#8A9A7A] hover:bg-[#FAF9F6] px-4 py-2 text-sm no-print"
          data-testid="edit-pricing-link"
        >
          Edit pricing
        </a>
      </div>
      <ul className="divide-y divide-[#F4F3ED]">
        {lines.map((l) => (
          <li key={l.id} className="py-2.5 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#3E3A37]">{l.label}</div>
              {l.detail && <div className="text-xs text-[#76706A]">{l.detail}</div>}
            </div>
            <div className="text-sm font-heading font-bold text-[#3E3A37] whitespace-nowrap">{formatMoney(l.amount, currency)}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
