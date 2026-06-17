const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');

// @desc    Submit feedback for a resolved or closed complaint
// @route   POST /api/v1/feedback
// @access  Private (Ordinary User Only)
const submitFeedback = async (req, res) => {
  try {
    const { complaintId, rating, comment } = req.body;

    // Validate required fields
    if (!complaintId || rating === undefined || !comment) {
      return res.status(400).json({
        success: false,
        message: 'All fields (complaintId, rating, comment) are required.',
      });
    }

    // Validate rating format (integer between 1 and 5)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 5 || trimmedComment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 5 and 500 characters.',
      });
    }

    // Validate complaint exists
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Verify creator ownership
    if (complaint.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only submit feedback for complaints you created.',
      });
    }

    // Verify complaint status is Resolved
    if (complaint.status !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for Resolved complaints.',
      });
    }

    // Verify only one feedback per complaint
    const existingFeedback = await Feedback.findOne({ complaintId });
    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: 'Feedback has already been submitted for this complaint.',
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      complaintId,
      userId: req.user._id,
      rating,
      comment: trimmedComment,
    });

    return res.status(201).json({
      success: true,
      data: { feedback },
      message: 'Feedback submitted successfully.',
    });
  } catch (error) {
    console.error(`SubmitFeedback Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback.',
    });
  }
};

// @desc    Get feedback details for a complaint
// @route   GET /api/v1/feedback/:complaintId
// @access  Private (Admin, Creator Citizen, Assigned Agent)
const getFeedbackDetails = async (req, res) => {
  try {
    const { complaintId } = req.params;

    // Validate complaint exists
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Validate feedback exists
    const feedback = await Feedback.findOne({ complaintId });
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'No feedback details found for this complaint.',
      });
    }

    // Verify ownership permissions
    let isAuthorized = false;

    if (req.user.role === 'Admin') {
      isAuthorized = true;
    } else if (req.user.role === 'Ordinary') {
      if (complaint.userId.toString() === req.user._id.toString()) {
        isAuthorized = true;
      }
    } else if (req.user.role === 'Agent') {
      if (complaint.assignedAgentId && complaint.assignedAgentId.toString() === req.user._id.toString()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to view this feedback.',
      });
    }

    return res.status(200).json({
      success: true,
      data: { feedback },
      message: 'Feedback details loaded.',
    });
  } catch (error) {
    console.error(`GetFeedbackDetails Error: ${error.message}`);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving feedback details.',
    });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await Feedback.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);

    const items = await Feedback.find()
      .populate('userId', 'name email')
      .populate('complaintId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: {
        items,
        currentPage: page,
        totalPages,
        totalItems,
      },
      message: 'Feedback list loaded successfully.',
    });
  } catch (error) {
    console.error(`GetAllFeedback Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving feedback list.',
    });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackDetails,
  getAllFeedback,
};
