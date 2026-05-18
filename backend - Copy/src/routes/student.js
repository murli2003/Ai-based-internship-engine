import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import multer from 'multer';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import User from '../models/User.js';
import Internship from '../models/Internship.js';
import Application from '../models/Application.js';
import { protect, requireRole } from '../middleware/auth.js';
import { activeInternshipFilter } from '../utils/internshipFilters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router    = express.Router();

// All student routes require auth
router.use(protect, requireRole('student'));

// ─── Skill matching helpers ───────────────────────────────────────────────────
function normalizeSkillKey(s) {
  return String(s || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^a-z0-9.#+\s]/g, '');
}

function collectStudentSkills(user) {
  const set = new Set();
  const add = (x) => { const t = String(x || '').trim(); if (t.length > 0 && t.length < 120) set.add(t); };
  (user.skills || []).forEach(add);
  const rp = user.resumeProfile || {};
  (rp.skillCategories || []).forEach((cat) => { (cat.skills || []).forEach(add); });
  return [...set];
}

function skillMatches(studentNormKeys, reqSkill) {
  const r = normalizeSkillKey(reqSkill);
  if (!r || r.length < 2) return false;
  return studentNormKeys.some((st) => {
    if (st === r) return true;
    if (st.length >= 3 && r.length >= 3 && (st.includes(r) || r.includes(st))) return true;
    return false;
  });
}

function scoreInternship(studentSkills, job) {
  const studentNormKeys = studentSkills.map(normalizeSkillKey).filter(Boolean);
  const req  = Array.isArray(job.requiredSkills)  ? job.requiredSkills  : [];
  const pref = Array.isArray(job.preferredSkills) ? job.preferredSkills : [];
  const matched = [];

  req.forEach((s)  => { if (skillMatches(studentNormKeys, s)) matched.push({ skill: s, kind: 'required' }); });
  pref.forEach((s) => { if (skillMatches(studentNormKeys, s) && !matched.some((m) => m.skill === s)) matched.push({ skill: s, kind: 'preferred' }); });

  let score = 0;
  if (req.length  > 0) score += (req.filter((s)  => skillMatches(studentNormKeys, s)).length / req.length)  * 62;
  if (pref.length > 0) score += (pref.filter((s) => skillMatches(studentNormKeys, s)).length / pref.length) * 28;

  const hay = `${job.title || ''} ${job.description || ''}`.toLowerCase();
  let descHits = 0;
  const seen = new Set();
  studentNormKeys.forEach((k) => {
    if (k.length < 3) return;
    if (hay.includes(k) && !seen.has(k)) { seen.add(k); descHits += 1; }
  });
  score += Math.min(10, descHits * 2);

  if (req.length === 0 && pref.length === 0) {
    score = Math.min(100, 35 + Math.min(65, descHits * 8));
  }

  return {
    score: Math.round(Math.min(100, score)),
    matched,
    requiredMatched: req.filter((s) => skillMatches(studentNormKeys, s)).length,
    requiredTotal: req.length,
  };
}

// ─── Resume file upload setup ─────────────────────────────────────────────────
const RESUME_DIR = path.join(__dirname, '..', '..', 'uploads', 'resumes');

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(RESUME_DIR, { recursive: true });
    cb(null, RESUME_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `${req.user._id}_${Date.now()}${ext}`);
  },
});

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are allowed.'));
      return;
    }
    cb(null, true);
  },
});

// ─── POST /api/student/resume-file ────────────────────────────────────────────
router.post('/resume-file', (req, res, next) => {
  uploadResume.single('resume')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message || 'Invalid file.' });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });

    const prev   = await User.findById(req.user._id).select('resumeFileKey');
    const newKey = req.file.filename;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { resumeFileName: req.file.originalname || 'resume.pdf', resumeFileKey: newKey } },
      { new: true, runValidators: true }
    ).select('-password');

    if (prev?.resumeFileKey && prev.resumeFileKey !== newKey) {
      const oldPath = path.join(RESUME_DIR, prev.resumeFileKey);
      fs.unlink(oldPath, () => {});
    }

    res.json({ success: true, user });
  } catch (err) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: 'Failed to store resume.' });
  }
});

// ─── GET /api/student/internship-matches ─────────────────────────────────────
router.get('/internship-matches', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const studentSkills = collectStudentSkills(user);
    const internships   = await Internship.find(activeInternshipFilter)
      .populate('organization', 'companyName email website')
      .sort({ createdAt: -1 })
      .lean();

    const data = internships
      .map((job) => {
        const m = scoreInternship(studentSkills, job);
        return { ...job, matchScore: m.score, matchedSkills: m.matched, requiredMatched: m.requiredMatched, requiredTotal: m.requiredTotal };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, count: data.length, profileSkillsCount: studentSkills.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch matches.' });
  }
});

// ─── POST /api/student/match-resume-preview ───────────────────────────────────
router.post('/match-resume-preview', async (req, res) => {
  try {
    const { skills: rawSkills } = req.body;
    const skills = Array.isArray(rawSkills)
      ? [...new Set(rawSkills.map((s) => String(s || '').trim()).filter(Boolean))]
      : [];
    const studentNormKeys = skills.map(normalizeSkillKey).filter(Boolean);

    const internships = await Internship.find(activeInternshipFilter)
      .populate('organization', 'companyName email website')
      .sort({ createdAt: -1 })
      .lean();

    if (!internships.length) return res.json({ success: true, count: 0, data: [] });

    const data = internships
      .map((job) => {
        const m = scoreInternship(skills, job);
        const reqList = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
        const missingRequired = reqList.filter((s) => !skillMatches(studentNormKeys, s));
        return { job, matchScore: m.score, matchedSkills: m.matched, requiredMatched: m.requiredMatched, requiredTotal: m.requiredTotal, missingRequired };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to compute matches.' });
  }
});

// ─── GET /api/student/analyses ────────────────────────────────────────────────
router.get('/analyses', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [analyses, total] = await Promise.all([
      ResumeAnalysis.find({ student: req.user._id })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .select('-parsedData.rawText'),
      ResumeAnalysis.countDocuments({ student: req.user._id }),
    ]);

    const allAnalyses = await ResumeAnalysis.find({ student: req.user._id })
      .select('topMatchPercentage skillsCount topMatchRole');

    const stats = {
      totalAnalyses:  total,
      bestMatchPct:   allAnalyses.length ? Math.max(...allAnalyses.map(a => a.topMatchPercentage || 0)) : 0,
      avgMatchPct:    allAnalyses.length ? Math.round(allAnalyses.reduce((s, a) => s + (a.topMatchPercentage || 0), 0) / allAnalyses.length) : 0,
      maxSkillsFound: allAnalyses.length ? Math.max(...allAnalyses.map(a => a.skillsCount || 0)) : 0,
    };

    res.json({ success: true, count: analyses.length, total, stats, data: analyses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch analyses.' });
  }
});

// ─── GET /api/student/analyses/:id ────────────────────────────────────────────
router.get('/analyses/:id', async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findOne({ _id: req.params.id, student: req.user._id });
    if (!analysis) return res.status(404).json({ success: false, message: 'Analysis not found.' });
    res.json({ success: true, data: analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch analysis.' });
  }
});

// ─── POST /api/student/analyses ───────────────────────────────────────────────
router.post('/analyses', async (req, res) => {
  try {
    const { fileName, parsedData, matches } = req.body;
    if (!fileName || !parsedData || !matches) {
      return res.status(422).json({ success: false, message: 'fileName, parsedData and matches are required.' });
    }

    const safeData = { ...parsedData };
    delete safeData.rawText;

    const analysis = await ResumeAnalysis.create({
      student:    req.user._id,
      fileName:   fileName || 'resume.pdf',
      parsedData: safeData,
      matches:    matches.slice(0, 5),
    });

    if (safeData.skills?.length) {
      await User.findByIdAndUpdate(req.user._id, { $set: { skills: safeData.skills } });
    }

    res.status(201).json({ success: true, data: analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save analysis.' });
  }
});

// ─── DELETE /api/student/analyses/:id ─────────────────────────────────────────
router.delete('/analyses/:id', async (req, res) => {
  try {
    const result = await ResumeAnalysis.findOneAndDelete({ _id: req.params.id, student: req.user._id });
    if (!result) return res.status(404).json({ success: false, message: 'Analysis not found.' });
    res.json({ success: true, message: 'Analysis deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete analysis.' });
  }
});

// ─── GET /api/student/stats ───────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const analyses = await ResumeAnalysis.find({ student: req.user._id })
      .select('topMatchPercentage skillsCount topMatchRole createdAt')
      .sort({ createdAt: -1 });

    const stats = {
      totalAnalyses:     analyses.length,
      bestMatchPct:      analyses.length ? Math.max(...analyses.map(a => a.topMatchPercentage || 0)) : 0,
      avgMatchPct:       analyses.length ? Math.round(analyses.reduce((s, a) => s + (a.topMatchPercentage || 0), 0) / analyses.length) : 0,
      latestSkillsCount: analyses[0]?.skillsCount || 0,
      latestTopRole:     analyses[0]?.topMatchRole || null,
      history: analyses.slice(0, 10).map(a => ({
        id: a._id, topMatchRole: a.topMatchRole, topMatchPct: a.topMatchPercentage,
        skillsCount: a.skillsCount, date: a.createdAt,
      })),
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// ─── GET /api/student/my-applications ────────────────────────────────────────
router.get('/my-applications', async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user._id })
      .populate({
        path: 'internship',
        select: 'title companyName location type mode package stipend description isActive status',
        populate: { path: 'organization', select: 'companyName email website' },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with providerRef compatibility for the frontend
    const enriched = applications.map((app) => ({
      ...app,
      internship: app.internship ? {
        ...app.internship,
        providerRef: app.internship.organization,
        orgName: app.internship.organization?.companyName || app.internship.companyName,
        domain: app.internship.domain || '',
        mode:   app.internship.mode || app.internship.type?.toLowerCase() || 'onsite',
      } : null,
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch your applications.' });
  }
});

// ─── GET /api/student/profile ─────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

// ─── PUT /api/student/profile ─────────────────────────────────────────────────
router.put('/profile', async (req, res) => {
  try {
    const allowed = ['fullName', 'university', 'github', 'linkedin', 'phone', 'bio', 'skills', 'profileCompleted'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// ─── GET /api/student/application-stats ──────────────────────────────────────
router.get('/application-stats', async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user._id })
      .populate('internship', 'title domain mode companyName')
      .sort({ createdAt: 1 })
      .lean();

    const statusCounts = { pending: 0, reviewed: 0, shortlisted: 0, accepted: 0, rejected: 0 };
    const domainMap    = {};
    const monthlyMap   = {};

    for (const app of applications) {
      const s = app.status || 'pending';
      statusCounts[s] = (statusCounts[s] || 0) + 1;

      const domain = app.internship?.domain || 'General';
      domainMap[domain] = (domainMap[domain] || 0) + 1;

      const month = new Date(app.appliedAt || app.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        ...statusCounts,
        totalApplications: applications.length,
        domainBreakdown:   Object.entries(domainMap).map(([domain, count]) => ({ domain, count })),
        monthlyTimeline:   Object.entries(monthlyMap).map(([month, count]) => ({ month, count })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

export default router;
