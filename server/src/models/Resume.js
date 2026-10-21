const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resume must be associated with a user.'],
      index: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required.'],
      trim: true,
      maxlength: 255,
    },
    fileName: {
      type: String,
      required: [true, 'Server storage filename is required.'],
      trim: true,
    },
    filePath: {
      type: String,
      required: [true, 'Relative file storage path is required.'],
    },
    fileType: {
      type: String,
      required: [true, 'File MIME type is required.'],
      enum: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required.'],
      min: [1, 'File size cannot be 0 bytes.'],
    },
    extractedText: {
      type: String,
      default: '',
    },
    extractionStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    extractionError: {
      type: String,
      default: null,
    },
    metadata: {
      characterCount: { type: Number, default: 0 },
      wordCount: { type: Number, default: 0 },
      pageCount: { type: Number, default: 1 },
      fileType: { type: String },
      warnings: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user-specific chronological lookups
resumeSchema.index({ userId: 1, createdAt: -1 });

// Ensure internal system paths are not exposed directly in API outputs
resumeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.filePath;
  delete obj.__v;
  return obj;
};

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
