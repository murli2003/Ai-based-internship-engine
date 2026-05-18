import React from 'react';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  shortlisted: 'bg-primary-100 text-primary-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-surface-200 text-surface-600',
  withdrawn: 'bg-surface-100 text-surface-500',
};

export default function ApplicationsList({ applications }) {
  if (!applications?.length) {
    return (
      <div className="card p-12 text-center text-surface-500">
        You haven't applied to any internships yet. Check your recommendations to apply.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-200">
          <thead className="bg-surface-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                Internship
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                Provider
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                Applied
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 bg-white">
            {applications.map((app) => (
              <tr key={app._id} className="hover:bg-surface-50/50">
                <td className="px-5 py-4">
                  <span className="font-medium text-surface-900">{app.internship?.title || '—'}</span>
                </td>
                <td className="px-5 py-4 text-sm text-surface-600">
                  {app.internship?.providerRef?.orgName || '—'}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[app.status] || STATUS_STYLES.pending
                    }`}
                  >
                    {app.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-surface-500">
                  {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
