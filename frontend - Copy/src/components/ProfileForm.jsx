import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const MODES = ['remote', 'onsite', 'hybrid'];

export default function ProfileForm({ profile, onSave }) {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    institution: '',
    course: '',
    branch: '',
    yearOfStudy: '',
    cgpa: '',
    backlogs: 0,
    skills: [],
    certifications: [],
    preferences: { domains: [], locations: [], mode: 'hybrid' },
  });
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState({ name: '', level: 'beginner' });

  useEffect(() => {
    if (!profile) return;
    setForm({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      institution: profile.institution || '',
      course: profile.course || '',
      branch: profile.branch || '',
      yearOfStudy: profile.yearOfStudy ?? '',
      cgpa: profile.cgpa ?? '',
      backlogs: profile.backlogs ?? 0,
      skills: profile.skills || [],
      certifications: profile.certifications || [],
      preferences: {
        domains: profile.preferences?.domains || [],
        locations: profile.preferences?.locations || [],
        mode: profile.preferences?.mode || 'hybrid',
      },
    });
  }, [profile]);

  const update = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      if (path.includes('.')) {
        const [a, b] = path.split('.');
        next[a] = { ...next[a], [b]: value };
      } else next[path] = value;
      return next;
    });
  };

  const addSkill = () => {
    if (!skillInput.name.trim()) return;
    setForm((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: skillInput.name.trim(), level: skillInput.level }],
    }));
    setSkillInput({ name: '', level: 'beginner' });
  };

  const removeSkill = (i) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        yearOfStudy: form.yearOfStudy ? Number(form.yearOfStudy) : undefined,
        cgpa: form.cgpa !== '' ? Number(form.cgpa) : undefined,
      };
      const { data } = await api.put('/students/profile', payload);
      onSave?.(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Full name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Institution</label>
            <input
              type="text"
              value={form.institution}
              onChange={(e) => update('institution', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Course</label>
            <input
              type="text"
              value={form.course}
              onChange={(e) => update('course', e.target.value)}
              className="input-field"
              placeholder="e.g. B.Tech"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Branch</label>
            <input
              type="text"
              value={form.branch}
              onChange={(e) => update('branch', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Year of study</label>
            <input
              type="number"
              min={1}
              max={5}
              value={form.yearOfStudy}
              onChange={(e) => update('yearOfStudy', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">CGPA</label>
            <input
              type="number"
              step="0.01"
              min={0}
              max={10}
              value={form.cgpa}
              onChange={(e) => update('cgpa', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Backlogs</label>
            <input
              type="number"
              min={0}
              value={form.backlogs}
              onChange={(e) => update('backlogs', Number(e.target.value))}
              className="input-field"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1.5">Skills</label>
          <div className="flex gap-2 flex-wrap">
            {form.skills.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-sm text-primary-800"
              >
                {s.name} ({s.level})
                <button type="button" onClick={() => removeSkill(i)} className="ml-0.5 text-primary-600 hover:text-primary-800">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={skillInput.name}
              onChange={(e) => setSkillInput((p) => ({ ...p, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="input-field flex-1"
              placeholder="Skill name"
            />
            <select
              value={skillInput.level}
              onChange={(e) => setSkillInput((p) => ({ ...p, level: e.target.value }))}
              className="input-field w-36"
            >
              {SKILL_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button type="button" onClick={addSkill} className="btn-secondary">Add</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1.5">Preferred mode</label>
          <select
            value={form.preferences.mode}
            onChange={(e) => update('preferences.mode', e.target.value)}
            className="input-field"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
