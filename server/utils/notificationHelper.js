const Notification = require('../models/Notification');

const createNotification = async ({ recipientId, title, message, relatedComplaintId, type = 'System' }) => {
  try {
    const notification = await Notification.create({
      recipientId,
      title,
      message,
      relatedComplaintId,
      type
    });

    // Try to emit via Socket.IO if initialized
    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      const userRoom = `user:${recipientId}`;
      io.to(userRoom).emit('notification', notification);
      console.log(`Notification emitted to room: ${userRoom}`);
    } catch (socketErr) {
      // Socket not initialized or user offline
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err.message);
    return null;
  }
};

module.exports = {
  createNotification
};
