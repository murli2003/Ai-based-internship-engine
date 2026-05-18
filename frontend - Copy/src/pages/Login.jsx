import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Target,
  TrendingUp,
  Shield,
  AlertCircle,
} from 'lucide-react';

const BRAND_FEATURES = [
  { icon: Sparkles,   text: 'AI-powered internship matching' },
  { icon: Target,     text: 'Explainable recommendations'    },
  { icon: TrendingUp, text: 'Skill gap analysis & learning'  },
  { icon: Shield,     text: 'PM scheme compliant & fair'     },
];

export default function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'student')                                  navigate('/app/dashboard', { replace: true });
      else if (user.role === 'provider' || user.role === 'organization') navigate('/app/provider', { replace: true });
      else if (user.role === 'admin')                               navigate('/app/admin',    { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u.role === 'student')                                  navigate('/app/dashboard');
      else if (u.role === 'provider' || u.role === 'organization') navigate('/app/provider');
      else if (u.role === 'admin')    navigate('/app/admin');
      else                            navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-50">

      {/* ── Left: Brand panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.065]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.18) 1px,transparent 1px)', backgroundSize: '52px 52px' }}
        />
        {/* Orbs */}
        <div className="absolute -top-48 -left-48 h-[36rem] w-[36rem] rounded-full bg-primary-500/20 blur-[80px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />

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
              Welcome back to
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-primary-200 bg-clip-text text-transparent">
                your career journey
              </span>
            </h2>
            <p className="text-primary-200/80 leading-relaxed mb-10 max-w-xs">
              Sign in to access your AI-powered dashboard and continue your internship search.
            </p>

            <ul className="space-y-4">
              {BRAND_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                    <Icon className="h-4 w-4 text-primary-200" />
                  </div>
                  <span className="text-sm font-medium text-primary-100/90">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Testimonial snippet */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm text-primary-100/85 leading-relaxed mb-4">
              "The AI recommendations are incredibly accurate. I got matched with my dream company and landed the internship within 2 weeks."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-soft">
                AM
              </div>
              <div>
                <p className="text-xs font-bold text-white">Aditya Mehta</p>
                <p className="text-xs text-primary-300">B.Tech CSE · IIT Bombay</p>
              </div>
            </div>
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
            New here?{' '}
            <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
              Create account
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-surface-900">Sign in</h1>
              <p className="mt-2 text-surface-500">Enter your credentials to access your account.</p>
            </div>

            <div className="mb-5">
              <GoogleButton label="Continue with Google" />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                  or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="alert-error">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

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
                    placeholder="Enter your password" required autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700 transition-colors p-1 rounded-md hover:bg-surface-100"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm mt-1">
                {loading ? (
                  <><span className="spinner-sm" /> Signing in…</>
                ) : (
                  <>Sign in <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-surface-400 leading-relaxed">
              By signing in you agree to our{' '}
              <a href="#" className="underline text-surface-500 hover:text-surface-700 transition-colors">Terms</a>
              {' '}and{' '}
              <a href="#" className="underline text-surface-500 hover:text-surface-700 transition-colors">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
