import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Camera, Loader2, CheckCircle, Save,
  Mail, Phone, Globe, MapPin, Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProviderData } from '../../context/ProviderDataContext';
import PageHeader from '../../components/PageHeader';
import { providerService } from '../../services/provider';

export default function ProviderCompanyProfile() {
  const { profile, updateProfile } = useProviderData();

  const [form, setForm] = useState({
    orgName:      '',
    industry:     '',
    location:     '',
    website:      '',
    contactEmail: '',
    contactPhone: '',
    description:  '',
  });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      orgName:      profile.orgName      || profile.companyName || '',
      industry:     profile.industry     || '',
      location:     profile.location     || '',
      website:      profile.website      || '',
      contactEmail: profile.contactEmail || profile.email || '',
      contactPhone: profile.contactPhone || profile.phone || '',
      description:  profile.description  || '',
    });
    setAvatarUrl(profile.avatarUrl || null);
  }, [profile]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await providerService.uploadAvatar(fd);
      setAvatarUrl(res.avatarUrl || preview);
      toast.success('Logo updated');
    } catch {
      // keep preview
      toast.error('Upload failed — preview shown');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      setSaved(true);
      toast.success('Company profile updated');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.orgName || 'O')[0].toUpperCase();

  const field = (key, label, type = 'text', placeholder = '', icon = null) => (
    <div>
      <label className="form-label mb-1.5 flex items-center gap-1.5">
        {icon && React.createElement(icon, { className: 'h-3.5 w-3.5 text-surface-400' })}
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title="Company Profile"
        subtitle="Keep your organization information up-to-date to attract the best candidates"
      />

      {/* ── Hero / Avatar card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-secondary-100 bg-gradient-to-br from-secondary-600 to-primary-600 p-6 shadow-elevated"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Logo / Avatar */}
          <div className="relative shrink-0 group">
            <div className="h-20 w-20 rounded-2xl border-2 border-white/30 shadow-lg overflow-hidden bg-white/20 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="company logo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Upload company logo"
            >
              {avatarUploading
                ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                : <Camera className="h-5 w-5 text-white" />
              }
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest mb-0.5">Organisation</p>
            <h2 className="text-2xl font-extrabold text-white truncate">{form.orgName || 'Your Company'}</h2>
            {form.industry && (
              <p className="text-white/70 text-sm mt-1 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 shrink-0" /> {form.industry}
              </p>
            )}
            {form.location && (
              <p className="text-white/60 text-sm mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" /> {form.location}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <p className="text-white/50 text-xs text-center">Hover avatar to change logo</p>
          </div>
        </div>
      </motion.div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="card p-8 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          {field('orgName',      'Organization Name', 'text',  'e.g. Acme Corp',          Building2)}
          {field('industry',     'Industry',          'text',  'e.g. Software, Finance',  Layers)}
          {field('location',     'Location',          'text',  'e.g. Bangalore, India',   MapPin)}
          {field('website',      'Website',           'url',   'https://yourcompany.com', Globe)}
          {field('contactEmail', 'Contact Email',     'email', 'contact@company.com',     Mail)}
          {field('contactPhone', 'Contact Phone',     'tel',   '+91 98765 43210',         Phone)}
        </div>
        <div>
          <label className="form-label mb-1.5">Company Description</label>
          <textarea rows={5} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Tell students about your company, culture, and what makes you a great place to intern…"
            className="textarea-field" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-sm text-success-700 font-semibold"
            >
              <CheckCircle className="h-4 w-4" /> Saved!
            </motion.span>
          )}
          <button type="submit" disabled={saving} className="btn-primary gap-2 min-w-[160px] justify-center">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><Save className="h-4 w-4" /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
