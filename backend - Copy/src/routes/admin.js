import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Internship from '../models/Internship.js';
import Application from '../models/Application.js';

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// ─── GET /api/admin/analytics ─────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const [userCount, internshipCount, applicationCount] = await Promise.all([
      User.countDocuments(),
      Internship.countDocuments({ $or: [{ isActive: true }, { status: 'active' }] }),
      Application.countDocuments(),
    ]);

    const byDomain = await Internship.aggregate([
      { $match: { $or: [{ isActive: true }, { status: 'active' }] } },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
    ]);

    const byStatus = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        overview: { userCount, internshipCount, applicationCount },
        byDomain,
        byStatus,
        byRole,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, totalStudents, totalOrgs,
      totalInternships, activeInternships,
      totalApplications, recentApplications,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'organization' }),
      Internship.countDocuments(),
      Internship.countDocuments({ $or: [{ isActive: true }, { status: 'active' }] }),
      Application.countDocuments(),
      Application.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.find({ createdAt: { $gte: thirtyDaysAgo } }).select('role email createdAt').sort({ createdAt: -1 }).limit(10),
    ]);

    const acceptedApps  = await Application.countDocuments({ status: 'accepted' });
    const acceptanceRate = totalApplications ? Math.round((acceptedApps / totalApplications) * 100) : 0;

    // Monthly signup trend
    const monthlySignups = await User.aggregate([
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, totalStudents, totalOrgs,
        totalInternships, activeInternships,
        totalApplications, recentApplications, acceptanceRate,
        recentUsers,
        monthlySignups: monthlySignups.reverse(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ email: re }, { fullName: re }, { companyName: re }, { orgName: re }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).lean(),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, count: users.length, total, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/admin/users/:id/deactivate ────────────────────────────────────
router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/admin/users/:id/activate ─────────────────────────────────────
router.patch('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/admin/internships ───────────────────────────────────────────────
router.get('/internships', async (req, res) => {
  try {
    const internships = await Internship.find()
      .populate('organization', 'companyName email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, count: internships.length, data: internships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/admin/internships/:id ───────────────────────────────────────
router.delete('/internships/:id', async (req, res) => {
  try {
    await Internship.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Internship deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Stub endpoints to prevent errors from existing dashboard ─────────────────
router.get('/statistics',    async (req, res) => res.json({ success: true, data: {} }));
router.get('/timeseries',    async (req, res) => res.json({ success: true, data: [] }));
router.get('/skills',        async (req, res) => res.json({ success: true, data: [] }));
router.get('/domains',       async (req, res) => res.json({ success: true, data: [] }));
router.get('/locations',     async (req, res) => res.json({ success: true, data: [] }));
router.get('/engagement',    async (req, res) => res.json({ success: true, data: {} }));
router.get('/ai-performance',async (req, res) => res.json({ success: true, data: {} }));

export default router;
