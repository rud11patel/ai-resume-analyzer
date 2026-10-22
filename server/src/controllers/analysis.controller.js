const mongoose = require('mongoose');
const AnalysisResult = require('../models/AnalysisResult');
const Resume = require('../models/Resume');
const JobDescription = require('../models/JobDescription');
const { analyzeResumeViaPython } = require('../services/pythonAnalyzer.service');
const { generateLlmAdvice } = require('../services/llmAdvisor.service');

/**
 * List all analysis records for the current user.
 * GET /api/analyses
 */
async function getAnalyses(req, res, next) {
  try {
    const analyses = await AnalysisResult.find({ userId: req.user._id })
      .populate('resumeId', 'originalName fileName fileSize fileType extractionStatus')
      .populate('jobDescriptionId', 'roleTitle company')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        analyses,
        count: analyses.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a specific analysis record by ID.
 * GET /api/analyses/:id
 */
async function getAnalysisById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid analysis identifier format.', statusCode: 400 },
      });
    }

    const analysis = await AnalysisResult.findOne({ _id: id, userId: req.user._id })
      .populate('resumeId', 'originalName fileName fileSize fileType extractionStatus extractedText metadata')
      .populate('jobDescriptionId', 'roleTitle company rawText');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: { message: 'Analysis record not found or access denied.', statusCode: 404 },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        analysis,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create and execute an AI compatibility analysis linking a resume and job description.
 * Authenticates user, verifies resource ownership, dispatches text to the Python NLP engine,
 * and persists the deterministic score and structured results.
 * POST /api/analyses
 */
async function createAnalysis(req, res, next) {
  try {
    const { resumeId, jobDescriptionId, overallScore, scoreLabel, structuredOutput, isDemo } = req.body;

    if (!resumeId || !mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid resumeId is required.', statusCode: 400 },
      });
    }

    if (!jobDescriptionId || !mongoose.Types.ObjectId.isValid(jobDescriptionId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid jobDescriptionId is required.', statusCode: 400 },
      });
    }

    // Verify ownership of referenced resume and job description
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: { message: 'Referenced resume not found or access denied.', statusCode: 404 },
      });
    }

    const jobDescription = await JobDescription.findOne({ _id: jobDescriptionId, userId: req.user._id });
    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        error: { message: 'Referenced job description not found or access denied.', statusCode: 404 },
      });
    }

    // Check if client explicitly requests Phase 3 demo persistence mode
    const isExplicitDemo = isDemo === true || (typeof overallScore === 'number' && !resume.extractedText);
    if (isExplicitDemo) {
      const demoAnalysis = await AnalysisResult.create({
        userId: req.user._id,
        resumeId: resume._id,
        jobDescriptionId: jobDescription._id,
        status: 'completed',
        overallScore: typeof overallScore === 'number' ? overallScore : 80,
        scoreLabel: scoreLabel || 'Demo Evaluation',
        structuredOutput: structuredOutput || {},
        llmFeedback: req.body.llmFeedback || structuredOutput?.llmFeedback || null,
        isDemoData: true,
        completedAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Analysis record created (Phase 3 persistence mode).',
        data: {
          analysis: demoAnalysis,
        },
      });
    }

    // Real Phase 4 NLP Analysis Engine Execution
    if (!resume.extractedText || resume.extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'The selected resume does not contain extracted text. Please ensure document text extraction has completed.',
          statusCode: 400,
        },
      });
    }

    // Create record with 'pending' status
    const analysis = await AnalysisResult.create({
      userId: req.user._id,
      resumeId: resume._id,
      jobDescriptionId: jobDescription._id,
      status: 'pending',
      isDemoData: false,
    });

    try {
      // Dispatch to Python AI/NLP microservice
      const nlpResult = await analyzeResumeViaPython({
        resumeText: resume.extractedText,
        jobDescription: jobDescription.rawText,
        roleTitle: jobDescription.roleTitle,
        company: jobDescription.company,
      });

      // Attempt LLM Career Advisor generation (Grok primary, Gemini fallback)
      let llmFeedback = null;
      try {
        const detectedSkillsList = (nlpResult.matchedSkills || []).map((s) => (typeof s === 'string' ? s : s.name || ''));
        const missingSkillsList = (nlpResult.missingSkills || []).map((s) => (typeof s === 'string' ? s : s.name || ''));

        llmFeedback = await generateLlmAdvice({
          resumeText: resume.extractedText,
          jobDescription: jobDescription.rawText,
          matchScore: nlpResult.overallScore,
          detectedSkills: detectedSkillsList.filter(Boolean),
          missingSkills: missingSkillsList.filter(Boolean),
          roleTitle: jobDescription.roleTitle,
          company: jobDescription.company,
        });
      } catch (llmErr) {
        console.warn('[Analysis Controller] Non-fatal LLM advisor error:', llmErr.message);
      }

      // Update record with completed results
      analysis.status = nlpResult.status || 'completed';
      analysis.overallScore = nlpResult.overallScore;
      analysis.scoreLabel = nlpResult.scoreLabel;
      analysis.scoreBreakdown = nlpResult.scoreBreakdown || {};
      analysis.structuredOutput = nlpResult;
      analysis.llmFeedback = llmFeedback;
      analysis.modelMetadata = nlpResult.modelMetadata || {
        engineVersion: '4.0.0',
        algorithm: 'Deterministic-Hybrid-TFIDF-Ngram',
      };
      analysis.completedAt = new Date();
      analysis.isDemoData = false;
      await analysis.save();

      return res.status(201).json({
        success: true,
        message: 'Resume analyzed successfully.',
        data: {
          analysis,
        },
      });
    } catch (nlpErr) {
      analysis.status = 'failed';
      analysis.errorMessage = nlpErr.message || 'AI analysis service temporarily unavailable.';
      await analysis.save();

      return res.status(nlpErr.status || 500).json({
        success: false,
        error: {
          message: nlpErr.message || 'AI analysis service temporarily unavailable.',
          statusCode: nlpErr.status || 500,
        },
        data: {
          analysis,
        },
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an analysis record.
 * DELETE /api/analyses/:id
 */
async function deleteAnalysis(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid analysis identifier format.', statusCode: 400 },
      });
    }

    const analysis = await AnalysisResult.findOne({ _id: id, userId: req.user._id });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: { message: 'Analysis record not found or access denied.', statusCode: 404 },
      });
    }

    await AnalysisResult.deleteOne({ _id: analysis._id });

    return res.status(200).json({
      success: true,
      message: 'Analysis record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAnalyses,
  getAnalysisById,
  createAnalysis,
  deleteAnalysis,
};
