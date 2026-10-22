const mongoose = require('mongoose');

const analysisResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Analysis result must be linked to a user.'],
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'Analysis result must reference a resume.'],
      index: true,
    },
    jobDescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobDescription',
      required: [true, 'Analysis result must reference a job description.'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'insufficient_data', 'failed'],
      default: 'pending',
      index: true,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    scoreLabel: {
      type: String,
      default: null,
    },
    scoreBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    structuredOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    llmFeedback: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    modelMetadata: {
      engineVersion: { type: String, default: '4.0.0' },
      algorithm: { type: String, default: 'Deterministic-Hybrid-TFIDF-Ngram' },
    },
    isDemoData: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user history chronological lookup
analysisResultSchema.index({ userId: 1, createdAt: -1 });
analysisResultSchema.index({ resumeId: 1, jobDescriptionId: 1 });

analysisResultSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const AnalysisResult = mongoose.model('AnalysisResult', analysisResultSchema);

module.exports = AnalysisResult;
