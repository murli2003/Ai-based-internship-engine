import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, CheckCircle2, AlertCircle, Loader2,
  User, Phone, BookOpen, Github, Linkedin, Code2, FileText,
  Sparkles, Zap, Edit3, Star, Trophy, ChevronRight,
} from 'lucide-react';
import { parseResume } from '../utils/resumeParser';
import { studentService } from '../services/student';
import { useAuth } from '../context/AuthContext';

function parseSkillLines(text) {
  if (!text || typeof text !== 'string') return [];
  return [...new Set(text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean))];
}

function StepDots({ current, total = 4 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i < current ? 24 : i === current ? 32 : 8,
            opacity: i <= current ? 1 : 0.25,
          }}
          transition={{ duration: 0.3 }}
          className={`h-2 rounded-full ${i < current ? 'bg-success-500' : i === current ? 'bg-primary-600' : 'bg-surface-200'}`}
        />
      ))}
    </div>
  );
}

const slideIn = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

function WelcomeStep({ user, onStart }) {
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  return (
    <motion.div key="welcome" {...slideIn} className="text-center">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-2xl font-black text-white shadow-elevated">
            {firstName[0]?.toUpperCase() || '?'}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-warning-500 text-white shadow-soft">
            <Sparkles className="h-4 w-4" />
          </span>
        </div>
      </div>
      <h2 className="text-2xl font-extrabold text-surface-900 mb-2">Welcome, {firstName}!</h2>
      <p className="text-surface-500 text-sm leading-relaxed max-w-md mx-auto mb-6">
        Upload a PDF resume to continue. We extract your contact details, skills, education, experience, and projects so your profile and AI matches stay accurate.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[
          { icon: Zap, label: 'Auto-fill', desc: 'From your PDF', color: 'text-warning-600', bg: 'bg-warning-50 border-warning-100' },
          { icon: Trophy, label: 'Better matches', desc: 'Skill-aware', color: 'text-success-600', bg: 'bg-success-50 border-success-100' },
          { icon: Star, label: 'Full profile', desc: 'Sections mapped', color: 'text-primary-600', bg: 'bg-primary-50 border-primary-100' },
        ].map(({ icon: Icon, label, desc, color, bg }) => (
          <div key={label} className={`rounded-xl p-3 border text-center ${bg}`}>
            <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
            <p className="text-[11px] font-semibold text-surface-800">{label}</p>
            <p className="text-[10px] text-surface-500">{desc}</p>
          </div>
        ))}
      </div>
      <button type="button" onClick={onStart} className="btn-primary w-full justify-center gap-2">
        <Upload className="h-4 w-4" /> Upload resume to continue <ChevronRight className="h-4 w-4" />
      </button>
      <p className="text-xs text-surface-400 mt-4">PDF only · max 5 MB · text-based PDFs work best</p>
    </motion.div>
  );
}

function UploadStep({ onFile, error, onBack }) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };
  return (
    <motion.div key="upload" {...slideIn}>
      <div className="text-center mb-4">
        <p className="section-eyebrow mb-2">Step 1 of 2</p>
        <h2 className="text-xl font-extrabold text-surface-900">Upload your resume</h2>
        <p className="text-surface-500 text-sm mt-1">We&apos;ll parse it in your browser — then you can review before saving</p>
      </div>
      <div
        className={`drop-zone py-12 px-6 mb-4 ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        role="presentation"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <FileText className="h-10 w-10 text-primary-500 mx-auto mb-3" />
        <p className="font-semibold text-surface-800">Drop PDF here or click to browse</p>
        <p className="text-xs text-surface-400 mt-1">Private — stored for recruiters when you apply</p>
      </div>
      {error && (
        <div className="alert-error mb-4 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <button type="button" onClick={onBack} className="btn-secondary w-full">
        Back
      </button>
    </motion.div>
  );
}

function AnalyzingStep({ progress }) {
  const steps = [
    'Reading PDF document…',
    'Extracting personal details…',
    'Detecting technical skills…',
    'Analyzing projects…',
    'Completing profile data…',
  ];
  const currentIdx = Math.max(0, steps.findIndex((s) => s === progress.msg));
  return (
    <motion.div key="analyzing" {...slideIn} className="text-center py-2">
      <div className="relative mx-auto w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full bg-primary-200/50 animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center">
          <Loader2 className="h-9 w-9 text-primary-600 animate-spin" />
        </div>
      </div>
      <h2 className="text-lg font-extrabold text-surface-900 mb-1">Analyzing your resume</h2>
      <p className="text-surface-500 text-sm mb-5">{progress.msg || 'Processing…'}</p>
      <div className="flex justify-center gap-2 mb-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${i <= currentIdx ? 'bg-primary-500' : 'bg-surface-200'}`}
          />
        ))}
      </div>
      <div className="match-bar-container max-w-xs mx-auto">
        <motion.div
          className="match-bar-fill"
          animate={{ width: `${progress.pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <p className="text-xs text-surface-400 mt-2">{progress.pct}%</p>
    </motion.div>
  );
}

function ResumeExtractPreview({ rp }) {
  if (!rp) return null;
  const edu = rp.education || [];
  const exp = rp.experiences || [];
  const proj = rp.projects || [];
  const certs = rp.certificates || [];
  const ach = rp.achievements || [];
  const extra = rp.extracurricular || [];
  const sc = rp.skillCategories || [];
  const research = rp.researchPapers || [];
  if (!edu.length && !exp.length && !proj.length && !certs.length && !ach.length && !extra.length && !sc.length && !research.length) {
    return null;
  }
  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 space-y-3 text-left">
      <p className="text-xs font-semibold text-primary-700 flex items-center gap-2">
        <FileText className="h-3.5 w-3.5" /> Imported from resume
      </p>
      <p className="text-[11px] text-surface-500">
        Education, experience, projects, and skills below are saved to your profile. You can edit them later under My Profile.
      </p>
      {edu.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-surface-500 uppercase mb-1">Education</p>
          <ul className="text-xs text-surface-600 space-y-1">
            {edu.slice(0, 5).map((e, i) => (
              <li key={i}>
                • {e.institution}
                {e.degree ? ` — ${e.degree}` : ''}
                {e.grade ? ` (${e.grade})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      {exp.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-surface-500 uppercase mb-1">Experience</p>
          <ul className="text-xs text-surface-600 space-y-1">
            {exp.slice(0, 4).map((e, i) => (
              <li key={i}>
                • {e.title} @ {e.company}
                {e.period ? ` (${e.period})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      {proj.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-surface-500 uppercase mb-1">Projects</p>
          <ul className="text-xs text-surface-600 space-y-1">
            {proj.slice(0, 5).map((p, i) => (
              <li key={i}>• {p.name}</li>
            ))}
          </ul>
        </div>
      )}
      {sc.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-surface-500 uppercase mb-1">Skills by category</p>
          <ul className="text-xs text-surface-600 space-y-1">
            {sc.slice(0, 6).map((c, i) => (
              <li key={i}>
                • <span className="font-medium text-surface-800">{c.category}</span>
                : {(c.skills || []).slice(0, 10).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(certs.length > 0 || ach.length > 0 || extra.length > 0 || research.length > 0) && (
        <div className="text-[11px] text-surface-500 pt-1 border-t border-surface-200">
          {[certs.length && `${certs.length} certificate(s)`, ach.length && `${ach.length} achievement(s)`, extra.length && `${extra.length} extracurricular`, research.length && `${research.length} research`].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  );
}

function FormRow({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-semibold text-surface-600 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-primary-500" /> {label}
      </label>
      {children}
    </div>
  );
}

function ReviewStep({ form, setForm, parsed, saving, onSave, error }) {
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const skillsCount = parseSkillLines(form.skillsText ?? '').length;
  return (
    <motion.div key="review" {...slideIn}>
      {error && (
        <div className="alert-error mb-4 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-success-100 text-success-800 border border-success-200 mb-3">
          <CheckCircle2 className="h-3.5 w-3.5" /> Extraction complete
        </div>
        <p className="section-eyebrow mb-1">Step 2 of 2</p>
        <h2 className="text-xl font-extrabold text-surface-900">Review your profile</h2>
        <p className="text-surface-500 text-sm mt-1">Edit anything before we save it to your account</p>
      </div>
      <div className="space-y-3 max-h-[min(52vh,480px)] overflow-y-auto pr-1 custom-scrollbar">
        <FormRow icon={User} label="Full name">
          <input className="input-field" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Your name" />
        </FormRow>
        <FormRow icon={Phone} label="Phone">
          <input className="input-field" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 …" />
        </FormRow>
        <FormRow icon={BookOpen} label="University / College">
          <input className="input-field" value={form.university} onChange={(e) => set('university', e.target.value)} placeholder="e.g. IIT Delhi" />
        </FormRow>
        <FormRow icon={Github} label="GitHub">
          <input className="input-field" value={form.github} onChange={(e) => set('github', e.target.value)} placeholder="https://github.com/…" />
        </FormRow>
        <FormRow icon={Linkedin} label="LinkedIn">
          <input className="input-field" value={form.linkedin} onChange={(e) => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/…" />
        </FormRow>
        <FormRow icon={Edit3} label="Short bio (optional)">
          <textarea className="input-field resize-none min-h-[64px]" rows={2} value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="One or two lines about you" />
        </FormRow>
        <FormRow icon={Code2} label="Skills (one per line or comma-separated)">
          <textarea
            className="input-field resize-none font-mono text-xs min-h-[88px]"
            value={form.skillsText ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, skillsText: e.target.value }))}
            placeholder="Python&#10;React&#10;SQL"
          />
          <p className="text-[10px] text-surface-400 mt-1">{skillsCount} skill{skillsCount === 1 ? '' : 's'} saved for matching</p>
        </FormRow>
        <ResumeExtractPreview rp={parsed?.resumeProfile} />
      </div>
      <button type="button" onClick={onSave} disabled={saving} className="btn-primary w-full mt-6 gap-2 justify-center">
        {saving ? (
          <>
            <span className="spinner-sm border-white/30 border-t-white" />
            Saving…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" /> Save profile & continue
          </>
        )}
      </button>
    </motion.div>
  );
}

function SuccessStep({ displayName, onDone }) {
  const firstName = (displayName || 'there').split(' ')[0] || 'there';
  return (
    <motion.div key="success" {...slideIn} className="text-center py-2">
      <div className="flex justify-center mb-5">
        <div className="h-16 w-16 rounded-full bg-success-500 flex items-center justify-center shadow-glow-success">
          <CheckCircle2 className="h-9 w-9 text-white" />
        </div>
      </div>
      <h2 className="text-xl font-extrabold text-surface-900 mb-2">You&apos;re all set, {firstName}!</h2>
      <p className="text-surface-500 text-sm mb-6 max-w-sm mx-auto">
        Your resume data is on your profile. Explore AI matches and keep your profile updated anytime.
      </p>
      <button type="button" onClick={onDone} className="btn-primary w-full justify-center gap-2">
        <Zap className="h-4 w-4" /> Go to dashboard
      </button>
    </motion.div>
  );
}

/**
 * Mandatory onboarding: PDF → parse → review → upload + PATCH profile.
 * No skip; backdrop does not close the flow.
 */
export default function ResumeOnboardingModal({ onComplete }) {
  const { user, updateUser, refreshUser } = useAuth();
  const [step, setStep] = useState('welcome');
  const [progress, setProgress] = useState({ msg: '', pct: 0 });
  const [parsed, setParsed] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const pendingResumeFileRef = useRef(null);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    university: user?.university || '',
    github: user?.github || '',
    linkedin: user?.linkedin || '',
    bio: user?.bio || '',
    skillsText: Array.isArray(user?.skills) && user.skills.length ? user.skills.join('\n') : '',
  });

  const handleFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setUploadError('Please upload a valid PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5 MB.');
      return;
    }
    setResumeFileName(file.name);
    pendingResumeFileRef.current = file;
    setUploadError('');
    setStep('analyzing');
    setProgress({ msg: 'Reading PDF document…', pct: 5 });

    try {
      const resume = await parseResume(file, 'student');
      setParsed(resume);
      const steps = [
        { msg: 'Reading PDF document…', pct: 15 },
        { msg: 'Extracting personal details…', pct: 35 },
        { msg: 'Detecting technical skills…', pct: 60 },
        { msg: 'Analyzing projects…', pct: 80 },
        { msg: 'Completing profile data…', pct: 100 },
      ];
      for (const s of steps) {
        setProgress(s);
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 200));
      }

      const skillsFromResume = Array.isArray(resume.skills) ? resume.skills : [];
      const fromCategories = (resume.resumeProfile?.skillCategories || []).flatMap((c) => c.skills || []);
      setForm((f) => ({
        fullName: resume.name || f.fullName,
        phone: resume.mobile || f.phone,
        university: resume.universityHint || f.university,
        github: resume.github || f.github,
        linkedin: resume.linkedin || f.linkedin,
        bio: f.bio,
        skillsText: skillsFromResume.length
          ? skillsFromResume.join('\n')
          : fromCategories.length
            ? fromCategories.join('\n')
            : f.skillsText || '',
      }));
      setStep('review');
    } catch (err) {
      console.error('Resume parse error:', err);
      setUploadError("Could not read the PDF. Use a text-based PDF (not a scan), or try another file.");
      setStep('upload');
    }
  }, []);

  const handleSave = async () => {
    setUploadError('');
    setSaving(true);
    try {
      if (pendingResumeFileRef.current) {
        const up = await studentService.uploadResumeFile(pendingResumeFileRef.current);
        pendingResumeFileRef.current = null;
        if (up.user) updateUser(up.user);
      }

      const skillsToSave = parseSkillLines(form.skillsText ?? '');
      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        university: form.university,
        github: form.github,
        linkedin: form.linkedin,
        bio: form.bio,
        profileCompleted: true,
        resumeFileName: resumeFileName || undefined,
        resumeProfile: parsed?.resumeProfile || undefined,
        skills: skillsToSave,
      };
      const updated = await studentService.updateProfile(payload);
      const u = updated?.user ?? updated;
      if (u) updateUser(u);
      await refreshUser?.();
      setStep('success');
    } catch (err) {
      console.error('Profile save failed:', err);
      const msg = err?.response?.data?.message || err.message || 'Save failed. Try again.';
      setUploadError(msg);
      setStep('review');
    } finally {
      setSaving(false);
    }
  };

  const dotCurrent =
    step === 'welcome' ? 0 : step === 'upload' ? 1 : step === 'review' ? 2 : step === 'success' ? 3 : 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-900/45 backdrop-blur-sm" aria-hidden />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-surface-200 bg-white shadow-intense"
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-t-3xl" />
        <div className="p-6 sm:p-8">
          {step !== 'analyzing' && step !== 'success' && <StepDots current={dotCurrent} total={4} />}
          <AnimatePresence mode="wait">
            {step === 'welcome' && <WelcomeStep user={user} onStart={() => setStep('upload')} />}
            {step === 'upload' && (
              <UploadStep onFile={handleFile} error={uploadError} onBack={() => setStep('welcome')} />
            )}
            {step === 'analyzing' && <AnalyzingStep progress={progress} />}
            {step === 'review' && (
              <ReviewStep
                form={form}
                setForm={setForm}
                parsed={parsed}
                saving={saving}
                onSave={handleSave}
                error={uploadError}
              />
            )}
            {step === 'success' && (
              <SuccessStep displayName={form.fullName} onDone={() => onComplete?.()} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
