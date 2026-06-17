const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: [true, 'Complaint title/name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Municipal', 'Electricity', 'Police', 'Water Leakage', 'Other'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    pincode: {
      type: Number,
      required: [true, 'Pincode is required'],
    },
    comment: {
      type: String,
      required: [true, 'Comment/Description is required'],
    },
    attachments: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      required: true,
      enum: [
        'Pending',
        'In Progress',
        'Resolved',
        'Cancelled',
        'Rejected',
      ],
      default: 'Pending',
    },
    reopenCount: {
      type: Number,
      default: 0,
      max: 3,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
complaintSchema.pre('save', function (next) {
  if (this.isModified('city')) {
    this.city = this.city.trim().replace(/\b\w/g, c => c.toUpperCase());
  }

  if (this.isModified('state')) {
    this.state = this.state.trim().replace(/\b\w/g, c => c.toUpperCase());
  }

  next();
});
// Indexing frequently queried fields
complaintSchema.index({ status: 1 });
complaintSchema.index({ userId: 1 });
complaintSchema.index({ city: 1, pincode: 1 });
complaintSchema.methods.canBeEdited = function () {
  return this.status === 'Pending';
};

complaintSchema.methods.canBeCancelled = function () {
  return this.status === 'Pending';
};
module.exports = mongoose.model('Complaint', complaintSchema);