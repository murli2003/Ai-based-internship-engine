import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentRating:    { type: Number, min: 1, max: 5 },
    providerRating:   { type: Number, min: 1, max: 5 },
    completionStatus: { type: String, enum: ['completed', 'dropped', 'ongoing'], default: 'ongoing' },
    performanceNote:  { type: String, trim: true },
  },
  { timestamps: true }
);

feedbackSchema.index({ student: 1, internship: 1 });

export default mongoose.model('Feedback', feedbackSchema);
