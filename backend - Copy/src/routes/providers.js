import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import Provider from '../models/Provider.js';
import Internship from '../models/Internship.js';
import Application from '../models/Application.js';
import StudentProfile from '../models/StudentProfile.js';
import { getAllSkillsSet, buildStudentFeatureVector, buildInternshipFeatureVector } from '../ml/features.js';
import { cosineSimilarity } from '../ml/similarity.js';
import { buildExplanation } from '../services/xai.js';

const router = express.Router();
router.use(authenticate, requireRole('provider'));

router.get('/profile', async (req, res) => {
  try {
    const profile = await Provider.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Provider profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const profile = await Provider.findOneAndUpdate(
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

router.get('/internships', async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    const list = await Internship.find({ providerRef: provider._id }).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/internships/:id/candidates', async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    const internship = await Internship.findById(req.params.id).lean();
    if (!internship || internship.providerRef.toString() !== provider._id.toString()) {
      return res.status(404).json({ message: 'Internship not found' });
    }
    const students = await StudentProfile.find().limit(150).lean();
    const allSkills = getAllSkillsSet([internship], students);
    const internshipVec = buildInternshipFeatureVector(internship, allSkills);
    const withScores = students
      .filter((sp) => {
        if (internship.minCgpa > 0 && (sp.cgpa == null || sp.cgpa < internship.minCgpa)) return false;
        return true;
      })
      .map((sp) => {
        const studentVec = buildStudentFeatureVector({ ...sp, userId: sp.userId }, allSkills);
        const score = cosineSimilarity(studentVec, internshipVec);
        const explanation = buildExplanation(sp, internship, score, 0, { skillOverlap: score });
        return { student: sp, matchPercent: Math.round(score * 100), explanation };
      });
    withScores.sort((a, b) => b.matchPercent - a.matchPercent);
    res.json(withScores.slice(0, 20));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Provider analytics dashboard
router.get('/analytics', async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    const internships = await Internship.find({ providerRef: provider._id }).lean();
    const internshipIds = internships.map((i) => i._id);

    const applications = await Application.find({ internship: { $in: internshipIds } })
      .populate('internship', 'title domain requiredSkills')
      .sort({ appliedAt: 1 })
      .lean();

    // Status breakdown
    const statusCounts = { applied: 0, shortlisted: 0, accepted: 0, rejected: 0, pending: 0 };
    const domainCounts = {};
    const monthly = {};
    const skillDemand = {};
    const perInternship = {};

    for (const app of applications) {
      const s = app.status || 'applied';
      statusCounts[s] = (statusCounts[s] || 0) + 1;

      const domain = app.internship?.domain || 'Other';
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;

      const month = new Date(app.appliedAt || app.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthly[month] = (monthly[month] || 0) + 1;

      const iId = app.internship?._id?.toString();
      if (iId) {
        perInternship[iId] = perInternship[iId] || { total: 0, accepted: 0 };
        perInternship[iId].total += 1;
        if (app.status === 'accepted') perInternship[iId].accepted += 1;
      }
    }

    for (const i of internships) {
      for (const skill of i.requiredSkills || []) {
        const k = skill.toLowerCase().trim();
        skillDemand[k] = (skillDemand[k] || 0) + 1;
      }
    }

    const topSkills = Object.entries(skillDemand)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    const acceptanceRate = applications.length
      ? Math.round((statusCounts.accepted / applications.length) * 100)
      : 0;

    const shortlistRate = applications.length
      ? Math.round(((statusCounts.shortlisted + statusCounts.accepted) / applications.length) * 100)
      : 0;

    res.json({
      totalInternships: internships.length,
      activeInternships: internships.filter((i) => i.status === 'active').length,
      closedInternships: internships.filter((i) => i.status === 'closed').length,
      totalApplications: applications.length,
      acceptanceRate,
      shortlistRate,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      domainBreakdown: Object.entries(domainCounts).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count),
      monthlyApplications: Object.entries(monthly).map(([month, count]) => ({ month, count })),
      topSkillsDemanded: topSkills,
      internshipPerformance: internships.map((i) => ({
        _id: i._id,
        title: i.title,
        domain: i.domain,
        status: i.status,
        ...{ total: perInternship[i._id.toString()]?.total || 0, accepted: perInternship[i._id.toString()]?.accepted || 0 },
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all applications across all internships for the pipeline view
router.get('/pipeline', async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    const internships = await Internship.find({ providerRef: provider._id }).lean();
    const internshipIds = internships.map((i) => i._id);

    const applications = await Application.find({ internship: { $in: internshipIds } })
      .populate('student', 'email')
      .populate({
        path: 'internship',
        select: 'title domain requiredSkills minCgpa',
      })
      .sort({ appliedAt: -1 })
      .lean();

    // Attach student profile info
    const studentIds = [...new Set(applications.map((a) => a.student?._id?.toString()))].filter(Boolean);
    const profiles = await StudentProfile.find({ userId: { $in: studentIds } })
      .select('userId fullName cgpa skills institution')
      .lean();
    const profileMap = Object.fromEntries(profiles.map((p) => [p.userId.toString(), p]));

    const enriched = applications.map((app) => ({
      ...app,
      studentProfile: profileMap[app.student?._id?.toString()] || null,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
