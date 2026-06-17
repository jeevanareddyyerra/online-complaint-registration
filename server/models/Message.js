const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Complaint',
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: '',
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    attachmentName: {
      type: String,
      default: null,
    },
    attachmentType: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Define index optimized for complaint room logs sorted chronologically
messageSchema.index({ complaintId: 1, createdAt: -1 });

// Post-save hook to create chat notifications automatically
messageSchema.post('save', async function (doc) {
  try {
    const Complaint = mongoose.model('Complaint');
    const complaint = await Complaint.findById(doc.complaintId);
    if (!complaint) return;

    let recipientId = null;
    if (doc.senderId.toString() === complaint.userId.toString()) {
      // Sender is citizen, notify agent
      recipientId = complaint.assignedAgentId;
    } else {
      // Sender is agent (or admin), notify citizen
      recipientId = complaint.userId;
    }

    if (recipientId) {
      const { createNotification } = require('../utils/notificationHelper');
      const textPreview = doc.message ? doc.message.trim() : '';
      const messagePreview = textPreview 
        ? (textPreview.length > 60 ? `${textPreview.substring(0, 57)}...` : textPreview)
        : 'sent an attachment';

      await createNotification({
        recipientId,
        title: 'New Chat Message',
        message: `${doc.name}: "${messagePreview}"`,
        relatedComplaintId: doc.complaintId,
        type: 'System'
      });
    }
  } catch (err) {
    console.error('Error in message post-save notification hook:', err.message);
  }
});

module.exports = mongoose.model('Message', messageSchema);
