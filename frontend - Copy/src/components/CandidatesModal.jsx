import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Eye } from 'lucide-react';
import StudentProfileViewModal from './StudentProfileViewModal';

export default function CandidatesModal({ internship, onClose }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewStudentId, setViewStudentId] = useState(null);

  useEffect(() => {
    api
      .get(`/providers/internships/${internship._id}/candidates`)
      .then((r) => setList(r.data))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [internship._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50" onClick={onClose}>
      <div
        className="card max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900">
            Suggested candidates — {internship.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 hover:text-surface-700"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : list.length === 0 ? (
            <p className="text-surface-500 text-center py-8">No candidates yet.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((item, idx) => (
                <li key={item.student?._id || idx} className="rounded-lg border border-surface-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-surface-900">{item.student?.fullName || 'Student'}</p>
                      <p className="text-sm text-surface-500">{item.student?.institution || '—'}</p>
                      <p className="text-xs text-surface-500 mt-1">
                        CGPA: {item.student?.cgpa ?? '—'} · Skills: {(item.student?.skills || []).map((s) => s.name).join(', ') || '—'}
                      </p>
                      {item.explanation?.whyThisRank && (
                        <p className="text-xs text-surface-600 mt-1">{item.explanation.whyThisRank}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">
                        {item.matchPercent}% match
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const sid = item.student?.userId?._id || item.student?.userId || item.student?._id;
                          if (sid) setViewStudentId(sid);
                        }}
                        className="p-1.5 rounded-lg text-surface-500 hover:bg-secondary-50 hover:text-secondary-700 transition-colors"
                        title="View student profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {viewStudentId && (
          <StudentProfileViewModal studentId={viewStudentId} onClose={() => setViewStudentId(null)} />
        )}
      </div>
    </div>
  );
}
