const { validateEnv } = require('../config/env');

const env = validateEnv();

/**
 * Dispatches resume text and job description to the Python FastAPI microservice
 * for hybrid semantic matching, skill normalization, and deterministic scoring.
 * 
 * @param {object} params
 * @param {string} params.resumeText - Extracted resume plain text
 * @param {string} params.jobDescription - Job description raw text
 * @param {string} [params.roleTitle] - Optional role title
 * @param {string} [params.company] - Optional company name
 * @param {number} [timeoutMs=25000] - Request timeout in milliseconds
 * @returns {Promise<object>} Structured NLP analysis response
 */
async function analyzeResumeViaPython({
  resumeText,
  jobDescription,
  roleTitle,
  company,
  timeoutMs = 25000,
}) {
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length === 0) {
    throw new Error('Resume text must not be empty.');
  }

  if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 15) {
    throw new Error('Job description must contain at least 15 characters.');
  }

  const pythonBaseUrl = (process.env.PYTHON_SERVICE_URL || env.PYTHON_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');
  const targetUrl = `${pythonBaseUrl}/analyze`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload = {
      resume_text: resumeText,
      job_description: jobDescription,
      role_title: roleTitle || undefined,
      company: company || undefined,
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || data?.detail || `Python analysis service returned HTTP ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    if (!data || typeof data.overallScore !== 'number') {
      throw new Error('Invalid or malformed analysis response from Python ML service.');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutErr = new Error(`Python AI analysis service timed out after ${timeoutMs}ms.`);
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      const connErr = new Error(`Python AI analysis microservice is unreachable at ${pythonBaseUrl}.`);
      connErr.status = 503;
      throw connErr;
    }
    throw error;
  }
}

module.exports = {
  analyzeResumeViaPython,
};
