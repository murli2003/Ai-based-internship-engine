import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, Award, Briefcase, Users, CheckCircle,
  BookOpen, Zap, Target, Star, Code2, ListChecks, MessageSquare,
  Gift, Globe, Calendar, TrendingUp, AlertCircle, ExternalLink,
  Brain, ChevronRight, Building2, BadgeCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useStudentData } from '../../context/StudentDataContext';

/* ── Helpers ────────────────────────────────────────────────── */
function normalizeSkill(s) {
  if (!s) return '';
  if (typeof s === 'string') return s.trim();
  return String(s.skill ?? s.name ?? s).trim();
}

function Tag({ children, variant = 'default' }) {
  const cls = {
    default: 'bg-surface-100 text-surface-600 border-surface-200',
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    success: 'bg-success-50 text-success-700 border-success-200',
    warning: 'bg-warning-50 text-warning-700 border-warning-200',
    purple:  'bg-violet-50 text-violet-700 border-violet-200',
  }[variant];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function Section({ icon: Icon, title, children, accent = 'primary' }) {
  const accents = {
    primary:  'from-primary-500 to-primary-600',
    success:  'from-success-500 to-success-600',
    warning:  'from-warning-500 to-warning-600',
    purple:   'from-violet-500 to-violet-600',
    slate:    'from-slate-400 to-slate-500',
    teal:     'from-teal-500 to-teal-600',
  };
  return (
    <div className="card p-6">
      <h3 className="flex items-center gap-2.5 font-extrabold text-surface-900 text-sm mb-5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${accents[accent]} shadow-soft`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ListItems({ items, bullet = '•' }) {
  if (!items?.length) return <p className="text-sm text-surface-400">Not specified</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-surface-700">
          <span className="shrink-0 text-primary-400 font-bold mt-0.5">{bullet}</span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SkillChips({ skills, matchedLabels = [] }) {
  if (!skills?.length) return <p className="text-sm text-surface-400">Not specified</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((raw, i) => {
        const label = normalizeSkill(raw);
        const matched = matchedLabels.some(
          (m) => m.toLowerCase().includes(label.toLowerCase()) || label.toLowerCase().includes(m.toLowerCase())
        );
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
              matched
                ? 'bg-success-50 border-success-300 text-success-700'
                : 'bg-surface-50 border-surface-200 text-surface-600'
            }`}
          >
            {matched && <CheckCircle className="h-3 w-3 text-success-500" />}
            {label}
          </span>
        );
      })}
    </div>
  );
}

/* ── Match ring ─────────────────────────────────────────────── */
function MatchRing({ percent }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  const color =
    percent >= 80 ? '#22c55e' :
    percent >= 60 ? '#6366f1' :
    percent >= 40 ? '#f59e0b' :
                   '#64748b';
  return (
    <div className="relative flex items-center justify-center">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke={`${color}20`} strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-lg font-black" style={{ color }}>{percent}%</span>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function InternshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applications, refreshApplications } = useStudentData();

  const [internship, setInternship] = useState(null);
  const [match, setMatch]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [applying, setApplying]     = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  /* Check if already applied */
  const alreadyApplied = useMemo(() => {
    if (!applications?.length) return false;
    return applications.some((a) => {
      const aid = a.internship?._id ?? a.internship;
      return String(aid) === String(id);
    });
  }, [applications, id]);

  const applied = alreadyApplied || justApplied;

  /* Fetch internship + try to find AI match data */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get(`/internships/${id}`).then((r) => r.data?.data ?? r.data),
      api.get('/student/recommendations').then((r) => {
        const recs = r.data?.data ?? r.data ?? [];
        return recs.find?.((rec) => String(rec.internship?._id) === String(id)) || null;
      }).catch(() => null),
    ])
      .then(([intern, matchData]) => {
        setInternship(intern);
        setMatch(matchData);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load internship.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post(`/internships/${id}/apply`);
      setJustApplied(true);
      refreshApplications?.();
    } catch (e) {
      if (e.response?.status === 409) setJustApplied(true);
    } finally {
      setApplying(false);
    }
  };

  /* ── Loading / error states ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-surface-300" />
        <p className="text-surface-500 font-semibold">{error || 'Internship not found.'}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const provider = internship.organization;
  const matchedSkillLabels = (match?.matchedSkills || []).map(normalizeSkill).filter(Boolean);
  const mp = match?.matchPercent ?? 0;

  const modeLabel = {
    remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid',
  }[internship.mode] || internship.type || 'Hybrid';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-12"
    >
      {/* ── Back button ── */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-surface-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* ── Hero banner ── */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, white 0%, transparent 60%)' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Company logo / initials */}
          <div className="shrink-0 h-16 w-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl font-black text-white shadow-soft">
            {provider?.companyName?.[0] || internship.companyName?.[0] || 'C'}
          </div>

          {/* Core info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {internship.domain && (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                  {internship.domain}
                </span>
              )}
              {internship.jobType && (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm capitalize">
                  {internship.jobType}
                </span>
              )}
              {internship.status === 'active' ? (
                <span className="rounded-full bg-success-400/30 border border-success-400/40 px-3 py-1 text-xs font-bold text-success-100">
                  Active
                </span>
              ) : (
                <span className="rounded-full bg-surface-400/30 px-3 py-1 text-xs font-bold">
                  {internship.status}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
              {internship.title}
            </h1>
            <div className="flex items-center gap-2 text-white/80 font-semibold text-sm">
              <Building2 className="h-4 w-4" />
              {provider?.companyName || internship.companyName || 'Company'}
              {provider?.verified && <BadgeCheck className="h-4 w-4 text-sky-300" />}
            </div>

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap gap-3">
              {internship.location && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  <MapPin className="h-3 w-3" /> {internship.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <Globe className="h-3 w-3" /> {modeLabel}
              </span>
              {internship.durationWeeks && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  <Clock className="h-3 w-3" /> {internship.durationWeeks} weeks
                </span>
              )}
              {internship.stipend > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-400/30 border border-success-400/40 px-3 py-1 text-xs font-semibold text-success-100">
                  <Award className="h-3 w-3" /> ₹{internship.stipend.toLocaleString()}/mo
                </span>
              )}
              {internship.openings > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  <Users className="h-3 w-3" /> {internship.openings} opening{internship.openings > 1 ? 's' : ''}
                </span>
              )}
              {internship.applicationDeadline && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-400/30 border border-warning-400/40 px-3 py-1 text-xs font-semibold text-warning-100">
                  <Calendar className="h-3 w-3" />
                  Deadline: {new Date(internship.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* AI Match ring (only if we have match data) */}
          {mp > 0 && (
            <div className="shrink-0 flex flex-col items-center gap-1 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <MatchRing percent={mp} />
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">AI Match</p>
            </div>
          )}
        </div>

        {/* Apply button */}
        <div className="relative mt-6 flex items-center gap-3">
          <button
            onClick={handleApply}
            disabled={applying || applied}
            className={`inline-flex items-center gap-2.5 rounded-xl px-7 py-3 text-sm font-extrabold shadow-lg transition-all duration-200 ${
              applied
                ? 'bg-success-400/30 border border-success-400/50 text-success-100 cursor-default'
                : applying
                ? 'opacity-70 cursor-wait bg-white text-primary-700'
                : 'bg-white text-primary-700 hover:bg-primary-50 active:scale-95'
            }`}
          >
            {applied ? (
              <><CheckCircle className="h-4 w-4" /> Applied Successfully</>
            ) : applying ? (
              <><span className="h-4 w-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" /> Applying…</>
            ) : (
              <><Zap className="h-4 w-4" /> Apply Now</>
            )}
          </button>

          {internship.applyLink && internship.applyLink !== '#' && (
            <a
              href={internship.applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              <ExternalLink className="h-4 w-4" /> External Link
            </a>
          )}
        </div>
      </div>

      {/* ── Body grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left (main) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Description */}
          {internship.description && (
            <Section icon={Briefcase} title="About the Role" accent="primary">
              <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-line">
                {internship.description}
              </p>
            </Section>
          )}

          {/* Responsibilities */}
          {internship.responsibilities?.length > 0 && (
            <Section icon={ListChecks} title="Responsibilities" accent="teal">
              <ListItems items={internship.responsibilities} bullet="→" />
            </Section>
          )}

          {/* Qualifications */}
          {internship.qualifications?.length > 0 && (
            <Section icon={BookOpen} title="Qualifications & Requirements" accent="purple">
              <ListItems items={internship.qualifications} />
            </Section>
          )}

          {/* Learning Outcomes */}
          {internship.learningOutcomes?.length > 0 && (
            <Section icon={TrendingUp} title="What You'll Learn" accent="success">
              <ListItems items={internship.learningOutcomes} bullet="✓" />
            </Section>
          )}

          {/* Screening Questions */}
          {internship.screeningQuestions?.length > 0 && (
            <Section icon={MessageSquare} title="Screening Questions" accent="warning">
              <p className="text-xs text-surface-500 mb-4">
                Please be prepared to answer these questions as part of the application review.
              </p>
              <ol className="space-y-3">
                {internship.screeningQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-surface-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-700 font-bold text-xs">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed mt-0.5">{q}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* Application Process */}
          {internship.applicationProcess && (
            <Section icon={ChevronRight} title="Application Process" accent="slate">
              <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-line">
                {internship.applicationProcess}
              </p>
            </Section>
          )}

          {/* AI Boost Note */}
          {internship.aiBoostNote && (
            <div className="card p-6 border-2 border-primary-200 bg-primary-50/50">
              <div className="flex items-start gap-3">
                <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100">
                  <Brain className="h-4.5 w-4.5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-primary-700 mb-1 flex items-center gap-1.5">
                    AI Boost Context
                    <Zap className="h-3.5 w-3.5 text-warning-500" />
                  </p>
                  <p className="text-sm text-primary-600 leading-relaxed">{internship.aiBoostNote}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-6">

          {/* AI Match analysis (if available) */}
          {match && (
            <Section icon={Brain} title="AI Match Analysis" accent="primary">
              <div className="space-y-4">
                {match.explanation?.summary && (
                  <p className="text-xs text-surface-600 leading-relaxed bg-primary-50 rounded-xl p-3 border border-primary-100">
                    {match.explanation.rankExplanation || match.explanation.summary}
                  </p>
                )}
                {match.scores && (
                  <div className="space-y-3">
                    {[
                      { label: 'Overall Match',      v: match.scores.overall,       color: 'bg-primary-500'  },
                      { label: 'Skills Match',       v: match.scores.content,       color: 'bg-success-500'  },
                      { label: 'Similar Candidates', v: match.scores.collaborative, color: 'bg-violet-500'   },
                      { label: 'Semantic Fit',       v: match.scores.nlp,           color: 'bg-warning-500'  },
                    ].filter((s) => s.v > 0).map((s) => (
                      <div key={s.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-surface-500 font-medium">{s.label}</span>
                          <span className="font-bold text-surface-700">{s.v}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.v}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${s.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {match.skillGaps?.length > 0 && (
                  <div className="rounded-xl bg-warning-50 border border-warning-200 p-3">
                    <p className="text-xs font-bold text-warning-700 mb-2">Skills to Develop</p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.skillGaps.slice(0, 5).map((g) => (
                        <span key={g} className="rounded-full bg-warning-100 border border-warning-300 text-warning-700 text-xs font-semibold px-2.5 py-0.5">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Required Skills */}
          {internship.requiredSkills?.length > 0 && (
            <Section icon={Target} title="Required Skills" accent="primary">
              {match && matchedSkillLabels.length > 0 && (
                <p className="text-[11px] text-success-600 font-semibold mb-3">
                  <CheckCircle className="inline h-3.5 w-3.5 mr-1" />
                  Green = you have it!
                </p>
              )}
              <SkillChips skills={internship.requiredSkills} matchedLabels={matchedSkillLabels} />
            </Section>
          )}

          {/* Preferred Skills */}
          {internship.preferredSkills?.length > 0 && (
            <Section icon={Star} title="Preferred Skills" accent="purple">
              <SkillChips skills={internship.preferredSkills} matchedLabels={matchedSkillLabels} />
            </Section>
          )}

          {/* Tech Stack */}
          {internship.techStack?.length > 0 && (
            <Section icon={Code2} title="Tech Stack" accent="teal">
              <div className="flex flex-wrap gap-2">
                {internship.techStack.map((t, i) => (
                  <span key={i} className="rounded-lg bg-surface-900 text-white px-3 py-1 text-xs font-mono font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Perks */}
          {internship.perks?.length > 0 && (
            <Section icon={Gift} title="Perks & Benefits" accent="success">
              <div className="flex flex-wrap gap-2">
                {internship.perks.map((p, i) => (
                  <Tag key={i} variant="success">
                    <CheckCircle className="h-3 w-3" />
                    {p}
                  </Tag>
                ))}
              </div>
            </Section>
          )}

          {/* Company info */}
          <Section icon={Building2} title="About the Company" accent="slate">
            <div className="space-y-2 text-sm text-surface-600">
              <div className="flex items-center gap-2 font-semibold text-surface-900">
                {provider?.companyName || internship.companyName}
              </div>
              {provider?.industry && (
                <div className="flex items-center gap-2 text-surface-500">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  {provider.industry}
                </div>
              )}
              {provider?.website && (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-600 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  {provider.website}
                </a>
              )}
              {internship.minCgpa > 0 && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-surface-400" />
                  Min CGPA: <span className="font-bold text-surface-800">{internship.minCgpa}</span>
                </div>
              )}
              {internship.experienceLevel && (
                <div className="flex items-center gap-2 capitalize">
                  <Users className="h-3.5 w-3.5 shrink-0 text-surface-400" />
                  Level: <span className="font-semibold text-surface-800">{internship.experienceLevel}</span>
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </motion.div>
  );
}
