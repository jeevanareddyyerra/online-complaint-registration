const AssignedComplaint = require('../models/AssignedComplaint');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// @desc    Assign a pending complaint to a field agent
// @route   POST /api/v1/assignments/assign
// @access  Private (Admin Only)
const assignComplaint = async (req, res) => {
  try {
    const { complaintId, agentId } = req.body;

    if (!complaintId || !agentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both complaintId and agentId.',
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

    // Prevent assigning cancelled, rejected, or closed complaints
    if (complaint.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign a cancelled complaint.',
      });
    }
    if (complaint.status === 'Rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign a rejected complaint.',
      });
    }
    if (complaint.status === 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign a closed complaint.',
      });
    }

    // Validate agent exists
    const agent = await User.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent user not found.',
      });
    }

    // Validate agent role
    if (agent.role !== 'Agent') {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not an Agent.',
      });
    }

    // Validate agent is approved
    if (!agent.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Agent account is awaiting admin approval and cannot be assigned tasks.',
      });
    }

    // Prevent duplicate assignment
    const existingAssignment = await AssignedComplaint.findOne({ complaintId });
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'This complaint is already assigned to an agent.',
      });
    }

    // Create AssignedComplaint document
    const assignment = await AssignedComplaint.create({
      complaintId,
      agentId,
      agentName: agent.name,
      status: 'Technician Assigned',
    });

    // Update Complaint status and assignedAgentId (using findByIdAndUpdate)
    await Complaint.findByIdAndUpdate(
      complaintId,
      {
        status: 'In Progress',
        assignedAgentId: agentId,
      },
      { new: true }
    );

    // Trigger Notification for the assigned agent
    const { createNotification } = require('../utils/notificationHelper');
    await createNotification({
      recipientId: agentId,
      title: 'New Complaint Assigned',
      message: `You have been assigned a new complaint: "${complaint.name}"`,
      relatedComplaintId: complaintId,
      type: 'System'
    });

    return res.status(201).json({
      success: true,
      data: { assignment },
      message: 'Complaint assigned successfully.',
    });
  } catch (error) {
    console.error(`AssignComplaint Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during complaint assignment.',
    });
  }
};

// @desc    Reassign an already assigned complaint to a different agent
// @route   PUT /api/v1/assignments/reassign
// @access  Private (Admin Only)
const reassignComplaint = async (req, res) => {
  try {
    const { complaintId, newAgentId } = req.body;

    if (!complaintId || !newAgentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both complaintId and newAgentId.',
      });
    }

    // Validate assignment exists
    const assignment = await AssignedComplaint.findOne({ complaintId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'No active assignment found for this complaint.',
      });
    }

    // Validate new agent exists
    const newAgent = await User.findById(newAgentId);
    if (!newAgent) {
      return res.status(404).json({
        success: false,
        message: 'New agent user not found.',
      });
    }

    // Validate new agent role
    if (newAgent.role !== 'Agent') {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not an Agent.',
      });
    }

    // Validate new agent is approved
    if (!newAgent.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'New agent account is not approved by admin.',
      });
    }

    // Update AssignedComplaint
    assignment.agentId = newAgentId;
    assignment.agentName = newAgent.name;
    assignment.status = 'Technician Assigned';
    await assignment.save();

    // Update Complaint.assignedAgentId
    await Complaint.findByIdAndUpdate(
      complaintId,
      {
        assignedAgentId: newAgentId,
      },
      { new: true }
    );

    // Trigger Notification for the newly assigned agent
    const complaintObj = await Complaint.findById(complaintId);
    const { createNotification } = require('../utils/notificationHelper');
    await createNotification({
      recipientId: newAgentId,
      title: 'New Complaint Assigned',
      message: `You have been assigned a new complaint: "${complaintObj ? complaintObj.name : 'assigned complaint'}"`,
      relatedComplaintId: complaintId,
      type: 'System'
    });

    return res.status(200).json({
      success: true,
      data: { assignment },
      message: 'Complaint reassigned successfully.',
    });
  } catch (error) {
    console.error(`ReassignComplaint Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during reassignment.',
    });
  }
};

// @desc    Agent accepts the assigned complaint
// @route   PATCH /api/v1/assignments/:id/accept
// @access  Private (Agent Only)
const acceptComplaint = async (req, res) => {
  try {
    const assignment = await AssignedComplaint.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment record not found.',
      });
    }

    // Verify logged-in agent matches the assignment
    if (assignment.agentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only accept tasks assigned to you.',
      });
    }
    if (assignment.status === 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'This complaint has already been resolved.',
      });
    }
    // Update assignment details
    assignment.status = 'Work Started';
    assignment.acceptedAt = Date.now();
    await assignment.save();

    return res.status(200).json({
      success: true,
      data: { assignment },
      message: 'Task accepted and work started.',
    });
  } catch (error) {
    console.error(`AcceptComplaint Error: ${error.message}`);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Assignment record not found.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while accepting complaint.',
    });
  }
};

// @desc    Agent resolves the complaint
// @route   PATCH /api/v1/assignments/:id/resolve
// @access  Private (Agent Only)
const resolveComplaint = async (req, res) => {
  try {
    const { resolutionNotes, resolutionAttachments } = req.body;

    // Validate resolutionNotes
    if (!resolutionNotes) {
      return res.status(400).json({
        success: false,
        message: 'Resolution notes are required.',
      });
    }

    // Validate attachments count limit (Max 3)
    if (resolutionAttachments && resolutionAttachments.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 3 resolution attachments are allowed.',
      });
    }

    const assignment = await AssignedComplaint.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment record not found.',
      });
    }
    if (assignment.status === 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'This complaint is already resolved.',
      });
    }
    // Verify logged-in agent matches the assignment
    if (assignment.agentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only resolve tasks assigned to you.',
      });
    }

    const now = Date.now();

    // Update AssignedComplaint
    assignment.status = 'Resolved';
    assignment.resolutionNotes = resolutionNotes;
    assignment.resolutionAttachments = resolutionAttachments || [];
    assignment.resolvedAt = now;
    await assignment.save();

    // Update Complaint
    const resolvedComplaint = await Complaint.findByIdAndUpdate(
      assignment.complaintId,
      {
        status: 'Resolved',
        resolvedAt: now,
      },
      { new: true }
    );

    // Trigger Notification for the citizen creator
    if (resolvedComplaint) {
      const { createNotification } = require('../utils/notificationHelper');
      await createNotification({
        recipientId: resolvedComplaint.userId,
        title: 'Complaint Resolved',
        message: `Your complaint "${resolvedComplaint.name}" has been marked as Resolved.`,
        relatedComplaintId: assignment.complaintId,
        type: 'System'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Complaint resolved successfully.',
    });
  } catch (error) {
    console.error(`ResolveComplaint Error: ${error.message}`);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Assignment record not found.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while resolving complaint.',
    });
  }
};

// @desc    Get all active tasks assigned to the logged-in agent
// @route   GET /api/v1/assignments/active-tasks
// @access  Private (Agent Only)
const getActiveTasks = async (req, res) => {
  try {
    const query = { agentId: req.user._id };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const assignments = await AssignedComplaint.find(query)
      .populate('complaintId')
      .sort({ assignedAt: -1 });

    return res.status(200).json({
      success: true,
      data: { assignments },
      message: 'Active assigned tasks list retrieved.',
    });
  } catch (error) {
    console.error(`GetActiveTasks Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving assigned tasks.',
    });
  }
};

module.exports = {
  assignComplaint,
  reassignComplaint,
  acceptComplaint,
  resolveComplaint,
  getActiveTasks,
};
