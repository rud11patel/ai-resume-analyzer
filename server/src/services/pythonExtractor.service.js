const fs = require('fs');
const path = require('path');
const { validateEnv } = require('../config/env');

const env = validateEnv();

/**
 * Dispatches an uploaded resume document file to the Python FastAPI microservice
 * for plain text extraction and document metadata profiling.
 * 
 * @param {string} filePath - Absolute path to stored resume file
 * @param {string} originalName - Original uploaded filename
 * @param {number} [timeoutMs=15000] - Internal HTTP request timeout
 * @returns {Promise<{ success: boolean, text: string, metadata: object, warnings: string[] }>}
 */
async function extractResumeTextViaPython(filePath, originalName, timeoutMs = 15000) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Resume file not found at path: ${filePath}`);
  }

  const pythonBaseUrl = env.PYTHON_SERVICE_URL.replace(/\/+$/, '');
  const targetUrl = `${pythonBaseUrl}/extract-text`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('file', blob, originalName || path.basename(filePath));

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || data?.detail || `Python extraction service returned HTTP ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return {
      success: true,
      text: data.text || '',
      metadata: data.metadata || {
        characterCount: (data.text || '').length,
        wordCount: (data.text || '').split(/\s+/).filter(Boolean).length,
        pageCount: 1,
        fileType: path.extname(originalName).replace('.', ''),
      },
      warnings: data.warnings || [],
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Python document processing service timed out after ${timeoutMs}ms.`);
    }
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      throw new Error(`Python extraction service is unavailable at ${pythonBaseUrl}.`);
    }
    throw error;
  }
}

module.exports = {
  extractResumeTextViaPython,
};
