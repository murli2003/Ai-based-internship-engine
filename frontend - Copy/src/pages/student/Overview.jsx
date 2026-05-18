import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Award, CheckCircle, Target, Brain, Briefcase,
  ArrowRight, ChevronRight, User, Activity, Lightbulb, BookOpen,
  TrendingUp, Zap, Cpu, Upload,
} from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';
import { useAuth } from '../../context/AuthContext';
import { getProfileCompletion, getMissingFields } from '../../utils/profileCompletion';
import { SkeletonCard } from '../../components/Skeleton';
import RecommendationCard from '../../components/RecommendationCard';

const STATUS_CONFIG = {
  applied:     { label: 'Applied',     bg: 'bg-primary-100',   text: 'text-primary-700',   dot: 'bg-primary-500'   },
  shortlisted: { label: 'Shortlisted', bg: 'bg-warning-100',   text: 'text-warning-700',   dot: 'bg-warning-500'   },
  accepted:    { label: 'Accepted',    bg: 'bg-success-100',   text: 'text-success-700',   dot: 'bg-success-500'   },
  rejected:    { label: 'Rejected',    bg: 'bg-surface-100',   text: 'text-surface-500',   dot: 'bg-surface-400'   },
  pending:     { label: 'Pending',     bg: 'bg-warning-100',   text: 'text-warning-700',   dot: 'bg-warning-500'   },
  reviewed:    { label: 'Reviewed',    bg: 'bg-secondary-100', text: 'text-secondary-700', dot: 'bg-secondary-500' },
  withdrawn:   { label: 'Withdrawn',   bg: 'bg-surface-100',   text: 'text-surface-500',   dot: 'bg-surface-400'   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ icon: Icon, value, label, sub, color = 'primary', delay = 0 }) {
  const palette = {
    primary:   { iconBg: 'bg-primary-100',   iconText: 'text-primary-600',   border: 'border-primary-100'   },
    success:   { iconBg: 'bg-success-100',   iconText: 'text-success-600',   border: 'border-success-100'   },
    warning:   { iconBg: 'bg-warning-100',   iconText: 'text-warning-600',   border: 'border-warning-100'   },
    secondary: { iconBg: 'bg-secondary-100', iconText: 'text-secondary-600', border: 'border-secondary-100' },
  };
  const p = palette[color] || palette.primary;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`card p-5 flex gap-4 items-center hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-300`}
    >
      <div className={`p-3 rounded-2xl shrink-0 ${p.iconBg}`}>
        <Icon className={`h-6 w-6 ${p.iconText}`} />
      </div>
      <div>
        <p className="text-2xl font-black text-surface-900 leading-none">{value}</p>
        <p className={`text-[11px] font-bold uppercase tracking-widest mt-1 ${p.iconText}`}>{label}</p>
        {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    profile, recommendations, applications, skillGap,
    appStats, loading, stats, refreshApplications,
  } = useStudentData();

  const profileCompletion = getProfileCompletion(profile || {});
  const missingFields = getMissingFields(profile || {});
  const recentApps = [...applications].slice(0, 5);
  const topRecs = recommendations?.recommendations?.slice(0, 3) || [];

  if (loading && !profile) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-44 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Hero banner ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 shadow-elevated"
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==")' }} />
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative px-6 sm:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 border border-white/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white mb-3">
                <Cpu size={11} /> AI-Powered Platform
              </div>
              <h1 className="text-3xl font-black text-white leading-tight tracking-tight">
                {profile?.fullName ? `Hey, ${profile.fullName.split(' ')[0]} 👋` : 'Welcome back!'}
              </h1>
              <p className="text-white/70 mt-1.5 text-sm max-w-lg">
                {recommendations?.recommendations?.length
                  ? `${recommendations.recommendations.length} AI-matched internships waiting for you`
                  : 'Complete your profile to unlock AI-powered internship matching'}
              </p>
              {!user?.resumeFileName && (
                <button
                  onClick={() => navigate('/app/dashboard/profile')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 font-bold px-4 py-2.5 text-sm shadow-soft hover:bg-primary-50 transition-all"
                >
                  <Upload className="h-4 w-4" /> Upload Resume for AI Matching
                </button>
              )}
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2 shrink-0">
              {[
                { icon: FileText, value: stats.totalApplications, label: 'Applied' },
                { icon: Award,    value: stats.shortlisted,        label: 'Shortlisted' },
                { icon: Target,   value: recommendations?.recommendations?.length || 0, label: 'Matches' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-xl bg-white/15 border border-white/20 p-3 text-center hover:bg-white/20 transition-all min-w-[72px]">
                  <Icon className="h-4 w-4 mx-auto mb-1 text-white/80" />
                  <p className="text-xl font-black text-white">{value}</p>
                  <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Profile incomplete banner ─────────────────────────── */}
      {profileCompletion < 80 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="alert-warning"
        >
          <div className="p-2.5 rounded-xl bg-warning-100">
            <TrendingUp className="h-5 w-5 text-warning-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-warning-800 text-sm">Complete your profile for better AI matches</p>
            <p className="text-xs text-warning-600 mt-0.5 truncate">
              Missing: {missingFields.slice(0, 4).join(', ')}{missingFields.length > 4 ? ` +${missingFields.length - 4} more` : ''}
            </p>
          </div>
          <button onClick={() => navigate('/app/dashboard/profile')} className="btn-primary text-xs py-2 px-4 shrink-0">
            Complete now <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}

      {/* ── KPI row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={FileText}    value={stats.totalApplications} label="Total Applied"   color="primary"   delay={0.05} />
        <StatCard icon={Award}       value={stats.shortlisted}       label="Shortlisted"     color="warning"   delay={0.1}  />
        <StatCard icon={CheckCircle} value={stats.accepted}          label="Accepted"        color="success"   delay={0.15} />
      </div>

      {/* ── Profile strength + Funnel ────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-900 flex items-center gap-2">
              <User className="h-4 w-4 text-primary-500" /> Profile Strength
            </h3>
            <span className="text-2xl font-black text-primary-600">{profileCompletion}%</span>
          </div>
          <div className="match-bar-container h-2.5 mb-3">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${profileCompletion}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: profileCompletion >= 80 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : profileCompletion >= 50 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#dc2626)' }}
            />
          </div>
          <p className="text-xs text-surface-500 mb-4">
            {profileCompletion === 100 ? "Your profile is complete — AI recommendations are optimised for you." : 'Complete your profile to unlock better AI matches.'}
          </p>
          {profileCompletion < 100 && (
            <button onClick={() => navigate('/app/dashboard/profile')} className="btn-primary text-xs py-2 px-4 gap-1.5">
              Complete Profile <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {skillGap && (
            <div className="mt-5 pt-4 border-t border-surface-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-surface-600">Skill Coverage vs Market</span>
                <span className="font-bold text-primary-600">{skillGap.coveragePercent}%</span>
              </div>
              <div className="match-bar-container h-1.5">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${skillGap.coveragePercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="match-bar-fill"
                />
              </div>
              <p className="text-[11px] text-surface-500 mt-2">
                {skillGap.matchedCount} of {skillGap.totalRequiredSkills} skills in demand right now
              </p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-secondary-500" /> Application Pipeline
          </h3>
          {stats.totalApplications === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-surface-400">
              <FileText className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm font-medium text-surface-500">No applications yet</p>
              <button onClick={() => navigate('/app/dashboard/matches')} className="btn-primary text-xs py-2 px-4 mt-3 gap-1.5">
                Browse AI Matches <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {[
                { name: 'Applied',     value: stats.totalApplications, color: '#3b82f6' },
                { name: 'Shortlisted', value: stats.shortlisted,       color: '#f59e0b' },
                { name: 'Accepted',    value: stats.accepted,          color: '#22c55e' },
              ].map(({ name, value, color }) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-surface-700">{name}</span>
                    <span className="font-bold text-surface-900">{value}</span>
                  </div>
                  <div className="match-bar-container h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: stats.totalApplications ? `${(value / stats.totalApplications) * 100}%` : '0%' }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full" style={{ background: color }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-surface-500 pt-1">
                Acceptance rate: <strong className="text-success-600">{stats.totalApplications ? Math.round((stats.accepted / stats.totalApplications) * 100) : 0}%</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent applications + Top matches ────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h3 className="font-bold text-surface-900 text-sm">Recent Applications</h3>
            <button onClick={() => navigate('/app/dashboard/applications')} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {recentApps.length === 0 ? (
            <div className="p-8 text-center text-surface-400 text-sm">No applications yet</div>
          ) : (
            <ul>
              {recentApps.map((app, i) => (
                <li key={app._id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-surface-50 transition-colors ${i < recentApps.length - 1 ? 'border-b border-surface-100' : ''}`}>
                  <div className="p-2 bg-primary-50 border border-primary-100 rounded-lg shrink-0">
                    <Briefcase className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{app.internship?.title || '—'}</p>
                    <p className="text-xs text-surface-500 truncate">{app.internship?.providerRef?.orgName || app.internship?.companyName || '—'}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h3 className="font-bold text-surface-900 text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary-500" /> Top AI Matches
            </h3>
            <button onClick={() => navigate('/app/dashboard/matches')} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {topRecs.length === 0 ? (
            <div className="p-8 text-center text-surface-400 text-sm">Complete your profile to get recommendations</div>
          ) : (
            <ul>
              {topRecs.map((rec, i) => (
                <li key={rec.internship._id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-surface-50 transition-colors ${i < topRecs.length - 1 ? 'border-b border-surface-100' : ''}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${rec.matchPercent >= 80 ? 'bg-success-500' : rec.matchPercent >= 60 ? 'bg-primary-500' : 'bg-warning-500'}`}>
                    {rec.matchPercent}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{rec.internship.title}</p>
                    <p className="text-xs text-surface-500">{rec.internship.providerRef?.orgName || rec.internship.companyName || '—'}</p>
                  </div>
                  <span className="text-xs text-surface-400 capitalize shrink-0">{rec.internship.mode}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Skill gap teaser ──────────────────────────────────────── */}
      {skillGap?.topMissingSkills?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-900 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning-500" /> High-Demand Skills to Learn
            </h3>
            <button onClick={() => navigate('/app/dashboard/skills')} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Full Analysis <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skillGap.topMissingSkills.slice(0, 10).map(({ skill, demandPct }) => (
              <span key={skill} className="tag-gap inline-flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" /> {skill}
                <span className="opacity-70">{demandPct}%</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
