const fs = require('fs');
const path = require('path');

/**
 * Ensures the target upload directory exists on disk.
 * @param {string} dirPath 
 */
function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Safely removes a stored file without throwing fatal errors.
 * Useful for cleanup if database persistence or Python processing fails.
 * @param {string} filePath 
 */
function deleteFileSafe(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Storage] Cleaned up temporary file: ${filePath}`);
    }
  } catch (err) {
    console.warn(`[Storage Warning] Failed to delete file at ${filePath}:`, err.message);
  }
}

module.exports = {
  ensureDirExists,
  deleteFileSafe,
};
