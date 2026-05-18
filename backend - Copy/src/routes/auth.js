import express from 'express';
import { protect, signToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// ─── Helper ────────────────────────────────────────────────────────────────────
const sendToken = (user, statusCode, res) => {
  const token    = signToken(user._id);
  const userData = user.toObject();
  delete userData.password;
  delete userData.googleId;
  res.status(statusCode).json({ success: true, token, user: userData });
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      email, password, role,
      // Student fields
      fullName, university, github, linkedin,
      // Organization fields
      companyName, orgName, industry, website, contactPerson,
    } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password and role are required.' });
    }
    if (!['student', 'organization'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be student or organization.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const userData = { role, email: email.toLowerCase(), password };

    if (role === 'student') {
      if (!fullName?.trim()) {
        return res.status(422).json({ success: false, message: 'Full name is required for students.' });
      }
      userData.fullName   = fullName.trim();
      userData.university = university?.trim() || '';
      userData.github     = github?.trim()     || '';
      userData.linkedin   = linkedin?.trim()   || '';
    } else {
      const name = companyName?.trim() || orgName?.trim();
      if (!name) {
        return res.status(422).json({ success: false, message: 'Company name is required for organizations.' });
      }
      userData.companyName   = name;
      userData.orgName       = name;
      userData.industry      = industry?.trim()      || '';
      userData.website       = website?.trim()       || '';
      userData.contactPerson = contactPerson?.trim() || '';
    }

    const user = await User.create(userData);
    sendToken(user, 201, res);
  } catch (err) {
    console.error('[Register error]', err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }
    res.status(500).json({ success: false, message: err.message || 'Registration failed.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.password) {
      return res.status(401).json({ success: false, message: 'Please sign in with Google.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, res);
  } catch (err) {
    console.error('[Login error]', err);
    res.status(500).json({ success: false, message: err.message || 'Login failed.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch user.' });
  }
});

// ─── PATCH /api/auth/profile ──────────────────────────────────────────────────
router.patch('/profile', protect, async (req, res) => {
  try {
    const allowed = [
      'fullName', 'university', 'github', 'linkedin', 'phone', 'bio',
      'profileCompleted', 'resumeFileName', 'resumeProfile', 'skills',
      'companyName', 'orgName', 'industry', 'website', 'contactPerson', 'logoUrl',
      'location', 'contactEmail', 'contactPhone', 'description',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Profile update failed.' });
  }
});

// ─── POST /api/auth/change-password ──────────────────────────────────────────
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(422).json({ success: false, message: 'Both passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(422).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const ok   = await user.comparePassword(currentPassword);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password change failed.' });
  }
});

export default router;
