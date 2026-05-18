import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'beginner' },
}, { _id: false });

const preferenceSchema = new mongoose.Schema({
  domains: [{ type: String }],
  locations: [{ type: String }],
  tenureWeeks: { min: Number, max: Number },
  mode: { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'hybrid' },
}, { _id: false });

const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    institution: { type: String, trim: true },
    course: { type: String, trim: true },
    branch: { type: String, trim: true },
    yearOfStudy: { type: Number, min: 1, max: 5 },
    cgpa: { type: Number, min: 0, max: 10 },
    semesterGrades: [{ type: Number }],
    backlogs: { type: Number, default: 0 },
    skills: [skillSchema],
    certifications: [{ type: String }],
    projects: [{ title: String, description: String, link: String }],
    preferences: { type: preferenceSchema, default: () => ({}) },
    eligibility: {
      trainingCompleted: { type: Boolean, default: false },
      availableFrom: { type: Date },
      availableUntil: { type: Date },
    },
    reservationCategory: { type: String, enum: ['general', 'SC', 'ST', 'OBC', 'EWS', 'PWD', ''], default: '' },
  },
  { timestamps: true }
);

// MongoDB text index fields must ultimately resolve to strings; `skills` is an array of subdocs.
studentProfileSchema.index({ 'skills.name': 'text', cgpa: 1 });
studentProfileSchema.index({ 'preferences.domains': 1 });
studentProfileSchema.index({ 'preferences.locations': 1 });

export default mongoose.model('StudentProfile', studentProfileSchema);
