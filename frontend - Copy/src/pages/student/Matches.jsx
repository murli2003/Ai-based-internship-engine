import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target, RefreshCw, Briefcase, Filter } from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';
import RecommendationCard from '../../components/RecommendationCard';
import { SkeletonCard } from '../../components/Skeleton';
import PageHeader from '../../components/PageHeader';

export default function Matches() {
  const { recommendations, applications, loading, refresh, refreshApplications } = useStudentData();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');

  const appliedInternshipIds = useMemo(() => {
    const set = new Set();
    for (const app of applications || []) {
      const id = app.internship?._id ?? app.internship;
      if (id != null) set.add(String(id));
    }
    return set;
  }, [applications]);

  const recs = recommendations?.recommendations || [];
  const filtered = recs.filter((r) => {
    const matchesSearch =
      !search ||
      r.internship.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.internship.providerRef?.orgName || r.internship.companyName || '').toLowerCase().includes(search.toLowerCase());
    const matchesMode = filterMode === 'all' || r.internship.mode === filterMode;
    return matchesSearch && matchesMode;
  });

  const handleApplied = () => refreshApplications();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        title="AI Matches"
        subtitle={recs.length > 0 ? `${recs.length} internships matched to your skills using multi-dimensional AI scoring` : 'Complete your profile to unlock personalized matches'}
        actions={
          <button onClick={refresh} className="btn-secondary text-sm gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by title or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="select-field w-full sm:w-44 pl-9"
          >
            <option value="all">All Modes</option>
            <option value="remote">Remote</option>
            <option value="onsite">On-site</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="card p-16 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="p-5 rounded-2xl bg-primary-50">
              <Target className="h-14 w-14 text-primary-400 opacity-60" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-surface-900 mb-2">No Matches Found</h3>
          <p className="text-surface-500 mb-4 max-w-sm mx-auto text-sm">
            {recs.length === 0
              ? 'Add skills to your profile and upload your resume to unlock AI recommendations.'
              : 'No internships match your current filters.'}
          </p>
          {recs.length > 0 && (
            <button onClick={() => { setSearch(''); setFilterMode('all'); }} className="btn-secondary text-sm">
              Clear filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((rec, index) => (
            <motion.div
              key={rec.internship._id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <RecommendationCard
                recommendation={rec}
                onApplied={handleApplied}
                appliedInternshipIds={appliedInternshipIds}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
