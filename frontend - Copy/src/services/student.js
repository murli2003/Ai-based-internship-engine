import api from './api';

const unwrap = (res) => res.data?.data ?? res.data;
const unwrapStats = (res) => res.data?.stats ?? res.data;

export const studentService = {
  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile: () => api.get('/auth/me').then((r) => r.data?.user ?? r.data),
  updateProfile: (data) => api.patch('/auth/profile', data).then((r) => r.data?.user ?? r.data),

  // ── AI Recommendations ────────────────────────────────────────────────────
  getRecommendations: (limit = 20) =>
    api.get(`/student/internship-matches`).then((r) => {
      const raw = r.data?.data || [];

      const recommendations = raw.map((item, idx) => {
        const matchPercent    = item.matchScore    || 0;
        const requiredMatched = item.requiredMatched ?? 0;
        const requiredTotal   = item.requiredTotal   ?? 0;
        const matchedSkills   = item.matchedSkills   || [];

        // Derive content-based score from required skill ratio
        const contentScore = requiredTotal > 0
          ? Math.round((requiredMatched / requiredTotal) * 100)
          : matchPercent;

        // Compute skill gaps (required skills that were NOT matched)
        const matchedNames = new Set(
          matchedSkills.map((m) => (m?.skill ?? m ?? '').toLowerCase().trim()).filter(Boolean)
        );
        const skillGaps = (item.requiredSkills || [])
          .filter((s) => !matchedNames.has(String(s).toLowerCase().trim()))
          .slice(0, 8);

        // Build reasonDetails for the toggle panel
        const reasonDetails = [];
        const skillImpact = contentScore >= 70 ? 'high' : contentScore >= 40 ? 'medium' : 'low';
        const skillMsg =
          requiredTotal > 0
            ? `You match ${requiredMatched} of ${requiredTotal} required skills${matchedSkills.length > 0 ? ` (${matchedSkills.slice(0, 3).map((m) => m?.skill ?? m).join(', ')}${matchedSkills.length > 3 ? '…' : ''})` : ''}.`
            : 'Skills compared against internship requirements.';

        reasonDetails.push({ factor: 'Skills', description: skillMsg, impact: skillImpact });

        if (item.domain) {
          reasonDetails.push({
            factor: 'Domain',
            description: `This internship is in the ${item.domain} domain.`,
            impact: 'low',
          });
        }
        if (item.location) {
          reasonDetails.push({
            factor: 'Location',
            description: `Based in ${item.location} (${item.mode || item.type || 'hybrid'}).`,
            impact: 'low',
          });
        }

        // Improvement suggestions
        const suggestions = [];
        if (skillGaps.length > 0 && skillGaps.length <= 3) {
          suggestions.push(`Boost your match by learning: ${skillGaps.join(', ')}`);
        } else if (skillGaps.length > 3) {
          suggestions.push(`Develop skills in ${skillGaps.slice(0, 2).join(', ')} and ${skillGaps.length - 2} more to strengthen your profile.`);
        }

        // Rank explanation
        const rankLabel =
          idx === 0 ? '🏆 Your #1 AI match! Best skill alignment in your profile.' :
          idx <= 2  ? `⭐ Top 3 match — ranked #${idx + 1} for strong overall fit.` :
          idx <= 4  ? `✓ Solid match ranked #${idx + 1}. Worth applying if it interests you.` :
                      `Ranked #${idx + 1} based on skill and domain alignment.`;

        const confidence =
          matchPercent >= 70 ? 'high' :
          matchPercent >= 40 ? 'medium' : 'low';

        const summaryParts = [];
        if (contentScore >= 60) summaryParts.push('Strong skill alignment');
        else if (contentScore >= 30) summaryParts.push('Moderate skill match');
        else summaryParts.push('Eligible based on profile');
        if (item.domain) summaryParts.push(`${item.domain} domain`);

        return {
          rank: idx + 1,
          internship: {
            _id:             item._id,
            title:           item.title,
            description:     item.description,
            domain:          item.domain        || '',
            mode:            item.mode          || (item.type?.toLowerCase() === 'remote' ? 'remote' : item.type?.toLowerCase() === 'on-site' ? 'onsite' : 'hybrid'),
            location:        item.location      || '',
            stipend:         item.stipend       || 0,
            package:         item.package       || '',
            requiredSkills:  item.requiredSkills  || [],
            preferredSkills: item.preferredSkills || [],
            durationWeeks:   item.durationWeeks  || null,
            applicationDeadline: item.applicationDeadline || null,
            openings:        item.openings      || item.slots || 1,
            providerRef:     item.organization  || { orgName: item.companyName },
            companyName:     item.companyName   || item.organization?.companyName || '',
            isActive:        item.isActive !== false,
            status:          item.status        || 'active',
            createdAt:       item.createdAt,
          },
          matchPercent,
          scores: {
            overall:       matchPercent,
            content:       contentScore,
            collaborative: 0,
            nlp:           0,
          },
          explanation: {
            summary:         summaryParts.join(' • '),
            rankExplanation: rankLabel,
            reasonDetails,
            suggestions,
          },
          skillGaps,
          matchedSkills,
          confidence,
        };
      });

      return {
        recommendations,
        total:              r.data?.count           || 0,
        profileSkillsCount: r.data?.profileSkillsCount || 0,
      };
    }),

  // ── Internship matches (new endpoint) ─────────────────────────────────────
  getInternshipMatches: () => api.get('/student/internship-matches').then((r) => r.data),

  // ── Resume analyses ───────────────────────────────────────────────────────
  getAnalyses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/student/analyses${qs ? '?' + qs : ''}`).then((r) => r.data);
  },
  getAnalysis:    (id)   => api.get(`/student/analyses/${id}`).then((r) => r.data),
  saveAnalysis:   (data) => api.post('/student/analyses', data).then((r) => r.data),
  deleteAnalysis: (id)   => api.delete(`/student/analyses/${id}`).then((r) => r.data),
  getStats:       ()     => api.get('/student/stats').then((r) => r.data),

  // ── Applications ──────────────────────────────────────────────────────────
  getApplications: () =>
    api.get('/student/my-applications').then((r) => r.data?.data ?? r.data ?? []),
  getApplicationStats: () =>
    api.get('/student/application-stats').then((r) => r.data?.data ?? r.data),
  applyToInternship: (internshipId, data = {}) =>
    api.post(`/internships/${internshipId}/apply`, data).then((r) => r.data),

  // ── Skill gap (calculated from profile vs recommendations) ───────────────
  getSkillGap: () =>
    api.get('/student/internship-matches').then((r) => {
      const matches = r.data?.data || [];
      if (!matches.length) return null;

      const requiredSet = new Map();
      matches.forEach((job) => {
        (job.requiredSkills || []).forEach((s) => {
          const k = s.toLowerCase().trim();
          requiredSet.set(k, (requiredSet.get(k) || 0) + 1);
        });
      });

      const profileSkills = new Set(
        matches.flatMap((j) => j.matchedSkills || []).map((m) => m.skill?.toLowerCase().trim()).filter(Boolean)
      );

      const totalRequired = requiredSet.size;
      const matched       = [...requiredSet.keys()].filter((k) => profileSkills.has(k));
      const missing       = [...requiredSet.keys()].filter((k) => !profileSkills.has(k));
      const coveragePercent = totalRequired ? Math.round((matched.length / totalRequired) * 100) : 0;

      const pct = (skill) => Math.round(((requiredSet.get(skill.toLowerCase().trim()) || 0) / matches.length) * 100);

      return {
        matchedCount: matched.length,
        missingCount: missing.length,
        coveragePercent,
        totalRequiredSkills: totalRequired,
        topMatchedSkills: matched.slice(0, 10).map((s) => ({ skill: s, demandPct: pct(s) })),
        topMissingSkills: missing.slice(0, 10).sort((a, b) => pct(b) - pct(a)).map((s) => ({ skill: s, demandPct: pct(s) })),
        perInternshipGaps: matches.slice(0, 5).map((j) => {
          const gaps = (j.requiredSkills || []).filter((sk) => !profileSkills.has(sk.toLowerCase().trim()));
          return { internshipId: j._id, title: j.title, domain: j.domain, gapCount: gaps.length, gaps };
        }),
      };
    }),

  // ── Resume file upload ────────────────────────────────────────────────────
  uploadResumeFile: (file) => {
    const token = localStorage.getItem('token');
    const form  = new FormData();
    form.append('resume', file);
    return fetch('/api/student/resume-file', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      return data;
    });
  },

  // ── Match resume preview (for live scanning) ─────────────────────────────
  matchResumePreview: (body) => api.post('/student/match-resume-preview', body).then((r) => r.data),

  // ── Avatar upload ─────────────────────────────────────────────────────────
  uploadAvatar: (formData) =>
    api.post('/student/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data?.data ?? r.data),
};
