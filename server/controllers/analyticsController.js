const Complaint = require('../models/Complaint');
const AssignedComplaint = require('../models/AssignedComplaint');
const Feedback = require('../models/Feedback');

// @desc    Get complaint volumes grouped by category and geographical region
// @route   GET /api/v1/admin/analytics/complaints
// @access  Private (Admin Only)
const getComplaintAnalytics = async (req, res) => {
  try {
    // 1. Group complaints by category
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

    // 2. Group complaints by city and state
    const regions = await Complaint.aggregate([
      {
        $group: {
          _id: { city: '$city', state: '$state' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          city: '$_id.city',
          state: '$_id.state',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        categories,
        regions,
      },
      message: 'Regional and category analytics loaded successfully.',
    });
  } catch (error) {
    console.error(`GetComplaintAnalytics Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving complaint analytics.',
    });
  }
};

// @desc    Get citizen feedback rating average and grade distributions
// @route   GET /api/v1/admin/analytics/feedback
// @access  Private (Admin Only)
const getFeedbackAnalytics = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $facet: {
          averageRating: [
            {
              $group: {
                _id: null,
                average: { $avg: '$rating' },
              },
            },
          ],
          distribution: [
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                rating: '$_id',
                count: 1,
                _id: 0,
              },
            },
            { $sort: { rating: -1 } },
          ],
        },
      },
    ]);

    const average =
      stats[0].averageRating[0] && stats[0].averageRating[0].average
        ? parseFloat(stats[0].averageRating[0].average.toFixed(2))
        : 0;

    const distribution = stats[0].distribution || [];

    return res.status(200).json({
      success: true,
      data: {
        average,
        distribution,
      },
      message: 'Feedback rating metrics loaded.',
    });
  } catch (error) {
    console.error(`GetFeedbackAnalytics Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving feedback analytics.',
    });
  }
};

// @desc    Get average resolution speed and monthly submission trends
// @route   GET /api/v1/admin/analytics/resolution-trends
// @access  Private (Admin Only)
const getResolutionTrends = async (req, res) => {
  try {
    // 1. Calculate Average Resolution Time in Days (resolvedAt - assignedAt)
    const avgTime = await AssignedComplaint.aggregate([
      {
        $match: { status: 'Resolved' },
      },
      {
        $group: {
          _id: null,
          avgDays: {
            $avg: {
              $divide: [{ $subtract: ['$resolvedAt', '$assignedAt'] }, 1000 * 60 * 60 * 24],
            },
          },
        },
      },
    ]);

    const avgResolutionTimeDays =
      avgTime[0] && avgTime[0].avgDays ? parseFloat(avgTime[0].avgDays.toFixed(2)) : 0;

    // 2. Calculate Monthly Complaint Trends (Past 12 Months)
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
        avgResolutionTimeDays,
        trends,
      },
      message: 'Resolution trends analysis loaded.',
    });
  } catch (error) {
    console.error(`GetResolutionTrends Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving resolution trends.',
    });
  }
};

module.exports = {
  getComplaintAnalytics,
  getFeedbackAnalytics,
  getResolutionTrends,
};
