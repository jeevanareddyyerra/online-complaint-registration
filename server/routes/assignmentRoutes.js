const express = require('express');
const router = express.Router();
const {
  assignComplaint,
  reassignComplaint,
  acceptComplaint,
  resolveComplaint,
  getActiveTasks,
} = require('../controllers/assignmentController');
const { protect, restrictTo, checkApproved } = require('../middleware/authMiddleware');

// Force protection on all assignment routing endpoints
router.use(protect);

// Admin-only routing actions
router.post('/assign', restrictTo('Admin'), assignComplaint);
router.put('/reassign', restrictTo('Admin'), reassignComplaint);

// Agent-only task management
router.get('/active-tasks', restrictTo('Agent'), checkApproved, getActiveTasks);
router.patch('/:id/accept', restrictTo('Agent'), checkApproved, acceptComplaint);
router.patch('/:id/resolve', restrictTo('Agent'), checkApproved, resolveComplaint);

module.exports = router;
