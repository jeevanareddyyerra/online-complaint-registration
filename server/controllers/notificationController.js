const Notification = require('../models/Notification');

// @desc    Get all notifications for current user
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // limit to latest 50 notifications

    return res.status(200).json({
      success: true,
      data: { notifications },
      message: 'Notifications retrieved successfully.',
    });
  } catch (error) {
    console.error(`GetNotifications Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving notifications.',
    });
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/v1/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: { notification },
      message: 'Notification marked as read.',
    });
  } catch (error) {
    console.error(`MarkAsRead Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error marking notification as read.',
    });
  }
};

// @desc    Mark all notifications as read for current user
// @route   PATCH /api/v1/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    console.error(`MarkAllAsRead Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error marking all notifications as read.',
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
