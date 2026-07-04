import { Calendar } from "./ui/calendar";
import { formatMoney } from "../lib/pricing";
import {
  Dog, Cat, Bird, Fish, Rabbit, Bug, PawPrint, Check, Plus, Minus, X,
  Droplets, Scissors, Mail as MailIcon, Trash, Flower2, Sparkles,
  Utensils, Footprints, Calendar as CalIcon, User as UserIcon, AlertTriangle, Wifi, Stethoscope, Users,
  Shovel, Sparkles as SparklesIcon,
} from "lucide-react";export const PET_OPTIONS = [
  { type: "dog", label: "Dog", icon: Dog },
  { type: "cat", label: "Cat", icon: Cat },
  { type: "bird", label: "Bird", icon: Bird },
  { type: "fish", label: "Fish", icon: Fish },
  { type: "rabbit", label: "Rabbit", icon: Rabbit },
  { type: "reptile", label: "Reptile", icon: Bug },
  { type: "other", label: "Other", icon: PawPrint },
];

export const TASK_OPTIONS = [
  { type: "water_plants", label: "Water plants", icon: Droplets },
  { type: "mow_lawn", label: "Mow lawn", icon: Scissors },
  { type: "collect_mail", label: "Collect mail", icon: MailIcon },
  { type: "take_out_trash", label: "Take out trash", icon: Trash },
  { type: "water_garden", label: "Water garden", icon: Flower2 },
  { type: "poop_scoop", label: "Poop scooping", icon: Shovel },
  { type: "litter_box", label: "Litter box cleaning", icon: Cat },
  { type: "housekeeping", label: "Housekeeping", icon: SparklesIcon },
  { type: "other", label: "Other", icon: Sparkles },
];

export const WALK_OPTIONS = ["Not required", "Once a day", "Twice a day", "Three times a day", "As needed"];

export function emptySubmission() {
  return {
    date_start: null,
    date_end: null,
    selected_dates: [],
    zip_code: "",
    home_address: "",
    stay_required: true,
    bed_provided: true,
    stay_notes: "",
    pets: [],
    tasks: [],
    owner_name: "",
    owner_phone: "",
    owner_email: "",
    emergency_contacts: [],
    same_vet_for_all: true,
    vet_shared: { name: "", phone: "", address: "", notes: "" },
    water_shutoff: "",
    wifi_password: "",
    wifi_shared: false,
    guests_allowed: false,
    guests_notes: "",
    other_notes: "",
  };
}

function emptyVet() {
  return { name: "", phone: "", address: "", notes: "" };
}

export function StepHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-8 text-center">
      <div className="text-[#C58B71] font-semibold text-xs tracking-[0.2em] uppercase mb-3">{eyebrow}</div>
      <h2 className="font-heading text-3xl sm:text-4xl tracking-tight text-[#3E3A37] mb-3">{title}</h2>
      {subtitle && <p className="text-[#76706A] max-w-xl mx-auto">{subtitle}</p>}
    </div>
  );
}

export function Card({ children, testid }) {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-[0_4px_20px_rgba(62,58,55,0.04)] border border-[#E8E4DF]/60" data-testid={testid}>
      {children}
    </div>
  );
}

export function SelectableTile({ selected, onClick, title, sub, icon: Icon, testid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl p-5 border-2 transition-all duration-200 ${
        selected ? "border-[#8A9A7A] bg-[#F0EBE1]/50" : "border-[#E8E4DF] bg-white hover:border-[#8A9A7A]/60"
      }`}
      data-testid={testid}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? "bg-[#8A9A7A] text-white" : "bg-[#F4F3ED] text-[#8A9A7A]"}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1">
          <div className="font-heading font-bold text-[#3E3A37]">{title}</div>
          {sub && <div className="text-sm text-[#76706A] mt-1">{sub}</div>}
        </div>
        {selected && <Check className="w-5 h-5 text-[#8A9A7A] flex-shrink-0" />}
      </div>
    </button>
  );
}

export function Field({ label, value, onChange, type = "text", testid, placeholder }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#3E3A37] mb-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2 text-[#3E3A37] focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10"
        data-testid={testid}
      />
    </label>
  );
}

export function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-xl bg-[#F0EBE1] flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#8A9A7A]" />
      </div>
      <h3 className="font-heading font-bold text-lg text-[#3E3A37]">{title}</h3>
    </div>
  );
}

export function toISODate(d) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function parseISODate(s) {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function friendlyRange(s, e) {
  const start = parseISODate(s);
  const fmt = { weekday: "short", month: "short", day: "numeric" };
  if (!e) return start.toLocaleDateString(undefined, fmt);
  const end = parseISODate(e);
  const days = Math.round((end - start) / 86400000) + 1;
  return `${start.toLocaleDateString(undefined, fmt)} → ${end.toLocaleDateString(undefined, fmt)} · ${days} day${days > 1 ? "s" : ""}`;
}

// ============ Step 1: Dates ============
export function StepDates({ form, update, sitterBookedDates = [] }) {
  const range = {
    from: parseISODate(form.date_start),
    to: parseISODate(form.date_end),
  };
  const bookedDateObjs = sitterBookedDates
    .map((s) => parseISODate(s))
    .filter(Boolean);
  const bookedSet = new Set(sitterBookedDates);
  const isBooked = (d) => {
    if (!d) return false;
    return bookedSet.has(toISODate(d));
  };
  const onSelect = (r) => {
    // Reject any range that overlaps a booked day.
    const start = r?.from ? toISODate(r.from) : null;
    const end = r?.to ? toISODate(r.to) : start;
    if (start && bookedSet.size > 0) {
      const startDate = parseISODate(start);
      const endDate = parseISODate(end || start);
      if (startDate && endDate) {
        for (let cur = new Date(startDate); cur <= endDate; cur.setDate(cur.getDate() + 1)) {
          if (bookedSet.has(toISODate(cur))) {
            return; // silently ignore — calendar already greys those days out
          }
        }
      }
    }
    update({
      date_start: start,
      date_end: r?.to ? toISODate(r.to) : null,
    });
  };
  return (
    <>
      <StepHeader
        eyebrow="Step 1 of 6"
        title="When will you be away?"
        subtitle="Pick the days you'll be out of town so your sitter knows the exact window."
      />
      <Card testid="step-1-card">
        <div className="flex flex-col items-center">
          <div className="bg-[#FAF9F6] rounded-2xl p-3 border border-[#E8E4DF]">
            <Calendar
              mode="range"
              selected={range}
              onSelect={onSelect}
              numberOfMonths={1}
              disabled={isBooked}
              modifiers={{ booked: bookedDateObjs }}
              modifiersClassNames={{
                booked: "!bg-[#F5E6E8] !text-[#C58B71] line-through opacity-70 cursor-not-allowed",
              }}
              className="[&_.rdp-day_selected]:bg-[#8A9A7A] [&_.rdp-day_selected]:text-white"
              data-testid="dates-calendar"
            />
          </div>
          {bookedDateObjs.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-[#76706A]" data-testid="booked-legend">
              <span className="w-3 h-3 rounded bg-[#F5E6E8] border border-[#C58B71]/40" />
              Greyed days = your sitter is already booked
            </div>
          )}
          <div className="mt-6 text-center">
            {form.date_start ? (
              <div className="inline-flex items-center gap-2 bg-[#F0EBE1] text-[#3E3A37] px-5 py-2.5 rounded-full font-medium" data-testid="dates-summary">
                <CalIcon className="w-4 h-4 text-[#8A9A7A]" />
                {friendlyRange(form.date_start, form.date_end)}
              </div>
            ) : (
              <div className="text-[#76706A] text-sm">Select your first day away to continue</div>
            )}
          </div>

          <div className="w-full mt-8 pt-6 border-t border-[#F4F3ED]">
            <label className="block">
              <span className="block text-sm font-semibold text-[#3E3A37] mb-2">ZIP code *</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.zip_code || ""}
                onChange={(e) => update({ zip_code: e.target.value })}
                placeholder="11201"
                className={`w-full bg-white border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 ${
                  !form.zip_code?.trim()
                    ? "border-[#C58B71]/60 focus:border-[#C58B71] focus:ring-[#C58B71]/15"
                    : "border-[#E8E4DF] focus:border-[#8A9A7A] focus:ring-[#8A9A7A]/10"
                }`}
                aria-invalid={!form.zip_code?.trim() || undefined}
                data-testid="zip-code"
              />
              <span className="block text-xs text-[#A39E98] mt-1.5">Just your ZIP for now — you'll share the exact address once your sitter confirms.</span>
            </label>
          </div>
        </div>
      </Card>
    </>
  );
}

// ============ Step 2: Stay ============
export function StepStay({ form, update }) {
  return (
    <>
      <StepHeader
        eyebrow="Step 2 of 6"
        title="How should your sitter stay?"
        subtitle="Let them know what to expect when they arrive."
      />
      <Card testid="step-2-card">
        <label className="block mb-3 text-sm font-semibold text-[#3E3A37]">Is overnight stay required?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <SelectableTile selected={form.stay_required} onClick={() => update({ stay_required: true })} title="Required" sub="They'll sleep at your house." testid="stay-required-yes" />
          <SelectableTile selected={!form.stay_required} onClick={() => update({ stay_required: false })} title="Optional" sub="Stopping by is fine." testid="stay-required-no" />
        </div>

        {form.stay_required && (
          <>
            <label className="block mb-3 text-sm font-semibold text-[#3E3A37]">Is a bed provided?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <SelectableTile selected={form.bed_provided} onClick={() => update({ bed_provided: true })} title="Bed provided" sub="A made bed is ready." testid="bed-provided-yes" />
              <SelectableTile selected={!form.bed_provided} onClick={() => update({ bed_provided: false })} title="Bring your own" sub="Sleeping bag / air bed." testid="bed-provided-no" />
            </div>
          </>
        )}

        <label className="block mb-2 text-sm font-semibold text-[#3E3A37]">Extra notes (optional)</label>
        <textarea
          value={form.stay_notes}
          onChange={(e) => update({ stay_notes: e.target.value })}
          placeholder="E.g. The guest room is upstairs, fresh towels in the linen closet…"
          rows={4}
          className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-4 py-3 text-[#3E3A37] focus:outline-none focus:border-[#8A9A7A] focus:ring-4 focus:ring-[#8A9A7A]/10"
          data-testid="stay-notes-input"
        />
      </Card>
    </>
  );
}

// ============ Step 3: Pets ============
export function StepPets({ form, update }) {
  const togglePet = (type) => {
    const existing = form.pets.find((p) => p.type === type);
    if (existing) {
      update({ pets: form.pets.filter((p) => p.pet_id !== existing.pet_id) });
    } else {
      update({
        pets: [...form.pets, {
          pet_id: `pet_${Math.random().toString(36).slice(2, 10)}`,
          type, name: "", custom_type: "",
          feeding_schedule: [{ time: "", amount: "", instructions: "" }],
          walk_frequency: type === "dog" ? "Twice a day" : "Not required",
          walk_notes: "",
        }],
      });
    }
  };
  const addAnother = (type) => {
    update({
      pets: [...form.pets, {
        pet_id: `pet_${Math.random().toString(36).slice(2, 10)}`,
        type, name: "", custom_type: "",
        feeding_schedule: [{ time: "", amount: "", instructions: "" }],
        walk_frequency: type === "dog" ? "Twice a day" : "Not required",
        walk_notes: "",
      }],
    });
  };
  const setPet = (id, patch) => update({ pets: form.pets.map((p) => (p.pet_id === id ? { ...p, ...patch } : p)) });
  const removePet = (id) => update({ pets: form.pets.filter((p) => p.pet_id !== id) });

  return (
    <>
      <StepHeader eyebrow="Step 3 of 6" title="Who lives here?" subtitle="Pick your pets and give each one a name." />
      <Card testid="step-3-card">
        <label className="block mb-3 text-sm font-semibold text-[#3E3A37]">Pet types</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {PET_OPTIONS.map(({ type, label, icon: Icon }) => {
            const active = form.pets.some((p) => p.type === type);
            return (
              <button
                type="button"
                key={type}
                onClick={() => togglePet(type)}
                className={`relative rounded-2xl p-4 border-2 transition-all ${
                  active ? "border-[#8A9A7A] bg-[#F0EBE1]/60" : "border-[#E8E4DF] bg-white hover:border-[#8A9A7A]/60"
                }`}
                data-testid={`pet-type-${type}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 ${active ? "bg-[#8A9A7A] text-white" : "bg-[#F4F3ED] text-[#8A9A7A]"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-heading font-semibold text-sm text-[#3E3A37]">{label}</div>
                {active && <Check className="absolute top-2 right-2 w-4 h-4 text-[#8A9A7A]" />}
              </button>
            );
          })}
        </div>

        {form.pets.length === 0 ? (
          <p className="text-sm text-[#76706A] text-center py-4">No pets yet. Pick a type above to add one.</p>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-[#3E3A37]">Name each pet</label>
            {form.pets.map((pet) => {
              const opt = PET_OPTIONS.find((o) => o.type === pet.type);
              const Icon = opt?.icon || PawPrint;
              return (
                <div key={pet.pet_id} className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8A9A7A] text-white flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={pet.name}
                      onChange={(e) => setPet(pet.pet_id, { name: e.target.value })}
                      placeholder={`${opt?.label || "Pet"} name`}
                      className="bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2 focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10"
                      data-testid={`pet-name-${pet.pet_id}`}
                    />
                    {pet.type === "other" && (
                      <input
                        type="text"
                        value={pet.custom_type}
                        onChange={(e) => setPet(pet.pet_id, { custom_type: e.target.value })}
                        placeholder="Species (e.g. hamster)"
                        className="bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2 focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10"
                        data-testid={`pet-custom-type-${pet.pet_id}`}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => addAnother(pet.type)} className="text-[#76706A] hover:bg-white rounded-full p-2" title={`Add another ${opt?.label}`} data-testid={`add-another-${pet.pet_id}`}>
                      <Plus className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => removePet(pet.pet_id)} className="text-[#C58B71] hover:bg-[#F5E6E8] rounded-full p-2" title="Remove" data-testid={`remove-pet-${pet.pet_id}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

// ============ Step 4: Feeding + walks ============
export function StepCare({ form, update }) {
  const setPet = (id, patch) => update({ pets: form.pets.map((p) => (p.pet_id === id ? { ...p, ...patch } : p)) });

  if (form.pets.length === 0) {
    return (
      <>
        <StepHeader eyebrow="Step 4 of 6" title="Feeding & walks" />
        <Card>
          <div className="text-center text-[#76706A] py-6">
            No pets added. Go back to <span className="font-semibold">Step 3</span> to add pets, or skip ahead.
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <StepHeader eyebrow="Step 4 of 6" title="Feeding & walks" subtitle="Set a feeding schedule and walk frequency for each pet." />

      <div className="space-y-5">
        {form.pets.map((pet) => {
          const opt = PET_OPTIONS.find((o) => o.type === pet.type);
          const Icon = opt?.icon || PawPrint;
          return (
            <Card key={pet.pet_id} testid={`care-card-${pet.pet_id}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#8A9A7A] text-white flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-heading text-xl font-bold text-[#3E3A37]">{pet.name || opt?.label}</div>
                  <div className="text-sm text-[#76706A] capitalize">{pet.custom_type || opt?.label}</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#3E3A37]">
                    <Utensils className="w-4 h-4 text-[#8A9A7A]" /> Feeding schedule
                  </label>
                  <button
                    type="button"
                    onClick={() => setPet(pet.pet_id, { feeding_schedule: [...(pet.feeding_schedule || []), { time: "", amount: "", instructions: "" }] })}
                    className="text-sm text-[#8A9A7A] font-semibold hover:underline"
                    data-testid={`add-feeding-${pet.pet_id}`}
                  >
                    <Plus className="w-4 h-4 inline -mt-0.5" /> Add meal
                  </button>
                </div>
                <div className="space-y-2">
                  {(pet.feeding_schedule || []).map((meal, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-[110px_130px_1fr_auto] gap-2 items-start">
                      <input
                        type="time"
                        value={meal.time}
                        onChange={(e) => {
                          const next = [...pet.feeding_schedule];
                          next[idx] = { ...next[idx], time: e.target.value };
                          setPet(pet.pet_id, { feeding_schedule: next });
                        }}
                        className="bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2 focus:outline-none focus:border-[#8A9A7A]"
                        data-testid={`feeding-time-${pet.pet_id}-${idx}`}
                      />
                      <input
                        type="text"
                        value={meal.amount}
                        onChange={(e) => {
                          const next = [...pet.feeding_schedule];
                          next[idx] = { ...next[idx], amount: e.target.value };
                          setPet(pet.pet_id, { feeding_schedule: next });
                        }}
                        placeholder="e.g. 1 cup"
                        className="bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2 focus:outline-none focus:border-[#8A9A7A]"
                        data-testid={`feeding-amount-${pet.pet_id}-${idx}`}
                      />
                      <input
                        type="text"
                        value={meal.instructions}
                        onChange={(e) => {
                          const next = [...pet.feeding_schedule];
                          next[idx] = { ...next[idx], instructions: e.target.value };
                          setPet(pet.pet_id, { feeding_schedule: next });
                        }}
                        placeholder="Instructions (kibble in red bowl, 1 scoop…)"
                        className="bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2 focus:outline-none focus:border-[#8A9A7A]"
                        data-testid={`feeding-notes-${pet.pet_id}-${idx}`}
                      />
                      <button
                        type="button"
                        onClick={() => setPet(pet.pet_id, { feeding_schedule: pet.feeding_schedule.filter((_, i) => i !== idx) })}
                        className="text-[#C58B71] hover:bg-[#F5E6E8] rounded-full p-2 justify-self-start"
                        data-testid={`remove-feeding-${pet.pet_id}-${idx}`}
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#3E3A37] mb-2">
                  <Footprints className="w-4 h-4 text-[#8A9A7A]" /> Walk frequency
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {WALK_OPTIONS.map((w) => (
                    <button
                      type="button"
                      key={w}
                      onClick={() => setPet(pet.pet_id, { walk_frequency: w })}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                        pet.walk_frequency === w
                          ? "border-[#8A9A7A] bg-[#8A9A7A] text-white"
                          : "border-[#E8E4DF] bg-white text-[#3E3A37] hover:border-[#8A9A7A]/60"
                      }`}
                      data-testid={`walk-freq-${pet.pet_id}-${w.replace(/\s+/g, '-')}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                {pet.walk_frequency !== "Not required" && (
                  <input
                    type="text"
                    value={pet.walk_notes}
                    onChange={(e) => setPet(pet.pet_id, { walk_notes: e.target.value })}
                    placeholder="Walk notes (leash hook by door, 20-minute loop…)"
                    className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#8A9A7A]"
                    data-testid={`walk-notes-${pet.pet_id}`}
                  />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function VetFields({ vet, onChange, testidPrefix }) {
  const nameMissing = !vet.name?.trim();
  const phoneMissing = !vet.phone?.trim();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Vet / clinic name *" value={vet.name} onChange={(v) => onChange({ name: v })} testid={`${testidPrefix}-name`} required invalid={nameMissing} placeholder="e.g. Brooklyn Animal Hospital" />
      <Field label="Vet phone *" value={vet.phone} onChange={(v) => onChange({ phone: v })} testid={`${testidPrefix}-phone`} required invalid={phoneMissing} placeholder="(555) 123-4567" />
      <div className="sm:col-span-2">
        <Field label="Vet address" value={vet.address} onChange={(v) => onChange({ address: v })} testid={`${testidPrefix}-address`} placeholder="Street, city" />
      </div>
      <div className="sm:col-span-2">
        <label className="block">
          <span className="block text-sm font-semibold text-[#3E3A37] mb-2">Notes for the vet</span>
          <textarea
            value={vet.notes || ""}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={2}
            placeholder="Medications, allergies, patient chart name…"
            className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2 focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10"
            data-testid={`${testidPrefix}-notes`}
          />
        </label>
      </div>
    </div>
  );
}

// ============ Step 5: Tasks ============
export function StepTasks({ form, update, pricing }) {
  const toggle = (type) => {
    const existing = form.tasks.find((t) => t.type === type);
    if (existing) {
      update({ tasks: form.tasks.filter((t) => t.task_id !== existing.task_id) });
    } else {
      update({
        tasks: [...form.tasks, { task_id: `task_${Math.random().toString(36).slice(2, 10)}`, type, custom_type: "", count: 1, details: "" }],
      });
    }
  };
  const setTask = (id, patch) => update({ tasks: form.tasks.map((t) => (t.task_id === id ? { ...t, ...patch } : t)) });
  const setCount = (id, next) =>
    setTask(id, { count: Math.max(1, Math.min(99, Number(next) || 1)) });

  return (
    <>
      <StepHeader eyebrow="Step 5 of 6" title="Other tasks" subtitle="What else do you need help with while you're away?" />
      <Card testid="step-5-card">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {TASK_OPTIONS.map(({ type, label, icon: Icon }) => {
            const active = form.tasks.some((t) => t.type === type);
            return (
              <button
                type="button"
                key={type}
                onClick={() => toggle(type)}
                className={`relative rounded-2xl p-4 border-2 transition-all ${
                  active ? "border-[#8A9A7A] bg-[#F0EBE1]/60" : "border-[#E8E4DF] bg-white hover:border-[#8A9A7A]/60"
                }`}
                data-testid={`task-type-${type}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 ${active ? "bg-[#8A9A7A] text-white" : "bg-[#F4F3ED] text-[#8A9A7A]"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-heading font-semibold text-sm text-[#3E3A37]">{label}</div>
                {active && <Check className="absolute top-2 right-2 w-4 h-4 text-[#8A9A7A]" />}
              </button>
            );
          })}
        </div>

        {form.tasks.length === 0 ? (
          <p className="text-sm text-[#76706A] text-center py-4">No tasks selected — that's fine! You can skip this step.</p>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-[#3E3A37]">Task details</label>
            {form.tasks.map((task) => {
              const opt = TASK_OPTIONS.find((o) => o.type === task.type);
              const Icon = opt?.icon || Sparkles;
              const fee = Number(pricing?.chore_pricing?.[task.type] ?? (task.type === "mow_lawn" ? pricing?.lawn_mow_fee : 0)) || 0;
              const count = Math.max(1, Number(task.count) || 1);
              const lineTotal = count * fee;
              return (
                <div key={task.task_id} className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl p-4" data-testid={`task-row-${task.task_id}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#8A9A7A] text-white flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    {task.type === "other" ? (
                      <input
                        type="text"
                        value={task.custom_type}
                        onChange={(e) => setTask(task.task_id, { custom_type: e.target.value })}
                        placeholder="Task name (e.g. Bring in newspapers)"
                        className="flex-1 bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2 font-heading font-semibold focus:outline-none focus:border-[#8A9A7A]"
                        data-testid={`task-custom-${task.task_id}`}
                      />
                    ) : (
                      <div className="flex-1 font-heading font-bold text-[#3E3A37]">{opt?.label}</div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-sm font-semibold text-[#3E3A37]">How many times?</span>
                    <div className="inline-flex items-center bg-white border-2 border-[#E8E4DF] rounded-full overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setCount(task.task_id, count - 1)}
                        disabled={count <= 1}
                        className="px-3 py-2 text-[#3E3A37] hover:bg-[#F4F3ED] disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Decrease count"
                        data-testid={`task-count-dec-${task.task_id}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={count}
                        onChange={(e) => setCount(task.task_id, e.target.value)}
                        className="w-12 text-center font-heading font-bold text-[#3E3A37] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        data-testid={`task-count-${task.task_id}`}
                      />
                      <button
                        type="button"
                        onClick={() => setCount(task.task_id, count + 1)}
                        className="px-3 py-2 text-[#3E3A37] hover:bg-[#F4F3ED]"
                        aria-label="Increase count"
                        data-testid={`task-count-inc-${task.task_id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-[#76706A]">{count === 1 ? "time" : "times"}</span>
                    {fee > 0 && (
                      <span className="ml-auto text-sm font-heading font-bold text-[#3E3A37]" data-testid={`task-line-total-${task.task_id}`}>
                        {count} × {formatMoney(fee, pricing?.currency)} = <span className="text-[#8A9A7A]">{formatMoney(lineTotal, pricing?.currency)}</span>
                      </span>
                    )}
                  </div>

                  <textarea
                    value={task.details}
                    onChange={(e) => setTask(task.task_id, { details: e.target.value })}
                    placeholder="Details — e.g. Water Monday and Thursday, the plants in the kitchen prefer less water…"
                    rows={2}
                    className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2 focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10"
                    data-testid={`task-details-${task.task_id}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

// ============ Emergency contacts (stage 2) ============
export function EmergencyContactsEditor({ contacts, update }) {
  const list = contacts || [];
  const addEmergency = () => update([...list, { name: "", phone: "", relation: "" }]);
  const setEmergency = (idx, patch) => {
    const next = [...list];
    next[idx] = { ...next[idx], ...patch };
    update(next);
  };
  const removeEmergency = (idx) => update(list.filter((_, i) => i !== idx));
  const hasEmergency = list.some((c) => c.name?.trim() && c.phone?.trim());

  return (
    <>
      {!hasEmergency && (
        <p className="text-sm text-[#C58B71] -mt-3 mb-3 flex items-center gap-1.5" data-testid="emergency-required-hint">
          <AlertTriangle className="w-3.5 h-3.5" /> Please add at least one emergency contact with a name and phone number.
        </p>
      )}
      <div className="space-y-3 mb-3">
        {list.map((c, i) => (
          <div key={i} className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Field label="Name *" value={c.name} onChange={(v) => setEmergency(i, { name: v })} testid={`emergency-name-${i}`} required invalid={!c.name?.trim()} />
              <Field label="Phone *" value={c.phone} onChange={(v) => setEmergency(i, { phone: v })} testid={`emergency-phone-${i}`} required invalid={!c.phone?.trim()} />
              <Field label="Relation" value={c.relation} onChange={(v) => setEmergency(i, { relation: v })} testid={`emergency-relation-${i}`} placeholder="vet, neighbor…" />
            </div>
            <button type="button" onClick={() => removeEmergency(i)} className="mt-2 text-sm text-[#C58B71] font-semibold hover:underline" data-testid={`remove-emergency-${i}`}>
              Remove contact
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addEmergency}
        className="pill-btn border-2 border-dashed border-[#E8E4DF] text-[#76706A] hover:border-[#8A9A7A] hover:text-[#3E3A37] px-6 py-3"
        data-testid="add-emergency-contact"
      >
        <Plus className="w-4 h-4 mr-2" /> Add emergency contact
      </button>
    </>
  );
}

// ============ Step 6: Contacts ============
export function StepContacts({ form, update, pricing }) {
  const wifiDiscount = pricing?.wifi_discount_enabled && Number(pricing?.wifi_discount_amount) > 0;
  const ownerNameMissing = !form.owner_name?.trim();
  const ownerPhoneMissing = !form.owner_phone?.trim();
  const setPet = (id, patch) => update({ pets: form.pets.map((p) => (p.pet_id === id ? { ...p, ...patch } : p)) });

  return (
    <>
      <StepHeader eyebrow="Step 6 of 6" title="Contacts & house notes" subtitle="So your sitter can reach you — and knows where to look if something goes wrong." />
      <Card testid="step-6-card">
        <SectionHeader icon={UserIcon} title="Your contact info" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Field label="Your name *" value={form.owner_name} onChange={(v) => update({ owner_name: v })} testid="owner-name" required invalid={ownerNameMissing} />
          <Field label="Your phone *" value={form.owner_phone} onChange={(v) => update({ owner_phone: v })} testid="owner-phone" required invalid={ownerPhoneMissing} />
          <div className="sm:col-span-2">
            <Field label="Your email" type="email" value={form.owner_email} onChange={(v) => update({ owner_email: v })} testid="owner-email" />
          </div>
        </div>

        {form.pets?.length > 0 && (
          <>
            <SectionHeader icon={Stethoscope} title="Veterinary info *" />
            <p className="text-sm text-[#76706A] -mt-3 mb-3">
              In case anything happens, your sitter needs to reach a vet quickly.
            </p>
            <label className="flex items-start gap-3 cursor-pointer select-none mb-4" data-testid="same-vet-toggle-label">
              <input
                type="checkbox"
                checked={!!form.same_vet_for_all}
                onChange={(e) => update({ same_vet_for_all: e.target.checked })}
                className="mt-1 w-5 h-5 accent-[#8A9A7A] rounded border-2 border-[#E8E4DF] flex-shrink-0 cursor-pointer"
                data-testid="same-vet-toggle"
              />
              <span className="text-[#3E3A37]">
                <span className="font-semibold">All my pets share the same vet</span>
                <span className="text-sm text-[#76706A] block">Untick if different pets see different vets.</span>
              </span>
            </label>
            {form.same_vet_for_all ? (
              <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl p-4 mb-8" data-testid="shared-vet-card">
                <VetFields
                  vet={form.vet_shared || emptyVet()}
                  onChange={(patch) => update({ vet_shared: { ...(form.vet_shared || emptyVet()), ...patch } })}
                  testidPrefix="shared-vet"
                />
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {form.pets.map((pet) => {
                  const opt = PET_OPTIONS.find((o) => o.type === pet.type);
                  return (
                    <div key={pet.pet_id} className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl p-4" data-testid={`vet-card-${pet.pet_id}`}>
                      <div className="text-sm font-semibold text-[#3E3A37] mb-3">
                        {pet.name || opt?.label || "This pet"}'s vet *
                      </div>
                      <VetFields
                        vet={pet.vet || emptyVet()}
                        onChange={(patch) => setPet(pet.pet_id, { vet: { ...(pet.vet || emptyVet()), ...patch } })}
                        testidPrefix={`vet-${pet.pet_id}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <SectionHeader icon={Droplets} title="House essentials" />
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#3E3A37] mb-2">Water shut-off location *</label>
          <input
            type="text"
            value={form.water_shutoff}
            onChange={(e) => update({ water_shutoff: e.target.value })}
            placeholder="e.g. Basement, south wall — labeled 'MAIN'"
            className={`w-full bg-white border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 ${
              !form.water_shutoff?.trim()
                ? "border-[#C58B71]/60 focus:border-[#C58B71] focus:ring-[#C58B71]/15"
                : "border-[#E8E4DF] focus:border-[#8A9A7A] focus:ring-[#8A9A7A]/10"
            }`}
            required
            aria-invalid={!form.water_shutoff?.trim() || undefined}
            data-testid="water-shutoff"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#3E3A37] mb-2">Wi-Fi (optional)</label>
          {wifiDiscount && (
            <div
              className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#F0EBE1] border border-[#8A9A7A]/30 px-4 py-2 text-sm font-heading font-bold text-[#3E3A37]"
              data-testid="wifi-discount-hint"
            >
              <Wifi className="w-4 h-4 text-[#8A9A7A]" />
              <span className="text-[#8A9A7A] text-base font-extrabold">
                −{formatMoney(Number(pricing.wifi_discount_amount), pricing.currency)}
              </span>
              <span className="text-[#76706A] font-normal">from the price for sharing</span>
            </div>
          )}
          <label
            className={`flex items-start gap-3 cursor-pointer select-none bg-white border-2 rounded-xl px-4 py-3 transition-all ${
              form.wifi_shared ? "border-[#8A9A7A] bg-[#FAF9F6]" : "border-[#E8E4DF]"
            }`}
            data-testid="wifi-shared-label"
          >
            <input
              type="checkbox"
              checked={!!form.wifi_shared}
              onChange={(e) => update({ wifi_shared: e.target.checked })}
              className="mt-1 w-5 h-5 accent-[#8A9A7A] rounded border-2 border-[#E8E4DF] flex-shrink-0 cursor-pointer"
              data-testid="wifi-shared-checkbox"
            />
            <span className="text-[#3E3A37]">
              <span className="font-semibold">I'll share the Wi-Fi password with my sitter in person</span>
              <span className="text-sm text-[#76706A] block">
                For your security, we won't store the password — you can hand it over when they arrive.
                {wifiDiscount && form.wifi_shared && (
                  <span className="text-[#8A9A7A] font-semibold"> Discount applied above.</span>
                )}
              </span>
            </span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#3E3A37] mb-2">Other notes</label>
          <textarea
            value={form.other_notes}
            onChange={(e) => update({ other_notes: e.target.value })}
            rows={5}
            placeholder="Wi-Fi password, thermostat settings, quirks of the house, trusted neighbors, etc."
            className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-4 py-3 focus:outline-none focus:border-[#8A9A7A] focus:ring-4 focus:ring-[#8A9A7A]/10"
            data-testid="other-notes"
          />
        </div>

        <div className="mt-6 pt-6 border-t border-[#F4F3ED]">
          <SectionHeader icon={Users} title="Guests" />
          <p className="text-[#3E3A37] -mt-3 mb-4">
            Are guests allowed over while your sitter is here?
            <span className="text-[#76706A]"> (close friends only, no parties, no sleepovers)</span>
          </p>
          <div className="flex gap-2" role="radiogroup" aria-label="Are guests allowed over?">
            <button
              type="button"
              role="radio"
              aria-checked={form.guests_allowed === true}
              onClick={() => update({ guests_allowed: true })}
              className={`pill-btn px-6 py-2.5 text-sm font-semibold border-2 transition-all ${
                form.guests_allowed === true
                  ? "border-[#8A9A7A] bg-[#8A9A7A] text-white"
                  : "border-[#E8E4DF] bg-white text-[#3E3A37] hover:border-[#8A9A7A]/60"
              }`}
              data-testid="guests-allowed-yes"
            >
              Yes
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={form.guests_allowed === false}
              onClick={() => update({ guests_allowed: false })}
              className={`pill-btn px-6 py-2.5 text-sm font-semibold border-2 transition-all ${
                form.guests_allowed === false
                  ? "border-[#8A9A7A] bg-[#8A9A7A] text-white"
                  : "border-[#E8E4DF] bg-white text-[#3E3A37] hover:border-[#8A9A7A]/60"
              }`}
              data-testid="guests-allowed-no"
            >
              No
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}

// ============ Progress indicator ============
export const STEPS = [
  { id: 1, label: "Dates" },
  { id: 2, label: "Stay" },
  { id: 3, label: "Pets" },
  { id: 4, label: "Care" },
  { id: 5, label: "Tasks" },
  { id: 6, label: "Contacts" },
];

export function ProgressBar({ step }) {
  const pct = ((step - 1) / (STEPS.length - 1)) * 100;
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-8">
      {/* Row 1: circles + connecting bar (bar is centered on the circles only) */}
      <div className="relative flex items-center justify-between">
        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 bg-[#F4F3ED] rounded-full z-0" />
        <div
          className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 bg-[#8A9A7A] rounded-full z-0 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
        {STEPS.map((s) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div
              key={s.id}
              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-sm transition-all duration-300 ${
                active
                  ? "bg-[#8A9A7A] text-white shadow-md ring-4 ring-[#8A9A7A]/20 scale-110"
                  : done
                  ? "bg-[#8A9A7A] text-white"
                  : "bg-white border-2 border-[#E8E4DF] text-[#A39E98]"
              }`}
              data-testid={`progress-step-${s.id}`}
            >
              {done ? <Check className="w-4 h-4" /> : s.id}
            </div>
          );
        })}
      </div>
      {/* Row 2: labels under each circle */}
      <div className="hidden md:flex items-start justify-between mt-3">
        {STEPS.map((s) => {
          const active = step === s.id;
          return (
            <span
              key={s.id}
              className={`w-9 text-center text-xs font-medium ${active ? "text-[#3E3A37]" : "text-[#A39E98]"}`}
            >
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
