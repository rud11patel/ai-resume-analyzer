/**
 * Client-side validation utilities for files and form inputs
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

/**
 * Validate a selected resume file
 * @param {File} file 
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateResumeFile(file) {
  if (!file) {
    return { isValid: false, error: 'Please select a resume file to upload.' };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx).`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds the 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'The selected file appears to be empty (0 bytes).',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate job description text
 * @param {string} text 
 * @param {number} [minLength=50] 
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateJobDescription(text, minLength = 50) {
  if (!text || !text.trim()) {
    return { isValid: false, error: 'Job description is required.' };
  }

  const trimmed = text.trim();
  if (trimmed.length < minLength) {
    return {
      isValid: false,
      error: `Job description is too short (${trimmed.length}/${minLength} characters). Please provide more context for accurate matching.`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Simple email validation
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
