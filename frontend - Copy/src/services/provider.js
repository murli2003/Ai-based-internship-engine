import api from './api';

export const providerService = {
  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile: () =>
    api.get('/organization/profile').then((r) => r.data?.data ?? r.data),
  updateProfile: (data) =>
    api.put('/organization/profile', data).then((r) => r.data?.data ?? r.data),

  // ── Internships ───────────────────────────────────────────────────────────
  getInternships: () =>
    api.get('/internships/my').then((r) => {
      const data = r.data?.data ?? r.data ?? [];
      // Map to legacy format expected by ProviderDashboard
      return data.map((i) => ({
        ...i,
        status: i.status || (i.isActive !== false ? 'active' : 'closed'),
        mode:   i.mode   || (i.type?.toLowerCase() === 'remote' ? 'remote' : i.type?.toLowerCase() === 'on-site' ? 'onsite' : 'hybrid'),
        domain: i.domain || '',
        stipend: i.stipend || 0,
        applications: i.applications || [],
      }));
    }),

  // ── Analytics ─────────────────────────────────────────────────────────────
  getAnalytics: () =>
    api.get('/organization/analytics').then((r) => r.data?.data ?? r.data),

  // ── Pipeline ──────────────────────────────────────────────────────────────
  getPipeline: () =>
    api.get('/organization/pipeline').then((r) => r.data?.data ?? r.data ?? []),

  // ── Candidates ────────────────────────────────────────────────────────────
  getCandidates: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/organization/candidates${qs ? '?' + qs : ''}`).then((r) => r.data?.data ?? r.data ?? []);
  },

  // ── Per-internship candidates ─────────────────────────────────────────────
  getInternshipCandidates: (internshipId) =>
    api.get(`/internships/${internshipId}/applications`).then((r) => r.data?.data ?? r.data ?? []),

  // ── Internship CRUD ───────────────────────────────────────────────────────
  createInternship: (data) => api.post('/internships', data).then((r) => r.data?.data ?? r.data),
  updateInternship: (id, data) => api.put(`/internships/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteInternship: (id) => api.delete(`/internships/${id}`).then((r) => r.data),

  // The hook passes the DESIRED new status (already computed)
  toggleInternshipStatus: (id, newStatus) => {
    return api.patch(`/internships/${id}/status`, { status: newStatus }).then((r) => r.data?.data ?? r.data);
  },

  // ── Application status ────────────────────────────────────────────────────
  updateApplicationStatus: (appId, status, internshipId) => {
    if (internshipId) {
      return api.patch(`/internships/${internshipId}/applications/${appId}`, { status }).then((r) => r.data?.data ?? r.data);
    }
    return api.patch(`/internships/applications/${appId}/status`, { status }).then((r) => r.data?.data ?? r.data);
  },

  // ── Resume download ───────────────────────────────────────────────────────
  downloadStudentResume: (studentId) => {
    const token = localStorage.getItem('token');
    return fetch(`/api/organization/students/${studentId}/resume`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async (res) => {
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `HTTP ${res.status}`);
      }
      const blob  = await res.blob();
      const dispo = res.headers.get('Content-Disposition');
      let filename = 'resume.pdf';
      if (dispo) {
        const m = /filename="([^"]+)"/i.exec(dispo);
        if (m) filename = m[1];
      }
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
  },

  // ── View applicant full profile ───────────────────────────────────────
  getStudentProfile: (studentId) =>
    api.get(`/organization/students/${studentId}/profile`).then((r) => r.data?.data ?? r.data),

  // ── Stats ─────────────────────────────────────────────────────────────────
  getStats: () => api.get('/organization/stats').then((r) => r.data?.stats ?? r.data),

  // ── Avatar upload ─────────────────────────────────────────────────────────
  uploadAvatar: (formData) =>
    api.post('/organization/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data?.data ?? r.data),
};
