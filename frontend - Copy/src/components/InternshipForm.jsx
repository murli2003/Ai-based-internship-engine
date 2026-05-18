import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../services/api';

const MODES = ['remote', 'onsite', 'hybrid'];
const STATUS_OPTIONS = ['draft', 'active', 'closed'];

export default function InternshipForm({ internship, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    domain: '',
    requiredSkills: [],
    minCgpa: '',
    durationWeeks: '',
    stipend: '',
    mode: 'hybrid',
    location: '',
    slots: 1,
    status: 'active',
  });
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (internship) {
      setForm({
        title: internship.title || '',
        description: internship.description || '',
        domain: internship.domain || '',
        requiredSkills: internship.requiredSkills || [],
        minCgpa: internship.minCgpa ?? '',
        durationWeeks: internship.durationWeeks ?? '',
        stipend: internship.stipend ?? '',
        mode: internship.mode || 'hybrid',
        location: internship.location || '',
        slots: internship.slots ?? 1,
        status: internship.status || 'active',
      });
    }
  }, [internship]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.requiredSkills.includes(s)) {
      update('requiredSkills', [...form.requiredSkills, s]);
      setSkillInput('');
    }
  };

  const removeSkill = (idx) => {
    update('requiredSkills', form.requiredSkills.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        minCgpa: form.minCgpa !== '' ? Number(form.minCgpa) : 0,
        durationWeeks: form.durationWeeks ? Number(form.durationWeeks) : undefined,
        stipend: form.stipend !== '' ? Number(form.stipend) : undefined,
        slots: Number(form.slots) || 1,
      };
      if (internship) {
        await api.put(`/internships/${internship._id}`, payload);
      } else {
        await api.post('/internships', payload);
      }
      onSaved?.();
    } catch (e) {
      alert(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-intense custom-scrollbar"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-100 bg-white px-6 py-4">
          <h2 className="text-lg font-extrabold text-surface-900">
            {internship ? 'Edit Internship' : 'Create New Internship'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Title <span className="text-danger-500">*</span></label>
            <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} className="input-field" required placeholder="e.g. Frontend Developer Intern" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="textarea-field" rows={3} placeholder="Describe the internship role, responsibilities, and what the intern will learn…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Domain</label>
              <input type="text" value={form.domain} onChange={(e) => update('domain', e.target.value)} className="input-field" placeholder="e.g. Technology, Finance, Marketing" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Location</label>
              <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} className="input-field" placeholder="e.g. Bangalore, India" />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Required Skills</label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
              {form.requiredSkills.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-primary-50 border border-primary-200 px-2.5 py-1 text-xs font-semibold text-primary-800">
                  {s}
                  <button type="button" onClick={() => removeSkill(i)} className="text-primary-500 hover:text-primary-700 ml-0.5">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="input-field flex-1"
                placeholder="Type a skill and press Enter or click Add"
              />
              <button type="button" onClick={addSkill} className="btn-secondary shrink-0">Add</button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Min CGPA</label>
              <input type="number" step="0.01" min={0} max={10} value={form.minCgpa} onChange={(e) => update('minCgpa', e.target.value)} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Duration (weeks)</label>
              <input type="number" min={1} value={form.durationWeeks} onChange={(e) => update('durationWeeks', e.target.value)} className="input-field" placeholder="e.g. 8" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Stipend (₹/month)</label>
              <input type="number" min={0} value={form.stipend} onChange={(e) => update('stipend', e.target.value)} className="input-field" placeholder="e.g. 10000" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Mode</label>
              <select value={form.mode} onChange={(e) => update('mode', e.target.value)} className="select-field">
                {MODES.map((m) => <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Open Slots</label>
              <input type="number" min={1} value={form.slots} onChange={(e) => update('slots', e.target.value)} className="input-field" />
            </div>
          </div>

          {internship && (
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className="select-field">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-surface-100">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><span className="spinner-sm" /> Saving…</> : internship ? 'Save Changes' : 'Create Internship'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
