import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Plus, LogOut, Calendar, Copy, Trash2, ExternalLink, FileText, Clock, CheckCircle2, Mail, BadgeDollarSign, User as UserIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadForms = async () => {
    try {
      const { data } = await api.get("/forms");
      setForms(data);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadForms(); }, []);

  const handleDelete = async (formId, e) => {
    e?.stopPropagation?.();
    if (!window.confirm("Delete this form? This cannot be undone.")) return;
    try {
      await api.delete(`/forms/${formId}`);
      setForms((prev) => prev.filter((f) => f.form_id !== formId));
      toast.success("Form deleted");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  const copyLink = async (token, e) => {
    e?.stopPropagation?.();
    const link = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Share link copied!");
    } catch {
      toast.error("Copy failed");
    }
  };

  const copyProfileLink = async () => {
    if (!user?.user_id) {
      toast.error("Profile link not ready yet — try again in a moment.");
      return;
    }
    const link = `${window.location.origin}/sitter/${user.user_id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Public profile link copied!");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const pending = forms.filter((f) => f.status !== "completed");
  const completed = forms.filter((f) => f.status === "completed");

  return (
    <div className="min-h-screen bg-[#FAF9F6] grain-bg" data-testid="dashboard-page">
      <header className="sticky top-0 z-40 w-full bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E8E4DF] py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#8A9A7A] flex items-center justify-center">
              <Home className="w-5 h-5 text-white" strokeWidth={2.25} />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-[#3E3A37]">HomeNest</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={copyProfileLink}
              className="pill-btn text-[#76706A] hover:bg-[#F4F3ED] px-4 py-2 hidden sm:inline-flex"
              data-testid="share-profile-button"
              title="Copy your public profile link"
            >
              <Share2 className="w-4 h-4 mr-2" /> Share profile
            </button>
            <Link
              to="/settings/profile"
              className="pill-btn text-[#76706A] hover:bg-[#F4F3ED] px-4 py-2 hidden sm:inline-flex"
              data-testid="profile-link"
            >
              <UserIcon className="w-4 h-4 mr-2" /> Profile
            </Link>
            <Link
              to="/settings/pricing"
              className="pill-btn text-[#76706A] hover:bg-[#F4F3ED] px-4 py-2 hidden sm:inline-flex"
              data-testid="pricing-link"
            >
              <BadgeDollarSign className="w-4 h-4 mr-2" /> Pricing
            </Link>
            <div className="hidden sm:flex items-center gap-3">
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-9 h-9 rounded-full border border-[#E8E4DF]" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#F0EBE1] flex items-center justify-center font-heading font-bold text-[#8A9A7A]">
                  {user?.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <span className="text-sm text-[#3E3A37] font-medium" data-testid="user-name">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="pill-btn text-[#76706A] hover:bg-[#F4F3ED] px-4 py-2"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-[#C58B71] font-semibold text-sm tracking-[0.15em] uppercase mb-2">Your client forms</div>
            <h1 className="font-heading text-4xl sm:text-5xl tracking-tight text-[#3E3A37]">
              Hi {user?.name?.split(" ")[0] || "friend"} 👋
            </h1>
            <p className="text-[#76706A] mt-2 text-lg">Create a new care plan and share it with your client to fill out.</p>
          </div>
          <Link
            to="/forms/new"
            className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] px-8 py-4 shadow-sm font-semibold self-start md:self-auto"
            data-testid="create-form-button"
          >
            <Plus className="w-5 h-5 mr-2" /> New client form
          </Link>
        </div>

        {loading ? (
          <div className="text-[#76706A]">Loading…</div>
        ) : forms.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            {pending.length > 0 && (
              <Group title="Waiting on clients" subtitle="These clients haven't filled out their care plan yet." count={pending.length}>
                <Grid>
                  {pending.map((f) => (
                    <FormCard key={f.form_id} form={f} onDelete={(e) => handleDelete(f.form_id, e)} onCopy={(e) => copyLink(f.share_token, e)} navigate={navigate} />
                  ))}
                </Grid>
              </Group>
            )}
            {completed.length > 0 && (
              <Group title="Completed" subtitle="Care plans submitted by your clients." count={completed.length}>
                <Grid>
                  {completed.map((f) => (
                    <FormCard key={f.form_id} form={f} onDelete={(e) => handleDelete(f.form_id, e)} onCopy={(e) => copyLink(f.share_token, e)} navigate={navigate} />
                  ))}
                </Grid>
              </Group>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Group({ title, subtitle, count, children }) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="font-heading text-2xl font-bold text-[#3E3A37]">{title}</h2>
        <span className="text-sm text-[#A39E98]">{count}</span>
      </div>
      {subtitle && <p className="text-[#76706A] mb-5 -mt-2">{subtitle}</p>}
      {children}
    </section>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>;
}

function EmptyState() {
  return (
    <div className="bg-white border-2 border-dashed border-[#E8E4DF] rounded-3xl p-12 text-center" data-testid="empty-state">
      <div className="w-16 h-16 rounded-full bg-[#F0EBE1] flex items-center justify-center mx-auto mb-5">
        <FileText className="w-8 h-8 text-[#8A9A7A]" />
      </div>
      <h3 className="font-heading text-2xl font-bold text-[#3E3A37] mb-2">Let's send your first form</h3>
      <p className="text-[#76706A] max-w-md mx-auto mb-6">
        Create an intake form for your first client — it takes about 30 seconds. You'll get a cozy link they can use to fill in all the details.
      </p>
      <Link
        to="/forms/new"
        className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] px-8 py-3.5 shadow-sm font-semibold"
        data-testid="empty-create-button"
      >
        <Plus className="w-5 h-5 mr-2" /> New client form
      </Link>
    </div>
  );
}

function FormCard({ form, onDelete, onCopy, navigate }) {
  const isPending = form.status !== "completed";
  const isAwaitingConfirm = !isPending && !form.sitter_confirmed;
  const isConfirmed = !isPending && !!form.sitter_confirmed;
  const petCount = (form.pets || []).length;
  const dateLabel = formatDates(form.date_start, form.date_end);
  const completedAt = form.completed_at ? new Date(form.completed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;

  return (
    <button
      onClick={() => navigate(`/forms/${form.form_id}`)}
      className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(62,58,55,0.04)] border border-[#E8E4DF]/60 hover:shadow-[0_8px_30px_rgba(62,58,55,0.08)] transition-all duration-300 hover:-translate-y-0.5 flex flex-col text-left group"
      data-testid={`form-card-${form.form_id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-xl font-bold text-[#3E3A37] line-clamp-1">{form.title}</h3>
          <p className="text-sm text-[#76706A] mt-1 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate">{form.client_name || form.client_email || "Client"}</span>
          </p>
        </div>
        <StatusBadge isPending={isPending} isAwaitingConfirm={isAwaitingConfirm} isConfirmed={isConfirmed} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 mt-1">
        {isPending ? (
          <span className="inline-flex items-center gap-1.5 text-xs bg-[#F0EBE1] text-[#76706A] px-3 py-1.5 rounded-full">
            Awaiting client
          </span>
        ) : (
          <>
            {dateLabel && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#F0EBE1] text-[#76706A] px-3 py-1.5 rounded-full">
                <Calendar className="w-3.5 h-3.5" /> {dateLabel}
              </span>
            )}
            {petCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#F5E6E8] text-[#C58B71] px-3 py-1.5 rounded-full">
                {petCount} pet{petCount > 1 ? "s" : ""}
              </span>
            )}
            {completedAt && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#F4F3ED] text-[#76706A] px-3 py-1.5 rounded-full">
                Submitted {completedAt}
              </span>
            )}
          </>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-2 border-t border-[#F4F3ED]">
        <button
          onClick={onCopy}
          className="pill-btn bg-[#FAF9F6] border border-[#E8E4DF] text-[#3E3A37] hover:bg-white hover:border-[#8A9A7A] px-3 py-2 text-sm"
          data-testid={`copy-link-${form.form_id}`}
          title="Copy share link"
        >
          <Copy className="w-4 h-4 mr-1.5" /> Copy link
        </button>
        <a
          href={`/share/${form.share_token}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="pill-btn bg-[#FAF9F6] border border-[#E8E4DF] text-[#3E3A37] hover:bg-white hover:border-[#8A9A7A] px-3 py-2 text-sm"
          data-testid={`open-share-${form.form_id}`}
          title="Open client view"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <button
          onClick={onDelete}
          className="ml-auto text-[#C58B71] hover:bg-[#F5E6E8] rounded-full p-2"
          data-testid={`delete-form-${form.form_id}`}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </button>
  );
}

function StatusBadge({ isPending, isAwaitingConfirm, isConfirmed }) {
  if (isConfirmed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#8A9A7A] text-white px-2.5 py-1 rounded-full" data-testid="badge-confirmed">
        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
      </span>
    );
  }
  if (isAwaitingConfirm) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#C58B71] text-white px-2.5 py-1 rounded-full" data-testid="badge-awaiting">
        <Clock className="w-3.5 h-3.5" /> Confirm
      </span>
    );
  }
  if (!isPending) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#8A9A7A] text-white px-2.5 py-1 rounded-full" data-testid="badge-completed">
        <CheckCircle2 className="w-3.5 h-3.5" /> Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#D4A373] text-white px-2.5 py-1 rounded-full" data-testid="badge-pending">
      <Clock className="w-3.5 h-3.5" /> Pending
    </span>
  );
}

function formatDates(start, end) {
  if (!start) return null;
  const parse = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const s = parse(start);
  const e = end ? parse(end) : null;
  const fmt = { month: "short", day: "numeric" };
  if (!e || s.toDateString() === e.toDateString()) return s.toLocaleDateString(undefined, fmt);
  return `${s.toLocaleDateString(undefined, fmt)} – ${e.toLocaleDateString(undefined, fmt)}`;
}
