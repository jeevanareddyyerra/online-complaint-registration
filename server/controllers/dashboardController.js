const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AssignedComplaint = require('../models/AssignedComplaint');

// @desc    Get global overview counts
// @route   GET /api/v1/admin/dashboard/metrics
// @access  Private (Admin Only)
const getDashboardMetrics = async (req, res) => {
  try {
    // 1. Aggregate Complaint Statuses
    const statusCounts = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const complaintStats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
    };

    statusCounts.forEach((group) => {
      complaintStats.total += group.count;
      if (group._id === 'Pending') complaintStats.pending = group.count;
      if (group._id === 'In Progress') complaintStats.inProgress = group.count;
      if (group._id === 'Resolved') complaintStats.resolved = group.count;
      if (group._id === 'Rejected') complaintStats.rejected = group.count;
    });

    // 2. Aggregate User Roles & Approvals
    const userCounts = await User.aggregate([
      {
        $group: {
          _id: { role: '$role', isApproved: '$isApproved' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalUsers = 0;
    let totalCitizens = 0;
    const agentStats = {
      total: 0,
      approved: 0,
      unapproved: 0,
    };

    userCounts.forEach((group) => {
      totalUsers += group.count;
      if (group._id.role === 'Agent') {
        agentStats.total += group.count;
        if (group._id.isApproved) {
          agentStats.approved += group.count;
        } else {
          agentStats.unapproved += group.count;
        }
      } else if (group._id.role === 'Ordinary') {
        totalCitizens += group.count;
      }
    });

    const unassignedComplaints = await Complaint.countDocuments({
      status: 'Pending',
      assignedAgentId: null,
    });

    return res.status(200).json({
      success: true,
      data: {
        complaints: complaintStats,
        agents: agentStats,
        unassignedComplaints,
        totalCitizens,
        totalUsers,
      },
      message: 'Dashboard overview counters loaded successfully.',
    });
  } catch (error) {
    console.error(`GetDashboardMetrics Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard metrics.',
    });
  }
};

// @desc    Get chart analytics datasets (categories, statuses, trends)
// @route   GET /api/v1/admin/dashboard/analytics
// @access  Private (Admin Only)
const getChartAnalytics = async (req, res) => {
  try {
    // 1. Complaints by Category
    const categories = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 2. Complaints by Status
    const statuses = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // 3. Monthly Complaint Trends (Past 12 Months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const trends = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        categories,
        statuses,
        trends,
      },
      message: 'Dashboard chart analytics loaded.',
    });
  } catch (error) {
    console.error(`GetChartAnalytics Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving chart analytics.',
    });
  }
};

// @desc    Get agent work statistics and response efficiencies
// @route   GET /api/v1/admin/dashboard/agents-performance
// @access  Private (Admin Only)
const getAgentPerformance = async (req, res) => {
  try {
    const performance = await AssignedComplaint.aggregate([
      {
        $group: {
          _id: '$agentId',
          agentName: { $first: '$agentName' },
          totalAssigned: { $sum: 1 },
          totalResolved: {
            $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] },
          },
          avgResolutionTimeHrs: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'Resolved'] },
                { $divide: [{ $subtract: ['$resolvedAt', '$assignedAt'] }, 1000 * 60 * 60] },
                null,
              ],
            },
          },
        },
      },
      {
        $project: {
          agentId: '$_id',
          agentName: 1,
          totalAssigned: 1,
          totalResolved: 1,
          avgResolutionTimeHrs: { $ifNull: [{ $round: ['$avgResolutionTimeHrs', 2] }, 0] },
          _id: 0,
        },
      },
      { $sort: { totalResolved: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: { performance },
      message: 'Agent performance metrics retrieved.',
    });
  } catch (error) {
    console.error(`GetAgentPerformance Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving agent performance metrics.',
    });
  }
};

module.exports = {
  getDashboardMetrics,
  getChartAnalytics,
  getAgentPerformance,
};
