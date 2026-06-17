const express = require('express');
const router = express.Router();
const {
  getAllAgents,
  approveAgent,
  revokeAgent,
} = require('../controllers/agentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Force protection on all agent routing endpoints
router.use(protect);

// Admin-only agent administration routes
router.get('/', restrictTo('Admin'), getAllAgents);
router.patch('/:id/approve', restrictTo('Admin'), approveAgent);
router.patch('/:id/revoke', restrictTo('Admin'), revokeAgent);

module.exports = router;
