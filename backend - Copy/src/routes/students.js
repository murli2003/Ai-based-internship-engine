import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import StudentProfile from '../models/StudentProfile.js';
import Application from '../models/Application.js';
import Internship from '../models/Internship.js';
import { getRecommendations } from '../services/recommendationEngine.js';
import { computeSkillGaps } from '../services/skillGap.js';

const router = express.Router();
router.use(authenticate, requireRole('student'));

router.get('/profile', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/applications', async (req, res) => {
  try {
    const apps = await Application.find({ student: req.user._id })
      .populate('internship')
      .sort({ appliedAt: -1 })
      .lean();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/recommendations', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(400).json({ message: 'Complete your profile first' });
    const result = await getRecommendations(profile, { topK: parseInt(req.query.limit, 10) || 20 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Aggregated skill-gap analysis across top-N active internships
router.get('/skill-gap', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(400).json({ message: 'Profile not found' });

    const activeInternships = await Internship.find({ status: 'active' })
      .select('title domain requiredSkills')
      .limit(50)
      .lean();

    const studentSkills = (profile.skills || []).map((s) =>
      (s.name || s).toLowerCase().trim()
    );

    // Aggregate how often each required skill appears across postings
    const skillFrequency = {};
    for (const internship of activeInternships) {
      for (const skill of internship.requiredSkills || []) {
        const normalized = skill.toLowerCase().trim();
        skillFrequency[normalized] = (skillFrequency[normalized] || 0) + 1;
      }
    }

    // Determine which skills the student has vs lacks
    const allRequiredSkills = Object.keys(skillFrequency);
    const matched = [];
    const missing = [];

    for (const skill of allRequiredSkills) {
      const has = studentSkills.some((s) => s.includes(skill) || skill.includes(s));
      const entry = { skill, frequency: skillFrequency[skill], demandPct: Math.round((skillFrequency[skill] / activeInternships.length) * 100) };
      if (has) matched.push(entry);
      else missing.push(entry);
    }

    missing.sort((a, b) => b.frequency - a.frequency);
    matched.sort((a, b) => b.frequency - a.frequency);

    // Per-internship gap for the top 5 active ones (by slot count / recent)
    const topInternships = activeInternships.slice(0, 5);
    const perInternshipGaps = topInternships.map((i) => {
      const { missing: gaps } = computeSkillGaps(profile, i);
      return { internshipId: i._id, title: i.title, domain: i.domain, gapCount: gaps.length, gaps };
    });

    res.json({
      studentSkillCount: studentSkills.length,
      totalRequiredSkills: allRequiredSkills.length,
      matchedCount: matched.length,
      missingCount: missing.length,
      coveragePercent: allRequiredSkills.length
        ? Math.round((matched.length / allRequiredSkills.length) * 100)
        : 0,
      topMissingSkills: missing.slice(0, 10),
      topMatchedSkills: matched.slice(0, 10),
      perInternshipGaps,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Application timeline / status breakdown for analytics charts
router.get('/application-stats', async (req, res) => {
  try {
    const apps = await Application.find({ student: req.user._id })
      .populate('internship', 'domain title location mode stipend')
      .sort({ appliedAt: 1 })
      .lean();

    const statusCounts = { applied: 0, shortlisted: 0, accepted: 0, rejected: 0, pending: 0 };
    const domainCounts = {};
    const monthly = {};

    for (const app of apps) {
      const s = app.status || 'pending';
      statusCounts[s] = (statusCounts[s] || 0) + 1;

      const domain = app.internship?.domain || 'Other';
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;

      const month = new Date(app.appliedAt || app.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthly[month] = (monthly[month] || 0) + 1;
    }

    res.json({
      total: apps.length,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      domainBreakdown: Object.entries(domainCounts).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count),
      monthlyTimeline: Object.entries(monthly).map(([month, count]) => ({ month, count })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
