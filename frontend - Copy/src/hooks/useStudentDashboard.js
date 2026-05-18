import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/student';
import { useAuth } from '../context/AuthContext';

export function useStudentDashboard() {
  const { refreshUser } = useAuth();
  const [profile, setProfile]               = useState(null);
  const [recommendations, setRecommendations] = useState({ recommendations: [] });
  const [applications, setApplications]     = useState([]);
  const [skillGap, setSkillGap]             = useState(null);
  const [appStats, setAppStats]             = useState(null);
  const [analyses, setAnalyses]             = useState([]);
  const [analyseStats, setAnalyseStats]     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [errors, setErrors]                 = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      studentService.getProfile(),
      studentService.getRecommendations(20),
      studentService.getApplications(),
      studentService.getSkillGap(),
      studentService.getApplicationStats(),
      studentService.getAnalyses({ limit: 8 }),
      studentService.getStats(),
    ]);

    const [profR, recR, appR, gapR, statsR, analysesR, analyseStatsR] = results;

    if (profR.status === 'fulfilled') setProfile(profR.value);
    else setErrors((e) => ({ ...e, profile: profR.reason?.message || 'Failed to load profile' }));

    if (recR.status === 'fulfilled') setRecommendations(recR.value);
    else setRecommendations({ recommendations: [] });

    if (appR.status === 'fulfilled') setApplications(appR.value);
    else setApplications([]);

    if (gapR.status === 'fulfilled') setSkillGap(gapR.value);
    else setSkillGap(null);

    if (statsR.status === 'fulfilled') setAppStats(statsR.value);
    else setAppStats(null);

    if (analysesR.status === 'fulfilled') setAnalyses(analysesR.value?.data || []);
    else setAnalyses([]);

    if (analyseStatsR.status === 'fulfilled') setAnalyseStats(analyseStatsR.value?.stats || null);
    else setAnalyseStats(null);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refreshApplications = useCallback(async () => {
    try {
      const data = await studentService.getApplications();
      setApplications(data);
    } catch {
      // silently ignore
    }
  }, []);

  const refreshAnalyses = useCallback(async () => {
    try {
      const [analysesR, statsR] = await Promise.all([
        studentService.getAnalyses({ limit: 8 }),
        studentService.getStats(),
      ]);
      setAnalyses(analysesR?.data || []);
      setAnalyseStats(statsR?.stats || null);
    } catch {
      // silently ignore
    }
  }, []);

  const deleteAnalysis = useCallback(async (id) => {
    await studentService.deleteAnalysis(id);
    setAnalyses((prev) => prev.filter((a) => a._id !== id));
    refreshAnalyses();
  }, [refreshAnalyses]);

  const updateProfile = useCallback(async (data) => {
    const updated = await studentService.updateProfile(data);
    setProfile(updated?.user || updated);
    // Re-fetch after profile update
    const [recR, gapR, statsR] = await Promise.allSettled([
      studentService.getRecommendations(20),
      studentService.getSkillGap(),
      studentService.getApplicationStats(),
    ]);
    if (recR.status === 'fulfilled') setRecommendations(recR.value);
    if (gapR.status === 'fulfilled') setSkillGap(gapR.value);
    if (statsR.status === 'fulfilled') setAppStats(statsR.value);
    // Also refresh auth user in context
    refreshUser?.();
    return updated;
  }, [refreshUser]);

  const computedStats = {
    totalApplications: applications.length,
    accepted:    applications.filter((a) => a.status === 'accepted').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    pending:     applications.filter((a) => ['applied', 'pending', 'reviewed'].includes(a.status)).length,
    rejected:    applications.filter((a) => a.status === 'rejected').length,
  };

  return {
    profile,
    recommendations,
    applications,
    skillGap,
    appStats,
    analyses,
    analyseStats,
    loading,
    errors,
    stats: computedStats,
    refresh: fetchAll,
    refreshApplications,
    refreshAnalyses,
    deleteAnalysis,
    updateProfile,
  };
}
