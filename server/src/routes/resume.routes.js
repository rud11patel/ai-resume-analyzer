const express = require('express');
const { uploadResume, getResumes, getResumeById, deleteResume } = require('../controllers/resume.controller');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All resume operations require authentication
router.use(authenticate);

router.post('/', uploadRateLimiter, upload.single('file'), uploadResume);
router.get('/', getResumes);
router.get('/:id', getResumeById);
router.delete('/:id', deleteResume);

module.exports = router;
