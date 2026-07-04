import { Link } from "react-router-dom";
import { Home, Calendar, PawPrint, Sparkles, ArrowRight, CheckCircle2, Heart, Share2, UserPlus, ClipboardList, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const HERO_IMG = "https://images.pexels.com/photos/31737480/pexels-photo-31737480.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const INTERIOR_IMG = "https://images.unsplash.com/photo-1632504102612-6ab73f6cf0e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjBtaW5pbWFsJTIwd2FybSUyMGludGVyaW9yfGVufDB8fHx8MTc3NzMxODQ5Nnww&ixlib=rb-4.1.0&q=85";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="sticky top-0 z-50 w-full bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E8E4DF] py-4" data-testid="landing-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <div className="w-9 h-9 rounded-full bg-[#8A9A7A] flex items-center justify-center">
              <Home className="w-5 h-5 text-white" strokeWidth={2.25} />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-[#3E3A37]">HomeNest</span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard" className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] shadow-sm" data-testid="nav-dashboard">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="pill-btn text-[#3E3A37] hover:bg-[#F4F3ED]" data-testid="nav-login">
                  Log in
                </Link>
                <Link to="/register" className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] shadow-sm" data-testid="nav-signup">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 md:pt-24 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7 fade-up">
            <div className="inline-flex items-center gap-2 bg-[#F0EBE1] text-[#76706A] text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[#C58B71]" />
              For house-sitters who care about the details
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-[#3E3A37] mb-6">
              Send clients a warm, <span className="text-[#8A9A7A]">organized intake form.</span>
            </h1>
            <p className="text-lg text-[#76706A] leading-relaxed max-w-xl mb-8">
              Create a beautiful care-plan form, send it to your client, and get back every detail you need —
              feeding schedules, pet names, emergency contacts, water shut-offs — before you even arrive.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="pill-btn bg-[#8A9A7A] text-white hover:bg-[#788769] px-8 py-4 shadow-sm hover:shadow-md text-base font-semibold"
                data-testid="hero-cta-primary"
              >
                Start free <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/login"
                className="pill-btn border-2 border-[#E8E4DF] text-[#3E3A37] hover:border-[#8A9A7A] hover:bg-white px-8 py-4 text-base"
                data-testid="hero-cta-secondary"
              >
                I have an account
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-10 text-sm text-[#76706A]">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#8A9A7A]"/> Free while you grow</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#8A9A7A]"/> Share by link or email</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#8A9A7A]"/> Printable care plans</div>
            </div>
          </div>

          <div className="md:col-span-5 fade-up">
            <div className="relative">
              <div className="absolute -inset-6 bg-[#E3D5CA] rounded-[48px] -rotate-2 opacity-70" aria-hidden />
              <img
                src={HERO_IMG}
                alt="Dog resting comfortably in a warm living room"
                className="relative w-full h-[460px] object-cover rounded-[40px] shadow-[0_12px_40px_rgba(62,58,55,0.12)]"
                data-testid="hero-image"
              />
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 border border-[#E8E4DF]">
                <div className="w-10 h-10 rounded-full bg-[#F5E6E8] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#C58B71]" />
                </div>
                <div>
                  <div className="font-heading font-bold text-sm text-[#3E3A37]">Every detail, in one place</div>
                  <div className="text-xs text-[#76706A]">No more scattered texts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F3ED] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-[#C58B71] font-semibold text-sm tracking-[0.15em] uppercase mb-3">How it works</div>
            <h2 className="font-heading text-3xl sm:text-4xl tracking-tight text-[#3E3A37]">Three simple steps to a perfect care plan</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "01", icon: UserPlus, title: "Create a form", copy: "Sign up, give the form a name, and add your client's email. That's it." },
              { n: "02", icon: Mail, title: "Share with your client", copy: "Copy the link or send a warm email invite. They fill it in on their own time." },
              { n: "03", icon: ClipboardList, title: "Arrive prepared", copy: "Get every detail — pets, feeding times, walks, tasks, emergency contacts — before you show up." },
            ].map(({ n, icon: Icon, title, copy }, i) => (
              <div
                key={title}
                className="bg-white rounded-3xl p-7 shadow-[0_4px_20px_rgba(62,58,55,0.04)] border border-[#E8E4DF]/60 hover:shadow-[0_8px_30px_rgba(62,58,55,0.08)] transition-all duration-300 hover:-translate-y-1"
                data-testid={`step-card-${i}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F0EBE1] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#8A9A7A]" strokeWidth={2.25} />
                  </div>
                  <span className="text-sm font-heading font-bold text-[#C58B71]">{n}</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-[#3E3A37] mb-2">{title}</h3>
                <p className="text-[#76706A] leading-relaxed">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-[#C58B71] font-semibold text-sm tracking-[0.15em] uppercase mb-3">Your clients fill in</div>
            <h2 className="font-heading text-3xl sm:text-4xl tracking-tight text-[#3E3A37]">Six thoughtful questions, one complete plan</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Calendar, title: "Dates away", copy: "The exact window they'll be out of town." },
              { icon: Home, title: "Stay requirements", copy: "Overnight stay, bed provided, or bring your own." },
              { icon: PawPrint, title: "Pets & names", copy: "Dog, cat, bird, fish, rabbit, reptile or other." },
              { icon: Sparkles, title: "Feeding & walks", copy: "A schedule per pet, with amounts and walk frequency." },
              { icon: ClipboardList, title: "Other tasks", copy: "Plants, mail, trash, or anything else they need." },
              { icon: Heart, title: "Emergency info", copy: "Vet, neighbors, water shut-off, and house quirks." },
            ].map(({ icon: Icon, title, copy }, i) => (
              <div
                key={title}
                className="bg-[#FAF9F6] rounded-2xl p-5 border border-[#E8E4DF]/60"
                data-testid={`detail-card-${i}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-[#E8E4DF]">
                    <Icon className="w-4 h-4 text-[#8A9A7A]" strokeWidth={2.5} />
                  </div>
                  <h4 className="font-heading font-bold text-[#3E3A37]">{title}</h4>
                </div>
                <p className="text-sm text-[#76706A] leading-relaxed">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 pb-24">
        <div className="relative rounded-[40px] overflow-hidden bg-[#3E3A37]" style={{ backgroundImage: `url(${INTERIOR_IMG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-[#3E3A37]/55" />
          <div className="relative px-8 sm:px-12 py-16 sm:py-20 max-w-2xl">
            <h2 className="font-heading text-3xl sm:text-4xl text-white leading-tight mb-4">Show up to every house like a true professional.</h2>
            <p className="text-white/85 text-lg mb-8">Clients feel cared for before you even walk in the door — and you arrive knowing every detail.</p>
            <Link to={user ? "/dashboard" : "/register"} className="pill-btn bg-white text-[#3E3A37] hover:bg-[#F4F3ED] px-8 py-4 shadow-sm font-semibold" data-testid="banner-cta">
              Create your first form <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E8E4DF] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-wrap items-center justify-between gap-4 text-sm text-[#76706A]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#8A9A7A] flex items-center justify-center">
              <Home className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-[#3E3A37]">HomeNest</span>
          </div>
          <div>Made with warmth for house-sitters who treat every home like their own.</div>
        </div>
      </footer>
    </div>
  );
}
