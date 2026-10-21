const express = require('express');
const {
  getAnalyses,
  getAnalysisById,
  createAnalysis,
  deleteAnalysis,
} = require('../controllers/analysis.controller');
const { authenticate } = require('../middleware/auth');
const { analysisRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

router.get('/', getAnalyses);
router.get('/:id', getAnalysisById);
router.post('/', analysisRateLimiter, createAnalysis);
router.delete('/:id', deleteAnalysis);

module.exports = router;
