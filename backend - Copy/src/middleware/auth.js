import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─── Verify JWT (supports both naming conventions) ────────────────────────────
export const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised. No token provided.' });
  }

  try {
    // Support both { userId } and { id } payloads for compatibility
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const userId  = decoded.id || decoded.userId;
    const user    = await User.findById(userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' :
      err.name === 'JsonWebTokenError'  ? 'Invalid token.'                        :
      'Authentication failed.';
    return res.status(401).json({ success: false, message });
  }
};

// Alias for legacy code that uses `authenticate`
export const authenticate = protect;

// ─── Role guard ───────────────────────────────────────────────────────────────
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}.`,
    });
  }
  next();
};

export { requireRole as rbac };

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
export const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
