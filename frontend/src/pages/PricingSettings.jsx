import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Save, BadgeDollarSign, Info, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";
import { DEFAULT_PRICING, CURRENCIES, formatMoney, CHORE_LABELS, choreFee, petDailyRate } from "../lib/pricing";

const SPECIES_PRESETS = [
  { type: "dog", label: "Dog" },
  { type: "cat", label: "Cat" },
  { type: "bird", label: "Bird" },
  { type: "fish", label: "Fish" },
  { type: "rabbit", label: "Rabbit" },
  { type: "reptile", label: "Reptile" },
  { type: "other", label: "Other" },
];

export default function PricingSettings() {
  const navigate = useNavigate();
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/me/pricing");
        setPricing({ ...DEFAULT_PRICING, ...data });
      } catch (err) {
        toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not load pricing");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = (key, value) => setPricing((prev) => ({ ...prev, [key]: value }));

  const setSpeciesPrice = (type, value) =>
    setPricing((prev) => ({
      ...prev,
      species_pricing: { ...(prev.species_pricing || {}), [type]: value },
    }));
  const setSpeciesType = (oldType, newType) =>
    setPricing((prev) => {
      const map = { ...(prev.species_pricing || {}) };
      const val = map[oldType];
      delete map[oldType];
      if (newType) map[newType] = val ?? 0;
      return { ...prev, species_pricing: map };
    });
  const removeSpecies = (type) =>
    setPricing((prev) => {
      const map = { ...(prev.species_pricing || {}) };
      delete map[type];
      return { ...prev, species_pricing: map };
    });
  const addSpecies = () => {
    setPricing((prev) => {
      const map = { ...(prev.species_pricing || {}) };
      const used = new Set(Object.keys(map));
      const next = SPECIES_PRESETS.find((s) => !used.has(s.type)) || SPECIES_PRESETS[SPECIES_PRESETS.length - 1];
      if (used.has(next.type)) return prev;
      return { ...prev, species_pricing: { ...map, [next.type]: 0 } };
    });
  };

  const setChorePrice = (type, value) =>
    setPricing((prev) => ({
      ...prev,
      chore_pricing: { ...(prev.chore_pricing || {}), [type]: value },
    }));

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const cleanedSpecies = {};
      Object.entries(pricing.species_pricing || {}).forEach(([k, v]) => {
        if (k) cleanedSpecies[k] = Number(v) || 0;
      });
      const cleanedChores = {};
      Object.entries(pricing.chore_pricing || {}).forEach(([k, v]) => {
        if (k) cleanedChores[k] = Number(v) || 0;
      });
      const payload = {
        ...pricing,
        price_per_day: Number(pricing.price_per_day) || 0,
        sleepover_fee: Number(pricing.sleepover_fee) || 0,
        own_bed_fee: Number(pricing.own_bed_fee) || 0,
        per_pet_daily: Number(pricing.per_pet_daily) || 0,
        species_pricing: cleanedSpecies,
        extra_walks_daily: Number(pricing.extra_walks_daily) || 0,
        lawn_mow_fee: Number(pricing.lawn_mow_fee) || 0,
        chore_pricing: cleanedChores,
        wifi_discount_enabled: !!pricing.wifi_discount_enabled,
        wifi_discount_amount: Number(pricing.wifi_discount_amount) || 0,
      };
      await api.put("/me/pricing", payload);
      toast.success("Pricing saved — your clients will see the live estimate as they fill in.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not save pricing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="w-10 h-10 border-4 border-[#E8E4DF] border-t-[#8A9A7A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] grain-bg" data-testid="pricing-settings">
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

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-10 md:py-14">
        <div className="text-center mb-10 fade-up">
          <div className="text-[#C58B71] font-semibold text-xs tracking-[0.2em] uppercase mb-3">Your pricing</div>
          <h1 className="font-heading text-4xl sm:text-5xl tracking-tight text-[#3E3A37] mb-3">Set your rates</h1>
          <p className="text-[#76706A] text-lg max-w-xl mx-auto">
            Your clients see a live estimate as they fill out the care plan — no awkward conversations later.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5 fade-up" data-testid="pricing-form">
          <Card>
            <SectionTitle icon={BadgeDollarSign} title="Currency & base rate" />
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
              <label className="block">
                <span className="block text-sm font-semibold text-[#3E3A37] mb-2">Currency</span>
                <select
                  value={pricing.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                  className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2.5 text-[#3E3A37] focus:outline-none focus:border-[#8A9A7A]"
                  data-testid="pricing-currency"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                  ))}
                </select>
              </label>
              <PriceField label="Price per day" hint="Your base daily rate" value={pricing.price_per_day} onChange={(v) => setField("price_per_day", v)} testid="pricing-per-day" currency={pricing.currency} />
            </div>
          </Card>

          <Card>
            <SectionTitle title="Sleepover add-ons" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PriceField label="Overnight stay fee" hint="One-time, if stay is required" value={pricing.sleepover_fee} onChange={(v) => setField("sleepover_fee", v)} testid="pricing-sleepover" currency={pricing.currency} />
              <PriceField label="Bring my own bedding fee" hint="One-time, when no bed is provided" value={pricing.own_bed_fee} onChange={(v) => setField("own_bed_fee", v)} testid="pricing-own-bed" currency={pricing.currency} />
            </div>
          </Card>

          <Card>
            <SectionTitle title="Pet care" />
            <p className="text-sm text-[#76706A] -mt-3 mb-5">
              Charge a different daily rate per species. Species without an entry use your fallback per-pet rate (used as a safety net).
            </p>
            <div className="space-y-3 mb-5">
              {Object.keys(pricing.species_pricing || {}).length === 0 ? (
                <div className="text-sm text-[#76706A] italic" data-testid="species-empty">No species rates yet — add one to start.</div>
              ) : (
                Object.entries(pricing.species_pricing || {}).map(([type, value]) => {
                  const used = new Set(Object.keys(pricing.species_pricing || {}));
                  return (
                    <div key={type} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end" data-testid={`species-row-${type}`}>
                      <label className="flex-1">
                        <span className="block text-sm font-semibold text-[#3E3A37] mb-2">Species</span>
                        <select
                          value={type}
                          onChange={(e) => setSpeciesType(type, e.target.value)}
                          className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2.5 text-[#3E3A37] focus:outline-none focus:border-[#8A9A7A]"
                          data-testid={`species-select-${type}`}
                        >
                          {SPECIES_PRESETS.filter((s) => s.type === type || !used.has(s.type)).map((s) => (
                            <option key={s.type} value={s.type}>{s.label}</option>
                          ))}
                        </select>
                      </label>
                      <div className="flex-1">
                        <PriceField
                          label="Per pet · per day"
                          hint="Added for each pet of this species, each day"
                          value={value}
                          onChange={(v) => setSpeciesPrice(type, v)}
                          testid={`species-price-${type}`}
                          currency={pricing.currency}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpecies(type)}
                        className="pill-btn text-[#76706A] hover:bg-[#F4F3ED] px-3 py-2 sm:mb-1"
                        data-testid={`species-remove-${type}`}
                        aria-label={`Remove ${type} pricing`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <button
              type="button"
              onClick={addSpecies}
              disabled={Object.keys(pricing.species_pricing || {}).length >= SPECIES_PRESETS.length}
              className="pill-btn border-2 border-dashed border-[#E8E4DF] text-[#76706A] hover:border-[#8A9A7A] hover:text-[#3E3A37] disabled:opacity-50 px-5 py-2.5 mb-5"
              data-testid="species-add"
            >
              <Plus className="w-4 h-4 mr-2" /> Add species
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-[#F4F3ED]">
              <PriceField
                label="Fallback per pet · per day"
                hint="Used when a species has no rate set above"
                value={pricing.per_pet_daily}
                onChange={(v) => setField("per_pet_daily", v)}
                testid="pricing-per-pet-fallback"
                currency={pricing.currency}
              />
              <PriceField
                label="Extra walks · per pet / day"
                hint="If walks ≥ twice a day"
                value={pricing.extra_walks_daily}
                onChange={(v) => setField("extra_walks_daily", v)}
                testid="pricing-extra-walks"
                currency={pricing.currency}
              />
            </div>
          </Card>

          <Card>
            <SectionTitle title="Chores" />
            <p className="text-sm text-[#76706A] -mt-3 mb-5">
              Set a fee per visit for each optional chore. Set to 0 to leave it free of charge.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(CHORE_LABELS).map(([type, label]) => (
                <PriceField
                  key={type}
                  label={label}
                  hint="Per scheduled visit"
                  value={choreFee(pricing, type)}
                  onChange={(v) => {
                    setChorePrice(type, v);
                    if (type === "mow_lawn") setField("lawn_mow_fee", v);
                  }}
                  testid={`pricing-chore-${type}`}
                  currency={pricing.currency}
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Discounts" />
            <label className="flex items-start gap-3 cursor-pointer select-none mb-4" data-testid="wifi-discount-toggle-label">
              <input
                type="checkbox"
                checked={!!pricing.wifi_discount_enabled}
                onChange={(e) => setField("wifi_discount_enabled", e.target.checked)}
                className="mt-1 w-5 h-5 accent-[#8A9A7A] rounded border-2 border-[#E8E4DF] flex-shrink-0 cursor-pointer"
                data-testid="wifi-discount-toggle"
              />
              <span className="text-[#3E3A37]">
                <span className="font-heading font-bold block mb-0.5">Wi-Fi password discount</span>
                <span className="text-sm text-[#76706A] block">
                  Knock a fixed amount off the total when the client shares the home Wi-Fi password with you.
                </span>
              </span>
            </label>
            {pricing.wifi_discount_enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                <PriceField
                  label="Discount amount"
                  hint="One-time, applied if Wi-Fi is shared"
                  value={pricing.wifi_discount_amount}
                  onChange={(v) => setField("wifi_discount_amount", v)}
                  testid="pricing-wifi-discount"
                  currency={pricing.currency}
                />
              </div>
            )}
          </Card>

          <div className="bg-[#F0EBE1]/60 border border-[#E8E4DF] rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#8A9A7A] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#76706A]">
              Changes apply to every client form, current and new. Sample total for a 3-day stay with 1 dog walked twice daily and lawn mowing: <span className="font-semibold text-[#3E3A37]">{sampleTotal(pricing)}</span>.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/dashboard" className="pill-btn text-[#76706A] hover:bg-[#F4F3ED] px-6 py-3" data-testid="cancel-pricing">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] disabled:opacity-60 px-8 py-3 shadow-sm font-semibold"
              data-testid="save-pricing"
            >
              <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save pricing"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function sampleTotal(p) {
  const days = 3;
  const base = days * Number(p.price_per_day || 0);
  const sleep = Number(p.sleepover_fee || 0);
  const dogRate = petDailyRate(p, "dog");
  const pets = days * 1 * (dogRate > 0 ? dogRate : Number(p.per_pet_daily || 0));
  const walks = days * 1 * Number(p.extra_walks_daily || 0);
  const mow = choreFee(p, "mow_lawn");
  return formatMoney(base + sleep + pets + walks + mow, p.currency);
}

function Card({ children }) {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgba(62,58,55,0.04)] border border-[#E8E4DF]/60">
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {Icon && (
        <div className="w-8 h-8 rounded-xl bg-[#F0EBE1] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#8A9A7A]" />
        </div>
      )}
      <h2 className="font-heading text-xl font-bold text-[#3E3A37]">{title}</h2>
    </div>
  );
}

function PriceField({ label, hint, value, onChange, testid, currency }) {
  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol || "";
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#3E3A37] mb-2">{label}</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76706A] text-sm font-semibold pointer-events-none">{sym}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl pl-8 pr-3 py-2.5 text-[#3E3A37] focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10"
          data-testid={testid}
        />
      </div>
      {hint && <span className="block text-xs text-[#A39E98] mt-1.5">{hint}</span>}
    </label>
  );
}
