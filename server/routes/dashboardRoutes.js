const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  getChartAnalytics,
  getAgentPerformance,
} = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Force protection and Admin role boundaries on all dashboard routes
router.use(protect);
router.use(restrictTo('Admin'));

router.get('/metrics', getDashboardMetrics);
router.get('/analytics', getChartAnalytics);
router.get('/agents-performance', getAgentPerformance);

module.exports = router;
