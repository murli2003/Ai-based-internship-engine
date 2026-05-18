import express from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import Internship from '../models/Internship.js';
import Application from '../models/Application.js';
import { activeInternshipFilter } from '../utils/internshipFilters.js';

const router = express.Router();

// ─── GET /api/internships  — public list ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { type, mode, domain, search, page = 1, limit = 50 } = req.query;

    const parts = [{ ...activeInternshipFilter }];
    if (type && ['Remote', 'On-site', 'Hybrid'].includes(type)) parts.push({ type });
    if (mode && ['remote', 'onsite', 'hybrid'].includes(mode))   parts.push({ mode });
    if (domain) parts.push({ domain: new RegExp(domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      parts.push({ $or: [{ title: re }, { companyName: re }, { description: re }] });
    }
    const filter = parts.length === 1 ? parts[0] : { $and: parts };

    const [internships, total] = await Promise.all([
      Internship.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('organization', 'companyName email website industry'),
      Internship.countDocuments(filter),
    ]);

    res.json({ success: true, count: internships.length, total, data: internships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch internships.' });
  }
});

// ─── GET /api/internships/my  — org's own listings ───────────────────────────
router.get('/my', protect, requireRole('organization'), async (req, res) => {
  try {
    const internships = await Internship.find({ organization: req.user._id }).sort({ createdAt: -1 });

    const stats = {
      total:  internships.length,
      active: internships.filter(i => i.isActive !== false && i.status !== 'closed').length,
      remote: internships.filter(i => i.type === 'Remote' || i.mode === 'remote').length,
      onSite: internships.filter(i => i.type === 'On-site' || i.mode === 'onsite').length,
      hybrid: internships.filter(i => i.type === 'Hybrid'  || i.mode === 'hybrid').length,
    };

    res.json({ success: true, count: internships.length, stats, data: internships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch your internships.' });
  }
});

// ─── GET /api/internships/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('organization', 'companyName email website industry');
    if (!internship) return res.status(404).json({ success: false, message: 'Internship not found.' });
    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch internship.' });
  }
});

// ─── POST /api/internships  — create (org only) ───────────────────────────────
router.post('/', protect, requireRole('organization'), async (req, res) => {
  try {
    const b = req.body;
    if (!b.title?.trim()) return res.status(422).json({ success: false, message: 'Title is required.' });

    const internship = await Internship.create({
      organization:       req.user._id,
      companyName:        req.user.companyName || req.user.orgName || b.companyName || 'Our Company',
      title:              b.title.trim(),
      package:            b.package?.trim()       || '',
      stipend:            b.stipend               ?? 0,
      location:           b.location?.trim()      || '',
      type:               b.type                  || 'On-site',
      mode:               b.mode                  || 'hybrid',
      applyLink:          b.applyLink?.trim()      || '#',
      description:        b.description?.trim()    || '',
      domain:             b.domain?.trim()         || '',
      requiredSkills:     b.requiredSkills         || [],
      preferredSkills:    b.preferredSkills        || [],
      techStack:          b.techStack              || [],
      responsibilities:   b.responsibilities       || [],
      qualifications:     b.qualifications         || [],
      learningOutcomes:   b.learningOutcomes       || [],
      screeningQuestions: b.screeningQuestions     || [],
      perks:              b.perks                  || [],
      applicationProcess: b.applicationProcess?.trim() || '',
      aiBoostNote:        b.aiBoostNote?.trim()    || '',
      jobType:            b.jobType                || 'internship',
      experienceLevel:    b.experienceLevel        || 'fresher',
      category:           b.category               || 'Company Posted',
      openings:           b.openings               || b.slots || 1,
      slots:              b.slots                  || b.openings || 1,
      applicationDeadline: b.applicationDeadline   || null,
      minCgpa:            b.minCgpa                ?? 0,
      durationWeeks:      b.durationWeeks          || null,
      isActive:           b.status !== 'draft',
      status:             b.status                 || 'active',
    });

    res.status(201).json({ success: true, data: internship });
  } catch (err) {
    console.error('Create internship error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create internship.' });
  }
});

// ─── PUT /api/internships/:id  — full update ─────────────────────────────────
router.put('/:id', protect, requireRole('organization'), async (req, res) => {
  try {
    const internship = await Internship.findOne({ _id: req.params.id, organization: req.user._id });
    if (!internship) return res.status(404).json({ success: false, message: 'Internship not found or not yours.' });

    Object.assign(internship, req.body);
    await internship.save();
    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update internship.' });
  }
});

// ─── PATCH /api/internships/:id  — partial update ────────────────────────────
router.patch('/:id', protect, requireRole('organization'), async (req, res) => {
  try {
    const internship = await Internship.findOne({ _id: req.params.id, organization: req.user._id });
    if (!internship) return res.status(404).json({ success: false, message: 'Internship not found or not yours.' });

    const allowed = [
      'title', 'package', 'stipend', 'location', 'type', 'mode', 'applyLink',
      'description', 'domain', 'requiredSkills', 'preferredSkills', 'techStack',
      'responsibilities', 'qualifications', 'learningOutcomes', 'screeningQuestions',
      'perks', 'applicationProcess', 'aiBoostNote', 'jobType', 'experienceLevel',
      'isActive', 'status', 'openings', 'slots', 'minCgpa', 'durationWeeks',
      'category', 'applicationDeadline', 'companyName',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) internship[key] = req.body[key];
    }
    // keep isActive in sync with status
    if (req.body.status === 'draft' || req.body.status === 'closed') {
      internship.isActive = false;
    } else if (req.body.status === 'active') {
      internship.isActive = true;
    }
    await internship.save();
    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update internship.' });
  }
});

// ─── PATCH /api/internships/:id/status  — toggle status ──────────────────────
router.patch('/:id/status', protect, requireRole('organization'), async (req, res) => {
  try {
    const internship = await Internship.findOne({ _id: req.params.id, organization: req.user._id });
    if (!internship) return res.status(404).json({ success: false, message: 'Internship not found or not yours.' });

    const { status } = req.body;
    if (!['active', 'closed', 'draft'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }
    internship.status   = status;
    internship.isActive = status === 'active';
    await internship.save();
    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update status.' });
  }
});

// ─── DELETE /api/internships/:id ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('organization'), async (req, res) => {
  try {
    const result = await Internship.findOneAndDelete({ _id: req.params.id, organization: req.user._id });
    if (!result) return res.status(404).json({ success: false, message: 'Internship not found or not yours.' });
    res.json({ success: true, message: 'Internship deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete internship.' });
  }
});

// ─── POST /api/internships/:id/apply  — student applies ──────────────────────
router.post('/:id/apply', protect, requireRole('student'), async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ success: false, message: 'Internship not found.' });
    if (internship.isActive === false || internship.status === 'closed') {
      return res.status(400).json({ success: false, message: 'This listing is no longer active.' });
    }

    const existing = await Application.findOne({
      internship: internship._id,
      student:    req.user._id,
    });
    if (existing) return res.status(409).json({ success: false, message: 'You have already applied for this role.' });

    const application = await Application.create({
      internship:   internship._id,
      student:      req.user._id,
      organization: internship.organization,
      coverLetter:  req.body.coverLetter?.trim() || '',
    });

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to submit application.' });
  }
});

// ─── GET /api/internships/:id/applications  — org sees applicants ─────────────
router.get('/:id/applications', protect, requireRole('organization'), async (req, res) => {
  try {
    const internship = await Internship.findOne({ _id: req.params.id, organization: req.user._id });
    if (!internship) return res.status(404).json({ success: false, message: 'Internship not found or not yours.' });

    const applications = await Application.find({ internship: internship._id })
      .populate('student', 'fullName email phone university linkedin github skills resumeFileName resumeFileKey')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: applications.length, data: applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch applications.' });
  }
});

// ─── PATCH /api/internships/:id/applications/:appId  — update status ──────────
router.patch('/:id/applications/:appId', protect, requireRole('organization'), async (req, res) => {
  try {
    const internship = await Internship.findOne({ _id: req.params.id, organization: req.user._id });
    if (!internship) return res.status(404).json({ success: false, message: 'Internship not found or not yours.' });

    const valid = ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'];
    if (!valid.includes(req.body.status)) {
      return res.status(422).json({ success: false, message: 'Invalid status.' });
    }

    const app = await Application.findOneAndUpdate(
      { _id: req.params.appId, internship: internship._id },
      { $set: { status: req.body.status } },
      { new: true }
    ).populate('student', 'fullName email phone university skills resumeFileName resumeFileKey');

    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update application status.' });
  }
});

// ─── Legacy: PATCH /api/internships/applications/:appId/status ───────────────
router.patch('/applications/:appId/status', protect, requireRole('organization'), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const app = await Application.findById(req.params.appId).populate('internship');
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (app.organization?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    app.status = status;
    await app.save();
    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update status.' });
  }
});

export default router;
