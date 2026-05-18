import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Briefcase, Calendar, PieChart as PieIcon, Activity, Eye,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useStudentData } from '../../context/StudentDataContext';
import PageHeader from '../../components/PageHeader';

const STATUS_CONFIG = {
  applied:     { label: 'Applied',     bg: 'bg-primary-100',   text: 'text-primary-700',   dot: 'bg-primary-500'   },
  shortlisted: { label: 'Shortlisted', bg: 'bg-warning-100',   text: 'text-warning-700',   dot: 'bg-warning-500'   },
  accepted:    { label: 'Accepted',    bg: 'bg-success-100',   text: 'text-success-700',   dot: 'bg-success-500'   },
  rejected:    { label: 'Rejected',    bg: 'bg-surface-100',   text: 'text-surface-500',   dot: 'bg-surface-400'   },
  pending:     { label: 'Pending',     bg: 'bg-warning-100',   text: 'text-warning-700',   dot: 'bg-warning-500'   },
  reviewed:    { label: 'Reviewed',    bg: 'bg-secondary-100', text: 'text-secondary-700', dot: 'bg-secondary-500' },
  withdrawn:   { label: 'Withdrawn',   bg: 'bg-surface-100',   text: 'text-surface-500',   dot: 'bg-surface-400'   },
};

const CHART_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

const tooltipStyle = {
  contentStyle: { borderRadius: 10, border: '1px solid #e7e5e4', background: '#fff', color: '#292524', fontSize: 12 },
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

export default function Applications() {
  const { applications, appStats } = useStudentData();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = applications.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSearch =
      !search ||
      a.internship?.title?.toLowerCase().includes(search.toLowerCase()) ||
      (a.internship?.providerRef?.orgName || a.internship?.companyName || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pipelineCounts = {
    all:         applications.length,
    applied:     applications.filter((a) => a.status === 'applied').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    accepted:    applications.filter((a) => a.status === 'accepted').length,
    rejected:    applications.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="My Applications"
        subtitle={`${applications.length} total application${applications.length === 1 ? '' : 's'} — track every stage in real time`}
      />

      {/* Pipeline filter chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(pipelineCounts).map(([status, count]) => {
          const isActive = statusFilter === status;
          const cfg = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl border px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 border-primary-600 text-white shadow-soft'
                  : 'bg-white border-surface-200 text-surface-600 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              {status === 'all' ? 'All' : cfg?.label || status} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by company or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none" />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-surface-300" />
          <p className="font-semibold text-surface-500">No applications match your filters</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  {['Internship / Company', 'Domain', 'Mode', 'Stipend', 'Status', 'Applied On', ''].map((h) => (
                    <th key={h} className="table-header-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="table-body">
                {filtered.map((app, i) => (
                  <motion.tr
                    key={app._id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="table-row"
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 border border-primary-100 rounded-lg shrink-0">
                          <Briefcase className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-surface-900 text-sm">{app.internship?.title || '—'}</p>
                          <p className="text-xs text-surface-500">{app.internship?.providerRef?.orgName || app.internship?.companyName || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary capitalize">{app.internship?.domain || 'General'}</span>
                    </td>
                    <td className="table-cell text-surface-600 capitalize">{app.internship?.mode || '—'}</td>
                    <td className="table-cell font-semibold text-surface-900">
                      {app.internship?.stipend ? `₹${app.internship.stipend.toLocaleString()}/mo` : 'Unpaid'}
                    </td>
                    <td className="table-cell"><StatusBadge status={app.status} /></td>
                    <td className="table-cell text-surface-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                    </td>
                    <td className="table-cell">
                      {app.internship?._id && (
                        <button
                          type="button"
                          onClick={() => navigate(`/app/dashboard/internship/${app.internship._id}`)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="View internship details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      {appStats?.domainBreakdown?.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="card p-6">
            <h4 className="font-bold text-surface-900 mb-4 flex items-center gap-2 text-sm">
              <PieIcon className="h-4 w-4 text-primary-500" /> Applications by Domain
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={appStats.domainBreakdown} dataKey="count" nameKey="domain"
                  cx="50%" cy="50%" outerRadius={80}
                  label={({ domain, percent }) => `${domain} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} style={{ fontSize: 10, fill: '#78716c' }}
                >
                  {appStats.domainBreakdown.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-6">
            <h4 className="font-bold text-surface-900 mb-4 flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-secondary-500" /> Monthly Activity
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={appStats.monthlyTimeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 10, fill: '#78716c' }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="count" name="Applications" stroke="#3b82f6" fill="url(#appGrad)" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
