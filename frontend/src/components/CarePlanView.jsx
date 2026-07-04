import {
  Calendar as CalIcon, BedDouble, Dog, Cat, Bird, Fish, Rabbit, Bug, PawPrint,
  Utensils, Footprints, CheckCircle2, Phone, User as UserIcon, AlertTriangle,
  Droplets, Scissors, Mail as MailIcon, Trash, Flower2, Sparkles,
  StickyNote, ShieldAlert, Wifi, Users, MapPin, Stethoscope,
  Shovel, Sparkles as SparklesIcon,
} from "lucide-react";

const PET_ICONS = { dog: Dog, cat: Cat, bird: Bird, fish: Fish, rabbit: Rabbit, reptile: Bug, other: PawPrint };
const PET_LABELS = { dog: "Dog", cat: "Cat", bird: "Bird", fish: "Fish", rabbit: "Rabbit", reptile: "Reptile", other: "Other" };
const TASK_ICONS = { water_plants: Droplets, mow_lawn: Scissors, collect_mail: MailIcon, take_out_trash: Trash, water_garden: Flower2, poop_scoop: Shovel, litter_box: Cat, housekeeping: SparklesIcon, other: Sparkles };
const TASK_LABELS = { water_plants: "Water plants", mow_lawn: "Mow lawn", collect_mail: "Collect mail", take_out_trash: "Take out trash", water_garden: "Water garden", poop_scoop: "Poop scooping", litter_box: "Litter box cleaning", housekeeping: "Housekeeping", other: "Other" };

export default function CarePlanView({ form }) {
  const ownerName = form.owner_name || form.client_name || "Your client";

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-8 md:p-10 border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)] print-card">
        <div className="inline-flex items-center gap-2 bg-[#F0EBE1] text-[#76706A] text-xs font-semibold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full mb-4">
          House-sitting care plan
        </div>
        <h1 className="font-heading text-3xl sm:text-5xl tracking-tight text-[#3E3A37] mb-3" data-testid="plan-title">{form.title}</h1>
        <p className="text-[#76706A] text-lg">
          From <span className="font-semibold text-[#3E3A37]">{ownerName}</span>
          {form.date_start && <> · <CalendarRange s={form.date_start} e={form.date_end}/></>}
        </p>
      </section>

      {form.date_start && (
        <Section icon={CalIcon} title="Dates away" testid="section-dates">
          <div className="text-lg text-[#3E3A37] font-semibold">
            <CalendarRange s={form.date_start} e={form.date_end} />
          </div>
          {form.home_address && (
            <div className="mt-4 pt-4 border-t border-[#F4F3ED]">
              <SubLabel icon={MapPin}>Home address</SubLabel>
              <BodyText text={form.home_address} />
            </div>
          )}
        </Section>
      )}

      <Section icon={BedDouble} title="Staying arrangements" testid="section-stay">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge color="green">{form.stay_required ? "Overnight stay required" : "Overnight stay optional"}</Badge>
          {form.stay_required && <Badge color="sand">{form.bed_provided ? "Bed provided" : "Bring your own bedding"}</Badge>}
        </div>
        {form.stay_notes && <BodyText text={form.stay_notes} />}
      </Section>

      {form.pets?.length > 0 && (
        <Section icon={PawPrint} title="Your furry (and scaly) friends" testid="section-pets">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {form.pets.map((p) => {
              const Icon = PET_ICONS[p.type] || PawPrint;
              return (
                <div key={p.pet_id} className="flex items-center gap-3 bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl p-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#8A9A7A] text-white flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-lg text-[#3E3A37]">{p.name || PET_LABELS[p.type]}</div>
                    <div className="text-sm text-[#76706A] capitalize">{p.custom_type || PET_LABELS[p.type]}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-5">
            {form.pets.map((p) => {
              const hasFeeding = (p.feeding_schedule || []).some((m) => m.time || m.amount || m.instructions);
              const walks = p.walk_frequency && p.walk_frequency !== "Not required";
              if (!hasFeeding && !walks) return null;
              return (
                <div key={`care-${p.pet_id}`} className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl p-5">
                  <div className="font-heading font-bold text-[#3E3A37] mb-3">{p.name || PET_LABELS[p.type]}'s care</div>
                  {hasFeeding && (
                    <div className="mb-4">
                      <SubLabel icon={Utensils}>Feeding schedule</SubLabel>
                      <ul className="space-y-2 mt-2">
                        {(p.feeding_schedule || []).filter((m) => m.time || m.amount || m.instructions).map((m, i) => (
                          <li key={i} className="bg-white border border-[#E8E4DF] rounded-xl p-3 flex flex-wrap gap-x-4 gap-y-1">
                            {m.time && <span className="font-heading font-bold text-[#3E3A37]">{formatTime(m.time)}</span>}
                            {m.amount && <span className="text-[#76706A]">{m.amount}</span>}
                            {m.instructions && <span className="text-[#3E3A37] flex-1 min-w-[200px]">{m.instructions}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {walks && (
                    <div>
                      <SubLabel icon={Footprints}>Walks</SubLabel>
                      <div className="mt-2">
                        <Badge color="green">{p.walk_frequency}</Badge>
                        {p.walk_notes && <p className="text-[#3E3A37] mt-2">{p.walk_notes}</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {form.pets?.length > 0 && (form.same_vet_for_all ? hasVetInfo(form.vet_shared) : form.pets.some((p) => hasVetInfo(p.vet))) && (
        <Section icon={Stethoscope} title="Veterinary info" testid="section-vet">
          {form.same_vet_for_all ? (
            <VetBlock vet={form.vet_shared} petName="All pets" />
          ) : (
            <div className="space-y-3">
              {form.pets.filter((p) => hasVetInfo(p.vet)).map((p) => (
                <VetBlock key={p.pet_id} vet={p.vet} petName={p.name || PET_LABELS[p.type]} />
              ))}
            </div>
          )}
        </Section>
      )}

      {form.tasks?.length > 0 && (
        <Section icon={CheckCircle2} title="Other tasks" testid="section-tasks">
          <div className="space-y-3">
            {form.tasks.map((t) => {
              const Icon = TASK_ICONS[t.type] || Sparkles;
              const label = t.type === "other" ? (t.custom_type || "Other task") : TASK_LABELS[t.type];
              return (
                <div key={t.task_id} className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-[#8A9A7A] text-white flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-heading font-bold text-[#3E3A37] flex-1">{label}</div>
                    {Number(t.count) > 1 && (
                      <span className="text-xs font-semibold text-[#3E3A37] bg-[#F0EBE1] px-2.5 py-1 rounded-full">
                        {t.count} × visits
                      </span>
                    )}
                  </div>
                  {t.details && <BodyText text={t.details} />}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {(form.owner_name || form.owner_phone || form.owner_email || form.emergency_contacts?.length > 0) && (
        <Section icon={Phone} title="Contacts & emergencies" testid="section-contacts">
          {(form.owner_name || form.owner_phone || form.owner_email) && (
            <div className="mb-4">
              <SubLabel icon={UserIcon}>Owner</SubLabel>
              <div className="mt-2 bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl p-4">
                {form.owner_name && <div className="font-heading font-bold text-[#3E3A37]">{form.owner_name}</div>}
                {form.owner_phone && <a href={`tel:${form.owner_phone}`} className="block text-[#3E3A37] hover:text-[#8A9A7A]">{form.owner_phone}</a>}
                {form.owner_email && <a href={`mailto:${form.owner_email}`} className="block text-[#8A9A7A] hover:underline">{form.owner_email}</a>}
              </div>
            </div>
          )}

          {form.emergency_contacts?.length > 0 && (
            <div>
              <SubLabel icon={AlertTriangle}>Emergency contacts</SubLabel>
              <div className="mt-2 space-y-2">
                {form.emergency_contacts.map((c, i) => (
                  <div key={i} className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl p-4 flex flex-wrap gap-x-4 gap-y-1 items-baseline">
                    {c.name && <span className="font-heading font-bold text-[#3E3A37]">{c.name}</span>}
                    {c.relation && <span className="text-[#76706A] text-sm">({c.relation})</span>}
                    {c.phone && <a href={`tel:${c.phone}`} className="text-[#8A9A7A] hover:underline ml-auto">{c.phone}</a>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {(form.water_shutoff || form.wifi_shared || form.wifi_password || form.other_notes) && (
        <Section icon={ShieldAlert} title="House essentials" testid="section-essentials">
          {form.water_shutoff && (
            <div className="mb-4">
              <SubLabel icon={Droplets}>Water shut-off</SubLabel>
              <BodyText text={form.water_shutoff} />
            </div>
          )}
          {form.wifi_shared && (
            <div className="mb-4" data-testid="wifi-shared-block">
              <SubLabel icon={Wifi}>Wi-Fi</SubLabel>
              <BodyText text="The owner will share the Wi-Fi password with you in person." />
            </div>
          )}
          {!form.wifi_shared && form.wifi_password && (
            <div className="mb-4">
              <SubLabel icon={Wifi}>Wi-Fi password</SubLabel>
              <BodyText text={form.wifi_password} />
            </div>
          )}
          {form.other_notes && (
            <div>
              <SubLabel icon={StickyNote}>Notes</SubLabel>
              <BodyText text={form.other_notes} />
            </div>
          )}
        </Section>
      )}

      <Section icon={Users} title="Guests" testid="section-guests">
        <SubLabel icon={Users}>Guests allowed?</SubLabel>
        <BodyText text={form.guests_allowed ? "Yes" : "No"} />
        <p className="text-sm text-[#76706A] mt-2">House rule: close friends only, no parties, no sleepovers.</p>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children, testid }) {
  return (
    <section className="bg-white rounded-3xl p-7 md:p-10 border border-[#E8E4DF]/60 shadow-[0_4px_20px_rgba(62,58,55,0.04)] print-card" data-testid={testid}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-[#F0EBE1] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#8A9A7A]" strokeWidth={2.25} />
        </div>
        <h2 className="font-heading text-2xl font-bold text-[#3E3A37]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Badge({ children, color = "green" }) {
  const map = {
    green: "bg-[#F0EBE1] text-[#3E3A37] border-[#E8E4DF]",
    sand: "bg-[#E3D5CA]/60 text-[#3E3A37] border-[#E3D5CA]",
    peach: "bg-[#F5E6E8] text-[#C58B71] border-[#F5E6E8]",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${map[color]}`}>
      {children}
    </span>
  );
}

function SubLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#76706A]">
      <Icon className="w-4 h-4 text-[#8A9A7A]" />
      {children}
    </div>
  );
}

function BodyText({ text }) {
  return <p className="text-[#3E3A37] leading-relaxed whitespace-pre-wrap">{text}</p>;
}

function hasVetInfo(vet) {
  return !!(vet && (vet.name || vet.phone || vet.address || vet.notes));
}

function VetBlock({ vet, petName }) {
  if (!hasVetInfo(vet)) return null;
  return (
    <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl p-4" data-testid="vet-block">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
        <div className="font-heading font-bold text-[#3E3A37]">{vet.name || "Vet"}</div>
        <div className="text-xs text-[#76706A]">{petName}</div>
      </div>
      {vet.phone && (
        <a href={`tel:${vet.phone}`} className="text-[#8A9A7A] hover:underline font-medium block">{vet.phone}</a>
      )}
      {vet.address && <div className="text-sm text-[#76706A] mt-1">{vet.address}</div>}
      {vet.notes && <p className="text-[#3E3A37] mt-2 whitespace-pre-wrap">{vet.notes}</p>}
    </div>
  );
}

function CalendarRange({ s, e }) {
  const start = parseISODate(s);
  const fmt = { weekday: "long", month: "long", day: "numeric" };
  if (!e || s === e) return <span>{start.toLocaleDateString(undefined, fmt)}</span>;
  const end = parseISODate(e);
  const days = Math.round((end - start) / 86400000) + 1;
  return (
    <span>
      {start.toLocaleDateString(undefined, fmt)} — {end.toLocaleDateString(undefined, fmt)}
      <span className="text-[#76706A] font-normal"> · {days} day{days > 1 ? "s" : ""}</span>
    </span>
  );
}

function parseISODate(s) {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const d = new Date(); d.setHours(h || 0, m || 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
