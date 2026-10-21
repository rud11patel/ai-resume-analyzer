const mongoose = require('mongoose');
const JobDescription = require('../models/JobDescription');
const AnalysisResult = require('../models/AnalysisResult');

/**
 * Save a new target job description.
 * POST /api/job-descriptions
 */
async function createJobDescription(req, res, next) {
  try {
    const { roleTitle, company, rawText } = req.body;

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Job description content (rawText) is required.', statusCode: 400 },
      });
    }

    if (rawText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: { message: 'Job description must be at least 20 characters long.', statusCode: 400 },
      });
    }

    const jobDescription = await JobDescription.create({
      userId: req.user._id,
      roleTitle: (roleTitle || '').trim() || 'Untitled Role',
      company: (company || '').trim(),
      rawText: rawText.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Job description saved successfully.',
      data: {
        jobDescription,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all job descriptions for current user.
 * GET /api/job-descriptions
 */
async function getJobDescriptions(req, res, next) {
  try {
    const jobDescriptions = await JobDescription.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        jobDescriptions,
        count: jobDescriptions.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a single job description by ID.
 * GET /api/job-descriptions/:id
 */
async function getJobDescriptionById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid job description identifier format.', statusCode: 400 },
      });
    }

    const jobDescription = await JobDescription.findOne({ _id: id, userId: req.user._id });

    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job description not found or access denied.', statusCode: 404 },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        jobDescription,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a job description.
 * DELETE /api/job-descriptions/:id
 */
async function deleteJobDescription(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid job description identifier format.', statusCode: 400 },
      });
    }

    const jobDescription = await JobDescription.findOne({ _id: id, userId: req.user._id });

    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        error: { message: 'Job description not found or access denied.', statusCode: 404 },
      });
    }

    await AnalysisResult.deleteMany({ jobDescriptionId: jobDescription._id });
    await JobDescription.deleteOne({ _id: jobDescription._id });

    return res.status(200).json({
      success: true,
      message: 'Job description deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createJobDescription,
  getJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
};
