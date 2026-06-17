const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  cancelComplaint,
  reopenComplaint,
  rejectComplaint,
  getComplaintsAdmin,
} = require('../controllers/complaintController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Force protection on all complaint routing endpoints
router.use(protect);

// Admin-facing list retrieval
router.get('/', restrictTo('Admin'), getComplaintsAdmin);

// User-facing lodge and fetch list endpoints
router.post('/', restrictTo('Ordinary'), createComplaint);
router.get('/my-complaints', restrictTo('Ordinary'), getMyComplaints);

// Fetch detail, allowed to all roles (Admin, Agent, and Ordinary creator verified in controller)
router.get('/:id', getComplaintById);

// Update, cancel, and reopen endpoints (User actions)
router.put('/:id', restrictTo('Ordinary'), updateComplaint);
router.delete('/:id', restrictTo('Ordinary'), cancelComplaint);
router.patch('/:id/reopen', restrictTo('Ordinary'), reopenComplaint);

// Admin-only complaint administration controls
router.patch('/:id/reject', restrictTo('Admin'), rejectComplaint);

module.exports = router;
