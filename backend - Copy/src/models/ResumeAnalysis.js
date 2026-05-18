import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  roleId:           { type: String },
  title:            { type: String },
  company:          { type: String },
  percentage:       { type: Number, min: 0, max: 100 },
  type:             { type: String },
  location:         { type: String },
  package:          { type: String },
  applyLink:        { type: String },
  matchedRequired:  [String],
  matchedPreferred: [String],
  missingRequired:  [String],
  explanation:      { type: String },
}, { _id: false });

const educationSchema = new mongoose.Schema({
  type:  String,
  value: String,
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name:        String,
  description: String,
}, { _id: false });

const resumeAnalysisSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    parsedData: {
      name:      { type: String },
      email:     { type: String },
      mobile:    { type: String },
      github:    { type: String },
      linkedin:  { type: String },
      skills:    [String],
      projects:  [projectSchema],
      education: [educationSchema],
    },
    matches: [matchSchema],
    topMatchPercentage: { type: Number, default: 0 },
    topMatchRole:       { type: String, default: '' },
    skillsCount:        { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

resumeAnalysisSchema.pre('save', function (next) {
  if (this.matches && this.matches.length > 0) {
    this.topMatchPercentage = this.matches[0].percentage || 0;
    this.topMatchRole       = this.matches[0].title      || '';
  }
  if (this.parsedData?.skills) {
    this.skillsCount = this.parsedData.skills.length;
  }
  next();
});

resumeAnalysisSchema.index({ student: 1 });
resumeAnalysisSchema.index({ createdAt: -1 });

export default mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
