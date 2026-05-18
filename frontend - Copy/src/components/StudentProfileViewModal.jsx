import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Mail,
  Phone,
  GraduationCap,
  ExternalLink,
  CheckCircle,
  Briefcase,
  Award,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { providerService } from '../services/provider';

function normalizeResumeList(val) {
  if (!Array.isArray(val)) return [];
  return val.filter(Boolean);
}

function SkillList({ skills }) {
  const list = useMemo(() => {
    if (!Array.isArray(skills)) return [];
    return skills.map((s) => (typeof s === 'string' ? s : s?.name || s?.skill || '')).filter(Boolean);
  }, [skills]);

  if (!list.length) return <p className="text-sm text-surface-400">No skills listed.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((s) => (
        <span key={s} className="tag inline-flex items-center">
          {s}
        </span>
      ))}
    </div>
  );
}

export default function StudentProfileViewModal({ studentId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await providerService.getStudentProfile(studentId);
        if (!mounted) return;
        setProfile(res);
      } catch (e) {
        if (!mounted) return;
        toast.error(e?.response?.data?.message || 'Failed to load student profile');
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (studentId) load();
    return () => { mounted = false; };
  }, [studentId]);

  const initials = (profile?.fullName || profile?.email || 'S')[0]?.toUpperCase() || 'S';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.2 }}
        className="card w-full max-w-4xl max-h-[86vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-surface-200 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white font-black">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-surface-900">
                {profile?.fullName || 'Student Profile'}
              </h2>
              <p className="text-sm text-surface-500 flex items-center gap-2 mt-0.5">
                <Mail className="h-4 w-4" /> {profile?.email || '—'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : profile ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="card p-4 bg-surface-50 border-surface-200">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-primary-600" />
                    <p className="font-bold text-surface-900">University</p>
                  </div>
                  <p className="text-sm text-surface-700">{profile.university || '—'}</p>

                  <div className="mt-4 space-y-2">
                    {profile.phone && (
                      <p className="text-sm text-surface-600 flex items-center gap-2">
                        <Phone className="h-4 w-4" /> {profile.phone}
                      </p>
                    )}
                    {profile.bio && (
                      <div className="text-sm text-surface-600">
                        <p className="font-semibold text-surface-800">Bio</p>
                        <p className="mt-0.5 whitespace-pre-wrap">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card p-4 bg-surface-50 border-surface-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-secondary-600" />
                      <p className="font-bold text-surface-900">Skills</p>
                    </div>
                    {profile.profileCompleted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-100 text-success-700 border border-success-200 px-3 py-1 text-xs font-bold">
                        <CheckCircle className="h-3.5 w-3.5" /> Completed
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <SkillList skills={profile.skills} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(profile.github || profile.linkedin) && (
                      <>
                        {profile.github && (
                          <a
                            href={profile.github}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 tag inline-flex"
                          >
                            Github <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        )}
                        {profile.linkedin && (
                          <a
                            href={profile.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 tag inline-flex"
                          >
                            LinkedIn <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        )}
                      </>
                    )}

                    {profile.resumeFileName && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await providerService.downloadStudentResume(studentId);
                          } catch (e) {
                            toast.error(e?.response?.data?.message || 'Resume download failed');
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-50 border border-primary-200 px-3 py-2 text-sm font-bold text-primary-700 hover:bg-primary-100 transition-colors"
                      >
                        <BookOpen className="h-4 w-4" />
                        Download Resume
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Resume-mapped sections (resumeProfile) */}
              <div className="space-y-4">
                <Section title="Education" icon={GraduationCap}>
                  {normalizeResumeList(profile.resumeProfile?.education).length === 0 ? (
                    <p className="text-sm text-surface-400">No education mapped from resume.</p>
                  ) : (
                    <div className="space-y-3">
                      {profile.resumeProfile.education.map((e, i) => (
                        <div key={i} className="rounded-xl border border-surface-200 bg-white p-4">
                          <p className="font-bold text-surface-900">{e.institution || e.university || '—'}</p>
                          <p className="text-sm text-surface-600 mt-1">
                            {(e.degree || '') + (e.grade ? ` · ${e.grade}` : '')}
                          </p>
                          {e.period && <p className="text-xs text-surface-500 mt-1">{e.period}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="Experience" icon={Briefcase}>
                  {normalizeResumeList(profile.resumeProfile?.experiences).length === 0 ? (
                    <p className="text-sm text-surface-400">No experience mapped from resume.</p>
                  ) : (
                    <div className="space-y-3">
                      {profile.resumeProfile.experiences.map((ex, i) => (
                        <div key={i} className="rounded-xl border border-surface-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-bold text-surface-900">{ex.title || '—'}</p>
                              <p className="text-sm text-surface-600 mt-1">{ex.company || ''}</p>
                              {ex.period && <p className="text-xs text-surface-500 mt-1">{ex.period}</p>}
                            </div>
                          </div>
                          {!!ex.highlights?.length && (
                            <ul className="mt-3 space-y-1.5">
                              {ex.highlights.map((h, j) => (
                                <li key={j} className="text-sm text-surface-700 flex gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                                  <span>{h}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="Projects" icon={Sparkles}>
                  {normalizeResumeList(profile.resumeProfile?.projects).length === 0 ? (
                    <p className="text-sm text-surface-400">No projects mapped from resume.</p>
                  ) : (
                    <div className="space-y-3">
                      {profile.resumeProfile.projects.map((pr, i) => (
                        <div key={i} className="rounded-xl border border-surface-200 bg-white p-4">
                          <p className="font-bold text-surface-900">{pr.name || '—'}</p>
                          {pr.period && <p className="text-xs text-surface-500 mt-1">{pr.period}</p>}
                          {!!pr.highlights?.length && (
                            <ul className="mt-3 space-y-1.5">
                              {pr.highlights.map((h, j) => (
                                <li key={j} className="text-sm text-surface-700 flex gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-secondary-500 shrink-0" />
                                  <span>{h}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {normalizeResumeList(profile.resumeProfile?.skillCategories).length > 0 && (
                  <Section title="Skills by Category" icon={Award}>
                    <div className="space-y-3">
                      {profile.resumeProfile.skillCategories.map((c, i) => (
                        <div key={i} className="rounded-xl border border-surface-200 bg-white p-4">
                          <p className="font-bold text-surface-900">{c.category || 'Category'}</p>
                          {(c.skills || []).length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {c.skills.map((s, j) => (
                                <span key={j} className="tag inline-flex">{s}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-surface-400 mt-1">No skills listed.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-surface-500">No profile found.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card border-surface-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl bg-primary-50 border border-primary-100">
          <Icon className="h-4 w-4 text-primary-600" />
        </div>
        <h3 className="font-extrabold text-surface-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

