import mongoose from 'mongoose';

const internshipSchema = new mongoose.Schema(
  {
    // Organization that posted this
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    // Compensation / package
    package: { type: String, trim: true },
    stipend: { type: Number, min: 0 },
    // Location & type
    location: { type: String, trim: true },
    type: {
      type: String,
      enum: ['Remote', 'On-site', 'Hybrid', 'remote', 'onsite', 'hybrid'],
      default: 'On-site',
    },
    mode: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'hybrid',
    },
    // Details
    description:   { type: String, trim: true, maxlength: [3000, 'Description too long'] },
    domain:        { type: String, trim: true },
    applyLink:     { type: String, trim: true, default: '#' },
    // Skills
    requiredSkills:  { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    techStack:       { type: [String], default: [] },
    // Role details
    responsibilities:   { type: [String], default: [] },
    qualifications:     { type: [String], default: [] },
    learningOutcomes:   { type: [String], default: [] },
    screeningQuestions: { type: [String], default: [] },
    perks:              { type: [String], default: [] },
    applicationProcess: { type: String, trim: true, default: '' },
    aiBoostNote:        { type: String, trim: true, default: '' },
    jobType: {
      type: String,
      enum: ['internship', 'part-time', 'contract', 'research'],
      default: 'internship',
    },
    experienceLevel: {
      type: String,
      enum: ['fresher', 'beginner', 'intermediate', 'any'],
      default: 'fresher',
    },
    // Metadata
    category:            { type: String, trim: true, default: 'Company Posted' },
    isActive:            { type: Boolean, default: true },
    status:              { type: String, enum: ['draft', 'active', 'closed'], default: 'active' },
    applicationDeadline: { type: Date },
    openings:            { type: Number, default: 1, min: 1 },
    slots:               { type: Number, min: 1, default: 1 },
    minCgpa:             { type: Number, min: 0, max: 10, default: 0 },
    durationWeeks:       { type: Number, min: 1 },
    policyFlags: {
      reservationApplicable: { type: Boolean, default: false },
      regionConstraints: [{ type: String }],
    },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

internshipSchema.index({ organization: 1 });
internshipSchema.index({ isActive: 1, status: 1 });
internshipSchema.index({ type: 1 });
internshipSchema.index({ createdAt: -1 });

export default mongoose.model('Internship', internshipSchema);
