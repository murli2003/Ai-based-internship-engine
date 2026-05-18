import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  TrendingUp,
  MapPin,
  Briefcase,
  Clock,
  Award,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
  Brain,
  Target,
  Zap,
  ExternalLink,
  Eye,
} from 'lucide-react';
import api from '../services/api';

/** Normalize API skill entries (string or { skill, name }) for display / comparison */
function normalizeSkillLabel(s) {
  if (s == null) return '';
  if (typeof s === 'string') return s.trim();
  if (typeof s === 'object') {
    if (s.skill != null) return String(s.skill).trim();
    if (s.name != null) return String(s.name).trim();
  }
  return String(s).trim();
}

/* ── Match ring SVG ─────────────────────────────────────────── */
function MatchRing({ percent }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  const color =
    percent >= 80 ? '#22c55e' :
    percent >= 60 ? '#6366f1' :
    percent >= 40 ? '#f59e0b' :
                   '#64748b';
  const trackColor =
    percent >= 80 ? 'rgba(34,197,94,0.15)' :
    percent >= 60 ? 'rgba(99,102,241,0.15)' :
    percent >= 40 ? 'rgba(245,158,11,0.15)' :
                   'rgba(100,116,139,0.15)';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="60" height="60" className="-rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" stroke={trackColor} strokeWidth="5" />
        <circle
          cx="30" cy="30" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset="0"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-xs font-extrabold leading-none" style={{ color }}>{percent}%</span>
      </div>
    </div>
  );
}

/* ── Score bar ───────────────────────────────────────────────── */
function ScoreBar({ label, value, color, hide0 = false }) {
  if (hide0 && (!value || value <= 0)) return null;
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-medium text-surface-500">{label}</span>
        <span className={`font-bold ${pct > 0 ? 'text-surface-700' : 'text-surface-400'}`}>
          {pct > 0 ? `${pct}%` : 'N/A'}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-surface-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={`h-full rounded-full ${pct > 0 ? color : 'bg-surface-200'}`}
        />
      </div>
    </div>
  );
}

/* ── Main card ───────────────────────────────────────────────── */
export default function RecommendationCard({ recommendation, onApplied, appliedInternshipIds }) {
  const navigate = useNavigate();
  const {
    rank,
    internship,
    matchPercent,
    explanation,
    skillGaps,
    suggestedLearning,
    scores,
    confidence,
    matchedSkills,
  } = recommendation;

  const internshipId = internship?._id != null ? String(internship._id) : '';
  const alreadyApplied = useMemo(() => {
    if (!appliedInternshipIds || !internshipId) return false;
    return appliedInternshipIds.has(internshipId);
  }, [appliedInternshipIds, internshipId]);

  const [applying, setApplying]       = useState(false);
  const [justApplied, setJustApplied] = useState(false);
  const applied = alreadyApplied || justApplied;
  const [showDetails, setShowDetails] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post(`/internships/${internship._id}/apply`);
      setJustApplied(true);
      onApplied?.();
    } catch (e) {
      // 409 = already applied. (400 may mean listing closed — do not mark as applied.)
      if (e.response?.status === 409) setJustApplied(true);
    } finally {
      setApplying(false);
    }
  };

  const providerName = internship.providerRef?.orgName || 'Company';

  const matchedSkillLabels = (matchedSkills || []).map(normalizeSkillLabel).filter(Boolean);

  const rankStyle =
    rank === 1 ? { bg: 'from-amber-400 to-yellow-500',   label: '🏆 #1 Match'  } :
    rank === 2 ? { bg: 'from-slate-400 to-slate-500',     label: '🥈 #2'        } :
    rank === 3 ? { bg: 'from-amber-600 to-orange-700',    label: '🥉 #3'        } :
                 { bg: 'from-primary-500 to-primary-700', label: `#${rank}`      };

  const confBadge = {
    high:   { text: 'High confidence',   cls: 'bg-success-100 text-success-700 border-success-200' },
    medium: { text: 'Medium confidence', cls: 'bg-warning-100 text-warning-700 border-warning-200' },
    low:    { text: 'Low confidence',    cls: 'bg-surface-100 text-surface-500 border-surface-200' },
  }[confidence] ?? { text: confidence, cls: 'bg-surface-100 text-surface-500 border-surface-200' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(rank * 0.04, 0.4) }}
      className="card card-hover group relative overflow-hidden flex flex-col"
    >
      {/* Top colour accent */}
      <div className={`h-1 w-full bg-gradient-to-r ${rankStyle.bg}`} />

      {/* Rank badge */}
      {rank <= 5 && (
        <div className={`absolute top-3 right-3 bg-gradient-to-r ${rankStyle.bg} rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white shadow-soft`}>
          {rankStyle.label}
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 gap-4">

        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Match ring */}
          <div className="shrink-0 mt-0.5">
            <MatchRing percent={matchPercent} />
            <p className="text-[9px] font-semibold text-center text-slate-500 mt-0.5 uppercase tracking-wider">Match</p>
          </div>

          {/* Title + company */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="tag-primary text-[11px]">
                <Briefcase className="h-3 w-3" />
                {internship.domain || 'General'}
              </span>
              {confidence && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${confBadge.cls}`}>
                  {confBadge.text}
                </span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-surface-900 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
              {internship.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-surface-500 font-medium">
              {providerName}
              {internship.providerRef?.verified && (
                <CheckCircle className="h-3.5 w-3.5 text-primary-400 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {internship.description && (
          <p className="text-xs text-surface-500 leading-relaxed line-clamp-2">
            {internship.description}
          </p>
        )}

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2">
          {internship.stipend && (
            <span className="skill-badge-green inline-flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              ₹{internship.stipend.toLocaleString()}/mo
            </span>
          )}
          {internship.location && (
            <span className="tag inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              {internship.location}
            </span>
          )}
          {internship.duration && (
            <span className="tag inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              {internship.duration} mo
            </span>
          )}
        </div>

        {/* Skills */}
        {internship.requiredSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {internship.requiredSkills.slice(0, 5).map((skillRaw, idx) => {
              const skill = normalizeSkillLabel(skillRaw);
              const s = skill.toLowerCase();
              const matched = matchedSkillLabels.some((m) => m.toLowerCase().includes(s) || s.includes(m.toLowerCase()));
              return (
                <span
                  key={skill || idx}
                  className={matched ? 'tag-matched' : 'tag'}
                >
                  {matched && <CheckCircle className="h-3 w-3" />}
                  {skill}
                </span>
              );
            })}
            {internship.requiredSkills.length > 5 && (
              <span className="tag">+{internship.requiredSkills.length - 5} more</span>
            )}
          </div>
        )}

        {/* AI insight */}
        {explanation?.summary && (
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100">
                <Brain className="h-3.5 w-3.5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary-700 mb-0.5 flex items-center gap-1.5">
                  AI Analysis
                  <Zap className="h-3 w-3 text-warning-500" />
                </p>
                <p className="text-xs text-primary-600 leading-relaxed">
                  {explanation.rankExplanation || explanation.summary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expanded details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-4">
                {scores && (
                  <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 space-y-3">
                    <p className="text-xs font-extrabold text-surface-600 flex items-center gap-1.5 uppercase tracking-wider">
                      <Target className="h-3.5 w-3.5 text-primary-500" />
                      Detailed AI Scores
                    </p>
                    <ScoreBar label="Overall Match"     value={scores.overall}       color="bg-primary-500" />
                    <ScoreBar label="Skills Match"      value={scores.content}       color="bg-emerald-500" />
                    <ScoreBar label="Similar Students"  value={scores.collaborative} color="bg-violet-500"  />
                    <ScoreBar label="Semantic Analysis" value={scores.nlp}           color="bg-amber-500"   />
                  </div>
                )}

                {explanation?.reasonDetails?.length > 0 && (
                  <div className="space-y-2">
                    {explanation.reasonDetails.map((r, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs">
                        <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                          r.impact === 'high'   ? 'bg-success-500' :
                          r.impact === 'medium' ? 'bg-primary-500' : 'bg-surface-400'
                        }`} />
                        <p className="text-surface-500 leading-relaxed">
                          <span className="font-semibold text-surface-800">{r.factor}:</span>{' '}{r.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {explanation?.suggestions?.length > 0 && (
                  <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-3.5">
                    <div className="flex items-start gap-2.5">
                      <Info className="h-4 w-4 text-secondary-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        {explanation.suggestions.map((s, i) => (
                          <p key={i} className="text-xs text-secondary-700">• {s}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skill gaps */}
        {skillGaps?.length > 0 && (
          <div className="rounded-xl border border-warning-200 bg-warning-50 p-3.5">
            <div className="flex items-start gap-2.5">
              <BookOpen className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-warning-700 mb-2">Skills to develop</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {skillGaps.slice(0, 4).map(skill => (
                    <span key={skill} className="tag-gap">{skill}</span>
                  ))}
                  {skillGaps.length > 4 && (
                    <span className="text-xs text-warning-600 font-medium">+{skillGaps.length - 4} more</span>
                  )}
                </div>
                {suggestedLearning?.slice(0, 2).map((r, i) => (
                  <a key={i} href={r.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning-600 hover:text-warning-700 transition-colors mr-3">
                    <ExternalLink className="h-3 w-3" />
                    {r.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-surface-100 mt-auto">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowDetails(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-surface-800 transition-colors">
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? 'Hide' : 'AI scores'}
            </button>
            {internshipId && (
              <button
                type="button"
                onClick={() => navigate(`/app/dashboard/internship/${internshipId}`)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                View Details
              </button>
            )}
          </div>

          <button type="button" onClick={handleApply} disabled={applying || applied}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all duration-200 ${
              applied   ? 'bg-success-100 text-success-700 border border-success-200 cursor-default' :
              applying  ? 'opacity-60 cursor-wait btn-primary' :
                          'btn-primary'
            }`}
          >
            {applied ? (
              <><CheckCircle className="h-4 w-4" /> Applied</>
            ) : applying ? (
              <><span className="spinner-sm" /> Applying…</>
            ) : 'Apply Now'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
