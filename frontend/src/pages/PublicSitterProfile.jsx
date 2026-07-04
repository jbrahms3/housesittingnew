import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Home, MapPin, Phone, Languages, Award, BadgeCheck, Calendar as CalIcon, User as UserIcon, ShieldCheck } from "lucide-react";
import { Calendar } from "../components/ui/calendar";
import { api, formatApiErrorDetail } from "../lib/api";

function parseISODate(iso) {
  if (!iso || typeof iso !== "string") return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export default function PublicSitterProfile() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: res } = await api.get(`/public/sitter/${userId}`);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(formatApiErrorDetail(err.response?.data?.detail) || "Sitter not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const bookedDates = useMemo(
    () => (data?.booked_dates || []).map(parseISODate).filter(Boolean),
    [data]
  );
  const defaultMonth = bookedDates[0] || new Date();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="w-10 h-10 border-4 border-[#E8E4DF] border-t-[#8A9A7A] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] px-6 text-center">
        <h1 className="font-heading text-3xl text-[#3E3A37] mb-2">Sitter not found</h1>
        <p className="text-[#76706A] mb-6">This profile link doesn't exist or was removed.</p>
        <Link to="/" className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] px-6 py-3">Back to HomeNest</Link>
      </div>
    );
  }

  const p = data.profile || {};

  return (
    <div className="min-h-screen bg-[#FAF9F6] grain-bg" data-testid="public-sitter-profile">
      <header className="sticky top-0 z-40 w-full bg-[#FAF9F6]/92 backdrop-blur-md border-b border-[#E8E4DF] py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#8A9A7A] flex items-center justify-center">
              <Home className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-extrabold tracking-tight text-[#3E3A37]">HomeNest</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-10 md:py-14 space-y-6">
        <section className="bg-white rounded-3xl p-7 md:p-10 border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)] text-center fade-up">
          {p.picture ? (
            <img
              src={p.picture}
              alt={p.name || "Sitter"}
              className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-white shadow-[0_8px_30px_rgba(62,58,55,0.12)]"
              data-testid="sitter-picture"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-[#F0EBE1] flex items-center justify-center mx-auto border-4 border-white shadow-[0_8px_30px_rgba(62,58,55,0.12)]" data-testid="sitter-picture-fallback">
              <UserIcon className="w-12 h-12 text-[#8A9A7A]" />
            </div>
          )}
          <div className="inline-flex items-center gap-2 bg-[#F0EBE1] text-[#76706A] text-xs font-semibold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full mt-5 mb-3">
            House-sitter
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl tracking-tight text-[#3E3A37] mb-2" data-testid="sitter-name">
            {p.name || "House-sitter"}
          </h1>
          {Number(p.verified_sits) > 0 && (
            <div
              className="inline-flex items-center gap-2 bg-[#E8F0E1] border border-[#8A9A7A]/30 text-[#3E3A37] px-3 py-1.5 rounded-full font-semibold text-sm mb-3"
              data-testid="profile-verified-sits"
            >
              <ShieldCheck className="w-4 h-4 text-[#8A9A7A]" />
              {p.verified_sits} verified sit{p.verified_sits === 1 ? "" : "s"}
            </div>
          )}
          {p.bio && <p className="text-[#3E3A37] text-lg leading-relaxed max-w-xl mx-auto" data-testid="sitter-bio">{p.bio}</p>}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {p.location && <MetaPill icon={MapPin} label={p.location} testid="sitter-location" />}
            {p.phone && <MetaPill icon={Phone} label={p.phone} testid="sitter-phone" />}
            {p.languages && <MetaPill icon={Languages} label={p.languages} testid="sitter-languages" />}
            {p.years_experience > 0 && <MetaPill icon={Award} label={`${p.years_experience} yrs experience`} testid="sitter-experience" />}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-7 md:p-10 border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)] fade-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#F0EBE1] flex items-center justify-center">
              <CalIcon className="w-5 h-5 text-[#8A9A7A]" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-[#3E3A37]">Availability</h2>
              <p className="text-sm text-[#76706A]">Days marked in green are already booked.</p>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Calendar
              mode="single"
              selected={null}
              onSelect={() => {}}
              defaultMonth={defaultMonth}
              numberOfMonths={1}
              modifiers={{ booked: bookedDates }}
              modifiersClassNames={{
                booked: "!bg-[#8A9A7A] !text-white hover:!bg-[#788769] focus:!bg-[#788769] !rounded-md !opacity-100",
              }}
              className="rounded-2xl border border-[#E8E4DF] bg-[#FAF9F6]/60"
              data-testid="sitter-calendar"
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-[#76706A]" data-testid="calendar-legend">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#8A9A7A]" /> Booked
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded border border-[#E8E4DF] bg-white" /> Available
            </span>
            <span className="text-[#A39E98]" data-testid="booked-count">{bookedDates.length} day{bookedDates.length === 1 ? "" : "s"} booked</span>
          </div>
        </section>

        {p.certifications && (
          <section className="bg-white rounded-3xl p-7 md:p-10 border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)] fade-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F0EBE1] flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-[#8A9A7A]" strokeWidth={2.25} />
              </div>
              <h2 className="font-heading text-2xl font-bold text-[#3E3A37]">Certifications & references</h2>
            </div>
            <p className="text-[#3E3A37] whitespace-pre-wrap leading-relaxed" data-testid="sitter-certifications">{p.certifications}</p>
          </section>
        )}
      </main>
    </div>
  );
}

function MetaPill({ icon: Icon, label, testid }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[#3E3A37] bg-[#F0EBE1] px-3 py-1.5 rounded-full" data-testid={testid}>
      <Icon className="w-3.5 h-3.5 text-[#8A9A7A]" /> {label}
    </span>
  );
}
