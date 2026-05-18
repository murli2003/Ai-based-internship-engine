import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [aRes, uRes] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/admin/users'),
        ]);
        setAnalytics(aRes.data);
        setUsers(uRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const ov = analytics?.overview || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-surface-900 tracking-tight">Admin dashboard</h1>
        <p className="mt-1 text-surface-500">Platform analytics and user management.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm font-medium text-surface-500">Total users</p>
          <p className="mt-1 text-2xl font-semibold text-surface-900">{ov.userCount ?? 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-surface-500">Active internships</p>
          <p className="mt-1 text-2xl font-semibold text-surface-900">{ov.internshipCount ?? 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-surface-500">Applications</p>
          <p className="mt-1 text-2xl font-semibold text-surface-900">{ov.applicationCount ?? 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-surface-500">Feedback entries</p>
          <p className="mt-1 text-2xl font-semibold text-surface-900">{ov.feedbackCount ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200">
            <h2 className="text-lg font-medium text-surface-900">By domain</h2>
          </div>
          <div className="p-5">
            {analytics?.byDomain?.length ? (
              <ul className="space-y-2">
                {analytics.byDomain.map((d) => (
                  <li key={d._id || d.domain} className="flex justify-between text-sm">
                    <span className="text-surface-700">{d._id || 'Other'}</span>
                    <span className="font-medium text-surface-900">{d.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-surface-500 text-sm">No data</p>
            )}
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200">
            <h2 className="text-lg font-medium text-surface-900">Application status</h2>
          </div>
          <div className="p-5">
            {analytics?.byStatus?.length ? (
              <ul className="space-y-2">
                {analytics.byStatus.map((s) => (
                  <li key={s._id} className="flex justify-between text-sm">
                    <span className="text-surface-700 capitalize">{s._id}</span>
                    <span className="font-medium text-surface-900">{s.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-surface-500 text-sm">No data</p>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200">
          <h2 className="text-lg font-medium text-surface-900">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-200">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-500">Email</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-500">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 bg-white">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-surface-50/50">
                  <td className="px-5 py-4 text-sm text-surface-900">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-700 capitalize">
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
