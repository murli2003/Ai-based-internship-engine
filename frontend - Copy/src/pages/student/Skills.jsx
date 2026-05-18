import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, CheckCircle, BookOpen, Target, Star, Zap, Cpu,
} from 'lucide-react';
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useStudentData } from '../../context/StudentDataContext';
import PageHeader from '../../components/PageHeader';

const tooltipStyle = {
  contentStyle: { borderRadius: 10, border: '1px solid #e7e5e4', background: '#fff', color: '#292524', fontSize: 12 },
};

function KpiCard({ icon: Icon, value, label, color = 'primary' }) {
  const palette = {
    primary:   { iconBg: 'bg-primary-100',   iconText: 'text-primary-600'   },
    success:   { iconBg: 'bg-success-100',   iconText: 'text-success-600'   },
    warning:   { iconBg: 'bg-warning-100',   iconText: 'text-warning-600'   },
    secondary: { iconBg: 'bg-secondary-100', iconText: 'text-secondary-600' },
  };
  const p = palette[color] || palette.primary;
  return (
    <div className="card p-5 flex gap-4 items-center">
      <div className={`p-3 rounded-2xl ${p.iconBg}`}>
        <Icon className={`h-5 w-5 ${p.iconText}`} />
      </div>
      <div>
        <p className="text-2xl font-black text-surface-900">{value}</p>
        <p className={`text-[11px] font-bold uppercase tracking-widest mt-0.5 ${p.iconText}`}>{label}</p>
      </div>
    </div>
  );
}

export default function Skills() {
  const { skillGap, profile } = useStudentData();

  if (!skillGap) {
    return (
      <div className="space-y-6">
        <PageHeader icon={BarChart2} title="Skills & Analytics" subtitle="AI-powered skill gap analysis vs. market demand" />
        <div className="card p-16 text-center">
          <Cpu className="h-14 w-14 mx-auto mb-4 text-primary-400 opacity-30" />
          <h3 className="font-bold text-surface-900 mb-2">No Skill Data Available</h3>
          <p className="text-sm text-surface-500 max-w-sm mx-auto">
            Add skills to your profile and make sure there are active internship postings to compare against.
          </p>
        </div>
      </div>
    );
  }

  const { matchedCount, missingCount, coveragePercent, topMissingSkills, topMatchedSkills, perInternshipGaps } = skillGap;

  const barData = [
    ...topMatchedSkills.slice(0, 8).map((s) => ({ skill: s.skill, demand: s.demandPct, type: 'matched' })),
    ...topMissingSkills.slice(0, 8).map((s) => ({ skill: s.skill, demand: s.demandPct, type: 'missing' })),
  ].sort((a, b) => b.demand - a.demand);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart2}
        title="Skills & Analytics"
        subtitle="Real-time skill gap analysis against all active internship postings"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={CheckCircle} value={matchedCount}          label="Skills Matched"   color="success"   />
        <KpiCard icon={BookOpen}    value={missingCount}          label="Skills to Learn"  color="warning"   />
        <KpiCard icon={Target}      value={`${coveragePercent}%`} label="Coverage Rate"    color="primary"   />
        <KpiCard icon={Star}        value={profile?.skills?.length || 0} label="My Skills" color="secondary" />
      </div>

      {/* Coverage bar */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-surface-900">Market Skill Coverage</h3>
            <p className="text-xs text-surface-500 mt-0.5">Based on {skillGap.totalRequiredSkills} unique skills across active postings</p>
          </div>
          <span className="text-2xl font-black text-primary-600">{coveragePercent}%</span>
        </div>
        <div className="match-bar-container h-3">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${coveragePercent}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: coveragePercent >= 70 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : coveragePercent >= 40 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#dc2626)' }}
          />
        </div>
      </div>

      {/* Demand chart */}
      <div className="card p-6">
        <h3 className="font-bold text-surface-900 mb-1">Skill Demand vs. Your Coverage</h3>
        <p className="text-xs text-surface-500 mb-5">% of active postings requiring each skill — green = you have it, amber = to learn</p>
        <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 28)}>
          <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 24, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#78716c' }} unit="%" />
            <YAxis type="category" dataKey="skill" width={110} tick={{ fontSize: 11, fill: '#57534e' }} />
            <Tooltip {...tooltipStyle} formatter={(val) => [`${val}% demand`]} />
            <Bar dataKey="demand" radius={[0, 6, 6, 0]}>
              {barData.map((entry, index) => (
                <Cell key={index} fill={entry.type === 'matched' ? '#22c55e' : '#f59e0b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-4 justify-center">
          <span className="flex items-center gap-1.5 text-xs font-medium text-surface-500">
            <span className="h-3 w-3 rounded-sm bg-success-500" /> You have
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-surface-500">
            <span className="h-3 w-3 rounded-sm bg-warning-400" /> To learn
          </span>
        </div>
      </div>

      {/* Matched vs missing lists */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-success-500" /> Your Matched Skills
          </h3>
          {topMatchedSkills.length === 0 ? (
            <p className="text-sm text-surface-400">Add skills to your profile to see matches</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topMatchedSkills.map(({ skill, demandPct }) => (
                <span key={skill} className="tag-matched inline-flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" /> {skill}
                  <span className="opacity-60 ml-0.5">{demandPct}%</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-warning-500" /> High-Demand Skills to Learn
          </h3>
          {topMissingSkills.length === 0 ? (
            <p className="text-sm text-success-600 font-semibold">You have all in-demand skills!</p>
          ) : (
            <div className="space-y-2.5">
              {topMissingSkills.slice(0, 10).map(({ skill, demandPct }) => (
                <div key={skill}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-surface-700 capitalize">{skill}</span>
                    <span className="text-warning-600 font-bold">{demandPct}%</span>
                  </div>
                  <div className="match-bar-container h-1.5">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${demandPct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full bg-warning-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-internship gap */}
      {perInternshipGaps?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-bold text-surface-900 mb-4 text-sm">Skill Gaps per Top Internship</h3>
          <div className="space-y-3">
            {perInternshipGaps.map((item) => (
              <div key={item.internshipId} className="rounded-xl border border-surface-100 bg-surface-50 p-4 hover:border-surface-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-surface-900">{item.title}</p>
                    <p className="text-xs text-surface-500 capitalize">{item.domain || 'General'}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${item.gapCount === 0 ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                    {item.gapCount === 0 ? '✓ Perfect fit' : `${item.gapCount} gap${item.gapCount > 1 ? 's' : ''}`}
                  </span>
                </div>
                {item.gaps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.gaps.map((g) => <span key={g} className="tag-gap text-xs">{g}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
