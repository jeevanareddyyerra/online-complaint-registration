const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedbackDetails, getAllFeedback } = require('../controllers/feedbackController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Force protection on all feedback endpoints
router.use(protect);

router.post('/', restrictTo('Ordinary'), submitFeedback);
router.get('/', restrictTo('Admin'), getAllFeedback);
router.get('/:complaintId', getFeedbackDetails);

module.exports = router;
