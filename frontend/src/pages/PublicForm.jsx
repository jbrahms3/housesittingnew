import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Home, ArrowLeft, ArrowRight, CheckCircle2, Send, Heart, Printer, ClipboardCheck,
  User, MapPin, Phone, Languages, Award, BadgeCheck, Briefcase, ShieldCheck, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";
import CarePlanView from "../components/CarePlanView";
import PriceBadge from "../components/PriceBadge";
import { calculateTotal, formatMoney, hasAnyPricing } from "../lib/pricing";
import {
  emptySubmission, ProgressBar, StepDates, StepStay, StepPets, StepCare, StepTasks, StepContacts,
} from "../components/FormSteps";

export default function PublicForm() {
  const { shareToken } = useParams();
  const [form, setForm] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/public/forms/${shareToken}`);
        setForm(data);
      } catch (e) {
        setErr(formatApiErrorDetail(e.response?.data?.detail) || "Plan not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="w-10 h-10 border-4 border-[#E8E4DF] border-t-[#8A9A7A] rounded-full animate-spin" />
      </div>
    );
  }

  if (err || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-4">
        <div className="bg-white rounded-3xl p-8 md:p-10 max-w-md w-full text-center border border-[#E8E4DF]">
          <h1 className="font-heading text-2xl font-bold text-[#3E3A37] mb-2">Can't find this form</h1>
          <p className="text-[#76706A] mb-5">{err || "The link may have expired or been removed."}</p>
          <Link to="/" className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] px-6 py-3">Back home</Link>
        </div>
      </div>
    );
  }

  if (form.status === "completed") {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <PublicHeader printable />
        <main className="max-w-3xl mx-auto px-4 sm:px-8 py-10 md:py-16">
          <CarePlanView form={form} />
          <div className="text-center text-sm text-[#A39E98] pt-6 pb-2">Made with warmth on HomeNest</div>
        </main>
        <PriceBadge form={form} pricing={form.pricing} sitterName={form.sitter_name} />
      </div>
    );
  }

  return <FillableFlow shareToken={shareToken} form={form} />;
}

function PublicHeader({ printable }) {
  return (
    <header className="no-print sticky top-0 z-40 w-full bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E8E4DF] py-4">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#8A9A7A] flex items-center justify-center">
            <Home className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-extrabold text-lg tracking-tight text-[#3E3A37]">HomeNest</span>
        </Link>
        {printable && (
          <button
            onClick={() => window.print()}
            className="pill-btn border-2 border-[#E8E4DF] text-[#3E3A37] hover:border-[#8A9A7A] hover:bg-white px-5 py-2"
            data-testid="print-button"
          >
            <Printer className="w-4 h-4 mr-2" /> Print
          </button>
        )}
      </div>
    </header>
  );
}

function FillableFlow({ shareToken, form: initialForm }) {
  const storageKey = `homenest:fill:${shareToken}`;

  // Lazy initial state from localStorage — survives refreshes mid-fill.
  const [step, setStep] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      return Number.isInteger(saved?.step) ? saved.step : 0;
    } catch { return 0; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [fill, setFill] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved?.fill && typeof saved.fill === "object") {
        return { ...emptySubmission(), ...saved.fill };
      }
    } catch { /* ignore */ }
    return { ...emptySubmission() };
  });
  const startedRef = useRef(false);

  // Persist progress on any change. Skipped while submitting/submitted
  // so we don't immediately rewrite after the cleanup below.
  useEffect(() => {
    if (submitted || submitting) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ step, fill }));
    } catch { /* ignore quota errors */ }
  }, [storageKey, step, fill, submitted, submitting]);

  const update = (patch) => setFill((prev) => ({ ...prev, ...patch }));

  const canNext = () => {
    if (step === 1) return !!fill.date_start && !!fill.home_address?.trim();
    if (step === 3) return fill.pets.every((p) => p.name?.trim());
    if (step === 6) {
      const hasOwner = !!fill.owner_name?.trim() && !!fill.owner_phone?.trim();
      const hasEmergency = (fill.emergency_contacts || []).some(
        (c) => c.name?.trim() && c.phone?.trim()
      );
      const hasWaterShutoff = !!fill.water_shutoff?.trim();
      let hasVet = true;
      if ((fill.pets || []).length > 0) {
        if (fill.same_vet_for_all) {
          hasVet = !!fill.vet_shared?.name?.trim() && !!fill.vet_shared?.phone?.trim();
        } else {
          hasVet = fill.pets.every((p) => p.vet?.name?.trim() && p.vet?.phone?.trim());
        }
      }
      return hasOwner && hasEmergency && hasWaterShutoff && hasVet;
    }
    return true;
  };

  const start = () => {
    startedRef.current = true;
    setStep(1);
  };

  const submit = async () => {
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await api.post(`/public/forms/${shareToken}/submit`, fill);
      // Clear saved progress so a future visit shows the read-only completed view.
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      toast.success("Thank you! Your care plan is saved.");
      setSubmitted(true);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <PublicHeader />
        <main className="max-w-xl mx-auto px-4 sm:px-8 py-20 text-center fade-up" data-testid="thank-you-view">
          <div className="w-20 h-20 rounded-full bg-[#8A9A7A] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl tracking-tight text-[#3E3A37] mb-4">Thank you!</h1>
          <p className="text-[#76706A] text-lg max-w-md mx-auto mb-8">
            {initialForm.sitter_name || "Your sitter"} now has everything they need to care for your home.
          </p>
          <div className="inline-flex items-center gap-2 text-[#C58B71]">
            <Heart className="w-5 h-5" /> <span className="font-heading font-semibold">Enjoy your trip!</span>
          </div>
        </main>
      </div>
    );
  }

  // Intro screen
  if (step === 0) {
    const sitter = initialForm.sitter_profile || {};
    const sitterName = initialForm.sitter_name || sitter.name || "Your sitter";
    return (
      <div className="min-h-screen bg-[#FAF9F6] grain-bg">
        <PublicHeader />
        <main className="max-w-2xl mx-auto px-4 sm:px-8 py-12 md:py-20 fade-up" data-testid="public-intro">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgba(62,58,55,0.06)] border border-[#E8E4DF]/60 text-center">
            {sitter.picture ? (
              <img
                src={sitter.picture}
                alt={sitterName}
                className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-white shadow-[0_8px_30px_rgba(62,58,55,0.12)]"
                data-testid="sitter-picture"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#F0EBE1] flex items-center justify-center mx-auto border-4 border-white shadow-[0_8px_30px_rgba(62,58,55,0.12)]" data-testid="sitter-picture-fallback">
                <User className="w-12 h-12 text-[#8A9A7A]" />
              </div>
            )}
            <div className="inline-flex items-center gap-2 bg-[#F0EBE1] text-[#76706A] text-xs font-semibold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full mt-5 mb-4">
              From your house-sitter
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl tracking-tight text-[#3E3A37] mb-3" data-testid="public-title">
              Hi {initialForm.client_name?.split(" ")[0] || "there"} 👋
            </h1>
            {Number(sitter.verified_sits) > 0 && (
              <div
                className="inline-flex items-center gap-2 bg-[#E8F0E1] border border-[#8A9A7A]/30 text-[#3E3A37] px-3 py-1.5 rounded-full font-semibold text-sm mb-4"
                data-testid="intro-verified-sits"
              >
                <ShieldCheck className="w-4 h-4 text-[#8A9A7A]" />
                {sitter.verified_sits} verified sit{sitter.verified_sits === 1 ? "" : "s"}
              </div>
            )}
            <p className="text-[#3E3A37] text-lg leading-relaxed mb-3">
              I'm <span className="font-heading font-bold">{sitterName}</span>{sitter.location ? `, based in ${sitter.location}` : ""}.
              I'd love to take wonderful care of your home while you're away — could you fill out this short care plan so I have everything I need?
            </p>
            <p className="text-[#76706A] mb-8">It only takes a few minutes — six quick steps.</p>
            <button
              onClick={start}
              className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] px-8 py-4 shadow-sm text-base font-semibold"
              data-testid="start-fill-button"
            >
              Start care plan <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>

          <SitterAboutCard sitter={sitter} sitterName={sitterName} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-28 grain-bg" data-testid="public-fill-flow">
      <PublicHeader />
      <ProgressBar step={Math.min(step, 6)} />
      <main className="max-w-3xl mx-auto px-4 sm:px-8 pt-10">
        <div key={step} className="fade-up">
          {step === 1 && <StepDates form={fill} update={update} sitterBookedDates={initialForm.sitter_booked_dates || []} />}
          {step === 2 && <StepStay form={fill} update={update} />}
          {step === 3 && <StepPets form={fill} update={update} />}
          {step === 4 && <StepCare form={fill} update={update} />}
          {step === 5 && <StepTasks form={fill} update={update} pricing={initialForm.pricing} />}
          {step === 6 && <StepContacts form={fill} update={update} pricing={initialForm.pricing} />}
          {step === 7 && (
            <ReviewStep
              fill={fill}
              sitterName={initialForm.sitter_name}
              clientName={initialForm.client_name}
              confirmed={confirmed}
              onConfirm={setConfirmed}
              pricing={initialForm.pricing}
            />
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E8E4DF] py-4 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="pill-btn border-2 border-[#E8E4DF] text-[#3E3A37] hover:border-[#8A9A7A] hover:bg-[#FAF9F6] px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="prev-step-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
          <div className="text-sm text-[#76706A] font-medium hidden sm:block">
            {step === 7 ? "Review" : `Step ${step} of 6`}
          </div>
          {step < 6 && (
            <button
              onClick={() => setStep((s) => Math.min(6, s + 1))}
              disabled={!canNext()}
              className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] px-8 py-3 disabled:opacity-40 shadow-sm font-semibold"
              data-testid="next-step-button"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
          {step === 6 && (
            <button
              onClick={() => setStep(7)}
              disabled={!canNext()}
              className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] px-8 py-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm font-semibold"
              data-testid="review-button"
            >
              Review <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
          {step === 7 && (
            <button
              onClick={submit}
              disabled={submitting || !confirmed}
              className="pill-btn bg-[#C58B71] text-white hover:bg-[#B37A60] px-8 py-3 shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              <Send className="w-4 h-4 mr-2" /> {submitting ? "Saving…" : "Submit care plan"}
            </button>
          )}
        </div>
      </nav>

      {step !== 7 && (
        <PriceBadge form={fill} pricing={initialForm.pricing} sitterName={initialForm.sitter_name} />
      )}
    </div>
  );
}

function ReviewStep({ fill, sitterName, clientName, confirmed, onConfirm, pricing }) {
  // Build a form-like object so CarePlanView can render
  const draft = {
    title: `Care plan for ${clientName || "the home"}`,
    ...fill,
    client_name: clientName,
  };
  return (
    <div data-testid="review-step">
      <div className="mb-8 text-center">
        <div className="text-[#C58B71] font-semibold text-xs tracking-[0.2em] uppercase mb-3">Review</div>
        <h2 className="font-heading text-3xl sm:text-4xl tracking-tight text-[#3E3A37] mb-3">Take a quick look</h2>
        <p className="text-[#76706A] max-w-xl mx-auto">
          Make sure everything looks right for {sitterName || "your sitter"}. Use the Back button to fix anything.
        </p>
      </div>

      <CarePlanView form={draft} />

      <TotalCard form={fill} pricing={pricing} sitterName={sitterName} />

      <div className="mt-6 bg-white rounded-3xl p-6 md:p-8 border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)]">
        <label className="flex items-start gap-3 cursor-pointer select-none" data-testid="confirm-correct-label">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => onConfirm(e.target.checked)}
            className="mt-1 w-5 h-5 accent-[#8A9A7A] rounded border-2 border-[#E8E4DF] flex-shrink-0 cursor-pointer"
            data-testid="confirm-correct-checkbox"
          />
          <span className="text-[#3E3A37]">
            <span className="font-heading font-bold flex items-center gap-2 mb-1">
              <ClipboardCheck className="w-4 h-4 text-[#8A9A7A]" />
              I've reviewed everything and confirm it's correct.
            </span>
            <span className="text-sm text-[#76706A] block">
              Once you submit, {sitterName || "your sitter"} will use this care plan for your home and pets.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

function TotalCard({ form, pricing, sitterName }) {
  if (!hasAnyPricing(pricing)) return null;
  const { total, lines, currency, days } = calculateTotal(form, pricing);
  if (lines.length === 0) return null;
  return (
    <section
      className="mt-6 bg-white rounded-3xl border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)] overflow-hidden fade-up"
      data-testid="review-total-card"
    >
      <div className="bg-[#8A9A7A] text-white px-6 md:px-8 py-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <Receipt className="w-5 h-5 text-white" strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/75 font-semibold">
            Estimated total{days > 0 ? ` · ${days} day${days > 1 ? "s" : ""}` : ""}
          </div>
          <div
            className="font-heading text-3xl md:text-4xl font-extrabold leading-tight !text-white"
            style={{ color: "#FFFFFF" }}
            data-testid="review-total-amount"
          >
            {formatMoney(total, currency)}
          </div>
        </div>
      </div>
      <ul className="divide-y divide-[#F4F3ED]" data-testid="review-total-breakdown">
        {lines.map((l) => (
          <li key={l.id} className="px-6 md:px-8 py-3 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#3E3A37]">{l.label}</div>
              {l.detail && <div className="text-xs text-[#76706A] mt-0.5">{l.detail}</div>}
            </div>
            <div
              className={`text-sm font-heading font-bold whitespace-nowrap ${
                l.amount < 0 ? "text-[#8A9A7A]" : "text-[#3E3A37]"
              }`}
            >
              {l.amount < 0 ? "−" : ""}
              {formatMoney(Math.abs(l.amount), currency)}
            </div>
          </li>
        ))}
      </ul>
      <p className="px-6 md:px-8 py-3 text-xs text-[#A39E98] bg-[#FAF9F6] border-t border-[#F4F3ED]">
        Estimate by {sitterName || "your sitter"} — final total may vary based on actual time and chores performed.
      </p>
    </section>
  );
}

function SitterAboutCard({ sitter, sitterName }) {
  const hasContent =
    sitter?.bio || sitter?.location || sitter?.phone || sitter?.languages ||
    Number(sitter?.years_experience) > 0 || (sitter?.services || []).length > 0 ||
    sitter?.certifications;
  if (!hasContent) return null;

  const stats = [
    Number(sitter.years_experience) > 0 && {
      icon: Award,
      label: `${sitter.years_experience} ${sitter.years_experience === 1 ? "year" : "years"} experience`,
    },
    sitter.location && { icon: MapPin, label: sitter.location },
    sitter.languages && { icon: Languages, label: sitter.languages },
    sitter.phone && { icon: Phone, label: sitter.phone },
  ].filter(Boolean);

  return (
    <section className="bg-white rounded-3xl p-7 md:p-9 border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)] mt-6 fade-up text-left" data-testid="sitter-about-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-[#F0EBE1] flex items-center justify-center">
          <User className="w-5 h-5 text-[#8A9A7A]" strokeWidth={2.25} />
        </div>
        <h2 className="font-heading text-xl font-bold text-[#3E3A37]">About {sitterName}</h2>
      </div>

      {sitter.bio && (
        <p className="text-[#3E3A37] leading-relaxed whitespace-pre-wrap mb-5" data-testid="sitter-bio">{sitter.bio}</p>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-2 bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2.5">
                <Icon className="w-4 h-4 text-[#8A9A7A] flex-shrink-0" />
                <span className="text-sm text-[#3E3A37] truncate">{s.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {(sitter.services || []).length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#76706A] mb-2">
            <Briefcase className="w-4 h-4 text-[#8A9A7A]" /> Services
          </div>
          <div className="flex flex-wrap gap-2">
            {sitter.services.map((s, i) => (
              <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-[#F0EBE1] text-[#3E3A37] border border-[#E8E4DF]">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {sitter.certifications && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#76706A] mb-2">
            <BadgeCheck className="w-4 h-4 text-[#8A9A7A]" /> Certifications & references
          </div>
          <p className="text-[#3E3A37] leading-relaxed whitespace-pre-wrap">{sitter.certifications}</p>
        </div>
      )}
    </section>
  );
}

