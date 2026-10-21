const express = require('express');
const { getHealth } = require('../controllers/health.controller');

const router = express.Router();

/**
 * Health check endpoint
 * @route GET /api/health
 */
router.get('/', getHealth);

module.exports = router;
