import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { connectDB } from './config/db.js';
import './config/passport.js';
import { RATE_LIMIT } from './config/constants.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import authGoogleRoutes from './routes/authGoogle.js';
import internshipRoutes from './routes/internships.js';
import studentRoutes from './routes/student.js';
import organizationRoutes from './routes/organization.js';
import adminRoutes from './routes/admin.js';
import feedbackRoutes from './routes/feedback.js';

await connectDB();

const app = express();

// ── Security headers ──
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return cb(null, true);
    return cb(new Error(`CORS policy: ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Logging ──
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parser ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Session (needed for Passport Google OAuth only) ──
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 5 * 60 * 1000,
  },
}));

// ── Rate limiting ──
const skipApiRateLimit =
  process.env.RATE_LIMIT_DISABLED === 'true' ||
  process.env.RATE_LIMIT_DISABLED === '1';

app.use(
  '/api/',
  rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
    skip: () => skipApiRateLimit,
  })
);
app.use(
  '/api/auth/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 50 : 200,
    message: { message: 'Too many auth attempts, please slow down.' },
    skip: () => skipApiRateLimit,
  })
);

// ── Routes ──
app.use('/api/auth',         authRoutes);
app.use('/api/auth',         authGoogleRoutes);
app.use('/api/internships',  internshipRoutes);
app.use('/api/student',      studentRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/feedback',     feedbackRoutes);

// Legacy route aliases so existing frontend continues to work during migration
app.use('/api/students',  studentRoutes);
app.use('/api/providers', organizationRoutes);

app.get('/api/health', (req, res) =>
  res.json({ ok: true, env: process.env.NODE_ENV, ts: new Date().toISOString() })
);

// ── Error handling ──
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀  Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
);
