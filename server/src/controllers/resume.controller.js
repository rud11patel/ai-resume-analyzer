const mongoose = require('mongoose');
const Resume = require('../models/Resume');
const AnalysisResult = require('../models/AnalysisResult');
const { extractResumeTextViaPython } = require('../services/pythonExtractor.service');
const { deleteFileSafe } = require('../services/storage.service');

/**
 * Upload and process a candidate resume file.
 * POST /api/resumes
 */
async function uploadResume(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No resume file uploaded. Please upload a PDF or DOCX file.', statusCode: 400 },
    });
  }

  const { path: filePath, originalname: originalName, filename: fileName, mimetype: fileType, size: fileSize } = req.file;

  let resume = null;

  try {
    // 1. Initial persistence of resume metadata with 'processing' status
    resume = await Resume.create({
      userId: req.user._id,
      originalName,
      fileName,
      filePath,
      fileType,
      fileSize,
      extractionStatus: 'processing',
    });

    // 2. Dispatch file to Python FastAPI microservice for text extraction
    try {
      const extraction = await extractResumeTextViaPython(filePath, originalName);

      resume.extractedText = extraction.text;
      resume.metadata = extraction.metadata;
      resume.extractionStatus = 'completed';
      resume.extractionError = null;
      await resume.save();
    } catch (extractionError) {
      console.warn(`[Extraction Warning] Python service extraction failed for ${fileName}:`, extractionError.message);
      // Mark as failed in DB without discarding the uploaded metadata
      resume.extractionStatus = 'failed';
      resume.extractionError = extractionError.message || 'Text extraction failed.';
      await resume.save();
    }

    return res.status(201).json({
      success: true,
      message: resume.extractionStatus === 'completed'
        ? 'Resume uploaded and text extracted successfully.'
        : 'Resume uploaded but automated text extraction failed. Diagnostics recorded.',
      data: {
        resume,
      },
    });
  } catch (error) {
    // If database persistence completely failed, remove the stored file from disk
    deleteFileSafe(filePath);
    next(error);
  }
}

/**
 * List all resumes owned by the authenticated user.
 * GET /api/resumes
 */
async function getResumes(req, res, next) {
  try {
    // Exclude raw extracted text from bulk list response for network efficiency
    const resumes = await Resume.find({ userId: req.user._id })
      .select('-extractedText')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        resumes,
        count: resumes.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve one specific resume by ID (with authorization check).
 * GET /api/resumes/:id
 */
async function getResumeById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid resume identifier format.', statusCode: 400 },
      });
    }

    // Ownership check: must match both _id and userId
    const resume = await Resume.findOne({ _id: id, userId: req.user._id });

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: { message: 'Resume not found or access denied.', statusCode: 404 },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        resume,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a resume and its physical file safely.
 * DELETE /api/resumes/:id
 */
async function deleteResume(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid resume identifier format.', statusCode: 400 },
      });
    }

    const resume = await Resume.findOne({ _id: id, userId: req.user._id });

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: { message: 'Resume not found or access denied.', statusCode: 404 },
      });
    }

    // 1. Unlink physical file from storage
    deleteFileSafe(resume.filePath);

    // 2. Delete related AnalysisResult records
    await AnalysisResult.deleteMany({ resumeId: resume._id });

    // 3. Remove resume document from database
    await Resume.deleteOne({ _id: resume._id });

    return res.status(200).json({
      success: true,
      message: 'Resume and associated records deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadResume,
  getResumes,
  getResumeById,
  deleteResume,
};
