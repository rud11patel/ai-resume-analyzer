const dotenv = require('dotenv');
const path = require('path');

// Load .env file from server root if available
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validates required environment variables and sets defaults.
 * Exits or throws with a clear descriptive message if critical variables are missing or invalid.
 */
function validateEnv() {
  const errors = [];

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  if (isNaN(port) || port <= 0 || port > 65535) {
    errors.push('PORT must be a valid integer between 1 and 65535.');
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    errors.push('MONGODB_URI is required. Please set it in your environment or .env file.');
  } else if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    errors.push('MONGODB_URI must begin with "mongodb://" (local) or "mongodb+srv://" (Atlas).');
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    new URL(clientUrl);
  } catch {
    errors.push('CLIENT_URL must be a valid URL (e.g., "http://localhost:5173").');
  }

  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
  try {
    new URL(pythonServiceUrl);
  } catch {
    errors.push('PYTHON_SERVICE_URL must be a valid URL (e.g., "http://localhost:8000").');
  }

  const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test_jwt_secret_token_12345' : null);
  if (!jwtSecret && process.env.NODE_ENV === 'production') {
    errors.push('JWT_SECRET is required in production environment.');
  }

  const maxFileSizeMb = process.env.MAX_FILE_SIZE_MB ? parseFloat(process.env.MAX_FILE_SIZE_MB) : 5;
  if (isNaN(maxFileSizeMb) || maxFileSizeMb <= 0) {
    errors.push('MAX_FILE_SIZE_MB must be a positive number.');
  }

  if (errors.length > 0) {
    const message = `[Config Error] Environment configuration validation failed:\n  - ${errors.join('\n  - ')}`;
    throw new Error(message);
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: port,
    MONGODB_URI: mongoUri,
    CLIENT_URL: clientUrl,
    JWT_SECRET: jwtSecret || 'dev_jwt_secret_key_ai_resume_analyzer_phase_3_secure_token_seed_8492',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
    MAX_FILE_SIZE_MB: maxFileSizeMb,
    PYTHON_SERVICE_URL: pythonServiceUrl,
    REQUEST_LIMIT: process.env.REQUEST_LIMIT || '10mb',
    GROQ_API_KEY: process.env.GROQ_API_KEY || process.env.GROK_API_KEY || null,
    GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || null,
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    LLM_TIMEOUT_MS: process.env.LLM_TIMEOUT_MS ? parseInt(process.env.LLM_TIMEOUT_MS, 10) : 25000,
  };
}

module.exports = {
  validateEnv,
};
