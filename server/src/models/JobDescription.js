const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Job description must be associated with a user.'],
      index: true,
    },
    roleTitle: {
      type: String,
      trim: true,
      default: 'Untitled Role',
      maxlength: 150,
    },
    company: {
      type: String,
      trim: true,
      default: '',
      maxlength: 150,
    },
    rawText: {
      type: String,
      required: [true, 'Job description content is required.'],
      trim: true,
      minlength: [20, 'Job description must be at least 20 characters long.'],
    },
  },
  {
    timestamps: true,
  }
);

jobDescriptionSchema.index({ userId: 1, createdAt: -1 });

jobDescriptionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const JobDescription = mongoose.model('JobDescription', jobDescriptionSchema);

module.exports = JobDescription;
