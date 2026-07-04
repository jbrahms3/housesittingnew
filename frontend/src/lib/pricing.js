export const DEFAULT_PRICING = {
  currency: "USD",
  price_per_day: 50,
  sleepover_fee: 25,
  own_bed_fee: 10,
  per_pet_daily: 5,
  species_pricing: {},
  extra_walks_daily: 8,
  lawn_mow_fee: 30,
  chore_pricing: {},
};

// Chore keys must match TASK_OPTIONS in FormSteps.jsx.
export const CHORE_LABELS = {
  mow_lawn: "Lawn mowing",
  poop_scoop: "Poop scooping",
  litter_box: "Litter box cleaning",
  housekeeping: "Housekeeping",
};

const DEFAULT_CHORE_PRICES = {
  mow_lawn: 30,
  poop_scoop: 0,
  litter_box: 0,
  housekeeping: 0,
};

export function choreFee(pricing, type) {
  const p = pricing || {};
  const map = p.chore_pricing || {};
  if (Object.prototype.hasOwnProperty.call(map, type)) return Number(map[type]) || 0;
  if (type === "mow_lawn") return Number(p.lawn_mow_fee) || 0; // back-compat
  return Number(DEFAULT_CHORE_PRICES[type] || 0);
}

export function petDailyRate(pricing, petType) {
  const p = pricing || {};
  const map = p.species_pricing || {};
  if (petType && Object.prototype.hasOwnProperty.call(map, petType)) return Number(map[petType]) || 0;
  return Number(p.per_pet_daily) || 0;
}

export const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "CAD", symbol: "CA$" },
  { code: "AUD", symbol: "A$" },
  { code: "JPY", symbol: "¥" },
  { code: "INR", symbol: "₹" },
];

export function currencySymbol(code) {
  return CURRENCIES.find((c) => c.code === code)?.symbol || code + " ";
}

export function formatMoney(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${currencySymbol(currency)}${(amount || 0).toFixed(2)}`;
  }
}

function parseISODate(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function daysBetween(startISO, endISO) {
  const s = parseISODate(startISO);
  if (!s) return 0;
  const e = parseISODate(endISO) || s;
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

const MULTI_WALK = new Set(["Twice a day", "Three times a day"]);

export function calculateTotal(form, pricing) {
  const p = { ...DEFAULT_PRICING, ...(pricing || {}) };
  const days = form?.date_start ? daysBetween(form.date_start, form.date_end) : 0;
  const lines = [];

  // Base per-day
  if (days > 0 && p.price_per_day > 0) {
    lines.push({
      id: "base",
      label: `Base rate · ${days} day${days > 1 ? "s" : ""}`,
      detail: `${formatMoney(p.price_per_day, p.currency)} / day`,
      amount: days * p.price_per_day,
    });
  }

  // Sleepover one-time
  if (form?.stay_required && p.sleepover_fee > 0) {
    lines.push({
      id: "sleepover",
      label: "Overnight stay",
      detail: "one-time",
      amount: p.sleepover_fee,
    });
  }

  // Bring own bed one-time
  if (form?.stay_required && form?.bed_provided === false && p.own_bed_fee > 0) {
    lines.push({
      id: "own_bed",
      label: "Bring my own bedding",
      detail: "one-time",
      amount: p.own_bed_fee,
    });
  }

  // Per pet daily — group by species so each row reflects that species' rate
  const pets = form?.pets || [];
  if (days > 0 && pets.length > 0) {
    const groups = new Map();
    pets.forEach((pet) => {
      const type = pet?.type || "other";
      const rate = petDailyRate(p, type);
      if (rate <= 0) return;
      const g = groups.get(type) || { type, count: 0, rate, label: pet?.custom_type || labelForSpecies(type) };
      g.count += 1;
      groups.set(type, g);
    });
    Array.from(groups.values()).forEach((g) => {
      lines.push({
        id: `pets_${g.type}`,
        label: `${g.label} care · ${g.count}`,
        detail: `${formatMoney(g.rate, p.currency)} / pet / day × ${days} day${days > 1 ? "s" : ""}`,
        amount: g.count * days * g.rate,
      });
    });
  }

  // Extra walks daily
  const multiWalkPets = (form?.pets || []).filter((pet) => MULTI_WALK.has(pet.walk_frequency)).length;
  if (days > 0 && multiWalkPets > 0 && p.extra_walks_daily > 0) {
    lines.push({
      id: "extra_walks",
      label: `Extra walks · ${multiWalkPets} pet${multiWalkPets > 1 ? "s" : ""}`,
      detail: `${formatMoney(p.extra_walks_daily, p.currency)} / pet / day × ${days} day${days > 1 ? "s" : ""}`,
      amount: multiWalkPets * days * p.extra_walks_daily,
    });
  }

  // Configurable chores: lawn, poop scoop, litter box, housekeeping…
  const tasks = form?.tasks || [];
  Object.keys(CHORE_LABELS).forEach((type) => {
    const matches = tasks.filter((t) => t.type === type);
    if (matches.length === 0) return;
    const fee = choreFee(p, type);
    if (fee <= 0) return;
    const count = matches.reduce((sum, t) => sum + Math.max(1, Number(t.count) || 1), 0);
    lines.push({
      id: `chore_${type}`,
      label: CHORE_LABELS[type],
      detail: count > 1 ? `${count} × ${formatMoney(fee, p.currency)}` : "per scheduled visit",
      amount: count * fee,
    });
  });

  // Wi-Fi promise discount (one-time, only if sitter enabled it AND client checks they'll share Wi-Fi in person)
  const wifiPromised = form?.wifi_shared || (form?.wifi_password || "").trim();
  if (p.wifi_discount_enabled && p.wifi_discount_amount > 0 && wifiPromised) {
    lines.push({
      id: "wifi_discount",
      label: "Wi-Fi password shared",
      detail: "thank-you discount",
      amount: -Math.abs(p.wifi_discount_amount),
    });
  }

  const total = lines.reduce((s, l) => s + (l.amount || 0), 0);
  return { total: Math.max(0, total), lines, days, currency: p.currency };
}

export function hasAnyPricing(pricing) {
  const p = pricing || {};
  const speciesAny = Object.values(p.species_pricing || {}).some((v) => Number(v) > 0);
  const choresAny = Object.values(p.chore_pricing || {}).some((v) => Number(v) > 0);
  return [
    p.price_per_day, p.sleepover_fee, p.own_bed_fee,
    p.per_pet_daily, p.extra_walks_daily, p.lawn_mow_fee,
  ].some((v) => Number(v) > 0) || speciesAny || choresAny;
}

const SPECIES_LABELS = {
  dog: "Dog", cat: "Cat", bird: "Bird", fish: "Fish",
  rabbit: "Rabbit", reptile: "Reptile", other: "Pet",
};
function labelForSpecies(type) {
  return SPECIES_LABELS[type] || (type ? type[0].toUpperCase() + type.slice(1) : "Pet");
}
