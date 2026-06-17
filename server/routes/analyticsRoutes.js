const express = require('express');
const router = express.Router();
const {
  getComplaintAnalytics,
  getFeedbackAnalytics,
  getResolutionTrends,
} = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Force protection and Admin role boundaries on all analytics routes
router.use(protect);
router.use(restrictTo('Admin'));

router.get('/complaints', getComplaintAnalytics);
router.get('/feedback', getFeedbackAnalytics);
router.get('/resolution-trends', getResolutionTrends);

module.exports = router;
