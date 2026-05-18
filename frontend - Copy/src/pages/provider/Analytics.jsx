import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Users, UserCheck, Award, Briefcase } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useProviderData } from '../../context/ProviderDataContext';
import PageHeader from '../../components/PageHeader';

const CHART_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

const tooltipStyle = {
  contentStyle: {
    borderRadius: 10, border: '1px solid #e7e5e4', background: '#fff',
    color: '#292524', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  cursor: { stroke: 'rgba(59,130,246,0.2)', strokeWidth: 1 },
};

function KpiCard({ icon: Icon, value, label, color = 'secondary' }) {
  const palette = {
    secondary: { iconBg: 'bg-secondary-100', iconText: 'text-secondary-600' },
    primary:   { iconBg: 'bg-primary-100',   iconText: 'text-primary-600'   },
    success:   { iconBg: 'bg-success-100',   iconText: 'text-success-600'   },
    warning:   { iconBg: 'bg-warning-100',   iconText: 'text-warning-600'   },
  };
  const p = palette[color] || palette.secondary;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 flex gap-4 items-start hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-300 cursor-default">
      <div className={`p-3 rounded-xl shrink-0 ${p.iconBg}`}><Icon className={`h-5 w-5 ${p.iconText}`} /></div>
      <div>
        <div className="text-2xl font-extrabold text-surface-900 leading-none">{value}</div>
        <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${p.iconText} opacity-80`}>{label}</div>
      </div>
    </motion.div>
  );
}

export default function ProviderAnalytics() {
  const { analytics } = useProviderData();

  if (!analytics) {
    return (
      <div className="space-y-6">
        <PageHeader icon={BarChart2} title="Analytics" subtitle="Recruitment performance and talent acquisition metrics" />
        <div className="card p-16 text-center">
          <BarChart2 className="h-12 w-12 mx-auto mb-4 text-secondary-300 opacity-50" />
          <p className="text-surface-400 font-semibold">Analytics data loading…</p>
        </div>
      </div>
    );
  }

  const conversionFunnel = [
    { stage: 'Applied',     count: analytics.totalApplications, color: '#3b82f6' },
    { stage: 'Shortlisted', count: analytics.statusBreakdown?.find(s => s.status === 'shortlisted')?.count || 0, color: '#a855f7' },
    { stage: 'Accepted',    count: analytics.statusBreakdown?.find(s => s.status === 'accepted')?.count || 0, color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart2}
        title="Analytics & Insights"
        subtitle="Deep dive into your recruitment performance and talent acquisition metrics"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users}     value={analytics.totalApplications}   label="Total Applications" color="secondary" />
        <KpiCard icon={UserCheck} value={`${analytics.acceptanceRate}%`} label="Acceptance Rate"   color="success"   />
        <KpiCard icon={Award}     value={`${analytics.shortlistRate}%`} label="Shortlist Rate"     color="warning"   />
        <KpiCard icon={Briefcase} value={analytics.totalInternships}    label="Total Postings"     color="primary"   />
      </div>

      {/* Monthly applications bar chart */}
      <div className="card p-6">
        <h3 className="font-bold text-surface-900 mb-1">Monthly Application Volume</h3>
        <p className="text-xs text-surface-500 mb-5">Track how many candidates apply each month</p>
        {!analytics.monthlyApplications?.length ? (
          <div className="h-52 flex items-center justify-center text-surface-400 text-sm">No monthly data available yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.monthlyApplications} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#78716c' }} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" name="Applications" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Domain pie */}
        <div className="card p-6">
          <h3 className="font-bold text-surface-900 mb-4 text-sm">Applications by Domain</h3>
          {!analytics.domainBreakdown?.length ? (
            <div className="h-44 flex items-center justify-center text-surface-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={analytics.domainBreakdown} dataKey="count" nameKey="domain"
                  cx="50%" cy="50%" outerRadius={80}
                  label={({ domain, percent }) => `${domain} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} style={{ fontSize: 10, fill: '#78716c' }}>
                  {analytics.domainBreakdown?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Conversion funnel */}
        <div className="card p-6">
          <h3 className="font-bold text-surface-900 mb-4 text-sm">Conversion Funnel</h3>
          <div className="space-y-4 mt-2">
            {conversionFunnel.map(({ stage, count, color }, i) => (
              <div key={stage}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-semibold text-surface-700">{stage}</span>
                  <span className="font-extrabold text-surface-900">{count}</span>
                </div>
                <div className="match-bar-container h-2.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: analytics.totalApplications ? `${(count / analytics.totalApplications) * 100}%` : '0%' }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                </div>
                {i < conversionFunnel.length - 1 && conversionFunnel[i].count > 0 && (
                  <p className="text-xs text-surface-400 mt-1">
                    {Math.round((conversionFunnel[i + 1].count / conversionFunnel[i].count) * 100)}% conversion rate
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top skills demanded */}
      {analytics.topSkillsDemanded?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-bold text-surface-900 mb-1 text-sm">Skills You're Recruiting For</h3>
          <p className="text-xs text-surface-500 mb-5">Most required skills across your active internship postings</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.topSkillsDemanded} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#78716c' }} allowDecimals={false} />
              <YAxis type="category" dataKey="skill" width={90} tick={{ fontSize: 11, fill: '#57534e' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" name="Postings requiring skill" fill="#a855f7" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance table */}
      {analytics.internshipPerformance?.length > 0 && (
        <div className="table-container">
          <div className="px-5 py-4 border-b border-surface-100">
            <h3 className="font-bold text-surface-900 text-sm">Internship Performance Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  {['Title', 'Domain', 'Status', 'Applications', 'Accepted', 'Rate'].map(h => (
                    <th key={h} className="table-header-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="table-body">
                {analytics.internshipPerformance.map(item => (
                  <tr key={item._id} className="table-row">
                    <td className="table-cell font-semibold text-surface-900">{item.title}</td>
                    <td className="table-cell"><span className="badge badge-primary capitalize">{item.domain || 'General'}</span></td>
                    <td className="table-cell">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-surface-100 text-surface-500'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-surface-900">{item.total}</td>
                    <td className="table-cell font-semibold text-success-600">{item.accepted}</td>
                    <td className="table-cell font-bold text-surface-900">
                      {item.total ? `${Math.round((item.accepted / item.total) * 100)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
