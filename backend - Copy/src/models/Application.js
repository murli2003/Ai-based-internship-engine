import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [2000, 'Cover letter too long'],
    },
    appliedAt:  { type: Date, default: Date.now },
    lastScore:  { type: Number },
    lastRank:   { type: Number },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

applicationSchema.index({ internship: 1, student: 1 }, { unique: true });
applicationSchema.index({ student: 1, createdAt: -1 });
applicationSchema.index({ organization: 1, createdAt: -1 });
applicationSchema.index({ internship: 1, status: 1 });

export default mongoose.model('Application', applicationSchema);
