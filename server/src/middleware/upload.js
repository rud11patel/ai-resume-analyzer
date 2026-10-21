const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { validateEnv } = require('../config/env');
const { ensureDirExists } = require('../services/storage.service');

const env = validateEnv();
const uploadDir = env.UPLOAD_DIR;
ensureDirExists(uploadDir);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx']);

// Disk Storage with sanitized unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure random UUID filename to prevent collisions and path traversal
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueId = crypto.randomUUID();
    const safeName = `resume-${uniqueId}${ext}`;
    cb(null, safeName);
  },
});

// File type filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error(
      `Unsupported file format '${ext}'. Only PDF (.pdf) and Word documents (.docx) up to ${env.MAX_FILE_SIZE_MB}MB are permitted.`
    );
    error.status = 400;
    return cb(error, false);
  }

  cb(null, true);
};

const maxBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxBytes,
    files: 1, // Only 1 resume file per upload request
  },
});

module.exports = {
  upload,
  uploadDir,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
};
