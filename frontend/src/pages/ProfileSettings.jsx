import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, ArrowLeft, Save, User as UserIcon, Image as ImageIcon, Phone, MapPin,
  Languages, Award, BadgeCheck, Upload, Trash2, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { resizeImageFile } from "../lib/image";

const EMPTY = {
  name: "",
  bio: "",
  picture: "",
  phone: "",
  location: "",
  languages: "",
  years_experience: 0,
  services: [],
  certifications: "",
  verified_sits: 0,
};

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [profile, setProfile] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/me/profile");
        setProfile({ ...EMPTY, ...data, services: data.services || [] });
      } catch (err) {
        toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = (k, v) => setProfile((prev) => ({ ...prev, [k]: v }));

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImageFile(file, { maxSize: 400, quality: 0.85 });
      setField("picture", dataUrl);
      toast.success("Photo ready — don't forget to save.");
    } catch (err) {
      toast.error(err.message || "Could not process that image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = () => setField("picture", "");

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/me/profile", {
        name: profile.name,
        bio: profile.bio,
        picture: profile.picture,
        phone: profile.phone,
        location: profile.location,
        languages: profile.languages,
        years_experience: Number(profile.years_experience) || 0,
        services: profile.services,
        certifications: profile.certifications,
      });
      setProfile({ ...EMPTY, ...data, services: data.services || [] });
      // Refresh the cached auth user so the dashboard / header pick up the new name.
      checkAuth?.().catch(() => {});
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not save profile");
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
    <div className="min-h-screen bg-[#FAF9F6] grain-bg" data-testid="profile-settings">
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
          <div className="text-[#C58B71] font-semibold text-xs tracking-[0.2em] uppercase mb-3">Your profile</div>
          <h1 className="font-heading text-4xl sm:text-5xl tracking-tight text-[#3E3A37] mb-3">Introduce yourself</h1>
          <p className="text-[#76706A] text-lg max-w-xl mx-auto">
            Clients see this on the form you send — a friendly photo, a short bio, and what you do best. The more they know, the more they trust.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5 fade-up" data-testid="profile-form">
          <Card>
            <SectionTitle icon={UserIcon} title="Photo & bio" />
            <div className="space-y-4">
              <div className="block">
                <span className="block text-sm font-semibold text-[#3E3A37] mb-2">Profile picture</span>
                <div className="flex items-center gap-4">
                  {profile.picture ? (
                    <img src={profile.picture} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#F0EBE1] flex items-center justify-center border-2 border-white shadow-sm">
                      <ImageIcon className="w-7 h-7 text-[#A39E98]" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFilePick}
                      className="hidden"
                      data-testid="profile-picture-input"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="pill-btn bg-[#F0EBE1] text-[#3E3A37] hover:bg-[#E8E0D0] disabled:opacity-60 px-4 py-2 text-sm font-semibold inline-flex items-center"
                      data-testid="profile-picture-upload"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Processing…" : profile.picture ? "Replace photo" : "Upload photo"}
                    </button>
                    {profile.picture && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="pill-btn text-[#76706A] hover:bg-[#F4F3ED] px-3 py-2 text-sm inline-flex items-center"
                        data-testid="profile-picture-remove"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" /> Remove
                      </button>
                    )}
                  </div>
                </div>
                <span className="block text-xs text-[#A39E98] mt-1.5">
                  JPG or PNG up to 10MB — we'll resize it for you.
                </span>
              </div>

              <label className="block">
                <span className="block text-sm font-semibold text-[#3E3A37] mb-2">Display name</span>
                <input
                  type="text"
                  value={profile.name || ""}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="How clients should see you (e.g. Sam Carter)"
                  maxLength={80}
                  className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10"
                  data-testid="profile-name"
                />
                <span className="block text-xs text-[#A39E98] mt-1.5">
                  Shown on your public profile and on every form intro.
                </span>
              </label>

              <div
                className="flex items-center gap-3 rounded-2xl bg-[#F0EBE1] border border-[#8A9A7A]/20 px-4 py-3"
                data-testid="verified-sits-card"
              >
                <div className="w-10 h-10 rounded-full bg-[#8A9A7A] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-bold text-[#3E3A37]" data-testid="verified-sits-count">
                    {profile.verified_sits || 0} verified sit{profile.verified_sits === 1 ? "" : "s"}
                  </div>
                  <div className="text-sm text-[#76706A]">
                    A trust badge clients see on your profile and form intro. Updated automatically as your sits get verified.
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="block text-sm font-semibold text-[#3E3A37] mb-2">Short bio</span>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  placeholder="A few warm words your clients will see — e.g. 'Animal-loving sitter, 5 years experience, dogs & cats welcome.'"
                  rows={4}
                  maxLength={600}
                  className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10"
                  data-testid="profile-bio"
                />
                <span className="block text-xs text-[#A39E98] mt-1.5 text-right">
                  {(profile.bio || "").length}/600
                </span>
              </label>
            </div>
          </Card>

          <Card>
            <SectionTitle icon={MapPin} title="About you" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={MapPin} label="Location / area you cover" value={profile.location} onChange={(v) => setField("location", v)} placeholder="e.g. Brooklyn, NY" testid="profile-location" />
              <Field icon={Phone} label="Phone" value={profile.phone} onChange={(v) => setField("phone", v)} placeholder="(555) 123-4567" testid="profile-phone" />
              <Field icon={Languages} label="Languages spoken" value={profile.languages} onChange={(v) => setField("languages", v)} placeholder="English, Spanish" testid="profile-languages" />
              <Field icon={Award} label="Years of experience" type="number" value={profile.years_experience} onChange={(v) => setField("years_experience", v)} placeholder="3" testid="profile-experience" min={0} max={80} />
            </div>
          </Card>

          <Card>
            <SectionTitle icon={BadgeCheck} title="Certifications & references" />
            <textarea
              value={profile.certifications}
              onChange={(e) => setField("certifications", e.target.value)}
              placeholder="e.g. Pet First Aid certified · Background-checked · References available on request"
              rows={4}
              maxLength={600}
              className="w-full bg-white border-2 border-[#E8E4DF] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10"
              data-testid="profile-certifications"
            />
            <span className="block text-xs text-[#A39E98] mt-1.5 text-right">
              {(profile.certifications || "").length}/600
            </span>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/dashboard" className="pill-btn text-[#76706A] hover:bg-[#F4F3ED] px-6 py-3" data-testid="cancel-profile">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] disabled:opacity-60 px-8 py-3 shadow-sm font-semibold"
              data-testid="save-profile"
            >
              <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
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

function Field({ icon: Icon, label, value, onChange, type = "text", placeholder, testid, min, max }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#3E3A37] mb-2">{label}</span>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-[#A39E98] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          className={`w-full bg-white border-2 border-[#E8E4DF] rounded-xl py-2.5 focus:outline-none focus:border-[#8A9A7A] focus:ring-2 focus:ring-[#8A9A7A]/10 ${Icon ? "pl-9 pr-3" : "px-3"}`}
          data-testid={testid}
        />
      </div>
    </label>
  );
}
