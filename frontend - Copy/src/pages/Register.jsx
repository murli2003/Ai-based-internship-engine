import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleButton from '../components/GoogleButton';
import {
  Briefcase,
  Eye,
  EyeOff,
  ArrowRight,
  Star,
  CheckCircle,
  Sparkles,
  Shield,
  GraduationCap,
  Building2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

const BRAND_BENEFITS = [
  { icon: GraduationCap, text: '12,000+ students already placed',   sub: 'Join a thriving community'         },
  { icon: Sparkles,      text: 'AI match score for every role',       sub: 'Know your fit before applying'     },
  { icon: TrendingUp,    text: '94% placement rate',                  sub: 'Industry-leading results'          },
  { icon: Shield,        text: 'PM scheme compliant',                 sub: 'Fair & transparent for all'        },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const len = password.length;
  const strength = len >= 10 ? 3 : len >= 8 ? 2 : len >= 6 ? 1 : 0;
  const labels = ['Too short', 'Weak', 'Good', 'Strong'];
  const colors  = ['bg-danger-500', 'bg-warning-400', 'bg-accent-500', 'bg-success-500'];
  const textColors = ['text-danger-600', 'text-warning-600', 'text-accent-600', 'text-success-600'];
  const widths  = ['w-1/4', 'w-2/4', 'w-3/4', 'w-full'];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="h-1.5 w-full rounded-full bg-surface-200 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colors[strength]} ${widths[strength]}`} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${textColors[strength]}`}>{labels[strength]}</span>
        {strength < 3 && <span className="text-surface-400">Use 10+ characters for a strong password</span>}
      </div>
    </div>
  );
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole]                 = useState(searchParams.get('role') === 'provider' ? 'provider' : 'student');
  const [fullName, setFullName]         = useState('');
  const [orgName, setOrgName]           = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'student')       navigate('/app/dashboard', { replace: true });
      else if (user.role === 'provider') navigate('/app/provider',  { replace: true });
      else                               navigate('/app/admin',      { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { email, password, role };
      if (role === 'student') {
        payload.fullName = fullName;
      } else {
        payload.orgName     = orgName;
        payload.companyName = orgName;
      }
      const u = await register(payload);
      if (u.role === 'student') navigate('/app/dashboard');
      else                      navigate('/app/provider');
    } catch (err) {
      setError(err.response?.data?.message || err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-50">

      {/* ── Left: Brand panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div
          className="absolute inset-0 opacity-[0.065]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.18) 1px,transparent 1px)', backgroundSize: '52px 52px' }}
        />
        <div className="absolute -top-48 -left-48 h-[36rem] w-[36rem] rounded-full bg-primary-500/20 blur-[80px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary-600/15 blur-3xl" />

        <div className="relative flex h-full flex-col px-10 py-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold text-white tracking-tight">InternMatch</span>
            <span className="rounded-full border border-primary-600/50 bg-primary-700/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-200">AI</span>
          </Link>

          {/* Main copy */}
          <div className="flex flex-1 flex-col justify-center py-16">
            <h2 className="text-3xl font-extrabold text-white leading-snug mb-3">
              Join India's smartest
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-primary-200 bg-clip-text text-transparent">
                internship platform
              </span>
            </h2>
            <p className="text-primary-200/80 leading-relaxed mb-10 max-w-xs">
              Build your profile once. Let AI find the best opportunities for you.
            </p>

            <ul className="space-y-5">
              {BRAND_BENEFITS.map(({ icon: Icon, text, sub }) => (
                <li key={text} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 mt-0.5">
                    <Icon className="h-4 w-4 text-primary-200" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{text}</p>
                    <p className="text-xs text-primary-300/80 mt-0.5">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
            ))}
            <span className="ml-1 text-sm font-extrabold text-primary-200">4.9</span>
            <span className="text-sm text-primary-400">· 2,400+ reviews</span>
          </div>
        </div>
      </div>

      {/* ── Right: Form panel ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col border-l border-surface-200 bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-5 lg:px-10">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-surface-900">InternMatch AI</span>
          </Link>
          <div className="hidden lg:block" />

          <p className="text-sm text-surface-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <h1 className="text-3xl font-extrabold tracking-tight text-surface-900">Create your account</h1>
              <p className="mt-2 text-surface-500">Free forever for students. Set up in 2 minutes.</p>
            </div>

            {/* Role toggle */}
            <div className="flex rounded-xl border border-surface-200 bg-surface-50 p-1 mb-6">
              {[
                { id: 'student',  label: 'Student',  Icon: GraduationCap },
                { id: 'provider', label: 'Provider', Icon: Building2     },
              ].map(({ id, label, Icon }) => (
                <button key={id} type="button" onClick={() => setRole(id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                    role === id
                      ? 'bg-white text-primary-700 border border-primary-200 shadow-xs'
                      : 'text-surface-500 hover:text-surface-800'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${role === id ? 'text-primary-600' : 'text-surface-400'}`} />
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <GoogleButton label={`Sign up with Google as ${role}`} />
            </div>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                  or register with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="alert-error">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="name" className="form-label">
                  {role === 'student' ? 'Full name' : 'Organization name'}
                </label>
                <input id="name" type="text" value={role === 'student' ? fullName : orgName}
                  onChange={e => role === 'student' ? setFullName(e.target.value) : setOrgName(e.target.value)}
                  className="input-field" placeholder={role === 'student' ? 'Your full name' : 'Company or institute name'} autoComplete="name" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="form-label">Email address</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field" placeholder="you@example.com" required autoComplete="email" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} className="input-field pr-12"
                    placeholder="At least 6 characters" required minLength={6} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700 transition-colors p-1 rounded-md hover:bg-surface-100"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm mt-2">
                {loading ? (
                  <><span className="spinner-sm" /> Creating account…</>
                ) : (
                  <>Create {role === 'student' ? 'student' : 'provider'} account <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            {role === 'student' && (
              <div className="alert-success mt-5">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <p className="text-xs font-medium">Free for students — no credit card ever required.</p>
              </div>
            )}

            <p className="mt-5 text-center text-xs text-surface-400 leading-relaxed">
              By registering you agree to our{' '}
              <a href="#" className="underline text-surface-500 hover:text-surface-700 transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline text-surface-500 hover:text-surface-700 transition-colors">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
