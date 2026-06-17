const mongoose = require('mongoose');

const assignedComplaintSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: 'Complaint',
    },
    status: {
      type: String,
      required: true,
      enum: ['Technician Assigned', 'Work Started', 'Resolved'],
      default: 'Technician Assigned',
    },
    agentName: {
      type: String,
      required: true,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolutionAttachments: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 3;
        },
        message: 'Maximum 3 resolution attachments allowed.'
      }
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },

    acceptedAt: {
      type: Date,
    },

    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

assignedComplaintSchema.index({ agentId: 1 });
unique: true

module.exports = mongoose.model('AssignedComplaint', assignedComplaintSchema);
