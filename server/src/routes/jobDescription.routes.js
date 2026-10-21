const express = require('express');
const {
  createJobDescription,
  getJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
} = require('../controllers/jobDescription.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', createJobDescription);
router.get('/', getJobDescriptions);
router.get('/:id', getJobDescriptionById);
router.delete('/:id', deleteJobDescription);

module.exports = router;
