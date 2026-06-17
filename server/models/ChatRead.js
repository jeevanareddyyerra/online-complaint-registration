const mongoose = require('mongoose');

const chatReadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Complaint',
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize search by user and complaint
chatReadSchema.index({ userId: 1, complaintId: 1 }, { unique: true });

module.exports = mongoose.model('ChatRead', chatReadSchema);
