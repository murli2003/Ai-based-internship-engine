import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Plus, Search, MapPin, Users, Eye, Edit2, Trash2,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProviderData } from '../../context/ProviderDataContext';
import PageHeader from '../../components/PageHeader';
import CandidatesModal from '../../components/CandidatesModal';

function InternshipStatusPill({ status, onToggle, loading }) {
  const isActive = status === 'active';
  return (
    <button onClick={onToggle} disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 ${
        isActive
          ? 'bg-success-100 text-success-700 border-success-200 hover:bg-success-200'
          : 'bg-surface-100 text-surface-500 border-surface-200 hover:bg-surface-200'
      }`}
    >
      {isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
      {isActive ? 'Active' : 'Closed'}
    </button>
  );
}

export default function ProviderPostings() {
  const { internships, deleteInternship, toggleStatus } = useProviderData();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [candidatesFor, setCandidatesFor] = useState(null);
  const [loadingToggle, setLoadingToggle] = useState(null);

  const filtered = internships.filter(i => {
    const matchesSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || (i.domain || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (id, currentStatus) => {
    setLoadingToggle(id);
    try {
      await toggleStatus(id, currentStatus);
      toast.success(`Internship ${currentStatus === 'active' ? 'closed' : 'activated'}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setLoadingToggle(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this internship? This cannot be undone.')) return;
    try {
      await deleteInternship(id);
      toast.success('Internship deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Internship Postings"
        subtitle={`${internships.length} total · ${internships.filter(i => i.status === 'active').length} active`}
        action={
          <button onClick={() => navigate('/app/provider/postings/new')} className="btn-primary">
            <Plus className="h-4 w-4" /> New Internship
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input type="text" placeholder="Search by title or domain…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field w-full sm:w-44">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-16 text-center">
          <div className="flex justify-center mb-5">
            <div className="p-5 rounded-2xl bg-secondary-50">
              <Briefcase className="h-14 w-14 text-secondary-400 opacity-50" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-surface-900 mb-3">
            {internships.length === 0 ? 'No Internships Yet' : 'No results found'}
          </h3>
          <p className="text-surface-500 mb-8 max-w-sm mx-auto text-sm">
            {internships.length === 0
              ? 'Create your first posting to start receiving applications from talented students.'
              : 'Try adjusting your search or filters.'}
          </p>
          {internships.length === 0 && (
            <button onClick={() => navigate('/app/provider/postings/new')} className="btn-primary">
              <Plus className="h-5 w-5" /> Create First Internship
            </button>
          )}
        </motion.div>
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  {['Internship', 'Domain / Mode', 'Location', 'Stipend', 'Applications', 'Status', 'Actions'].map(h => (
                    <th key={h} className="table-header-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="table-body">
                {filtered.map((row, i) => (
                  <motion.tr key={row._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary-50 border border-secondary-100 rounded-lg shrink-0">
                          <Briefcase className="h-4 w-4 text-secondary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-surface-900 text-sm">{row.title}</p>
                          <p className="text-xs text-surface-500">{new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-primary capitalize">{row.domain || 'General'}</span>
                      <p className="text-xs text-surface-500 mt-1 capitalize">{row.mode}</p>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-surface-600">
                        <MapPin className="h-3.5 w-3.5 text-surface-400" />
                        {row.location || 'Remote'}
                      </div>
                    </td>
                    <td className="table-cell font-semibold text-surface-900">
                      {row.stipend ? `₹${row.stipend.toLocaleString()}/mo` : 'Unpaid'}
                    </td>
                    <td className="table-cell">
                      <button onClick={() => setCandidatesFor(row)} className="flex items-center gap-1.5 text-sm font-bold text-secondary-600 hover:text-secondary-700 transition-colors">
                        <Users className="h-4 w-4" />
                        {row.applications?.length || 0}
                      </button>
                    </td>
                    <td className="table-cell">
                      <InternshipStatusPill status={row.status} onToggle={() => handleToggleStatus(row._id, row.status)} loading={loadingToggle === row._id} />
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setCandidatesFor(row)} className="p-1.5 rounded-lg text-surface-400 hover:bg-secondary-50 hover:text-secondary-600 transition-colors" title="View Candidates">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => navigate(`/app/provider/postings/${row._id}/edit`)} className="p-1.5 rounded-lg text-surface-400 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(row._id)} className="p-1.5 rounded-lg text-surface-400 hover:bg-danger-50 hover:text-danger-600 transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidates modal */}
      <AnimatePresence>
        {candidatesFor && (
          <CandidatesModal internship={candidatesFor} onClose={() => setCandidatesFor(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
