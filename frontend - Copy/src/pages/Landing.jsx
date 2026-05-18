import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Search,
  BookOpen,
  Scale,
  Building2,
  BarChart3,
  Briefcase,
  Users,
  FileCheck,
  Target,
  UserCircle,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle,
  Star,
  Brain,
  Award,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
  Zap,
  Globe,
} from 'lucide-react';

/* ── Animated counter hook ────────────────────────────────────── */
function useCounter(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const step = (ts) => {
          const progress = Math.min((ts - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 4);
          setCount(Math.floor(ease * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return [count, ref];
}

/* ── Data ─────────────────────────────────────────────────────── */
const STATS = [
  { value: 12000, suffix: '+', label: 'Students matched',   icon: GraduationCap, trend: '+28% this month' },
  { value: 850,   suffix: '+', label: 'Active internships', icon: Briefcase,      trend: '12+ sectors'     },
  { value: 320,   suffix: '+', label: 'Partner companies',  icon: Building2,      trend: 'India-wide'      },
  { value: 94,    suffix: '%', label: 'Placement rate',     icon: TrendingUp,     trend: 'Industry best'   },
];

const PLATFORM_FEATURES = [
  { Icon: UserCircle, n: '01', title: 'Professional Profile',    desc: 'Build one profile with skills, education, CGPA, and preferences. Power every application from a single source of truth.',        badge: 'LinkedIn-style' },
  { Icon: Search,     n: '02', title: 'Smart Discovery',         desc: 'Browse by domain, location, and mode. Filter by stipend and duration. Only see roles you\'re eligible for.',                    badge: 'Filtered for you' },
  { Icon: FileCheck,  n: '03', title: 'Apply & Track',           desc: 'One-click apply. Track every application — pending, shortlisted, accepted, or rejected — all in one dashboard.',                badge: 'Real-time status' },
  { Icon: Sparkles,   n: '04', title: 'AI-Powered Matching',     desc: 'Get a ranked list of internships that match your profile. Each card includes a match score and a plain-English explanation.',    badge: 'Explainable AI'   },
  { Icon: BookOpen,   n: '05', title: 'Skill Gap Analysis',      desc: 'See exactly which skills you\'re missing for each role. Get curated learning links so you can upskill before applying.',         badge: 'Close gaps fast'  },
  { Icon: Building2,  n: '06', title: 'Recruiter Portal',        desc: 'Post internships, view AI-ranked candidates, manage applications. Shortlist and accept from one clean dashboard.',               badge: 'For companies'    },
  { Icon: BarChart3,  n: '07', title: 'Analytics & Insights',    desc: 'Admin dashboards for allocation by domain and status. PM scheme rules and reservation-aware ranking built in.',                  badge: 'Transparent'      },
  { Icon: Shield,     n: '08', title: 'Trust & Compliance',      desc: 'Eligibility rules, reservation categories, and audit-friendly design. Built for institutional and government schemes.',          badge: 'Compliant'        },
];

const AI_FEATURES = [
  { Icon: Target,   title: 'Smart Matching',          desc: 'Content-based scoring with cosine similarity on skills, domain, location, and student preferences.',            color: 'from-blue-500 to-cyan-500'     },
  { Icon: Brain,    title: 'Explainable AI',           desc: 'Every recommendation shows why: academic fit, skill overlap, location match, and domain alignment in plain English.', color: 'from-violet-500 to-purple-500' },
  { Icon: BookOpen, title: 'Skill Gap Analysis',       desc: 'Missing skills are listed per internship with curated learning resources so you can prepare before applying.',   color: 'from-amber-500 to-orange-500'  },
  { Icon: Scale,    title: 'Fairness Layer',           desc: 'Reservation-aware ranking and PM scheme rules ensure equitable visibility for every student across all backgrounds.', color: 'from-emerald-500 to-teal-500'  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Build Your Profile',  desc: 'Add education, skills, CGPA, and preferences. The more complete your profile, the better your AI-powered matches.',    icon: UserCircle  },
  { step: '02', title: 'Get AI-Matched',      desc: 'Our engine filters by eligibility and scores fit. You see a ranked list with match percentages and explanations.',      icon: Sparkles    },
  { step: '03', title: 'Apply & Succeed',     desc: 'One-click apply. Track every status. Use skill gap insights to prepare stronger applications for your next role.',      icon: Award       },
];

const TESTIMONIALS = [
  { quote: 'I landed my dream internship at a top tech firm within 2 weeks. The skill gap feature showed me exactly what to learn first — game-changing.',   name: 'Aditya Mehta', role: 'B.Tech CSE',  org: 'IIT Bombay',   avatar: 'AM', rating: 5, color: 'from-blue-400 to-blue-600'   },
  { quote: 'We saved 60% of our screening time. The AI ranks candidates perfectly for our roles — we now only interview the best-fit applicants.',            name: 'Priya Sharma', role: 'HR Lead',     org: 'InnovateTech', avatar: 'PS', rating: 5, color: 'from-violet-400 to-purple-600' },
  { quote: 'As a student from a tier-2 college, I worried about fair chances. The fairness layer made a real difference — I got shortlisted at 3 companies.', name: 'Riya Patel',   role: 'MBA Finance', org: 'NIBM Pune',    avatar: 'RP', rating: 5, color: 'from-emerald-400 to-teal-600' },
];

/* ── Sub-components ───────────────────────────────────────────── */
function StatCard({ value, suffix, label, icon: Icon, trend }) {
  const [count, ref] = useCounter(value);
  return (
    <div ref={ref} className="group flex flex-col items-center py-7 px-5 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-xs group-hover:bg-primary-100 group-hover:shadow-glow-sm transition-all duration-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-3xl font-extrabold tabular-nums text-surface-900 tracking-tight">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-1 text-sm font-semibold text-surface-700">{label}</div>
      <div className="mt-1 text-xs font-medium text-primary-500">{trend}</div>
    </div>
  );
}

function FeatureCard({ Icon, n, title, desc, badge }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated hover:border-primary-200">
      <div className="flex items-start justify-between mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-xs group-hover:bg-primary-100 transition-colors">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-mono text-xs font-bold text-surface-200 group-hover:text-primary-200 transition-colors">{n}</span>
      </div>
      <h3 className="text-base font-bold text-surface-900 mb-2 leading-snug">{title}</h3>
      <p className="text-sm text-surface-500 leading-relaxed mb-4">{desc}</p>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 border border-primary-100">
        <CheckCircle className="h-3 w-3" />
        {badge}
      </span>
    </div>
  );
}

function AIFeatureCard({ Icon, title, desc, color }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/15 hover:-translate-y-0.5">
      <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-soft`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-primary-200/75 leading-relaxed">{desc}</p>
    </div>
  );
}

function TestimonialCard({ quote, name, role, org, avatar, rating, color }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex gap-0.5">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="flex-1 text-sm text-surface-700 leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-3 pt-3 border-t border-surface-100">
        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-soft`}>
          {avatar}
        </div>
        <div>
          <p className="text-sm font-bold text-surface-900">{name}</p>
          <p className="text-xs text-surface-500">{role} · {org}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function Landing() {
  const { user } = useAuth();
  const dashboardHref =
    user?.role === 'provider' ? '/app/provider' :
    user?.role === 'admin'    ? '/app/admin'    : '/app/dashboard';

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const NAV_LINKS = [
    { label: 'Platform',     href: '#platform'     },
    { label: 'AI',           href: '#ai'           },
    { label: 'How it works', href: '#how'          },
    { label: 'Reviews',      href: '#testimonials' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-surface-800 overflow-x-hidden">

      {/* ── Navbar ───────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-surface-200/80 bg-white/96 backdrop-blur-xl shadow-xs'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-soft group-hover:shadow-glow-sm transition-shadow">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-extrabold text-surface-900 tracking-tight">InternMatch</span>
            <span className="rounded-full bg-primary-100 border border-primary-200/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700">AI</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="relative text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors group"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link to={dashboardHref} className="btn-primary text-sm py-2 gap-1.5">
                Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex btn-secondary text-sm py-2">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm py-2">Get started free</Link>
              </>
            )}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-100 transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-surface-200 bg-white px-4 py-3 space-y-1 shadow-elevated animate-slide-down">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5 text-surface-400" />
                {label}
              </a>
            ))}
            {!user && (
              <div className="pt-3 mt-3 border-t border-surface-100 space-y-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary w-full justify-center">Sign in</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center">Get started free</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-950 via-primary-900 to-primary-800">
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.065]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.18) 1px,transparent 1px)', backgroundSize: '56px 56px' }}
        />
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-64 -left-64 h-[44rem] w-[44rem] rounded-full bg-primary-500/20 blur-[80px]" />
        <div className="pointer-events-none absolute -top-20 right-0 h-[32rem] w-[32rem] rounded-full bg-cyan-500/15 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-48 w-full max-w-3xl bg-gradient-to-t from-primary-900/70 to-transparent" />

        <div className="relative mx-auto max-w-5xl px-4 pt-24 pb-32 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-primary-600/50 bg-primary-800/60 px-4 py-2 text-xs font-semibold text-primary-200 backdrop-blur-sm shadow-lg">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse-soft" />
            AI-Powered · PM Scheme Compliant · Free for Students
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.07]">
            Find the right internship
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-200 to-primary-300 bg-clip-text text-transparent">
              before it finds you
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-7 max-w-2xl mx-auto text-lg text-primary-200/85 leading-relaxed">
            India's intelligent internship platform. One profile, AI-matched recommendations,
            skill gap analysis, and explainable results — built for students and recruiters.
          </p>

          {/* CTA group */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link to={dashboardHref} className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-sm font-bold text-primary-800 shadow-elevated hover:bg-primary-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-intense">
                Go to my dashboard
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-sm font-bold text-primary-800 shadow-elevated hover:bg-primary-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-intense">
                  Get started — it's free
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-primary-500/50 bg-primary-800/40 px-7 py-4 text-sm font-semibold text-primary-100 hover:bg-primary-700/60 transition-all duration-200 backdrop-blur-sm">
                  Sign in to your account
                </Link>
              </>
            )}
          </div>

          {/* Trust micro-copy */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-primary-400">
            {['No credit card required', 'Free for students forever', 'Set up in 2 minutes'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-success-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="relative z-10 -mt-12 mx-4 sm:mx-6 lg:mx-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-surface-200/80 bg-white shadow-elevated overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-surface-100">
            {STATS.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform features ────────────────────────────────── */}
      <section id="platform" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-28">
        <div className="text-center mb-16">
          <span className="section-eyebrow mb-4">Everything you need</span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-surface-900 sm:text-5xl">
            Platform features
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-lg text-surface-500 leading-relaxed">
            From profile to placement — essential tools for students and companies, in one place.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM_FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── AI features (dark section) ───────────────────────── */}
      <section id="ai" className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-surface-950 py-28">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-[32rem] rounded-full bg-secondary-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-eyebrow-dark mb-4">Intelligence Layer</span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              AI that explains itself
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-lg text-primary-300/80 leading-relaxed">
              Matching, explanations, skill gaps, and fairness — all transparent and actionable.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AI_FEATURES.map((f) => (
              <AIFeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-28">
        <div className="text-center mb-16">
          <span className="section-eyebrow mb-4">Simple process</span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-surface-900 sm:text-5xl">
            Profile to placement in 3 steps
          </h2>
          <p className="mt-4 text-lg text-surface-500">No complexity. No guesswork. Just results.</p>
        </div>

        <div className="grid gap-12 sm:grid-cols-3 relative">
          {/* Connector */}
          <div className="hidden sm:block absolute top-[3.25rem] left-[34%] right-[34%] h-px bg-gradient-to-r from-transparent via-primary-300 to-transparent" />

          {HOW_IT_WORKS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="group relative flex flex-col items-center text-center z-10">
                <div className="relative mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow-sm group-hover:shadow-glow-primary transition-shadow duration-300">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-primary-200 shadow-xs">
                    <span className="text-[10px] font-extrabold text-primary-600">{s.step}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">{s.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed max-w-[220px]">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section id="testimonials" className="bg-surface-50/70 py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-eyebrow mb-4">What people say</span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-surface-900 sm:text-5xl">
              Trusted by thousands
            </h2>
            <div className="mt-4 flex items-center justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
              ))}
              <span className="ml-2 text-sm font-bold text-surface-700">4.9 / 5</span>
              <span className="text-sm text-surface-400">· 2,400+ reviews</span>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-8 py-20 text-center">
          {/* Decoration */}
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 15% 85%, rgba(255,255,255,0.4) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.3) 0%, transparent 40%)' }} />
          <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-64 w-[40rem] rounded-full bg-primary-600/30 blur-3xl" />

          <div className="relative">
            <span className="inline-block rounded-full border border-primary-500/40 bg-primary-800/60 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-200 backdrop-blur-sm">
              Start today
            </span>
            <h2 className="mt-5 text-4xl font-extrabold text-white sm:text-5xl leading-tight">
              Your next internship<br />is waiting
            </h2>
            <p className="mt-5 max-w-lg mx-auto text-primary-200/85 leading-relaxed">
              Join thousands of students who found the right fit through AI matching.
              Register free in under 2 minutes.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link to={dashboardHref} className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-sm font-bold text-primary-800 shadow-elevated hover:bg-primary-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-intense">
                  Go to my dashboard
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link to="/register?role=student" className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-sm font-bold text-primary-800 shadow-elevated hover:bg-primary-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-intense">
                    <GraduationCap className="h-4 w-4 text-primary-600" />
                    Register as student
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link to="/register?role=provider" className="inline-flex items-center gap-2.5 rounded-xl border border-primary-400/60 bg-white/10 px-7 py-4 text-sm font-semibold text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm">
                    <Building2 className="h-4 w-4" />
                    Post internships
                  </Link>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-primary-300">
              {['Free for students', 'No card required', 'PM scheme compliant'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-success-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-surface-200 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-soft">
                  <Briefcase className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-extrabold text-surface-900 tracking-tight">InternMatch AI</span>
              </div>
              <p className="text-sm text-surface-500 leading-relaxed max-w-xs">
                Intelligent internship placement with AI-powered matching and PM scheme compliance.
              </p>
              <div className="mt-5 flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                ))}
                <span className="ml-1 text-xs font-medium text-surface-500">Rated 4.9/5 by students</span>
              </div>
            </div>

            <div>
              <p className="mb-4 text-xs font-extrabold uppercase tracking-wider text-surface-900">Platform</p>
              <ul className="space-y-2.5">
                {[{ l: 'Features', h: '#platform' }, { l: 'AI Technology', h: '#ai' }, { l: 'How it works', h: '#how' }, { l: 'Reviews', h: '#testimonials' }].map(({ l, h }) => (
                  <li key={l}><a href={h} className="text-sm text-surface-500 hover:text-surface-900 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-xs font-extrabold uppercase tracking-wider text-surface-900">For</p>
              <ul className="space-y-2.5">
                {[{ l: 'Students', h: '/register?role=student' }, { l: 'Providers', h: '/register?role=provider' }, { l: 'Sign in', h: '/login' }].map(({ l, h }) => (
                  <li key={l}><Link to={h} className="text-sm text-surface-500 hover:text-surface-900 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-xs font-extrabold uppercase tracking-wider text-surface-900">Legal</p>
              <ul className="space-y-2.5">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((l) => (
                  <li key={l}><a href="#" className="text-sm text-surface-500 hover:text-surface-900 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-surface-200 px-4 py-5">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-surface-400">© 2026 InternMatch AI. All rights reserved.</p>
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <Shield className="h-3.5 w-3.5 text-success-500" />
              Secured · PM scheme compliant
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
