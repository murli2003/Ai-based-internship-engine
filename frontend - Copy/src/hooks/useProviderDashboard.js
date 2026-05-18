import { useState, useEffect, useCallback } from 'react';
import { providerService } from '../services/provider';

export function useProviderDashboard() {
  const [profile, setProfile]       = useState(null);
  const [internships, setInternships] = useState([]);
  const [analytics, setAnalytics]   = useState(null);
  const [pipeline, setPipeline]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [errors, setErrors]         = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      providerService.getProfile(),
      providerService.getInternships(),
      providerService.getAnalytics(),
      providerService.getPipeline(),
    ]);

    const [profR, internR, analyticsR, pipeR] = results;

    if (profR.status === 'fulfilled') setProfile(profR.value);
    else setErrors((e) => ({ ...e, profile: profR.reason?.response?.data?.message || 'Failed to load profile' }));

    if (internR.status === 'fulfilled') setInternships(internR.value);
    else setInternships([]);

    if (analyticsR.status === 'fulfilled') setAnalytics(analyticsR.value);
    else setAnalytics(null);

    if (pipeR.status === 'fulfilled') setPipeline(pipeR.value);
    else setPipeline([]);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createInternship = useCallback(async (data) => {
    const newOne = await providerService.createInternship(data);
    setInternships((prev) => [newOne, ...prev]);
    return newOne;
  }, []);

  const updateInternship = useCallback(async (id, data) => {
    const updated = await providerService.updateInternship(id, data);
    setInternships((prev) => prev.map((i) => (i._id === id ? updated : i)));
    return updated;
  }, []);

  const deleteInternship = useCallback(async (id) => {
    await providerService.deleteInternship(id);
    setInternships((prev) => prev.filter((i) => i._id !== id));
  }, []);

  const toggleStatus = useCallback(async (id, currentStatus) => {
    const next = currentStatus === 'active' ? 'closed' : 'active';
    const updated = await providerService.toggleInternshipStatus(id, next);
    setInternships((prev) => prev.map((i) => (i._id === id ? updated : i)));
    return updated;
  }, []);

  const updateApplicationStatus = useCallback(async (appId, status) => {
    await providerService.updateApplicationStatus(appId, status);
    setPipeline((prev) =>
      prev.map((a) => (a._id === appId ? { ...a, status } : a))
    );
  }, []);

  const updateProfile = useCallback(async (data) => {
    const updated = await providerService.updateProfile(data);
    setProfile(updated);
    return updated;
  }, []);

  return {
    profile,
    internships,
    analytics,
    pipeline,
    loading,
    errors,
    refresh: fetchAll,
    createInternship,
    updateInternship,
    deleteInternship,
    toggleStatus,
    updateApplicationStatus,
    updateProfile,
  };
}
