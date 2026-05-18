import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User, Mail, Phone, BookOpen, FileText, Code2,
  Briefcase, GraduationCap, FolderGit2, Award, Sparkles, Plus, Trash2,
  Save, Loader2, Upload, CheckCircle2, AlertCircle, RefreshCw, X,
  ChevronDown, ChevronUp, ExternalLink, Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseResume } from '../utils/resumeParser';
import { studentService } from '../services/student';
import { useAuth } from '../context/AuthContext';

function parseSkillLines(text) {
  if (!text || typeof text !== 'string') return [];
  return [...new Set(text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean))];
}

function emptyRp() {
  return {
    experiences: [],
    education: [],
    projects: [],
    skillCategories: [],
    certificates: [],
    achievements: [],
    extracurricular: [],
    researchPapers: [],
  };
}

function normalizeRp(raw) {
  const base = emptyRp();
  if (!raw || typeof raw !== 'object') return base;
  return {
    experiences:      Array.isArray(raw.experiences)      ? raw.experiences      : [],
    education:        Array.isArray(raw.education)        ? raw.education        : [],
    projects:         Array.isArray(raw.projects)         ? raw.projects         : [],
    skillCategories:  Array.isArray(raw.skillCategories)  ? raw.skillCategories  : [],
    certificates:     Array.isArray(raw.certificates)     ? raw.certificates     : [],
    achievements:     Array.isArray(raw.achievements)     ? raw.achievements     : [],
    extracurricular:  Array.isArray(raw.extracurricular)  ? raw.extracurricular  : [],
    researchPapers:   Array.isArray(raw.researchPapers)   ? raw.researchPapers   : [],
  };
}

const highlightsToText = (h) => (Array.isArray(h) ? h.filter(Boolean).join('\n') : '');
const textToHighlights = (t) => t.split('\n').map((l) => l.trim()).filter(Boolean);

/* ─── Re-upload modal ────────────────────────────────────────────── */
function ReuploadModal({ onClose, onDone }) {
  const { user, updateUser, refreshUser } = useAuth();
  const [phase, setPhase]     = useState('idle'); // idle | analyzing | success | error
  const [progress, setProgress] = useState({ msg: '', pct: 0 });
  const [parsed, setParsed]   = useState(null);
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [skillsText, setSkillsText] = useState(
    Array.isArray(user?.skills) && user.skills.length ? user.skills.join('\n') : ''
  );
  const [fileName, setFileName] = useState('');
  const pendingRef = useRef(null);
  const fileRef    = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') { setError('Please upload a PDF file.'); return; }
    if (file.size > 5 * 1024 * 1024)              { setError('File must be under 5 MB.'); return; }
    setError('');
    setFileName(file.name);
    pendingRef.current = file;
    setPhase('analyzing');
    setProgress({ msg: 'Reading PDF…', pct: 5 });
    try {
      const resume = await parseResume(file, 'student');
      setParsed(resume);
      const steps = [
        { msg: 'Extracting details…', pct: 30 },
        { msg: 'Detecting skills…',   pct: 60 },
        { msg: 'Mapping sections…',   pct: 90 },
        { msg: 'Done!',               pct: 100 },
      ];
      for (const s of steps) {
        setProgress(s);
        await new Promise((r) => setTimeout(r, 350 + Math.random() * 200));
      }
      const sk = Array.isArray(resume.skills) ? resume.skills : [];
      const cats = (resume.resumeProfile?.skillCategories || []).flatMap((c) => c.skills || []);
      setSkillsText(sk.length ? sk.join('\n') : cats.length ? cats.join('\n') : skillsText);
      setPhase('preview');
    } catch {
      setError("Could not read the PDF. Use a text-based PDF, not a scanned image.");
      setPhase('idle');
    }
  }, [skillsText]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (pendingRef.current) {
        const up = await studentService.uploadResumeFile(pendingRef.current);
        if (up?.user) updateUser(up.user);
        pendingRef.current = null;
      }
      const payload = {
        resumeFileName: fileName || undefined,
        resumeProfile:  parsed?.resumeProfile || undefined,
        skills:         parseSkillLines(skillsText),
        profileCompleted: true,
        ...(parsed?.name       && { fullName: parsed.name }),
        ...(parsed?.mobile     && { phone: parsed.mobile }),
        ...(parsed?.github     && { github: parsed.github }),
        ...(parsed?.linkedin   && { linkedin: parsed.linkedin }),
        ...(parsed?.universityHint && { university: parsed.universityHint }),
      };
      const updated = await studentService.updateProfile(payload);
      const u = updated?.user ?? updated;
      if (u) updateUser(u);
      await refreshUser?.();
      setPhase('success');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Save failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={phase !== 'analyzing' ? onClose : undefined} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md rounded-2xl border border-surface-200 bg-white shadow-intense overflow-hidden"
      >
        <div className="h-1 bg-gradient-to-r from-primary-500 to-secondary-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-extrabold text-surface-900 text-lg">Re-upload Resume</h3>
            {phase !== 'analyzing' && (
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {error && (
            <div className="alert-error mb-4 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {phase === 'idle' && (
            <div>
              <div
                className={`drop-zone py-10 px-4 mb-4 ${dragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <Upload className="h-9 w-9 text-primary-500 mx-auto mb-2" />
                <p className="font-semibold text-surface-800 text-center">Drop PDF here or click to browse</p>
                <p className="text-xs text-surface-400 text-center mt-1">PDF only · max 5 MB</p>
              </div>
              <button type="button" onClick={onClose} className="btn-secondary w-full">Cancel</button>
            </div>
          )}

          {phase === 'analyzing' && (
            <div className="text-center py-4">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full bg-primary-200/50 animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 text-primary-600 animate-spin" />
                </div>
              </div>
              <p className="font-semibold text-surface-900 mb-1">{progress.msg}</p>
              <div className="match-bar-container max-w-xs mx-auto">
                <motion.div className="match-bar-fill" animate={{ width: `${progress.pct}%` }} transition={{ duration: 0.4 }} />
              </div>
              <p className="text-xs text-surface-400 mt-2">{progress.pct}%</p>
            </div>
          )}

          {phase === 'preview' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-success-200 bg-success-50 p-3 text-sm flex items-center gap-2 text-success-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success-600" />
                Resume parsed. Review skills below then save.
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1.5 flex items-center gap-1">
                  <Code2 className="h-3 w-3" /> Skills (one per line or comma-separated)
                </label>
                <textarea
                  className="input-field font-mono text-xs min-h-[96px]"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                />
                <p className="text-[10px] text-surface-400 mt-1">{parseSkillLines(skillsText).length} skills</p>
              </div>
              {parsed?.resumeProfile && (
                <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 text-xs text-surface-600 space-y-1">
                  {parsed.resumeProfile.education?.length > 0 && (
                    <p><span className="font-semibold text-surface-800">Education:</span> {parsed.resumeProfile.education.map((e) => e.institution).filter(Boolean).join(', ')}</p>
                  )}
                  {parsed.resumeProfile.experiences?.length > 0 && (
                    <p><span className="font-semibold text-surface-800">Experience:</span> {parsed.resumeProfile.experiences.map((e) => `${e.title} @ ${e.company}`).filter(Boolean).join(', ')}</p>
                  )}
                  {parsed.resumeProfile.projects?.length > 0 && (
                    <p><span className="font-semibold text-surface-800">Projects:</span> {parsed.resumeProfile.projects.map((p) => p.name).filter(Boolean).join(', ')}</p>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setPhase('idle'); setParsed(null); }} className="btn-secondary flex-1">Pick another</button>
                <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex-[2] gap-2 justify-center">
                  {saving ? <><span className="spinner-sm border-white/30 border-t-white" /> Saving…</> : <><Save className="h-4 w-4" /> Save to profile</>}
                </button>
              </div>
            </div>
          )}

          {phase === 'success' && (
            <div className="text-center py-4">
              <div className="h-14 w-14 rounded-full bg-success-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <h4 className="font-extrabold text-surface-900 mb-1">Profile updated!</h4>
              <p className="text-sm text-surface-500 mb-5">Your resume data has been mapped to your profile.</p>
              <button type="button" onClick={onDone} className="btn-primary w-full gap-2 justify-center">
                <RefreshCw className="h-4 w-4" /> Reload profile
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Section wrapper ─────────────────────────────────────────────── */
function Section({ icon: Icon, title, badge, action, children, collapsible = false }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card overflow-hidden">
      <div className={`flex items-center justify-between px-5 py-4 ${collapsible ? 'cursor-pointer select-none' : ''}`} onClick={collapsible ? () => setOpen((o) => !o) : undefined}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary-50">
            <Icon className="h-4 w-4 text-primary-600" />
          </div>
          <h3 className="font-extrabold text-surface-900 text-base">{title}</h3>
          {badge != null && (
            <span className="rounded-full bg-primary-100 text-primary-700 text-[11px] font-bold px-2 py-0.5">{badge}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {collapsible && (
            <button type="button" className="text-surface-400 p-1">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-surface-100 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-surface-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function AddBtn({ onClick, label = 'Add' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors px-3 py-2 text-xs font-semibold"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function RemoveBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-all"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

/* ─── Main component ──────────────────────────────────────────────── */
export default function StudentProfileAdvanced({ profile, userEmail, onSave }) {
  const [fullName,   setFullName]   = useState('');
  const [phone,      setPhone]      = useState('');
  const [university, setUniversity] = useState('');
  const [github,     setGithub]     = useState('');
  const [linkedin,   setLinkedin]   = useState('');
  const [bio,        setBio]        = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [rp,         setRp]         = useState(emptyRp);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [showReupload, setShowReupload] = useState(false);
  const [skillInput,  setSkillInput]  = useState('');
  const [avatarUrl,   setAvatarUrl]   = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName || '');
    setPhone(profile.phone || '');
    setUniversity(profile.university || '');
    setGithub(profile.github || '');
    setLinkedin(profile.linkedin || '');
    setBio(profile.bio || '');
    const sk = profile.skills;
    setSkillsText(Array.isArray(sk) && sk.length ? sk.join('\n') : '');
    setRp(normalizeRp(profile.resumeProfile));
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
      const res = await studentService.uploadAvatar(fd);
      setAvatarUrl(res.avatarUrl || preview);
    } catch {
      // keep local preview if upload fails
    } finally {
      setAvatarUploading(false);
    }
  };

  const addSkill = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const current = parseSkillLines(skillsText);
    if (!current.includes(trimmed)) {
      setSkillsText(current.length ? current.join('\n') + '\n' + trimmed : trimmed);
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    const updated = parseSkillLines(skillsText).filter((s) => s !== skill);
    setSkillsText(updated.join('\n'));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await onSave?.({
        fullName,
        phone,
        university,
        github,
        linkedin,
        bio,
        skills: parseSkillLines(skillsText),
        resumeProfile: rp,
        ...(avatarUrl && !avatarUrl.startsWith('blob:') ? { avatarUrl } : {}),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ── Updaters ────────────────────────────────────────────────────
  const updateRp = (key, updater) => setRp((p) => ({ ...p, [key]: updater(p[key]) }));

  const updateExp = (i, field, val) =>
    updateRp('experiences', (arr) => arr.map((e, j) => j === i ? { ...e, [field]: val } : e));

  const updateEdu = (i, field, val) =>
    updateRp('education', (arr) => arr.map((e, j) => j === i ? { ...e, [field]: val } : e));

  const updateProj = (i, field, val) =>
    updateRp('projects', (arr) => arr.map((p, j) => j === i ? { ...p, [field]: val } : p));

  const updateCat = (i, field, val) =>
    updateRp('skillCategories', (arr) => arr.map((c, j) => j === i ? { ...c, [field]: val } : c));

  const initials = (fullName || userEmail || 'S')[0].toUpperCase();
  const skillsArr = parseSkillLines(skillsText);

  return (
    <>
      {showReupload && (
        <ReuploadModal
          onClose={() => setShowReupload(false)}
          onDone={() => { setShowReupload(false); refreshUser?.(); window.location.reload(); }}
        />
      )}

      <form onSubmit={handleSave} className="space-y-5 w-full min-w-0">

        {/* ── Profile header card ───────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-600 to-secondary-600 p-6 shadow-elevated">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0 group">
              <div className="h-20 w-20 rounded-2xl border-2 border-white/30 shadow-lg overflow-hidden bg-white/20 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Change photo"
              >
                {avatarUploading
                  ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                  : <Camera className="h-5 w-5 text-white" />
                }
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest mb-0.5">Student</p>
              <h2 className="text-2xl font-extrabold text-white truncate">{fullName || 'Your name'}</h2>
              <p className="text-white/70 text-sm flex items-center gap-1.5 mt-1 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" /> {userEmail || '—'}
              </p>
              {university && (
                <p className="text-white/60 text-sm flex items-center gap-1.5 mt-0.5 truncate">
                  <GraduationCap className="h-3.5 w-3.5 shrink-0" /> {university}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {profile?.resumeFileName && (
                <div className="flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-3 py-2">
                  <FileText className="h-3.5 w-3.5 text-white/70 shrink-0" />
                  <span className="text-[11px] text-white/80 truncate max-w-[180px]">{profile.resumeFileName}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowReupload(true)}
                className="flex items-center gap-2 rounded-xl bg-white text-primary-700 font-semibold px-3 py-2 text-xs shadow-soft hover:bg-primary-50 transition-all"
              >
                <Upload className="h-3.5 w-3.5" />
                {profile?.resumeFileName ? 'Re-upload resume' : 'Upload resume'}
              </button>
            </div>
          </div>

          {/* Social links strip */}
          {(github || linkedin) && (
            <div className="relative flex flex-wrap gap-2 mt-4">
              {github && (
                <a href={github} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 border border-white/20 text-white/80 hover:bg-white/25 transition-colors px-3 py-1.5 text-xs font-medium">
                  <GithubIcon className="h-3.5 w-3.5" /> GitHub <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              )}
              {linkedin && (
                <a href={linkedin} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 border border-white/20 text-white/80 hover:bg-white/25 transition-colors px-3 py-1.5 text-xs font-medium">
                  <LinkedinIcon className="h-3.5 w-3.5" /> LinkedIn <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Contact & basic info ──────────────────────────────── */}
        <Section icon={User} title="Contact & Info">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Full name">
              <input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </FieldRow>
            <FieldRow label="Phone">
              <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
            </FieldRow>
            <FieldRow label="University / College">
              <input className="input-field" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. IIT Delhi" />
            </FieldRow>
            <FieldRow label="GitHub URL">
              <input className="input-field" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/…" />
            </FieldRow>
            <FieldRow label="LinkedIn URL">
              <input className="input-field" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" />
            </FieldRow>
            <FieldRow label="Short bio">
              <textarea className="input-field resize-none min-h-[72px]" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Two lines about you…" />
            </FieldRow>
          </div>
        </Section>

        {/* ── Skills (unified: chips + optional category grouping) ── */}
        <Section
          icon={Code2}
          title="Skills"
          badge={skillsArr.length > 0 ? skillsArr.length : undefined}
          action={<AddBtn onClick={() => updateRp('skillCategories', (a) => [...a, { category: '', skills: [] }])} label="Add Category" />}
        >
          <p className="text-xs text-surface-500 mb-3">Type and press Enter — chips are used to score AI internship fit. Group them by category for a richer profile.</p>

          {/* ── Chip input ── */}
          <div className="flex gap-2 mb-3">
            <input
              className="input-field flex-1 text-sm"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); }
              }}
              placeholder="e.g. Python, React, SQL…"
            />
            <button type="button" onClick={() => addSkill(skillInput)} className="btn-secondary px-4 text-sm">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* ── Bubble chips ── */}
          <div className="flex flex-wrap gap-2 min-h-[36px] mb-5">
            {skillsArr.length === 0 ? (
              <p className="text-sm text-surface-400">No skills added yet</p>
            ) : (
              skillsArr.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 text-primary-700 border border-primary-200 px-3 py-1 text-sm font-medium">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="rounded-full hover:bg-primary-200 p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* ── Category groups (optional) ── */}
          {rp.skillCategories.length > 0 && (
            <div className="border-t border-surface-100 pt-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 mb-2">Grouped by Category</p>
              {rp.skillCategories.map((c, i) => (
                <div key={i} className="rounded-xl border border-surface-200 bg-surface-50 p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    className="input-field text-sm font-semibold sm:w-44 bg-white"
                    placeholder="Category (e.g. Languages)"
                    value={c.category || ''}
                    onChange={(e) => updateCat(i, 'category', e.target.value)}
                  />
                  <input
                    className="input-field text-sm flex-1 bg-white"
                    placeholder="Skills (comma-separated)"
                    value={(c.skills || []).join(', ')}
                    onChange={(e) => updateCat(i, 'skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  />
                  <RemoveBtn onClick={() => updateRp('skillCategories', (a) => a.filter((_, j) => j !== i))} />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Experience ────────────────────────────────────────── */}
        <Section
          icon={Briefcase}
          title="Experience"
          badge={rp.experiences.length || undefined}
          action={<AddBtn onClick={() => updateRp('experiences', (a) => [...a, { title: '', company: '', location: '', period: '', highlights: [] }])} />}
          collapsible
        >
          {rp.experiences.length === 0 ? (
            <p className="text-sm text-surface-400">No roles listed. Add one manually or re-upload your resume.</p>
          ) : (
            <div className="space-y-4">
              {rp.experiences.map((ex, i) => (
                <div key={i} className="rounded-xl border border-surface-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-surface-500 uppercase">Role {i + 1}</p>
                    <RemoveBtn onClick={() => updateRp('experiences', (a) => a.filter((_, j) => j !== i))} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input className="input-field text-sm font-semibold" placeholder="Job title" value={ex.title || ''} onChange={(e) => updateExp(i, 'title', e.target.value)} />
                    <input className="input-field text-sm" placeholder="Company name" value={ex.company || ''} onChange={(e) => updateExp(i, 'company', e.target.value)} />
                    <input className="input-field text-sm" placeholder="Period (e.g. Jun 2024 – Present)" value={ex.period || ''} onChange={(e) => updateExp(i, 'period', e.target.value)} />
                    <input className="input-field text-sm" placeholder="Location" value={ex.location || ''} onChange={(e) => updateExp(i, 'location', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-surface-500 uppercase mb-1 block">Key highlights (one per line)</label>
                    <textarea
                      className="input-field text-sm min-h-[80px]"
                      placeholder="Built a scalable API with Node.js…"
                      value={highlightsToText(ex.highlights)}
                      onChange={(e) => updateExp(i, 'highlights', textToHighlights(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Education ─────────────────────────────────────────── */}
        <Section
          icon={GraduationCap}
          title="Education"
          badge={rp.education.length || undefined}
          action={<AddBtn onClick={() => updateRp('education', (a) => [...a, { institution: '', degree: '', grade: '', period: '', location: '' }])} />}
          collapsible
        >
          {rp.education.length === 0 ? (
            <p className="text-sm text-surface-400">No education entries. Add one or re-upload your resume.</p>
          ) : (
            <div className="space-y-4">
              {rp.education.map((ed, i) => (
                <div key={i} className="rounded-xl border border-surface-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-surface-500 uppercase">Entry {i + 1}</p>
                    <RemoveBtn onClick={() => updateRp('education', (a) => a.filter((_, j) => j !== i))} />
                  </div>
                  <input className="input-field text-sm font-semibold" placeholder="University / Institution name" value={ed.institution || ''} onChange={(e) => updateEdu(i, 'institution', e.target.value)} />
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input className="input-field text-sm" placeholder="Degree (e.g. MCA, B.Tech)" value={ed.degree || ''} onChange={(e) => updateEdu(i, 'degree', e.target.value)} />
                    <input className="input-field text-sm" placeholder="Grade / CGPA (e.g. 8.52)" value={ed.grade || ''} onChange={(e) => updateEdu(i, 'grade', e.target.value)} />
                    <input className="input-field text-sm" placeholder="Period (e.g. Aug 2022 – May 2024)" value={ed.period || ''} onChange={(e) => updateEdu(i, 'period', e.target.value)} />
                    <input className="input-field text-sm" placeholder="Location" value={ed.location || ''} onChange={(e) => updateEdu(i, 'location', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Projects ──────────────────────────────────────────── */}
        <Section
          icon={FolderGit2}
          title="Projects"
          badge={rp.projects.length || undefined}
          action={<AddBtn onClick={() => updateRp('projects', (a) => [...a, { name: '', period: '', highlights: [] }])} />}
          collapsible
        >
          {rp.projects.length === 0 ? (
            <p className="text-sm text-surface-400">No projects listed.</p>
          ) : (
            <div className="space-y-4">
              {rp.projects.map((pr, i) => (
                <div key={i} className="rounded-xl border border-surface-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-surface-500 uppercase">Project {i + 1}</p>
                    <RemoveBtn onClick={() => updateRp('projects', (a) => a.filter((_, j) => j !== i))} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input className="input-field text-sm font-semibold sm:col-span-2" placeholder="Project name" value={pr.name || ''} onChange={(e) => updateProj(i, 'name', e.target.value)} />
                    <input className="input-field text-sm sm:col-span-2" placeholder="Period (e.g. Jan 2024 – Mar 2024)" value={pr.period || ''} onChange={(e) => updateProj(i, 'period', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-surface-500 uppercase mb-1 block">Highlights (one per line)</label>
                    <textarea
                      className="input-field text-sm min-h-[72px]"
                      placeholder="Built a recommendation engine using Python…"
                      value={highlightsToText(pr.highlights)}
                      onChange={(e) => updateProj(i, 'highlights', textToHighlights(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Certificates & Achievements ───────────────────────── */}
        <div className="grid md:grid-cols-2 gap-5">
          <Section icon={Award} title="Certificates" badge={rp.certificates.length || undefined}>
            <textarea
              className="input-field text-sm min-h-[100px]"
              placeholder="One per line"
              value={rp.certificates.map((c) => (typeof c === 'string' ? c : c.title || c.name || '')).filter(Boolean).join('\n')}
              onChange={(e) =>
                setRp((p) => ({
                  ...p,
                  certificates: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean),
                }))
              }
            />
          </Section>
          <Section icon={Award} title="Achievements" badge={rp.achievements.length || undefined}>
            <textarea
              className="input-field text-sm min-h-[100px]"
              placeholder="One per line"
              value={rp.achievements.map((a) => (typeof a === 'string' ? a : a.text || '')).filter(Boolean).join('\n')}
              onChange={(e) =>
                setRp((p) => ({
                  ...p,
                  achievements: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean),
                }))
              }
            />
          </Section>
        </div>

        {/* ── Save button ───────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-sm text-success-700 font-semibold"
            >
              <CheckCircle2 className="h-4 w-4" /> Saved!
            </motion.span>
          )}
          <button type="submit" disabled={saving} className="btn-primary gap-2 min-w-[160px] justify-center">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save profile
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}

function GithubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.3c0 .32.22.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z" />
    </svg>
  );
}
