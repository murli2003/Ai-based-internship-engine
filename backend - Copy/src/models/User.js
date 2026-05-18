import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['student', 'organization', 'admin'],
      required: [true, 'Role is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: function () { return !this.googleId; },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    googleId: { type: String, select: false },

    // ── Student-specific ──────────────────────────────────────────────────────
    fullName:         { type: String, trim: true, maxlength: [100, 'Name too long'] },
    university:       { type: String, trim: true },
    github:           { type: String, trim: true },
    linkedin:         { type: String, trim: true },
    skills:           [String],
    phone:            { type: String, trim: true },
    bio:              { type: String, trim: true, maxlength: [500, 'Bio too long'] },
    profileCompleted: { type: Boolean, default: false },
    resumeFileName:   { type: String, trim: true },
    resumeFileKey:    { type: String, trim: true },
    resumeProfile:    { type: mongoose.Schema.Types.Mixed, default: null },

    // ── Organization-specific ─────────────────────────────────────────────────
    companyName:   { type: String, trim: true },
    industry:      { type: String, trim: true },
    website:       { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    logoUrl:       { type: String, trim: true },
    // Legacy provider fields (kept for compatibility)
    orgName:       { type: String, trim: true },
    location:      { type: String, trim: true },
    contactEmail:  { type: String, trim: true },
    contactPhone:  { type: String, trim: true },
    description:   { type: String, trim: true },

    // ── Admin ─────────────────────────────────────────────────────────────────
    isActive:  { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: display name ─────────────────────────────────────────────────
userSchema.virtual('displayName').get(function () {
  if (this.role === 'student') return this.fullName || this.email;
  if (this.role === 'organization') return this.companyName || this.orgName || this.email;
  return this.email;
});

// ─── Indexes ───────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });

// ─── Pre-save: hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: compare password ────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
