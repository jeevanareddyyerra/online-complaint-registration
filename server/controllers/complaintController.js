const Complaint = require('../models/Complaint');
const AssignedComplaint = require('../models/AssignedComplaint');

// @desc    Create a new complaint
// @route   POST /api/v1/complaints
// @access  Private (Ordinary User)
const createComplaint = async (req, res) => {
  try {
    const { name, category, address, city, state, pincode, comment, attachments } = req.body;

    // Validate required fields
    if (!name || !category || !address || !city || !state || !pincode || !comment) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, category, address, city, state, pincode, comment) are required.',
      });
    }

    const complaint = await Complaint.create({
      userId: req.user._id,
      name,
      category,
      address,
      city,
      state,
      pincode,
      comment,
      attachments: attachments || [],
      status: 'Pending',
    });

    return res.status(201).json({
      success: true,
      data: { complaint },
      message: 'Complaint created successfully.',
    });
  } catch (error) {
    console.error(`CreateComplaint Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during complaint creation.',
    });
  }
};

// @desc    Get all complaints created by the logged-in citizen
// @route   GET /api/v1/complaints/my-complaints
// @access  Private (Ordinary User)
const getMyComplaints = async (req, res) => {
  try {
    const queryStatus = req.query.status;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Base query filter
    const query = { userId: req.user._id };

    // Apply status filter if provided
    if (queryStatus) {
      query.status = queryStatus;
    }

    const total = await Complaint.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate overall metrics for citizen dashboard cards
    const metrics = {
      total: await Complaint.countDocuments({ userId: req.user._id }),
      pending: await Complaint.countDocuments({ userId: req.user._id, status: 'Pending' }),
      inProgress: await Complaint.countDocuments({ userId: req.user._id, status: { $in: ['In Progress', 'Work Started'] } }),
      resolved: await Complaint.countDocuments({ userId: req.user._id, status: 'Resolved' }),
    };

    return res.status(200).json({
      success: true,
      data: {
        items: complaints,
        currentPage: page,
        totalPages: pages,
        totalItems: total,
        metrics,
      },
      message: 'User complaints retrieved successfully.',
    });
  } catch (error) {
    console.error(`GetMyComplaints Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user complaints.',
    });
  }
};

// @desc    Get complaint by ID with access control validation
// @route   GET /api/v1/complaints/:id
// @access  Private (Ordinary, Admin, Agent)
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('userId', 'name email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Access authorization checks
    // Admins can see everything
    if (req.user.role !== 'Admin') {
      // Ordinary users can only see their own complaints
      if (req.user.role === 'Ordinary' && complaint.userId._id.toString() === req.user._id.toString()) {
        // Authorized owner
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not authorized to view this complaint.',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: { complaint },
      message: 'Complaint details retrieved.',
    });
  } catch (error) {
    console.error(`GetComplaintById Error: ${error.message}`);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving complaint details.',
    });
  }
};

// @desc    Update complaint details (while Pending status only)
// @route   PUT /api/v1/complaints/:id
// @access  Private (Ordinary User)
const updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

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
        message: 'Access denied. You can only update your own complaints.',
      });
    }

    // Verify current status allows edits
    if (!complaint.canBeEdited()) {
      return res.status(400).json({
        success: false,
        message: 'Complaint cannot be edited as it is already being processed.',
      });
    }

    const { name, category, address, city, state, pincode, comment, attachments } = req.body;

    // Update fields if provided
    if (name) complaint.name = name;
    if (category) complaint.category = category;
    if (address) complaint.address = address;
    if (city) complaint.city = city;
    if (state) complaint.state = state;
    if (pincode) complaint.pincode = pincode;
    if (comment) complaint.comment = comment;
    if (attachments) complaint.attachments = attachments;

    await complaint.save();

    return res.status(200).json({
      success: true,
      data: { complaint },
      message: 'Complaint updated successfully.',
    });
  } catch (error) {
    console.error(`UpdateComplaint Error: ${error.message}`);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error updating complaint.',
    });
  }
};

// @desc    Cancel a pending complaint (Soft-Delete)
// @route   DELETE /api/v1/complaints/:id
// @access  Private (Ordinary User)
const cancelComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

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
        message: 'Access denied. You can only cancel your own complaints.',
      });
    }

    // Verify current status allows cancellation
    if (!complaint.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Complaint cannot be cancelled as it is already being processed.',
      });
    }

    // Soft cancel by changing status
    complaint.status = 'Cancelled';
    await complaint.save();

    return res.status(200).json({
      success: true,
      data: { complaint },
      message: 'Complaint cancelled successfully.',
    });
  } catch (error) {
    console.error(`CancelComplaint Error: ${error.message}`);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during complaint cancellation.',
    });
  }
};

// @desc    Reopen a resolved complaint
// @route   PATCH /api/v1/complaints/:id/reopen
// @access  Private (Ordinary User)
const reopenComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Verify owner
    if (complaint.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only reopen complaints you created.',
      });
    }

    // Validate status is Resolved
    if (complaint.status !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Only resolved complaints can be reopened.',
      });
    }

    // Validate reopenCount limit
    if (complaint.reopenCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum reopen limit (3 times) reached for this complaint.',
      });
    }

    // Validate resolvedAt exists
    if (!complaint.resolvedAt) {
      return res.status(400).json({
        success: false,
        message: 'Resolved date not found on complaint record.',
      });
    }

    // Validate 7-day window
    const resolvedTime = new Date(complaint.resolvedAt).getTime();
    const timeLimit = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (Date.now() - resolvedTime > timeLimit) {
      return res.status(400).json({
        success: false,
        message: 'The 7-day window to reopen this complaint has expired.',
      });
    }

    // Store previous assigned agent before changing complaint
    const previousAgentId = complaint.assignedAgentId;

    // Apply updates to Complaint
    complaint.status = 'In Progress';
    complaint.reopenCount += 1;
    complaint.resolvedAt = null;
    await complaint.save();

    // Reactivate existing assignment for the same agent
    await AssignedComplaint.findOneAndUpdate(
      { complaintId: complaint._id },
      {
        status: 'Work Started',
        resolutionNotes: '',
        resolutionAttachments: [],
        resolvedAt: null,
        acceptedAt: new Date(),
        agentId: previousAgentId,
      },
      { new: true }
    );

    // Trigger Notification for the previously assigned agent
    if (previousAgentId) {
      const { createNotification } = require('../utils/notificationHelper');
      await createNotification({
        recipientId: previousAgentId,
        title: 'Complaint Reopened',
        message: `A resolved complaint you worked on ("${complaint.name}") has been reopened.`,
        relatedComplaintId: complaint._id,
        type: 'System'
      });
    }

    return res.status(200).json({
      success: true,
      data: { complaint },
      message: 'Complaint reopened successfully.',
    });
  } catch (error) {
    console.error(`ReopenComplaint Error: ${error.message}`);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while reopening complaint.',
    });
  }
};

// @desc    Admin rejects a complaint
// @route   PATCH /api/v1/complaints/:id/reject
// @access  Private (Admin Only)
const rejectComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Validate complaint is not Resolved
    if (complaint.status === 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject a resolved complaint.',
      });
    }

    // Update Complaint status and clear assignment
    complaint.status = 'Rejected';
    complaint.assignedAgentId = null;
    await complaint.save();

    // Also delete any existing AssignedComplaint record to keep sync
    await AssignedComplaint.deleteOne({ complaintId: complaint._id });

    return res.status(200).json({
      success: true,
      data: { complaint },
      message: 'Complaint rejected successfully.',
    });
  } catch (error) {
    console.error(`RejectComplaint Error: ${error.message}`);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during complaint rejection.',
    });
  }
};

const getComplaintsAdmin = async (req, res) => {
  try {
    const { status, unassigned } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }
    if (unassigned === 'true') {
      query.assignedAgentId = null;
    }

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: complaints,
      message: 'Complaints list retrieved successfully for administrator.',
    });
  } catch (error) {
    console.error(`GetComplaintsAdmin Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving complaints list for administrator.',
    });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  cancelComplaint,
  reopenComplaint,
  rejectComplaint,
  getComplaintsAdmin,
};
