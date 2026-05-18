import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProviderData } from '../../context/ProviderDataContext';
import PageHeader from '../../components/PageHeader';
import StudentProfileViewModal from '../../components/StudentProfileViewModal';

const STATUS_CFG = {
  applied:     { label: 'Applied',     bg: 'bg-primary-100', text: 'text-primary-700', dot: 'bg-primary-500' },
  shortlisted: { label: 'Shortlisted', bg: 'bg-warning-100', text: 'text-warning-700', dot: 'bg-warning-500' },
  accepted:    { label: 'Accepted',    bg: 'bg-success-100', text: 'text-success-700', dot: 'bg-success-500' },
  rejected:    { label: 'Rejected',    bg: 'bg-surface-100', text: 'text-surface-500', dot: 'bg-surface-400' },
  pending:     { label: 'Pending',     bg: 'bg-warning-100', text: 'text-warning-700', dot: 'bg-warning-500' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function ProviderPipeline() {
  const { pipeline, internships, updateApplicationStatus } = useProviderData();
  const [selectedInternship, setSelectedInternship] = useState('all');
  const [statusFilter, setStatusFilter]             = useState('all');
  const [search, setSearch]                         = useState('');
  const [updatingId, setUpdatingId]                 = useState(null);
  const [viewStudentId, setViewStudentId]         = useState(null);

  const filtered = pipeline.filter(app => {
    const matchesInternship = selectedInternship === 'all' || app.internship?._id === selectedInternship;
    const matchesStatus     = statusFilter === 'all' || app.status === statusFilter;
    const matchesSearch     = !search
      || (app.studentProfile?.fullName || '').toLowerCase().includes(search.toLowerCase())
      || (app.student?.email || '').toLowerCase().includes(search.toLowerCase())
      || (app.internship?.title || '').toLowerCase().includes(search.toLowerCase());
    return matchesInternship && matchesStatus && matchesSearch;
  });

  const statusCounts = useMemo(() => {
    const counts = { all: pipeline.length, applied: 0, shortlisted: 0, accepted: 0, rejected: 0 };
    pipeline.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return counts;
  }, [pipeline]);

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      await updateApplicationStatus(appId, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Candidate Pipeline"
        subtitle={`${pipeline.length} total applications across all your postings`}
      />

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => {
          const isActive = statusFilter === status;
          return (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={`rounded-xl border px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-secondary-600 border-secondary-600 text-white shadow-soft'
                  : 'bg-white border-surface-200 text-surface-600 hover:border-secondary-300 hover:text-secondary-600'
              }`}
            >
              {status === 'all' ? 'All' : STATUS_CFG[status]?.label || status} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input type="text" placeholder="Search by name or email…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none" />
        </div>
        <select value={selectedInternship} onChange={e => setSelectedInternship(e.target.value)} className="select-field w-full sm:w-60">
          <option value="all">All Internships</option>
          {internships.map(i => <option key={i._id} value={i._id}>{i.title}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-secondary-300 opacity-50" />
          <p className="font-semibold text-surface-500">No candidates match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => (
            <motion.div key={app._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }} className="card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 bg-gradient-to-br from-secondary-500 to-secondary-600 shadow-soft">
                    {(app.studentProfile?.fullName || app.student?.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-surface-900 text-sm">{app.studentProfile?.fullName || app.student?.email || 'Student'}</p>
                    <p className="text-xs text-surface-500 truncate">{app.student?.email || '—'}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {app.studentProfile?.institution && (
                        <span className="badge badge-secondary">{app.studentProfile.institution}</span>
                      )}
                      {app.studentProfile?.cgpa != null && (
                        <span className="badge badge-primary">CGPA {app.studentProfile.cgpa}</span>
                      )}
                      {app.studentProfile?.skills?.slice(0, 3).map(s => (
                        <span key={s.name || s} className="tag text-xs">{s.name || s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block flex-1 min-w-0">
                  <p className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold mb-0.5">Applied for</p>
                  <p className="text-sm font-semibold text-surface-900 truncate">{app.internship?.title || '—'}</p>
                  <p className="text-xs text-surface-500 capitalize">{app.internship?.domain || 'General'}</p>
                </div>

                <div className="hidden lg:block shrink-0 text-right">
                  <p className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold mb-0.5">Applied</p>
                  <p className="text-xs text-surface-600 font-medium">
                    {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={app.status} />
                  <select value={app.status} onChange={e => handleStatusChange(app._id, e.target.value)}
                    disabled={updatingId === app._id} className="select-field text-xs py-1.5 w-36">
                    <option value="applied">Applied</option>
                    <option value="shortlisted">Shortlist</option>
                    <option value="accepted">Accept</option>
                    <option value="rejected">Reject</option>
                  </select>

                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-surface-500 hover:bg-secondary-50 hover:text-secondary-700 transition-colors"
                    title="View student profile"
                    onClick={() => {
                      const sid = app.studentProfile?.userId || app.student?._id;
                      if (!sid) {
                        toast.error('Student id not found');
                        return;
                      }
                      setViewStudentId(sid);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {viewStudentId && (
          <StudentProfileViewModal studentId={viewStudentId} onClose={() => setViewStudentId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
