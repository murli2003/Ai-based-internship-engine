import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, FileText, Code2, MapPin, DollarSign, Clock, Users,
  Sparkles, ChevronDown, ChevronUp, Plus, X, Save, Loader2,
  CheckCircle2, ArrowLeft, Cpu, BookOpen, Target, Award, Layers,
  ListChecks, HelpCircle, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProviderData } from '../../context/ProviderDataContext';

/* ─── Constants ─────────────────────────────────────────────────── */
const MODES    = ['remote', 'onsite', 'hybrid'];
const DOMAINS  = ['Technology', 'Finance', 'Marketing', 'Design', 'Data Science', 'AI/ML', 'Product', 'Operations', 'HR', 'Legal', 'Sales', 'Other'];
const STATUSES = [{ value: 'active', label: 'Active — visible to students' }, { value: 'draft', label: 'Draft — hidden from students' }, { value: 'closed', label: 'Closed — no new applications' }];
const PERKS    = ['Certificate of completion', 'Letter of recommendation', 'Pre-placement offer', 'Flexible hours', 'Mentorship', 'Team outings', 'Free meals', 'Transport allowance', 'Health insurance', 'Stock options'];

/* ─── Mini helpers ───────────────────────────────────────────────── */
function Section({ icon: Icon, title, subtitle, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <div
        className={`flex items-center justify-between px-6 py-4 ${collapsible ? 'cursor-pointer select-none hover:bg-surface-50' : ''}`}
        onClick={collapsible ? () => setOpen(v => !v) : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-secondary-50">
            <Icon className="h-4.5 w-4.5 text-secondary-600" size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-surface-900 text-base leading-none">{title}</h3>
            {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {collapsible && (
          <span className="text-surface-400">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-4 border-t border-surface-100 space-y-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Label({ text, required, hint }) {
  return (
    <label className="block text-sm font-semibold text-surface-700 mb-1.5">
      {text}{required && <span className="text-danger-500 ml-0.5">*</span>}
      {hint && <span className="ml-2 text-[11px] font-normal text-surface-400">{hint}</span>}
    </label>
  );
}

function SkillChips({ skills, onAdd, onRemove, placeholder = 'Type a skill and press Enter…', color = 'primary' }) {
  const [input, setInput] = useState('');
  const colors = {
    primary:   'bg-primary-100 text-primary-700 border-primary-200',
    secondary: 'bg-secondary-100 text-secondary-700 border-secondary-200',
    success:   'bg-success-100 text-success-700 border-success-200',
  };
  const chip = colors[color] || colors.primary;

  const commit = (val) => {
    const trimmed = val.trim();
    if (trimmed && !skills.includes(trimmed)) { onAdd(trimmed); }
    setInput('');
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          className="input-field flex-1 text-sm"
          value={input}
          placeholder={placeholder}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(input); } }}
        />
        <button type="button" onClick={() => commit(input)} className="btn-secondary px-4 text-sm shrink-0">
          <Plus size={15} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {skills.length === 0 ? (
          <p className="text-xs text-surface-400 py-1">None added yet</p>
        ) : (
          skills.map((s, i) => (
            <span key={i} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${chip}`}>
              {s}
              <button type="button" onClick={() => onRemove(i)} className="rounded-full p-0.5 hover:opacity-70">
                <X size={11} />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function PerkCheckbox({ label, checked, onChange }) {
  return (
    <label className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-all text-sm font-medium ${checked ? 'border-secondary-300 bg-secondary-50 text-secondary-700' : 'border-surface-200 bg-white text-surface-600 hover:border-secondary-200'}`}>
      <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
      <span className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-colors ${checked ? 'bg-secondary-600 border-secondary-600' : 'border-surface-300'}`}>
        {checked && <CheckCircle2 size={10} className="text-white" />}
      </span>
      {label}
    </label>
  );
}

/* ─── Default form state ─────────────────────────────────────────── */
function emptyForm() {
  return {
    title: '',
    description: '',
    domain: '',
    mode: 'hybrid',
    location: '',
    stipend: '',
    durationWeeks: '',
    slots: 1,
    minCgpa: '',
    status: 'active',
    requiredSkills: [],
    preferredSkills: [],
    techStack: [],
    responsibilities: [],
    qualifications: [],
    learningOutcomes: [],
    screeningQuestions: [],
    perks: [],
    applicationDeadline: '',
    jobType: 'internship',
    experienceLevel: 'fresher',
    applicationProcess: '',
    aiBoostNote: '',
  };
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function PostingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { internships, createInternship, updateInternship } = useProviderData();

  const isEdit = !!id;
  const existing = isEdit ? internships.find(i => i._id === id) : null;

  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        title:               existing.title               || '',
        description:         existing.description         || '',
        domain:              existing.domain              || '',
        mode:                existing.mode               || 'hybrid',
        location:            existing.location            || '',
        stipend:             existing.stipend             ?? '',
        durationWeeks:       existing.durationWeeks       ?? '',
        slots:               existing.slots               ?? 1,
        minCgpa:             existing.minCgpa             ?? '',
        status:              existing.status              || 'active',
        requiredSkills:      existing.requiredSkills      || [],
        preferredSkills:     existing.preferredSkills     || [],
        techStack:           existing.techStack           || [],
        responsibilities:    existing.responsibilities    || [],
        qualifications:      existing.qualifications      || [],
        learningOutcomes:    existing.learningOutcomes    || [],
        screeningQuestions:  existing.screeningQuestions  || [],
        perks:               existing.perks               || [],
        applicationDeadline: existing.applicationDeadline ? existing.applicationDeadline.slice(0, 10) : '',
        jobType:             existing.jobType             || 'internship',
        experienceLevel:     existing.experienceLevel     || 'fresher',
        applicationProcess:  existing.applicationProcess  || '',
        aiBoostNote:         existing.aiBoostNote         || '',
      });
    }
  }, [existing]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  /* List field helpers */
  const addToList   = (key, val) => { if (val && !form[key].includes(val)) set(key, [...form[key], val]); };
  const removeFromList = (key, i) => set(key, form[key].filter((_, j) => j !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        minCgpa:       form.minCgpa       !== '' ? Number(form.minCgpa)       : 0,
        durationWeeks: form.durationWeeks !== '' ? Number(form.durationWeeks) : undefined,
        stipend:       form.stipend       !== '' ? Number(form.stipend)       : undefined,
        slots:         Number(form.slots) || 1,
        applicationDeadline: form.applicationDeadline || undefined,
      };
      if (isEdit) {
        await updateInternship(id, payload);
        toast.success('Internship updated!');
      } else {
        await createInternship(payload);
        toast.success('Internship posted!');
      }
      setSaved(true);
      setTimeout(() => navigate('/app/provider/postings'), 800);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/app/provider/postings')}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-500 hover:text-surface-800 hover:border-surface-300 shadow-soft transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-surface-900 tracking-tight">
            {isEdit ? 'Edit Internship Posting' : 'Create New Internship Posting'}
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {isEdit ? 'Update posting details — changes apply immediately for active listings' : 'Fill in all sections for the best AI-match accuracy with candidates'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/app/provider/postings')} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving || saved} className="btn-primary gap-2 min-w-[140px] justify-center">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
              : saved ? <><CheckCircle2 size={15} /> Saved!</>
              : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Post Internship'}</>}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Basic Info ── */}
        <Section icon={Briefcase} title="Basic Information" subtitle="Core details shown on the listing card">
          <div>
            <Label text="Internship Title" required />
            <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Frontend Developer Intern, Data Analyst Intern" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label text="Domain / Field" hint="Helps AI categorize the role" />
              <select className="select-field" value={form.domain} onChange={e => set('domain', e.target.value)}>
                <option value="">Select domain…</option>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label text="Custom Domain" hint="Override if not in list above" />
              <input className="input-field" value={DOMAINS.includes(form.domain) ? '' : form.domain}
                onChange={e => set('domain', e.target.value)} placeholder="e.g. Blockchain, CleanTech" />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label text="Work Mode" />
              <select className="select-field" value={form.mode} onChange={e => set('mode', e.target.value)}>
                {MODES.map(m => <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <Label text="Location" />
              <input className="input-field" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Bangalore, India" />
            </div>
            <div>
              <Label text="Status" />
              <select className="select-field" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* ── Description & Role ── */}
        <Section icon={FileText} title="Role Description" subtitle="Detailed description boosts AI keyword matching">
          <div>
            <Label text="About the Role" required />
            <textarea rows={5} className="textarea-field" value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the internship role, team structure, and what makes this opportunity exciting…" />
          </div>

          <div>
            <Label text="Key Responsibilities" hint="One per line — AI uses these for matching" />
            <div className="flex gap-2 mb-2">
              <input id="resp-input" className="input-field flex-1 text-sm" placeholder="e.g. Build and maintain React components"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('responsibilities', e.target.value.trim()); e.target.value = ''; } }} />
              <button type="button" className="btn-secondary shrink-0 px-4"
                onClick={() => { const el = document.getElementById('resp-input'); addToList('responsibilities', el.value.trim()); el.value = ''; }}>
                <Plus size={15} />
              </button>
            </div>
            <ul className="space-y-1.5">
              {form.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2 rounded-xl bg-surface-50 border border-surface-200 px-3 py-2.5 text-sm">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-secondary-500 shrink-0 mt-1.5" />
                  <span className="flex-1 text-surface-700">{r}</span>
                  <button type="button" onClick={() => removeFromList('responsibilities', i)} className="text-surface-400 hover:text-danger-500 transition-colors shrink-0 mt-0.5">
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label text="What You'll Learn / Learning Outcomes" hint="Boosts AI match for learning-focused students" />
            <div className="flex gap-2 mb-2">
              <input id="learn-input" className="input-field flex-1 text-sm" placeholder="e.g. Production-level React & TypeScript development"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('learningOutcomes', e.target.value.trim()); e.target.value = ''; } }} />
              <button type="button" className="btn-secondary shrink-0 px-4"
                onClick={() => { const el = document.getElementById('learn-input'); addToList('learningOutcomes', el.value.trim()); el.value = ''; }}>
                <Plus size={15} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.learningOutcomes.map((o, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-success-100 text-success-700 border border-success-200 px-3 py-1 text-sm font-medium">
                  <Star size={11} />
                  {o}
                  <button type="button" onClick={() => removeFromList('learningOutcomes', i)} className="hover:opacity-70"><X size={11} /></button>
                </span>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Skills & Tech ── */}
        <Section icon={Code2} title="Skills & Technology" subtitle="These directly power the AI candidate-matching algorithm">
          <div>
            <Label text="Required Skills" hint="Must-have — used heavily in AI scoring" />
            <SkillChips
              skills={form.requiredSkills}
              onAdd={v => addToList('requiredSkills', v)}
              onRemove={i => removeFromList('requiredSkills', i)}
              placeholder="e.g. React, Python, SQL…"
              color="primary"
            />
          </div>
          <div>
            <Label text="Preferred Skills" hint="Nice-to-have — boosts match score" />
            <SkillChips
              skills={form.preferredSkills}
              onAdd={v => addToList('preferredSkills', v)}
              onRemove={i => removeFromList('preferredSkills', i)}
              placeholder="e.g. TypeScript, Docker, Redis…"
              color="secondary"
            />
          </div>
          <div>
            <Label text="Tech Stack" hint="Specific tools / versions — fine-tunes AI matching" />
            <SkillChips
              skills={form.techStack}
              onAdd={v => addToList('techStack', v)}
              onRemove={i => removeFromList('techStack', i)}
              placeholder="e.g. Next.js 14, PostgreSQL 16, AWS S3…"
              color="success"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label text="Job Type" hint="Helps AI filter by role type" />
              <select className="select-field" value={form.jobType} onChange={e => set('jobType', e.target.value)}>
                <option value="internship">Internship</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract / Freelance</option>
                <option value="research">Research / Academic</option>
              </select>
            </div>
            <div>
              <Label text="Experience Level" hint="AI uses this to filter by student seniority" />
              <select className="select-field" value={form.experienceLevel} onChange={e => set('experienceLevel', e.target.value)}>
                <option value="fresher">Fresher / 0 experience</option>
                <option value="beginner">Beginner (1–2 projects)</option>
                <option value="intermediate">Intermediate (prior internship)</option>
                <option value="any">Any level</option>
              </select>
            </div>
          </div>
        </Section>

        {/* ── Requirements ── */}
        <Section icon={ListChecks} title="Eligibility & Requirements" subtitle="Minimum criteria for applicants" collapsible>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label text="Minimum CGPA" hint="0 = no minimum" />
              <input type="number" step="0.01" min={0} max={10} className="input-field"
                value={form.minCgpa} onChange={e => set('minCgpa', e.target.value)} placeholder="e.g. 7.0" />
            </div>
            <div>
              <Label text="Duration (weeks)" />
              <input type="number" min={1} className="input-field"
                value={form.durationWeeks} onChange={e => set('durationWeeks', e.target.value)} placeholder="e.g. 8" />
            </div>
            <div>
              <Label text="Open Slots" />
              <input type="number" min={1} className="input-field"
                value={form.slots} onChange={e => set('slots', e.target.value)} placeholder="1" />
            </div>
          </div>
          <div>
            <Label text="Qualifications / Eligibility Criteria" hint="Press Enter to add each point" />
            <div className="flex gap-2 mb-2">
              <input id="qual-input" className="input-field flex-1 text-sm" placeholder="e.g. Final year B.Tech / MCA students only"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('qualifications', e.target.value.trim()); e.target.value = ''; } }} />
              <button type="button" className="btn-secondary shrink-0 px-4"
                onClick={() => { const el = document.getElementById('qual-input'); addToList('qualifications', el.value.trim()); el.value = ''; }}>
                <Plus size={15} />
              </button>
            </div>
            <ul className="space-y-1.5">
              {form.qualifications.map((q, i) => (
                <li key={i} className="flex items-start gap-2 rounded-xl bg-surface-50 border border-surface-200 px-3 py-2.5 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                  <span className="flex-1 text-surface-700">{q}</span>
                  <button type="button" onClick={() => removeFromList('qualifications', i)} className="text-surface-400 hover:text-danger-500 transition-colors shrink-0 mt-0.5">
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* ── Compensation & Logistics ── */}
        <Section icon={DollarSign} title="Compensation & Logistics" subtitle="Stipend, deadline, and application process" collapsible>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label text="Stipend (₹/month)" hint="Leave blank for unpaid" />
              <input type="number" min={0} className="input-field"
                value={form.stipend} onChange={e => set('stipend', e.target.value)} placeholder="e.g. 15000" />
            </div>
            <div>
              <Label text="Application Deadline" />
              <input type="date" className="input-field"
                value={form.applicationDeadline} onChange={e => set('applicationDeadline', e.target.value)}
                min={new Date().toISOString().slice(0, 10)} />
            </div>
          </div>
          <div>
            <Label text="Application Process" hint="Describe rounds / interview stages" />
            <textarea rows={3} className="textarea-field" value={form.applicationProcess}
              onChange={e => set('applicationProcess', e.target.value)}
              placeholder="e.g. Resume screening → Technical task → Video interview → Offer" />
          </div>
        </Section>

        {/* ── Screening Questions ── */}
        <Section icon={HelpCircle} title="Screening Questions" subtitle="Optional questions shown to applicants during apply" collapsible defaultOpen={false}>
          <p className="text-xs text-surface-500 -mt-2">Ask questions that help you shortlist better. Answers are shown in the candidate pipeline.</p>
          <div className="flex gap-2 mb-3">
            <input id="sq-input" className="input-field flex-1 text-sm" placeholder="e.g. What experience do you have with React?"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('screeningQuestions', e.target.value.trim()); e.target.value = ''; } }} />
            <button type="button" className="btn-secondary shrink-0 px-4"
              onClick={() => { const el = document.getElementById('sq-input'); addToList('screeningQuestions', el.value.trim()); el.value = ''; }}>
              <Plus size={15} />
            </button>
          </div>
          <ul className="space-y-2">
            {form.screeningQuestions.length === 0 ? (
              <p className="text-sm text-surface-400">No questions added yet</p>
            ) : (
              form.screeningQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-surface-50 border border-surface-200 px-4 py-3 text-sm">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-100 text-secondary-700 font-bold text-[11px] mt-0.5">{i + 1}</span>
                  <span className="flex-1 text-surface-700">{q}</span>
                  <button type="button" onClick={() => removeFromList('screeningQuestions', i)} className="text-surface-400 hover:text-danger-500 transition-colors shrink-0">
                    <X size={13} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </Section>

        {/* ── Perks & Benefits ── */}
        <Section icon={Award} title="Perks & Benefits" subtitle="Attract more applicants with great perks" collapsible defaultOpen={false}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PERKS.map(perk => (
              <PerkCheckbox
                key={perk}
                label={perk}
                checked={form.perks.includes(perk)}
                onChange={e => {
                  if (e.target.checked) addToList('perks', perk);
                  else set('perks', form.perks.filter(p => p !== perk));
                }}
              />
            ))}
          </div>
          <div className="flex gap-2 mt-1">
            <input id="perk-input" className="input-field flex-1 text-sm" placeholder="Add a custom perk…"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('perks', e.target.value.trim()); e.target.value = ''; } }} />
            <button type="button" className="btn-secondary shrink-0 px-4"
              onClick={() => { const el = document.getElementById('perk-input'); addToList('perks', el.value.trim()); el.value = ''; }}>
              <Plus size={15} />
            </button>
          </div>
        </Section>

        {/* ── AI Boost ── */}
        <Section icon={Sparkles} title="AI Enhancement Note" subtitle="Extra context the AI uses to improve candidate matching" collapsible defaultOpen={false}>
          <div className="rounded-xl bg-gradient-to-br from-secondary-50 to-primary-50 border border-secondary-100 p-4 mb-4">
            <div className="flex items-start gap-3">
              <Cpu size={18} className="text-secondary-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-secondary-800">How this helps</p>
                <p className="text-xs text-secondary-600 mt-0.5">
                  This free-text note is fed directly into the AI semantic matching model. Use it to describe ideal candidate traits, team culture, problem types, or any context that structured fields can't capture.
                </p>
              </div>
            </div>
          </div>
          <Label text="AI Context Note" hint="Not shown to students" />
          <textarea rows={4} className="textarea-field" value={form.aiBoostNote}
            onChange={e => set('aiBoostNote', e.target.value)}
            placeholder="e.g. Looking for a curious self-starter comfortable with ambiguity. Team uses Agile sprints. Strong communication matters as much as coding. Prefer students with open-source contributions or active GitHub." />
        </Section>

        {/* ── Bottom actions ── */}
        <div className="flex items-center justify-between pt-2 pb-6">
          <button type="button" onClick={() => navigate('/app/provider/postings')} className="btn-secondary">
            <ArrowLeft size={15} /> Cancel
          </button>
          <button type="submit" disabled={saving || saved} className="btn-primary gap-2 min-w-[160px] justify-center">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
              : saved ? <><CheckCircle2 size={15} /> Saved!</>
              : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Post Internship'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
