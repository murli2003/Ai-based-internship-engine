import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, Briefcase, CheckCircle, Users, UserCheck,
  PieChart as PieIcon, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
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

const STATUS_CFG = {
  applied:     { label: 'Applied',     bg: 'bg-primary-100', text: 'text-primary-700', dot: 'bg-primary-500' },
  shortlisted: { label: 'Shortlisted', bg: 'bg-warning-100', text: 'text-warning-700', dot: 'bg-warning-500' },
  accepted:    { label: 'Accepted',    bg: 'bg-success-100', text: 'text-success-700', dot: 'bg-success-500' },
  rejected:    { label: 'Rejected',    bg: 'bg-surface-100', text: 'text-surface-500', dot: 'bg-surface-400' },
  pending:     { label: 'Pending',     bg: 'bg-warning-100', text: 'text-warning-700', dot: 'bg-warning-500' },
};

function KpiCard({ icon: Icon, value, label, sub, color = 'secondary' }) {
  const palette = {
    secondary: { iconBg: 'bg-secondary-100', iconText: 'text-secondary-600' },
    primary:   { iconBg: 'bg-primary-100',   iconText: 'text-primary-600'   },
    success:   { iconBg: 'bg-success-100',   iconText: 'text-success-600'   },
    warning:   { iconBg: 'bg-warning-100',   iconText: 'text-warning-600'   },
  };
  const p = palette[color] || palette.secondary;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 flex gap-4 items-start hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-300 cursor-default"
    >
      <div className={`p-3 rounded-xl shrink-0 ${p.iconBg}`}>
        <Icon className={`h-5 w-5 ${p.iconText}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-extrabold text-surface-900 leading-none">{value}</div>
        <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${p.iconText} opacity-80`}>{label}</div>
        {sub && <div className="text-xs text-surface-500 mt-1">{sub}</div>}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function ProviderOverview() {
  const { analytics, internships, pipeline } = useProviderData();
  const navigate = useNavigate();

  const rankColors = ['bg-warning-400', 'bg-surface-400', 'bg-accent-600', 'bg-primary-500', 'bg-primary-400'];

  if (!analytics) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Activity} title="Overview" subtitle="Organisation recruitment overview and key metrics" />
        <div className="card p-16 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-secondary-400 opacity-40" />
          <p className="text-surface-400">Loading analytics…</p>
        </div>
      </div>
    );
  }

  const topPerformers = (analytics.internshipPerformance || []).sort((a, b) => b.total - a.total).slice(0, 5);
  const recentApps = pipeline.slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="Overview"
        subtitle="Organisation recruitment overview and key metrics"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Briefcase}   value={analytics.totalInternships}     label="Total Postings"  color="secondary" />
        <KpiCard icon={CheckCircle} value={analytics.activeInternships}    label="Active"          color="success"   />
        <KpiCard icon={Users}       value={analytics.totalApplications}    label="Applications"    color="primary"   />
        <KpiCard icon={UserCheck}   value={`${analytics.acceptanceRate}%`} label="Acceptance Rate" color="warning"   />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Monthly trend */}
        <div className="card p-6">
          <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-secondary-500" /> Application Trend
          </h3>
          {!analytics.monthlyApplications?.length ? (
            <div className="h-44 flex items-center justify-center text-surface-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={analytics.monthlyApplications} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="provAppGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 10, fill: '#78716c' }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="count" name="Applications" stroke="#a855f7" fill="url(#provAppGrad)" strokeWidth={2} dot={{ r: 3, fill: '#a855f7' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status breakdown */}
        <div className="card p-6">
          <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2 text-sm">
            <PieIcon className="h-4 w-4 text-secondary-500" /> Application Status
          </h3>
          {analytics.statusBreakdown?.every(s => s.count === 0) ? (
            <div className="h-44 flex items-center justify-center text-surface-400 text-sm">No applications yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={analytics.statusBreakdown?.filter(s => s.count > 0)}
                  dataKey="count" nameKey="status"
                  cx="50%" cy="50%" outerRadius={70} innerRadius={35}
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} style={{ fontSize: 10, fill: '#78716c' }}
                >
                  {analytics.statusBreakdown?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top performers + recent candidates */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h3 className="font-bold text-surface-900 text-sm">Top Performing Internships</h3>
            <button onClick={() => navigate('/app/provider/postings')}
              className="text-xs font-semibold text-secondary-600 hover:text-secondary-700 flex items-center gap-1 transition-colors">
              Manage <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {topPerformers.length === 0 ? (
            <div className="p-8 text-center text-surface-400 text-sm">No internships yet</div>
          ) : (
            <ul>
              {topPerformers.map((item, i) => (
                <li key={item._id} className={`flex items-center gap-3 px-5 py-3 hover:bg-surface-50 transition-colors ${i < topPerformers.length - 1 ? 'border-b border-surface-100' : ''}`}>
                  <span className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold text-white ${rankColors[i] || 'bg-primary-500'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{item.title}</p>
                    <p className="text-xs text-surface-500">{item.total} applications · {item.accepted} accepted</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-surface-100 text-surface-500'}`}>
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h3 className="font-bold text-surface-900 text-sm">Recent Candidates</h3>
            <button onClick={() => navigate('/app/provider/pipeline')}
              className="text-xs font-semibold text-secondary-600 hover:text-secondary-700 flex items-center gap-1 transition-colors">
              Pipeline <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {recentApps.length === 0 ? (
            <div className="p-8 text-center text-surface-400 text-sm">No applications yet</div>
          ) : (
            <ul>
              {recentApps.map((app, i) => (
                <li key={app._id} className={`flex items-center gap-3 px-5 py-3 hover:bg-surface-50 transition-colors ${i < recentApps.length - 1 ? 'border-b border-surface-100' : ''}`}>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br from-secondary-500 to-secondary-600">
                    {(app.studentProfile?.fullName || app.student?.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{app.studentProfile?.fullName || app.student?.email || 'Student'}</p>
                    <p className="text-xs text-surface-500 truncate">{app.internship?.title || '—'}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
