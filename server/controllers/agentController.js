const User = require('../models/User');

// @desc    Get all agents registered in the system
// @route   GET /api/v1/agents
// @access  Private (Admin Only)
const getAllAgents = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { role: 'Agent' };
    if (req.query.approved === 'true') {
      query.isApproved = true;
    } else if (req.query.approved === 'false') {
      query.isApproved = false;
    }

    const totalItems = await User.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const items = await User.find(query)
      .select('-password')
      .sort({ name: 1 }) // Sorted alphabetically by name is better for dropdown selection
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
      message: 'All registered agents retrieved successfully.',
    });
  } catch (error) {
    console.error(`GetAllAgents Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving agent list.',
    });
  }
};

// @desc    Approve/Verify a newly registered Agent account
// @route   PATCH /api/v1/agents/:id/approve
// @access  Private (Admin Only)
const approveAgent = async (req, res) => {
  try {
    const agent = await User.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent user not found.',
      });
    }

    // Validate role is Agent
    if (agent.role !== 'Agent') {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not an Agent.',
      });
    }

    // Set approval status
    agent.isApproved = true;
    await agent.save();

    return res.status(200).json({
      success: true,
      data: {
        agent: {
          _id: agent._id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          role: agent.role,
          isApproved: agent.isApproved,
        },
      },
      message: 'Agent account approved successfully.',
    });
  } catch (error) {
    console.error(`ApproveAgent Error: ${error.message}`);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Agent user not found.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during agent approval.',
    });
  }
};

// @desc    Revoke/Deapprove an Agent account
// @route   PATCH /api/v1/agents/:id/revoke
// @access  Private (Admin Only)
const revokeAgent = async (req, res) => {
  try {
    const agent = await User.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent user not found.',
      });
    }

    // Validate role is Agent
    if (agent.role !== 'Agent') {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not an Agent.',
      });
    }

    // Set approval status
    agent.isApproved = false;
    await agent.save();

    return res.status(200).json({
      success: true,
      data: {
        agent: {
          _id: agent._id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          role: agent.role,
          isApproved: agent.isApproved,
        },
      },
      message: 'Agent account approval status revoked successfully.',
    });
  } catch (error) {
    console.error(`RevokeAgent Error: ${error.message}`);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Agent user not found.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during agent status revocation.',
    });
  }
};

module.exports = {
  getAllAgents,
  approveAgent,
  revokeAgent,
};
