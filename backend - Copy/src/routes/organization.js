import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import User from '../models/User.js';
import Application from '../models/Application.js';
import Internship from '../models/Internship.js';
import { protect, requireRole } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router    = express.Router();

router.use(protect, requireRole('organization'));

const RESUME_DIR = path.join(__dirname, '..', '..', 'uploads', 'resumes');

// ─── GET /api/organization/students/:studentId/resume ─────────────────────────
router.get('/students/:studentId/resume', async (req, res) => {
  try {
    const { studentId } = req.params;

    const hasAccess = await Application.exists({ organization: req.user._id, student: studentId });
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'You can only download resumes for your applicants.' });
    }

    const student = await User.findById(studentId).select('role resumeFileKey resumeFileName');
    if (!student || student.role !== 'student' || !student.resumeFileKey) {
      return res.status(404).json({ success: false, message: 'No resume on file for this candidate.' });
    }

    const absPath = path.join(RESUME_DIR, student.resumeFileKey);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ success: false, message: 'Resume file missing on the server.' });
    }

    res.download(absPath, student.resumeFileName || 'resume.pdf');
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to download resume.' });
  }
});

// ─── GET /api/organization/students/:studentId/profile ─────────────────────
// Organization can view the full mapped student profile (including resumeProfile) for their applicants.
router.get('/students/:studentId/profile', async (req, res) => {
  try {
    const { studentId } = req.params;

    const hasAccess = await Application.exists({ organization: req.user._id, student: studentId });
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'You can only view profiles for your applicants.' });
    }

    const student = await User.findById(studentId)
      .select(
        'role fullName email university phone github linkedin skills bio profileCompleted resumeProfile resumeFileName createdAt'
      )
      .lean();

    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch student profile.' });
  }
});

// ─── GET /api/organization/candidates ────────────────────────────────────────
router.get('/candidates', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const baseFilter = {
      role:             'student',
      profileCompleted: true,
      $or: [
        { skills: { $exists: true, $not: { $size: 0 } } },
        { 'resumeProfile.skillCategories.0': { $exists: true } },
      ],
    };

    let filter = { ...baseFilter };
    if (search.trim()) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter = {
        ...baseFilter,
        $or: [{ fullName: re }, { university: re }, { skills: re }],
      };
    }

    const [students, total] = await Promise.all([
      User.find(filter)
        .select('fullName email university skills linkedin github phone resumeProfile profileCompleted createdAt resumeFileName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, count: students.length, total, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidates.' });
  }
});

// ─── GET /api/organization/stats ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const orgId = req.user._id;
    const [internships, applications] = await Promise.all([
      Internship.find({ organization: orgId }).select('isActive status type mode').lean(),
      Application.find({ organization: orgId }).select('status createdAt').lean(),
    ]);

    const stats = {
      totalListings:   internships.length,
      activeListings:  internships.filter(i => i.isActive !== false && i.status !== 'closed').length,
      totalApplicants: applications.length,
      pending:         applications.filter(a => a.status === 'pending').length,
      shortlisted:     applications.filter(a => a.status === 'shortlisted').length,
      rejected:        applications.filter(a => a.status === 'rejected').length,
      accepted:        applications.filter(a => a.status === 'accepted').length,
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// ─── GET /api/organization/all-applicants ─────────────────────────────────────
router.get('/all-applicants', async (req, res) => {
  try {
    const applications = await Application.find({ organization: req.user._id })
      .populate('student', 'fullName email phone university skills linkedin github resumeFileName resumeFileKey')
      .populate('internship', 'title companyName location type mode')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: applications.length, data: applications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch applicants.' });
  }
});

// ─── GET /api/organization/profile ───────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    // Return in the legacy providerProfile format for compatibility
    const profile = {
      _id:          user._id,
      orgName:      user.orgName || user.companyName || '',
      companyName:  user.companyName || user.orgName || '',
      industry:     user.industry || '',
      location:     user.location || '',
      website:      user.website || '',
      contactEmail: user.contactEmail || user.email || '',
      contactPhone: user.contactPhone || user.phone || '',
      description:  user.description || '',
      logoUrl:      user.logoUrl || '',
      contactPerson:user.contactPerson || '',
      email:        user.email,
      createdAt:    user.createdAt,
    };
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

// ─── PUT /api/organization/profile ───────────────────────────────────────────
router.put('/profile', async (req, res) => {
  try {
    const allowed = ['companyName', 'orgName', 'industry', 'website', 'contactPerson', 'logoUrl', 'location', 'contactEmail', 'contactPhone', 'description', 'phone'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    // Sync orgName and companyName
    if (updates.companyName && !updates.orgName) updates.orgName = updates.companyName;
    if (updates.orgName && !updates.companyName)  updates.companyName = updates.orgName;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// ─── GET /api/organization/analytics ─────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const orgId = req.user._id;
    const internships   = await Internship.find({ organization: orgId }).lean();
    const internshipIds = internships.map(i => i._id);

    const applications = await Application.find({ internship: { $in: internshipIds } })
      .populate('internship', 'title domain requiredSkills')
      .sort({ appliedAt: 1 })
      .lean();

    const statusCounts = { pending: 0, reviewed: 0, shortlisted: 0, accepted: 0, rejected: 0 };
    const domainCounts = {};
    const monthly      = {};
    const skillDemand  = {};
    const perInternship= {};

    for (const app of applications) {
      const s = app.status || 'pending';
      statusCounts[s] = (statusCounts[s] || 0) + 1;

      const domain = app.internship?.domain || 'General';
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
      for (const skill of [...(i.requiredSkills || []), ...(i.preferredSkills || [])]) {
        const k = skill.toLowerCase().trim();
        skillDemand[k] = (skillDemand[k] || 0) + 1;
      }
    }

    const total = applications.length;
    const acceptanceRate = total ? Math.round((statusCounts.accepted / total) * 100) : 0;
    const shortlistRate  = total ? Math.round(((statusCounts.shortlisted + statusCounts.accepted) / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalInternships:  internships.length,
        activeInternships: internships.filter(i => i.isActive !== false && i.status !== 'closed').length,
        closedInternships: internships.filter(i => i.status === 'closed').length,
        totalApplications: total,
        acceptanceRate,
        shortlistRate,
        statusBreakdown:   Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        domainBreakdown:   Object.entries(domainCounts).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count),
        monthlyApplications: Object.entries(monthly).map(([month, count]) => ({ month, count })),
        topSkillsDemanded: Object.entries(skillDemand).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([skill, count]) => ({ skill, count })),
        internshipPerformance: internships.map(i => ({
          _id: i._id, title: i.title, domain: i.domain, status: i.status,
          total:    perInternship[i._id.toString()]?.total    || 0,
          accepted: perInternship[i._id.toString()]?.accepted || 0,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
});

// ─── GET /api/organization/pipeline ──────────────────────────────────────────
router.get('/pipeline', async (req, res) => {
  try {
    const internships   = await Internship.find({ organization: req.user._id }).lean();
    const internshipIds = internships.map(i => i._id);

    const applications = await Application.find({ internship: { $in: internshipIds } })
      .populate('student', 'email fullName university skills github linkedin phone resumeFileName')
      .populate('internship', 'title domain mode type requiredSkills companyName')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich for legacy frontend format
    const enriched = applications.map(app => ({
      ...app,
      studentProfile: {
        fullName:    app.student?.fullName,
        email:       app.student?.email,
        institution: app.student?.university,
        skills:      (app.student?.skills || []).map(s => ({ name: s })),
      },
      appliedAt: app.appliedAt || app.createdAt,
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch pipeline.' });
  }
});

export default router;
